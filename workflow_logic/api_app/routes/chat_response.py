from fastapi import APIRouter, HTTPException, Depends
from workflow_logic.core.api.api_utils import deep_api_check
from workflow_logic.util.logging_config import LOGGER
from workflow_logic.api_app.util.dependencies import get_db_app

router = APIRouter()

@router.post("/chat_response/{chat_id}")
async def chat_response(chat_id: str, db_app=Depends(get_db_app)) -> bool:
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
   
    responses = await chat_data[chat_id].generate_response(api_manager)
   
    LOGGER.debug(f'Responses: {responses}')
   
    # Store messages and task results in order
    if responses:
        for response in responses:
            stored_chat = await db_app.store_chat_message(chat_id, response)
            if not stored_chat:
                LOGGER.error(f"Failed to store message: {response} in chat_id {chat_id}")
       
        LOGGER.info(f'Stored messages: {responses}')
        return True
   
    return False