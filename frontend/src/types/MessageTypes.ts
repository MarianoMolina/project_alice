import { convertToEmbeddable, convertToPopulatedEmbeddable, Embeddable, EnhancedComponentProps, PopulatedEmbeddable } from "./CollectionTypes";
import { convertToPopulatedReferences, PopulatedReferences, References } from "./ReferenceTypes";

export enum RoleType {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
    TOOL = 'tool'
}

export enum ContentType {
    TEXT = 'text',
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    FILE = "file",
    TASK_RESULT = 'task_result',
    MULTIPLE = 'multiple',
}

export enum MessageGenerators {
    USER = 'user',
    LLM = 'llm',
    TOOL = 'tool',
    SYSTEM = 'system'
}

export interface CostDict {
    input_cost?: number;
    output_cost?: number;
    total_cost?: number;
}
export interface UsageDict {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
}

export interface MessageCreationMetadata {
    model?: string;
    usage?: UsageDict;
    cost?: CostDict;
    estimated_tokens?: number;
}

export interface MessageType extends Embeddable {
    role: RoleType;
    content: string;
    generated_by: MessageGenerators;
    step?: string;
    assistant_name?: string;
    type?: ContentType;
    creation_metadata?: MessageCreationMetadata & Record<string, any>;
    references?: References;
}

type MessagePopulatedFields = {
    references?: PopulatedReferences;
}

// Create the populated message type
export interface PopulatedMessage extends 
    Omit<MessageType, keyof PopulatedEmbeddable | keyof MessagePopulatedFields>,
    PopulatedEmbeddable,
    MessagePopulatedFields {
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
        creation_metadata: data?.creation_metadata || {},
        references: data?.references || undefined,
    };
};

export const convertToPopulatedMessage = (data: any): PopulatedMessage => {
    return {
        ...convertToPopulatedEmbeddable(data),
        role: data?.role || 'user',
        content: data?.content || '',
        generated_by: data?.generated_by || MessageGenerators.USER,
        step: data?.step || undefined,
        assistant_name: data?.assistant_name || undefined,
        type: data?.type || 'text',
        creation_metadata: data?.creation_metadata || {},
        references: data?.references ? convertToPopulatedReferences(data.references) : undefined,
    };
}

export interface MessageComponentProps extends EnhancedComponentProps<MessageType | PopulatedMessage> {
}

export const getDefaultMessageForm = (): PopulatedMessage => ({
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