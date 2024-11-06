import { AliceTask, convertToAliceTask } from './TaskTypes';
import { AliceAgent, convertToAliceAgent } from './AgentTypes';
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from './CollectionTypes';
import { convertToMessageType, MessageType } from './MessageTypes';
import { UserCheckpoint } from './UserCheckpointTypes';
import { convertToDataCluster, DataCluster } from './DataClusterTypes';

export interface AliceChat extends BaseDatabaseObject {
    name: string;
    messages: MessageType[];
    alice_agent: AliceAgent;
    agent_tools?: AliceTask[];
    user_checkpoints?: { [key: string]: UserCheckpoint };
    data_cluster?: DataCluster;
    retrieval_tools?: AliceTask[];
}

export const convertToAliceChat = (data: any): AliceChat => {
    return {
        ...convertToBaseDatabaseObject(data),
        name: data?.name || '',
        messages: (data?.messages || []).map(convertToMessageType),
        alice_agent: convertToAliceAgent(data?.alice_agent),
        agent_tools: (data?.agent_tools || []).map(convertToAliceTask),
        user_checkpoints: data?.user_checkpoints || undefined,
        data_cluster: data?.data_cluster ? convertToDataCluster(data?.data_cluster) : undefined,
        retrieval_tools: (data?.retrieval_tools || []).map(convertToAliceTask),
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
    agent_tools: [],
    user_checkpoints: {},
    data_cluster: {},
    retrieval_tools: undefined,
});