from fastapi import APIRouter, HTTPException, Depends
from workflow.api_app.util.utils import deep_api_check
from workflow.api_app.util.dependencies import get_db_app
from workflow.db_app.app import BackendAPI
from workflow.util import LOGGER

router = APIRouter()

@router.post("/chat_response/{chat_id}")
async def chat_response(chat_id: str, db_app: BackendAPI = Depends(get_db_app)) -> bool:
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
    LOGGER.info(f'Generating chat response for id {chat_id}')
    chat_data = await db_app.get_chats(chat_id)
    if not chat_data:
        raise HTTPException(status_code=404, detail="Chat not found")
   
    LOGGER.debug(f'Chat_data: {chat_data}')
   
    # Retrieve API manager
    api_manager = await db_app.api_setter()
   
    # Perform deep API availability check
    api_check_result = await deep_api_check(chat_data[chat_id], api_manager)
    LOGGER.info(f'API Check Result: {api_check_result}')
   
    if api_check_result["status"] == "warning":
        LOGGER.warning(f'API Warning: {api_check_result["warnings"]}')
   
    responses = await chat_data[chat_id].generate_response(api_manager, user_data=db_app.user_data.get('user_obj'))
   
    LOGGER.debug(f'Responses: {responses}')
   
    # Store messages and task results in order
    if responses:
        for response in responses:
            stored_chat = await db_app.store_chat_message(chat_id, response)
            if not stored_chat:
                LOGGER.error(f"Failed to store message: {response} in chat_id {chat_id}")
       
        LOGGER.debug(f'Stored messages: {responses}')
        return True
   
    return False