import traceback
from workflow_logic.util.logging_config import LOGGER
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Callable, Dict, Any
from bson import ObjectId
from workflow_logic.core.communication import MessageDict
from workflow_logic.core.model import AliceModel
from workflow_logic.core.agent import AliceAgent
from workflow_logic.core.parameters import FunctionConfig
from workflow_logic.core.api import APIManager
from workflow_logic.core.tasks import AliceTask
from autogen.agentchat import ConversableAgent
from workflow_logic.core.chat_functionality import ChatExecutionFunctionality

default_system_message = {
    "name": "alice_default",
    "content": "You are Alice, an AI personal assistant powered by a suite of tools. Your job is to assist your user to the best of your abilities."
}

class AliceChat(BaseModel):
    """
    Represents a chat session with an AI assistant, managing the conversation flow and execution.

    This class encapsulates the properties and methods needed to create and manage
    a chat session, including the conversation history, associated agents, available
    functions, and chat execution functionality.

    Attributes:
        id (Optional[str]): The unique identifier for the chat session.
        name (str): The name of the chat session.
        messages (Optional[List[MessageDict]]): List of messages in the conversation history.
        alice_agent (AliceAgent): The main AI agent for the chat.
        functions (Optional[List[AliceTask]]): List of available functions/tasks for the agent.
        executor (AliceAgent): The agent responsible for executing code and functions.
        model_id (AliceModel): The language model associated with the chat.
        chat_execution (Optional[ChatExecutionFunctionality]): Functionality for executing the chat flow.

    Methods:
        functions_list(api_manager: APIManager) -> List[FunctionConfig]:
            Returns a list of function configurations for the available tasks.
        setup_chat_execution(api_manager: APIManager) -> None:
            Initializes the chat execution functionality.
        generate_response(api_manager: APIManager, new_message: Optional[str] = None) -> List[MessageDict]:
            Generates a response in the chat, processing any new user message.
        get_autogen_agent(api_manager: APIManager) -> ConversableAgent:
            Returns the configured AutoGen agent for the chat.
        get_combined_function_map(api_manager: APIManager) -> Optional[Dict[str, Callable]]:
            Combines all available function maps from the registered tasks.
        get_default_executor(api_manager: APIManager) -> ConversableAgent:
            Returns the default executor agent with the combined function map.
        deep_validate_required_apis(api_manager: APIManager) -> Dict[str, Any]:
            Performs a deep validation of all required APIs for the chat and its functions.
    """
    id: Optional[str] = Field(default=None, description="The unique ID of the chat conversation, must match the ID in the database", alias="_id")
    name: str = Field("New Chat", description="The name of the chat conversation")
    messages: Optional[List[MessageDict]] = Field([], description="List of messages in the chat conversation")
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
    model_config = ConfigDict(protected_namespaces=(), json_encoders = {ObjectId: str})

    def functions_list(self, api_manager: APIManager) -> List[FunctionConfig]:
        return [func.get_function(api_manager)["tool_function"].model_dump() for func in self.functions] if self.functions else None

    def setup_chat_execution(self, api_manager):
        if self.chat_execution is None:          
            executor = self.get_default_executor(api_manager)

            self.chat_execution = ChatExecutionFunctionality(
                llm_agent=self.get_autogen_agent(api_manager),
                execution_agent=executor,
                code_execution_config=executor._code_execution_config,
                valid_languages=["python", "shell"],  # may want to make this configurable
                return_output_to_agent=True  # may want to make this configurable
            )

    async def generate_response(self, api_manager: APIManager, new_message: Optional[str] = None) -> List[MessageDict]:
        try:
            self.setup_chat_execution(api_manager)
            if self.chat_execution is None:
                raise ValueError("Chat execution is not set up properly.")
            
            if new_message:
                if not self.messages: self.messages = []
                self.messages.append(MessageDict(role="user", content=new_message, generated_by="user", type="text"))
            
            new_messages, is_terminated = await self.chat_execution.take_turn(self.messages)
            LOGGER.info(f"New messages generated: {new_messages}")
            self.messages.extend(new_messages)
            return new_messages
        except Exception as e:
            LOGGER.error(f"Error in generate_response: {str(e)}")
            LOGGER.error(f"Traceback: {traceback.format_exc()}")
            return []

    def get_autogen_agent(self, api_manager: APIManager) -> ConversableAgent:
        return self.alice_agent.get_autogen_agent(api_manager=api_manager, functions_list=self.functions_list(api_manager=api_manager)) 
       
    def get_combined_function_map(self, api_manager: APIManager) -> Optional[Dict[str, Callable]]:
        combined_function_map = {}
        for func in self.functions:
            function_details = func.get_function(api_manager=api_manager)
            combined_function_map.update(function_details["function_map"])
        return combined_function_map
    
    def get_default_executor(self, api_manager: APIManager) -> ConversableAgent:
        function_map = self.get_combined_function_map(api_manager=api_manager)
        return self.executor.get_autogen_agent(function_map=function_map if function_map else None)
    
    def deep_validate_required_apis(self, api_manager: APIManager) -> Dict[str, Any]:
        result = {
            "chat_name": self.name,
            "status": "valid",
            "warnings": [],
            "llm_api": "valid",
            "functions": []
        }
        
        # Check LLM API
        try:
            api_manager.retrieve_api_data("llm_api", self.model_id)
        except ValueError as e:
            result["status"] = "warning"
            result["llm_api"] = "invalid"
            result["warnings"].append(str(e))
        
        # Check functions
        for func in self.functions:
            func_result = func.deep_validate_required_apis(api_manager)
            result["functions"].append(func_result)
            if func_result["status"] == "warning":
                result["status"] = "warning"
                result["warnings"].extend(func_result["warnings"])
        
        return result