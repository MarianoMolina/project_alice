import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";
import { References } from "./ReferenceTypes";


export interface DataCluster extends References, BaseDatabaseObject {
    
}

export const convertToDataCluster = (data: any): DataCluster => {
    return {
        ...convertToBaseDatabaseObject(data),
        task_responses: data?.task_responses || [],
        messages: data?.messages || [],
        files: data?.files || [],
        url_references: data?.url_references || [],
        string_outputs: data?.string_outputs || [],
        user_interactions: data?.user_interactions || [],
        embedding_chunks: data?.embedding_chunks || [],
    };
};

export interface DataClusterComponentProps extends EnhancedComponentProps<DataCluster> {
    
}

export const getDefaultDataClusterForm = (): Partial<DataCluster> => ({
    task_responses: [],
    messages: [],
    files: [],
    url_references: [],
    string_outputs: [],
    user_interactions: [],
    embedding_chunks: []
});