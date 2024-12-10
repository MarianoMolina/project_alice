from fastapi import APIRouter, Depends, HTTPException
from workflow.api_app.util.dependencies import get_db_app, get_queue_manager
from workflow.api_app.util.utils import TaskResumeRequest
from workflow.util import LOGGER
from workflow.core import AliceTask, TaskResponse, APIManager

router = APIRouter()

@router.post("/resume_task")
async def resume_task_endpoint(
    request: TaskResumeRequest,
    db_app=Depends(get_db_app),
    queue_manager=Depends(get_queue_manager),
    enqueue: bool = True
) -> dict:
    if enqueue:
        LOGGER.info(f'Enqueuing task resume for task_response_id: {request.task_response_id}')
        task_data = {
            "task_response_id": request.task_response_id,
            "additional_inputs": request.additional_inputs,
            "user_data": db_app.user_data.get('user_obj', {})
        }
        enqueued_task_id = await queue_manager.enqueue_request(
            endpoint="/resume_task",
            data=task_data
        )
        return {"task_id": enqueued_task_id}
    else:
        # Process the task resume immediately (called by QueueManager)
        LOGGER.info(f'Processing task resume for task_response_id: {request.task_response_id}')
        try:
            # Retrieve the original task response
            task_response = await db_app.get_entity_from_db('task_responses', request.task_response_id)
            if not task_response:
                raise HTTPException(
                    status_code=404,
                    detail=f"Task response with ID {request.task_response_id} not found"
                )

            # Convert to TaskResponse object
            original_response = TaskResponse(**task_response)

            # Validate task response is in a resumable state
            if original_response.status != "pending":
                raise HTTPException(
                    status_code=400,
                    detail=f"Task response is not in a resumable state. Current status: {original_response.status}"
                )

            # Get the original task
            task_id = original_response.task_id
            task = await db_app.get_tasks(task_id)
            if not task or not task.get(task_id):
                raise HTTPException(
                    status_code=404,
                    detail=f"Original task with ID {task_id} not found"
                )
            task: AliceTask = task[task_id]

            # Get API manager
            api_manager: APIManager = await db_app.api_setter()
        
            # Combine original inputs with any additional inputs
            inputs = original_response.task_inputs or {}
            # TODO: Add option to pass additional inputs on restart on the frontend
            inputs.update(request.additional_inputs)
            inputs.update({'user_data': db_app.user_data.get('user_obj', {})})
            temp_task_response = original_response.model_copy()
            temp_task_response.task_inputs = inputs

            # Resume task execution
            LOGGER.debug(f'Resuming task execution for task: {task.task_name}')
            LOGGER.debug(f'Original response: {original_response.model_dump()}')
            LOGGER.debug(f'Combined inputs: {inputs}')

            result = await task.run_from_task_response(
                task_response=temp_task_response,
                api_manager=api_manager,
            )

            if not result:
                raise ValueError(f"Task resumption failed for task response ID {request.task_response_id}")

            # Store new response in database
            LOGGER.debug(f'Resume result: {result.model_dump()}')
            result.id = request.task_response_id
            db_result = await db_app.update_entity_in_db(
                'task_responses',
                result.id,
                result.model_dump(by_alias=True)
            )

            updated_ref = await db_app.get_entity_from_db('task_responses', db_result['_id'])
            return TaskResponse(**updated_ref).model_dump()

        except HTTPException:
            raise
        except Exception as e:
            import traceback
            LOGGER.error(f'Error: {e}\nTraceback: {traceback.format_exc()}')

            # Create failure response
            result = TaskResponse(
                task_id=original_response.task_id if 'original_response' in locals() else None,
                task_name=task.task_name if 'task' in locals() else "Unknown",
                task_description=task.task_description if 'task' in locals() else "Task resumption failed",
                status="failed",
                result_code=1,
                task_outputs=None,
                task_inputs=inputs if 'inputs' in locals() else {},
                result_diagnostic=str(f'Error: {e}\nTraceback: {traceback.format_exc()}'),
                usage_metrics=None,
                execution_history=None
            )

            updated_ref = await db_app.create_entity_in_db('task_responses', result.model_dump(by_alias=True))
            return result.model_dump()
