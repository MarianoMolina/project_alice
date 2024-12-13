import { convertToEmbeddable, convertToPopulatedEmbeddable, Embeddable, EnhancedComponentProps, PopulatedEmbeddable } from "./CollectionTypes";
import { UserCheckpoint } from "./UserCheckpointTypes";

export enum InteractionOwnerType {
    TASK_RESPONSE = "task_response",
    CHAT = "chat"
}

export interface InteractionOwner {
    type: InteractionOwnerType;
    id: string;
}

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
    return {
        ...convertToEmbeddable(data),
        owner: {
            type: data?.owner?.type || InteractionOwnerType.TASK_RESPONSE,
            id: data?.owner?.id || undefined
        },
        user_checkpoint_id: data?.user_checkpoint_id || undefined,
        user_response: data?.user_response || undefined,
    };
};

export const convertToPopulatedUserInteraction = (data: any): PopulatedUserInteraction => {
    return {
        ...convertToPopulatedEmbeddable(data),
        owner: {
            type: data?.owner?.type || InteractionOwnerType.TASK_RESPONSE,
            id: data?.owner?.id || undefined
        },
        user_checkpoint_id: data?.user_checkpoint_id || undefined,
        user_response: data?.user_response || undefined,
    };
}

export interface UserInteractionComponentProps extends EnhancedComponentProps<UserInteraction | PopulatedUserInteraction> {
}

export interface PopulatedUserInteractionComponentProps extends EnhancedComponentProps<PopulatedUserInteraction> {
}

export const getDefaultUserInteractionForm = (): Partial<PopulatedUserInteraction> => ({
    owner: {
        type: InteractionOwnerType.TASK_RESPONSE,
        id: ''
    },
    user_checkpoint_id: undefined,
    user_response: undefined,
});