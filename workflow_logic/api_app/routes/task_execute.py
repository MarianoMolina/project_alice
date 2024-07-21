from fastapi import APIRouter, Depends
from workflow_logic.core.communication import DatabaseTaskResponse
from workflow_logic.core.tasks import AliceTask
from workflow_logic.core.api.api_utils import TaskExecutionRequest, deep_api_check
from workflow_logic.util.logging_config import LOGGER
from workflow_logic.api_app.util.dependencies import get_db_app

router = APIRouter()

@router.post("/execute_task", response_model=DatabaseTaskResponse)
async def execute_task_endpoint(request: TaskExecutionRequest, db_app=Depends(get_db_app)) -> dict:
    LOGGER.info(f'execute_task_endpoint: {request}')
    taskId = request.taskId
    inputs = request.inputs
    inputs_copy = inputs.copy()
    task = None
    try:
        task = await db_app.get_tasks(taskId)
        if not task or not task.get(taskId):
            raise ValueError(f"Task with ID {taskId} not found")
        task: AliceTask = task[taskId]
       
        # Retrieve API manager
        api_manager = await db_app.api_setter()
       
        # Perform deep API availability check
        api_check_result = await deep_api_check(task, api_manager)
        LOGGER.info(f'API Check Result: {api_check_result}')
       
        if api_check_result["status"] == "warning":
            LOGGER.warning(f'API Warning: {api_check_result["warnings"]}')
            LOGGER.warning(f'Api_check_result: {api_check_result}')
              
        LOGGER.debug(f'task: {task}')
        LOGGER.debug(f'task_inputs: {inputs_copy}')
        LOGGER.debug(f'task type: {type(task)}')
       
        result = await task.a_execute(api_manager=api_manager, **inputs)
       
        LOGGER.info(f'task_result: {result.model_dump()}')
        LOGGER.debug(f'type: {type(result)}')
        db_result = await db_app.store_task_response(result)
        LOGGER.info(f'db_result: {db_result.model_dump(by_alias=True)}')
        return db_result.model_dump(by_alias=True)
    except Exception as e:
        import traceback
        LOGGER.error(f'Error: {e}\nTraceback: {traceback.format_exc()}')
        result = DatabaseTaskResponse(
            task_id=taskId,
            task_name=task.task_name if task else "Unknown",
            task_description=task.task_description if task else "Task execution failed",
            status="failed",
            result_code=1,
            task_outputs=None,
            task_inputs=inputs_copy,
            result_diagnostic=str(f'Error: {e}\nTraceback: {traceback.format_exc()}'),
            usage_metrics=None,
            execution_history=None
        )
        db_result = await db_app.store_task_response(result)
        return db_result.model_dump(by_alias=True)