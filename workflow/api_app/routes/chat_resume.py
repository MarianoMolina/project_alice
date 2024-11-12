from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from workflow.api_app.util.dependencies import get_db_app
from workflow.db_app.app import BackendAPI
from workflow.core.data_structures import UserInteraction, MessageDict
from workflow.util import LOGGER

router = APIRouter()

class ChatResumeRequest(BaseModel):
    """Request model for resuming a chat interaction."""
    chat_id: str
    interaction: UserInteraction

@router.post("/chat_resume/{chat_id}")
async def chat_resume(
    chat_id: str,
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
    LOGGER.info(f'Resuming chat for id {chat_id} with interaction {request.interaction}')
    
    # Validate chat_id matches the interaction owner
    if request.interaction.owner.id != chat_id:
        raise HTTPException(
            status_code=400,
            detail="Interaction owner ID does not match the specified chat ID"
        )
    
    # Get chat data
    chat_data = await db_app.get_chats(chat_id)
    if not chat_data:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    LOGGER.debug(f'Retrieved chat data: {chat_data}')
    
    # Get API manager
    api_manager = await db_app.api_setter()
    
    try:
        # Generate new messages from the interaction
        new_messages = await chat_data[chat_id].continue_user_interaction(
            api_manager,
            request.interaction
        )
        
        if not new_messages:
            LOGGER.warning("No new messages generated from interaction")
            return False
            
        LOGGER.debug(f'Generated new messages: {new_messages}')
        
        # Find the index of the message containing the interaction
        messages = chat_data[chat_id].messages
        insert_index = None
        
        for i, message in enumerate(messages):
            if (message.references and 
                message.references.user_interactions and 
                any(ui.owner.id == request.interaction.owner.id for ui in message.references.user_interactions)):
                insert_index = i + 1
                break
                
        if insert_index is None:
            LOGGER.error("Could not find original interaction message")
            return False
            
        # Insert new messages after the interaction message
        messages[insert_index:insert_index] = new_messages
        
        # Update the chat in the database
        updated_chat = await db_app.update_chat(chat_id, chat_data[chat_id])
        if not updated_chat:
            LOGGER.error(f"Failed to update chat {chat_id} in database")
            return False
            
        LOGGER.info(f'Successfully resumed and updated chat {chat_id}')
        return True
        
    except Exception as e:
        import traceback
        error_msg = f"Error processing chat resume: {str(e)}\n{traceback.format_exc()}"
        LOGGER.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)