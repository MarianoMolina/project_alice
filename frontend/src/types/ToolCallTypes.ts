import { convertToEmbeddable, Embeddable, EnhancedComponentProps } from './CollectionTypes';

export interface ToolCallConfig {
    arguments: Record<string, any> | string;
    name: string;
}

export interface ToolCall extends Embeddable {
    type: "function";
    function: ToolCallConfig;
}

export const convertToToolCall = (data: any): ToolCall => {
    return {
        ...convertToEmbeddable(data),
        type: data?.type || '',
        function: data?.function || {},
    };
};

export interface ToolCallComponentProps extends EnhancedComponentProps<ToolCall> {
    
}
export const getDefaultToolCallForm = (): Partial<ToolCall> => ({
    type: 'function',
    function: {
        arguments: {},
        name: ''
    }
});
