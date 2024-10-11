import base64
import json
from pydantic import Field
from typing import List, Union
import google.generativeai as genai
from workflow.core.data_structures import ModelConfig, ApiType, MessageDict, FileContentReference, FileType, ContentType, References, FunctionParameters, ParameterDefinition
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER

class GeminiEmbeddingsEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string",
                    description="The input text to get embeddings for. Can be a string or an array of strings."
                ),
                "task_type": ParameterDefinition(
                    type="string",
                    description="The type of task for which the embedding is being generated.",
                    default="retrieval_document"
                )
            },
            required=["input"]
        )
    )
    required_api: ApiType = Field(ApiType.LLM_MODEL, title="The API engine required")

    async def generate_api_response(self, api_data: ModelConfig, input: Union[str, List[str]], task_type: str = "retrieval_document") -> References:
        """
        Generates embeddings for the given input using Google's Gemini API.

        Args:
            api_data (ModelConfig): Configuration data for the API (e.g., API key, model name).
            input (Union[str, List[str]]): The input text(s) to get embeddings for.
            task_type (str): The type of task for which the embedding is being generated.

        Returns:
            References: A References object containing the file reference for the embeddings.
        """
        genai.configure(api_key=api_data.api_key)

        try:
            if isinstance(input, list):
                # Handle multiple inputs
                results = [genai.embed_content(
                    model=api_data.model,
                    content=text,
                    task_type=task_type,
                    title=f"Embedding of string {i}"
                ) for i, text in enumerate(input)]
                embeddings = [result['embedding'] for result in results]
            else:
                # Handle single input
                result = genai.embed_content(
                    model=api_data.model,
                    content=input,
                    task_type=task_type,
                    title="Embedding of single string"
                )
                embeddings = [result['embedding']]

            # Convert embeddings to JSON and then to base64
            embeddings_json = json.dumps(embeddings)
            embeddings_b64 = base64.b64encode(embeddings_json.encode('utf-8')).decode('utf-8')

            creation_metadata = {
                "model": api_data.model,
                "task_type": task_type,
                # Note: Gemini API might not provide usage information like token counts
                # You may need to implement your own token counting if required
            }

            # Create FileContentReference
            file_reference = FileContentReference(
                filename=f"embeddings_{api_data.model.split('/')[-1]}.json",
                type=FileType.FILE,
                content=embeddings_b64,
                transcript=MessageDict(
                    role='user',
                    content=input if isinstance(input, str) else json.dumps(input),
                    generated_by='user',
                    type=ContentType.TEXT,
                    creation_metadata=creation_metadata
                )
            )

            return References(files=[file_reference])

        except Exception as e:
            LOGGER.error(f"Error in Gemini embeddings API call: {str(e)}")
            raise Exception(f"Error in Gemini embeddings API call: {str(e)}")