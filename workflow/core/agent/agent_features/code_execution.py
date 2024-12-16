from enum import IntEnum
from typing import List, Tuple, Dict
from pydantic import Field, BaseModel
from workflow.core.data_structures import (
    MessageDict, CodeBlock, CodeExecution, CodeOutput
)
from workflow.util import LOGGER, run_code, LOG_LEVEL, Language, get_language_matching
import re

class CodePermission(IntEnum):
    NORMAL = 1      # All valid code blocks are executed
    DISABLED = 0    # No code execution
    WITH_PERMISSION = 2  # Tools require user permission
    TAGGED_ONLY = 3 # Only blocks with _execute tag are executed

class CodeExecutionAgent(BaseModel):
    """
    Base class providing code execution capabilities with configurable permissions and safety checks.
    
    This class can be inherited by other agents that need code execution capabilities.
    It provides:
    1. Code execution permission management
    2. Code block extraction and validation
    3. Safe code execution in containerized environments
    4. Structured output handling
    
    The agent supports different permission levels and can handle multiple programming
    languages, with special support for tagged execution mode.
    """
    has_code_exec: CodePermission = Field(
        default=CodePermission.DISABLED,
        description="Level of code execution permission"
    )

    def _get_code_exec_prompt(self) -> str:
        """Generate the appropriate code execution prompt based on permission level."""
        if self.has_code_exec == CodePermission.NORMAL:
            return """
You have full access to code execution. Any code blocks you provide will be automatically executed.
Please ensure that whenever you add a code block, you understand it will be executed immediately.
Only provide code that is safe and appropriate to run.

Example of providing executable code:
```python
print("This will be executed automatically")
```
"""
        elif self.has_code_exec == CodePermission.TAGGED_ONLY:
            return """
You have access to code execution, but it requires explicit marking.
To execute code, add '_execute' to your code block's language tag.
Only code blocks marked with '_execute' will be executed.

Example of providing executable code:
```python_execute
print("This will be executed")
```

Example of non-executable code:
```python
print("This is just for demonstration")
```
"""
        return ""

    def collect_code_blocks(self, messages: List[MessageDict]) -> List[CodeBlock]:
        """
        Extract and filter code blocks from messages based on permission level.
        
        Args:
            messages: List of messages that may contain code blocks
            
        Returns:
            List of validated CodeBlock objects ready for execution
            
        Notes:
            - Handles both normal and tagged execution modes
            - Validates language specifications
            - Filters based on permission level
        """
        LOGGER.debug(f"Collecting code blocks from {len(messages)} messages")
        code_blocks: List[CodeBlock] = []
        
        if self.has_code_exec == CodePermission.DISABLED:
            return code_blocks
            
        for message in messages:
            if not message.content:
                continue
                
            # Extract code blocks using regex
            pattern = r'```(\w*)[^\S\r\n]*\n?(.*?)```'
            matches = re.findall(pattern, message.content, re.DOTALL)
            
            for lang, code in matches:
                lang = lang.strip()
                code = code.strip()
                
                if not code or not lang:
                    continue
                    
                # Handle tagged execution mode
                if self.has_code_exec == CodePermission.TAGGED_ONLY:
                    if not lang.endswith('_execute'):
                        continue
                    # Strip _execute and validate language
                    base_lang = lang.replace('_execute', '')
                    try:
                        final_lang = get_language_matching(base_lang)
                        if not final_lang:
                            LOGGER.error(f"Invalid language tag: {lang} - {base_lang}")
                            continue
                    except ValueError:
                        LOGGER.error(f"Invalid language tag: {lang} - {base_lang}")
                        continue
                    code_blocks.append(CodeBlock(code=code, language=final_lang))
                elif self.has_code_exec == CodePermission.NORMAL:
                    try:
                        final_lang = get_language_matching(lang)
                        if not final_lang:
                            LOGGER.error(f"Invalid language tag: {lang}")
                            continue
                        code_blocks.append(CodeBlock(code=code, language=final_lang))
                    except ValueError:
                        LOGGER.error(f"Invalid language tag: {lang}")
                        continue
                    
        LOGGER.debug(f"Collected {len(code_blocks)} valid code blocks")
        return code_blocks

    async def process_code_execution(self, messages: List[MessageDict]) -> Tuple[List[CodeExecution], int]:
        """
        Process and execute code blocks found in messages.
        
        Args:
            messages: List of messages that may contain code blocks
        
        Returns:
            Tuple containing:
            - List of CodeExecution objects with results
            - Exit code indicating overall success/failure
            
        Notes:
            - Respects code execution permissions
            - Groups code blocks by language for efficient execution
            - Provides detailed execution results and logs
        """
        if self.has_code_exec == CodePermission.DISABLED:
            return [], 0
            
        code_blocks = self.collect_code_blocks(messages)
        if not code_blocks:
            LOGGER.warning('No executable code blocks found')
            return [], 0

        # Group code blocks by language
        code_by_lang: Dict[Language, List[str]] = {}
        for code_block in code_blocks:
            if code_block.language not in code_by_lang:
                code_by_lang[code_block.language] = []
            code_by_lang[code_block.language].append(code_block.code)

        code_executions: List[CodeExecution] = []
        exit_code = 0
        
        for lang, codes in code_by_lang.items():
            # Merge code blocks for each language
            merged_code = "\n\n".join(codes)
            code_block = CodeBlock(code=merged_code, language=lang)
            current_exit_code, logs = self._execute_code_in_docker(code_block)

            exit_code = current_exit_code if current_exit_code != 0 else exit_code
            code_executions.append(
                CodeExecution(
                    code_block=code_block,
                    code_output=CodeOutput(
                        output=logs,
                        exit_code=current_exit_code
                    )
                )
            )
            
        return code_executions, exit_code

    def _execute_code_in_docker(self, code_block: CodeBlock) -> Tuple[int, str]:
        """
        Execute code block in a Docker container.
        
        Args:
            code_block: CodeBlock containing code and language specification
            
        Returns:
            Tuple containing:
            - Exit code (0 for success, non-zero for failure)
            - Execution logs or error message
        """
        if not code_block:
            return 1, "Invalid code or language"
            
        LOGGER.info(f"Executing code in {code_block.language} - Code: \n{code_block.code}")
        try:
            logs, exit_code = run_code(code_block.code, code_block.language, log_level=LOG_LEVEL)
            return exit_code, logs
        except Exception as e:
            LOGGER.error(f"Error executing code: {e}")
            return 1, str(e)