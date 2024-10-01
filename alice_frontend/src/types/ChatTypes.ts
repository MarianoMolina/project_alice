import { BaseDataseObject } from './UserTypes';
import { AliceTask, convertToAliceTask } from './TaskTypes';
import { AliceAgent, convertToAliceAgent } from './AgentTypes';
import { HandleClickProps } from './CollectionTypes';
import { convertToMessageType, MessageType } from './MessageTypes';

export interface AliceChat extends BaseDataseObject {
    _id: string;
    name: string;
    messages: MessageType[];
    alice_agent: AliceAgent;
    functions?: AliceTask[];
}

export const convertToAliceChat = (data: any): AliceChat => {
    return {
        _id: data?._id || '',
        name: data?.name || '',
        messages: (data?.messages || []).map(convertToMessageType),
        alice_agent: convertToAliceAgent(data?.alice_agent),
        functions: (data?.functions || []).map(convertToAliceTask),
        created_by: data?.created_by || undefined,
        updated_by: data?.updated_by || undefined,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};

export interface MessageProps {
    message: MessageType,
    chatId?: string,
}

export interface ChatComponentProps extends HandleClickProps {
    items: AliceChat[] | null;
    item: AliceChat | null;
    onChange: (newItem: Partial<AliceChat>) => void;
    mode: 'create' | 'view' | 'edit';
    handleSave: () => Promise<void>;
    isInteractable?: boolean;
    onInteraction?: (chat: AliceChat) => void;
    onView?: (chat: AliceChat) => void;
    showRegenerate?: boolean;
    showHeaders?: boolean;
}

export const getDefaultChatForm = (): Partial<AliceChat> => ({
    name: '',
    messages: [],
    alice_agent: undefined,
    functions: [],
});