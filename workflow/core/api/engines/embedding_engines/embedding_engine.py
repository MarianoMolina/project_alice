import re
from pydantic import Field
from typing import List
from openai import AsyncOpenAI
from workflow.core.data_structures import (
    ModelConfig,
    ApiType,
    EmbeddingChunk,
    References,
    FunctionParameters,
    ParameterDefinition,
    CostDict
)
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER, est_token_count, Language, TextSplitter, SemanticTextSplitter, SplitterType, get_language_matching, get_traceback

class EmbeddingEngine(APIEngine):
    """
    Text embedding API engine implementing the OpenAI embeddings interface.
    
    Provides a standardized interface for generating text embeddings,
    with support for different text splitting strategies and language
    types. Features:
    - Multiple splitting strategies (semantic/recursive)
    - Language-specific handling
    - Automatic chunking and validation
    
    Input Interface:
        - input: Text to generate embeddings for
        - language: Input text language (including programming languages)
        - splitter_method: Text splitting strategy
    
    Returns:
        References object containing EmbeddingChunk(s) with:
        - Embedding vectors
        - Original text segments
        - Creation metadata and usage statistics
    
    Notes:
        - Implements both chunked and direct embedding generation
        - Provides similarity calculation utilities
        - Handles context size validation and token estimation
    """
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string",
                    description="The input text to generate embeddings for.",
                ),
                "language": ParameterDefinition(
                    type="string",
                    description=f"The language of the input text. Options include 'text' and programming languages: {[lang.value for lang in Language if lang.value != 'text']}.",
                    default="text",
                ),
                "splitter_method": ParameterDefinition(
                    type="string",
                    description="The method to use for text splitting. Options include 'semantic' and 'recursive'.",
                    default=SplitterType.RECURSIVE,
                ),
            },
            required=["input"],
        )
    )
    required_api: ApiType = Field(ApiType.EMBEDDINGS, title="The API engine required")

    async def generate_api_response(
        self, api_data: ModelConfig, input: str, language: str = "text", splitter_method: str = SplitterType.RECURSIVE
    ) -> References:
        """
        Generates embeddings for the given input using the specified language and OpenAI's API.
        """
        # Validate the language input
        try:
            if language == 'text':
                language_enum = Language.TEXT
            else:
                language_enum = get_language_matching(language)
                if not language_enum:
                    raise ValueError(f"Invalid language option: {language}")
        except ValueError:
            raise ValueError(f"Invalid language option: {language}")
        
        if splitter_method == SplitterType.SEMANTIC:
            splitter = SemanticTextSplitter(
                language=language_enum,
            )
        else:
            splitter = TextSplitter(
                language=language_enum,
            )

        chunks = splitter.split_text(input, embedding_generator=self, api_data=api_data)

        # Step 2: Generate embeddings for the chunks
        embedding_chunks = await self.generate_embedding_chunks(chunks, api_data)

        return References(embeddings=embedding_chunks)
    
    async def generate_embedding_chunks(
        self, inputs: List[str], api_data: ModelConfig
    ) -> List[EmbeddingChunk]:
        """
        Generates embeddings for the given inputs using OpenAI's API.
        """

        client = AsyncOpenAI(api_key=api_data.api_key, base_url=api_data.base_url)
        model = api_data.model

        LOGGER.info(f"Generating embeddings for {len(inputs)} with total char length {[len(input) for input in inputs]} inputs using model: {model}")
        # Check if total tokens exceed context size
        chunks: List[EmbeddingChunk] = []

        try:
            for input in inputs:
                if not input:
                    continue
                if est_token_count(input) > api_data.ctx_size:
                    raise ValueError(f"Input text (tokens est.: {est_token_count(input)}) exceeds the maximum token limit: {api_data.ctx_size}")
            response = await client.embeddings.create(input=inputs, model=model)

            # Extract embeddings from the response
            embeddings = [data.embedding for data in response.data]
            
            individual_usage = {
                "prompt_tokens": response.usage.prompt_tokens // len(embeddings),
                "total_tokens": response.usage.total_tokens // len(embeddings),
            }

            # Create EmbeddingChunks objects for each input
            for idx, (input_text, embedding) in enumerate(zip(inputs, embeddings)):
                embedding_chunk = EmbeddingChunk(
                    vector=embedding,
                    text_content=input_text,
                    index=idx,
                    creation_metadata={
                        "model": response.model,
                        "usage": individual_usage,
                        "estimated_tokens": est_token_count(input_text),
                        "cost": self.calculate_costs(response.usage.prompt_tokens//len(embeddings), api_data)
                        },
                )
                chunks.append(embedding_chunk)
            return chunks
        except Exception as e:
            LOGGER.error(f"Error in OpenAI embeddings API call: {str(e)} - Traceback: {get_traceback()}")
            return chunks

    async def generate_embedding(
        self, inputs: List[str], api_data: ModelConfig
    ) -> List[List[float]]:
        """
        Generates embeddings for the given inputs using OpenAI's API.
        """
        client = AsyncOpenAI(api_key=api_data.api_key, base_url=api_data.base_url)
        model = api_data.model

        LOGGER.info(f"Generating embeddings for {len(inputs)} with total char length {[len(input) for input in inputs]} inputs using model: {model}")
        # Check if total tokens exceed context size
        embeddings: List[List[float]] = []

        try:
            for input in inputs:
                if not input:
                    continue
                if est_token_count(input) > api_data.ctx_size:
                    raise ValueError(f"Input text (tokens est.: {est_token_count(input)}) exceeds the maximum token limit: {api_data.ctx_size}")
            response = await client.embeddings.create(input=inputs, model=model)

            # Extract embeddings from the response
            embeddings = [data.embedding for data in response.data]
            # This method loses the context of the usage information
            return embeddings
        except Exception as e:
            LOGGER.error(f"Error in OpenAI embeddings API call: {str(e)} - Traceback: {get_traceback()}")
            return embeddings
        
    @staticmethod
    def calculate_costs(prompt_tokens: int, model_config: ModelConfig) -> CostDict:
        """
        Extracts usage information from the API response.
        """
        input_cost_per_mill = model_config.model_costs.input_token_cost_per_million if not model_config.use_cache else model_config.model_costs.cached_input_token_cost_per_million
        input_cost = (prompt_tokens / 1000000) * input_cost_per_mill
        output = {
            "input_cost": input_cost,
            "total_cost": input_cost
        }
        return output