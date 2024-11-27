import torch, gc, base64, os
from typing import List, Optional
from pydantic import Field
from diffusers import PixArtAlphaPipeline
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
    MessageGenerators,
    RoleTypes
)
from workflow.core.api.engines.image_gen_engine import ImageGenerationEngine
from workflow.util import LOGGER, get_traceback, check_cuda_availability

class PixArtImgGenEngine(ImageGenerationEngine):
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
            },
            required=["prompt"],
        )
    )
    required_api: ApiType = Field(
        ApiType.IMG_GENERATION, title="The API engine required"
    )

    async def generate_api_response(
        self,
        api_data: ModelConfig,
        prompt: str,
        negative_prompt: Optional[str] = None,
        n: int = 1,
        **kwargs,
    ) -> References:
        """
        Generates images using the PixArtAlphaPipeline.
        """
        LOGGER.info(f"Starting image generation with prompt: '{prompt}', negative_prompt: '{negative_prompt}', n: {n}")
        
        model_name = api_data.model
        if not model_name:
            LOGGER.error("No model specified in api_data")
            raise ValueError("No model specified.")

        LOGGER.info(f"Using model: {model_name}")

        # Check CUDA availability
        cuda_available = check_cuda_availability()
        device = "cuda" if cuda_available else "cpu"
        LOGGER.info(f"Using device: {device}")

        def flush():
            LOGGER.debug("Performing memory flush")
            gc.collect()
            if cuda_available:
                torch.cuda.empty_cache()
                LOGGER.debug(f"Current CUDA memory allocated: {torch.cuda.memory_allocated() / 1e9:.2f}GB")

        try:
            # Load the pipeline
            LOGGER.info("Loading PixArtAlphaPipeline")
            pipe = PixArtAlphaPipeline.from_pretrained(
                model_name,
                cache_dir="/app/model_cache",
                local_files_only=False,
                token=os.getenv("HUGGINGFACE_TOKEN"),
                torch_dtype=torch.float32 if device == "cpu" else torch.float16,
            ).to(device)
            
            LOGGER.info("Generating images")
            images = []
            batch_size = 1
            total_batches = (n + batch_size - 1) // batch_size

            for batch_num in range(total_batches):
                current_batch_size = min(batch_size, n - batch_num * batch_size)
                LOGGER.info(f"Processing batch {batch_num + 1}/{total_batches} with size {current_batch_size}")

                images_batch = pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    num_images_per_prompt=current_batch_size,
                ).images

                LOGGER.info(f"Successfully generated {len(images_batch)} images in batch")
                images.extend(images_batch)

            LOGGER.info("Creating file references")
            file_references: List[FileContentReference] = []
            for index, image in enumerate(images):
                LOGGER.debug(f"Processing image {index + 1}/{len(images)}")
                import io
                image_bytes = io.BytesIO()
                image.save(image_bytes, format="PNG")
                image_bytes = image_bytes.getvalue()

                filename = self.generate_filename(prompt, model_name, index + 1, 'png')
                LOGGER.debug(f"Generated filename: {filename}")
                
                file_references.append(
                    FileContentReference(
                        filename=filename,
                        type=FileType.IMAGE,
                        content=base64.b64encode(image_bytes).decode("utf-8"),
                        transcript=MessageDict(
                            role=RoleTypes.TOOL,
                            content=f"Image generated by model {model_name}.\n\nPrompt: '{prompt}'\n\nNegative Prompt: '{negative_prompt}'",
                            type=ContentType.TEXT,
                            generated_by=MessageGenerators.TOOL,
                            creation_metadata={
                                "prompt": prompt,
                                "negative_prompt": negative_prompt,
                                "model": model_name,
                            },
                        ),
                    )
                )

            LOGGER.info(f"Successfully created {len(file_references)} file references")
            return References(files=file_references)

        except Exception as e:
            LOGGER.error(f"Error in PixArt image generation: {str(e)}")
            LOGGER.error(f"Full traceback: {get_traceback()}")
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
            LOGGER.info("Cleaning up resources")
            if 'pipe' in locals():
                del pipe
            flush()