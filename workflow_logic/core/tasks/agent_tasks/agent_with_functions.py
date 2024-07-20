from typing import List, Tuple, Dict, Any, Optional, Callable
from autogen.agentchat import ConversableAgent
from pydantic import Field
from workflow_logic.core.api import APIManager
from workflow_logic.core.parameters import FunctionConfig
from workflow_logic.core.agent.agent import AliceAgent
from workflow_logic.core.tasks.task import AliceTask
from workflow_logic.core.tasks.agent_tasks.prompt_agent_task import PromptAgentTask
from workflow_logic.core.communication import MessageDict, TaskResponse, LLMChatOutput
from workflow_logic.core.chat.chat_execution_functionality import ChatExecutionFunctionality

class AgentWithFunctions(PromptAgentTask):
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    tasks: Dict[str, AliceTask] = Field(..., description="A dictionary of tasks available for the agent")
    execution_agent: AliceAgent = Field(
        default = AliceAgent(name="executor_agent",
                             system_message={"name": "executor_agent", "content":"Executor Agent. Executes the code and returns the result."},
                             autogen_class="UserProxyAgent",
                             code_execution_config=True,
                             default_auto_reply=""),
        description="The executor agent object.")
    chat_execution: ChatExecutionFunctionality = Field(None, description="Chat execution functionality")
   
    def setup_chat_execution(self, api_manager: APIManager):
        if self.chat_execution is None:
            functions = [task.get_function(api_manager)["tool_function"].model_dump() for task in self.tasks.values()]
            print(f'functions: {functions}')
            
            self.chat_execution = ChatExecutionFunctionality(
                llm_agent=self.get_default_autogen_agent(api_manager=api_manager),
                execution_agent=self.get_default_executor(api_manager=api_manager),
                code_execution_config=self.execution_agent.code_execution_config,
                valid_languages=["python", "shell"],
                return_output_to_agent=True
            )

    async def generate_agent_response(self, messages: List[Dict[str, Any]], api_manager: APIManager, max_rounds: int = 5, **kwargs) -> Tuple[List[MessageDict], bool]:
        self.setup_chat_execution(api_manager)
        
        message_dicts = [MessageDict(**msg) for msg in messages]
        new_messages, is_terminated = await self.chat_execution.take_turn(message_dicts)
        
        return new_messages, is_terminated

    async def run(self, api_manager: APIManager, **kwargs) -> TaskResponse:
        copy_kwargs = kwargs.copy()
        messages = self.create_message_list(**kwargs)
        new_messages, is_terminated = await self.generate_agent_response(messages=messages, api_manager=api_manager, **kwargs)
        
        all_messages = messages + new_messages
        chat_output = LLMChatOutput(content=all_messages)
        exitcode = 1 if not new_messages else 0
        
        return TaskResponse(
            task_id=self.id if self.id else '',
            task_name=self.task_name,
            task_description=self.task_description,
            status="complete" if exitcode != 1 else "failed",
            result_code=exitcode,
            task_outputs=str(chat_output),
            task_content=chat_output,
            task_inputs=copy_kwargs,
            result_diagnostic="Task executed successfully." if not is_terminated else "Task execution terminated by the agent.",
            execution_history=kwargs.get("execution_history", [])
        )
    
    def functions_list(self, api_manager: APIManager) -> List[FunctionConfig]:
        return [func.get_function(api_manager)["tool_function"].model_dump() for func in self.tasks.values()] if self.tasks else None
    
    def get_default_autogen_agent(self, api_manager: APIManager) -> ConversableAgent:
        return self.agent.get_autogen_agent(api_manager=api_manager, functions_list=self.functions_list(api_manager=api_manager)) 
    
    def get_combined_function_map(self, api_manager: APIManager) -> Optional[Dict[str, Callable]]:
        combined_function_map = {}
        for func in self.tasks.values():
            function_details = func.get_function(api_manager=api_manager)
            combined_function_map.update(function_details["function_map"])
        return combined_function_map
    
    def get_default_executor(self, api_manager: APIManager) -> ConversableAgent:
        if not self.execution_agent:
            return None
        function_map = self.get_combined_function_map(api_manager=api_manager)
        return self.execution_agent.get_autogen_agent(function_map=function_map if function_map else None)