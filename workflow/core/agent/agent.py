import json, re
from enum import Enum
from bson import ObjectId
from pydantic import Field, ConfigDict, BaseModel
from typing import Dict, Any, List, Optional, Tuple, Callable, Union
from workflow.core.data_structures import ToolFunction, ToolCall, ensure_tool_function
from workflow.core.api import APIManager
from workflow.core.data_structures import (
    TaskResponse, FileReference, ContentType, MessageDict, ApiType, ModelType, FileType, References, FileContentReference, EmbeddingChunk, AliceModel, Prompt, BaseDataStructure
    )
from workflow.util import LOGGER, run_code, LOG_LEVEL, Language
from enum import IntEnum

class ToolPermission(IntEnum):
    DISABLED = 0     # Tools cannot be used
    NORMAL = 1       # Tools can be used normally
    WITH_PERMISSION = 2  # Tools require user permission
    DRY_RUN = 3     # Tools can be called but not executed

class CodePermission(IntEnum):
    NORMAL = 1      # All valid code blocks are executed
    DISABLED = 0    # No code execution
    WITH_PERMISSION = 2  # Tools require user permission
    TAGGED_ONLY = 3 # Only blocks with _execute tag are executed

class AliceAgent(BaseDataStructure):
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
    has_tools: ToolPermission = Field(
        default=ToolPermission.DISABLED,
        description="Level of tool usage permission"
    )
    has_code_exec: CodePermission = Field(
        default=CodePermission.DISABLED,
        description="Level of code execution permission"
    )
    max_consecutive_auto_reply: int = Field(default=10, description="The maximum number of consecutive auto replies")

    @property
    def llm_model(self) -> AliceModel:
        return self.models[ModelType.CHAT] or self.models[ModelType.INSTRUCT]
    
    def model_dump(self, *args, **kwargs):
        """
        Serializes the AliceAgent instance to a dictionary, handling:
        1. BaseModel instances (system_message, models)
        2. Enum values (has_tools, has_code_exec, ModelType keys)
        3. Nested model dictionaries
        4. Remove api_engine if present
        """
        LOGGER.debug(f"AliceAgent.model_dump called")
        LOGGER.debug(f"Models dict type: {type(self.models)}")
        LOGGER.debug(f"Models dict keys type: {[(k, type(k)) for k in self.models.keys()]}")
        LOGGER.debug(f"Models dict values type: {[(k, type(v)) for k,v in self.models.items()]}")
        
        # Inspect the models dictionary more deeply
        for k, v in self.models.items():
            LOGGER.debug(f"Model key {k}: {type(k)}")
            if hasattr(k, '__dict__'):
                LOGGER.debug(f"Key dict type: {type(vars(k.__class__))}")
            if v and hasattr(v, '__dict__'):
                LOGGER.debug(f"Value dict type: {type(vars(v.__class__))}")
        try:
            data = super().model_dump(*args, **kwargs)
            LOGGER.debug(f"AliceAgent base dump succeeded")
        except TypeError as e:
            LOGGER.error(f"TypeError in AliceAgent model_dump: {str(e)}")
            LOGGER.error(f"Models state: {vars(self.models)}")
            raise
            
        # Handle system message (Prompt)
        if self.system_message and isinstance(self.system_message, BaseModel):
            data['system_message'] = self.system_message.model_dump(*args, **kwargs)
            
        # Handle models dictionary
        if self.models:
            data['models'] = {
                model_type.value if isinstance(model_type, Enum) else model_type: 
                (model.model_dump(*args, **kwargs) if isinstance(model, BaseModel) else model)
                for model_type, model in self.models.items()
            }
            
        # Handle permission enums
        if 'has_tools' in data:
            data['has_tools'] = int(self.has_tools)
            
        if 'has_code_exec' in data:
            data['has_code_exec'] = int(self.has_code_exec)
            
        # Remove api_engine if present
        data.pop('api_engine', None)
        
        return data
    
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

    def _prepare_system_message(self, **kwargs) -> str:
        """Prepare the system message with appropriate permission prompts."""
        base_message = self.system_message.format_prompt(**kwargs)
        code_prompt = self._get_code_exec_prompt()
        
        # Combine prompts, ensuring proper spacing
        prompts = [p for p in [base_message, code_prompt] if p]
        return "\n\n".join(prompts)
    
    async def generate_llm_response(self, api_manager: APIManager, messages: List[MessageDict], tools_list: List[ToolFunction] = [], **kwargs) -> MessageDict:
        LOGGER.info("Generating LLM response")
        chat_model = self.llm_model
        response_ref: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.LLM_MODEL,
            model=chat_model,
            messages=self._prepare_messages_for_api(messages),
            system=self._prepare_system_message(**kwargs),
            tool_choice='auto' if self.has_tools != 0 else 'none',
            tools=tools_list,
            temperature=0.7,
            max_tokens=4096  # TODO: Make this configurable
        )

        if not response_ref or not response_ref.messages[0]:
            raise ValueError("No response from API")

        response = response_ref.messages[0]
        content = response.content if response.content else "Using tools" if response.tool_calls else "No response from API"
        
        return MessageDict(
            role="assistant",
            content=content,
            generated_by="llm",
            tool_calls=response.tool_calls if self.has_tools != 0 else None,
            type=ContentType.TEXT,
            assistant_name=self.name,
            creation_metadata=response.creation_metadata
        )
    
    def collect_code_blocs(self, messages: List[MessageDict]) -> List[Tuple[str, str]]:
        """Collect and filter code blocks based on permission level."""
        LOGGER.debug(f"Entering collect_code_blocs with {len(messages)} messages")
        code_blocks: List[Tuple[str, str]] = []
        
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
                    if lang.endswith('_execute'):
                        # Strip _execute and add to blocks
                        base_lang = lang.replace('_execute', '')
                        code_blocks.append((base_lang, code))
                elif self.has_code_exec == CodePermission.NORMAL:
                    code_blocks.append((lang, code))
                    
        LOGGER.debug(f"Collected {len(code_blocks)} code blocks")
        return code_blocks

    async def process_code_execution(self, messages: List[MessageDict]) -> Tuple[List[MessageDict], Dict, int]:
        """Process code execution based on permission level."""
        if self.has_code_exec == CodePermission.DISABLED:
            return [], {}, 0
            
        code_blocks = self.collect_code_blocs(messages)
        if not code_blocks:
            LOGGER.warning('No executable code blocks found')
            return [], {}, 0

        # Group code blocks by language
        code_by_lang = {}
        for lang, code in code_blocks:
            if lang not in code_by_lang:
                code_by_lang[lang] = []
            code_by_lang[lang].append(code)

        executed_messages = []
        exit_code = 0
        
        for lang, codes in code_by_lang.items():
            # Merge code blocks for each language
            merged_code = "\n\n".join(codes)
            current_exit_code, logs = self._execute_code_in_docker(merged_code, lang)
            exit_code = current_exit_code if current_exit_code != 0 else exit_code
            
            executed_messages.append(MessageDict(
                role="tool",
                content=f"Language: {lang}\nExit Code: {current_exit_code}\nOutput:\n{logs}",
                generated_by="tool",
                step="code_execution",
                type=ContentType.TEXT,
                references=References(string_outputs=[merged_code, lang])
            ))
            
        return executed_messages, code_by_lang, exit_code

    async def process_tool_calls(self, tool_calls: List[ToolCall] = [], tool_map: Dict[str, Callable] = {}, tools_list: List[ToolFunction] = []) -> List[MessageDict]:
        """Process tool calls based on permission level."""
        if self.has_tools == ToolPermission.DISABLED:
            return []
            
        tool_messages: List[MessageDict] = []
        
        for tool_call in tool_calls:
            tool_call_id = tool_call.id
            function_name = tool_call.function.name
            arguments_str = tool_call.function.arguments
            
            try:
                arguments = json.loads(arguments_str)
            except json.JSONDecodeError:
                error_msg = f"Error decoding JSON arguments: {arguments_str}"
                tool_messages.append(self._create_tool_error_message(error_msg, function_name))
                continue

            if function_name not in tool_map:
                tool_messages.append(self._create_tool_error_message(f"Tool '{function_name}' not found", function_name))
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
                    role="tool",
                    content=f"DRY RUN: Would execute {function_name} with arguments: {json.dumps(arguments, indent=2)}",
                    generated_by="tool",
                    step=function_name,
                    tool_call_id=tool_call_id,
                    type=ContentType.TEXT
                ))
                continue
            
            # Execute tool
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
                tool_messages.append(self._create_tool_error_message(f"Error executing tool '{function_name}': {str(e)}", function_name))
        
        return tool_messages

    def _create_tool_error_message(self, error_msg: str, function_name: str) -> MessageDict:
        """Helper method to create consistent tool error messages."""
        return MessageDict(
            role="tool",
            content=error_msg,
            generated_by="tool",
            step=function_name,
            type=ContentType.TEXT
        )

    def _validate_tool_inputs(self, tool_function: ToolFunction, arguments: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Validate tool inputs against their schema."""
        required_params = tool_function.function.parameters.required
        properties = tool_function.function.parameters.properties

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

    def _execute_code_in_docker(self, code: str, lang: str) -> Tuple[int, str]:
        """Execute code in Docker container."""
        if not code or not lang:
            return 1, "Invalid code or language"
        LOGGER.info(f"Executing code in {lang} - Code: \n{code}")
        try:
            logs, exit_code = run_code(code, lang, log_level=LOG_LEVEL)
            return exit_code, logs
        except Exception as e:
            LOGGER.error(f"Error executing code: {e}")
            return 1, str(e)

    def _prepare_messages_for_api(self, messages: List[MessageDict]) -> List[Dict[str, Any]]:
        """Prepare messages for the API call."""
        return [self._convert_message_dict_to_api_format(msg) for msg in messages]

    def _convert_message_dict_to_api_format(self, message: MessageDict) -> Dict[str, Any]:
        """Convert a MessageDict to the API format."""
        api_message = {
            "role": message.role,
            "content": message.content
        }
        if message.tool_calls:
            api_message["tool_calls"] = [tool_call.model_dump() for tool_call in message.tool_calls]
        if message.tool_call_id:
            api_message["tool_call_id"] = str(message.tool_call_id)
        return api_message
    
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

    async def generate_image(self, api_manager: APIManager, prompt: str, n: int = 1, size: str = "1024x1024", quality: str = "standard") -> List[FileContentReference]:
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
            raise ValueError(f"No image generated by the API. Refs provided:\n{refs.detailed_summary()}")
        return refs.files
    
    async def generate_speech(self, api_manager: APIManager, input: str, voice: str, speed: float = 1.0) -> List[FileContentReference]:
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
        return refs.files
    
    async def generate_embeddings(self, api_manager: APIManager, input: Union[str, List[str]], language: Optional[Language]) -> List[EmbeddingChunk]:
        embeddings_model = self.models[ModelType.EMBEDDINGS] or api_manager.get_api_by_type(ApiType.EMBEDDINGS).default_model
        if not embeddings_model:
            raise ValueError("No embeddings model available for the agent or in the API manager")
        
        refs: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.EMBEDDINGS,
            model=embeddings_model,
            input=input,
            language=language
        )
        if not refs.embeddings or not refs.embeddings[0]:
            raise ValueError("No embeddings generated by the API")
        return refs.embeddings

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
