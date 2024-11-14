import { convertToBaseDatabaseObject, convertToEmbeddable, Embeddable, EnhancedComponentProps } from './CollectionTypes';
export interface CodeBlock {
    code: string;
    language: string;
}

export interface CodeOutput {
    output: string;
    exit_code: number;
}

export interface CodeExecution extends Embeddable {
    code_block: CodeBlock;
    code_output: CodeOutput;
}

export const convertToCodeExecution = (data: any): CodeExecution => {
    return {
        ...convertToBaseDatabaseObject(data),
        ...convertToEmbeddable(data),
        code_block: data?.code_block || {},
        code_output: data?.code_output || {},
    };
};

export interface CodeExecutionComponentProps extends EnhancedComponentProps<CodeExecution> {
    
}
export const getDefaultCodeExecutionForm = (): Partial<CodeExecution> => ({
    code_block: {
        code: '',
        language: ''
    },
    code_output: {
        output: '',
        exit_code: 0
    }
});