from pydantic import Field
from typing import List
from workflow_logic.util import LLMConfig, FileReference, MessageDict
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from .oai_stt_engine import OpenAISpeechToTextEngine
from openai import AsyncOpenAI

class OpenAIAdvancedSpeechToTextEngine(OpenAISpeechToTextEngine):
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
                ),
                "timestamp_granularities": ParameterDefinition(
                    type="array",
                    description="List of timestamp granularities to include.",
                    default=["word"]
                )
            },
            required=["file_reference"]
        )
    )

    async def generate_api_response(self, api_data: LLMConfig, file_reference: FileReference, model: str = "whisper-1", timestamp_granularities: List[str] = ["word"]) -> MessageDict:
        """
        Transcribes speech to text with detailed information using OpenAI's API.

        Args:
            api_data (LLMConfig): Configuration data for the API (e.g., API key, base URL).
            file_reference (FileReference): FileReference object for the audio file to transcribe.
            model (str): The name of the speech-to-text model to use.
            timestamp_granularities (List[str]): List of timestamp granularities to include.

        Returns:
            MessageDict: A message dict containing the detailed transcription.
        """
        client = AsyncOpenAI(
            api_key=api_data.api_key,
            base_url=api_data.base_url
        )

        try:
            with open(file_reference.filepath, "rb") as audio_file:
                transcript = await client.audio.transcriptions.create(
                    file=audio_file,
                    model=model,
                    response_format="verbose_json",
                    timestamp_granularities=timestamp_granularities
                )

            return MessageDict(
                role="assistant",
                content=transcript.text,
                generated_by="advanced_speech_to_text_model",
                type="text",
                references=[file_reference],
                creation_metadata={
                    "model": model,
                    "words": transcript.words,
                    "language": transcript.language,
                    "duration": transcript.duration
                }
            )
        except Exception as e:
            raise Exception(f"Error in OpenAI advanced speech-to-text API call: {str(e)}")