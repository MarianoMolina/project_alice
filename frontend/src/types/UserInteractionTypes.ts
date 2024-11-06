import { BaseDatabaseObject, convertToBaseDatabaseObject, convertToEmbeddable, Embeddable, EnhancedComponentProps } from "./CollectionTypes";
import { UserCheckpoint } from "./UserCheckpointTypes";

export interface UserResponse {
    selected_option: number;
    user_feedback?: string;
}

export interface UserInteraction extends BaseDatabaseObject, Embeddable {
    task_response_id: string;
    user_checkpoint_id: UserCheckpoint;
    user_response?: UserResponse;
}

export const convertToUserInteraction = (data: any): UserInteraction => {
    return {
        ...convertToBaseDatabaseObject(data),
        ...convertToEmbeddable(data),
        task_response_id: data?.task_response_id || undefined,
        user_checkpoint_id: data?.user_checkpoint_id || undefined,
        user_response: data?.user_response || undefined,
    };
};

export interface UserInteractionComponentProps extends EnhancedComponentProps<UserInteraction> {
    
}

export const getDefaultUserInteractionForm = (): Partial<UserInteraction> => ({
    task_response_id: undefined,
    user_checkpoint_id: undefined,
    user_response: undefined,
});