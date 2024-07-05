import { LLMConfig, User } from './Types';
import { AliceTask, convertToAliceTask } from './TaskTypes';
import { AliceAgent, convertToAliceAgent } from './AgentTypes';
import { TaskResponse } from './TaskResponseTypes';
export interface AliceChat {
    _id: string;
    name: string;
    messages: MessageType[];
    alice_agent: AliceAgent;
    functions?: AliceTask[];
    executor: AliceAgent;
    llm_config?: LLMConfig;
    task_responses?: TaskResponse[];
    created_by?: User;
    updated_by?: User;
    createdAt?: Date;
    updatedAt?: Date;
}
export type RoleType = 'user' | 'assistant' | 'system' | 'tool';

export interface MessageType {
    role: RoleType;
    content: string;
    generated_by: 'user' | 'llm' | 'tool';
    step?: string;
    assistant_name?: string;
    context?: Record<string, any>;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'TaskResponse';
    request_type?: string | null;
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
        created_by: data?.created_by || null,
        updated_by: data?.updated_by || null,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
        _id: data?._id || undefined,
    };
};

export const convertToAliceChat = (data: any): AliceChat => {
    return {
        _id: data?._id || '',
        name: data?.name || '',
        messages: (data?.messages || []).map(convertToMessageType),
        alice_agent: convertToAliceAgent(data?.alice_agent),
        functions: (data?.functions || []).map(convertToAliceTask),
        executor: convertToAliceAgent(data?.executor),
        llm_config: data?.llm_config || undefined,
        task_responses: (data?.task_responses || []).map((response: any) => ({
            ...response,
            createdAt: response.createdAt ? new Date(response.createdAt) : undefined,
            updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined,
        })),
        created_by: data?.created_by || undefined,
        updated_by: data?.updated_by || undefined,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};

export interface MessageProps {
    message: MessageType
}

export interface CreateAliceChat {
    name: string;
    alice_agent: string | AliceAgent;
    executor: string | AliceAgent;
    llm_config?: LLMConfig;
    functions?: string[];
}

export interface ChatComponentProps {
    items: AliceChat[] | null;
    item: AliceChat | null;
    onChange: (newItem: Partial<AliceChat>) => void;
    mode: 'create' | 'view' | 'edit';
    handleSave: () => Promise<void>;
    isInteractable?: boolean;
    onInteraction?: (chat: AliceChat) => void;
    onAddChat?: (chat: AliceChat) => void;
    showRegenerate?: boolean;
    handleTaskClick?: (taskId: string) => void;
    handleTaskResultClick?: (taskResultId: string) => void;
    handleAgentClick?: (agentId: string) => void;
    showHeaders?: boolean;
}