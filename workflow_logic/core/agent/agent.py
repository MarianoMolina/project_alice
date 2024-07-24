from typing import Dict, Optional, List, Callable, Literal, Union, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from autogen.agentchat import ConversableAgent, UserProxyAgent
from autogen.agentchat.contrib.llava_agent import LLaVAAgent
from workflow_logic.core.api import APIManager, ApiType
from workflow_logic.core.parameters import FunctionConfig
from workflow_logic.core.prompt import Prompt
from workflow_logic.core.model import AliceModel, LLMConfig

class AliceAgent(BaseModel):
    """
    Represents an AI agent with configurable properties and behaviors.

    This class encapsulates the properties and methods needed to create and manage
    an AI agent, including its name, system message, associated model, and various
    configuration options for interaction and code execution.

    Attributes:
        id (Optional[str]): The unique identifier for the agent.
        name (str): The name of the agent.
        system_message (Prompt): The prompt object containing the agent's system message.
        agents_in_group (Optional[List['AliceAgent']]): A list of other agents in the group chat, if applicable.
        autogen_class (Literal["ConversableAgent", "UserProxyAgent", "LLaVAAgent"]): The type of AutoGen agent to use.
        code_execution_config (Optional[Union[Dict, bool]]): Configuration for code execution capabilities.
        max_consecutive_auto_reply (int): Maximum number of consecutive automatic replies.
        human_input_mode (Literal["ALWAYS", "TERMINATE", "NEVER"]): When to request human input.
        speaker_selection (Optional[Dict[str, Any]]): Logic for selecting speakers in a group chat.
        default_auto_reply (Optional[str]): Default reply when no specific response is generated.
        model_id (Optional[AliceModel]): The associated language model for the agent.

    Methods:
        system_message_str() -> str: Returns the formatted system message string.
        get_execution_agent(function_map: Optional[Dict[str, Callable]] = None) -> ConversableAgent:
            Creates and returns a UserProxyAgent for code execution.
        get_code_execution_config() -> dict: Returns the code execution configuration.
        get_autogen_agent(api_manager: Optional[APIManager] = None, 
                          llm_config: Optional[LLMConfig] = None, 
                          function_map: Dict[str, Callable] = {}, 
                          functions_list: List[FunctionConfig] = []) -> ConversableAgent:
            Creates and returns the appropriate AutoGen agent based on the configuration.
    """
    id: Optional[str] = Field(default=None, description="The ID of the agent", alias="_id")
    name: str = Field(..., description="The name of the agent")
    system_message: Prompt = Field(default=Prompt(name="default", content="You are an AI assistant"), description="The name of the prompt to use for system_message")
    agents_in_group: Optional[List['AliceAgent']] = Field(default=None, description="A list of agent names in the group chat")
    autogen_class: Literal["ConversableAgent", "UserProxyAgent", "LLaVAAgent"] = Field(default="ConversableAgent", description="The autogen class of the agent")
    code_execution_config: Optional[Union[Dict, bool]] = Field(default=False, description="Whether the agent can execute code")
    max_consecutive_auto_reply: int = Field(default=10, description="The maximum number of consecutive auto replies")
    human_input_mode: Literal["ALWAYS", "TERMINATE", "NEVER"] = Field(default="NEVER", description="The mode for human input")
    speaker_selection: Optional[Dict[str, Any]] = Field(default_factory=dict, description="The speaker selection logic for the group chat")
    default_auto_reply: Optional[str] = Field(default="", description="The default auto reply for the agent")
    model_id: Optional[AliceModel] = Field(None, description="The model associated with the agent")

    class Config:
        protected_namespaces=()
        json_encoders = {ObjectId: str}

    @property
    def system_message_str(self) -> str:
        return self.system_message.format_prompt()
        
    def get_execution_agent(self, function_map: Dict[str, Callable] = None) -> ConversableAgent:
        return UserProxyAgent(
            name=self.name,
            human_input_mode=self.human_input_mode,
            code_execution_config=self.get_code_execution_config(),
            default_auto_reply=self.default_auto_reply,
            is_termination_msg=lambda x: (
                False if x.get("content") is None else
                x.get("content", "").rstrip().endswith("TERMINATE")
                if isinstance(x.get("content"), str) else
                False
                ),
            function_map=function_map if function_map else {},
            max_consecutive_auto_reply=self.max_consecutive_auto_reply
        )
    
    def get_code_execution_config(self) -> dict:
        if isinstance(self.code_execution_config, bool):
            import tempfile

            # Create a temporary directory to store the code files.
            temp_dir = tempfile.TemporaryDirectory()

            return {
                "work_dir": temp_dir.name,
                "use_docker": True,
                "timeout": 50,
            }
            
        return self.code_execution_config

    def get_autogen_agent(self, api_manager: Optional[APIManager] = None, llm_config: Optional[LLMConfig] = None, function_map: Dict[str, Callable] = {}, functions_list: List[FunctionConfig] = []) -> ConversableAgent:
        if not llm_config and not self.autogen_class == "UserProxyAgent":
            if not api_manager:
                raise ValueError("Either llm_config or api_manager must be provided.")
            llm_config = api_manager.retrieve_api_data(ApiType.LLM_MODEL, self.model_id)
        if not self.autogen_class:
            raise ValueError(f"The agent class must be specified. {self.name}")
        
        # Code execution config
        if self.code_execution_config:
            code_exec_config = self.get_code_execution_config()
        else:
            code_exec_config = False
        
        # LLMConfig
        if self.autogen_class != "UserProxyAgent":
            if not llm_config:
                raise ValueError(f"LLM Config must be provided for conversable agents.")
            if isinstance(llm_config, dict):
                llm_config = LLMConfig(**llm_config)
            if not llm_config.config_list:
                raise ValueError("LLM Config must have a 'config_list' attribute with at least one config.")
            llm_config = llm_config.replace_localhost().model_dump(by_alias=True)
            if functions_list:
                llm_config["tools"] = [func.model_dump(by_alias=True) for func in functions_list]

        # Agent creation
        if self.autogen_class == "ConversableAgent":
            return ConversableAgent(
                name=self.name,
                system_message=self.system_message_str,
                llm_config=llm_config if llm_config else None,
                max_consecutive_auto_reply=self.max_consecutive_auto_reply,
                human_input_mode=self.human_input_mode,
            )
        elif self.autogen_class == "UserProxyAgent":
            return UserProxyAgent(
                name=self.name,
                human_input_mode=self.human_input_mode,
                code_execution_config=code_exec_config,
                default_auto_reply=self.default_auto_reply,
                is_termination_msg=lambda x: (
                    False if x.get("content") is None else
                    x.get("content", "").rstrip().endswith("TERMINATE")
                    if isinstance(x.get("content"), str) else
                    False
                    ),
                function_map=function_map if function_map else {},
                max_consecutive_auto_reply=self.max_consecutive_auto_reply
            )
        elif self.autogen_class == "LLaVAAgent":
            return LLaVAAgent(
                name=self.name,
                system_message=self.system_message_str,
                human_input_mode=self.human_input_mode,
                llm_config=llm_config if llm_config else None,
                max_consecutive_auto_reply=self.max_consecutive_auto_reply
            )
        else:
            raise ValueError(f"Invalid agent class: {self.autogen_class}. Expected 'ConversableAgent', or 'UserProxyAgent'.")
        