from typing import Union
from workflow_logic.core.data_structures import TaskResponse, MessageDict, FileReference, FileContentReference, OutputInterface, DatabaseTaskResponse
from workflow_logic.db_app.app.db import BackendAPI
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
    
async def create_or_update_message(db_app: BackendAPI, message: MessageDict) -> MessageDict:
    if message.id:
        # Update existing message
        updated_message = await db_app.update_entity_in_db('messages', message.id, message.model_dump(exclude={'id'}))
        return MessageDict(**updated_message)
    else:
        # Create new message
        new_message = await db_app.create_entity_in_db('messages', message.model_dump(exclude={'id'}))
        LOGGER.debug(f'Created new message: {new_message}')
        return MessageDict(**new_message)

async def check_task_response_references(task_response: TaskResponse, db_app: BackendAPI) -> TaskResponse:
    LOGGER.info(f'Checking references for task response: {task_response.task_name}')
    async def process_content(content):
        if isinstance(content, list):
            for i, item in enumerate(content):
                content[i] = await process_item(item)
        elif isinstance(content, dict):
            for key, value in content.items():
                content[key] = await process_item(value)
        elif isinstance(content, OutputInterface):
            content.content = await process_content(content.content)
        return content

    async def process_item(item):
        LOGGER.info(f'Processing item: {type(item)}')
        if isinstance(item, FileContentReference):
            return await create_or_update_file_reference(db_app, item)
        elif isinstance(item, TaskResponse):
            return await check_task_response_references(item, db_app)
        elif isinstance(item, MessageDict):
            item.references = [await process_item(ref) for ref in item.references]
            item.task_responses = [await check_task_response_references(task_resp, db_app) for task_resp in item.task_responses]
            item = await create_or_update_message(db_app, item)
        elif isinstance(item, (list, dict, OutputInterface)):
            return await process_content(item)
        elif isinstance(item, FileReference):
            LOGGER.info(f'File reference detected: {item.id}')
        return item

    if task_response.task_content:
        LOGGER.info(f'Processing task content for task response: {type(task_response.task_content)}')
        task_response.task_content = await process_content(task_response.task_content)
    
    if not task_response.id:
        # Create new task response
        new_task_response = await db_app.store_task_response(DatabaseTaskResponse(**task_response.model_dump(exclude={'id'})))
        LOGGER.info(f'Created new task response: {new_task_response}')
        return new_task_response.retrieve_task_response()
    
    return task_response