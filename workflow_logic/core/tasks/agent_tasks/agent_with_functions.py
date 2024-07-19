from typing import List, Tuple, Dict, Any
from pydantic import Field
from workflow_logic.core.api import APIManager
from workflow_logic.core.model import LLMConfig
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
            functions = [task.get_function()["tool_function"].model_dump() for task in self.tasks.values()]
            print(f'functions: {functions}')
            
            # Merge all function maps into a single dictionary
            function_map = {}
            for task in self.tasks.values():
                function_map.update(task.get_function()["function_map"])
            self.chat_execution = ChatExecutionFunctionality(
                llm_agent=self.agent.get_autogen_agent(api_manager=api_manager),
                execution_agent=self.execution_agent.get_execution_agent(function_map),
                functions=functions,
                code_execution_config=self.execution_agent.code_execution_config,
                valid_languages=["python", "shell"],
                return_output_to_agent=True
            )

    async def generate_agent_response(self, messages: List[Dict[str, Any]], api_manager: APIManager, max_rounds: int = 5, **kwargs) -> Tuple[List[MessageDict], bool]:
        self.setup_chat_execution(api_manager)
        
        message_dicts = [MessageDict(**msg) for msg in messages]
        new_messages, is_terminated = self.chat_execution.take_turn(message_dicts)
        
        return new_messages, is_terminated

    async def run(self, api_manager: APIManager, **kwargs) -> TaskResponse:
        copy_kwargs = kwargs.copy()
        messages = self.create_message_list(**kwargs)
        new_messages, is_terminated = await self.generate_agent_response(messages, api_manager, **kwargs)
        
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