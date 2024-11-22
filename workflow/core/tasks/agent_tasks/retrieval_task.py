import os
from typing import List, Dict, Any, Union, TypedDict, Tuple
from pydantic import Field, BaseModel
from workflow.core.tasks.task import AliceTask
from workflow.core.agent.agent import AliceAgent
from workflow.core.data_structures import (
    FunctionParameters,
    ParameterDefinition,
    MessageDict,
    ApiType,
    References,
    NodeResponse,
    TasksEndCodeRouting,
    references_model_map,
    FileContentReference,
    FileReference,
    Embeddable, 
    EmbeddingChunk,
    DataCluster
)
from workflow.core.api import APIManager
from workflow.util import LOGGER, cosine_similarity, Language, get_traceback

class ChunkedEmbedding(TypedDict):
    similarity: float
    reference_type: str
    reference: BaseModel
    embedding_chunk: EmbeddingChunk

class RetrievalTask(AliceTask):
    agent: AliceAgent = Field(..., description="The agent to use for the task")
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
                    type="string",
                    description="The input prompt text to retrieve embeddings for."
                ),
                "max_results": ParameterDefinition(
                    type="integer",
                    description="The maximum number of results to return.",
                    default=10
                ),
                "similarity_threshold": ParameterDefinition(
                    type="number",
                    description="The similarity threshold to consider.",
                    default=0.6
                ),
                "update_all": ParameterDefinition(
                    type="boolean",
                    description="Whether to update all items in the data cluster.",
                    default=False
                )
            },
            required=["prompt"]
        )
    )
    required_apis: List[ApiType] = Field(
        [ApiType.EMBEDDINGS], description="A list of required APIs for the task"
    )
    start_node: str = Field(
        default='ensure_embeddings_in_data_cluster',
        description="The name of the starting node"
    )
    node_end_code_routing: TasksEndCodeRouting = Field(
        default={
            'ensure_embeddings_in_data_cluster': {
                0: ('retrieve_relevant_embeddings', False),
                1: ('ensure_embeddings_in_data_cluster', True),
            },
            'retrieve_relevant_embeddings': {
                0: (None, False),
                1: ('retrieve_relevant_embeddings', True),
            }
        },
        description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code"
    )

    async def execute_ensure_embeddings_in_data_cluster(
        self,
        execution_history: List[NodeResponse],
        node_responses: List[NodeResponse],
        **kwargs
    ) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")

        if self.data_cluster is None:
            LOGGER.error("DataCluster cannot be None.")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="ensure_embeddings_in_data_cluster",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content="DataCluster cannot be None.",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

        try:
            update_all: bool = kwargs.get("update_all", False)
            updated_data_cluster = await self.ensure_embeddings_for_data_cluster(self.data_cluster, api_manager, update_all)
            self.data_cluster = updated_data_cluster
            return NodeResponse(
                parent_task_id=self.id,
                node_name="ensure_embeddings_in_data_cluster",
                exit_code=0,
                references=updated_data_cluster,
                execution_order=len(execution_history)
            )
        except Exception as e:
            LOGGER.error(f"Error in ensuring embeddings: {e} - Trackeback: {get_traceback()}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="ensure_embeddings_in_data_cluster",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Failed to ensure embeddings: {str(e)}\n\n" + get_traceback(),
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

    async def ensure_embeddings_for_data_cluster(
        self,
        data_cluster: DataCluster,
        api_manager: APIManager,
        update_all: bool = False
    ) -> DataCluster:
        """
        For each non-string and non-embedding object in data_cluster,
        ensure embeddings are available. Update the objects with embeddings if they are missing.
        """
        updated_data_cluster = DataCluster()
        fields_to_process = [field for field in references_model_map.keys()
                             if field not in ['embeddings']]
        
        LOGGER.debug(f"Fields to process: {fields_to_process}")

        for field_name in fields_to_process:
            items = getattr(data_cluster, field_name)
            if items:
                updated_items = await self.ensure_embeddings_for_items(items, api_manager, update_all)
                setattr(updated_data_cluster, field_name, updated_items)
        return updated_data_cluster

    async def ensure_embeddings_for_items(
        self,
        items: List[BaseModel],
        api_manager: APIManager,
        update_all: bool = False
    ) -> List[BaseModel]:
        """
        For a list of items, ensure each has embeddings.
        """
        updated_items = []
        for item in items:
            if not isinstance(item, Embeddable):
                continue  # Skip if the item doesn't have an embedding field
            if not item.embedding or update_all:
                # Need to generate embeddings
                content = self.get_item_content(item)
                language = self.get_item_language(item)
                embeddings_reference: List[EmbeddingChunk] = await self.agent.generate_embeddings(
                    api_manager=api_manager, input=content, language=language
                )
                if embeddings_reference:
                    item.embedding = embeddings_reference
                else:
                    raise ValueError(f"Failed to generate embeddings for item: {item}")
            updated_items.append(item)
        return updated_items
    
    def get_item_content(self, item: BaseModel) -> Union[str, List[str]]:
        """
        Extracts the content from the item for embedding generation.
        """
        if isinstance(item, FileReference) or isinstance(item, FileContentReference):
            if item.transcript and item.transcript.content:
                return item.transcript.content
            else:
                raise ValueError(f"No transcript content available for file: {item.filename}")
        elif hasattr(item, 'content') and isinstance(item.content, str):
            return item.content
        elif hasattr(item, 'text_content') and isinstance(item.text_content, str):
            return item.text_content
        else:
            raise ValueError(f"Cannot extract content from item: {item}")

    def get_item_language(self, item: BaseModel) -> Language:
        """
        Determines the language of the item for embedding generation.
        """
        if isinstance(item, FileReference) or isinstance(item, FileContentReference):
            extension = self.get_file_extension(item.filename)
            language = self.map_extension_to_language(extension)
            return language
        else:
            return Language.TEXT

    def get_file_extension(self, filename: str) -> str:
        """
        Extracts the file extension from the filename.
        """
        _, ext = os.path.splitext(filename)
        return ext.lower().lstrip('.')

    def map_extension_to_language(self, extension: str) -> Language:
        """
        Maps a file extension to a Language enum value.
        """
        extension_to_language = {
            'cpp': Language.CPP,
            'go': Language.GO,
            'java': Language.JAVA,
            'kt': Language.KOTLIN,
            'js': Language.JAVASCRIPT,
            'ts': Language.TYPESCRIPT,
            'php': Language.PHP,
            'proto': Language.PROTO,
            'py': Language.PYTHON,
            'rst': Language.RST,
            'rb': Language.RUBY,
            'rs': Language.RUST,
            'scala': Language.SCALA,
            'swift': Language.SWIFT,
            'md': Language.MARKDOWN,
            'tex': Language.LATEX,
            'html': Language.HTML,
            'sol': Language.SOL,
            'cs': Language.CSHARP,
            'cob': Language.COBOL,
            'c': Language.C,
            'lua': Language.LUA,
            'pl': Language.PERL,
            'hs': Language.HASKELL,
            'ex': Language.ELIXIR,
            'exs': Language.ELIXIR,
            'ps1': Language.POWERSHELL,
        }
        return extension_to_language.get(extension, Language.TEXT)

    async def execute_retrieve_relevant_embeddings(
        self,
        execution_history: List[NodeResponse],
        node_responses: List[NodeResponse],
        **kwargs
    ) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        prompt: str = kwargs.get('prompt', "")
        max_results: int = kwargs.get('max_results', 10)
        similarity_threshold: float = kwargs.get('similarity_threshold', 0.6)

        if self.data_cluster is None:
            LOGGER.error("DataCluster cannot be None.")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="retrieve_relevant_embeddings",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content="DataCluster cannot be None.",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

        try:
            LOGGER.debug(f"Retrieving embeddings for prompt: {prompt}")
            # Step 1: Create embedding for the prompt
            embedding_chunks: List[EmbeddingChunk] = await self.agent.generate_embeddings(
                api_manager=api_manager, input=prompt, language=Language.TEXT
            )
            if not embedding_chunks or len(embedding_chunks) == 0:
                raise ValueError("Failed to generate embedding for the prompt.")

            prompt_embedding_vector: List[float] = embedding_chunks[0].vector

            # Step 2: Retrieve top embeddings from data_cluster
            top_embeddings = self.retrieve_top_embeddings(
                prompt_embedding_vector, self.data_cluster, similarity_threshold, max_results
            )

            # Step 3: Prepare the References object to return
            embedding_chunks = self.prepare_result_references(top_embeddings)
            LOGGER.debug(f"Retrieved embeddings: {embedding_chunks}")

            return NodeResponse(
                parent_task_id=self.id,
                node_name="retrieve_relevant_embeddings",
                exit_code=0,
                references=References(embeddings=embedding_chunks),
                execution_order=len(execution_history)
            )

        except Exception as e:
            LOGGER.error(f"Error in retrieval task: {e} - Trackeback: {get_traceback()}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="retrieve_relevant_embeddings",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Retrieval failed: {str(e)} - Trackeback: {get_traceback()}",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

    def get_similarity_chunks_from_data_cluster(self, data_cluster: DataCluster, prompt_embedding: List[float]) -> List[ChunkedEmbedding]:
        embedding_chunks: List[Dict[str, Any]] = []
        fields_to_process = [field for field in references_model_map.keys()
                             if field not in ['embeddings']]
        for field_name in fields_to_process:
            items = getattr(data_cluster, field_name)
            if items:
                for item in items:
                    if hasattr(item, 'embedding') and item.embedding:
                        for embedding_chunk in item.embedding:
                            similarity = cosine_similarity(prompt_embedding, embedding_chunk.vector)
                            embedding_chunks.append({
                                'similarity': similarity,
                                'reference_type': field_name,
                                'reference': item,
                                'embedding_chunk': embedding_chunk
                            })
                    else:
                        LOGGER.debug(f"Item {item} has no embedding.")
        return embedding_chunks
    
    def filter_chunks_by_similarity_threshold(self, embedding_chunks: List[ChunkedEmbedding], similarity_threshold: float) -> List[ChunkedEmbedding]:
        return [chunk for chunk in embedding_chunks if chunk['similarity'] >= similarity_threshold]
    
    def get_final_embedding_chunks(self, embedding_chunks: List[ChunkedEmbedding], max_results: int, similarity_threshold: float) -> List[ChunkedEmbedding]:
        if len(embedding_chunks) <= max_results:
            return embedding_chunks
        else:
            filtered_chunks = self.filter_chunks_by_similarity_threshold(embedding_chunks, similarity_threshold)
            if len(filtered_chunks) <= max_results:
                LOGGER.debug(f"Found only {len(filtered_chunks)} matches for a max_result of {max_results}. Reducing threshold from {similarity_threshold}.")
                return self.get_final_embedding_chunks(embedding_chunks, max_results, similarity_threshold * 0.75)
            # Sort by similarity
            filtered_chunks.sort(key=lambda x: x['similarity'], reverse=True)
            # Return top N results
            return filtered_chunks[:max_results]
    
    def retrieve_top_embeddings(
        self,
        prompt_embedding: List[float],
        data_cluster: DataCluster,
        similarity_threshold: float,
        max_results: int
    ) -> List[ChunkedEmbedding]:
        """
        Compute cosine similarity between the prompt_embedding and each embedding in data_cluster.
        Return top embeddings that exceed the similarity threshold, up to max_results.
        """
        embedding_similarity_chunk: List[ChunkedEmbedding] = self.get_similarity_chunks_from_data_cluster(data_cluster, prompt_embedding)

        LOGGER.debug(f"Embedding similarity chunk: {embedding_similarity_chunk}")

        actual_max_results = min(max_results, len(embedding_similarity_chunk))

        if not embedding_similarity_chunk:
            LOGGER.debug(f"No embeddings found in data cluster. max_results: {max_results} - actual_max_results: {actual_max_results}")
            return []
        
        if len(embedding_similarity_chunk) <= max_results:
            return embedding_similarity_chunk
        
        final_chunks: List[ChunkedEmbedding] = self.get_final_embedding_chunks(embedding_similarity_chunk, max_results, similarity_threshold)

        LOGGER.debug(f"Final chunks: {final_chunks}")

        return final_chunks

    def prepare_result_references(
        self,
        top_embeddings: List[ChunkedEmbedding]
    ) -> List[EmbeddingChunk]:
        """
        Prepare a References object containing the embeddings that meet the threshold,
        ordered by context and similarity.
        """
        reference_groups: Dict[int, Dict[str, Any]] = {}

        LOGGER.debug(f"Top embeddings: {top_embeddings}")
        for item in top_embeddings:
            ref_id = id(item['reference'])
            if ref_id not in reference_groups:
                reference_groups[ref_id] = {
                    'reference_type': item['reference_type'],
                    'reference': item['reference'],
                    'embedding_chunks': []
                }
            reference_groups[ref_id]['embedding_chunks'].append(item['embedding_chunk'])

        LOGGER.debug(f"Reference groups: {reference_groups}")
        final_embedding_chunks: List[EmbeddingChunk] = []
        # Sort the embeddings within each reference by their index
        for group in reference_groups.values():
            embedding_chunks = group['embedding_chunks']
            embedding_chunks.sort(key=lambda c: c.index)
            # Update the reference's embedding with only the selected chunks
            final_embedding_chunks.extend(embedding_chunks)

        return final_embedding_chunks
