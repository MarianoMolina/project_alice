import re
import torch
import gc
import base64
from typing import List, Optional
from pydantic import Field
from diffusers import PixArtAlphaPipeline
from transformers import T5EncoderModel
from workflow.core.data_structures import (
    ApiType,
    FileContentReference,
    MessageDict,
    ContentType,
    FileType,
    References,
    FunctionParameters,
    ParameterDefinition,
    ModelConfig,
)
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER, get_traceback


class PixArtImgGenEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
                    type="string", description="A text description of the desired image(s)."
                ),
                "negative_prompt": ParameterDefinition(
                    type="string",
                    description="A negative text description to avoid certain aspects in the image(s).",
                    default=None,
                ),
                "n": ParameterDefinition(
                    type="integer",
                    description="The number of images to generate.",
                    default=1,
                ),
            },
            required=["prompt"],
        )
    )
    required_api: ApiType = Field(
        ApiType.LLM_MODEL, title="The API engine required"
    )

    def generate_filename(self, prompt: str, model: str, index: int) -> str:
        """
        Generate a descriptive filename based on the prompt and model.
        """
        # Sanitize and truncate the prompt for the filename
        sanitized_prompt = re.sub(r"[^\w\s-]", "", prompt.lower())
        truncated_prompt = '_'.join(sanitized_prompt.split())

        # Construct the filename
        filename = f"{truncated_prompt[:70]}_{model}_{index}.png"

        return filename

    async def generate_api_response(
        self,
        api_data: ModelConfig,
        prompt: str,
        negative_prompt: Optional[str] = None,
        n: int = 1,
    ) -> References:
        """
        Generates images using the PixArtAlphaPipeline.
        
        Args:
            api_data (ModelConfig): Configuration data for the API (e.g., model name).
            prompt (str): A text description of the desired image(s).
            negative_prompt (Optional[str]): A negative text description to avoid certain aspects.
            n (int): The number of images to generate.
        
        Returns:
            References: Generated image information wrapped in a References object.
        """
        model_name = api_data.model
        if not model_name:
            LOGGER.error("No model specified.")
            raise ValueError("No model specified.")

        try:
            # Load text encoder in 8-bit precision to save VRAM
            text_encoder = T5EncoderModel.from_pretrained(
                model_name,
                subfolder="text_encoder",
                load_in_8bit=True,
                device_map="auto",
            )
            pipe = PixArtAlphaPipeline.from_pretrained(
                model_name,
                text_encoder=text_encoder,
                transformer=None,
                device_map="auto",
            )

            # Encode the prompt (this will use the text encoder)
            with torch.no_grad():
                prompt_embeds, prompt_attention_mask, negative_embeds, negative_prompt_attention_mask = pipe.encode_prompt(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                )

            # Remove text encoder and pipe to free up VRAM
            def flush():
                gc.collect()
                torch.cuda.empty_cache()

            del text_encoder
            del pipe
            flush()

            # Load the pipeline without the text encoder
            pipe = PixArtAlphaPipeline.from_pretrained(
                model_name,
                text_encoder=None,
                torch_dtype=torch.float16,
            ).to("cuda")

            # Generate images in batches if n > 1
            images = []
            batch_size = 1  # Adjust batch size as needed
            total_batches = (n + batch_size - 1) // batch_size

            for batch_num in range(total_batches):
                current_batch_size = min(batch_size, n - batch_num * batch_size)

                # Generate latents
                latents_output = pipe(
                    negative_prompt=None,
                    prompt_embeds=prompt_embeds,
                    negative_prompt_embeds=negative_embeds,
                    prompt_attention_mask=prompt_attention_mask,
                    negative_prompt_attention_mask=negative_prompt_attention_mask,
                    num_images_per_prompt=current_batch_size,
                    output_type="latent",
                )

                latents = latents_output.images

                # Remove transformer to free up VRAM
                del pipe.transformer
                flush()

                # Decode latents to images
                with torch.no_grad():
                    images_batch = pipe.vae.decode(
                        latents / pipe.vae.config.scaling_factor, return_dict=False
                    )[0]
                images_batch = pipe.image_processor.postprocess(images_batch, output_type="pil")

                images.extend(images_batch)

            # Cleanup
            del pipe
            flush()

            # Create FileContentReferences
            file_references: List[FileContentReference] = []
            for index, image in enumerate(images):
                # Convert image to bytes
                import io

                image_bytes = io.BytesIO()
                image.save(image_bytes, format="PNG")
                image_bytes = image_bytes.getvalue()

                filename = self.generate_filename(prompt, model_name, index + 1)
                file_references.append(
                    FileContentReference(
                        filename=filename,
                        type=FileType.IMAGE,
                        content=base64.b64encode(image_bytes).decode("utf-8"),
                        transcript=MessageDict(
                            role="tool",
                            content=f"Image generated by model {model_name}.\n\nPrompt: '{prompt}'\n\nNegative Prompt: '{negative_prompt}'",
                            type=ContentType.TEXT,
                            generated_by="tool",
                            creation_metadata={
                                "prompt": prompt,
                                "negative_prompt": negative_prompt,
                                "model": model_name,
                            },
                        ),
                    )
                )

            return References(files=file_references)

        except Exception as e:
            LOGGER.error(f"Error in PixArt image generation: {get_traceback()}")
            return References(
                messages=[
                    MessageDict(
                        role="system",
                        content=f"Error in PixArt image generation: {str(e)}\n\n" + get_traceback(),
                        type=ContentType.TEXT,
                    )
                ]
            )

        finally:
            # Ensure all resources are cleaned up
            flush()
