import re
from enum import IntEnum
from typing import List, Tuple
from pydantic import Field, BaseModel
from workflow.core.data_structures import (
    MessageDict, CodeBlock, CodeExecution, CodeOutput, get_run_commands
)
from workflow.util import LOGGER, LOG_LEVEL, get_language_matching, Language, DockerCodeRunner

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
    execution_languages: List[Language] = Field(default=[Language.PYTHON, Language.SHELL, Language.JAVASCRIPT, Language.TYPESCRIPT], description="Languages available for code execution")

    # TODO: These prompts should be adjustable by the user. However, a similar example is tool calls, where the prompt 
    # is decided by the llm provider, so this can be considered a similar case. 
    def _get_code_exec_prompt(self) -> str:
        """Generate the appropriate code execution prompt based on permission level."""
        available_languages: str = ", ".join([lang.value for lang in self.execution_languages])
        if self.has_code_exec == CodePermission.NORMAL:
            return f"""
You have full access to code execution. Any code blocks you provide will be automatically executed.
Please ensure that whenever you add a code block, you understand it will be executed immediately.
Only provide code that is safe and appropriate to run. Available languages: {available_languages}

Example of providing executable code:
```python
print("This will be executed automatically")
```
If you need to install packages, please provide the necessary setup commands in shell blocks.
"""
        elif self.has_code_exec == CodePermission.TAGGED_ONLY:
            return f"""
You have access to code execution, but it requires explicit marking. 
This allows you to control which code blocks are executed, and which are for demonstration only.
To execute code, add '_execute' to your code block's language tag.
Only code blocks marked with '_execute' will be executed. Available languages: {available_languages}

Example of providing executable code:
```python_execute
print("This will be executed")
```

Example of non-executable code:
```python
print("This is just for demonstration")
```
If you need to install packages, please provide the necessary setup commands in shell blocks with the required _execute tag.
"""
        return ""

    def collect_code_blocks(self, messages: List[MessageDict]) -> List[CodeBlock]:
        """
        Extract and filter code blocks from messages based on permission level.
        
        Args:
            messages: List of messages that may contain code blocks
            
        Returns:
            List of CodeBlocks retrieved from the message's content
            
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
                        if final_lang not in self.execution_languages:
                            LOGGER.error(f"Unsupported language: {final_lang}")
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
                        if final_lang not in self.execution_languages:
                            LOGGER.error(f"Unsupported language: {final_lang}")
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
        """            
        code_blocks = self.collect_code_blocks(messages)
        if not code_blocks:
            LOGGER.warning('No executable code blocks found')
            return [], 0

        # Get processed run commands
        run_commands = get_run_commands(code_blocks)
        
        code_executions: List[CodeExecution] = []
        exit_code = 0
        runner = DockerCodeRunner(log_level=LOG_LEVEL)
        for code, language, setup in run_commands:
            code_block = CodeBlock(code=code, language=language, setup_commands=setup)
            try:
                logs, current_exit_code = await runner.run(code, language, setup)

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
            except Exception as e:
                LOGGER.error(f"Error executing code: {e}")
                code_executions.append(
                    CodeExecution(
                        code_block=code_block,
                        code_output=CodeOutput(
                            output=str(e),
                            exit_code=1
                        )
                    )
                )
                
        return code_executions, exit_code