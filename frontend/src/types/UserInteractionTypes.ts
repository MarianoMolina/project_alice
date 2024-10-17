import { EnhancedComponentProps } from "./CollectionTypes";
import { BaseDataseObject } from "./UserTypes";

export interface UserResponse {
    selected_option: number;
    user_feedback?: string;
}

export interface UserInteraction extends BaseDataseObject {
    _id?: string;
    user_prompt: string;
    execution_history: { [key: string]: any };
    options_obj: { [key: number]: string };
    user_response?: UserResponse;
    task_next_obj: { [key: number]: string };
}

export const convertToUserInteraction = (data: any): UserInteraction => {
    return {
        _id: data?._id || undefined,
        user_prompt: data?.user_prompt || '',
        execution_history: data?.execution_history || {},
        options_obj: data?.options_obj || {},
        user_response: data?.user_response || undefined,
        task_next_obj: data?.task_next_obj || {},
        created_by: data?.created_by || undefined,
        updated_by: data?.updated_by || undefined,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
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