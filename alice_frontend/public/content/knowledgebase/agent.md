# Alice Agent

An Alice Agent is a fundamental component, designed to interact with users and perform various tasks. This document explains the key features and capabilities of an Alice Agent.

## Core Components

An Alice Agent is defined by three main components:

1. System Message Prompt
2. Model Dictionary
3. Capability Settings

### 1. System Message Prompt

The system message prompt is a crucial element that sets the context and behavior for the agent. It provides initial instructions and guidelines that shape the agent's responses and actions throughout its interactions. For now, they can only use non-templated prompts. 

### 2. Model Dictionary

An agent has access to a dictionary of models, where each model is associated with a specific model type. This allows the agent to utilize different models for various tasks or types of interactions. The model dictionary is structured as follows:

```typescript
models?: { [key in ModelType]?: AliceModel };
```

This flexible structure enables the agent to switch between different models (check [models](/knowledgebase/model) to see all the model types) based on the requirements of the task at hand. 

### 3. Capability Settings

The agent's behavior and abilities are further defined by several boolean flags and settings:

- `has_functions`: Determines whether the agent can use tools, functions, or tasks.
- `has_code_exec`: Indicates if the agent is allowed to execute code blocks.
- `max_consecutive_auto_reply`: Controls the number of consecutive automated replies the agent can make.

#### Consecutive Auto-Replies

The `max_consecutive_auto_reply` setting is particularly important for controlling the agent's behavior in complex scenarios:

- If set to 1 (default), the agent provides a single response to each user input.
- If set to a value greater than 1, the agent can perform multiple actions in sequence:
  - It can execute tool calls or code, add the output to the conversation, and then provide another response.
  - If set to 2 or higher, the agent can continue this cycle, potentially using more tool calls or executing more code before giving a final response.

This feature allows for more sophisticated and autonomous behavior, enabling the agent to complete complex tasks with minimal user intervention.

## How to use

Agents are used in either [chats](/knowledgebase/chat) or [tasks](/knowledgebase/task), where they enable access to any 'model' API. These are the APIs that have a 'model' you can choose. This flexibility means that to run those APIs, we'd want to be able to decide which model is used easily. Agents help us do that. 

Beyond the models, the agent's main differentiating factor at the moment is the system [prompt](/knowledgebase/prompt). With it you can tailor agents to specific tasks, improving your ability to deploy smaller models for complex tasks. 

## Agent Interface

Here's the TypeScript interface that defines the structure of an Alice Agent:

```typescript
export interface AliceAgent extends BaseDataseObject {
  _id?: string;
  name: string;
  system_message: Prompt;
  has_functions: boolean;
  has_code_exec: boolean;
  max_consecutive_auto_reply?: number;
  models?: { [key in ModelType]?: AliceModel };
}
```