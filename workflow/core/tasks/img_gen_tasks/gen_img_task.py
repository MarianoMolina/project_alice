from typing import List
from pydantic import Field
from workflow.core.tasks.agent_tasks import BasicAgentTask
from workflow.core.data_structures import (
    FunctionParameters, ParameterDefinition, MessageDict, ApiType, References, NodeResponse, TasksEndCodeRouting
)
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
    start_node: str = Field(default='generate_image', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={
        'generate_image': {
            0: (None, False),
            1: ('generate_image', True),
        }
    }, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    async def execute_generate_image(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        prompt: str = kwargs.get('prompt', "")
        n: int = kwargs.get('n', 1)
        size: str = kwargs.get('size', "1024x1024")
        quality: str = kwargs.get('quality', "standard")
        
        try:
            new_messages = await self.agent.generate_image(api_manager=api_manager, prompt=prompt, n=n, size=size, quality=quality)
            if not new_messages:
                raise ValueError("No images generated")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_image",
                exit_code=0,
                references=References(files=[new_messages]),
                execution_order=len(execution_history)
            )
        except Exception as e:
            LOGGER.error(f"Error in image generation: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_image",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Image generation failed: {str(e)}",
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )