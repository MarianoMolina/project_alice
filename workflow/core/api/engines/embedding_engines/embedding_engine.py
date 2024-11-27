import re
from pydantic import Field
from typing import List
from openai import AsyncOpenAI
from openai.types import CreateEmbeddingResponse
from workflow.core.data_structures import (
    ModelConfig,
    ApiType,
    EmbeddingChunk,
    References,
    FunctionParameters,
    ParameterDefinition,
)
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER, est_token_count, Language, TextSplitter, SemanticTextSplitter, SplitterType, cosine_similarity, get_language_matching, get_traceback

class EmbeddingEngine(APIEngine):
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

            # Create EmbeddingChunks objects for each input
            for idx, (input_text, embedding) in enumerate(zip(inputs, embeddings)):
                creation_metadata = self.get_usage(response)
                embedding_chunk = EmbeddingChunk(
                    vector=embedding,
                    text_content=input_text,
                    index=idx,
                    creation_metadata=creation_metadata,
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
            LOGGER.info(f"Generated embeddings - Usage information: {self.get_usage(response)}")
            return embeddings
        except Exception as e:
            LOGGER.error(f"Error in OpenAI embeddings API call: {str(e)} - Traceback: {get_traceback()}")
            return embeddings
        
    @staticmethod
    def get_usage(response: CreateEmbeddingResponse) -> dict:
        """
        Extracts usage information from the API response.
        """
        return {
            "model": response.model,
            "total_data_len": len(response.data),
            "prompt_tokens": response.usage.prompt_tokens,
            "total_tokens": response.usage.total_tokens,
        }