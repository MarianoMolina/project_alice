import docker, os, json, traceback, re
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Any, List, Optional, Tuple, Callable, Union
from workflow.core.data_structures import ToolFunction, ToolCall, ensure_tool_function
from workflow.core.prompt import Prompt
from workflow.core.model import AliceModel
from workflow.core.api import APIManager
from workflow.core.data_structures import TaskResponse, FileReference, ContentType, MessageDict, ApiType, ModelType, FileType, References, FileContentReference
from workflow.util import LOGGER, run_code, LOG_LEVEL

class AliceAgent(BaseModel):
    id: Optional[str] = Field(default=None, description="The ID of the agent", alias="_id")
    name: str = Field(..., description="The name of the agent")
    system_message: Prompt = Field(default=Prompt(name="default", content="You are an AI assistant"), description="The prompt to use for system message")
    models: Dict[ModelType, Optional[AliceModel]] = Field(
        default={
            ModelType.CHAT: None,
            ModelType.INSTRUCT: None,
            ModelType.VISION: None,
            ModelType.IMG_GEN: None,
            ModelType.STT: None,
            ModelType.TTS: None,
            ModelType.EMBEDDINGS: None
        },
        description="Dictionary of models associated with the agent for different tasks"
    )
    has_functions: bool = Field(default=False, description="Whether the agent can use functions")
    has_code_exec: bool = Field(default=False, description="Whether the agent can execute code")
    max_consecutive_auto_reply: int = Field(default=10, description="The maximum number of consecutive auto replies")
    model_config = ConfigDict(protected_namespaces=(), json_encoders = {ObjectId: str})

    @property
    def llm_model(self) -> AliceModel:
        return self.models[ModelType.CHAT] or self.models[ModelType.INSTRUCT]

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

            LOGGER.info(f"Calling generate_response_with_api_engine")
            LOGGER.debug(f'Agent: {self.model_dump()}')
            chat_model = self.llm_model
            response_ref: References = await api_manager.generate_response_with_api_engine(
                api_type=ApiType.LLM_MODEL,
                model=chat_model,
                messages=self._prepare_messages_for_api(messages),
                system=self.system_message.format_prompt(),
                tool_choice='auto' if self.has_functions else 'none',
                tools=tools_list,
                temperature=0.7,
                max_tokens=4096 # TODO: Make this configurable
            )

            if not response_ref or not response_ref.messages[0]:
                LOGGER.error("No response from API")
                return [MessageDict(
                    role="assistant",
                    content="No response from API",
                    generated_by="llm",
                    type="text",
                    assistant_name=self.name
                )]
            
            response = response_ref.messages[0]
            LOGGER.debug(f"API response: {response.model_dump()}")
            
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
                type=ContentType.TEXT,
                assistant_name=self.name,
                creation_metadata=response.creation_metadata
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
        
    async def _process_tool_calls(self, tool_calls: List[ToolCall] = [], tool_map: Dict[str, Callable] = {}, tools_list: List[ToolFunction] = []) -> List[MessageDict]:
        tool_messages: List[MessageDict] = []
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
                task_result = result if isinstance(result, TaskResponse) else None
                tool_messages.append(MessageDict(
                    role="tool",
                    content=str(result),
                    generated_by="tool",
                    step=function_name,
                    tool_call_id=tool_call_id,
                    type=ContentType.TASK_RESULT if task_result else ContentType.TEXT,
                    references=References(task_responses=[task_result] if task_result else None),
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
        LOGGER.debug(f"Entering collect_code_blocs with {len(messages)} messages")
        code_blocs: List[Tuple[str, str]] = []
        for i, message in enumerate(messages):
            LOGGER.debug(f"Processing message {i+1}/{len(messages)}")
            if not isinstance(message, MessageDict):
                try:
                    message = MessageDict(**message)
                except Exception as e:
                    LOGGER.error(f"Error parsing message: {e}")
                    continue
            if message.content:
                LOGGER.debug(f"Message content length: {len(message.content)}")
                extracted_blocs = self._extract_code_blocs(message.content)
                LOGGER.debug(f"Extracted {len(extracted_blocs)} code blocs from message {i+1}")
                code_blocs.extend(extracted_blocs)
        LOGGER.debug(f"Total code blocs collected: {len(code_blocs)}")
        return code_blocs

    async def _process_code_execution(self, messages: List[MessageDict]) -> Tuple[List[MessageDict], Dict]:
        
        code_blocs = self.collect_code_blocs(messages)
        if not code_blocs:
            LOGGER.warning(f'No code blocs found')
            LOGGER.debug(f'Messages with no code blocks: {messages}')
            return [], {}

        # Group code blocs by language
        code_by_lang = {}
        for lang, code in code_blocs:
            if lang not in code_by_lang:
                code_by_lang[lang] = []
            code_by_lang[lang].append(code)

        executed_messages = []
        for lang, codes in code_by_lang.items():
            if not lang or not isinstance(lang, str) or not isinstance(code, str): pass
            # Merge code blocs for each language
            merged_code = "\n\n".join(codes)
            exit_code, logs = self._execute_code_in_docker(merged_code, lang)
            executed_messages.append(MessageDict(
                role="tool",
                content=f"Language: {lang}\nExit Code: {exit_code}\nOutput:\n{logs}",
                generated_by="tool",
                step="code_execution",
                type=ContentType.TEXT, 
                references=References(string_outputs=[merged_code, lang])
            ))
        return executed_messages, code_by_lang

    def _extract_code_blocs(self, content: str) -> List[Tuple[str, str]]:
        # Improved regex pattern
        pattern = r'```(\w*)[^\S\r\n]*\n?(.*?)```'
        matches = re.findall(pattern, content, re.DOTALL)
        
        code_blocs = []
        for lang, code in matches:
            language = lang.strip() or 'unknown'
            code = code.strip()
            if code and language != 'unknown':
                code_blocs.append((language, code))
        
        LOGGER.debug(f"Extracted {len(code_blocs)} code blocs")
        return code_blocs

    def _execute_code_in_docker(self, code: str, lang: str) -> Tuple[int, str]:
        if not code or not lang:
            return 1, "Invalid code or language"
        LOGGER.info(f"Executing code in {lang if lang else ''} - Code: \n{code}")
        try:
            logs, exit_code = run_code(code, lang, log_level=LOG_LEVEL)
            return exit_code, logs
        except Exception as e:
            LOGGER.error(f"Error executing code: {e}")
            return 1, str(e)

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
        all_messages = start_messages.copy()

        for turn in range(max_turns):
            try:
                new_messages = await self.generate_response(api_manager, all_messages, tool_map, tools_list, recursion_depth=turn)
                all_messages.extend(new_messages)
                gen_messages.extend(new_messages)
                
                if any("TERMINATE" in msg.content for msg in new_messages):
                    break
            except Exception as e:
                error_message = f"Error in agent chat occurred during turn {turn + 1}: {str(e)}"
                LOGGER.error(error_message)
                LOGGER.error(f"Traceback: {traceback.format_exc()}")
                
                # Create an error message
                error_msg = MessageDict(
                    role="assistant",
                    content=error_message,
                    generated_by="system",
                    type=ContentType.TEXT,
                    assistant_name=self.name
                )
                gen_messages.append(error_msg)                
                # Break the loop as an error occurred
                break
        
        return gen_messages, start_messages
    
    async def generate_vision_response(self, api_manager: APIManager, file_references: List[FileReference], prompt: str) -> MessageDict:
        vision_model = self.models[ModelType.VISION] or api_manager.get_api_by_type(ApiType.IMG_VISION).default_model
        if not vision_model:
            raise ValueError("No vision model available for the agent or in the API manager")
        
        refs: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.IMG_VISION,
            model=vision_model,
            file_references=file_references,
            prompt=prompt
        )
        if not refs or not refs.messages:
            raise ValueError("No response from the vision API")
        return refs.messages[0]

    async def generate_stt_response(self, api_manager: APIManager, file_reference: FileReference) -> MessageDict:
        stt_model = self.models[ModelType.STT] or api_manager.get_api_by_type(ApiType.SPEECH_TO_TEXT).default_model
        if not stt_model:
            raise ValueError("No speech-to-text model available for the agent or in the API manager")
        
        refs: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.SPEECH_TO_TEXT,
            model=stt_model,
            file_reference=file_reference
        )
        if not refs or not refs.messages:
            raise ValueError("No response from the speech-to-text API")
        return refs.messages[0]

    async def generate_image(self, api_manager: APIManager, prompt: str, n: int = 1, size: str = "1024x1024", quality: str = "standard") -> FileContentReference:
        img_gen_model = self.models[ModelType.IMG_GEN] or api_manager.get_api_by_type(ApiType.IMG_GENERATION).default_model
        if not img_gen_model:
            raise ValueError("No image generation model available for the agent or in the API manager")
        
        refs: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.IMG_GENERATION,
            model=img_gen_model,
            prompt=prompt,
            n=n,
            size=size,
            quality=quality
        )
        if not refs.files or not refs.files[0]:
            raise ValueError("No image generated by the API")
        return refs.files[0]
    
    async def generate_speech(self, api_manager: APIManager, input: str, voice: str = "nova", speed: float = 1.0) -> FileContentReference:
        tts_model = self.models[ModelType.TTS] or api_manager.get_api_by_type(ApiType.TEXT_TO_SPEECH).default_model
        if not tts_model:
            raise ValueError("No text-to-speech model available for the agent or in the API manager")
        
        refs: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.TEXT_TO_SPEECH,
            model=tts_model,
            input=input,
            voice=voice,
            speed=speed
        )
        if not refs.files or not refs.files[0]:
            raise ValueError("No speech generated by the API")
        return refs.files[0]
    
    async def generate_embeddings(self, api_manager: APIManager, input: Union[str, List[str]]) -> FileContentReference:
        embeddings_model = self.models[ModelType.EMBEDDINGS] or api_manager.get_api_by_type(ApiType.EMBEDDINGS).default_model
        if not embeddings_model:
            raise ValueError("No embeddings model available for the agent or in the API manager")
        
        refs: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.EMBEDDINGS,
            model=embeddings_model,
            input=input
        )
        if not refs.files or not refs.files[0]:
            raise ValueError("No embeddings generated by the API")
        return refs.files[0]

    def _prepare_messages_for_api(self, messages: List[MessageDict]) -> List[Dict[str, Any]]:
        prepared_messages = []
        for msg in messages:
            prepared_msg = {
                "role": msg.role,
                "content": str(msg)
            }
            
            # Include file content using the get_content_string method
            if msg.references and msg.references.files:
                file_contents = []
                for ref in msg.references.files:
                    try:
                        content = ref.get_content_string()
                        file_contents.append(f"File: {ref.filename}\nContent: {content}\n")
                    except Exception as e:
                        LOGGER.error(f"Error getting file content for {ref}: {str(e)}")
                
                if file_contents:
                    prepared_msg["content"] += "\n\nAttached Files:\n" + "\n".join(file_contents)
            
            if msg.tool_calls:
                prepared_msg["tool_calls"] = [tool_call.model_dump() for tool_call in msg.tool_calls]
            if msg.tool_call_id:
                prepared_msg["tool_call_id"] = str(msg.tool_call_id)
            
            prepared_messages.append(prepared_msg)
        
        return prepared_messages
    
    async def transcribe_file(self, file_ref: FileReference, api_manager: APIManager) -> MessageDict:
        """
        Transcribes the content of a non-text file.

        Args:
            file_ref (FileReference): The file reference to transcribe.
            api_manager (APIManager): The API manager to use for API calls.

        Returns:
            MessageDict: A message containing the transcript.

        Raises:
            ValueError: If the file type is not supported for transcription.
        """
        if file_ref.type == FileType.IMAGE:
            return await self.generate_vision_response(api_manager, [file_ref], "Describe this image in detail.")
        elif file_ref.type == FileType.AUDIO:
            return await self.generate_stt_response(api_manager, file_ref)
        else:
            raise ValueError(f"Transcription not supported for file type: {file_ref.type}")