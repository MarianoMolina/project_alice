import { FunctionParameters } from './ParameterTypes';
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from './CollectionTypes';

export interface Prompt extends BaseDatabaseObject {
    name: string;
    content: string;
    is_templated?: boolean;
    parameters?: FunctionParameters;
    partial_variables?: Record<string, any>;
    version?: number;
}

export const convertToPrompt = (data: any): Prompt => {
    return {
        ...convertToBaseDatabaseObject(data),
        name: data?.name || '',
        content: data?.content || '',
        is_templated: data?.is_templated || false,
        parameters: data?.parameters || undefined,
        partial_variables: data?.partial_variables || {},
        version: data?.version || 1,
    };
};

export interface PromptComponentProps extends EnhancedComponentProps<Prompt> {
    
}
export const getDefaultPromptForm = (): Partial<Prompt> => ({
    name: '',
    content: '',
    is_templated: false,
    parameters: undefined,
    partial_variables: {}
});