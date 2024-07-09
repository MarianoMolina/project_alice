from pydantic import ConfigDict, BaseModel, Field
from typing import Dict
from workflow_logic.core.agent.agent import AliceAgent
from workflow_logic.core.model import ModelManager

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