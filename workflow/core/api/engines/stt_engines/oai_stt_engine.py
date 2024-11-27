from pydantic import Field
from openai import AsyncOpenAI
from workflow.core.data_structures import (
    ModelConfig, ApiType, FileReference, MessageDict, References, FunctionParameters, ParameterDefinition, MessageGenerators, ContentType, RoleTypes
    )
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER

class OpenAISpeechToTextEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "file_reference": ParameterDefinition(
                    type="object",
                    description="FileReference object for the audio file to transcribe."
                ),
                "model": ParameterDefinition(
                    type="string",
                    description="The name of the speech-to-text model to use.",
                    default="whisper-1"
                )
            },
            required=["file_reference"]
        )
    )
    required_api: ApiType = Field(ApiType.SPEECH_TO_TEXT, title="The API engine required")

    async def generate_api_response(self, api_data: ModelConfig, file_reference: FileReference) -> References:
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

        try:
            with open(file_reference.storage_path, "rb") as audio_file:
                transcription = await client.audio.transcriptions.create(
                    model=model, 
                    file=audio_file, 
                    response_format="text"
                )

            msg = MessageDict(
                role=RoleTypes.ASSISTANT,
                content=f'Transcription: {transcription}',
                generated_by=MessageGenerators.TOOL,
                type=ContentType.TEXT,
                creation_metadata={
                    "model": model,
                }
            )
            return References(messages=[msg])
        except Exception as e:
            raise Exception(f"Error in OpenAI speech-to-text API call: {str(e)}")