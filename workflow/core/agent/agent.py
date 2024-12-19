from enum import Enum
from pydantic import Field, BaseModel
from typing import Dict, List, Optional
from workflow.core.data_structures import (
    ModelType, AliceModel, Prompt, BaseDataStructure, 
    )
from workflow.core.agent.agent_features import ToolExecutionAgent, CodeExecutionAgent, ModelAgent, ToolPermission, CodePermission
from workflow.util import LOGGER, Language

class AliceAgent(BaseDataStructure, ToolExecutionAgent, CodeExecutionAgent, ModelAgent):
    """
    A versatile AI agent that manages model interactions, tool usage, and code execution within a message-based architecture.
    
    AliceAgent serves as a unified interface for various AI model interactions, handling everything from
    basic LLM communication to specialized tasks like speech-to-text or image generation. It maintains
    a dictionary of models for different capabilities (chat, vision, speech, etc.) and processes all
    interactions through a consistent message-based interface.
    
    The agent's architecture is built around MessageDict objects, which serve as the primary data
    structure for all interactions. These messages can contain various types of content (text,
    tool calls, code blocks) and are stored in References objects for persistence and retrieval.
    
    Key Capabilities:
    1. Model Management:
        - Supports multiple model types (chat, instruct, vision, STT, TTS, embeddings, image generation)
        - Handles model-specific configurations and interactions
        - Provides unified interface across different model capabilities
    
    2. Message Processing:
        - Manages conversation flow through MessageDict objects
        - Handles system prompts and conversation context
        - Supports multiple content types in messages
    
    3. Tool & Code Execution:
        - Configurable permission systems for both tools and code
        - Supports multiple programming languages
        - Creates structured outputs (ToolCall, CodeExecution) stored in References
    
    Attributes:
        name (str): Identifier for the agent
        system_message (Prompt): Base system prompt
        models (Dict[ModelType, Optional[AliceModel]]): Available models for different tasks
            - CHAT/INSTRUCT: Language model interactions
            - VISION: Image understanding
            - STT: Speech-to-text conversion
            - TTS: Text-to-speech generation
            - EMBEDDINGS: Text embedding generation
            - IMG_GEN: Image generation
        has_tools (ToolPermission): Tool usage permission level
        has_code_exec (CodePermission): Code execution permission level
        max_consecutive_auto_reply (int): Auto-reply limit
    """
    id: Optional[str] = Field(default=None, description="The ID of the agent", alias="_id")
    name: str = Field(..., description="The name of the agent")
    system_message: Prompt = Field(default=Prompt(name="default", content="You are an AI assistant"), description="The prompt to use for system message")
    max_consecutive_auto_reply: int = Field(default=10, description="The maximum number of consecutive auto replies")
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
    execution_languages: List[Language] = Field(default=[Language.PYTHON, Language.SHELL, Language.JAVASCRIPT, Language.TYPESCRIPT], description="Languages available for code execution")
    
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

    def _prepare_system_message(self, **kwargs) -> str:
        """Prepare the system message with appropriate permission prompts."""
        base_message = super()._prepare_system_message(**kwargs)
        code_prompt = self._get_code_exec_prompt()
        
        # Combine prompts, ensuring proper spacing
        prompts = [p for p in [base_message, code_prompt] if p]
        return "\n\n".join(prompts)