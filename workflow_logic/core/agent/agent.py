from typing import Dict, Optional, List, Callable, Literal, Union
from pydantic import BaseModel, Field
from bson import ObjectId
from autogen.agentchat import Agent, ConversableAgent, GroupChat, UserProxyAgent
from autogen.agentchat.contrib.llava_agent import LLaVAAgent
from workflow_logic.core.api import APIManager, ApiType
from workflow_logic.core.parameters import FunctionConfig
from workflow_logic.core.prompt import Prompt
from workflow_logic.core.model import AliceModel, LLMConfig

class AliceAgent(BaseModel):
    id: str = Field(None, description="The ID of the agent", alias="_id")
    name: str = Field(..., description="The name of the agent")
    system_message: Prompt = Field(default="default_agent", description="The name of the prompt to use for system_message")
    agents_in_group: Optional[List['AliceAgent']] = Field(default=None, description="A list of agent names in the group chat")
    autogen_class: Literal["ConversableAgent", "UserProxyAgent", "LLaVAAgent"] = Field(default="ConversableAgent", description="The autogen class of the agent")
    code_execution_config: Union[dict, bool] = Field(default=False, description="Whether the agent can execute code")
    max_consecutive_auto_reply: int = Field(default=10, description="The maximum number of consecutive auto replies")
    human_input_mode: Literal["ALWAYS", "TERMINATE", "NEVER"] = Field(default="NEVER", description="The mode for human input")
    speaker_selection: dict = Field(default=dict, description="The speaker selection logic for the group chat")
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
            code_execution_config=True,
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

    def get_autogen_agent(self, api_manager: Optional[APIManager] = None, llm_config: Optional[LLMConfig] = None, function_map: Dict[str, Callable] = {}, functions_list: List[FunctionConfig] = []) -> ConversableAgent:
        if not llm_config:
            if not api_manager:
                raise ValueError("Either llm_config or api_manager must be provided.")
            llm_config = api_manager.retrieve_api_data(ApiType.LLM_MODEL, self.model_id)
        if not self.autogen_class:
            raise ValueError(f"The agent class must be specified. {self.name}")
        
        # Code execution config
        if self.code_execution_config:
            if isinstance(self.code_execution_config, bool):
                import tempfile

                # Create a temporary directory to store the code files.
                temp_dir = tempfile.TemporaryDirectory()

                self.code_execution_config = {
                    "work_dir": temp_dir.name,
                    "use_docker": True,
                    "timeout": 50,
                }
                
            code_exec_config = self.code_execution_config
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
            llm_config = llm_config.replace_localhost().model_dump()
            if functions_list:
                llm_config["functions"] = functions_list
            print(f'LLM Config: {llm_config}')

        # Agent creation
        if self.autogen_class == "ConversableAgent":
            return ConversableAgent(
                name=self.name,
                system_message=self.system_message_str,
                llm_config=llm_config,
                max_consecutive_auto_reply=self.max_consecutive_auto_reply
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
                llm_config=llm_config,
                max_consecutive_auto_reply=self.max_consecutive_auto_reply
            )
        else:
            raise ValueError(f"Invalid agent class: {self.autogen_class}. Expected 'ConversableAgent', or 'UserProxyAgent'.")
        
    @staticmethod
    def create_speaker_selection_method(speaker_selection_logic: dict) -> Callable[[ConversableAgent, GroupChat], Optional[Agent]]:
        def speaker_selection(last_speaker: ConversableAgent, groupchat: GroupChat) -> Optional[Agent]:
            if last_speaker is None or last_speaker.name not in speaker_selection_logic["speaker_sequence"]:
                selected = speaker_selection_logic["speaker_sequence"][0]
                agent_selected = next(agent for agent in groupchat.agents if agent.name == selected)
                return agent_selected
            elif last_speaker.name in speaker_selection_logic["speaker_sequence"]:
                if speaker_selection_logic["termination_condition"](groupchat.messages[-1]["content"]):
                    print("Termination condition met.")
                    return None
                current_index = speaker_selection_logic["speaker_sequence"].index(last_speaker.name)
                if current_index + 1 < len(speaker_selection_logic["speaker_sequence"]):
                    return next(agent for agent in groupchat.agents if agent.name == speaker_selection_logic["speaker_sequence"][current_index + 1])
                return next(agent for agent in groupchat.agents if agent.name == speaker_selection_logic["speaker_sequence"][0])
            return None
        return speaker_selection