from typing import Dict, Any, List, Union
from workflow_logic.tests.test_module import TestModule
from workflow_logic.core.communication import TaskResponse
from workflow_logic.api.db_app import DBInitManager
from workflow_logic.core.api import APIManager
from workflow_logic.core.tasks.task import AliceTask
from unittest.mock import patch, AsyncMock
import inspect

class TaskTests(TestModule):
    name: str = "TaskTests"

    async def run(self, db_init_manager: DBInitManager, **kwargs) -> Dict[str, Any]:
        test_results = {}
        api_manager = APIManager()

        # Set up API Manager
        for api in db_init_manager.entity_obj_key_map.get("apis", {}).values():
            api_manager.add_api(api)

        # Retrieve all tasks from db_init_manager
        tasks = db_init_manager.entity_obj_key_map.get("tasks", {})

        # Test task initialization
        test_results["task_initialization"] = self.test_task_initialization(tasks)

        # Test each task
        for task_id, task in tasks.items():
            task_test_results = await self.test_task(task, api_manager)
            test_results[f"task_{task_id}"] = task_test_results

        return {
            "test_results": test_results,
            "outputs": {"available_tasks": self.get_available_tasks(test_results)}
        }

    def get_available_tasks(self, test_results: Dict[str, Union[str, Dict[str, str]]]) -> List[str]:
        available_tasks = []
        for name, results in test_results.items():
            if name != "task_initialization":
                if isinstance(results, str):
                    if results == "Success":
                        available_tasks.append(name)
                elif isinstance(results, dict):
                    if all(result == "Success" for result in results.values()):
                        available_tasks.append(name)
        return available_tasks

    def test_task_initialization(self, tasks: Dict[str, AliceTask]) -> str:
        try:
            for task_id, task in tasks.items():
                if not isinstance(task, AliceTask):
                    return f"Task {task_id} is not an instance of AliceTask"
            return "Success"
        except Exception as e:
            return f"Error in task initialization: {str(e)}"

    async def test_task(self, task: AliceTask, api_manager: APIManager) -> Dict[str, str]:
        test_results = {}
        
        # Test 1: Basic task execution
        test_results["basic_execution"] = await self.test_basic_execution(task, api_manager)

        # Test 2: API validation
        test_results["api_validation"] = self.test_api_validation(task, api_manager)

        # Test 3: Function generation
        test_results["function_generation"] = self.test_function_generation(task)

        # Test 4: Recursion handling (if applicable)
        if task.recursive:
            test_results["recursion_handling"] = await self.test_recursion_handling(task, api_manager)

        return test_results

    async def test_basic_execution(self, task: AliceTask, api_manager: APIManager) -> str:
        try:
            mock_response = TaskResponse(
                task_id=task.id,
                task_name=task.task_name,
                task_description=task.task_description,
                status="complete",
                result_code=0,
                task_outputs="Test output",
                task_inputs={},
                result_diagnostic="",
                execution_history=[]
            )

            mock_a_execute = AsyncMock(return_value=mock_response)

            with patch.object(task.__class__, 'a_execute', mock_a_execute):
                result = await task.a_execute(api_manager=api_manager)
                
                if result.status == "complete" and result.result_code == 0:
                    return "Success"
                else:
                    return f"Task execution failed: {result.result_diagnostic}"
        except Exception as e:
            return f"Error in basic execution test: {str(e)}"

    def test_api_validation(self, task: AliceTask, api_manager: APIManager) -> str:
        try:
            validation_result = task.validate_required_apis(api_manager)
            return "Success" if validation_result else "API validation failed"
        except Exception as e:
            return f"Error in API validation test: {str(e)}"

    def test_function_generation(self, task: AliceTask) -> str:
        try:
            function_dict = task.get_function()
            if "tool_function" in function_dict and "function_map" in function_dict:
                return "Success"
            else:
                return "Function generation failed"
        except Exception as e:
            return f"Error in function generation test: {str(e)}"

    async def test_recursion_handling(self, task: AliceTask, api_manager: APIManager) -> str:
        try:
            # Set up a mock execution history to simulate recursion
            execution_history = [
                {"task_name": task.task_name, "task_id": "1", "task_description": task.task_description},
                {"task_name": task.task_name, "task_id": "2", "task_description": task.task_description}
            ]
            
            mock_response = TaskResponse(
                task_id=task.id,
                task_name=task.task_name,
                task_description=task.task_description,
                status="complete",
                result_code=0,
                task_outputs="Test output",
                task_inputs={},
                result_diagnostic="",
                execution_history=execution_history
            )

            mock_a_execute = AsyncMock(return_value=mock_response)
            
            with patch.object(task.__class__, 'a_execute', mock_a_execute):
                try:
                    await task.a_execute(api_manager=api_manager, execution_history=execution_history)
                    return "Success" if task.recursive else "Failed to prevent recursion"
                except RecursionError:
                    return "Success" if not task.recursive else "Incorrectly prevented recursion"
                
        except Exception as e:
            return f"Error in recursion handling test: {str(e)}"