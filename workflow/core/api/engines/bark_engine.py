import base64, asyncio, torch, scipy.io.wavfile, numpy as np, os, gc
from typing import List
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
    RoleTypes, 
    MessageGenerators
)
from workflow.core.api.engines.text_to_speech_engine import TextToSpeechEngine
from workflow.util import LOGGER, chunk_text, get_traceback, check_cuda_availability
from transformers import AutoProcessor, BarkModel, AutoTokenizer

class BarkEngine(TextToSpeechEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string", 
                    description="The text to convert to speech."
                ),
                "voice": ParameterDefinition(
                    type="string",
                    description="The voice preset to use for speech generation.",
                    default="v2/en_speaker_6"
                ),
                "speed": ParameterDefinition(
                    type="number",
                    description="Speed factor for speech generation.",
                    default=1.0
                ),
            },
            required=["input"],
        )
    )
    required_api: ApiType = Field(
        ApiType.TEXT_TO_SPEECH, title="The API engine required"
    )

    async def generate_api_response(
        self, 
        api_data: ModelConfig, 
        input: str, 
        voice: str = "v2/en_speaker_6", 
        speed: float = 1.0, 
        **kwargs
    ) -> References:
        """
        Converts text to speech using the Bark model and creates FileContentReferences.
        """
        LOGGER.info(f"Starting audio generation with text: '{input[:100]}...', voice: '{voice}'")
        
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
            # Load the processor, tokenizer, and model with caching
            LOGGER.info("Loading Bark processor and model")
            processor = AutoProcessor.from_pretrained(
                model_name,
                cache_dir="/app/model_cache",
                local_files_only=False,
                token=os.getenv("HUGGINGFACE_TOKEN")
            )
            
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                cache_dir="/app/model_cache",
                local_files_only=False,
                token=os.getenv("HUGGINGFACE_TOKEN")
            )
            
            model = BarkModel.from_pretrained(
                model_name,
                cache_dir="/app/model_cache",
                local_files_only=False,
                token=os.getenv("HUGGINGFACE_TOKEN"),
                torch_dtype=torch.float32 if device == "cpu" else torch.float16
            ).to(device)

            # Configure the model's generation settings
            model.generation_config.pad_token_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id
            model.generation_config.eos_token_id = tokenizer.eos_token_id

            # Get sample rate from the model's generation configuration
            sample_rate = model.generation_config.sample_rate

            # Define maximum input length per chunk based on Bark's limitations
            max_length = api_data.ctx_size or 512  # Reduced from 1024 to be safer

            # Split input into chunks if necessary
            if len(input) > max_length:
                inputs = chunk_text(input, max_length)
            else:
                inputs = [input]

            responses: List[References] = []

            # Generate audio for each chunk
            for idx, chunk in enumerate(inputs):
                response = await self.generate_audio_chunk(
                    processor, model, device, sample_rate, chunk, voice, idx
                )
                responses.append(response)

            # Combine all file references
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
            LOGGER.error(f"Error in Bark audio generation: {str(e)}")
            LOGGER.error(f"Full traceback: {get_traceback()}")
            return References(
                messages=[
                    MessageDict(
                        role="system",
                        content=f"Error in Bark audio generation: {str(e)}\n\n" + get_traceback(),
                        type=ContentType.TEXT,
                    )
                ]
            )

        finally:
            LOGGER.info("Cleaning up resources")
            if 'model' in locals():
                del model
            flush()

    async def generate_audio_chunk(
        self,
        processor: AutoProcessor,
        model: BarkModel,
        device: torch.device,
        sample_rate: int,
        input_text: str,
        voice: str,
        idx: int,
    ) -> References:
        try:
            LOGGER.debug(f"Generating audio for chunk {idx} with voice {voice}")

            # Process the input text with attention mask
            inputs = processor(
                text=[input_text],  # Wrap in list to ensure batch processing
                voice_preset=voice,
                return_tensors="pt"
            )
            
            # Move all inputs to the correct device
            inputs = {k: v.to(device) if isinstance(v, torch.Tensor) else v 
                     for k, v in inputs.items()}

            # Create attention mask if not present
            if 'attention_mask' not in inputs:
                LOGGER.debug("Creating attention mask")
                # Create attention mask (1 for tokens, 0 for padding)
                attention_mask = torch.ones_like(inputs['input_ids'])
                inputs['attention_mask'] = attention_mask

            # Define a function to generate and encode audio synchronously
            def generate_and_encode_audio():
                with torch.no_grad():
                    # Generate audio using the model with attention mask
                    speech_output = model.generate(
                        **inputs,
                        do_sample=True,
                        max_length=None,  # Let model decide based on input
                        pad_token_id=model.generation_config.pad_token_id,
                        eos_token_id=model.generation_config.eos_token_id
                    )
                    
                    audio_array = speech_output.cpu().numpy().squeeze()

                    # Save audio to a BytesIO buffer
                    import io
                    buffer = io.BytesIO()
                    scipy.io.wavfile.write(
                        buffer,
                        rate=sample_rate,
                        data=(audio_array * 32767).astype(np.int16),
                    )
                    buffer.seek(0)
                    return buffer.read()

            # Run the synchronous code in an executor
            audio_data = await asyncio.get_running_loop().run_in_executor(
                None, generate_and_encode_audio
            )

            # Generate filename
            output_filename = self.generate_filename(input_text, voice, idx, "wav")

            creation_metadata = {
                "voice": voice,
                "input_text_length": len(input_text),
                "sample_rate": sample_rate,
            }

            # Create transcript message
            transcript_message = MessageDict(
                role=RoleTypes.TOOL,
                content=input_text,
                type=ContentType.TEXT,
                generated_by=MessageGenerators.USER,
                creation_metadata=creation_metadata,
            )

            # Create FileContentReference
            file_reference = FileContentReference(
                filename=output_filename,
                type=FileType.AUDIO,
                content=base64.b64encode(audio_data).decode("utf-8"),
                transcript=transcript_message,
            )

            return References(files=[file_reference])

        except Exception as e:
            LOGGER.error(f"Error generating audio chunk: {get_traceback()}")
            return References(
                messages=[
                    MessageDict(
                        role="system",
                        content=f"Error generating audio chunk: {str(e)}\n\n" + get_traceback(),
                        type=ContentType.TEXT,
                    )
                ]
            )