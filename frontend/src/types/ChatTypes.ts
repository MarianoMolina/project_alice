import { BaseDataseObject } from './UserTypes';
import { AliceTask, convertToAliceTask } from './TaskTypes';
import { AliceAgent, convertToAliceAgent } from './AgentTypes';
import { EnhancedComponentProps } from './CollectionTypes';
import { convertToMessageType, MessageType } from './MessageTypes';
import { UserCheckpoint } from './UserCheckpointTypes';
import { References } from './ReferenceTypes';

export interface AliceChat extends BaseDataseObject {
    _id: string;
    name: string;
    messages: MessageType[];
    alice_agent: AliceAgent;
    functions?: AliceTask[];
    user_checkpoints?: { [key: string]: UserCheckpoint };
    data_cluster?: References;
}

export const convertToAliceChat = (data: any): AliceChat => {
    return {
        _id: data?._id || '',
        name: data?.name || '',
        messages: (data?.messages || []).map(convertToMessageType),
        alice_agent: convertToAliceAgent(data?.alice_agent),
        functions: (data?.functions || []).map(convertToAliceTask),
        user_checkpoints: data?.user_checkpoints || {},
        data_cluster: data?.data_cluster || {},
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

export interface ChatComponentProps extends EnhancedComponentProps<AliceChat> {
    
}

export const getDefaultChatForm = (): Partial<AliceChat> => ({
    name: '',
    messages: [],
    alice_agent: undefined,
    functions: [],
    user_checkpoints: {},
    data_cluster: {},
});