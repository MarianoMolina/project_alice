## Creating Custom Tasks

You can create custom tasks by extending the base AliceTask class or one of its specialized subclasses. Here's how to implement your own tasks using Pydantic models:

### 1. Extending AliceTask

Basic structure for a custom task:

```python
from pydantic import Field
from typing import Dict, List, Optional
from workflow.core.tasks import AliceTask
from workflow.core.data_structures import (
    NodeResponse, References, FunctionParameters, 
    ParameterDefinition, TasksEndCodeRouting
)

class CustomTask(AliceTask):
    """
    A custom task that implements specific functionality.
    """
    # Define task-specific fields using Pydantic
    custom_config: Dict[str, str] = Field(
        default_factory=dict,
        description="Custom configuration options"
    )
    
    start_node: str = Field(
        default="default",
        description="Starting node for execution"
    )
    
    node_end_code_routing: TasksEndCodeRouting = Field(
        default={
            'default': {
                0: (None, False),  # Success
                1: ('default', True)  # Retry on failure
            }
        },
        description="Node routing configuration"
    )
    
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input_data": ParameterDefinition(
                    type="string",
                    description="Data to process"
                )
            },
            required=["input_data"]
        ),
        description="Expected input structure"
    )

    async def execute_default(
        self, 
        execution_history: List[NodeResponse], 
        node_responses: List[NodeResponse], 
        **kwargs
    ) -> NodeResponse:
        try:
            # Implement your task logic
            result = await self.process_something(**kwargs)
            
            return NodeResponse(
                parent_task_id=self.id,
                node_name="default",
                exit_code=0,
                references=References(messages=[{
                    "role": "assistant",
                    "content": result,
                    "generated_by": "tool"
                }]),
                execution_order=len(execution_history)
            )
        except Exception as e:
            return self._create_error_response("default", str(e), len(execution_history))
```

### 2. Multi-Node Tasks

For tasks with multiple execution steps:

```python
from enum import IntEnum
from pydantic import Field
from typing import Dict, List, Optional

class ProcessingStage(IntEnum):
    SUCCESS = 0
    FAILURE = 1
    NEEDS_REVIEW = 2

class MultiStepTask(AliceTask):
    """
    Task implementing a multi-step processing workflow.
    """
    stage_config: Dict[str, Dict[str, any]] = Field(
        default_factory=dict,
        description="Configuration for each processing stage"
    )
    
    start_node: str = Field(
        default="prepare",
        description="Initial processing node"
    )
    
    node_end_code_routing: TasksEndCodeRouting = Field(
        default={
            "prepare": {
                ProcessingStage.SUCCESS: ("process", False),
                ProcessingStage.FAILURE: ("prepare", True)
            },
            "process": {
                ProcessingStage.SUCCESS: ("finalize", False),
                ProcessingStage.FAILURE: ("process", True),
                ProcessingStage.NEEDS_REVIEW: ("review", False)
            },
            "review": {
                ProcessingStage.SUCCESS: ("finalize", False),
                ProcessingStage.FAILURE: ("process", False)
            },
            "finalize": {
                ProcessingStage.SUCCESS: (None, False),
                ProcessingStage.FAILURE: ("finalize", True)
            }
        },
        description="Node routing configuration"
    )
    
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "data": ParameterDefinition(
                    type="object",
                    description="Data to process"
                ),
                "options": ParameterDefinition(
                    type="object",
                    description="Processing options",
                    default={}
                )
            },
            required=["data"]
        ),
        description="Task input parameters"
    )
    
    async def execute_prepare(
        self, 
        execution_history: List[NodeResponse],
        node_responses: List[NodeResponse],
        **kwargs
    ) -> NodeResponse:
        # Preparation logic
        pass
        
    async def execute_process(
        self,
        execution_history: List[NodeResponse],
        node_responses: List[NodeResponse],
        **kwargs
    ) -> NodeResponse:
        # Processing logic
        pass
```

### 3. API Integration Tasks

For tasks that interact with external services:

```python
from pydantic import Field
from typing import List
from workflow.core.data_structures import ApiType, FunctionParameters, ParameterDefinition

class CustomAPITask(APITask):
    """
    Task for interacting with a custom API service.
    """
    required_apis: List[ApiType] = Field(
        default=[ApiType.CUSTOM_API],
        min_length=1,
        max_length=1,
        description="Required API type"
    )
    
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "query": ParameterDefinition(
                    type="string",
                    description="Query to process"
                ),
                "filters": ParameterDefinition(
                    type="object",
                    description="Optional query filters",
                    default={}
                )
            },
            required=["query"]
        ),
        description="API query parameters"
    )
    
    api_config: Dict[str, str] = Field(
        default_factory=dict,
        description="API-specific configuration"
    )
```

### 4. Agent-Based Tasks

For tasks that use AI agents:

```python
from pydantic import Field
from typing import Dict, Optional
from workflow.core.data_structures import Prompt

class CustomAgentTask(PromptAgentTask):
    """
    Task utilizing an AI agent for processing.
    """
    templates: Dict[str, Prompt] = Field(
        default={
            "task_template": Prompt(
                content="Process this request: {input}\nContext: {context}",
                input_variables=["input", "context"]
            ),
            "output_template": Prompt(
                content="Processing Results:\n{llm_generation}\n\nTool Results: {tool_call_execution}",
                input_variables=["llm_generation", "tool_call_execution"]
            )
        },
        description="Prompt templates for agent interaction"
    )
    
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "input": ParameterDefinition(
                    type="string",
                    description="Input to process"
                ),
                "context": ParameterDefinition(
                    type="string",
                    description="Additional context",
                    default=""
                )
            },
            required=["input"]
        ),
        description="Task input parameters"
    )
```

### Design Patterns

#### 1. State Management
```python
from pydantic import Field
from typing import Dict, Any

class StatefulTask(AliceTask):
    state: Dict[str, Any] = Field(
        default_factory=dict,
        description="Task execution state"
    )
    
    state_schema: Dict[str, Any] = Field(
        default_factory=dict,
        description="Schema for validating state updates"
    )
    
    @model_validator(mode='after')
    def validate_state(cls, values):
        if values.state and values.state_schema:
            # Validate state against schema
            pass
        return values
```

#### 2. Resource Management
```python
from pydantic import Field
from typing import Optional

class ResourceTask(AliceTask):
    resource_config: Dict[str, Any] = Field(
        default_factory=dict,
        description="Resource configuration"
    )
    
    cleanup_required: bool = Field(
        default=True,
        description="Whether cleanup is needed"
    )
    
    @model_validator(mode='after')
    def validate_resources(cls, values):
        if values.resource_config:
            # Validate resource configuration
            pass
        return values
```

### Best Practices for Custom Tasks

1. **Pydantic Usage**
   - Use Field() for all attributes with descriptions and defaults
   - Implement model validators for complex validation
   - Use appropriate types and type hints
   - Define clear schemas for input/output

2. **Input Validation**
   - Use FunctionParameters with clear ParameterDefinitions
   - Implement custom validators where needed
   - Provide meaningful error messages

3. **Node Design**
   - Use descriptive node names as constants
   - Implement clear routing logic
   - Use enums for exit codes

4. **Type Safety**
   - Use proper type hints throughout
   - Leverage Pydantic's type checking
   - Define custom types where needed

5. **Documentation**
   - Use descriptive docstrings
   - Document all fields and methods
   - Include usage examples