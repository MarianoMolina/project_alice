import { AliceAgent } from './AgentTypes';
import { AliceChat } from './ChatTypes';
import { AliceModel } from './ModelTypes';
import { AliceTask } from './TaskTypes';
import { Prompt } from './PromptTypes';
import { TaskResponse } from './TaskResponseTypes';
import { ParameterDefinition } from './ParameterTypes';
import { User } from './UserTypes';
import { API } from './ApiTypes';
import { FileReference } from './FileTypes';
import { MessageType } from './MessageTypes';
import { URLReference } from './URLReferenceTypes';
import { UserInteraction } from './UserInteractionTypes';
import { UserCheckpoint } from './UserCheckpointTypes';
import { EmbeddingChunk } from './EmbeddingChunkTypes';
import { DataCluster } from './DataClusterTypes';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';
import EnhancedAgent from '../components/enhanced/agent/agent/EnhancedAgent';
import EnhancedChat from '../components/enhanced/chat/chat/EnhancedChat';
import EnhancedFile from '../components/enhanced/file/file/EnhancedFile';
import EnhancedMessage from '../components/enhanced/message/message/EnhancedMessage';
import EnhancedModel from '../components/enhanced/model/model/EnhancedModel';
import EnhancedParameter from '../components/enhanced/parameter/parameter/EnhancedParameter';
import EnhancedPrompt from '../components/enhanced/prompt/prompt/EnhancedPrompt';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import EnhancedURLReference from '../components/enhanced/url_reference/url_reference/EnhancedURLReference';
import EnhancedUserInteraction from '../components/enhanced/user_interaction/user_interaction/EnhancedUserInteraction';
import EnhancedUserCheckpoint from '../components/enhanced/user_checkpoint/user_checkpoint/EnhancedUserCheckpoint';
import EnhancedDataCluster from '../components/enhanced/data_cluster/data_cluster/EnhancedDataCluster';
import EnhancedEmbeddingChunk from '../components/enhanced/embedding_chunk/embedding_chunk/EnhancedEmbeddingChunk';

export type CollectionName = 'agents' | 'chats' | 'models' | 'tasks' | 'prompts' | 'taskresults' | 'users' | 'parameters' | 'apis' | 'files' | 'messages' | 'urlreferences' | 'userinteractions' | 'usercheckpoints' | 'dataclusters' | 'embeddingchunks';
export type CollectionElement = AliceAgent | AliceChat | AliceModel | AliceTask | Prompt | TaskResponse | User | ParameterDefinition | API | User | FileReference | MessageType | URLReference | UserInteraction | UserCheckpoint | DataCluster | EmbeddingChunk;
export type CollectionElementString = 'Agent' | 'Model' | 'Parameter' | 'Prompt' | 'Task' | 'TaskResponse' | 'Chat' | 'API' | 'User' | 'File' | 'Message' | 'URLReference' | 'UserInteraction' | 'UserCheckpoint' | 'DataCluster' | 'EmbeddingChunk';

export type CollectionType = {
    agents: AliceAgent;
    chats: AliceChat;
    models: AliceModel;
    tasks: AliceTask;
    prompts: Prompt;
    taskresults: TaskResponse;
    users: User;
    parameters: ParameterDefinition;
    apis: API;
    files: FileReference;
    messages: MessageType;
    urlreferences: URLReference;
    userinteractions: UserInteraction;
    usercheckpoints: UserCheckpoint;
    dataclusters: DataCluster;
    embeddingchunks: EmbeddingChunk;
};

export type CollectionTypeString = {
    agents: 'Agent';
    chats: 'Chat';
    models: 'Model';
    tasks: 'Task';
    prompts: 'Prompt';
    taskresults: 'TaskResponse';
    users: 'User';
    parameters: 'Parameter';
    apis: 'API';
    files: 'File';
    messages: 'Message';
    urlreferences: 'URLReference';
    userinteractions: 'UserInteraction';
    usercheckpoints: 'UserCheckpoint';
    dataclusters: 'DataCluster';
    embeddingchunks: 'EmbeddingChunk';
};

export const collectionNameToElementString: Record<CollectionName, CollectionElementString> = {
    agents: 'Agent',
    chats: 'Chat',
    models: 'Model',
    tasks: 'Task',
    prompts: 'Prompt',
    taskresults: 'TaskResponse',
    users: 'User',
    parameters: 'Parameter',
    apis: 'API',
    files: 'File',
    messages: 'Message',
    urlreferences: 'URLReference',
    userinteractions: 'UserInteraction',
    usercheckpoints: 'UserCheckpoint',
    dataclusters: 'DataCluster',
    embeddingchunks: 'EmbeddingChunk'
};

export const collectionNameToEnhancedComponent: Record<CollectionName, React.ComponentType<any>> = {
    agents: EnhancedAgent,
    chats: EnhancedChat,
    models: EnhancedModel,
    tasks: EnhancedTask,
    prompts: EnhancedPrompt,
    taskresults: EnhancedTaskResponse,
    users: EnhancedAgent,
    parameters: EnhancedParameter,
    apis: EnhancedAPI,
    files: EnhancedFile,
    messages: EnhancedMessage,
    urlreferences: EnhancedURLReference,
    userinteractions: EnhancedUserInteraction,
    usercheckpoints: EnhancedUserCheckpoint,
    dataclusters: EnhancedDataCluster,
    embeddingchunks: EnhancedEmbeddingChunk
};

// Create a runtime mapping object
export const collectionTypeMapping: Record<string, CollectionElementString> = {
    AliceAgent: 'Agent',
    AliceChat: 'Chat',
    AliceModel: 'Model',
    AliceTask: 'Task',
    Prompt: 'Prompt',
    TaskResponse: 'TaskResponse',
    User: 'User',
    ParameterDefinition: 'Parameter',
    API: 'API',
    FileReference: 'File',
    MessageType: 'Message',
    URLReference: 'URLReference',
    UserInteraction: 'UserInteraction',
    UserCheckpoint: 'UserCheckpoint',
    DataCluster: 'DataCluster',
    EmbeddingChunk: 'EmbeddingChunk'
};

export type ComponentMode = 'create' | 'edit' | 'view' | 'list' | 'shortList' | 'table';

export interface HandleClickProps {
    handleModelClick?: (modelId: string, item?: AliceModel) => void;
    handleAgentClick?: (agentId: string, item?: AliceAgent) => void;
    handleTaskClick?: (taskId: string, item?: AliceTask) => void;
    handlePromptClick?: (promptId: string, item?: Prompt) => void;
    handleParameterClick?: (paramId: string, item?: ParameterDefinition) => void;
    handleApiClick?: (apiId: string, item?: API) => void;
    handleTaskResultClick?: (taskResultId: string, item?: TaskResponse) => void;
    handleFileClick?: (fileId: string, item?: FileReference) => void;
    handleMessageClick?: (messageId: string, item?: MessageType) => void;
    handleURLReferenceClick?: (urlReferenceId: string, item?: URLReference) => void;
    handleUserInteractionClick?: (userInteractionId: string, item?: UserInteraction) => void;
    handleUserCheckpointClick?: (userCheckpointId: string, item?: UserCheckpoint) => void;
    handleDataClusterClick?: (dataClusterId: string, item?: DataCluster) => void;
}
export interface EnhancedComponentProps<T extends CollectionElement> extends HandleClickProps {
    items: T[] | null;
    item: T | null;
    onChange: (newItem: Partial<T>) => void;
    mode: 'create' | 'view' | 'edit';
    handleSave: () => Promise<void>;
    handleDelete?: (deletedItem: T) => Promise<void>;
    isInteractable?: boolean;
    onView?: (item: T) => void;
    onInteraction?: (item: T) => void;
    showHeaders?: boolean
}

export interface BasicDBObj {
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BaseDatabaseObject extends BasicDBObj {
    created_by?: User;
    updated_by?: User;
}

export interface Embeddable {
    embedding: EmbeddingChunk[];
}

// Generic converters that work with any type extending the base interfaces
export const convertToBasicDBObj = <T extends Partial<BasicDBObj>>(data: T): BasicDBObj => ({
    _id: data._id,
    createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
});

export const convertToBaseDatabaseObject = <T extends Partial<BaseDatabaseObject>>(data: T): BaseDatabaseObject => ({
    ...convertToBasicDBObj(data),
    created_by: data.created_by,
    updated_by: data.updated_by,
});

export const convertToEmbeddable = <T extends Partial<Embeddable>>(data: T): Embeddable => ({
    embedding: data.embedding || [],
});