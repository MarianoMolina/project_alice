import { CheckpointType } from "./ChatTypes";
import { BasicDBObj, convertToBasicDBObj } from "./CollectionTypes";

export type CreationMethod = 'password' | 'google';


export type UserCheckpoints = {
    [CheckpointType.TOOL_CALL]: string;
    [CheckpointType.CODE_EXECUTION]: string;
};
export interface UserDefaultChatConfig {
    alice_agent: string;
    agent_tools: string[];
    retrieval_tools: string[];
    data_cluster?: string;
    creationMethod?: CreationMethod;
    default_user_checkpoints: UserCheckpoints;
}

export interface User extends BasicDBObj {
    name: string;
    email: string;
    role?: 'user' | 'admin';
    default_chat_config?: UserDefaultChatConfig;
}

export const converToUserDefaultChatConfig = (data: any): UserDefaultChatConfig => {
    return {
        alice_agent: data?.alice_agent || undefined,
        agent_tools: data?.agent_tools || [],
        retrieval_tools: data?.retrieval_tools || [],
        data_cluster: data?.data_cluster || undefined,
        default_user_checkpoints: data?.default_user_checkpoints || undefined,
    };
}

export const convertToUser = (data: any): User => {
    return {
        ...convertToBasicDBObj(data),
        name: data?.name || '',
        email: data?.email || '',
        role: data?.role || 'user',
        default_chat_config: converToUserDefaultChatConfig(data?.default_chat_config),
    };
};