from pydantic import Field
from typing import List
from workflow_logic.core.data_structures import MessageDict, LLMConfig, FileReference, get_file_content
from workflow_logic.core.api.engines.api_engine import APIEngine
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from openai import AsyncOpenAI

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
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{image_data}"
                }
            })

        messages = [{"role": "user", "content": content}]

        try:
            response = await client.chat.completions.create(
                model=api_data.model,
                messages=messages,
                max_tokens=max_tokens
            )
            content = response.choices[0].message.content
            return MessageDict(
                role="assistant",
                content=content,
                generated_by="vision_model",
                type="text",
                references=file_references,
                creation_metadata={
                    "model": response.model,
                    "usage": response.usage.model_dump(),
                    "finish_reason": response.choices[0].finish_reason
                }
            )
        except Exception as e:
            raise Exception(f"Error in vision model API call: {str(e)}")