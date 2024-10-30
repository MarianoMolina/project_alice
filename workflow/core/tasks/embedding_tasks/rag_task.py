import os
from typing import List, Dict, Any, Union
from pydantic import Field, BaseModel
from workflow.core.tasks.agent_tasks import BasicAgentTask
from workflow.core.data_structures import (
    FunctionParameters,
    ParameterDefinition,
    MessageDict,
    ApiType,
    References,
    NodeResponse,
    TasksEndCodeRouting,
    FileContentReference,
    FileReference,
    Embeddable
)
from workflow.core.api import APIManager
from workflow.util import LOGGER, cosine_similarity, Language

class RetrievalTask(BasicAgentTask):
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
        data_cluster: References = kwargs.get('data_cluster')

        if data_cluster is None:
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
            updated_data_cluster = await self.ensure_embeddings_for_data_cluster(data_cluster, api_manager)
            return NodeResponse(
                parent_task_id=self.id,
                node_name="ensure_embeddings_in_data_cluster",
                exit_code=0,
                references=updated_data_cluster,
                execution_order=len(execution_history)
            )
        except Exception as e:
            LOGGER.error(f"Error in ensuring embeddings: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="ensure_embeddings_in_data_cluster",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Failed to ensure embeddings: {str(e)}",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )

    async def ensure_embeddings_for_data_cluster(
        self,
        data_cluster: References,
        api_manager: APIManager
    ) -> References:
        """
        For each non-string and non-embedding object in data_cluster,
        ensure embeddings are available. Update the objects with embeddings if they are missing.
        """
        updated_data_cluster = References()
        fields_to_process = [field for field in data_cluster.model_fields_set
                             if field not in ['string_outputs', 'embeddings']]

        for field_name in fields_to_process:
            items = getattr(data_cluster, field_name)
            if items:
                updated_items = await self.ensure_embeddings_for_items(items, api_manager)
                setattr(updated_data_cluster, field_name, updated_items)
        return updated_data_cluster

    async def ensure_embeddings_for_items(
        self,
        items: List[BaseModel],
        api_manager: APIManager
    ) -> List[BaseModel]:
        """
        For a list of items, ensure each has embeddings.
        """
        updated_items = []
        for item in items:
            if not isinstance(item, Embeddable):
                continue  # Skip if the item doesn't have an embedding field
            if not item.embedding:
                # Need to generate embeddings
                content = self.get_item_content(item)
                language = self.get_item_language(item)
                embeddings_reference: References = await self.agent.generate_embeddings(
                    api_manager=api_manager, input=content, language=language
                )
                if embeddings_reference and embeddings_reference.embeddings:
                    item.embedding = embeddings_reference.embeddings
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
            'js': Language.JS,
            'ts': Language.TS,
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
            # Add other extensions as needed
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
        data_cluster: References = kwargs.get('data_cluster')

        if data_cluster is None:
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
            # Step 1: Create embedding for the prompt
            prompt_embedding_reference: References = await self.agent.generate_embeddings(
                api_manager=api_manager, input=prompt, language=Language.TEXT
            )
            if not prompt_embedding_reference or not prompt_embedding_reference.embeddings:
                raise ValueError("Failed to generate embedding for the prompt.")

            prompt_embedding_vector: List[float] = prompt_embedding_reference.embeddings[0].vector

            # Step 2: Retrieve top embeddings from data_cluster
            top_embeddings = self.retrieve_top_embeddings(
                prompt_embedding_vector, data_cluster, similarity_threshold, max_results
            )

            # Step 3: Prepare the References object to return
            result_references = self.prepare_result_references(top_embeddings)

            return NodeResponse(
                parent_task_id=self.id,
                node_name="retrieve_relevant_embeddings",
                exit_code=0,
                references=result_references,
                execution_order=len(execution_history)
            )

        except Exception as e:
            LOGGER.error(f"Error in retrieval task: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="retrieve_relevant_embeddings",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Retrieval failed: {str(e)}",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )
    def retrieve_top_embeddings(
        self,
        prompt_embedding: List[float],
        data_cluster: References,
        similarity_threshold: float,
        max_results: int
    ) -> List[Dict[str, Any]]:
        """
        Compute cosine similarity between the prompt_embedding and each embedding in data_cluster.
        Return top embeddings that exceed the similarity threshold, up to max_results.
        """
        embedding_matches: List[Dict[str, Any]] = []

        fields_to_process = [field for field in data_cluster.__fields_set__
                             if field not in ['string_outputs', 'embeddings']]

        for field_name in fields_to_process:
            items = getattr(data_cluster, field_name)
            if items:
                for item in items:
                    if hasattr(item, 'embedding') and item.embedding:
                        for embedding_chunk in item.embedding:
                            similarity = cosine_similarity(prompt_embedding, embedding_chunk.vector)
                            if similarity >= similarity_threshold:
                                embedding_matches.append({
                                    'similarity': similarity,
                                    'reference_type': field_name,
                                    'reference': item,
                                    'embedding_chunk': embedding_chunk
                                })

        # Sort matches by similarity descending
        embedding_matches.sort(key=lambda x: x['similarity'], reverse=True)

        # Select top N results
        top_embeddings = embedding_matches[:max_results]

        return top_embeddings

    def prepare_result_references(
        self,
        top_embeddings: List[Dict[str, Any]]
    ) -> References:
        """
        Prepare a References object containing the embeddings that meet the threshold,
        ordered by context and similarity.
        """
        result_references = References()
        reference_groups: Dict[int, Dict[str, Any]] = {}

        for item in top_embeddings:
            ref_id = id(item['reference'])
            if ref_id not in reference_groups:
                reference_groups[ref_id] = {
                    'reference_type': item['reference_type'],
                    'reference': item['reference'],
                    'embedding_chunks': []
                }
            reference_groups[ref_id]['embedding_chunks'].append(item['embedding_chunk'])

        # Sort the embeddings within each reference by their index
        for group in reference_groups.values():
            embedding_chunks = group['embedding_chunks']
            embedding_chunks.sort(key=lambda c: c.index)
            # Update the reference's embedding with only the selected chunks
            group['reference'].embedding = embedding_chunks

            # Add the reference to the result_references
            field_name = group['reference_type']
            existing_items = getattr(result_references, field_name, None)
            if existing_items is None:
                setattr(result_references, field_name, [group['reference']])
            else:
                existing_items.append(group['reference'])

        return result_references
