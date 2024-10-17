from typing import List, Optional
from pydantic import Field
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
from workflow.util import LOGGER, chunk_text
import base64
import re
import asyncio
import torch
import scipy.io.wavfile
import numpy as np
from transformers import AutoProcessor, BarkModel


class BarkEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string", description="The text to convert to speech."
                ),
                "preset": ParameterDefinition(
                    type="string",
                    description="The voice preset to use for the speech.",
                    default=None,
                ),
            },
            required=["input"],
        )
    )
    required_api: ApiType = Field(
        ApiType.LLM_MODEL, title="The API engine required"
    )

    async def generate_api_response(
        self,
        api_data: ModelConfig,
        input: str,
        preset: Optional[str] = None,
    ) -> References:
        """
        Converts text to speech using the Bark model and creates FileContentReferences.

        Args:
            api_data (ModelConfig): Configuration data for the model (e.g., model name).
            input (str): The text to convert to speech.
            preset (Optional[str]): The voice preset to use for the speech.

        Returns:
            References: A References object containing the generated audio files.
        """
        # Load the model and processor inside the method using the model specified in api_data
        model_name = api_data.model
        try:
            # Load the processor and model
            processor = AutoProcessor.from_pretrained(model_name)
            model = BarkModel.from_pretrained(model_name)

            # Move model to appropriate device
            device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
            model = model.to(device)

            # Get sample rate from the model's generation configuration
            sample_rate = model.generation_config.sample_rate

            # Define maximum input length per chunk based on Bark's limitations
            max_length = api_data.ctx_size or 1024

            # Split input into chunks if necessary
            if len(input) > max_length:
                # Use the chunk_text utility to split the input
                inputs = chunk_text(input, max_length)
            else:
                inputs = [input]

            responses: List[References] = []

            # Generate audio for each chunk
            for idx, chunk in enumerate(inputs):
                response = await self.generate_audio_chunk(
                    processor, model, device, sample_rate, chunk, preset, idx
                )
                responses.append(response)

            # Combine all file references into a single References object
            all_files = []
            all_messages = []
            for ref in responses:
                if ref.files:
                    all_files.extend(ref.files)
                if ref.messages:
                    all_messages.extend(ref.messages)
                    LOGGER.error("Error messages: " + str(ref.messages))

            return References(files=all_files, messages=all_messages)

        except Exception as e:
            import traceback
            LOGGER.error(f"Error in Bark audio generation: {traceback.format_exc()}")
            return References(
                messages=[
                    MessageDict(
                        role="system",
                        content=f"Error in Bark audio generation: {str(e)}",
                        type=ContentType.TEXT,
                    )
                ]
            )

        finally:
            # Unload model from device
            del model
            torch.cuda.empty_cache()

    async def generate_audio_chunk(
        self,
        processor: AutoProcessor,
        model: BarkModel,
        device: torch.device,
        sample_rate: int,
        input_text: str,
        preset: Optional[str],
        idx: int,
    ) -> References:
        try:
            LOGGER.debug(
                f"Generating audio for chunk {idx} with preset {preset}"
            )

            # Prepare inputs with the processor
            inputs = processor(
                input_text, voice_preset=preset, return_tensors="pt"
            ).to(device)

            # Define a function to generate and encode audio synchronously
            def generate_and_encode_audio():
                with torch.no_grad():
                    # Generate audio using the model
                    audio_array = model.generate(**inputs)
                    audio_array = audio_array.cpu().numpy().squeeze()

                    # Save audio to a BytesIO buffer
                    import io

                    buffer = io.BytesIO()
                    # Ensure the audio data is in the correct format
                    scipy.io.wavfile.write(
                        buffer,
                        rate=sample_rate,
                        data=(audio_array * 32767).astype(np.int16),
                    )
                    buffer.seek(0)
                    audio_data = buffer.read()
                    return audio_data

            # Run the synchronous code in an executor to avoid blocking
            audio_data = await asyncio.get_running_loop().run_in_executor(
                None, generate_and_encode_audio
            )

            # Generate filename
            output_filename = self.generate_filename(input_text, preset)

            creation_metadata = {
                "preset": preset,
                "input_text_length": len(input_text),
                "sample_rate": sample_rate,
            }

            # Create a transcript message with the text that generated the audio
            transcript_message = MessageDict(
                role="assistant",
                content=input_text,
                type=ContentType.TEXT,
                generated_by="user",
                creation_metadata=creation_metadata,
            )

            # Create a FileContentReference
            file_reference = FileContentReference(
                filename=output_filename,
                type=FileType.AUDIO,
                content=base64.b64encode(audio_data).decode("utf-8"),
                transcript=transcript_message,
            )

            return References(files=[file_reference])

        except Exception as e:
            import traceback

            LOGGER.error(f"Error generating audio: {traceback.format_exc()}")
            LOGGER.error(f"Error in Bark audio generation: {str(e)}")
            return References(
                messages=[
                    MessageDict(
                        role="system",
                        content=f"Error in Bark audio generation: {str(e)}",
                        type=ContentType.TEXT,
                    )
                ]
            )

    def generate_filename(self, input_text: str, preset: Optional[str] = None) -> str:
        """
        Generate a descriptive filename based on the input text and preset.
        """
        # Sanitize and truncate the input text for the filename
        sanitized_input = re.sub(r"[^\w\s-]", "", input_text.lower())
        truncated_input = " ".join(sanitized_input.split()[:5])  # Take first 5 words

        # Construct the filename
        filename = f"{truncated_input}"
        if preset:
            filename += f"_{preset}"
        filename += ".wav"

        # Replace spaces with underscores and ensure it's not too long
        filename = filename.replace(" ", "_")[:100]  # Limit to 100 characters

        return filename
