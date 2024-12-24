import { convertToBaseDatabaseObject, convertToEmbeddable, convertToPopulatedEmbeddable, Embeddable, EnhancedComponentProps, PopulatedEmbeddable } from './CollectionTypes';
export interface CodeBlock {
    code: string;
    language: string;
    setup_commands?: string;
}

export interface CodeOutput {
    output: string;
    exit_code: number;
}

export interface CodeExecution extends Embeddable {
    code_block: CodeBlock;
    code_output: CodeOutput;
}


// Fixed PopulatedCodeExecution
export interface PopulatedCodeExecution extends Omit<CodeExecution, keyof PopulatedEmbeddable>, PopulatedEmbeddable {

}

export const convertToCodeExecution = (data: any): CodeExecution => {
    return {
        ...convertToBaseDatabaseObject(data),
        ...convertToEmbeddable(data),
        code_block: data?.code_block || {},
        code_output: data?.code_output || {},
    };
};

export const convertToPopulatedCodeExecution = (data: any): PopulatedCodeExecution => {
    return {
        ...convertToBaseDatabaseObject(data),
        ...convertToPopulatedEmbeddable(data),
        code_block: data?.code_block || {},
        code_output: data?.code_output || {},
    };
}

export interface CodeExecutionComponentProps extends EnhancedComponentProps<CodeExecution | PopulatedCodeExecution> {
    
}
export const getDefaultCodeExecutionForm = (): Partial<PopulatedCodeExecution> => ({
    code_block: {
        code: '',
        language: ''
    },
    code_output: {
        output: '',
        exit_code: 0
    }
});

export const LANGUAGES = [
    'python',
    'javascript',
    'typescript',
    'java',
    'c',
    'cpp',
    'csharp',
    'ruby',
    'php',
    'swift',
    'go',
    'rust',
    'shell',
    'sql',
    'html',
    'css',
    'markdown',
    'json',
    'yaml',
    'text'
];