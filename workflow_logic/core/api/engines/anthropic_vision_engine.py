from typing import List
from workflow_logic.util import MessageDict, LLMConfig, FileReference
from workflow_logic.util.communication.data_structures import image_data_from_file_reference
from workflow_logic.core.api.engines.vision_model_engine import VisionModelEngine
from anthropic import AsyncAnthropic

class AnthropicVisionEngine(VisionModelEngine):
    async def generate_api_response(self, api_data: LLMConfig, file_references: List[FileReference], prompt: str, max_tokens: int = 300) -> MessageDict:
        """
        Analyzes images using Anthropic's Claude vision model.

        Args:
            api_data (LLMConfig): Configuration data for the API (e.g., API key, model).
            file_references (List[FileReference]): List of FileReference objects for the images to analyze.
            prompt (str): A text prompt to guide the image analysis.
            max_tokens (int): The maximum number of tokens to generate.

        Returns:
            MessageDict: Analysis results wrapped in a MessageDict object.
        """
        client = AsyncAnthropic(api_key=api_data.api_key)

        content = []
        for file_ref in file_references:
            image_data = image_data_from_file_reference(file_ref)
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
                        "role": "user",
                        "content": content,
                    }
                ],
            )

            return MessageDict(
                role="assistant",
                content=response.content[0].text,
                generated_by="anthropic_vision_model",
                type="text",
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
        except Exception as e:
            raise Exception(f"Error in Anthropic vision model API call: {str(e)}")