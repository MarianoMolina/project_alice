import base64, json, google.generativeai as genai
from typing import List
from workflow.core.data_structures import (
    ModelConfig, MessageDict, FileContentReference, FileType, ContentType, References, RoleTypes, MessageGenerators, EmbeddingChunk
    )
from workflow.core.api.engines.embedding_engines import EmbeddingEngine
from workflow.util import LOGGER, est_token_count

class GeminiEmbeddingsEngine(EmbeddingEngine):
    async def generate_embedding(
        self, inputs: List[str], api_data: ModelConfig
    ) -> List[FileContentReference]:
        """
        Generates embeddings for the given inputs using OpenAI's API.
        """
        # Check if total tokens exceed context size
        total_tokens = sum(est_token_count(input) for input in inputs)
        if total_tokens > api_data.ctx_size:
            return References(
                messages=[
                    MessageDict(
                        role="system",
                        content=f"Input text (tokens est.: {total_tokens}) exceeds the maximum token limit: {api_data.ctx_size}",
                        type=ContentType.TEXT,
                    )
                ]
            )
        # Configure client
        genai.configure(api_key=api_data.api_key)
        try:
            # Handle single input
            result = genai.embed_content(
                model=api_data.model,
                content=input,
                task_type="retrieval_document",
                title="Embedding of single string"
            )
            embeddings = [result['embedding']]

            # Convert embeddings to JSON and then to base64
            embeddings_json = json.dumps(embeddings)
            embeddings_b64 = base64.b64encode(embeddings_json.encode('utf-8')).decode('utf-8')

            creation_metadata = {
                "model": api_data.model,
                "task_type": "retrieval_document",
                "total_tokens": total_tokens
            }

            # Create FileContentReference
            file_reference = FileContentReference(
                filename=f"embeddings_{api_data.model.split('/')[-1] or api_data.model}.json",
                type=FileType.FILE,
                content=embeddings_b64,
                transcript=MessageDict(
                    role=RoleTypes.USER,
                    content=input if isinstance(input, str) else json.dumps(input),
                    generated_by=MessageGenerators.USER,
                    type=ContentType.TEXT,
                    creation_metadata=creation_metadata
                )
            )

            return References(files=[file_reference])

        except Exception as e:
            LOGGER.error(f"Error in Gemini embeddings API call: {str(e)}")
            raise Exception(f"Error in Gemini embeddings API call: {str(e)}")
        
    async def generate_embedding_chunks(
        self, inputs: List[str], api_data: ModelConfig
    ) -> List[EmbeddingChunk]:
        """
        Generates embeddings for the given inputs using Gemini's API.
        Returns a list of EmbeddingChunk objects.
        """
        chunks: List[EmbeddingChunk] = []
        
        # Check token limits for each input
        for input in inputs:
            if not input:
                continue
            if est_token_count(input) > api_data.ctx_size:
                raise ValueError(f"Input text (tokens est.: {est_token_count(input)}) exceeds the maximum token limit: {api_data.ctx_size}")

        # Configure client
        genai.configure(api_key=api_data.api_key)

        try:
            for idx, input_text in enumerate(inputs):
                if not input_text:
                    continue
                    
                result = genai.embed_content(
                    model=api_data.model,
                    content=input_text,
                    task_type="retrieval_document",
                    title=f"Embedding chunk {idx}"
                )

                creation_metadata = {
                    "model": api_data.model,
                    "task_type": "retrieval_document",
                    "total_data_len": [len(input_text) for input_text in inputs],
                    "prompt_tokens": est_token_count(input_text)
                }

                embedding_chunk = EmbeddingChunk(
                    vector=result['embedding'],
                    text_content=input_text,
                    index=idx,
                    creation_metadata=creation_metadata
                )
                chunks.append(embedding_chunk)

            return chunks
        except Exception as e:
            LOGGER.error(f"Error in Gemini embeddings API call: {str(e)}")
            return chunks

    async def generate_embedding(
        self, inputs: List[str], api_data: ModelConfig
    ) -> List[List[float]]:
        """
        Generates embeddings for the given inputs using Gemini's API.
        Returns a list of embedding vectors.
        """
        embeddings: List[List[float]] = []
        
        # Check token limits
        for input in inputs:
            if not input:
                continue
            if est_token_count(input) > api_data.ctx_size:
                raise ValueError(f"Input text (tokens est.: {est_token_count(input)}) exceeds the maximum token limit: {api_data.ctx_size}")

        # Configure client
        genai.configure(api_key=api_data.api_key)

        try:
            for input_text in inputs:
                if not input_text:
                    continue
                    
                result = genai.embed_content(
                    model=api_data.model,
                    content=input_text,
                    task_type="retrieval_document",
                    title="Embedding generation"
                )
                
                embeddings.append(result['embedding'])

            LOGGER.info(f"Generated {len(embeddings)} embeddings using model: {api_data.model}")
            return embeddings
        except Exception as e:
            LOGGER.error(f"Error in Gemini embeddings API call: {str(e)}")
            return embeddings