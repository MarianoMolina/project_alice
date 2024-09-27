from typing import List, Tuple, Union, Dict, Optional
from pydantic import Field
from workflow_logic.core.tasks.agent_tasks import FileTask
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from workflow_logic.core.data_structures import MessageDict, ApiType
from workflow_logic.core.api import APIManager
from workflow_logic.util import LOGGER

class TextToSpeechTask(FileTask):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "text": ParameterDefinition(
                    type="string",
                    description="The text to convert to speech."
                ),
                "voice": ParameterDefinition(
                    type="string",
                    description="The voice to use for the speech synthesis.",
                    default="nova"
                ),
                "speed": ParameterDefinition(
                    type="number",
                    description="The speed of the speech synthesis.",
                    default=1.0
                )
            },
            required=["text"]
        )
    )
    required_apis: List[ApiType] = Field([ApiType.TEXT_TO_SPEECH], description="A list of required APIs for the task")

    async def generate_response(self, api_manager: APIManager, **kwargs) -> Tuple[List[MessageDict], int, Optional[Union[List[MessageDict], Dict[str, str]]]]:
        text: str = kwargs.get('text', "")
        voice: str = kwargs.get('voice', "nova")
        speed: float = kwargs.get('speed', 1.0)

        new_messages = await self.agent.generate_speech(api_manager=api_manager, input=text, voice=voice, speed=speed)
        if not new_messages:
            LOGGER.error("No messages returned from agent.")
            return [], 1, None
        return [new_messages], 0, None