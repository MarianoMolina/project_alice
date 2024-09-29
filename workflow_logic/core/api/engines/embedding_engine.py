import base64
import json
from pydantic import Field
from typing import List, Union
from workflow_logic.core.data_structures import ModelConfig, ApiType, MessageDict, FileContentReference, FileType, ContentType, References
from workflow_logic.core.api.engines.api_engine import APIEngine
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from openai import AsyncOpenAI
from workflow_logic.util import LOGGER

class OpenAIEmbeddingsEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string",
                    description="The input text to get embeddings for. Can be a string or an array of strings."
                )
            },
            required=["input"]
        )
    )
    required_api: ApiType = Field(ApiType.LLM_MODEL, title="The API engine required")

    async def generate_api_response(self, api_data: ModelConfig, input: Union[str, List[str]]) -> References:
        """
        Generates embeddings for the given input using OpenAI's API.
        Args:
            api_data (ModelConfig): Configuration data for the API (e.g., API key, base URL).
            input (Union[str, List[str]]): The input text(s) to get embeddings for.
            model (str): The name of the embedding model to use.
        Returns:
            MessageDict: A message dict containing the file reference for the embeddings.
        """
        client = AsyncOpenAI(
            api_key=api_data.api_key,
            base_url=api_data.base_url
        )
        # 'text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large'
        model = api_data.model
        try:
            response = await client.embeddings.create(
                input=input,
                model=model
            )

            # Extract embeddings from the response
            embeddings = [data.embedding for data in response.data]

            # Convert embeddings to JSON and then to base64
            embeddings_json = json.dumps(embeddings)
            embeddings_b64 = base64.b64encode(embeddings_json.encode('utf-8')).decode('utf-8')

            creation_metadata = {
                    "model": model,
                    "usage": self.get_usage(response)
                }
            # Create FileContentReference
            file_reference = FileContentReference(
                filename=f"embeddings_{model}.json",
                type=FileType.FILE,
                content=embeddings_b64,
                transcript=MessageDict(role='user', content=input, generated_by='user', type=ContentType.TEXT, creation_metadata=creation_metadata)
            )

            return References(files=[file_reference])
        except Exception as e:
            LOGGER.error(f"Error in OpenAI embeddings API call: {str(e)}")
            raise Exception(f"Error in OpenAI embeddings API call: {str(e)}")

    @staticmethod
    def get_usage(response) -> dict:
        """
        Extracts usage information from the API response.
        Args:
            response: The full response from the OpenAI API.
        Returns:
            dict: A dictionary containing usage information.
        """
        return {
            "prompt_tokens": response.usage.prompt_tokens,
            "total_tokens": response.usage.total_tokens
        }