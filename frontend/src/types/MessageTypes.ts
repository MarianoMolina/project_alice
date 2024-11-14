import { convertToEmbeddable, Embeddable, EnhancedComponentProps } from "./CollectionTypes";
import { convertToDataCluster, DataCluster } from "./DataClusterTypes";
import { FileType } from "./FileTypes";

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

export interface MessageType extends Embeddable {
    role: RoleType;
    content: string;
    generated_by: MessageGenerators;
    step?: string;
    assistant_name?: string;
    type?: ContentType;
    creation_metadata?: Record<string, any>;
    references?: DataCluster;
}

export const convertToMessageType = (data: any): MessageType => {
    return {
        ...convertToEmbeddable(data),
        role: data?.role || 'user',
        content: data?.content || '',
        generated_by: data?.generated_by || MessageGenerators.USER,
        step: data?.step || undefined,
        assistant_name: data?.assistant_name || undefined,
        type: data?.type || 'text',
        references: data?.references ? convertToDataCluster(data.references) : undefined,
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
    references: undefined,
    creation_metadata: {},
    embedding: [],
    created_by: undefined,
    updated_by: undefined,
});