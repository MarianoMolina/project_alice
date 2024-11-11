from typing import Union, Any
from workflow.core.data_structures.references import References
from workflow.core.data_structures.file_reference import FileReference, FileContentReference
from workflow.core.data_structures.task_response import TaskResponse
from workflow.core.data_structures.message import MessageDict
from workflow.core.data_structures.url_reference import URLReference
from workflow.db_app.app import BackendAPI
from workflow.util import LOGGER

async def create_or_update_file_reference(db_app: BackendAPI, file_ref: FileContentReference) -> FileReference:
    if file_ref.id:
        # Update existing file reference
        updated_ref: dict[Any, FileReference] = await db_app.update_entity_in_db('files', file_ref)
        return FileReference(**updated_ref)
    else:
        # Create new file reference
        new_ref = await db_app.create_entity_in_db('files', file_ref.model_dump(by_alias=True))
        LOGGER.debug(f'Created new file reference: {new_ref}')
        return FileReference(**new_ref)

async def create_or_update_task_response(db_app: BackendAPI, task_response: TaskResponse) -> TaskResponse:
    if task_response.id:
        # Update existing task response
        updated_response = await db_app.update_entity_in_db('task_responses', task_response)
        return TaskResponse(**updated_response)
    else:
        # Create new task response
        new_response = await db_app.create_entity_in_db('task_responses', task_response.model_dump(by_alias=True))
        LOGGER.debug(f'Created new task response: {new_response}')
        return new_response.retrieve_task_response()

async def create_or_update_message(db_app: BackendAPI, message: MessageDict) -> MessageDict:
    if message.id:
        # Update existing message
        updated_message = await db_app.update_entity_in_db('messages', message)
        return MessageDict(**updated_message)
    else:
        # Create new message
        new_message = await db_app.create_entity_in_db('messages', message.model_dump(by_alias=True))
        LOGGER.debug(f'Created new message: {new_message}')
        return MessageDict(**new_message)

async def process_search_result(db_app: BackendAPI, search_result: URLReference) -> URLReference:
    if search_result.id:
        # Update existing search result
        updated_search_result = await db_app.update_entity_in_db('urlreferences', search_result)
        return URLReference(**updated_search_result)
    else:
        # Create new search result
        new_search_result = await db_app.create_entity_in_db('urlreferences', search_result.model_dump(by_alias=True))
        LOGGER.debug(f'Created new search result: {new_search_result}')
        return URLReference(**new_search_result)

async def process_string_output(db_app: BackendAPI, string_output: str) -> str:
    # For now, we'll assume string outputs don't need special processing
    return string_output

async def check_references(references: References, db_app: BackendAPI) -> References:
    LOGGER.debug(f'Checking references')

    async def process_reference(ref: Union[MessageDict, FileReference, FileContentReference, TaskResponse, URLReference, str]):
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
        elif isinstance(ref, URLReference):
            LOGGER.debug(f'URL reference detected: {ref}')
            return await process_search_result(db_app, ref)
        elif isinstance(ref, str):
            return await process_string_output(db_app, ref)
        elif isinstance(ref, FileReference):
            LOGGER.debug(f'File reference detected: {ref}')
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

