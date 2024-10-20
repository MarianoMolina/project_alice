from typing import List, Tuple, Union, Dict, Optional
from pydantic import Field
from workflow.core.tasks.agent_tasks import BasicAgentTask
from workflow.core.data_structures.base_models import TasksEndCodeRouting
from workflow.core.data_structures import MessageDict, ApiType, References, FunctionParameters, ParameterDefinition
from workflow.core.api import APIManager
from workflow.util import LOGGER

class GenerateImageTask(BasicAgentTask):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
                    type="string",
                    description="A text description of the desired image(s)."
                ),
                "n": ParameterDefinition(
                    type="integer",
                    description="The number of images to generate.",
                    default=1
                ),
                "size": ParameterDefinition(
                    type="string",
                    description="The size of the generated images.",
                    default="1024x1024"
                ),
                "quality": ParameterDefinition(
                    type="string",
                    description="The quality of the image generation.",
                    default="standard"
                )
            },
            required=["prompt"]
        )
    )
    required_apis: List[ApiType] = Field([ApiType.IMG_GENERATION], description="A list of required APIs for the task")
    start_node: Optional[str] = Field(default=None, description="The name of the starting node")
    node_end_code_routing: Optional[TasksEndCodeRouting] = Field(default=None, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    async def generate_agent_response(self, api_manager: APIManager, **kwargs) ->  Tuple[Optional[References], int, Optional[Union[List[MessageDict], Dict[str, str]]]]:
        prompt: str = kwargs.get('prompt', "")
        n: int = kwargs.get('n', 1)
        size: str = kwargs.get('size', "1024x1024")
        quality: str = kwargs.get('quality', "standard")

        new_messages = await self.agent.generate_image(api_manager=api_manager, prompt=prompt, n=n, size=size, quality=quality)
        if not new_messages:
            LOGGER.error("No messages returned from agent.")
            return {}, 1, None
        return References(files=[new_messages]), 0, None