from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict
from workflow.core.data_structures import FileType
from workflow.core.agent import AliceAgent
from workflow.core import AliceChat, FileReference
from workflow.api_app.util.dependencies import get_db_app
from workflow.util import LOGGER

router = APIRouter()

@router.post("/file_transcript/{file_id}")
async def generate_file_transcript(
    file_id: str,
    agent_id: Optional[str] = None,
    chat_id: Optional[str] = None,
    db_app = Depends(get_db_app)
):
    LOGGER.info(f"Generating transcript for file: {file_id}")
    # Retrieve the file reference
    file_ref_dict: Dict[str, FileReference] = await db_app.get_file_reference(file_id)
    if not file_ref_dict or not file_ref_dict[file_id]:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_ref: FileReference = file_ref_dict[file_id]
    
    LOGGER.info(f"File reference retrieved in generate_file_transcript: {file_ref}")

    # Check if file is not a text file and doesn't have an existing transcript
    if file_ref.transcript:
        # raise HTTPException(status_code=400, detail="File already has a transcript")
        LOGGER.info(f"File already has a transcript: {file_ref.transcript}")

    # Get or create an agent
    if agent_id:
        agent = await db_app.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
    elif chat_id:
        chat: AliceChat = await db_app.get_chat(chat_id)
        agent = chat.alice_agent if chat else None
        if not agent:
            raise HTTPException(status_code=404, detail="Chat Agent not found")
    else:
        agent = AliceAgent(name="DefaultTranscriptionAgent")

    # Get API manager
    api_manager = await db_app.api_setter()

    try:
        # Call the transcribe_file method
        transcript = await agent.transcribe_file(file_ref, api_manager)

        # Update the file reference with the new transcript
        file_ref.transcript = transcript
        await db_app.update_entity_in_db('files', file_ref.id, file_ref.model_dump(by_alias=True))

        return {"message": "Transcript generated successfully", "transcript": transcript.model_dump(by_alias=True)}
    except Exception as e:
        import traceback
        LOGGER.error(f"Error generating transcript: {str(e)}")
        LOGGER.error(f"{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to generate transcript")