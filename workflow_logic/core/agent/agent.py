import docker, os, tempfile, json, traceback
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Any, List, Optional, Tuple, Callable
from workflow_logic.core.parameters import ToolFunction, ToolCall
from workflow_logic.core.parameters.parameters import ensure_tool_function
from workflow_logic.core.prompt import Prompt
from workflow_logic.core.model import AliceModel
from workflow_logic.core.api import APIManager
from workflow_logic.core.data_structures import TaskResponse, DatabaseTaskResponse, FileReference, ContentType, MessageDict, ApiType
from workflow_logic.util import LOGGER

class AliceAgent(BaseModel):
    id: Optional[str] = Field(default=None, description="The ID of the agent", alias="_id")
    name: str = Field(..., description="The name of the agent")
    system_message: Prompt = Field(default=Prompt(name="default", content="You are an AI assistant"), description="The prompt to use for system message")
    model_id: Optional[AliceModel] = Field(None, description="The model associated with the agent")
    has_functions: bool = Field(default=False, description="Whether the agent can use functions")
    has_code_exec: bool = Field(default=False, description="Whether the agent can execute code")
    max_consecutive_auto_reply: int = Field(default=10, description="The maximum number of consecutive auto replies")
    model_config = ConfigDict(protected_namespaces=(), json_encoders = {ObjectId: str})

    async def generate_response(self, api_manager: APIManager, messages: List[MessageDict], tool_map: Dict[str, Callable] = {}, tools_list: List[ToolFunction] = [], recursion_depth: int = 0) -> List[MessageDict]:
        try:
            if recursion_depth >= self.max_consecutive_auto_reply:
                LOGGER.info("Max recursion depth reached")
                return [MessageDict(
                    role="assistant",
                    content="Maximum recursion depth reached. Terminating response generation.",
                    generated_by="llm",
                    type="text",
                    assistant_name=self.name
                )]
            if messages[-1].references:
                for ref in messages[-1].references:
                    if ref.type == ContentType.TASK_RESPONSE:
                        pass
                    if ref.type == ContentType.AUDIO:
                        audio_transcribe: MessageDict = await api_manager.generate_response_with_api_engine(
                            api_type=ApiType.SPEECH_TO_TEXT, 
                            file_reference=ref,
                        )
                        messages.extend(audio_transcribe)
                    if ref.type == ContentType.IMAGE:
                        img_describe: MessageDict = await api_manager.generate_response_with_api_engine(
                            api_type=ApiType.IMG_VISION, 
                            file_references=[ref], 
                        )
                        messages.extend(img_describe)
                    if ref.type == ContentType.FILE:
                        # Create logic to parse a text file into a string
                        pass
                    if ref.type == ContentType.VIDEO:
                        # Create logic for vtt
                        pass
                    if ref.type == ContentType.TEXT:
                        # msg = MessageDict(
                        #     role='user',
                        #     generated_by='tool',
                        #     content=ref.
                        # )
                        pass

            LOGGER.info(f"Calling generate_response_with_api_engine")
            LOGGER.debug(f'Agent: {self.model_dump()}')
            response: MessageDict = await api_manager.generate_response_with_api_engine(
                api_type=ApiType.LLM_MODEL,
                model=self.model_id,
                messages=self._prepare_messages_for_api(messages),
                system=self.system_message.format_prompt(),
                tool_choice='auto' if self.has_functions else 'none',
                tools=tools_list,
                temperature=0.7,
                max_tokens=1000
            )
            
            LOGGER.info(f"API response: {response}")
            
            new_messages = []
            content = response.content if response.content else "Using tools" if response.tool_calls else "No response from API"
            tool_calls = response.tool_calls if self.has_functions else None
            
            LOGGER.debug(f"Content: {content}")
            LOGGER.debug(f"Tool calls: {tool_calls}")
            
            new_messages.append(MessageDict(
                role="assistant",
                content=content,
                generated_by="llm",
                tool_calls=tool_calls,
                type="text",
                assistant_name=self.name
            ))

            if tool_calls and self.has_functions:
                LOGGER.debug("Processing tool calls")
                tool_messages = await self._process_tool_calls(tool_calls, tool_map, tools_list)
                if tool_messages:
                    new_messages.extend(tool_messages)
            
            if self.has_code_exec:
                LOGGER.debug("Processing code execution")
                code_messages, _ = await self._process_code_execution(new_messages)
                if code_messages:
                    new_messages.extend(code_messages)
            
            return new_messages

        except Exception as e:
            LOGGER.debug(f"Error in agent.generate_response: {str(e)}")
            LOGGER.debug(f"Traceback: {traceback.format_exc()}")
            LOGGER.error(f"Error in agent.generating response: {str(e)}")
            raise
        
    async def _process_tool_calls(self, tool_calls: List[ToolCall] = [], tool_map: Dict[str, Callable] = {}, tools_list: List[ToolFunction] = []):
        tool_messages = []
        for tool_call in tool_calls:
            tool_call_id = tool_call.id
            function_name = tool_call.function.name
            arguments_str = tool_call.function.arguments
            
            try:
                arguments = json.loads(arguments_str)
            except json.JSONDecodeError:
                error_msg = f"Error decoding JSON arguments: {arguments_str}"
                tool_messages.append(MessageDict(
                    role="tool",
                    content=error_msg,
                    generated_by="tool",
                    step=function_name,
                    type=ContentType.TEXT
                ))
                continue

            if function_name not in tool_map:
                tool_messages.append(MessageDict(
                    role="tool",
                    content=f"Error: Tool '{function_name}' not found",
                    generated_by="tool",
                    step=function_name,
                    type=ContentType.TEXT
                ))
                continue
            
            tool_function = next((tool for tool in (ensure_tool_function(tool) for tool in tools_list) if tool.function.name == function_name), None)
            if not tool_function:
                tool_messages.append(MessageDict(
                    role="tool",
                    content=f"Error: Tool function '{function_name}' not found in tools list",
                    generated_by="tool",
                    step=function_name,
                    type=ContentType.TEXT
                ))
                continue
            
            valid_inputs, error_message = self._validate_tool_inputs(ensure_tool_function(tool_function), arguments)
            if not valid_inputs:
                tool_messages.append(MessageDict(
                    role="tool",
                    content=f"Error in tool '{function_name}': {error_message}",
                    generated_by="tool",
                    step=function_name,
                    type=ContentType.TEXT
                ))
                continue
            
            try:
                result = await tool_map[function_name](**arguments)
                task_result = result if isinstance(result, TaskResponse) or isinstance(result, DatabaseTaskResponse) else None
                tool_messages.append(MessageDict(
                    role="tool",
                    content=str(result),
                    generated_by="tool",
                    step=function_name,
                    tool_call_id=tool_call_id,
                    type=ContentType.TASK_RESPONSE if task_result else ContentType.TEXT,
                    references=[FileReference(type=ContentType.TASK_RESPONSE, url=task_result.id)] if task_result else None,
                ))
            except Exception as e:
                tool_messages.append(MessageDict(
                    role="tool",
                    content=f"Error executing tool '{function_name}': {str(e)}",
                    generated_by="tool",
                    step=function_name,
                    type=ContentType.TEXT
                ))
        
        return tool_messages
    
    def _validate_tool_inputs(self, tool_function: ToolFunction, arguments: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        required_params = tool_function.function.parameters.required
        properties = tool_function.function.parameters.properties

        # Map string type names to Python types
        type_map = {
            "string": str,
            "integer": int,
            "number": float,
            "boolean": bool,
            "array": list,
            "object": dict
        }

        for param in required_params:
            if param not in arguments:
                return False, f"Missing required parameter: {param}"

        for param, value in arguments.items():
            if param not in properties:
                return False, f"Unexpected parameter: {param}"
            
            expected_type = properties[param].type
            python_type = type_map.get(expected_type)
            
            if python_type is None:
                return False, f"Unknown type '{expected_type}' for parameter '{param}'"
            
            if not isinstance(value, python_type):
                return False, f"Invalid type for parameter '{param}'. Expected {expected_type}, got {type(value).__name__}"

        return True, None
    
    def collect_code_blocs(self, messages: List[MessageDict]) -> List[Tuple[str, str]]:
        code_blocks: List[Tuple[str, str]] = []
        for message in messages:
            if not isinstance(message, MessageDict):
                try:
                    message = MessageDict(**message)
                except Exception as e:
                    LOGGER.error(f"Error parsing message: {e}")
                    continue
            if message.content:
                code_blocks.extend(self._extract_code_blocks(message.content))
        return code_blocks

    async def _process_code_execution(self, messages: List[MessageDict]) -> Tuple[List[MessageDict], Dict]:
        
        code_blocks = self.collect_code_blocs(messages)
        if not code_blocks:
            LOGGER.warning(f'No code blocks found')
            return [], {}

        # Group code blocks by language
        code_by_lang = {}
        for lang, code in code_blocks:
            if lang not in code_by_lang:
                code_by_lang[lang] = []
            code_by_lang[lang].append(code)

        executed_messages = []
        for lang, codes in code_by_lang.items():
            # Merge code blocks for each language
            merged_code = "\n\n".join(codes)
            exit_code, logs, _ = self._execute_code_in_docker(merged_code, lang)
            executed_messages.append(MessageDict(
                role="tool",
                content=f"Language: {lang}\nExit Code: {exit_code}\nOutput:\n{logs}",
                generated_by="tool",
                step="code_execution",
                type="text"
            ))
        return executed_messages, code_by_lang

    def _extract_code_blocks(self, content: str) -> List[Tuple[str, str]]:
        code_blocks = []
        lines = content.split('\n')
        in_code_block = False
        current_block = []
        current_language = ""

        for line in lines:
            if line.strip().startswith('```'):
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
        LOGGER.info(f"Executing code in {lang}:")
        LOGGER.info(code)
        
        client = docker.from_env()
        
        try:
            image = "python:3-slim" if lang.startswith("python") else "ubuntu:latest"
            
            # Create a Dockerfile
            dockerfile = f"""
            FROM {image}
            WORKDIR /app
            COPY code.{lang} .
            CMD ["python", "code.{lang}"] if "{lang}".startswith("python") else ["sh", "code.{lang}"]
            """
            
            # Create a build context
            with tempfile.TemporaryDirectory() as tmpdir:
                # Write the code to a file
                with open(os.path.join(tmpdir, f'code.{lang}'), 'w') as f:
                    f.write(code)
                
                # Write the Dockerfile
                with open(os.path.join(tmpdir, 'Dockerfile'), 'w') as f:
                    f.write(dockerfile)
                
                # Build the image
                image, _ = client.images.build(path=tmpdir, rm=True)
            
            # Run the container
            container = client.containers.run(image.id, detach=True)
            
            container.wait()
            logs = container.logs().decode('utf-8')
            exit_code = container.attrs['State']['ExitCode']

            LOGGER.info(f"Container exit code: {exit_code}")
            LOGGER.info(f"Container logs: {logs}")

            return exit_code, logs, image.id
        
        except docker.errors.DockerException as e:
            LOGGER.error(f"Docker error during execution: {str(e)}")
            return 1, str(e), None
        except Exception as e:
            LOGGER.error(f"Error during Docker execution: {str(e)}")
            return 1, str(e), None
        finally:
            if 'container' in locals():
                container.remove()
                
    def _prepare_messages_for_api(self, messages: List[MessageDict]) -> List[Dict[str, Any]]:
        """Prepare messages for the API call, including the system message."""
        return [self._convert_message_dict_to_api_format(msg) for msg in messages]

    def _convert_message_dict_to_api_format(self, message: MessageDict) -> Dict[str, Any]:
        """Convert a MessageDict to the format expected by the API."""
        api_message = {
            "role": message.role,
            "content": message.content
        }
        if message.tool_calls:
            api_message["tool_calls"] = [tool_call.model_dump() for tool_call in message.tool_calls]
        if message.tool_call_id:
            api_message["tool_call_id"] = str(message.tool_call_id)
        return api_message

    async def chat(self, api_manager: APIManager, messages: Optional[List[MessageDict]] = [], initial_message: Optional[str] = None, max_turns: int = 1, tool_map: Dict[str, Callable] = {}, tools_list: List[ToolFunction] = []) -> Tuple[List[MessageDict], List[MessageDict]]:
        start_messages = messages if messages else []
        gen_messages = []
        if initial_message:
            start_messages.append(MessageDict(role="user", content=initial_message))
        all_messages = start_messages
        for turn in range(max_turns):
            new_messages = await self.generate_response(api_manager, all_messages, tool_map, tools_list, recursion_depth=turn)
            all_messages.extend(new_messages)
            gen_messages.extend(new_messages)
            
            if any("TERMINATE" in msg.content for msg in new_messages):
                break
        
        return gen_messages, start_messages