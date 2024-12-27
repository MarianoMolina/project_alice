from typing import List
from pydantic import Field
from openai import AsyncOpenAI
from workflow.core.data_structures import (
    ModelConfig, ApiType, FileReference, MessageDict, References, FunctionParameters, ParameterDefinition, MessageGenerators, ContentType, RoleTypes
    )
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER

class SpeechToTextEngine(APIEngine):
    """
    Speech-to-text API engine implementing the OpenAI Whisper interface.
    
    Provides a standardized interface for audio transcription services,
    with a default implementation using OpenAI's Whisper model. Supports:
    - Audio file transcription
    - Optional timestamp generation
    - Multiple granularity levels
    
    Input Interface:
        - file_reference: Audio file to transcribe
        - prompt: Optional guidance for transcription
        - timestamp_granularities: Optional timestamp detail levels
    
    Returns:
        References object containing MessageDict with:
        - Transcribed text
        - Timestamps (if requested)
        - Model and processing metadata
    
    Note:
        While the default implementation uses Whisper, the interface
        is designed to work with any speech-to-text service that can
        accept audio files and return text transcriptions.
    """
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "file_reference": ParameterDefinition(
                    type="object",
                    description="FileReference object for the audio file to transcribe."
                ),
                "prompt": ParameterDefinition(
                    type="string",
                    description="A prompt to guide the audio transcription and analysis. Not all models use it.",
                    default="Transcribe and describe this audio clip"
                ),
                "timestamp_granularities": ParameterDefinition(
                    type="array",
                    description="Optional list of timestamp granularities to include. Options are 'word' and 'segment'.",
                    default=[]
                )
            },
            required=["file_reference"]
        )
    )
    required_api: ApiType = Field(ApiType.SPEECH_TO_TEXT, title="The API engine required")

    async def generate_api_response(self, api_data: ModelConfig, file_reference: FileReference, timestamp_granularities: List[str] = []) -> References:
        """
        Transcribes speech to text using OpenAI's API.

        Args:
            api_data (ModelConfig): Configuration data for the API (e.g., API key, base URL).
            file_reference (FileReference): FileReference object for the audio file to transcribe.
            model (str): The name of the speech-to-text model to use.

        Returns:
            References: A message dict containing the transcription.
        """
        LOGGER.info(f"Transcribing audio file {file_reference.storage_path} using OpenAI speech-to-text model {model}")
        LOGGER.info(f"API data: {api_data}")
        client = AsyncOpenAI(
            api_key=api_data.api_key,
            base_url=api_data.base_url
        )
        model = api_data.model
        if model != 'whisper-1':
            LOGGER.debug(f"Model {model} not recognized. Defaulting to whisper-1.")
            model = 'whisper-1'

        response_format = "verbose_json"

        # validate timestamp_granularities
        for granularity in timestamp_granularities:
            if granularity not in ["word", "segment"]:
                # remove it from the list
                timestamp_granularities.remove(granularity)

        try:
            with open(file_reference.storage_path, "rb") as audio_file:
                transcription = await client.audio.transcriptions.create(
                    model=model, 
                    file=audio_file, 
                    response_format=response_format,
                    timestamp_granularities=timestamp_granularities
                )
            transcript = transcription if isinstance(transcription, str) else transcription.text
            duration = transcription.duration if 'duration' in transcription else None
            msg = MessageDict(
                role=RoleTypes.ASSISTANT,
                content=f'Transcription: {transcript}',
                generated_by=MessageGenerators.TOOL,
                type=ContentType.TEXT,
                creation_metadata={
                    "model": model,
                    "generation_details": {
                        "length": len(transcript),  
                    },
                    "cost": {
                        "total_cost": api_data.model_costs.cost_per_unit * duration if duration else 0
                        }
                }
            )
            return References(messages=[msg])
        except Exception as e:
            raise Exception(f"Error in OpenAI speech-to-text API call: {str(e)}")