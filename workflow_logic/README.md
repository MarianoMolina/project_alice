# Workflow Module README

## Overview

The Workflow container is a Python-based module that serves as the core engine for task execution, chat completions, and database management in the Alice project. It consists of three major components:

1. **Api_app**: FastAPI endpoint for running tasks and chat completions.
2. **Core**: Main functionality of the app, including Agents, API/APIEngines, Chat, Model, Parameter, Prompt, and Tasks.
3. **db_app**: Database manager for interacting with the backend container and MongoDB.

## Main Components

### 1. Api_app

- FastAPI endpoint for task execution and chat completions
- Handles various API requests related to workflow operations

### 2. Core

The core module contains the main functionality of the application:

- **Agents**: Implementation of AI agents
- **API / APIEngines**: Interfaces for various API integrations
- **Chat**: Chat functionality and response generation
- **Model**: Model definitions and configurations
- **Parameter**: Parameter handling for tasks and prompts
- **Prompt**: Prompt management and templating
- **Tasks**: Task definitions and execution logic

#### Main Entry Points

1. **Chat Response Generation**
   - Uses agent implementation, LLM_MODEL API engines, and tasks
   - Produces responses in the form of MessageDict objects

2. **Task Execution**
   - Takes inputs and returns a TaskResponse

### 3. db_app

- Manages the relationship with the backend container
- Handles CRUD operations on MongoDB
- Initializes new databases with pre-built modules

## Environment Variables

The following environment variables are relevant for this module:

- `BACKEND_PORT`: Port for the backend service
- `FRONTEND_PORT`: Port for the frontend service
- `WORKFLOW_PORT`: Port for the workflow service
- `HOST`: Host address
- `ADMIN_TOKEN`: Admin authentication token
- `LOG_LEVEL`: Logging level (default: INFO)
- `LOGGING_FOLDER`: Folder for log files

Refer to the `const.py` file for a complete list of environment variables and their default values.

## Adding New Modules to Initialization Logic

To add new modules to the initialization logic:

1. Create a new Python file in the `workflow_logic/db_app/initialization/modules` directory.
2. Define a new `InitializationModule` class in the file.
3. Add the new module to the `modular_db` in `workflow_logic/db_app/initialization/data_init.py`.

Example:

```python
from workflow_logic.db_app.initialization.modules.init_module import InitializationModule

class NewModule(InitializationModule):
    name: str = "new_module"
    dependencies: List[str] = ["base"]
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

new_module = NewModule(
    data = {
        # Define your module data here
    }
)

# In data_init.py
modular_db.add_module(new_module)
```

## Creating and Deploying New Tasks

To create a new task:

1. Create a new Python file in the `workflow_logic/core/tasks` directory.
2. Define a new task class that inherits from `AliceTask`.
3. Implement the `run` method for the task.
4. Add the new task to the `available_task_types` list in `workflow_logic/core/tasks/task_utils.py`.

Example:

```python
from workflow_logic.core.tasks.task import AliceTask
from workflow_logic.util import TaskResponse

class NewTask(AliceTask):
    async def run(self, **kwargs) -> TaskResponse:
        # Implement task logic here
        pass

# In task_utils.py
available_task_types.append(NewTask)
```

## Creating and Deploying New API / API Engine Pairs

To create a new API and API Engine pair:

1. Define a new API type in the `ApiType` enum in `workflow_logic/util/__init__.py`.
2. Create a new API Engine class in `workflow_logic/core/api/engines`.
3. Add the new API Engine to the `ApiEngineMap` in `workflow_logic/core/api/api_manager.py`.
4. Update the `APITask` class in `workflow_logic/core/tasks/api_task.py` to include the new API type.

Example:

```python
# In __init__.py
class ApiType(str, Enum):
    NEW_API = 'new_api'

# In engines/new_api_engine.py
class NewAPIEngine(APIEngine):
    async def generate_api_response(self, api_data: Dict[str, Any], **kwargs) -> Union[SearchOutput, MessageDict]:
        # Implement API logic here
        pass

# In api_manager.py
ApiEngineMap = {
    # ...
    ApiType.NEW_API: {
        ApiName.NEW_API: NewAPIEngine,
    },
}

# In api_task.py
class APITask(AliceTask):
    @model_validator(mode='after')
    def validate_api_task(cls, values):
        # Add new API type to validation logic
        api_engine_map = {
            # ...
            ApiType.NEW_API: NewAPIEngine,
        }
```

## Task Types

The Workflow container supports various task types, each designed for specific purposes. Here's an overview of the major task types and their variations:

### Major Task Types

1. **BasicAgentTask**
   - Purpose: General-purpose tasks executed by an AI agent
   - Key Properties:
     - `agent`: The AI agent executing the task
     - `templates`: Dictionary of prompts/templates used by the agent
   - Usage: Ideal for tasks that require complex reasoning or decision-making

2. **PromptAgentTask**
   - Purpose: Tasks that use templated prompts for execution
   - Key Properties:
     - `agent`: The AI agent executing the task
     - `templates`: Dictionary of prompts/templates, including a `task_template`
   - Usage: Suitable for tasks with structured input and output requirements

3. **APITask**
   - Purpose: Tasks that interact with external APIs
   - Key Properties:
     - `required_apis`: List of required API types (e.g., GOOGLE_SEARCH, WIKIPEDIA_SEARCH)
     - `api_engine`: The specific API engine to use
   - Usage: Used for tasks that need to fetch or process data from external sources

4. **Workflow**
   - Purpose: Combine multiple tasks into a sequential or conditional flow
   - Key Properties:
     - `tasks`: Dictionary of subtasks
     - `start_task`: The initial task to execute
     - `tasks_end_code_routing`: Dictionary defining the flow between tasks based on exit codes
   - Usage: For creating complex processes involving multiple steps or decision points

### PromptAgentTask Variations

1. **CheckTask**
   - Purpose: Validate or check specific conditions
   - Additional Properties:
     - `exit_code_response_map`: Maps specific responses to exit codes
   - Usage: Useful for quality control or decision-making steps in a workflow

2. **CodeGenerationLLMTask**
   - Purpose: Generate code based on prompts
   - Additional Properties:
     - `valid_languages`: List of programming languages the task can work with
   - Usage: For tasks that involve code generation or code-related prompts

3. **CodeExecutionLLMTask**
   - Purpose: Execute code snippets
   - Additional Properties:
     - `timeout`: Maximum execution time for the code
   - Usage: For tasks that need to run and evaluate code as part of their process

### Creating New Task Implementations

To create a new task implementation:

1. Decide which major task type your new task most closely resembles.
2. Create a new class that inherits from the appropriate base task type.
3. Override the `run` method to implement the specific logic of your task.
4. Add any additional properties or methods specific to your task.

Example of creating a new PromptAgentTask:

```python
from workflow_logic.core.tasks import PromptAgentTask
from workflow_logic.util import TaskResponse

class MyCustomTask(PromptAgentTask):
    custom_property: str = "default_value"

    async def run(self, **kwargs) -> TaskResponse:
        # Implement your task logic here
        result = await self.agent.generate_response(
            api_manager=kwargs['api_manager'],
            messages=[{"role": "user", "content": kwargs['prompt']}]
        )
        
        # Process the result and create a TaskResponse
        return TaskResponse(
            task_id=self.id,
            task_name=self.task_name,
            task_description=self.task_description,
            status="complete",
            result_code=0,
            task_outputs=str(result),
            task_inputs=kwargs
        )

# Don't forget to add your new task to available_task_types in task_utils.py
```

When creating new tasks, consider the following:

- Ensure your task handles errors appropriately and returns a valid TaskResponse.
- If your task requires specific APIs or resources, add them to the `required_apis` list.
- For tasks that involve code execution, implement proper security measures and timeout handling.
- If your task is part of a workflow, make sure it integrates well with the workflow's task routing mechanism.

By understanding these task types and their properties, you can create powerful and flexible task implementations that fit seamlessly into the Workflow container's ecosystem.

## Testing

The `tests` module contains unit tests for various components of the Workflow container. To run tests:

```
python -m pytest tests/
```

## Logging

Logging is configured in the `workflow_logic/util/logging_config.py` file. Logs are stored in the directory specified by the `LOGGING_FOLDER` environment variable.

## Support

For any issues or questions, please contact the development team or refer to the main project documentation.