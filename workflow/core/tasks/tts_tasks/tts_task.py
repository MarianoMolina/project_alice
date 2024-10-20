from typing import List, Tuple, Union, Dict, Optional
from pydantic import Field
from workflow.core.tasks.agent_tasks import BasicAgentTask
from workflow.core.data_structures import MessageDict, ApiType, References, FunctionParameters, ParameterDefinition
from workflow.core.api import APIManager
from workflow.util import LOGGER
from workflow.core.data_structures.base_models import TasksEndCodeRouting

class TextToSpeechTask(BasicAgentTask):
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
    start_node: Optional[str] = Field(default=None, description="The name of the starting node")
    node_end_code_routing: Optional[TasksEndCodeRouting] = Field(default=None, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    async def generate_agent_response(self, api_manager: APIManager, **kwargs) -> Tuple[Optional[References], int, Optional[Union[List[MessageDict], Dict[str, str]]]]:
        text: str = kwargs.get('text', "")
        voice: str = kwargs.get('voice', "nova")
        speed: float = kwargs.get('speed', 1.0)

        new_messages = await self.agent.generate_speech(api_manager=api_manager, input=text, voice=voice, speed=speed)
        if not new_messages:
            LOGGER.error("No messages returned from agent.")
            return {}, 1, None
        return References(files=[new_messages]), 0, None