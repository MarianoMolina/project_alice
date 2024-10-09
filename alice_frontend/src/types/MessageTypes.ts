import { EnhancedComponentProps } from "./CollectionTypes";
import { FileType } from "./FileTypes";
import { ToolCall } from "./ParameterTypes";
import { References } from "./ReferenceTypes";
import { BaseDataseObject } from "./UserTypes";

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

export interface MessageType extends BaseDataseObject {
    _id?: string;
    role: RoleType;
    content: string;
    generated_by: 'user' | 'llm' | 'tool' | 'system';
    step?: string;
    assistant_name?: string;
    context?: Record<string, any>;
    type?: ContentType;
    request_type?: string | null;
    tool_calls?: ToolCall[];
    function_call?: { [key: string]: string };
    creation_metadata?: Record<string, any>;
    references?: References;
}

export const convertToMessageType = (data: any): MessageType => {
    return {
        role: data?.role || 'user',
        content: data?.content || '',
        generated_by: data?.generated_by || 'user',
        step: data?.step || undefined,
        assistant_name: data?.assistant_name || undefined,
        context: data?.context || {},
        type: data?.type || 'text',
        request_type: data?.request_type || null,
        tool_calls: data?.tool_calls || [],
        function_call: data?.function_call || {},
        references: data?.references || {} as References,
        creation_metadata: data?.creation_metadata || {},
        created_by: data?.created_by || null,
        updated_by: data?.updated_by || null,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
        _id: data?._id || undefined,
    };
};

export interface MessageComponentProps extends EnhancedComponentProps<MessageType> {
}

export const getDefaultMessageForm = (): MessageType => ({
    role: 'user',
    content: '',
    generated_by: 'user',
    context: {},
    type: ContentType.TEXT,
    tool_calls: [],
    function_call: {},
    references: {},
    creation_metadata: {},
    created_by: undefined,
    updated_by: undefined,
});