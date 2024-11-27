from typing import List
from workflow.core.data_structures import get_file_content, MessageDict, ModelConfig, FileReference, References, RoleTypes, MessageGenerators, ContentType
from workflow.core.api.engines.vision_model_engine import VisionModelEngine
from anthropic import AsyncAnthropic

class AnthropicVisionEngine(VisionModelEngine):
    async def generate_api_response(self, api_data: ModelConfig, file_references: List[FileReference], prompt: str, max_tokens: int = 300) -> References:
        """
        Analyzes images using Anthropic's Claude vision model.

        Args:
            api_data (ModelConfig): Configuration data for the API (e.g., API key, model).
            file_references (List[FileReference]): List of FileReference objects for the images to analyze.
            prompt (str): A text prompt to guide the image analysis.
            max_tokens (int): The maximum number of tokens to generate.

        Returns:
            MessageDict: Analysis results wrapped in a MessageDict object.
        """
        client = AsyncAnthropic(api_key=api_data.api_key)

        content = []
        for file_ref in file_references:
            image_data = get_file_content(file_ref)
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": file_ref.file_type,
                    "data": image_data,
                }
            })

        content.append({
            "type": "text",
            "text": prompt
        })

        try:
            response = await client.messages.create(
                model=api_data.model,
                max_tokens=max_tokens,
                messages=[
                    {
                        "role": RoleTypes.USER,
                        "content": content,
                    }
                ],
            )

            msg = MessageDict(
                role=RoleTypes.ASSISTANT,
                content=response.content[0].text,
                generated_by=MessageGenerators.TOOL,
                type=ContentType.TEXT,
                references=file_references,
                creation_metadata={
                    "model": api_data.model,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens,
                    },
                    "finish_reason": response.stop_reason,
                }
            )
            return References(messages=[msg])
        except Exception as e:
            raise Exception(f"Error in Anthropic vision model API call: {str(e)}")