import sys
import asyncio
from pathlib import Path
current_dir = Path(__file__).parent.absolute()
parent_dir = current_dir.parent
if parent_dir not in sys.path:
    sys.path.insert(0, str(parent_dir))

from workflow.util.logger import LOGGER
from workflow.db_app import DB_STRUCTURE
from workflow.core import DataCluster, RetrievalTask, TaskResponse
from workflow.test import create_virtual_database, api_setter
from test_text_splitter import *
from workflow.test.test_data import data_cluster
from workflow.test.test_utils import TestOutputHandler, TestOutputConfig

inputs = {
    "user_data": {
        "name": "Alice",
        "email": "alice@example.com"
    },
    "prompt": "Best way to create agentic workflows"
}

async def main() -> TaskResponse:
    # Database initialization
    db = await create_virtual_database(DB_STRUCTURE)
    LOGGER.info("Database initialization complete:")
    
    # API Manager setup
    apis = db.entity_obj_key_map["apis"]
    api_list = [apis[api] for api in apis]
    api_manager = api_setter(api_list)
    LOGGER.info(f"API Manager: {api_manager}")
    
    # Retrieval Task setup
    tasks = db.entity_obj_key_map["tasks"]
    retrieval_task = tasks["retrieval_task"]
    if not isinstance(retrieval_task, RetrievalTask):
        raise ValueError("Retrieval task is not of type RetrievalTask")
    LOGGER.info(f"Retrieval Task: {retrieval_task}")
    
    # Data Cluster setup
    data_cluster_new: DataCluster = DataCluster(**data_cluster)
    retrieval_task.data_cluster = data_cluster_new
    
    # Run task
    return await retrieval_task.run(api_manager=api_manager, **inputs)

if __name__ == "__main__":
    # Configure output handling
    config = TestOutputConfig(
        output_dir=Path("test_outputs"),
        format="json",
        create_timestamp_dir=True,
        pretty_print=True
    )
    output_handler = TestOutputHandler(config)
    
    # Run the async main function
    task_output = asyncio.run(main())
    
    # Save the output using the handler
    output_path = output_handler.save_output(
        data=task_output.model_dump(),
        filename="retrieval_task_output"
    )
    LOGGER.info(f"Test output saved to: {output_path}")