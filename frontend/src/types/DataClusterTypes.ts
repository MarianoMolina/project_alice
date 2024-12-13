import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";
import { convertToPopulatedReferences, convertToReferences, PopulatedReferences, References } from "./ReferenceTypes";


export interface DataCluster extends References, BaseDatabaseObject {
    
}

export interface PopulatedDataCluster extends PopulatedReferences, BaseDatabaseObject {
}

export const convertToDataCluster = (data: any): DataCluster => {
    return {
        ...convertToBaseDatabaseObject(data),
        ...convertToReferences(data)
    };
};

export const convertToPopulatedDataCluster = (data: any): PopulatedDataCluster => {
    return {
        ...convertToBaseDatabaseObject(data),
        ...convertToPopulatedReferences(data)
    };
}

export interface DataClusterComponentProps extends EnhancedComponentProps<DataCluster | PopulatedDataCluster> {
    
}

export const getDefaultDataClusterForm = (): Partial<PopulatedDataCluster> => ({
    task_responses: [],
    messages: [],
    files: [],
    entity_references: [],
    user_interactions: [],
    embeddings: [],
    tool_calls: [],
    code_executions: []
});