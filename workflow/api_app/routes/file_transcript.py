from fastapi import APIRouter, Depends, HTTPException
from workflow.api_app.util.dependencies import get_db_app, get_queue_manager
from workflow.api_app.util.utils import FileTranscriptRequest
from workflow.util import LOGGER, get_traceback
from workflow.core import FileReference, AliceAgent

router = APIRouter()

@router.post("/file_transcript")
async def generate_file_transcript(
    request: FileTranscriptRequest, 
    db_app=Depends(get_db_app),
    queue_manager=Depends(get_queue_manager),
    enqueue: bool = True
):
    if enqueue:
        LOGGER.info(f'Enqueuing file transcript generation for file_id: {request.file_id}')
        task_data = {
            "file_id": request.file_id,
            "agent_id": request.agent_id,
            "chat_id": request.chat_id
        }
        enqueued_task_id = await queue_manager.enqueue_request(
            endpoint=f"/file_transcript",
            data=task_data
        )
        return {"task_id": enqueued_task_id}
    else:
        # Process the file transcript generation immediately
        LOGGER.info(f'Processing file transcript for file_id: {request.file_id}')
        # Retrieve the file reference
        file_ref_dict = await db_app.get_file_reference(request.file_id)
        if not file_ref_dict or not file_ref_dict.get(request.file_id):
            raise HTTPException(status_code=404, detail="File not found")

        file_ref: FileReference = file_ref_dict[request.file_id]

        LOGGER.info(f"File reference retrieved in generate_file_transcript: {file_ref}")

        # Check if file already has a transcript
        if file_ref.transcript:
            LOGGER.info(f"File already has a transcript: {file_ref.transcript}")

        # TODO: Retrieve the user agent to use as default
        # Get or create an agent
        if request.agent_id:
            agent_obj = await db_app.get_entity_from_db("agents", request.agent_id)
            try:
                agent = AliceAgent(**agent_obj)
            except Exception as e:
                LOGGER.error(f"Error creating agent from database: {str(e)}{get_traceback()}")
                agent = None
            if not agent:
                raise HTTPException(status_code=404, detail="Agent not found")
        elif request.chat_id:
            chat = await db_app.get_chat(request.chat_id)
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
