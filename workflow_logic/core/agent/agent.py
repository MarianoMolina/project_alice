import docker, os, tempfile
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Any, List, Optional, Tuple, Callable
from workflow_logic.core.parameters import ToolFunction
from workflow_logic.core.prompt import Prompt
from workflow_logic.core.model import AliceModel
from workflow_logic.core.api import APIManager, ApiType
from workflow_logic.util import MessageDict, LOGGER


class AliceAgent(BaseModel):
    id: Optional[str] = Field(default=None, description="The ID of the agent", alias="_id")
    name: str = Field(..., description="The name of the agent")
    system_message: Prompt = Field(default=Prompt(name="default", content="You are an AI assistant"), description="The prompt to use for system message")
    model_id: Optional[AliceModel] = Field(None, description="The model associated with the agent")
    has_functions: bool = Field(default=False, description="Whether the agent can use functions")
    has_code_exec: bool = Field(default=False, description="Whether the agent can execute code")
    max_consecutive_auto_reply: int = Field(default=10, description="The maximum number of consecutive auto replies")
    model_config = ConfigDict(protected_namespaces=(), json_encoders = {ObjectId: str})

    async def generate_response(self, api_manager: APIManager, messages: List[MessageDict], tool_map: Dict[str, Callable] = {}, tools_list: List[ToolFunction] = []) -> List[MessageDict]:
        try:
            LOGGER.debug(f"Agent Calling generate_response_with_api_engine with: api_type={ApiType.LLM_MODEL}, model={self.model_id}")
            api_messages = self._prepare_messages_for_api(messages)
            
            response: MessageDict = await api_manager.generate_response_with_api_engine(
                api_type=ApiType.LLM_MODEL,
                model=self.model_id,
                messages=api_messages,
                system=self.system_message.format_prompt(),
                tool_choice='auto' if self.has_functions else 'none',
                tools=tools_list,
                temperature=0.7,
                max_tokens=1000
            )
            
            new_messages = []
            content = response['content']
            tool_calls = response['tool_calls'] if self.has_functions else None
            
            if tool_calls:
                new_messages.extend(await self._process_tool_calls(tool_calls, tool_map, tools_list))
            
            if self.has_code_exec:
                code_messages = await self._process_code_execution(content)
                if code_messages:
                    new_messages.extend(code_messages)
            
            if new_messages:
                follow_up_response = await self.generate_response(api_manager, messages + new_messages, tool_map, tools_list)
                new_messages.extend(follow_up_response)
            else:
                new_messages.append(MessageDict(
                    role="assistant",
                    content=content,
                    generated_by="llm",
                    type="text",
                    assistant_name=self.name
                ))
            
            return new_messages

        except Exception as e:
            LOGGER.error(f"Error generating response: {str(e)}")
            raise

    async def _process_tool_calls(self, tool_calls: List[Dict[str, Any]], tool_map: Dict[str, Callable], tools_list: List[ToolFunction]) -> List[MessageDict]:
        tool_messages = []
        for tool_call in tool_calls:
            function_name = tool_call["function"]["name"]
            arguments = tool_call["function"]["arguments"]
            
            if function_name not in tool_map:
                tool_messages.append(MessageDict(
                    role="tool",
                    content=f"Error: Tool '{function_name}' not found",
                    generated_by="tool",
                    step=function_name,
                    type="text"
                ))
                continue
            
            tool_function = next((tool for tool in tools_list if tool.function.name == function_name), None)
            if not tool_function:
                tool_messages.append(MessageDict(
                    role="tool",
                    content=f"Error: Tool function '{function_name}' not found in tools list",
                    generated_by="tool",
                    step=function_name,
                    type="text"
                ))
                continue
            
            # Validate inputs
            valid_inputs, error_message = self._validate_tool_inputs(tool_function, arguments)
            if not valid_inputs:
                tool_messages.append(MessageDict(
                    role="tool",
                    content=f"Error in tool '{function_name}': {error_message}",
                    generated_by="tool",
                    step=function_name,
                    type="text"
                ))
                continue
            
            # Execute the AliceTask
            try:
                result = await tool_map[function_name](**arguments)
                tool_messages.append(MessageDict(
                    role="tool",
                    content=str(result),
                    generated_by="tool",
                    step=function_name,
                    task_responses=[result],
                    type="text"
                ))
            except Exception as e:
                tool_messages.append(MessageDict(
                    role="tool",
                    content=f"Error executing tool '{function_name}': {str(e)}",
                    generated_by="tool",
                    step=function_name,
                    type="text"
                ))
        
        return tool_messages

    def _validate_tool_inputs(self, tool_function: ToolFunction, arguments: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        required_params = tool_function.function.parameters.required
        properties = tool_function.function.parameters.properties

        for param in required_params:
            if param not in arguments:
                return False, f"Missing required parameter: {param}"

        for param, value in arguments.items():
            if param not in properties:
                return False, f"Unexpected parameter: {param}"
            
            expected_type = properties[param].type
            if not isinstance(value, eval(expected_type)):
                return False, f"Invalid type for parameter '{param}'. Expected {expected_type}, got {type(value).__name__}"

        return True, None

    async def _process_code_execution(self, content: str) -> List[MessageDict]:
        code_blocks = self._extract_code_blocks(content)
        if not code_blocks:
            return []

        executed_messages = []
        for lang, code in code_blocks:
            exit_code, logs, _ = self._execute_code_in_docker(code, lang)
            executed_messages.append(MessageDict(
                role="tool",
                content=f"Exit Code: {exit_code}\nOutput:\n{logs}",
                generated_by="tool",
                step="code_execution",
                type="text"
            ))
        return executed_messages

    def _extract_code_blocks(self, content: str) -> List[Tuple[str, str]]:
        code_blocks = []
        lines = content.split('\n')
        in_code_block = False
        current_block = []
        current_language = ""

        for line in lines:
            if line.startswith('```'):
                if in_code_block:
                    code_blocks.append((current_language, '\n'.join(current_block)))
                    current_block = []
                    in_code_block = False
                else:
                    in_code_block = True
                    current_language = line[3:].strip()
            elif in_code_block:
                current_block.append(line)

        return code_blocks

    def _execute_code_in_docker(self, code: str, lang: str) -> Tuple[int, str, Optional[str]]:
        client = docker.from_env()
        
        with tempfile.NamedTemporaryFile(mode='w', suffix=f'.{lang}', delete=False) as temp_file:
            temp_file.write(code)
            temp_file_path = temp_file.name

        try:
            image = "python:3-slim" if lang.startswith("python") else "ubuntu:latest"
            
            cmd = ["python", f"/code/{os.path.basename(temp_file_path)}"] if lang.startswith("python") else ["sh", "-c", f"chmod +x /code/{os.path.basename(temp_file_path)} && /code/{os.path.basename(temp_file_path)}"]
            
            container = client.containers.run(
                image,
                command=cmd,
                volumes={os.path.dirname(temp_file_path): {'bind': '/code', 'mode': 'ro'}},
                detach=True
            )

            exit_code = container.wait()['StatusCode']
            logs = container.logs().decode('utf-8')

            return exit_code, logs, image
        
        finally:
            os.unlink(temp_file_path)
            if 'container' in locals():
                container.remove()

    def _prepare_messages_for_api(self, messages: List[MessageDict]) -> List[Dict[str, Any]]:
        """Prepare messages for the API call, including the system message."""
        return [self._convert_message_dict_to_api_format(msg) for msg in messages]

    def _convert_message_dict_to_api_format(self, message: MessageDict) -> Dict[str, Any]:
        """Convert a MessageDict to the format expected by the API."""
        api_message = {
            "role": message["role"],
            "content": message["content"]
        }
        if message.get("tool_calls"):
            api_message["tool_calls"] = message["tool_calls"]
        if message.get("function_call"):
            api_message["function_call"] = message["function_call"]
        return api_message

    async def chat(self, api_manager: APIManager, initial_message: str, max_turns: int = 1, tool_map: Dict[str, Callable] = {}, tools_list: List[ToolFunction] = []) -> List[MessageDict]:
        messages = [MessageDict(role="user", content=initial_message)]
        
        for _ in range(max_turns):
            new_messages = await self.generate_response(api_manager, messages, tool_map, tools_list)
            messages.extend(new_messages)
            
            if any("TERMINATE" in msg.content for msg in new_messages):
                break
        
        return messages