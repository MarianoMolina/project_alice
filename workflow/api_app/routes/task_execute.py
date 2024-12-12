from fastapi import APIRouter, Depends
from workflow.util import LOGGER
from workflow.core import AliceTask
from workflow.api_app.util import TaskExecutionRequest
from workflow.core import TaskResponse
from workflow.api_app.util.utils import deep_api_check
from workflow.api_app.util.dependencies import get_db_app, get_queue_manager

router = APIRouter()

@router.post("/execute_task")
async def execute_task_endpoint(
    request: TaskExecutionRequest,
    db_app=Depends(get_db_app),
    queue_manager=Depends(get_queue_manager),
    enqueue: bool = True
) -> dict:
    """
    Execute a specific task and store its response.

    This endpoint retrieves the task, performs API checks, executes the task,
    and stores the result in the database.

    Args:
        request (TaskExecutionRequest): The request containing task ID and inputs.
        db_app: The database application instance (injected dependency).

    Returns:
        dict: The stored task response as a dictionary.

    Raises:
        ValueError: If the specified task is not found.

    Note:
        - This endpoint performs deep API checks before task execution.
        - If an error occurs during execution, it creates and stores a failed task response.
        - All exceptions are caught, logged, and returned as failed task responses.
    """
    if enqueue:
        LOGGER.info(f'Enqueuing task: {request}')
        task_data = {
            "taskId": request.taskId,
            "inputs": request.inputs,
            "user_data": db_app.user_data.get('user_obj', {})
        }
        # Enqueue the task
        enqueued_task_id = await queue_manager.enqueue_request(
            endpoint="/execute_task",
            data=task_data
        )
        return {"task_id": enqueued_task_id}
    else:
        # Process the task immediately (called by QueueManager)
        LOGGER.info(f'Processing task: {request}')
        taskId = request.taskId
        inputs = request.inputs
        inputs_copy = inputs.copy()
        task = None
        try:
            inputs_copy.update({'user_data': db_app.user_data.get('user_obj', {})})
            task = await db_app.get_tasks(taskId)
            if not task or not task.get(taskId):
                raise ValueError(f"Task with ID {taskId} not found")
            task: AliceTask = task[taskId]

            # Retrieve API manager
            api_manager = await db_app.api_setter()

            # Perform deep API availability check
            api_check_result = await deep_api_check(task, api_manager)
            LOGGER.debug(f'API Check Result: {api_check_result}')

            if api_check_result["status"] == "warning":
                LOGGER.warning(f'API Warning: {api_check_result["warnings"]}')
                LOGGER.warning(f'Api_check_result: {api_check_result}')

            LOGGER.debug(f'task: {task}')
            LOGGER.debug(f'task_inputs: {inputs_copy}')
            LOGGER.debug(f'task type: {type(task)}')

            result = await task.run(api_manager=api_manager, **inputs_copy)
            if not result:
                raise ValueError(f"Task execution failed for task ID {taskId}")

            # Process and update file content references
            LOGGER.debug(f'task_result: {result.model_dump()}')
            LOGGER.debug(f'type: {type(result)}')
            db_result = await db_app.create_entity_in_db('task_responses', result.model_dump(by_alias=True))

            updated_ref = await db_app.get_entity_from_db('task_responses', db_result['_id'])

            LOGGER.debug(f'db_result: {db_result}')
            return TaskResponse(**updated_ref).model_dump()
        except Exception as e:
            import traceback
            LOGGER.error(f'Error: {e}\nTraceback: {traceback.format_exc()}')
            result = TaskResponse(
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
            db_result = await db_app.create_entity_in_db('task_responses', result.model_dump(by_alias=True))
            return result.model_dump()