from typing import Union
from workflow_logic.core.data_structures.references import References
from workflow_logic.core.data_structures.file_reference import FileReference, FileContentReference
from workflow_logic.core.data_structures.task_response import TaskResponse
from workflow_logic.core.data_structures.message import MessageDict
from workflow_logic.core.data_structures.search_result import SearchResult
from workflow_logic.db_app.app import BackendAPI
from workflow_logic.util import LOGGER

async def create_or_update_file_reference(db_app: BackendAPI, file_ref: FileContentReference) -> FileReference:
    if file_ref.id:
        # Update existing file reference
        updated_ref = await db_app.update_file_reference(file_ref)
        return FileReference(**{**file_ref.model_dump(exclude={'content'}), 'id': updated_ref.id})
    else:
        # Create new file reference
        new_ref = await db_app.create_entity_in_db('files', file_ref.model_dump(exclude={'id'}))
        LOGGER.info(f'Created new file reference: {new_ref}')
        return FileReference(**new_ref)

async def create_or_update_task_response(db_app: BackendAPI, task_response: TaskResponse) -> TaskResponse:
    if task_response.id:
        # Update existing task response
        updated_response = await db_app.update_task_response(task_response)
        return updated_response
    else:
        # Create new task response
        new_response = await db_app.store_task_response(task_response)
        LOGGER.info(f'Created new task response: {new_response}')
        return new_response.retrieve_task_response()

async def create_or_update_message(db_app: BackendAPI, message: MessageDict) -> MessageDict:
    if message.id:
        # Update existing message
        updated_message = await db_app.update_message(message)
        return updated_message
    else:
        # Create new message
        new_message = await db_app.create_entity_in_db('messages', message.model_dump(exclude={'id'}))
        LOGGER.info(f'Created new message: {new_message}')
        return MessageDict(**new_message)

async def process_search_result(db_app: BackendAPI, search_result: SearchResult) -> SearchResult:
    # For now, we'll assume search results don't need to be stored separately
    return search_result

async def process_string_output(db_app: BackendAPI, string_output: str) -> str:
    # For now, we'll assume string outputs don't need special processing
    return string_output

async def check_references(references: References, db_app: BackendAPI) -> References:
    LOGGER.info(f'Checking references')

    async def process_reference(ref: Union[MessageDict, FileReference, FileContentReference, TaskResponse, SearchResult, str]):
        if isinstance(ref, FileContentReference):
            return await create_or_update_file_reference(db_app, ref)
        elif isinstance(ref, TaskResponse):
            ref.references = await check_references(ref.references, db_app)
            processed_task_response = await create_or_update_task_response(db_app, ref)
            return processed_task_response
        elif isinstance(ref, MessageDict):
            ref.references = await check_references(ref.references, db_app)
            processed_message = await create_or_update_message(db_app, ref)
            return processed_message
        elif isinstance(ref, SearchResult):
            return await process_search_result(db_app, ref)
        elif isinstance(ref, str):
            return await process_string_output(db_app, ref)
        elif isinstance(ref, FileReference):
            LOGGER.info(f'File reference detected: {ref.id}')
            return ref
        else:
            LOGGER.warning(f'Unknown reference type: {type(ref)}')
            return ref

    for ref_type, ref_list in references.__dict__.items():
        if ref_list is not None:
            processed_refs = []
            for ref in ref_list:
                processed_ref = await process_reference(ref)
                processed_refs.append(processed_ref)
            setattr(references, ref_type, processed_refs)

    return references

# Main function to check task response references
async def check_task_response_references(task_response: TaskResponse, db_app: BackendAPI) -> TaskResponse:
    LOGGER.info(f'Checking references for task response: {task_response.task_name}')
   
    # Process the references
    task_response.references = await check_references(task_response.references, db_app)
   
    return task_response

async def check_message_references(message: MessageDict, db_app: BackendAPI) -> MessageDict:
    LOGGER.info(f'Checking references for message: {message.id}')
   
    # Process the references
    message.references = await check_references(message.references, db_app)
   
    # Create or update the message with complete references
    return message
