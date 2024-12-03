import sys, asyncio, random
from pathlib import Path
current_dir = Path(__file__).parent.absolute()
parent_dir = current_dir.parent
if parent_dir not in sys.path:
    sys.path.insert(0, str(parent_dir))

from typing import List, Tuple

from workflow.util.logger import LOGGER
from workflow.db_app import DB_STRUCTURE
from workflow.core import DataCluster, RetrievalTask, TaskResponse
from workflow.test import create_virtual_database, api_setter
from workflow.test.test_data import data_cluster, full_string
from workflow.test.test_utils import TestOutputHandler, TestOutputConfig
from workflow.util.text_splitters import SemanticTextSplitter, TextSplitter, SplitterType

inputs = {
    "user_data": {
        "name": "Alice",
        "email": "alice@example.com"
    },
    "prompt": "Best way to create agentic workflows",
    "max_results": 2,
}

async def run_retrieval_task() -> TaskResponse:
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

class DummyEmbeddingGenerator:
    def __init__(self, vector_size: int = 768, seed: int = 42):
        self.vector_size = vector_size
        random.seed(seed)
        
    async def generate_embedding(self, inputs: List[str]) -> List[List[float]]:
        # Generate deterministic vectors based on input strings
        embeddings = []
        for text in inputs:
            # Use text hash as seed for reproducibility
            random.seed(hash(text))
            vector = [random.uniform(-1, 1) for _ in range(self.vector_size)]
            # Normalize vector
            magnitude = sum(x * x for x in vector) ** 0.5
            vector = [x / magnitude for x in vector]
            embeddings.append(vector)
        return embeddings

async def run_text_splitters(data: str) -> Tuple[List[str], List[str]]:
    splitter = TextSplitter()
    chunks = splitter.split_text(data)
    LOGGER.info(f"Text Splitter: {chunks}")
    
    semantic_splitter = SemanticTextSplitter()
    semantic_chunks = await semantic_splitter.split_text(data, embedding_generator=DummyEmbeddingGenerator())
    LOGGER.info(f"Semantic Text Splitter: {semantic_chunks}")

    return chunks, semantic_chunks

if __name__ == "__main__":
    # Configure output handling
    config = TestOutputConfig(
        output_dir=Path("test_outputs"),
        format="json",
        create_timestamp_dir=True,
        pretty_print=True
    )
    output_handler = TestOutputHandler(config)

    # Run the text splitters
    # chunk_output, semantic_chunk_output = asyncio.run(run_text_splitters(full_string))
    # # create tuples of the string and its length
    # chunk_output = [(chunk, len(chunk)) for chunk in chunk_output]
    # semantic_chunk_output = [(chunk, len(chunk)) for chunk in semantic_chunk_output]
    # output_path = output_handler.save_output(
    #     data={
    #         "chunk_output": chunk_output,
    #         "semantic_chunk_output": semantic_chunk_output
    #     },
    #     filename="text_splitter_output"
    # )
    # LOGGER.info(f"Test output saved to: {output_path}")

    
    # Run the async main function
    task_output = asyncio.run(run_retrieval_task())
    
    # Save the output using the handler
    output_path = output_handler.save_output(
        data=task_output.model_dump(),
        filename="retrieval_task_output"
    )
    LOGGER.info(f"Test output saved to: {output_path}")