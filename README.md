# Alice: Advanced Language Intelligence and Cognitive Engine

Alice is a sophisticated AI assistant framework that integrates task execution and intelligent chat capabilities. It provides a flexible environment for creating, managing, and deploying AI agents for various purposes, leveraging a microservices architecture with MongoDB for data persistence.

## Project Structure

The project consists of three main components:

1. Backend (Node.js with Express - TS)
2. Workflow (Python - Pydantic)
3. Frontend (React - TS)

## Features

### 1. Task Execution
- Create and execute custom tasks using predefined classes or by creating new ones in the Workflow module
- Define new parameters, prompts/templates, and agents for task deployment
- Execute tasks with custom parameters directly
- Supported task types include:
  - Workflow
  - BasicAgentTask: CodeExecutionLLMTask
  - PromptAgentTask: CheckTask + CodeGenerationLLMTask
  - API tasks: Reddit + Wikipedia + Google + Exa + Arxiv search

### 2. Intelligent Chat
- Create and manage chat conversations with AI agents
- Add task results from the database to ongoing conversations
- Integrate new tasks as tools for the active agent during chat
- Support for various message types (text, image, video, audio, file)

### 3. Extensible Framework
- Modular architecture allowing easy addition of new components
- Flexible integration of external APIs and models
- Support for multiple AI models, including local and remote deployments

### 4. User Management
- User authentication and authorization
- Role-based access control (user and admin roles)

## Setup and Installation

1. Clone the repository:
   ```
   git clone [repository_url]
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:
   ```
   MONGODB_URI=mongodb://mongo/alice_database
   JWT_SECRET=[your_jwt_secret]
   BACKEND_PORT=3000
   FRONTEND_PORT=4000
   WORKFLOW_PORT=8000
   HOST=localhost
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Initialize the database:
   ```
   npm run init-db
   ```

5. Start the services:
   ```
   docker-compose up
   ```

## Usage

### API Endpoints

The backend provides RESTful API endpoints for managing various entities:

- `/api/agents`: CRUD operations for AI agents
- `/api/chats`: Manage chat conversations
- `/api/models`: Manage AI models
- `/api/prompts`: Manage prompts and templates
- `/api/tasks`: Manage tasks
- `/api/taskresults`: Manage task execution results
- `/api/users`: User management
- `/api/parameters`: Manage task parameters

It also provides an endpoint that manages the LM Studio completions:
-  `/lm-studio/chat/completions`: Offers an OpenAI-like endpoint that interacts with the local LM Studio to load models, presets, and create completions. 

### Creating a Task

To create a new task, send a POST request to `/api/tasks` with the task details:

```json
{
  "task_name": "Example Task",
  "task_description": "This is an example task",
  "task_type": "BasicAgentTask",
  "input_variables": {
    "type": "object",
    "properties": {
      "prompt": {
        "type": "string",
        "description": "The input prompt for the task"
      }
    },
    "required": ["prompt"]
  },
  "agent": "[agent_id]"
}
```

### Starting a Chat

To start a new chat, send a POST request to `/api/chats`:

```json
{
  "name": "New Chat",
  "alice_agent": "[agent_id]",
  "executor": "[executor_agent_id]",
  "model_id": "[model_id]"
}
```

### Executing a Task

To execute a task, use the Workflow service API. Send a POST request to `/execute_task` with the task ID and inputs:

```json
{
  "taskId": "[task_id]",
  "inputs": {
    "prompt": "Example prompt for the task"
  }
}
```

## Development

### Adding New Task Types

1. Create a new task class in the Workflow module, extending the `AliceTask` base class.
2. Implement the `run` method to define the task's behavior.
3. Add the new task type to the `task_type` enum in the `task.model.ts` file.
4. Update the task creation logic in the frontend to include the new task type.

### Adding New Models

1. Add the model configuration to the `const_model_definitions` in `const.py`.
2. Update the `ModelManager` class in the Workflow module if necessary.
3. Add the model to the database using the `/api/models` endpoint.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-branch-name`
5. Submit a pull request

## License

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree. 

## Contact

For support or inquiries, please contact mampy3000@gmail.com