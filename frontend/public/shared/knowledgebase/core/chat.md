# Chats

Chats represent ongoing conversations between users and AI agents. They encapsulate the context, history, and functionality of these interactions.

## Chat Interface

Each chat in the system is represented by the `AliceChat` interface:

```typescript
export interface AliceChat extends BaseDatabaseObject {
    _id: string;
    name: string;
    messages: MessageType[];
    alice_agent: AliceAgent;
    functions?: AliceTask[];
}
```

Key components:
- `name`: A user-friendly identifier for the chat
- `messages`: An array of messages exchanged in the conversation
- `alice_agent`: The AI agent assigned to this chat
- `functions`: Optional tasks that can be executed within the context of this chat

## Functionality

In the frontend, chats provide the following functionality:

1. **Conversation History**: Users can view and scroll through the entire conversation history.

2. **Agent Interaction**: Users can send messages to the assigned AI agent and receive responses.

3. **Function Execution**: If functions (tasks) are associated with the chat, users can trigger these tasks within the conversation context.

4. **Context Management**: The chat maintains context across multiple interactions, allowing for more coherent and contextually relevant responses from the AI agent.

## How to use

The `Chat with Alice` section lets you see, edit and continue chats, their messages, references, agents, etc. Just jump in a chat and start yapping. 

## Integration with Other Components

Chats integrate closely with:
- Agents: Each chat is associated with an AliceAgent
- Tasks: Chats can have associated functions (tasks) that can be executed
- Models: The assigned agent uses models to generate responses

Understanding these relationships is crucial for effectively managing and interacting with chats.