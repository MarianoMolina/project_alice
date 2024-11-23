from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from workflow.api_app.util.dependencies import get_db_app
from workflow.db_app.app import BackendAPI
from workflow.core.data_structures import UserInteraction, InteractionOwnerType
from workflow.util import LOGGER

router = APIRouter()

class ChatResumeRequest(BaseModel):
    """Request model for resuming a chat interaction."""
    interaction_id: str

@router.post("/chat_resume")
async def chat_resume(
    request: ChatResumeRequest,
    db_app: BackendAPI = Depends(get_db_app)
) -> bool:
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
    LOGGER.info(f'Resuming chat with interaction {request.interaction_id}')

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
    chat_data = await db_app.get_chats(chat_id)
    if not chat_data:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    LOGGER.debug(f'Retrieved chat data: {chat_data}')
    
    # Get API manager
    api_manager = await db_app.api_setter()
    
    try:
        # Generate new messages from the interaction
        new_message = await chat_data[chat_id].continue_user_interaction(
            api_manager,
            user_interaction
        )
        msg_id = new_message.id
        
        if not new_message:
            LOGGER.warning("No new messages generated from interaction")
            return False
            
        LOGGER.debug(f'Updated message: {new_message}')
        
        # Update the chat in the database
        updated_msg = await db_app.update_entity_in_db('messages', msg_id, new_message.model_dump(by_alias=True))
        if not updated_msg:
            LOGGER.error(f"Failed to update msg {msg_id} in database - {new_message}")
            return False
            
        LOGGER.info(f'Successfully resumed and updated chat {chat_id}')
        return True
        
    except Exception as e:
        import traceback
        error_msg = f"Error processing chat resume: {str(e)}\n{traceback.format_exc()}"
        LOGGER.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)