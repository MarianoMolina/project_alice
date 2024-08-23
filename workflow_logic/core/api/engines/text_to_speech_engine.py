import base64
import re
from pydantic import Field
from typing import Optional
from workflow_logic.core.data_structures import LLMConfig, ApiType, FileContentReference, MessageDict, ContentType, FileType
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
                "output_filename": ParameterDefinition(
                    type="string",
                    description="The filename for the generated audio file. If not provided, a descriptive name will be generated.",
                    default=None
                )
            },
            required=["input"]
        )
    )
    required_api: ApiType = Field(ApiType.LLM_MODEL, title="The API engine required")

    def generate_filename(self, input: str, model: str, voice: str) -> str:
        """
        Generate a descriptive filename based on the input text, model, and voice.
        """
        # Sanitize and truncate the input text for the filename
        sanitized_input = re.sub(r'[^\w\s-]', '', input.lower())
        truncated_input = ' '.join(sanitized_input.split()[:5])  # Take first 5 words
        
        # Construct the filename
        filename = f"{truncated_input}_{model}_{voice}.mp3"
        
        # Replace spaces with underscores and ensure it's not too long
        filename = filename.replace(' ', '_')[:100]  # Limit to 100 characters
        
        return filename

    async def generate_api_response(self, api_data: LLMConfig, input: str, model: str = "tts-1", voice: str = "alloy", output_filename: Optional[str] = None) -> MessageDict:
        """
        Converts text to speech using OpenAI's API and creates a FileContentReference.
        Args:
            api_data (LLMConfig): Configuration data for the API (e.g., API key, base URL).
            input (str): The text to convert to speech.
            model (str): The name of the text-to-speech model to use.
            voice (str): The voice to use for the speech.
            output_filename (Optional[str]): The filename for the generated audio file. If None, a descriptive name will be generated.
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
           
            # Get the raw audio data
            audio_data = await response.read()
            
            # Generate filename if not provided
            if not output_filename:
                output_filename = self.generate_filename(input, model, voice)
            
            # Create a FileContentReference
            file_reference = FileContentReference(
                filename=output_filename,
                type=FileType.AUDIO,
                content=base64.b64encode(audio_data).decode('utf-8'),
                created_by="OpenAITextToSpeechEngine"
            )

            return MessageDict(
                role="assistant",
                content=f"Speech generated and saved as {output_filename}.\nScript: {input}\nVoice: {voice}\nModel: {model}",
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