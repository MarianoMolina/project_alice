from typing import List, Tuple, Union, Dict, Optional
from pydantic import Field
from workflow.core.tasks.agent_tasks import BasicAgentTask
from workflow.core.data_structures import FunctionParameters, ParameterDefinition, MessageDict, ApiType, References
from workflow.core.api import APIManager
from workflow.util import LOGGER

class EmbeddingTask(BasicAgentTask):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string",
                    description="The input text to get embeddings for. Can be a string or an array of strings."
                ),
            },
            required=["input"]
        )
    )
    required_apis: List[ApiType] = Field([ApiType.EMBEDDINGS], description="A list of required APIs for the task")

    async def generate_agent_response(self, api_manager: APIManager, **kwargs) -> Tuple[Optional[References], int, Optional[Union[List[MessageDict], Dict[str, str]]]]:
        input_text: str = kwargs.get('input', "")
        new_messages = await self.agent.generate_embeddings(api_manager=api_manager, input=input_text)
        if not new_messages:
            LOGGER.error("No messages returned from agent.")
            return {}, 1, None
        return References(files=[new_messages]), 0, None