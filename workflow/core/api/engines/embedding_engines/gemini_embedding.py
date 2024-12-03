import google.generativeai as genai
from typing import List
from workflow.core.data_structures import (
    ModelConfig
    )
from workflow.core.api.engines.embedding_engines.embedding_engine import EmbeddingEngine
from workflow.util import LOGGER, est_token_count, get_traceback

class GeminiEmbeddingsEngine(EmbeddingEngine):
    async def generate_embedding(
        self, inputs: List[str], api_data: ModelConfig
    ) -> List[List[float]]:
        """
        Generates embeddings for the given inputs using OpenAI's API.
        """
        genai.configure(api_key=api_data.api_key)
        embeddings: List[List[float]] = []
        model = api_data.model
        LOGGER.info(f"Generating embeddings for {len(inputs)} with total char length {[len(input) for input in inputs]} inputs using model: {model}")
        try:
            for input_text in inputs:
                if not input_text:
                    continue

                if est_token_count(input_text) > api_data.ctx_size:
                    raise ValueError(f"Input text (tokens est.: {est_token_count(input_text)}) exceeds the maximum token limit: {api_data.ctx_size}")
                    
                result = genai.embed_content(
                    model=model,
                    content=input_text,
                    task_type="retrieval_document",
                    title="Embedding generation"
                )
                embeddings.append(result['embedding'])
            LOGGER.info(f"Generated {len(embeddings)} embeddings using model: {model}")
            return embeddings
        except Exception as e:
            LOGGER.error(f"Error in OpenAI embeddings API call: {str(e)} - Traceback: {get_traceback()}")
            return embeddings