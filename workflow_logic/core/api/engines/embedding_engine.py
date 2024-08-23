from pydantic import Field
from typing import List, Union
from workflow_logic.core.data_structures import LLMConfig, ApiType
from workflow_logic.core.api.engines.api_engine import APIEngine
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from openai import AsyncOpenAI

class OpenAIEmbeddingsEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string",
                    description="The input text to get embeddings for. Can be a string or an array of strings."
                ),
                "model": ParameterDefinition(
                    type="string",
                    description="The name of the embedding model to use.",
                    default="text-embedding-3-small"
                )
            },
            required=["input"]
        )
    )
    required_api: ApiType = Field(ApiType.LLM_MODEL, title="The API engine required")

    async def generate_api_response(self, api_data: LLMConfig, input: Union[str, List[str]], model: str = "text-embedding-3-small") -> List[List[float]]:
        """
        Generates embeddings for the given input using OpenAI's API.

        Args:
            api_data (LLMConfig): Configuration data for the API (e.g., API key, base URL).
            input (Union[str, List[str]]): The input text(s) to get embeddings for.
            model (str): The name of the embedding model to use.

        Returns:
            List[List[float]]: A list of embeddings, where each embedding is a list of floats.
        """
        client = AsyncOpenAI(
            api_key=api_data.api_key,
            base_url=api_data.base_url
        )

        try:
            response = await client.embeddings.create(
                input=input,
                model=model
            )

            # Extract embeddings from the response
            embeddings = [data.embedding for data in response.data]
            
            # This needs to return a structured data of some type. Normally msg or searchoutput, but maybe something new

            return embeddings
        except Exception as e:
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