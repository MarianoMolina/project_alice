from typing import List
from pydantic import Field
from workflow.core.tasks.task import AliceTask
from workflow.core.agent import AliceAgent
from workflow.core.data_structures import (
    FunctionParameters, ParameterDefinition, MessageDict, ApiType, References, NodeResponse, TasksEndCodeRouting
)
from workflow.core.api import APIManager
from workflow.util import LOGGER, get_traceback

class GenerateImageTask(AliceTask):
    """
    A specialized task for generating images from text descriptions using AI image generation models.

    GenerateImageTask handles text-to-image generation, supporting various image sizes,
    quality settings, and the ability to generate multiple images from a single prompt.

    Key Features:
    -------------
    * Image Generation:
        - Creates images from text descriptions
        - Supports multiple image sizes
        - Configurable quality settings

    * Batch Processing:
        - Can generate multiple images
        - Consistent naming and metadata
        - Parallel generation support

    Attributes:
    -----------
    agent : AliceAgent
        Agent configured with image generation model capabilities
        
    input_variables : FunctionParameters
        Accepts:
        - prompt (str): Text description of desired image(s)
        - n (int, optional): Number of images to generate (default: 1)
        - size (str, optional): Image dimensions (default: "1024x1024")
        - quality (str, optional): Generation quality (default: "standard")
        
    required_apis : List[ApiType]
        [ApiType.IMG_GENERATION]

    Example:
    --------
    ```python
    image_task = GenerateImageTask(
        agent=agent_with_image_gen,
        task_name="generate_images",
        task_description="Create images from text descriptions"
    )
    
    response = await image_task.run(
        prompt="A serene mountain landscape at sunset",
        n=2,
        size="1024x1024",
        quality="high"
    )
    # Access generated images through response.node_references[0].references.files
    ```

    Notes:
    ------
    1. File Management:
        - Generated images are returned as FileContentReference objects
        - Includes both base64 content and metadata
        - Consistent file naming based on prompts

    2. Quality Control:
        - Supports different quality levels
        - Size validation and adjustment
        - Error handling for generation failures
    """
    agent: AliceAgent = Field(..., description="The agent to use for the task")
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
                references=References(files=new_messages),
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
                    content=f"Image generation failed: {str(e)}\n\n" + get_traceback(),
                    generated_by="system"
                )]),
                execution_order=len(execution_history)
            )