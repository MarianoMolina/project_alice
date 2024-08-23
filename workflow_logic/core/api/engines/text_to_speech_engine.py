import os
from pathlib import Path
from pydantic import Field
from typing import Optional
from workflow_logic.util import LLMConfig, ApiType, FileReference, MessageDict, ContentType
from workflow_logic.core.api.engines.api_engine import APIEngine
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from openai import AsyncOpenAI

class OpenAITextToSpeechEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string",
                    description="The text to convert to speech."
                ),
                "model": ParameterDefinition(
                    type="string",
                    description="The name of the text-to-speech model to use.",
                    default="tts-1"
                ),
                "voice": ParameterDefinition(
                    type="string",
                    description="The voice to use for the speech.",
                    default="alloy"
                ),
                "output_path": ParameterDefinition(
                    type="string",
                    description="The path where the audio file should be saved.",
                    default=None
                )
            },
            required=["input"]
        )
    )
    required_api: ApiType = Field(ApiType.LLM_MODEL, title="The API engine required")

    async def generate_api_response(self, api_data: LLMConfig, input: str, model: str = "tts-1", voice: str = "alloy", output_path: Optional[str] = None) -> MessageDict:
        """
        Converts text to speech using OpenAI's API and saves the audio file.

        Args:
            api_data (LLMConfig): Configuration data for the API (e.g., API key, base URL).
            input (str): The text to convert to speech.
            model (str): The name of the text-to-speech model to use.
            voice (str): The voice to use for the speech.
            output_path (Optional[str]): The path where the audio file should be saved. If None, a default path will be used.

        Returns:
            MessageDict: A message dict containing information about the generated audio file.
        """
        client = AsyncOpenAI(
            api_key=api_data.api_key,
            base_url=api_data.base_url
        )

        try:
            response = await client.audio.speech.create(
                model=model,
                voice=voice,
                input=input
            )
            
            # This is a mess. Need to retrieve the raw data and pass it so the backend stores it and creates the filereference

            if output_path is None:
                output_path = Path(os.getcwd()) / "generated_speech.mp3"
            else:
                output_path = Path(output_path)

            # Ensure the directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # Stream the response to the file
            response.stream_to_file(output_path)

            file_reference = FileReference(
                filepath=str(output_path),
                file_type="audio/mp3"
            )

            return MessageDict(
                role="assistant",
                content=f"Speech generated and saved to {output_path}.\nScript: {input}\nVoice: {voice}\n Model: {model}",
                generated_by="tool",
                type=ContentType.AUDIO,
                references=[file_reference],
                creation_metadata={
                    "model": model,
                    "voice": voice,
                    "input_text_length": len(input)
                }
            )
        except Exception as e:
            raise Exception(f"Error in OpenAI text-to-speech API call: {str(e)}")