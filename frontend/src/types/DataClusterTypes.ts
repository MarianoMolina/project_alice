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
        user_interactions: data?.user_interactions || [],
        embeddings: data?.embeddings || [],
    };
};

export interface DataClusterComponentProps extends EnhancedComponentProps<DataCluster> {
    
}

export const getDefaultDataClusterForm = (): Partial<DataCluster> => ({
    task_responses: [],
    messages: [],
    files: [],
    url_references: [],
    user_interactions: [],
    embeddings: []
});