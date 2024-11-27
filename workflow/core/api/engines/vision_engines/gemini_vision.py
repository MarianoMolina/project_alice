import google.generativeai as genai
from pydantic import Field
from typing import List, Optional
from workflow.core.data_structures import (
    MessageDict, ModelConfig, FileReference, get_file_content, ApiType, References, FunctionParameters, ParameterDefinition, RoleTypes, MessageGenerators, ContentType
    )
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER

class GeminiVisionEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "file_references": ParameterDefinition(
                    type="array",
                    description="List of FileReference objects for the images to analyze."
                ),
                "prompt": ParameterDefinition(
                    type="string",
                    description="A text prompt to guide the image analysis.",
                    default="Describe this image"
                ),
                "max_tokens": ParameterDefinition(
                    type="integer",
                    description="The maximum number of tokens to generate.",
                    default=None
                )
            },
            required=["file_references", "prompt"]
        )
    )
    required_api: ApiType = Field(ApiType.IMG_VISION, title="The API engine required")
        
    async def generate_api_response(self, api_data: ModelConfig, file_references: List[FileReference], prompt: str, max_tokens: Optional[int] = None) -> References:
        """
        Analyzes images using Google's Gemini vision model.

        Args:
            api_data (ModelConfig): Configuration data for the API (e.g., model name, API key).
            file_references (List[FileReference]): List of FileReference objects for the images to analyze.
            prompt (str): A text prompt to guide the image analysis.
            max_tokens (Optional[int]): The maximum number of tokens to generate.

        Returns:
            References: Analysis results wrapped in a References object.
        """
        genai.configure(api_key=api_data.api_key)
        model = genai.GenerativeModel(api_data.model)

        content = [prompt]
        for file_ref in file_references:
            image_data = get_file_content(file_ref)
            LOGGER.debug(f"File type: {file_ref.type}, Data type: {type(image_data)}, Data size: {len(image_data)} bytes")
            
            try:
                image = genai.Image.from_bytes(image_data)
                content.append(image)
            except Exception as e:
                LOGGER.warning(f"Failed to process image data for file {file_ref.filename}: {str(e)}")

        try:
            response = model.generate_content(
                content,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens
                )
            )
            
            msg = MessageDict(
                role=RoleTypes.ASSISTANT,
                content=response.text,
                generated_by=MessageGenerators.TOOL,
                type=ContentType.TEXT,
                creation_metadata={
                    "model": api_data.model,
                    "prompt_tokens": response.usage_metadata.prompt_token_count,
                    "completion_tokens": response.candidates[0].token_count,
                    "total_tokens": response.usage_metadata.total_token_count,
                    "finish_reason": response.candidates[0].finish_reason.name
                }
            )
            return References(messages=[msg])
        except Exception as e:
            raise Exception(f"Error in Gemini vision model API call: {str(e)}")