from typing import List
from pydantic import Field
from openai import AsyncOpenAI
from workflow.core.data_structures import (
    ModelConfig, ApiType, FileReference, MessageDict, References, FunctionParameters, ParameterDefinition, MessageGenerators, ContentType, RoleTypes
    )
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER

class SpeechToTextEngine(APIEngine):
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

        response_format = "text" if not timestamp_granularities else "verbose_json"

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

            msg = MessageDict(
                role=RoleTypes.ASSISTANT,
                content=f'Transcription: {transcription}',
                generated_by=MessageGenerators.TOOL,
                type=ContentType.TEXT,
                creation_metadata={
                    "model": model,
                    "length": len(transcription),
                }
            )
            return References(messages=[msg])
        except Exception as e:
            raise Exception(f"Error in OpenAI speech-to-text API call: {str(e)}")