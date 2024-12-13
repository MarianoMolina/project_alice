import { convertToEmbeddable, convertToPopulatedEmbeddable, Embeddable, EnhancedComponentProps, PopulatedEmbeddable } from './CollectionTypes';

export interface ToolCallConfig {
    arguments: Record<string, any> | string;
    name: string;
}

export interface ToolCall extends Embeddable {
    type: "function";
    function: ToolCallConfig;
}
export interface PopulatedToolCall extends Omit<ToolCall, keyof PopulatedEmbeddable>, PopulatedEmbeddable {

}

export const convertToToolCall = (data: any): ToolCall => {
    return {
        ...convertToEmbeddable(data),
        type: data?.type || '',
        function: data?.function || {},
    };
};

export const convertToPopulatedToolCall = (data: any): PopulatedToolCall => {
    return {
        ...convertToPopulatedEmbeddable(data),
        type: data?.type || '',
        function: data?.function || {},
    };
}

export interface ToolCallComponentProps extends EnhancedComponentProps<ToolCall | PopulatedToolCall> {
    
}
export const getDefaultToolCallForm = (): Partial<PopulatedToolCall> => ({
    type: 'function',
    function: {
        arguments: {},
        name: ''
    }
});
