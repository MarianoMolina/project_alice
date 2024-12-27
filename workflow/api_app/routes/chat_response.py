from fastapi import APIRouter, HTTPException, Depends
from workflow.api_app.util.utils import deep_api_check, ChatResponseRequest
from workflow.api_app.util.dependencies import get_db_app, get_queue_manager
from workflow.util import LOGGER

router = APIRouter()

@router.post("/chat_response")
async def chat_response(
    request: ChatResponseRequest,
    db_app=Depends(get_db_app),
    queue_manager=Depends(get_queue_manager),
    enqueue: bool = True
) -> dict:
    """
    Generate and store a response for a specific chat.

    This endpoint retrieves the chat data, performs API checks, generates a response,
    and stores the new messages in the database.

    Args:
        chat_id (str): The ID of the chat to generate a response for.
        db_app (BackendAPI): The database application instance (injected dependency).

    Returns:
        bool: True if responses were generated and stored successfully, False otherwise.

    Raises:
        HTTPException: If the chat is not found (404) or other errors occur during processing.

    Note:
        This function performs deep API checks and logs warnings if any are found.
        It also serializes and stores each generated message individually.
    """
    if enqueue:
        LOGGER.info(f'Enqueuing chat response for chat_id: {request.chat_id}')
        task_data = {
            "chat_id": request.chat_id
        }
        enqueued_task_id = await queue_manager.enqueue_request(
            endpoint=f"/chat_response",
            data=task_data
        )
        return {"task_id": enqueued_task_id}
    else:
        # Process the chat response immediately (called by QueueManager)
        LOGGER.info(f'Processing chat response for chat_id: {request.chat_id}')
        try:
            chat_data = await db_app.get_chat(request.chat_id)
            if not chat_data:
                raise HTTPException(status_code=404, detail="Chat not found")

            LOGGER.debug(f'Chat_data: {chat_data}')

            # Retrieve API manager
            api_manager = await db_app.api_setter()

            # Perform deep API availability check
            api_check_result = await deep_api_check(chat_data, api_manager)
            LOGGER.debug(f'API Check Result: {api_check_result}')

            if api_check_result["status"] == "warning":
                LOGGER.warning(f'API Warning: {api_check_result["warnings"]}')

            responses = await chat_data.generate_response(api_manager, user_data=db_app.user_data.get('user_obj'))

            LOGGER.debug(f'Responses: {responses}')

            # Store messages and task results in order
            if responses:
                for response in responses:
                    stored_chat = await db_app.store_chat_message(request.chat_id, response)
                    if not stored_chat:
                        LOGGER.error(f"Failed to store message: {response} in chat_id {request.chat_id}")

                LOGGER.debug(f'Stored messages: {responses}')
                return {"status": "success"}

            return {"status": "no responses generated"}
        except Exception as e:
            LOGGER.error(f'Error processing chat response: {e}', exc_info=True)
            return {"status": "error", "message": "An internal error has occurred. Please try again later."}