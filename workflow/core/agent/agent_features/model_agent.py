from pydantic import Field, BaseModel
from typing import Dict, Any, List, Optional, Union
from workflow.core.api import APIManager
from workflow.core.data_structures import (
    FileReference, ContentType, MessageDict, ModelType, FileType, References, 
    FileContentReference, EmbeddingChunk, AliceModel, Prompt, RoleTypes, MessageGenerators,
    ApiType, ToolFunction
    )
from workflow.util import LOGGER, Language

class ModelAgent(BaseModel):
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
    max_consecutive_auto_reply: int = Field(default=10, description="The maximum number of consecutive auto replies")

    @property
    def llm_model(self) -> AliceModel:
        return self.models[ModelType.CHAT] or self.models[ModelType.INSTRUCT]

    def _prepare_system_message(self, **kwargs) -> str:
        """Prepare the system message"""
        return self.system_message.format_prompt(**kwargs)

    def _prepare_messages_for_api(self, messages: List[MessageDict]) -> List[Dict[str, Any]]:
        """Prepare messages for the API call."""
        return [msg.convert_to_api_format() for msg in messages]
    
    async def generate_llm_response(self, api_manager: APIManager, messages: List[MessageDict], tools_list: List[ToolFunction] = [], **kwargs) -> MessageDict:
        """
        Generate a response from the language model with support for tool calling.
        
        This method handles the core LLM interaction, processing both standard text responses
        and tool-calling scenarios. It uses the agent's system message and handles all responses
        through the MessageDict format.
        
        Args:
            api_manager: Manager for API interactions
            messages: List of previous messages in the conversation
            tools_list: Optional list of available tools
            **kwargs: Additional parameters for the LLM
        
        Returns:
            MessageDict containing the model's response and any tool calls
        
        Notes:
            - Automatically includes system message in the context
            - Handles tool calls based on agent's permission level
            - Stores response in standardized MessageDict format
        """
        LOGGER.info("Generating LLM response")
        chat_model = self.llm_model
        response_ref: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.LLM_MODEL,
            api_name=chat_model.api_name,
            model=chat_model,
            messages=self._prepare_messages_for_api(messages),
            system=self._prepare_system_message(**kwargs),
            tool_choice='auto' if self.has_tools != 0 else 'none',
            tools=tools_list,
        )

        if not response_ref or not response_ref.messages[0]:
            raise ValueError("No response from API")
        if len(response_ref.messages) > 1:
            LOGGER.warning(f"Multiple messages returned from API: {len(response_ref.messages)}")

        response = response_ref.messages[0]
        if not isinstance(response, MessageDict):
            if isinstance(response, dict):
                try:
                    response = MessageDict(**response)
                except Exception as e:
                    raise ValueError(f"Error converting response to MessageDict: {e}")
            else:
                raise ValueError(f"Invalid response type: {type(response)}")
        
        return MessageDict(
            **response.model_dump(),
            role=RoleTypes.ASSISTANT,
            content=response.content if response.content else "Using tools" if response.references.tool_calls else "No response from API",
            generated_by=MessageGenerators.LLM,
            type=ContentType.TEXT,
            assistant_name=self.name,
        )
    
    async def generate_vision_response(self, api_manager: APIManager, file_references: List[FileReference], prompt: str) -> MessageDict:
        """
        Generate responses for image inputs using the vision model.
        
        Processes images and generates text descriptions or answers questions about
        the image content.
        
        Args:
            api_manager: Manager for API interactions
            file_references: List of image files to process
            prompt: Text prompt or question about the images
        
        Returns:
            MessageDict containing the vision model's response
        
        Notes:
            - Uses the agent's configured vision model if available
            - Handles multiple image inputs
            - Returns structured responses in MessageDict format
        """

        vision_model = self.models[ModelType.VISION] or api_manager.get_api_by_type(ApiType.IMG_VISION).default_model
        if not vision_model:
            raise ValueError("No vision model available for the agent or in the API manager")
        
        refs: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.IMG_VISION,
            api_name=vision_model.api_name,
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
            api_name=stt_model.api_name,
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
            api_name=img_gen_model.api_name,
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
        """
        Generate speech from text using the text-to-speech model.
        
        Converts text input into speech using specified voice and speed settings.
        
        Args:
            api_manager: Manager for API interactions
            input: Text to convert to speech
            voice: Voice identifier to use
            speed: Speech speed multiplier
        
        Returns:
            List of FileContentReference objects containing audio data
        
        Notes:
            - Uses the agent's configured TTS model if available
            - Creates structured FileContentReference objects for audio storage
            - Supports various voice options and speed adjustments
        """
        tts_model = self.models[ModelType.TTS] or api_manager.get_api_by_type(ApiType.TEXT_TO_SPEECH).default_model
        if not tts_model:
            raise ValueError("No text-to-speech model available for the agent or in the API manager")
        
        refs: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.TEXT_TO_SPEECH,
            api_name=tts_model.api_name,
            model=tts_model,
            input=input,
            voice=voice,
            speed=speed
        )
        if not refs.files or not refs.files[0]:
            raise ValueError("No speech generated by the API")
        return refs.files
    
    async def generate_embeddings(self, api_manager: APIManager, input: Union[str, List[str]], language: Optional[Language]) -> List[EmbeddingChunk]:
        """
        Generate embeddings for input text using the configured embeddings model.
        
        Creates vector representations of text that can be used for similarity search
        and other semantic operations.
        
        Args:
            api_manager: Manager for API interactions
            input: Text to generate embeddings for
            language: Optional language specification for the text
        
        Returns:
            List of EmbeddingChunk objects containing vectors and metadata
        
        Notes:
            - Uses the agent's configured embeddings model if available
            - Handles both single strings and lists of strings
            - Creates structured EmbeddingChunk objects for storage
        """
        embeddings_model = self.models[ModelType.EMBEDDINGS] or api_manager.get_api_by_type(ApiType.EMBEDDINGS).default_model
        LOGGER.info(f'Generating embedding for length {len(input)}')
        if not embeddings_model:
            raise ValueError("No embeddings model available for the agent or in the API manager")
        
        refs: References = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.EMBEDDINGS,
            api_name=embeddings_model.api_name,
            model=embeddings_model,
            input=input,
            language=language
        )
        if not refs.embeddings or not refs.embeddings[0]:
            raise ValueError("No embeddings generated by the API")
        return refs.embeddings
    
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
