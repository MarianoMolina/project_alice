import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from './CollectionTypes';
import { PopulatedMessage } from './MessageTypes';

export interface ChatThread extends BaseDatabaseObject {
    name?: string;
    messages: string[];
}

export interface PopulatedChatThread extends Omit<ChatThread, 'messages'> {
    messages: PopulatedMessage[];
}

export const convertToChatThread = (data: any): ChatThread => {
    return {
        ...convertToBaseDatabaseObject(data),
        name: data?.name || '',
        messages: data?.messages || [],
    };
}

export interface ChatThreadComponentProps extends EnhancedComponentProps<ChatThread | PopulatedChatThread> {
}

export const getDefaultChatThread = (): Partial<ChatThread> => ({
    name: 'New thread',
    messages: [],
});