# Messages

Messages represent individual units of communication within chats, encompassing various types of content and metadata.

## Message Interface

Each message in the system is represented by the `MessageType` interface:

```typescript
export type RoleType = 'user' | 'assistant' | 'system' | 'tool';

export enum ContentType {
    TEXT = 'text',
    IMAGE = FileType.IMAGE,
    VIDEO = FileType.VIDEO,
    AUDIO = FileType.AUDIO,
    FILE = FileType.FILE,
    TASK_RESULT = 'task_result',
    MULTIPLE = 'multiple',
    URL_REFERENCE = 'url_reference'
}

export interface MessageType extends BaseDatabaseObject {
    _id?: string;
    role: RoleType;
    content: string;
    generated_by: 'user' | 'llm' | 'tool' | 'system';
    step?: string;
    assistant_name?: string;
    context?: Record<string, any>;
    type?: ContentType;
    tool_calls?: ToolCall[];
    creation_metadata?: Record<string, any>;
    references?: References;
}
```

Key properties:
- `role`: Indicates the source of the message (user, AI assistant, system, or tool)
- `content`: The main content of the message
- `generated_by`: Specifies how the message was created
- `type`: Indicates the type of content (text, image, audio, etc.)
- `tool_calls`: Used for interactions with tools or functions
- `references`: Links to associated files or resources

## Functionality

In the frontend, messages are used to:

1. Display conversation history in chats
2. Render different types of content (text, images, files, etc.)
3. Show metadata about message generation and context
4. Facilitate interactions with tools and functions

## User Interface Considerations

When designing message displays, consider:

1. Clear visual distinction between different roles (user, assistant, system)
2. Proper rendering of various content types (text, images, files)
3. Collapsible sections for additional metadata or context
4. Interactive elements for tool calls or function interactions