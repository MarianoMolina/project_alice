import base64
from pydantic import Field
from typing import List, Union, Optional
from workflow_logic.core.data_structures import MessageDict, LLMConfig, FileReference, get_file_content, ApiType
from workflow_logic.core.api.engines.api_engine import APIEngine
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from openai import AsyncOpenAI
from workflow_logic.util import LOGGER

class VisionModelEngine(APIEngine):
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
                    default=300
                )
            },
            required=["file_references", "prompt"]
        )
    )
    required_api: ApiType = Field(ApiType.IMG_VISION, title="The API engine required")
        
    async def generate_api_response(self, api_data: LLMConfig, file_references: List[FileReference], prompt: str, max_tokens: int = 300) -> MessageDict:
        """
        Analyzes images using OpenAI's vision model.

        Args:
            api_data (LLMConfig): Configuration data for the API (e.g., model name, API key).
            file_references (List[FileReference]): List of FileReference objects for the images to analyze.
            prompt (str): A text prompt to guide the image analysis.
            max_tokens (int): The maximum number of tokens to generate.

        Returns:
            MessageDict: Analysis results wrapped in a MessageDict object.
        """
        client = AsyncOpenAI(
            api_key=api_data.api_key,
            base_url=api_data.base_url
        )
        content = [{"type": "text", "text": prompt}]
        for file_ref in file_references:
            image_data = get_file_content(file_ref)
            LOGGER.debug(f"File type: {file_ref.type}, Data type: {type(image_data)}, Data size: {len(image_data)} bytes")
            
            base64_image = self.ensure_base64(image_data)
            
            if base64_image:
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                })
            else:
                LOGGER.warning(f"Failed to process image data for file {file_ref.filename}")

        messages = [{"role": "user", "content": content}]

        try:
            response = await client.chat.completions.create(
                model=api_data.model,
                messages=messages,
                max_tokens=max_tokens
            )
            response_content = response.choices[0].message.content
            return MessageDict(
                role="assistant",
                content=response_content,
                generated_by="llm",
                type="text",
                creation_metadata={
                    "model": response.model,
                    "usage": response.usage.model_dump(),
                    "finish_reason": response.choices[0].finish_reason
                }
            )
        except Exception as e:
            raise Exception(f"Error in vision model API call: {str(e)}")

    def ensure_base64(self, data: Union[str, bytes]) -> Optional[str]:
        """
        Ensure the data is a base64 encoded string.
        
        Args:
            data (Union[str, bytes]): The image data, either as bytes or a base64 string.
        
        Returns:
            Optional[str]: A base64 encoded string, or None if processing fails.
        """
        if isinstance(data, str):
            # Check if it's already a valid base64 string
            try:
                base64.b64decode(data)
                LOGGER.debug("Data is already a valid base64 string")
                return data
            except:
                LOGGER.warning("Data is a string but not a valid base64")
                return None
        elif isinstance(data, bytes):
            # Encode bytes to base64
            try:
                base64_str = base64.b64encode(data).decode('utf-8')
                LOGGER.debug(f"Successfully encoded bytes to base64. First 50 chars: {base64_str[:50]}")
                return base64_str
            except:
                LOGGER.error("Failed to encode bytes to base64")
                return None
        else:
            LOGGER.error(f"Unexpected data type: {type(data)}")
            return None