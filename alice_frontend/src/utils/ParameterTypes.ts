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