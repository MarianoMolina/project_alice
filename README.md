# Alice: Advanced Language Intelligence and Cognitive Engine
![Alice LOGO](./alice_frontend/public/logo_alice.ico)

Alice is an agentic workflow framework that integrates task execution and intelligent chat capabilities. It provides a flexible environment for creating, managing, and deploying AI agents for various purposes, leveraging a microservices architecture with MongoDB for data persistence.

## Project Structure

The project consists of three main components:

1. Backend (Node.js with Express - TS)
2. Workflow (Python - Pydantic)
3. Frontend (React - TS)

## The Goal
1. Provide a tool to create, test and deploy agentic solutions
2. A framework where 'text' is the primary input and the output of most operations, with the goal of making this tool 'human languange readable', allowing agents to not only execute complex workflows, but create new ones, and not requiring in-depth technical expertise from users in order to create complex and powerful workflows. 
3. Produce a framework that is model-agnostic/brand-agnostic, allowing the user to set and deploy their solutions however they want
4. In the long term, offer an open-source option that helps put the control in the users hand, even in an AI-powered world. 
5. Elevator pitch is: in a world where agentic solutions are able to tackle more and more problem types, and more and more complex problems, the key value add is going to be the expertise in converting expertise into automated workflows: then, knowing how to perform a task is less important than knowing how to perform a task an infinite amount of times. 

## How it works

![Logic Flow](./img/basic_logic_flow.png)
The framework is based around 4 main components:
- APIs and their engine
- Agents, which deploy prompts and use LLM API
- Tasks that leverage agents and other API types to produce an output (Task Response)
- Chats, that leverage tasks and agents, to produce a conversational experience, generating messages (MessageDict)

These components share information in one of 4 main ways, all of which have a string representation:
- Files (All file types have a method for generating a 'transcript' for the file, and files generated through prompts keep it as a representation)
- Messages
- Task Results
- URL References

## Features

### 1. Task Execution
- Create and execute custom tasks using predefined classes or by creating new ones in the Workflow module
- Define new parameters, prompts/templates, and agents for task deployment
- Execute tasks with custom parameters
- Run tasks directly from the frontend, or programatically with the workflow container's API
- Supported task types include:
  - Workflow
  - API tasks: Reddit, Wikipedia, Google, Exa, and Arxiv search
  - Agentic tasks:
    - PromptAgentTask: Including CheckTask, CodeExecutionLLMTask and CodeGenerationLLMTask

### 2. Intelligent Chat
- Create and manage chat conversations with AI agents
- Add task results from the database to ongoing conversations
- Integrate new tasks as tools for the active agent during chat
- Support for various message types (text, image, video, audio, file)
- Deploy these agents wherever you want, since the workflow API offers an endpoint to create chat completions. 

### 3. Extensible Framework
- Modular architecture allowing easy addition of new components
- Flexible integration of external APIs and models
- Support for multiple AI models, including local and remote deployments

### 4. User Management
- User authentication and authorization
- Role-based access control (user and admin roles)

### 5. Flexible Model Deployment
- Deploy local models using LM Studio
- Use any OpenAI-compatible endpoints or Anthropic, Gemini and Cohere models to power your agents and workflows

## Setup and Installation

1. Ensure you have Docker installed on your system. On Windows, it comes with docker-compose, but [check if you have it installed](https://stackoverflow.com/questions/72928891/how-can-i-check-if-docker-compose-plugin-is-installed). Otherwise (if in Linux), [install it](https://docs.docker.com/compose/install/linux/)

2. (Optional) Install LM Studio if you plan to use local models.

3. Download the repository:
   ```
   git clone https://github.com/MarianoMolina/project_alice.git
   ```

4. Create a `.env` file in the root directory using the `template.env` file as a reference. Complete the data for any APIs you want to use (e.g., OpenAI API key).

5. Run the appropriate script for your operating system:
   - Windows: Run `run.bat`
   - Linux/Mac: Run `run.sh`
Alternatively you can just execute run.py using `python run.py` in a commandline while in the repository folder

This will build and launch the containers. Once ready, the frontend will be accessible at `http://localhost:4000/`. 

## Usage

The Alice framework provides a user-friendly frontend interface for interacting with the system. Through this interface, you can:

1. Create and manage AI agents, models, prompts, parameters, tasks, api, etc. in your personal database
![Database](./img/database_1.PNG "View, create and edit all the elements you'll need")
View all the references you've created, like files, messages, task responses, etc:
![Database](./img/database_2.PNG "View, create and edit all the elements you'll need")
2. Start and manage chat conversations
![Chat](./img/chat_1.PNG "Chat with your own Alice AI Assistant")
Select a chat or create a new one, and start interacting with your agents. 
![Chat](./img/chat_2.PNG "Chat with your own Alice AI Assistant")
3. Create and execute various types of tasks
![Execute Task](./img/exec_task_1.PNG "Execute tasks to test them extensively")
View their outputs, run them again, change their settings, etc.
![Execute Task](./img/exec_task_2.PNG "Execute tasks to test them extensively")
4. Manage your user account and api config. 
![User APIs](./img/user.PNG "View your user details and API configs - also you can re-set your database")

### Types of Tasks

- `API tasks`: Tasks that use non-model APIs. Examples include the Google, Wikipidia, Arxiv, Exa and Reddit search tasks. 
- `Prompt agent tasks`: Tasks that use prompts and agents. Base functionality is generating an LLM response to a prompt. This task has some 'child' tasks:
  - `CheckTask`: Task structured to compare the output generated by the agent with the strings in exit_code_response_map. Allows for easy ways to classify things. For example "Respond with WRONG if the answer is flawed, and CORRECT if the answer makes sense" could be used as a gate to know what task to deploy next. 
  - `CodeExecutionLLMTask`: Task takes the input message, retrieves all code blocks and executes them in a docker container
  - `CodeGenerationLLMTask`: Task that ensure the output generated contains at least one codeblock, or fails. 
- Other agent tasks: Sibling task classes to the prompt agent task, that don't use a prompt to template the task. 
  - `Text-to-speech task`: In this case, it uses the agent to determine which model to use for the generation, and returns a file with the speech created. 
  - `WebScrapeBeautifulSoupTask`: Takes a URL, retrieves it, task a string sample of the html to show an agent who creates the selectors for BeautifulSoup parsing of the content. 
  - `GenerateImageTask`: Takes an image prompt and uses the agent's img_gen model to generate an image based on it. 
  - `EmbeddingTask`: Takes a string and the agent's embeddings model to generate the vector embeddings for the text provided. 
- `Workflow`: The simplest a most complex task. Simple because all it does is run other tasks. Complex because the options are endless. Main difference is they have a tasks_end_code_routing to map the logic path and require a start_task to begin it. 

### Available APIs
```typescript
export enum ApiName {
    OPENAI = 'openai_llm',
    OPENAI_VISION = 'openai_vision',
    OPENAI_IMG_GENERATION = 'openai_img_gen',
    OPENAI_EMBEDDINGS = 'openai_embeddings',
    OPENAI_TTS = 'openai_tts',
    OPENAI_STT = 'openai_stt',
    OPENAI_ASTT = 'openai_adv_stt',
    AZURE = 'azure',
    GEMINI = 'gemini_llm',
    GEMINI_VISION = 'gemini_vision',
    MISTRAL = 'mistral_llm',
    MISTRAL_VISION = 'mistral_vision',
    MISTRAL_EMBEDDINGS = 'mistral_embeddings',
    GEMINI_STT = 'gemini_stt',
    GEMINI_EMBEDDINGS = 'gemini_embeddings',
    COHERE = 'cohere_llm',
    GROQ = 'groq_llm',
    GROQ_VISION = 'groq_vision',
    GROQ_TTS = 'groq_tts',
    META = 'meta_llm',
    META_VISION = 'meta_vision',
    ANTHROPIC = 'anthropic_llm',
    ANTHROPIC_VISION = 'anthropic_vision',
    LM_STUDIO = 'lm-studio_llm',
    LM_STUDIO_VISION = 'lm-studio_vision',
    CUSTOM = 'Custom',
    // Non-model API providers
    GOOGLE_SEARCH = 'google_search',
    REDDIT_SEARCH = 'reddit_search',
    WIKIPEDIA_SEARCH = 'wikipedia_search',
    EXA_SEARCH = 'exa_search',
    ARXIV_SEARCH = 'arxiv_search',
}
```

## Development

### Adding New Task Types

1. Create a new task class in the Workflow module, extending the `AliceTask` base class.
2. Implement the `run` method to define the task's behavior.
3. Add the new task type to the `task_type` enum in the `task.model.ts` file.
4. Update the task creation logic in the frontend to include the new task type.

### Adding New API Types and API Names

1. Update the `ApiType` and `ApiName` enums in the backend and workflow containers.
2. Implement the necessary logic in the workflow container to handle the new API type.
3. Update the frontend to support the new API type in the API management interface.

For detailed instructions on adding new API types and names, refer to the backend and workflow README files.

### Adding New Models, APIs, Tasks, Chats, Agents

To add new instances: 

1. Navigate to the Database page in the frontend and select the entity type you want to create and click on create new.
2. To add new entities that will be available to new users, you can modify the workflow initialization modules:
   - Locate the `workflow_logic/db_app/initialization/modules` directory in the workflow container.
   - Create a new module file or modify existing ones to include your new entities.
   - Update the `modular_db` in `workflow_logic/db_app/initialization/data_init.py` to include your new module.

For more detailed information on creating and managing initialization modules, refer to the workflow container README.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-branch-name`
5. Submit a pull request

If you've created new tasks, workflows, or initialization modules that you'd like to share, please include them in your pull request along with appropriate documentation. We're particularly interested in contributions that expand the capabilities of the workflow initialization process, allowing users to start with a richer set of pre-configured entities.

## Future Features

1. **Workflow generator** [Basic implementation done]: Improve the interface for workflow generation. Ideally, something that allows the user to handle tasks/nodes, visualize the execution of it, etc. 

2. **More API engines and base tasks** [Done]: BeautifulSoup to scrap websites, vision_models, text_to_image_models, text_to_speech_models, etc. This will enable a new set of tasks to be created. This includes adding more providers, like Google, Mistral, etc. 

3. **File input and type interface** [Done]: Being able to add files of any type to a conversation, which makes a conversion to text of the file (stt, itt, or simply parsing for files that can be converted to a string), allowing for the user and the agents to share any type of data. This, in turn, requires the agents to also be able to produce different types of outputs, which is where the type interface logic comes in, to convert str -> any and back. 

4. **Complex Agent Structures**: Implementation of more advanced agent architectures, such as ReAct and RAG agents, to enable more sophisticated reasoning and decision-making capabilities.

5. **Work Environments**: Introduction of a feature similar to Anthropic's Artifacts, providing a more structured way to manage and interact with complex data and tools within the Alice ecosystem. Idea is to use a mix of in-context and RAG-powered sources, that the user is actively able to update, trim, etc. to ensure the correct info is available at the right time. 

6. **Journals**: Development of a holistic view of conversations and interactions, enabling the creation of workflows that run periodically. This feature will support tasks such as:
   - Reviewing and summarizing emails
   - Tracking and updating calendar events
   - Monitoring and responding to messages across various platforms
   - Reviewing and updating goal statuses
   - Generating periodic reports and insights
   - Updating RAG-sources

7. **Improvements and fixes**: There are 3 areas I think are crucial in the mid-term to tackle:
   - Edge-case analysis
   - Improve error handling and logging


## License

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree. 

## Contact

For support or inquiries, please contact mampy3000@gmail.com