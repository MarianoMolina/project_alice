from google.generativeai.types import GenerateContentResponse
import google.generativeai as genai
from workflow.core.data_structures import (
    ModelConfig,
    ApiType,
    FileReference,
    MessageDict,
    References,
    MessageGenerators,
    RoleTypes,
    ContentType,
)
from workflow.core.api.engines.stt_engines.stt_engine import SpeechToTextEngine
from workflow.util import LOGGER
import io


class GeminiSpeechToTextEngine(SpeechToTextEngine):

    async def generate_api_response(
        self,
        api_data: ModelConfig,
        file_reference: FileReference,
        prompt: str = "Transcribe and describe this audio clip",
    ) -> References:
        """
        Transcribes speech to text using Google's Gemini API.

        Args:
            api_data (ModelConfig): Configuration data for the API (e.g., API key, model name).
            file_reference (FileReference): FileReference object for the audio file to transcribe.
            prompt (str): A prompt to guide the audio transcription and analysis.

        Returns:
            References: A message dict containing the transcription and description.
        """
        LOGGER.info(
            f"Transcribing audio file {file_reference.filename} using Gemini model {api_data.model}"
        )
        LOGGER.info(f"API data: {api_data}")

        genai.configure(api_key=api_data.api_key)
        model = genai.GenerativeModel(api_data.model)

        try:
            # Read the file content
            file_content = file_reference.content
            if isinstance(file_content, str):
                # If content is a base64 string, decode it
                import base64

                file_content = base64.b64decode(file_content)

            # Create a file-like object from the content
            file_obj = io.BytesIO(file_content)
            file_obj.name = (
                file_reference.filename
            )  # Set a name for the file-like object

            # Upload the file to Gemini
            myfile = genai.upload_file(file_obj)

            # Generate content based on the audio file and prompt
            result: GenerateContentResponse = model.generate_content([myfile, prompt])

            msg = MessageDict(
                role=RoleTypes.ASSISTANT,
                content=result.text,
                generated_by=MessageGenerators.TOOL,
                type=ContentType.TEXT,
                creation_metadata={
                    "model": api_data.model,
                    "usage": {
                        "prompt_tokens": result.usage_metadata.prompt_token_count,
                        "completion_tokens": result.candidates[0].token_count,
                        "total_tokens": result.usage_metadata.total_token_count,
                    },
                    "finish_reason": result.candidates[0].finish_reason.name,
                },
            )
            return References(messages=[msg])

        except Exception as e:
            LOGGER.error(f"Error in Gemini speech-to-text API call: {str(e)}")
            raise Exception(f"Error in Gemini speech-to-text API call: {str(e)}")
