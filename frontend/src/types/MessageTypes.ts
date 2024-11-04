import { BaseDatabaseObject, convertToBaseDatabaseObject, convertToEmbeddable, Embeddable, EnhancedComponentProps } from "./CollectionTypes";
import { FileType } from "./FileTypes";
import { ToolCall } from "./ParameterTypes";
import { References } from "./ReferenceTypes";

export enum RoleType {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
    TOOL = 'tool'
}

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

export enum MessageGenerators {
    USER = 'user',
    LLM = 'llm',
    TOOL = 'tool',
    SYSTEM = 'system'
}

export interface MessageType extends BaseDatabaseObject, Embeddable {
    role: RoleType;
    content: string;
    generated_by: MessageGenerators;
    step?: string;
    assistant_name?: string;
    type?: ContentType;
    tool_calls?: ToolCall[];
    creation_metadata?: Record<string, any>;
    references?: References;
}

export const convertToMessageType = (data: any): MessageType => {
    return {
        ...convertToBaseDatabaseObject(data),
        ...convertToEmbeddable(data),
        role: data?.role || 'user',
        content: data?.content || '',
        generated_by: data?.generated_by || MessageGenerators.USER,
        step: data?.step || undefined,
        assistant_name: data?.assistant_name || undefined,
        type: data?.type || 'text',
        tool_calls: data?.tool_calls || [],
        references: data?.references || {} as References,
        creation_metadata: data?.creation_metadata || {},
    };
};

export interface MessageComponentProps extends EnhancedComponentProps<MessageType> {
}

export const getDefaultMessageForm = (): MessageType => ({
    role: RoleType.USER,
    content: '',
    generated_by: MessageGenerators.USER,
    type: ContentType.TEXT,
    tool_calls: [],
    references: {},
    creation_metadata: {},
    embedding: [],
    created_by: undefined,
    updated_by: undefined,
});