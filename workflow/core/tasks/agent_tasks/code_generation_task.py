from enum import IntEnum
from pydantic import Field
from typing import List, Dict
from workflow.core.data_structures import (
    MessageDict, TasksEndCodeRouting, NodeResponse, RoleTypes, MessageGenerators, FunctionParameters, ParameterDefinition
)
from workflow.core.tasks.agent_tasks.prompt_agent_task import PromptAgentTask

class LLMCodeGenExitCode(IntEnum):
    SUCCESS_WITH_CODE = 0    # Generated successfully with valid code blocks
    GENERATION_FAILED = 1    # Failed to generate response
    NO_CODE_BLOCKS = 2       # Generated but no valid code blocks found

class CodeExecExitCode(IntEnum):
    SUCCESS = 0             # Code executed successfully
    EXECUTION_ERROR = 1     # Code failed to execute (syntax/runtime error)
    VALIDATION_ERROR = 2    # Code executed but returned errors/failed tests

class CodeGenerationExitCode(IntEnum):
    SUCCESS = 0             # Code generated and executed successfully
    GENERATION_FAILED = 1   # Failed to generate code
    EXECUTION_FAILED = 2    # Code execution failed
    NO_CODE_BLOCKS = 3      # Generated response contained no valid code blocks

class CodeGenerationLLMTask(PromptAgentTask):
    """
    A specialized PromptAgentTask that focuses on generating and executing code through a two-node pattern.

    This task implements a focused subset of the PromptAgentTask pattern, using two nodes
    to handle code generation and execution. It's designed for scenarios where you need
    the LLM to generate and test code solutions.

    Node Structure:
    --------------
    1. llm_generation:
        - Generates code based on prompt
        - Validates code presence and structure
        - Exit codes:
            * SUCCESS_WITH_CODE (0): Valid code generated, proceed to execution
            * GENERATION_FAILED (1): Failed to generate code, retry
            * NO_CODE_BLOCKS (2): No valid code in response, retry

    2. code_execution:
        - Executes generated code
        - Validates outputs
        - Exit codes:
            * SUCCESS (0): Code executed successfully
            * EXECUTION_ERROR (1): Runtime/syntax error, return to generation
            * VALIDATION_ERROR (2): Failed tests/validation, return to generation

    Final Task Exit Codes:
    --------------------
    * SUCCESS (0): Code generated and executed successfully
    * GENERATION_FAILED (1): Could not generate valid code
    * EXECUTION_FAILED (2): Code execution failed
    * NO_CODE_BLOCKS (3): Generated response had no code

    Example:
    --------
    ```python
    task = CodeGenerationLLMTask(
        agent=agent_with_code_exec,
        task_name="generate_sort_function",
        task_description="Generate and test a sorting function",
        templates={
            "task_template": Prompt(
                content="Write a function that sorts a list: {{prompt}}"
            )
        }
    )
    ```
    """
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
                    type="string",
                    description="The input prompt for the task",
                    default=None
                ),
            },
            required=["prompt"]
        ),
        description="Inputs that the agent will require. Default is a 'prompt' string."
    )
    node_end_code_routing: TasksEndCodeRouting = Field(
        default={
            'llm_generation': {
                LLMCodeGenExitCode.SUCCESS_WITH_CODE: ('code_execution', False),
                LLMCodeGenExitCode.GENERATION_FAILED: ('llm_generation', True),
                LLMCodeGenExitCode.NO_CODE_BLOCKS: ('llm_generation', True)
            },
            'code_execution': {
                CodeExecExitCode.SUCCESS: (None, False),
                CodeExecExitCode.EXECUTION_ERROR: ('llm_generation', True),
                CodeExecExitCode.VALIDATION_ERROR: ('llm_generation', True)
            }
        },
        description="Node routing configuration based on exit codes"
    )
    exit_codes: Dict[int, str] = Field(
        default_factory=lambda: {
            CodeGenerationExitCode.SUCCESS: "Code generated and executed successfully",
            CodeGenerationExitCode.GENERATION_FAILED: "Generation failed",
            CodeGenerationExitCode.EXECUTION_FAILED: "Code execution failed",
            CodeGenerationExitCode.NO_CODE_BLOCKS: "No valid code blocks in response"
        },
        description="Exit code options and descriptions"
    )

    def get_llm_exit_code(self, message: MessageDict) -> LLMCodeGenExitCode:
        """
        Analyze LLM output to determine appropriate exit code based on content.
        
        Args:
            message: The LLM response to analyze
            
        Returns:
            LLMCodeGenExitCode indicating generation status and code presence
        """
        if not message or not message.content:
            return LLMCodeGenExitCode.GENERATION_FAILED
            
        code_blocks = self.agent.collect_code_blocks([message])
        if not code_blocks:
            return LLMCodeGenExitCode.NO_CODE_BLOCKS
            
        return LLMCodeGenExitCode.SUCCESS_WITH_CODE

    def create_message_list(self, **kwargs) -> List[MessageDict]:
        """
        Create message list including history from previous attempts if available.
        Extends parent implementation with code-generation specific retry context.
        
        Includes:
        1. Initial prompt from template
        2. Previous LLM responses
        3. Code execution results if any
        4. System messages for retry context
        """
        # Add initial prompt
        messages = super().create_message_list(**kwargs)
        execution_history: List[NodeResponse] = kwargs.get("execution_history", [])

        # Get last node if it exists
        last_node = next(
            (node for node in reversed(execution_history) 
            if node.parent_task_id == self.id),
            None
        )
        
        if last_node:
            if last_node.node_name == "llm_generation" and last_node.exit_code == LLMCodeGenExitCode.NO_CODE_BLOCKS:
                messages.append(MessageDict(
                    role=RoleTypes.USER,
                    generated_by=MessageGenerators.SYSTEM,
                    content="No valid code blocks were found in the response. Please answer with a valid code block, or respond with 'Terminate'"
                ))
            elif last_node.node_name == "code_execution" and last_node.exit_code != CodeExecExitCode.SUCCESS:
                messages.append(MessageDict(
                    role=RoleTypes.USER,
                    generated_by=MessageGenerators.SYSTEM,
                    content=f"The previous code execution failed. Please review the errors above and provide corrected code. \n\n{[str(code) for code in last_node.references.code_executions]}"
                ))
                
        return messages
    
    def map_final_exit_code(self, node_responses: List[NodeResponse]) -> int:
        """Maps node responses to final task exit codes:
        0: Code generated and executed successfully
        1: Generation failed
        2: Code execution failed
        3: No valid code blocks in response
        """
        # Get last node of each type
        last_code = next((node for node in reversed(node_responses) 
                        if node.node_name == "code_execution"), None)
        last_llm = next((node for node in reversed(node_responses) 
                        if node.node_name == "llm_generation"), None)
        
        # If we have code execution result, it's the final outcome
        if last_code:
            return 0 if last_code.exit_code == CodeExecExitCode.SUCCESS else 2
            
        # Otherwise, map LLM generation result
        if last_llm:
            if last_llm.exit_code == LLMCodeGenExitCode.GENERATION_FAILED:
                return 1
            elif last_llm.exit_code == LLMCodeGenExitCode.NO_CODE_BLOCKS:
                return 3
                
        # Default to generation failed if we can't determine
        return 1