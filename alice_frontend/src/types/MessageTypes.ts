import { FileReference } from "./FileTypes";
import { ToolCall } from "./ParameterTypes";
import { TaskResponse } from "./TaskResponseTypes";
import { User } from "./UserTypes";

export type RoleType = 'user' | 'assistant' | 'system' | 'tool';
export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'task_result';

export interface MessageType {
    role: RoleType;
    content: string;
    generated_by: 'user' | 'llm' | 'tool';
    step?: string;
    assistant_name?: string;
    context?: Record<string, any>;
    type?: ContentType;
    request_type?: string | null;
    tool_calls?: ToolCall[];
    function_call?: { [key: string]: string };
    task_responses?: TaskResponse[];
    creation_metadata?: Record<string, any>;
    references?: FileReference[];
    created_by?: User | null;
    updated_by?: User | null;
    createdAt?: Date;
    updatedAt?: Date;
    _id?: string;
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
        task_responses: data?.task_responses || [],
        references: (data?.references || []).map((ref: any) => ref),
        creation_metadata: data?.creation_metadata || {},
        created_by: data?.created_by || null,
        updated_by: data?.updated_by || null,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
        _id: data?._id || undefined,
    };
};

export interface MessageProps {
    message: MessageType,
    chatId?: string,
}