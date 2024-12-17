from fastapi import APIRouter, Depends, HTTPException, Request
from workflow.api_app.util.utils import deep_api_check
from workflow.api_app.util.dependencies import get_db_app, get_queue_manager
from workflow.util import LOGGER
from workflow.core.data_structures import UserInteraction, InteractionOwnerType
from workflow.api_app.util.utils import ChatResumeRequest

router = APIRouter()

@router.post("/chat_resume")
async def chat_resume(
    request: ChatResumeRequest,
    db_app=Depends(get_db_app),
    queue_manager=Depends(get_queue_manager),
    enqueue: bool = True
) -> dict:
    """
    Resume a chat by processing a completed user interaction.
    
    This endpoint:
    1. Validates the chat exists
    2. Processes the user interaction to generate new messages
    3. Inserts the new messages after the original interaction message
    4. Updates the chat in the database
    
    Args:
        chat_id (str): The ID of the chat to resume
        request (ChatResumeRequest): The resume request containing the interaction
        db_app (BackendAPI): The database application instance (injected dependency)
        
    Returns:
        bool: True if chat was resumed and updated successfully
        
    Raises:
        HTTPException: If chat not found or other errors occur during processing
    """
    if enqueue:
        LOGGER.info(f'Enqueuing chat resume for interaction_id: {request.interaction_id}')
        task_data = {
            "interaction_id": request.interaction_id
        }
        enqueued_task_id = await queue_manager.enqueue_request(
            endpoint="/chat_resume",
            data=task_data
        )
        return {"task_id": enqueued_task_id}
    else:
        # Process the chat resume immediately (called by QueueManager)
        LOGGER.info(f'Processing chat resume for interaction_id: {request.interaction_id}')

        interaction_id = request.interaction_id
        if not interaction_id:
            raise HTTPException(
                status_code=400,
                detail="Interaction ID is required to resume a chat"
            )
        interaction_data = await db_app.get_entity_from_db('user_interactions', interaction_id)
        user_interaction: UserInteraction = None
        try:
            user_interaction = UserInteraction(**interaction_data)
            if user_interaction.owner.type != InteractionOwnerType.CHAT:
                raise ValueError("Interaction owner is not a chat")
        except Exception as e:
            import traceback
            error_msg = f"Error processing chat resume - user interaction: {str(e)}\n{traceback.format_exc()}"
            LOGGER.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        chat_id = user_interaction.owner.id

        # Get chat data
        chat_data = await db_app.get_chat(chat_id)
        if not chat_data:
            raise HTTPException(status_code=404, detail="Chat not found")

        LOGGER.debug(f'Retrieved chat data: {chat_data}')

        # Get API manager
        api_manager = await db_app.api_setter()
        api_check_result = await deep_api_check(chat_data, api_manager)
        LOGGER.debug(f'API Check Result: {api_check_result}')

        if api_check_result["status"] == "warning":
            LOGGER.warning(f'API Warning: {api_check_result["warnings"]}')
        try:
            # Generate new messages from the interaction
            new_message = await chat_data.continue_user_interaction(
                api_manager,
                user_interaction
            )
            msg_id = new_message.id

            if not new_message:
                LOGGER.warning("No new messages generated from interaction")
                return {"status": "no messages generated"}

            LOGGER.debug(f'Updated message: {new_message}')

            # Update the message in the database
            updated_msg = await db_app.update_entity_in_db('messages', msg_id, new_message.model_dump(by_alias=True))
            if not updated_msg:
                LOGGER.error(f"Failed to update msg {msg_id} in database - {new_message}")
                return {"status": "failed to update message"}

            LOGGER.info(f'Successfully resumed and updated chat {chat_id}')
            return {"status": "success"}

        except Exception as e:
            import traceback
            error_msg = f"Error processing chat resume: {str(e)}\n{traceback.format_exc()}"
            LOGGER.error(error_msg)
            return {"status": "error", "error": error_msg}
