import { User, convertToUser } from './UserTypes';
import { FunctionParameters } from './ParameterTypes';

export interface Prompt {
    _id?: string;
    name: string;
    content: string;
    created_by?: User;
    updated_by?: User;
    is_templated?: boolean;
    parameters?: FunctionParameters;
    partial_variables?: Record<string, any>;
    version?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const convertToPrompt = (data: any): Prompt => {
    return {
        _id: data?._id || undefined,
        name: data?.name || '',
        content: data?.content || '',
        created_by: data?.created_by ? convertToUser(data.created_by) : undefined,
        updated_by: data?.updated_by ? convertToUser(data.updated_by) : undefined,
        is_templated: data?.is_templated || false,
        parameters: data?.parameters || undefined,
        partial_variables: data?.partial_variables || {},
        version: data?.version || 1,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};

export interface PromptComponentProps {
    items: Prompt[] | null;
    item: Prompt | null;
    onChange: (newItem: Partial<Prompt>) => void;
    mode: 'create' | 'view' | 'edit';
    handleSave: () => Promise<void>;
    isInteractable?: boolean;
    onView?: (prompt: Prompt) => void;
    onInteraction?: (prompt: Prompt) => void;
    showHeaders?: boolean;
}