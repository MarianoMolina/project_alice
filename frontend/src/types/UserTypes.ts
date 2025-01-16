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
export enum UserTier {
    FREE = 'free',
    PRO = 'pro',
    ENTERPRISE = 'enterprise'
}

export interface UserStats {
    user_tier: UserTier;
    log_in_attempts: number;
    last_log_in_attempt: Date | null;
    log_in_successes: number;
    last_log_in_success: Date | null;
    actions_taken: number;
}

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin'
}

export interface User extends BasicDBObj {
    name: string;
    email: string;
    role?: UserRole;
    default_chat_config?: UserDefaultChatConfig;
    stats?: UserStats;
}

export const defaultUserStats = () => ({
    user_tier: UserTier.FREE,
    log_in_attempts: 0,
    last_log_in_attempt: null,
    log_in_successes: 0,
    last_log_in_success: null,
    actions_taken: 0
})

export const converToUserDefaultChatConfig = (data: any): UserDefaultChatConfig => {
    return {
        alice_agent: data?.alice_agent || undefined,
        agent_tools: data?.agent_tools || [],
        retrieval_tools: data?.retrieval_tools || [],
        data_cluster: data?.data_cluster || undefined,
        default_user_checkpoints: data?.default_user_checkpoints || undefined
    };
}

export const convertToUser = (data: any): User => {
    return {
        ...convertToBasicDBObj(data),
        name: data?.name || '',
        email: data?.email || '',
        role: data?.role || 'user',
        default_chat_config: converToUserDefaultChatConfig(data?.default_chat_config),
        stats: data?.stats || defaultUserStats()
    };
};