from typing import Optional, List, Dict, Tuple
from pydantic import BaseModel, Field
from workflow.core.data_structures.base_models import Embeddable
from workflow.util import Language

class CodeBlock(BaseModel):
    """CodeBlock is a container for code snippets."""
    code: str = Field(..., description="The code snippet")
    language: Language = Field(..., description="The programming language used for the code")
    setup_commands: str = Field(None, description="Setup commands to run before main code")

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
        return f"{self.code_block}\n{self.code_output}" if self.code_output else str(self.code_block)

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
        bash_code = '\n'.join(blocks_by_lang[Language.SHELL])
        other_langs = [lang for lang in blocks_by_lang.keys() if lang != Language.SHELL]   
        for lang in other_langs:
            if _is_setup_command(bash_code, lang):
                is_setup = True
                result.append(get_run_command_for_single_language_code(blocks_by_lang[lang], lang, bash_code))
            else:
                result.append(get_run_command_for_single_language_code(blocks_by_lang[lang], lang, None))
        if not is_setup:
            result.append((('\n\n'.join(blocks_by_lang[Language.SHELL])), Language.SHELL, None))       
        return result
    # Default case: Process each language separately
    for lang, codes in blocks_by_lang.items():
        result.append(get_run_command_for_single_language_code(codes, lang, None))
    
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

def get_run_command_for_single_language_code(codes: List[str], languange: Language, setup_commands: Optional[str] = None) -> Tuple[str, Language, Optional[str]]:
    if languange in [Language.JAVASCRIPT, Language.TYPESCRIPT]:
        all_imports = []
        all_implementation = []
        for code in codes:
            imports, implementation = _split_js_code(code)
            all_imports.extend(imports)
            all_implementation.extend(implementation)
        unique_imports = list(dict.fromkeys(all_imports))
        final_code = '\n'.join(unique_imports + [''] + all_implementation)
        return (final_code, languange, setup_commands)
    else:
        return (('\n\n'.join(codes)), languange, setup_commands)
