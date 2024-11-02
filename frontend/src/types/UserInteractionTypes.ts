import { BaseDatabaseObject, convertToBaseDatabaseObject, convertToEmbeddable, Embeddable, EnhancedComponentProps } from "./CollectionTypes";

export interface UserResponse {
    selected_option: number;
    user_feedback?: string;
}

export interface UserInteraction extends BaseDatabaseObject, Embeddable {
    user_prompt: string;
    execution_history: { [key: string]: any };
    options_obj: { [key: number]: string };
    user_response?: UserResponse;
    task_next_obj: { [key: number]: string };
}

export const convertToUserInteraction = (data: any): UserInteraction => {
    return {
        ...convertToBaseDatabaseObject(data),
        ...convertToEmbeddable(data),
        user_prompt: data?.user_prompt || '',
        execution_history: data?.execution_history || {},
        options_obj: data?.options_obj || {},
        user_response: data?.user_response || undefined,
        task_next_obj: data?.task_next_obj || {},
    };
};

export interface UserInteractionComponentProps extends EnhancedComponentProps<UserInteraction> {
    
}

export const getDefaultUserInteractionForm = (): Partial<UserInteraction> => ({
    user_prompt: '',
    execution_history: {},
    options_obj: {},
    task_next_obj: {}
});