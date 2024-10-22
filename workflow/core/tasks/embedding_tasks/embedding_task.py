from typing import List
from pydantic import Field
from workflow.core.tasks.agent_tasks import BasicAgentTask
from workflow.core.data_structures import (
    FunctionParameters, ParameterDefinition, MessageDict, ApiType, References, NodeResponse, TasksEndCodeRouting
)
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
    start_node: str = Field(default='generate_embedding', description="The name of the starting node")
    node_end_code_routing: TasksEndCodeRouting = Field(default={
        'generate_embedding': {
            0: (None, False),
            1: ('generate_embedding', True),
        }
    }, description="A dictionary of tasks/nodes -> exit codes and the task to route to given each exit code")

    async def execute_generate_embedding(self, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        api_manager: APIManager = kwargs.get("api_manager")
        input_text: str = kwargs.get('input', "")
        
        try:
            new_file = await self.agent.generate_embeddings(api_manager=api_manager, input=input_text)
            if not new_file:
                raise ValueError("No embeddings generated")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_embedding",
                exit_code=0,
                references=References(files=[new_file])
            )
        except Exception as e:
            LOGGER.error(f"Error in embedding generation: {e}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name="generate_embedding",
                exit_code=1,
                references=References(messages=[MessageDict(
                    role="system",
                    content=f"Embedding generation failed: {str(e)}",
                    generated_by="system"
                )])
            )