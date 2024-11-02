import { AliceTask, convertToAliceTask } from './TaskTypes';
import { AliceAgent, convertToAliceAgent } from './AgentTypes';
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from './CollectionTypes';
import { convertToMessageType, MessageType } from './MessageTypes';
import { UserCheckpoint } from './UserCheckpointTypes';
import { References } from './ReferenceTypes';

export interface AliceChat extends BaseDatabaseObject {
    name: string;
    messages: MessageType[];
    alice_agent: AliceAgent;
    functions?: AliceTask[];
    user_checkpoints?: { [key: string]: UserCheckpoint };
    data_cluster?: References;
}

export const convertToAliceChat = (data: any): AliceChat => {
    return {
        ...convertToBaseDatabaseObject(data),
        name: data?.name || '',
        messages: (data?.messages || []).map(convertToMessageType),
        alice_agent: convertToAliceAgent(data?.alice_agent),
        functions: (data?.functions || []).map(convertToAliceTask),
        user_checkpoints: data?.user_checkpoints || {},
        data_cluster: data?.data_cluster || {},
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