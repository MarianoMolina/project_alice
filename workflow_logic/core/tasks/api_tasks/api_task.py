from abc import abstractmethod
from workflow_logic.core.communication import SearchOutput, TaskResponse
from workflow_logic.core.tasks.task import AliceTask

class APITask(AliceTask):
    def run(self, **kwargs) -> TaskResponse:
        task_inputs = kwargs.copy()
        try:
            task_outputs = self.generate_api_response(**kwargs)
            return TaskResponse(
                task_name=self.task_name,
                task_description=self.task_description,
                status="complete",
                result_code=0,
                task_outputs=str(task_outputs),
                task_content=task_outputs,
                task_inputs=task_inputs,
                result_diagnostic="",
                execution_history=kwargs.get("execution_history", [])
            )
        except Exception as e:
            return TaskResponse(
                task_name=self.task_name,
                task_description=self.task_description,
                status="failed",
                task_inputs=task_inputs,
                result_code=1,
                result_diagnostic=str(e),
                execution_history=kwargs.get("execution_history", [])
            )
        
    @abstractmethod
    def generate_api_response(self, **kwargs) -> SearchOutput:
        """Generates the API response for the task, in a tuple of the output and the content."""
        ...
