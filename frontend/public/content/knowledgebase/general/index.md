# Introduction to the Alice System

Welcome to the Alice system documentation. Alice is a sophisticated AI-driven platform designed to facilitate complex workflows between AI agents, and a variety of tasks, APIs and data structures. This introduction provides an overview of the system's key components.
```User_prompt 
Lets do something fun: Why don't you use the image_gen_task to create a representation of yourself?
```
![Alice represents itself](/content/img/alice_represented_1_small.png)
```Assistant_prompt 
A friendly and intelligent AI assistant named Alice, represented as a glowing, ethereal blue hologram of a female face with circuit-like patterns, floating above a futuristic desk with holographic screens. The image should convey warmth, intelligence, and helpfulness
```
## System Overview

Alice is built on several core components that work together to create a versatile and powerful AI interaction environment:

1. **Agents**: The primary AI entities that interact with users and perform tasks. [LINK](/knowledgebase/agent)
2. **Models**: The underlying AI models that power the agents' capabilities. [LINK](/knowledgebase/model)
3. **Chats**: Conversational interfaces where users interact with agents. [LINK](/knowledgebase/chat)
4. **Tasks**: Predefined operations that can be executed by agents or triggered within chats. [LINK](/knowledgebase/task)
5. **APIs**: Interfaces to external services and AI providers. [LINK](/knowledgebase/api)
6. **Prompts**: Templated instructions that guide AI behavior. [LINK](/knowledgebase/prompt)
7. **Parameters**: Structured input definitions for tasks and prompts. [LINK](/knowledgebase/parameter)
8. **Messages**: Individual units of communication within chats. [LINK](/knowledgebase/message)
9. **Task Responses**: Results and metadata from executed tasks. [LINK](/knowledgebase/task_response)
10. **Entity References**: Managed references to external web resources. [LINK](/knowledgebase/entity_reference)
11. **Files**: Handling of various file types with AI-readable transcripts. [LINK](/knowledgebase/file)
12. **|COMING| Data Clusters**: Group references with managed embeddings to facilitate RAG and Fine-tunning, as well as providing a reusable context.

## Key Features

- **CHAT: Flexible AI Interactions**: Engage in open-ended conversations or structured task executions with AI agents.
- **TASKS: Extensible Task Framework**: Create and execute a wide variety of tasks, from simple API calls to complex workflows.
- **Multi-Modal Support**: Handle text, images, audio, and other file types seamlessly within the system within tasks and chats. Non-text files get transcribed so LLM-agents can "see".
- **Context-Aware Responses**: Utilize chat history, file transcripts, URL references and task responses in the agent's context for more intelligent interactions.
- **Integration Capabilities**: Connect with various external services and AI providers through the API system.
- **Customizable Behavior**: Tune AI tasks and agents using prompts, parameters and models to achieve the best result.
- **|COMING| Fine-Tune Models**: Use data-clusters to fine-tune your favorite models. 
- **|COMING| RAG-Powered Agents**: Deploy agents with RAG access to data-clusters to empower your workflows with your knowledgebase
- **|COMING| ReACT-Powered Agents**: Tool using agents can engage in ReACT-processes while in conversation to contemplate and acquire the necessary data for the task

## System Architecture Overview

The Alice system is designed with a modular architecture:

- **Frontend**: Where you probably are -> a ReactJS/TS user interface for interacting with the system, viewing the database and executing new processes.
- **Backend**: A NodeJS/TS module in charge of managing data persistence and authentication.
- **Workflow Engine**: Handles task execution and complex workflows, interfaces with various AI models and providers: handles all of the logic.

![Alice represents itself 2](/content/img/alice_represented_2_small.png)
```Assistant_prompt 
A friendly and intelligent AI assistant named Alice, represented as a glowing, ethereal blue hologram of a female face with circuit-like patterns, floating above a futuristic desk with holographic screens. The image should convey warmth, intelligence, and helpfulness.
```