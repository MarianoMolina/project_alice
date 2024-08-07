import { User, convertToUser } from "./UserTypes";

export interface FunctionParameters {
    type: "object";
    properties: { [key: string]: ParameterDefinition };
    required: string[];
}

export interface ParameterDefinition {
    _id?: string;
    type: string;
    description: string;
    default?: any;
    created_by?: User;
    updated_by?: User;
    createdAt?: Date;
    updatedAt?: Date;
}
export const convertToParameterDefinition = (data: any): ParameterDefinition => {
    return {
        _id: data?._id || undefined,
        type: data?.type || '',
        description: data?.description || '',
        default: data?.default,
        created_by: data?.created_by ? convertToUser(data.created_by) : undefined,
        updated_by: data?.updated_by ? convertToUser(data.updated_by) : undefined,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};

export interface ParameterComponentProps {
    items: ParameterDefinition[] | null;
    item: ParameterDefinition | null;
    onChange: (newItem: Partial<ParameterDefinition>) => void;
    mode: 'create' | 'view' | 'edit';
    handleSave: () => Promise<void>;
    isInteractable?: boolean;
    onView?: (parameter: ParameterDefinition) => void;
    onInteraction?: (parameter: ParameterDefinition) => void;
    showHeaders?: boolean;
}
export const getDefaultParameterForm = (): Partial<ParameterDefinition> => ({
    type: 'string',
    description: '',
    default: null
});


export interface FunctionConfig {
    name: string;
    description: string;
    parameters: FunctionParameters;
}

export interface ToolFunction {
    type: "function";
    function: FunctionConfig;
}

export interface ToolCallConfig {
    arguments: { [key: string]: any } | string;
    name: string;
}

export interface ToolCall {
    id?: string;
    type: "function";
    function: ToolCallConfig;
}

export type ToolParam = {
    name: string;
    description: string;
    input_schema: any;
};

export const convertToToolParam = (toolFunction: ToolFunction): ToolParam => {
    return {
        name: toolFunction.function.name,
        description: toolFunction.function.description,
        input_schema: toolFunction.function.parameters
    };
};

export const convertToFunctionConfig = (data: any): FunctionConfig => {
    return {
        name: data?.name || '',
        description: data?.description || '',
        parameters: data?.parameters || { type: "object", properties: {}, required: [] }
    };
};

export const convertToToolFunction = (data: any): ToolFunction => {
    return {
        type: "function",
        function: convertToFunctionConfig(data?.function)
    };
};

export const convertToToolCall = (data: any): ToolCall => {
    return {
        id: data?.id || undefined,
        type: "function",
        function: {
            arguments: data?.function?.arguments || {},
            name: data?.function?.name || ''
        }
    };
};
