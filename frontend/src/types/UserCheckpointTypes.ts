import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";


export interface UserCheckpoint extends BaseDatabaseObject {
    user_prompt: string;
    options_obj: { [key: number]: string };
    task_next_obj: { [key: number]: string };
    request_feedback: boolean;
}

export const convertToUserCheckpoint = (data: any): UserCheckpoint => {
    return {
        ...convertToBaseDatabaseObject(data),
        user_prompt: data?.user_prompt || '',
        options_obj: data?.options_obj || {},
        task_next_obj: data?.task_next_obj || {},
        request_feedback: data?.request_feedback || false,
    };
};

export interface UserCheckpointComponentProps extends EnhancedComponentProps<UserCheckpoint> {
    
}

export const getDefaultUserCheckpointForm = (): Partial<UserCheckpoint> => ({
    user_prompt: '',
    options_obj: {},
    task_next_obj: {},
    request_feedback: false,
});