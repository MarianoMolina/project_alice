import re
from pydantic import Field
from typing import List
from openai import AsyncOpenAI
from openai.types import CreateEmbeddingResponse
from workflow.core.data_structures import (
    ModelConfig,
    ApiType,
    MessageDict,
    EmbeddingChunk,
    ContentType,
    References,
    FunctionParameters,
    ParameterDefinition,
)
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER, est_token_count, Language, RecursiveTextSplitter, cosine_similarity, get_language_matching

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
            },
            required=["input"],
        )
    )
    required_api: ApiType = Field(ApiType.EMBEDDINGS, title="The API engine required")

    async def generate_api_response(
        self, api_data: ModelConfig, input: str, language: str = "text"
    ) -> References:
        """
        Generates embeddings for the given input using the specified language and OpenAI's API.
        """
        # Validate the language input
        try:
            language_enum = get_language_matching(language)
            if not language_enum:
                raise ValueError(f"Invalid language option: {language}")
        except ValueError:
            raise ValueError(f"Invalid language option: {language}")

        # Step 1: Chunk the input according to the language
        if language_enum == Language.TEXT:
            chunks = await self.semantic_text_chunking(input, api_data)
        else:
            splitter = RecursiveTextSplitter(
                language=language_enum,
                chunk_size=500,
                chunk_overlap=150,
                is_separator_regex=True,
            )
            chunks = splitter.split_text(input)

        # Step 2: Generate embeddings for the chunks
        embedding_chunks = await self.generate_embedding(chunks, api_data)

        return References(embeddings=embedding_chunks)

    async def generate_embedding(
        self, inputs: List[str], api_data: ModelConfig
    ) -> List[EmbeddingChunk]:
        """
        Generates embeddings for the given inputs using OpenAI's API.
        """
        client = AsyncOpenAI(api_key=api_data.api_key, base_url=api_data.base_url)
        model = api_data.model

        LOGGER.debug(f"Generating embeddings for {len(inputs)} inputs using model: {model}")
        LOGGER.debug(f"Inputs: {inputs}")

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

        try:
            response = await client.embeddings.create(input=inputs, model=model)

            # Extract embeddings from the response
            embeddings = [data.embedding for data in response.data]

            # Create EmbeddingChunks objects for each input
            chunks: List[EmbeddingChunk] = []
            for idx, (input_text, embedding) in enumerate(zip(inputs, embeddings)):
                creation_metadata = {
                    "model": model,
                    "usage": self.get_usage(response),
                }
                embedding_chunk = EmbeddingChunk(
                    vector=embedding,
                    text_content=input_text,
                    index=idx,
                    creation_metadata=creation_metadata,
                )

                chunks.append(embedding_chunk)

            return chunks
        except Exception as e:
            LOGGER.error(f"Error in OpenAI embeddings API call: {str(e)}")
            raise Exception(f"Error in OpenAI embeddings API call: {str(e)}")

    async def semantic_text_chunking(self, input_text: str, api_data: ModelConfig) -> List[str]:
        """
        Splits the input text into semantically meaningful chunks using embeddings.
        """
        if est_token_count(input_text) < 600:
            return [input_text]
            
        # Step 1: Setup initial sentences
        sentences = self.setup_initial_sentences(input_text)

        # Step 2: Create overlapping combinations of sentences
        combined_sentences = self.create_combined_sentences(sentences)

        # Step 3: Generate embeddings for combined sentences using generate_embedding
        embedding_chunks = await self.get_embeddings_for_sentences(combined_sentences, api_data)

        # Step 4: Find breakpoints using cosine similarity
        breakpoints = self.find_breakpoints([chunk.vector for chunk in embedding_chunks], combined_sentences)

        # Step 5: Return final chunks based on breakpoints
        chunks = self.return_final_chunks(breakpoints, sentences)

        return chunks

    def setup_initial_sentences(self, input_text: str) -> List[str]:
        """
        Splits the input text into initial sentences.
        """
        sentences = re.split(r'(?<=[.!?])\s+', input_text)
        sentences = [s.strip() for s in sentences if s.strip()]
        return sentences

    def create_combined_sentences(self, sentences: List[str]) -> List[str]:
        """
        Creates overlapping combinations of sentences.
        """
        combined_sentences = []
        for i in range(len(sentences) - 2):
            combined = ' '.join(sentences[i:i+3])  # Combine current and next 2 sentences
            combined_sentences.append(combined)
        return combined_sentences

    async def get_embeddings_for_sentences(
        self, combined_sentences: List[str], api_data: ModelConfig
    ) -> List[EmbeddingChunk]:
        """
        Generates embeddings for the combined sentences using generate_embedding.
        """
        # Generate embeddings for the combined sentences
        embedding_chunks = await self.generate_embedding(combined_sentences, api_data)
        return embedding_chunks

    def find_breakpoints(
        self, embeddings: List[List[float]], combined_sentences: List[str]
    ) -> List[int]:
        """
        Finds breakpoints in the text based on cosine similarity between embeddings.
        """
        breakpoints = [0]
        current_tokens = 0
        token_threshold_min = 350
        token_threshold_max = 650

        for i in range(1, len(embeddings)):
            similarity = cosine_similarity(embeddings[i - 1], embeddings[i])
            tokens = est_token_count(combined_sentences[i])
            current_tokens += tokens

            if current_tokens >= token_threshold_min and similarity < 0.9:
                breakpoints.append(i)
                current_tokens = 0
            elif current_tokens >= token_threshold_max:
                breakpoints.append(i)
                current_tokens = 0

        # Ensure the last breakpoint is at the end
        if breakpoints[-1] != len(combined_sentences):
            breakpoints.append(len(combined_sentences))

        return breakpoints

    def return_final_chunks(
        self, breakpoints: List[int], sentences: List[str]
    ) -> List[str]:
        """
        Returns the final list of chunks based on breakpoints.
        """
        chunks = []
        for idx in range(len(breakpoints) - 1):
            start = breakpoints[idx]
            end = breakpoints[idx + 1]
            chunk_sentences = sentences[start:end]
            # Since sentences are overlapping, get unique sentences
            sentences_in_chunk = set()
            for cs in chunk_sentences:
                sentences_in_chunk.update(cs.split('. '))
            chunk = '. '.join(sentences_in_chunk)
            chunks.append(chunk)
        return chunks

    @staticmethod
    def get_usage(response: CreateEmbeddingResponse) -> dict:
        """
        Extracts usage information from the API response.
        """
        return {
            "prompt_tokens": response.usage.prompt_tokens,
            "total_tokens": response.usage.total_tokens,
        }