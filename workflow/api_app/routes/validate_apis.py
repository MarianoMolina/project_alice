from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, TypedDict, Literal, Union
from workflow.api_app.util.dependencies import get_db_app, get_queue_manager
from workflow.util import LOGGER

router = APIRouter()

class ValidationRequest(BaseModel):
    id: str
    
class TaskValidationResult(TypedDict):
    task_name: str
    status: Literal["valid", "warning"]
    warnings: List[str]
    child_tasks: List['TaskValidationResult']

class ChatValidationResult(TypedDict):
    chat_name: str
    status: Literal["valid", "warning"]
    warnings: List[str]
    llm_api: Literal["valid", "not_found", "invalid"]
    agent_tools: List[TaskValidationResult]
    retrieval_tools: List[TaskValidationResult]
    
@router.post("/validate_chat_apis")
async def validate_chat_apis(
    request: ValidationRequest,
    db_app=Depends(get_db_app),
    queue_manager=Depends(get_queue_manager),
    enqueue: bool = True
) -> dict:
    """
    Validate APIs for a specific chat.

    This endpoint retrieves the chat data and performs deep API validation checks.

    Args:
        request (ValidationRequest): Request containing chat ID
        db_app: The database application instance (injected dependency)
        queue_manager: The queue manager instance (injected dependency)
        enqueue: Whether to enqueue the validation (default: True)

    Returns:
        dict: Validation results including API status and warnings

    Raises:
        HTTPException: If chat is not found (404) or other errors occur
    """
    if enqueue:
        LOGGER.info(f'Enqueuing chat API validation for chat_id: {request.id}')
        task_data = {
            "id": request.id
        }
        enqueued_task_id = await queue_manager.enqueue_request(
            endpoint="/validate_chat_apis",
            data=task_data
        )
        return {"task_id": enqueued_task_id}
    else:
        # Process validation immediately (called by QueueManager)
        LOGGER.info(f'Processing chat API validation for chat_id: {request.id}')
        chat_data = await db_app.get_chat(request.id)
        if not chat_data:
            raise HTTPException(status_code=404, detail="Chat not found")

        # Retrieve API manager
        api_manager = await db_app.api_setter()

        # Perform deep API validation check
        validation_result: ChatValidationResult = chat_data.deep_validate_required_apis(api_manager)
        LOGGER.debug(f'Chat API Validation Result: {validation_result}')

        return validation_result

@router.post("/validate_task_apis")
async def validate_task_apis(
    request: ValidationRequest,
    db_app=Depends(get_db_app),
    queue_manager=Depends(get_queue_manager),
    enqueue: bool = True
) -> dict:
    """
    Validate APIs for a specific task.

    This endpoint retrieves the task data and performs deep API validation checks.

    Args:
        request (ValidationRequest): Request containing task ID
        db_app: The database application instance (injected dependency)
        queue_manager: The queue manager instance (injected dependency)
        enqueue: Whether to enqueue the validation (default: True)

    Returns:
        dict: Validation results including API status and warnings

    Raises:
        HTTPException: If task is not found (404) or other errors occur
    """
    if enqueue:
        LOGGER.info(f'Enqueuing task API validation for task_id: {request.id}')
        task_data = {
            "id": request.id
        }
        enqueued_task_id = await queue_manager.enqueue_request(
            endpoint="/validate_task_apis",
            data=task_data
        )
        return {"task_id": enqueued_task_id}
    else:
        # Process validation immediately (called by QueueManager)
        LOGGER.info(f'Processing task API validation for task_id: {request.id}')
        task = await db_app.get_task(request.id)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task with ID {request.id} not found")

        # Retrieve API manager
        api_manager = await db_app.api_setter()

        # Perform deep API validation check
        validation_result: TaskValidationResult = task.deep_validate_required_apis(api_manager)
        LOGGER.debug(f'Task API Validation Result: {validation_result}')

        return validation_result