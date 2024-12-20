import re
from pydantic import BaseModel, Field
from workflow.core.data_structures.base_models import Embeddable
from workflow.util import Language, LOGGER
from enum import Enum
from typing import List, Dict, Set, Tuple, Optional
from workflow.util import LOGGER

class CodeBlock(BaseModel):
    """CodeBlock is a container for code snippets."""
    code: str = Field(..., description="The code snippet")
    language: Language = Field(..., description="The programming language used for the code")
    setup_commands: Optional[str] = Field(None, description="Setup commands to run before main code")

    def __str__(self) -> str:
        setup = f"Setup Commands: {self.setup_commands}\n" if self.setup_commands else ""
        return f"Language: {self.language.value}, Code:\n{self.code}\n{setup}"

class CodeOutput(BaseModel):
    """CodeOutput is a container for code output details."""
    output: str = Field(..., description="The output of the code execution")
    exit_code: int = Field(..., description="The exit code of the code execution")

    def __str__(self) -> str:
        return f"Output:\n{self.output}\nExit Code: {self.exit_code}"

class CodeExecution(Embeddable):
    """CodeExecution is a container for code execution details."""
    code_block: CodeBlock = Field(..., description="The code block to be executed")
    code_output: Optional[CodeOutput] = Field(None, description="The output of the code execution")

    def __str__(self) -> str:
        str_start = f"Language: {self.code_block.language}\n"
        if self.code_block.setup_commands:
            str_start += f"Setup Commands:\n{self.code_block.setup_commands}\n"
        if self.code_output:
            return f"{str_start}Output:\n{self.code_output}"
        return str_start

def _is_setup_command(code: str, target_language: Language) -> bool:
    """Check if a bash code block contains setup commands for a target language"""
    if target_language == Language.PYTHON:
        return 'pip install' in code or 'pip3 install' in code
    elif target_language in [Language.JAVASCRIPT, Language.TYPESCRIPT]:
        return 'npm install' in code or 'yarn add' in code
    return False

def _split_js_code(code: str) -> Tuple[List[str], List[str]]:
    """Split JavaScript/TypeScript code into imports and implementation"""
    lines = code.split('\n')
    imports = []
    implementation = []
    
    for line in lines:
        stripped = line.strip()
        # Check for import statements or require
        if (stripped.startswith('import') or 
            'require(' in stripped) and not stripped.startswith('//'):
            imports.append(line)
        else:
            implementation.append(line)
            
    return imports, implementation

def get_run_commands(code_blocks: List[CodeBlock]) -> List[Tuple[str, Language, Optional[str]]]:
    """
    Process code blocks and return parameters for run_code calls.
    
    Args:
        code_blocks: List of CodeBlock objects to process
        
    Returns:
        List of tuples containing (code, language, setup_commands)
        
    Notes:
        - Handles bash setup commands for Python and JS/TS
        - Processes JS/TS import statements
        - Combines related code blocks appropriately
    """
    if not code_blocks:
        return []
        
    # Group blocks by language
    blocks_by_lang = group_by_language(code_blocks)
    
    result = []
    is_setup = False
    # Special case: Bash + Python/JS/TS
    if Language.SHELL in blocks_by_lang:
        bash_code = '\n'.join([code.code for code in blocks_by_lang[Language.SHELL]])
        other_langs = [lang for lang in blocks_by_lang.keys() if lang != Language.SHELL]   
        for lang in other_langs:
            if _is_setup_command(bash_code, lang):
                is_setup = True
                result.append(get_run_command_for_single_language_code(blocks_by_lang[lang], bash_code))
            else:
                result.append(get_run_command_for_single_language_code(blocks_by_lang[lang], None))
        if not is_setup:
            result.append((('\n\n'.join([code.code for code in blocks_by_lang[Language.SHELL]])), Language.SHELL, None))       
        return result
    # Default case: Process each language separately
    for lang, codes in blocks_by_lang.items():
        result.append(get_run_command_for_single_language_code(codes, None))
    
    return result

def group_by_language(code_blocks: List[CodeBlock]) -> Dict[Language, List[CodeBlock]]:
    """
    Group code blocks by language.
    
    Args:
        code_blocks: List of CodeBlock objects to group
        
    Returns:
        Dictionary mapping languages to lists of code blocks
    """
    code_groups: Dict[Language, List[CodeBlock]] = {}
    
    for code_block in code_blocks:
        if code_block.language not in code_groups:
            code_groups[code_block.language] = []
        code_groups[code_block.language].append(code_block)
    
    return code_groups

def get_run_command_for_single_language_code(codes: List[CodeBlock], setup_commands: Optional[str] = None) -> Tuple[str, Language, Optional[str]]:
    # Check all codeblocks have the same lang
    same_lang = all([code.language == codes[0].language for code in codes])
    if not same_lang:
        LOGGER.error(f"All code blocks must have the same language - {codes}")
        raise ValueError("All code blocks must have the same language")
    lang = codes[0].language
    if lang in [Language.JAVASCRIPT, Language.TYPESCRIPT]:
        (unique_imports, all_implementation) = process_js_imports([code.code for code in codes])
        LOGGER.debug(f"Unique imports: {unique_imports}")
        final_code = '\n'.join(unique_imports + [''] + all_implementation)
        return (final_code, lang, setup_commands)
    else:
        return (('\n\n'.join([code.code for code in codes])), lang, setup_commands)
    

class ImportType(Enum):
    ES6_DESTRUCTURE = "es6_destructure"    # import { x } from 'y'
    ES6_DEFAULT = "es6_default"            # import x from 'y'
    ES6_NAMESPACE = "es6_namespace"        # import * as x from 'y'
    REQUIRE = "require"                    # const x = require('y')
    REQUIRE_DESTRUCTURE = "require_destructure"  # const { x } = require('y')
    
class ParsedImport(BaseModel):
    """Represents a parsed import statement with its components"""
    source: str              # The module being imported from
    names: Set[str]         # The names being imported
    original_line: str      # The original import statement
    import_type: ImportType # The type of import
    is_default: bool = False  # Whether this is a default import
    namespace: Optional[str] = None  # For namespace imports

    class Config:
        arbitrary_types_allowed = True
        
class ImportParseError(Exception):
    """Custom exception for import parsing errors"""
    pass

def parse_imports(import_lines: List[str]) -> List[str]:
    """
    Parse and consolidate JavaScript/TypeScript import statements.
    
    Args:
        import_lines: List of import statement strings
        
    Returns:
        List of consolidated import statements
        
    Raises:
        ImportParseError: If imports can't be parsed or have conflicts
    """
    if not import_lines:
        return []

    # Initialize containers
    imports_by_source: Dict[str, ParsedImport] = {}
    import_names_to_source: Dict[str, str] = {}  # Track which module each name comes from
    
    # Regular expressions for different import types
    patterns = {
        ImportType.ES6_DESTRUCTURE: re.compile(r'import\s*{([^}]+)}\s*from\s*[\'"]([^\'"]+)[\'"]'),
        ImportType.ES6_DEFAULT: re.compile(r'import\s+([^\s{]+)\s+from\s*[\'"]([^\'"]+)[\'"]'),
        ImportType.ES6_NAMESPACE: re.compile(r'import\s*\*\s*as\s+([^\s]+)\s+from\s*[\'"]([^\'"]+)[\'"]'),
        ImportType.REQUIRE: re.compile(r'(?:const|let|var)\s+([^\s{]+)\s*=\s*require\s*\([\'"]([^\'"]+)[\'"]\)'),
        ImportType.REQUIRE_DESTRUCTURE: re.compile(r'(?:const|let|var)\s*{([^}]+)}\s*=\s*require\s*\([\'"]([^\'"]+)[\'"]\)')
    }
    
    for line in import_lines:
        line = line.strip()
        if not line:
            continue

        matched = False
        for import_type, pattern in patterns.items():
            match = pattern.match(line)
            if match:
                names_str, source = match.groups()
                
                if import_type in [ImportType.ES6_DEFAULT, ImportType.REQUIRE]:
                    names = {names_str.strip()}
                    is_default = True
                else:
                    names = {name.strip() for name in names_str.split(',')}
                    is_default = False
                    
                # Check for name conflicts
                for name in names:
                    if name in import_names_to_source:
                        existing_source = import_names_to_source[name]
                        if existing_source != source:
                            raise ImportParseError(
                                f"Name conflict: '{name}' is imported from both '{existing_source}' and '{source}'\n"
                                "Note: Could be improved by variable renaming in the future"
                            )
                    else:
                        import_names_to_source[name] = source
                
                # Group by source
                if source in imports_by_source:
                    existing_import = imports_by_source[source]
                    if existing_import.import_type != import_type:
                        # Allow mixing default and destructured imports from same source
                        if {existing_import.import_type, import_type} == {ImportType.ES6_DEFAULT, ImportType.ES6_DESTRUCTURE}:
                            existing_import.names.update(names)
                            existing_import.is_default = existing_import.is_default or is_default
                        else:
                            raise ImportParseError(
                                f"Mixed import types from same source: {source}\n"
                                f"Found {import_type.value} but already using {existing_import.import_type.value}"
                            )
                    else:
                        existing_import.names.update(names)
                else:
                    imports_by_source[source] = ParsedImport(
                        source=source,
                        names=names,
                        original_line=line,
                        import_type=import_type,
                        is_default=is_default
                    )
                
                matched = True
                break
                
        if not matched:
            raise ImportParseError(f"Unable to parse import statement: {line}")
    
    # Generate consolidated import statements
    consolidated_imports = []
    for source, parsed_import in sorted(imports_by_source.items()):
        if parsed_import.import_type in [ImportType.ES6_DEFAULT, ImportType.ES6_DESTRUCTURE]:
            default_import = None
            named_imports = set()
            
            for name in sorted(parsed_import.names):
                if parsed_import.is_default and default_import is None:
                    default_import = name
                else:
                    named_imports.add(name)
            
            if default_import and named_imports:
                consolidated_imports.append(
                    f"import {default_import}, {{ {', '.join(sorted(named_imports))} }} from '{source}'"
                )
            elif default_import:
                consolidated_imports.append(f"import {default_import} from '{source}'")
            else:
                consolidated_imports.append(f"import {{ {', '.join(sorted(named_imports))} }} from '{source}'")
        
        elif parsed_import.import_type == ImportType.ES6_NAMESPACE:
            consolidated_imports.append(f"import * as {next(iter(parsed_import.names))} from '{source}'")
        
        elif parsed_import.import_type == ImportType.REQUIRE:
            consolidated_imports.append(f"const {next(iter(parsed_import.names))} = require('{source}')")
        
        else:  # REQUIRE_DESTRUCTURE
            consolidated_imports.append(
                f"const {{ {', '.join(sorted(parsed_import.names))} }} = require('{source}')"
            )
            
    return consolidated_imports

def process_js_imports(code_blocks: List[str]) -> Tuple[List[str], List[str]]:
    """
    Process JavaScript/TypeScript code blocks to separate and consolidate imports.
    
    Args:
        code_blocks: List of code blocks to process
        
    Returns:
        Tuple of (consolidated import statements, implementation lines)
    """
    all_imports = []
    all_implementation = []
    
    for code in code_blocks:
        lines = code.strip().split('\n')
        imports = []
        implementation = []
        
        for line in lines:
            stripped = line.strip()
            if (stripped.startswith('import') or 'require(' in stripped) and not stripped.startswith('//'):
                imports.append(line)
            else:
                implementation.append(line)
                
        all_imports.extend(imports)
        all_implementation.extend(implementation)
        
    # Parse and consolidate imports
    try:
        consolidated_imports = parse_imports(all_imports)
    except ImportParseError as e:
        LOGGER.error(f"Error processing imports: {str(e)}")
        raise
        
    return consolidated_imports, all_implementation