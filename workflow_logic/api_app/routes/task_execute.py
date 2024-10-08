from fastapi import APIRouter, Depends
from workflow_logic.util import LOGGER
from workflow_logic.core import AliceTask
from workflow_logic.api_app.util import TaskExecutionRequest
from workflow_logic.core import TaskResponse
from workflow_logic.api_app.util.utils import deep_api_check
from workflow_logic.api_app.util.dependencies import get_db_app

router = APIRouter()

@router.post("/execute_task", response_model=TaskResponse)
async def execute_task_endpoint(request: TaskExecutionRequest, db_app=Depends(get_db_app)) -> dict:
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
        if not result:
            raise ValueError(f"Task execution failed for task ID {taskId}")

        # Process and update file content references
        LOGGER.debug(f'task_result: {result.model_dump()}')

        # LOGGER.debug(f'result after checking references: {result.model_dump()}')
        LOGGER.debug(f'References: {result.references.model_dump()}')
        LOGGER.debug(f'type: {type(result)}')
        db_result = await db_app.create_entity_in_db('task_responses', result.model_dump(exclude={'id'}))

        updated_ref = await db_app.get_entity_from_db('task_responses', db_result['_id'])

        LOGGER.debug(f'db_result: {db_result}')
        return TaskResponse(**updated_ref)
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
        db_result = await db_app.create_entity_in_db('task_responses', result.model_dump(exclude={'id'}))
        return db_result