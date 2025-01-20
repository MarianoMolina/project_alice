import { convertToEmbeddable, convertToPopulatedEmbeddable, Embeddable, EnhancedComponentProps, PopulatedEmbeddable } from "./CollectionTypes";
import { UserCheckpoint } from "./UserCheckpointTypes";

export enum InteractionOwnerType {
    TASK_RESPONSE = "task_response",
    CHAT = "chat"
}

// Base interface for owner properties
interface BaseOwner {
    type: InteractionOwnerType;
}

// Task response owner interface
interface TaskResponseOwner extends BaseOwner {
    type: InteractionOwnerType.TASK_RESPONSE;
    task_result_id: string;
}

// Chat owner interface
interface ChatOwner extends BaseOwner {
    type: InteractionOwnerType.CHAT;
    chat_id: string;
    thread_id: string;
}

// Union type for all possible owners
export type InteractionOwner = TaskResponseOwner | ChatOwner;

export interface UserResponse {
    selected_option: number;
    user_feedback?: string;
}

export interface UserInteraction extends Embeddable {
    owner: InteractionOwner;
    user_checkpoint_id: UserCheckpoint;
    user_response?: UserResponse;
}

export interface PopulatedUserInteraction extends Omit<UserInteraction, keyof PopulatedEmbeddable>, PopulatedEmbeddable {

}
export const convertToUserInteraction = (data: any): UserInteraction => {
    const baseInteraction = {
        ...convertToEmbeddable(data),
        user_checkpoint_id: data?.user_checkpoint_id || undefined,
        user_response: data?.user_response || undefined,
    };

    // Handle owner based on type
    if (data?.owner?.type === InteractionOwnerType.CHAT) {
        return {
            ...baseInteraction,
            owner: {
                type: InteractionOwnerType.CHAT,
                chat_id: data?.owner?.chat_id || '',
                thread_id: data?.owner?.thread_id || ''
            }
        };
    } else {
        // Default to TASK_RESPONSE if type is missing or different
        return {
            ...baseInteraction,
            owner: {
                type: InteractionOwnerType.TASK_RESPONSE,
                task_result_id: data?.owner?.task_result_id || ''
            }
        };
    }
};
export const convertToPopulatedUserInteraction = (data: any): PopulatedUserInteraction => {
    const baseInteraction = {
        ...convertToPopulatedEmbeddable(data),
        user_checkpoint_id: data?.user_checkpoint_id || undefined,
        user_response: data?.user_response || undefined,
    };

    // Handle owner based on type
    if (data?.owner?.type === InteractionOwnerType.CHAT) {
        return {
            ...baseInteraction,
            owner: {
                type: InteractionOwnerType.CHAT,
                chat_id: data?.owner?.chat_id || '',
                thread_id: data?.owner?.thread_id || ''
            }
        };
    } else {
        // Default to TASK_RESPONSE if type is missing or different
        return {
            ...baseInteraction,
            owner: {
                type: InteractionOwnerType.TASK_RESPONSE,
                task_result_id: data?.owner?.task_result_id || ''
            }
        };
    }
};


export interface UserInteractionComponentProps extends EnhancedComponentProps<UserInteraction | PopulatedUserInteraction> {
}

export const getDefaultUserInteractionForm = (ownerType: InteractionOwnerType = InteractionOwnerType.TASK_RESPONSE): Partial<PopulatedUserInteraction> => {
    const baseForm = {
        user_checkpoint_id: undefined,
        user_response: undefined,
    };

    if (ownerType === InteractionOwnerType.CHAT) {
        return {
            ...baseForm,
            owner: {
                type: InteractionOwnerType.CHAT,
                chat_id: '',
                thread_id: ''
            }
        };
    } else {
        return {
            ...baseForm,
            owner: {
                type: InteractionOwnerType.TASK_RESPONSE,
                task_result_id: ''
            }
        };
    }
};