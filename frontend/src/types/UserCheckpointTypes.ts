import { EnhancedComponentProps } from "./CollectionTypes";
import { BaseDataseObject } from "./UserTypes";


export interface UserCheckpoint extends BaseDataseObject {
    _id?: string;
    user_prompt: string;
    options_obj: { [key: number]: string };
    task_next_obj: { [key: number]: string };
    request_feedback: boolean;
}

export const convertToUserCheckpoint = (data: any): UserCheckpoint => {
    return {
        _id: data?._id || undefined,
        user_prompt: data?.user_prompt || '',
        options_obj: data?.options_obj || {},
        task_next_obj: data?.task_next_obj || {},
        request_feedback: data?.request_feedback || false,
        created_by: data?.created_by || undefined,
        updated_by: data?.updated_by || undefined,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
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