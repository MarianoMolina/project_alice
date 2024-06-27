from typing import Dict, Optional, List, Callable, Literal, Union
from pydantic import BaseModel, Field, ConfigDict
from autogen.agentchat import Agent, AssistantAgent, ConversableAgent, GroupChat, GroupChatManager, UserProxyAgent
from autogen.agentchat.contrib.llava_agent import LLaVAAgent
from workflow_logic.util.utils import LLMConfig, replace_localhost
from workflow_logic.util.task_utils import FunctionConfig
from workflow_logic.core.model import ModelManager
from workflow_logic.core.prompt import Prompt
from workflow_logic.util.const import LM_STUDIO_PORT, HOST

class AliceAgent(BaseModel):
    id: str = Field(None, description="The ID of the agent", alias="_id")
    name: str = Field(..., description="The name of the agent")
    system_message: Prompt = Field(default="default_agent", description="The name of the prompt to use for system_message")
    functions: List[FunctionConfig] = Field(default_factory=list, description="A list of functions that the agent can execute")
    functions_map: Dict[str, Callable] = Field(default_factory=dict, description="A mapping of function names to callable functions")
    agents_in_group: Optional[List[str]] = Field(default=None, description="A list of agent names in the group chat")
    autogen_class: Literal["ConversableAgent", "AssistantAgent", "UserProxyAgent", "GroupChatManager", "LLaVAAgent"] = Field(default="ConversableAgent", description="The autogen class of the agent")
    code_execution_config: Union[dict, bool] = Field(default=False, description="Whether the agent can execute code")
    max_consecutive_auto_reply: int = Field(default=10, description="The maximum number of consecutive auto replies")
    human_input_mode: Literal["ALWAYS", "TERMINATE", "NEVER"] = Field(default="NEVER", description="The mode for human input")
    speaker_selection: dict = Field(default=dict, description="The speaker selection logic for the group chat")
    agent_library: Optional["AgentLibrary"] = Field(default=None, description="The agent library object")
    model_manager_object: Optional[ModelManager] = Field(default=None, description="The model manager object. Required if the agent uses a model and no llm_config is passed")
    default_auto_reply: Optional[str] = Field(default="", description="The default auto reply for the agent")
    llm_config: Optional[LLMConfig] = Field(default=None, description="The LLM configuration for the agent")

    class Config:
        protected_namespaces=()

    @property
    def system_message_str(self) -> str:
        return self.system_message.format_prompt()

    def get_autogen_agent(self, *, llm_config: Optional[LLMConfig] = None) -> ConversableAgent:

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
                # code_exec_config = {
                #     "work_dir": "coding",
                #     "use_docker": False,
                # }
                code_exec_config = self.code_execution_config
            else:
                code_exec_config = self.code_execution_config
        else:
            code_exec_config = False
        
        # LLMConfig
        if not llm_config:
            if not self.llm_config:
                if self.model_manager_object:
                    llm_config = self.model_manager_object.default_model.autogen_llm_config
            else:
                llm_config = self.llm_config
        if llm_config:
            if isinstance(llm_config, dict):
                llm_config = LLMConfig(**llm_config)
            if not llm_config.config_list:
                raise ValueError("LLM Config must have a 'config_list' attribute with at least one config.")
            if llm_config.config_list[0].model_client_cls in [None, '']:
                del llm_config.config_list[0].__dict__['model_client_cls']
            llm_config = replace_localhost(llm_config=llm_config).model_dump()
            if self.functions:
                llm_config["functions"] = self.functions
        print(f'LLM Config: {llm_config}')

        # Agent creation
        if self.autogen_class == "AssistantAgent":
            return AssistantAgent(
                name=self.name,
                system_message=self.system_message_str,
                llm_config=llm_config,
                max_consecutive_auto_reply=self.max_consecutive_auto_reply
            )
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
                function_map=self.functions_map,
                max_consecutive_auto_reply=self.max_consecutive_auto_reply
            )
        elif self.autogen_class == "LLaVAAgent":
            return LLaVAAgent(
                name=self.name,
                system_message=self.system_message_str,
                llm_config=llm_config,
                max_consecutive_auto_reply=self.max_consecutive_auto_reply
            )
        elif self.autogen_class == "GroupChatManager":
            if not self.agents_in_group:
                raise ValueError("GroupChatManager agent must have a list of agents in the group.")
            if not self.agent_library:
                raise ValueError("GroupChatManager agent must have a reference to the agent library.")
            agents_in_group = [self.agent_library.get_agent_by_name(agent_name).get_autogen_agent() for agent_name in self.agents_in_group]
            if len(agents_in_group) != len(self.agents_in_group):
                raise ValueError(f"One or more agents in the group not found in the agent library. {self.agents_in_group}")
            speaker_selection = self.create_speaker_selection_method(self.speaker_selection)
            return GroupChatManager(
                name=self.name,
                groupchat=GroupChat(agents=agents_in_group, messages=[], max_round=6, admin_name=self.name, speaker_selection_method=speaker_selection),
                llm_config=llm_config,
                system_message=self.system_message_str
            )
        else:
            raise ValueError(f"Invalid agent class: {self.autogen_class}. Expected 'ConversableAgent', 'AssistantAgent' or 'UserProxyAgent'.")
        
    
    def generate_response(self, messages: List[dict]) -> dict:
        return self.get_autogen_agent().generate_reply(messages)
        
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
    
class AgentLibrary(BaseModel):
    agents: Dict[str, AliceAgent] = Field({}, description="A dictionary of agents with their names as keys")
    model_manager_object: ModelManager = Field(description="The model manager object")
    model_config = ConfigDict(protected_namespaces=())

    def get_agent_by_name(self, agent_name: str) -> AliceAgent:
        if agent_name not in self.agents:
            raise ValueError(f"Agent {agent_name} not found in the agent library.")
        return self.agents[agent_name]

    def add_agent(self, agent: AliceAgent) -> bool:
        if agent.name in self.agents:
            print(f"Agent {agent.name} already exists in the library. Overwriting.")
        agent.agent_library = self
        self.agents[agent.name] = agent
        return True

    def get_agent_by_id(self, agent_id: str) -> AliceAgent:
        for agent in self.agents.values():
            if agent_id == agent.id:
                return agent
        raise ValueError(f"Agent with ID {agent_id} not found in the agent library.")