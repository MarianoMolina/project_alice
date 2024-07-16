from abc import abstractmethod
from typing import Any, Dict, List
from pydantic import Field
from workflow_logic.core.communication import SearchOutput, TaskResponse
from workflow_logic.core.tasks.task import AliceTask
from workflow_logic.core.api import APIManager

class APITask(AliceTask):    
    required_apis: List[str] = Field(..., description="A list of required APIs for the task")

    def run(self, api_manager: APIManager, **kwargs) -> TaskResponse:
        task_inputs = kwargs.copy()
        try:
            api_data = api_manager.retrieve_api_data(self.required_apis[0])
            task_outputs = self.generate_api_response(api_data=api_data, **kwargs)
            return TaskResponse(
                task_id=self.id if self.id else '',
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
                task_id=self.id if self.id else '',
                task_name=self.task_name,
                task_description=self.task_description,
                status="failed",
                task_inputs=task_inputs,
                result_code=1,
                result_diagnostic=str(e),
                execution_history=kwargs.get("execution_history", [])
            )
        
    @abstractmethod
    def generate_api_response(self, api_data: Dict[str, Any], **kwargs) -> SearchOutput:
        """Generates the API response for the task, using the provided API data."""
        pass
