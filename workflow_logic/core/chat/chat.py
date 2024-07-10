from pydantic import BaseModel, Field
from typing import List, Optional
from workflow_logic.core.model.model_config import LLMConfig
from workflow_logic.core.communication import MessageDict
from workflow_logic.core.model import AliceModel
from workflow_logic.core.agent import AliceAgent
from workflow_logic.core.tasks import AliceTask
from autogen.agentchat import ConversableAgent
from workflow_logic.core.chat.chat_execution_functionality import ChatExecutionFunctionality

default_system_message = {
    "name": "alice_default",
    "content": "You are Alice, an AI personal assistant powered by a suite of tools. Your job is to assist your user to the best of your abilities."
}

class AliceChat(BaseModel):
    id: str = Field(default="", description="The unique ID of the chat conversation, must match the ID in the database", alias="_id")
    name: str = Field("New Chat", description="The name of the chat conversation")
    messages: List[MessageDict] = Field(..., description="List of messages in the chat conversation")
    alice_agent: AliceAgent = Field(
        default = AliceAgent(
            name="Alice",
            system_message=default_system_message,
        ), 
        description="The Alice agent object. Default is base Alice Agent.")
    functions: Optional[List[AliceTask]] = Field([], description="List of functions to be registered with the agent")
    executor: AliceAgent = Field(
        default = AliceAgent(name="executor_agent", 
                             system_message={"name": "executor_agent", "content":"Executor Agent. Executes the code and returns the result."}, 
                             autogen_class="UserProxyAgent", 
                             code_execution_config=True, 
                             default_auto_reply=""),
        description="The executor agent object. Default is base Alice Agent.")
    model_id: AliceModel = Field(None, description="The model object for the chat conversation")
    chat_execution: Optional[ChatExecutionFunctionality] = Field(None, description="Chat execution functionality")

    def setup_chat_execution(self):
        if self.chat_execution is None:
            llm_agent = self.get_autogen_agent()
            execution_agent = self.get_default_executor()
            
            functions = [task.get_function()["tool_dict"] for task in self.functions] if self.functions else None
            
            self.chat_execution = ChatExecutionFunctionality(
                llm_agent=llm_agent,
                execution_agent=execution_agent,
                functions=functions,
                code_execution_config=self.executor.code_execution_config,
                valid_languages=["python", "shell"],  # You may want to make this configurable
                return_output_to_agent=True  # You may want to make this configurable
            )

    def generate_response(self, new_message: Optional[str] = None) -> List[MessageDict]:
        self.setup_chat_execution()
        
        if new_message:
            self.messages.append(MessageDict(role="user", content=new_message, generated_by="user", type="text"))
        
        new_messages, is_terminated = self.chat_execution.take_turn(self.messages)
        self.messages.extend(new_messages)
        
        return new_messages

    def get_autogen_agent(self) -> ConversableAgent:
        llm_config = self.model.autogen_llm_config() if self.model else None
        return self.alice_agent.get_autogen_agent(llm_config=llm_config)
    
    def get_default_executor(self) -> ConversableAgent:
        return self.executor.get_autogen_agent()
    
    def inject_llm_config(self, task: AliceTask) -> AliceTask:
        llm_config = self.llm_config.model_dump() if self.llm_config else None
        if task.agent and not task.agent.llm_config:
            task.agent.llm_config = llm_config
        return task