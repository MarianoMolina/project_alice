import json
from pydantic import Field, BaseModel
from typing import Dict, List, Callable, Any, Optional, Tuple
from workflow.core.data_structures import (
    TaskResponse, ContentType, MessageDict,  References, RoleTypes, MessageGenerators,
    ToolFunction, ToolCall, ensure_tool_function
    )
from workflow.util import LOGGER, resolve_json_type, convert_value_to_type
from enum import IntEnum

class ToolPermission(IntEnum):
    DISABLED = 0     # Tools cannot be used
    NORMAL = 1       # Tools can be used normally
    WITH_PERMISSION = 2  # Tools require user permission
    DRY_RUN = 3     # Tools can be called but not executed

class ToolExecutionAgent(BaseModel):
    has_tools: ToolPermission = Field(
        default=ToolPermission.DISABLED,
        description="Level of tool usage permission"
    )

    async def process_tool_calls(self, tool_calls: List[ToolCall] = [], tool_map: Dict[str, Callable] = {}, tools_list: List[ToolFunction] = []) -> List[MessageDict]:
        """
        Process tool calls based on the agent's permission level.
        
        Executes or simulates tool calls based on the agent's configuration and creates
        appropriate message responses for each tool interaction.
        
        Args:
            tool_calls: List of tool calls to process
            tool_map: Dictionary mapping tool names to their implementations
            tools_list: List of available tool definitions
        
        Returns:
            List of MessageDict objects containing tool responses
        
        Notes:
            - Respects tool permission levels (DISABLED, NORMAL, WITH_PERMISSION, DRY_RUN)
            - Validates tool inputs against their schemas
            - Creates structured responses for all tool interactions
        """
        if self.has_tools == ToolPermission.DISABLED:
            return []
            
        tool_messages: List[MessageDict] = []
        
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            arguments_str = tool_call.function.arguments
            
            try:
                if not isinstance(arguments_str, dict):
                    LOGGER.debug(f"Decoding JSON arguments: {arguments_str}")
                    arguments = json.loads(arguments_str)
                else:
                    arguments = arguments_str
            except json.JSONDecodeError:
                error_msg = f"Error decoding JSON arguments: {arguments_str}"
                tool_messages.append(self._create_tool_error_message(error_msg, function_name))
                continue

            if function_name not in tool_map:
                tool_messages.append(self._create_tool_error_message(f"Tool '{function_name}' not found\nTool map: {tool_map}", function_name))
                continue
            
            tool_function = next((tool for tool in (ensure_tool_function(tool) for tool in tools_list) if tool.function.name == function_name), None)
            if not tool_function:
                tool_messages.append(self._create_tool_error_message(f"Tool function '{function_name}' not found in tools list", function_name))
                continue
            
            valid_inputs, error_message = self._validate_tool_inputs(ensure_tool_function(tool_function), arguments)
            if not valid_inputs:
                tool_messages.append(self._create_tool_error_message(f"Error in tool '{function_name}': {error_message}", function_name))
                continue
            
            # Handle dry run mode
            if self.has_tools == ToolPermission.DRY_RUN:
                tool_messages.append(MessageDict(
                    role=RoleTypes.TOOL,
                    content=f"DRY RUN: Would execute {function_name} with arguments: {json.dumps(arguments, indent=2)}",
                    generated_by=MessageGenerators.TOOL,
                    step=function_name,
                    type=ContentType.TEXT
                ))
                continue
            
            # Execute tool
            try:
                result = await tool_map[function_name](**arguments)
                task_result = result if isinstance(result, TaskResponse) else None
                tool_messages.append(MessageDict(
                    role=RoleTypes.TOOL,
                    content=str(result),
                    generated_by=MessageGenerators.TOOL,
                    step=function_name,
                    type=ContentType.TASK_RESULT if task_result else ContentType.TEXT,
                    references=References(task_responses=[task_result] if task_result else None),
                ))
            except Exception as e:
                tool_messages.append(self._create_tool_error_message(f"Error executing tool '{function_name}': {str(e)}", function_name))
        
        return tool_messages

    def _create_tool_error_message(self, error_msg: str, function_name: str) -> MessageDict:
        """Helper method to create consistent tool error messages."""
        return MessageDict(
            role=RoleTypes.TOOL,
            content=error_msg,
            generated_by=MessageGenerators.TOOL,
            step=function_name,
            type=ContentType.TEXT
        )
    

    def _validate_tool_inputs(self, tool_function: ToolFunction, arguments: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Validate tool inputs against their schema."""
        required_params = tool_function.function.parameters.required
        properties = tool_function.function.parameters.properties

        for param in required_params:
            if param not in arguments:
                return False, f"Missing required parameter: {param}"

        for param, value in arguments.items():
            if param not in properties:
                return False, f"Unexpected parameter: {param}"
            
            expected_type = properties[param].type
            python_type = resolve_json_type(expected_type)
            
            if python_type is None:
                return False, f"Unknown type '{expected_type}' for parameter '{param}'"
            
            if not isinstance(value, python_type):
                try: 
                    value = convert_value_to_type(value, param, expected_type)
                except (ValueError, TypeError) as e:
                    return False, f"Error converting value for parameter '{param}': expected {expected_type} {str(e)}"
                
        return True, None