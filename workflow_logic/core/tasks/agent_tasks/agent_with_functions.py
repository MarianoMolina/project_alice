from typing import List, Tuple, Dict, Any
from pydantic import Field
from workflow_logic.core.agent.agent import AliceAgent
from workflow_logic.core.tasks.task import AliceTask
from workflow_logic.core.tasks.agent_tasks.prompt_agent_task import PromptAgentTask
from workflow_logic.core.communication import MessageDict, TaskResponse, LLMChatOutput
from workflow_logic.core.chat.chat_execution_functionality import ChatExecutionFunctionality

class AgentWithFunctions(PromptAgentTask):
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    tasks: Dict[str, AliceTask] = Field(..., description="A dictionary of tasks available for the agent")
    execution_agent: AliceAgent = Field(..., description="The agent to use for the task execution")
    chat_execution: ChatExecutionFunctionality = Field(None, description="Chat execution functionality")

    def setup_chat_execution(self):
        if self.chat_execution is None:
            llm_agent = self.agent.get_autogen_agent()
            execution_agent = self.execution_agent.get_autogen_agent()
            
            functions = [task.get_function()["tool_dict"] for task in self.tasks.values()]
            
            self.chat_execution = ChatExecutionFunctionality(
                llm_agent=llm_agent,
                execution_agent=execution_agent,
                functions=functions,
                code_execution_config=self.execution_agent.code_execution_config,
                valid_languages=["python", "shell"], 
                return_output_to_agent=True  # May want to make this configurable
            )

    def generate_agent_response(self, messages: List[Dict[str, Any]], max_rounds: int = 5, **kwargs) -> Tuple[List[MessageDict], bool]:
        self.setup_chat_execution()
        
        # Convert messages to MessageDict format
        message_dicts = [MessageDict(**msg) for msg in messages]
        
        new_messages, is_terminated = self.chat_execution.take_turn(message_dicts)
        
        return new_messages, is_terminated

    def run(self, **kwargs) -> TaskResponse:
        messages = self.create_message_list(**kwargs)
        new_messages, is_terminated = self.generate_agent_response(messages, **kwargs)
        
        # Combine initial messages and new messages
        all_messages = messages + new_messages
        
        # Create LLMChatOutput
        chat_output = LLMChatOutput(content=all_messages)
        
        return TaskResponse(
            task_name=self.task_name,
            task_description=self.task_description,
            status="complete" if not is_terminated else "failed",
            result_code=0 if not is_terminated else 1,
            task_outputs=str(chat_output),
            task_content=chat_output,
            task_inputs=kwargs,
            result_diagnostic="Task executed successfully." if not is_terminated else "Task execution terminated.",
            execution_history=kwargs.get("execution_history", [])
        )

    def create_message_list(self, **kwargs) -> List[MessageDict]:
        template = self.get_prompt_template("task_template")
        sanitized_inputs = self.update_inputs(**kwargs)
        prompts = self.prompts_to_add if self.prompts_to_add else {}
        final_inputs = {**prompts, **sanitized_inputs}
        input_string = template.format_prompt(**final_inputs)
        return [MessageDict(role="user", content=input_string, type="text")] if input_string else []