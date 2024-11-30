from typing import List
from pydantic import Field
from workflow.core.tasks.task import AliceTask
from workflow.core.agent.agent import AliceAgent
from workflow.core.data_structures import (
    FunctionParameters, ParameterDefinition, MessageDict, ApiType, References, NodeResponse, TasksEndCodeRouting
)
from workflow.core.api import APIManager
from workflow.util import LOGGER, get_traceback, Language

class EmbeddingTask(AliceTask):
    """
    A specialized task for generating text embeddings using AI embedding models.

    EmbeddingTask handles the generation of vector representations for text inputs,
    supporting both single strings and arrays of text. These embeddings can be used
    for semantic search, similarity comparisons, and other vector-based operations.

    Key Features:
    -------------
    * Embedding Generation:
        - Converts text to vector representations
        - Supports batch processing
        - Preserves text-vector relationships

    * Language Support:
        - Language-specific embedding generation
        - Automatic language detection
        - Consistent vector dimensionality

    Attributes:
    -----------
    agent : AliceAgent
        Agent configured with embedding model capabilities
        
    input_variables : FunctionParameters
        Accepts:
        - input (str): Text to generate embeddings for
        
    required_apis : List[ApiType]
        [ApiType.EMBEDDINGS]

    Example:
    --------
    ```python
    embedding_task = EmbeddingTask(
        agent=agent_with_embeddings,
        task_name="generate_embeddings",
        task_description="Generate text embeddings for semantic search"
    )
    
    response = await embedding_task.run(
        input="Sample text for embedding"
    )
    # Access embeddings through response.node_references[0].references.embeddings
    ```
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string",
                    description="The input text to get embeddings for. Can be a string or an array of strings."
                ),
            },
            required=["input"]
        )
    )
    required_apis: List[ApiType] = Field([ApiType.EMBEDDINGS], description="A list of required APIs for the task")
    start_node: str = Field(default='generate_embedding', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={
        'generate_embedding': {
            0: (None, False),
            1: ('generate_embedding', True),
        }
    }, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    async def execute_generate_embedding(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        input_text: str = kwargs.get('input', "")
        
        try:
            embedding_chunks = await self.agent.generate_embeddings(api_manager=api_manager, input=input_text, language=Language.TEXT)
            if not embedding_chunks or len(embedding_chunks) == 0:
                raise ValueError("No embeddings generated")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_embedding",
                exit_code=0,
                references=References(embeddings=embedding_chunks),
                execution_order=len(execution_history)
            )
        except Exception as e:
            LOGGER.error(f"Error in embedding generation: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_embedding",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Embedding generation failed: {str(e)}\n\n" + get_traceback(),
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )