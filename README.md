# Alice: Advanced Language Intelligence and Cognitive Engine
![Alice LOGO](./alice_frontend/public/logo_alice.ico)

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
  - API tasks: Reddit, Wikipedia, Google, Exa, and Arxiv search
  - Agentic tasks:
    - BasicAgentTask: Including CodeExecutionLLMTask
    - PromptAgentTask: Including CheckTask and CodeGenerationLLMTask

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

### 5. Flexible Model Deployment
- Deploy local models using LM Studio
- Use OpenAI-compatible endpoints or Anthropic models to power your agents and workflows

## Setup and Installation

1. Ensure you have Docker installed on your system.

2. (Optional) Install LM Studio if you plan to use local models.

3. Download the repository:
   ```
   git clone [repository_url]
   ```

4. Create a `.env` file in the root directory using the `template.env` file as a reference. Complete the data for any APIs you want to use (e.g., OpenAI API key).

5. Run the appropriate script for your operating system:
   - Windows: Run `run.bat`
   - Linux/Mac: Run `run.sh`
Alternatively you can just execute run.py. 

This will build and launch the containers. Once ready, the frontend will be accessible at `http://localhost:4000/`.

## Usage

The Alice framework provides a user-friendly frontend interface for interacting with the system. Through this interface, you can:

1. Create and manage AI agents, models, prompts, parameters, tasks, api, etc. in your personal database
![Database](./img/database.PNG "View, create and edit all the elements you'll need")
2. Start and manage chat conversations
![Chat](./img/chat.PNG "Chat with your own Alice AI Assistant")
3. Create and execute various types of tasks
![Execute Task](./img/exec_task.PNG "Execute tasks to test them extensively")
4. View and analyze task results
![Task Results](./img/task_result.PNG "View task results and troubleshoot your tasks")
5. Manage user accounts and permissions, api config, etc. 

### Types of Tasks

1. API Tasks:
   - Google Search
   - Exa Search
   - Reddit Search
   - Wikipedia Search
   - Arxiv Search

2. Agentic Tasks:
   - BasicAgentTask: General-purpose tasks executed by an AI agent
     - CodeExecutionLLMTask: For executing code snippets
   - PromptAgentTask: Tasks that involve specific prompts or instructions
     - CheckTask: For validating or checking specific conditions
     - CodeGenerationLLMTask: For generating code based on prompts

3. Workflows:
   - Combine multiple tasks into a sequential or conditional flow
   - Define complex processes involving multiple agents and task types

## Development

### Adding New Task Types

1. Create a new task class in the Workflow module, extending the `AliceTask` base class.
2. Implement the `run` method to define the task's behavior.
3. Add the new task type to the `task_type` enum in the `task.model.ts` file.
4. Update the task creation logic in the frontend to include the new task type.

### Adding New Models, APIs, Tasks, Chats, Agents

1. Simply navigate to the Database page in the frontend and select the entity type you want to create and click on create new. 
2. If you want to add them so that new users start with these extra entities, you can modify the workflow_manager.db_app.initialization.modules, add new modules, or remove them
3. If you create tasks or workflows that you would like to share, let me know! If people want to share, I'll offer a way to do so. 

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