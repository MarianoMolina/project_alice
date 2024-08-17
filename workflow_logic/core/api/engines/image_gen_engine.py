from pydantic import Field
from workflow_logic.util import MessageDict, LLMConfig, FileReference
from workflow_logic.core.api.engines.api_engine import APIEngine
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from openai import AsyncOpenAI

class ImageGenerationEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
                    type="string",
                    description="A text description of the desired image(s)."
                ),
                "n": ParameterDefinition(
                    type="integer",
                    description="The number of images to generate.",
                    default=1
                ),
                "size": ParameterDefinition(
                    type="string",
                    description="The size of the generated images.",
                    default="1024x1024"
                ),
                "quality": ParameterDefinition(
                    type="string",
                    description="The quality of the image generation.",
                    default="standard"
                ),
                "model": ParameterDefinition(
                    type="string",
                    description="The model to use for image generation.",
                    default="dall-e-3"
                )
            },
            required=["prompt"]
        )
    )

    async def generate_api_response(self, api_data: LLMConfig, prompt: str, n: int = 1, size: str = "1024x1024", quality: str = "standard", model: str = "dall-e-3") -> MessageDict:
        """
        Generates images using OpenAI's DALL-E model.

        Args:
            api_data (LLMConfig): Configuration data for the API (e.g., API key, base URL).
            prompt (str): A text description of the desired image(s).
            n (int): The number of images to generate.
            size (str): The size of the generated images (e.g., "1024x1024").
            quality (str): The quality of the image generation ("standard" or "hd").
            model (str): The model to use for image generation.

        Returns:
            MessageDict: Generated image information wrapped in a MessageDict object.
        """
        client = AsyncOpenAI(
            api_key=api_data.api_key,
            base_url=api_data.base_url
        )

        try:
            response = await client.images.generate(
                model=model,
                prompt=prompt,
                n=n,
                size=size,
                quality=quality
            )

            # Extract image URLs and create FileReferences
            image_urls = [image.url for image in response.data]
            file_references = [FileReference(url=url, file_type="image") for url in image_urls]

            return MessageDict(
                role="assistant",
                content=f"Generated {n} image(s) based on the prompt: '{prompt}'",
                generated_by="image_generation_model",
                type="text",
                references=file_references,
                creation_metadata={
                    "model": model,
                    "prompt": prompt,
                    "n": n,
                    "size": size,
                    "quality": quality
                }
            )
        except Exception as e:
            raise Exception(f"Error in image generation API call: {str(e)}")