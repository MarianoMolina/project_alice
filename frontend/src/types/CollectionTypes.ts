import { AliceAgent } from './AgentTypes';
import { AliceChat, PopulatedAliceChat } from './ChatTypes';
import { AliceModel } from './ModelTypes';
import { AliceTask, PopulatedTask } from './TaskTypes';
import { Prompt } from './PromptTypes';
import { PopulatedTaskResponse, TaskResponse } from './TaskResponseTypes';
import { ParameterDefinition } from './ParameterTypes';
import { User } from './UserTypes';
import { API } from './ApiTypes';
import { FileReference, PopulatedFileReference } from './FileTypes';
import { MessageType, PopulatedMessage } from './MessageTypes';
import { PopulatedUserInteraction, UserInteraction } from './UserInteractionTypes';
import { UserCheckpoint } from './UserCheckpointTypes';
import { convertToEmbeddingChunk, EmbeddingChunk } from './EmbeddingChunkTypes';
import { DataCluster, PopulatedDataCluster } from './DataClusterTypes';
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
import EnhancedUserInteraction from '../components/enhanced/user_interaction/user_interaction/EnhancedUserInteraction';
import EnhancedUserCheckpoint from '../components/enhanced/user_checkpoint/user_checkpoint/EnhancedUserCheckpoint';
import EnhancedDataCluster from '../components/enhanced/data_cluster/data_cluster/EnhancedDataCluster';
import EnhancedEmbeddingChunk from '../components/enhanced/embedding_chunk/embedding_chunk/EnhancedEmbeddingChunk';
import { CodeExecution, PopulatedCodeExecution } from './CodeExecutionTypes';
import { APIConfig } from './ApiConfigTypes';
import { PopulatedToolCall, ToolCall } from './ToolCallTypes';
import EnhancedToolCall from '../components/enhanced/tool_calls/tool_calls/EnhancedToolCall';
import EnhancedCodeExecution from '../components/enhanced/code_execution/code_execution/EnhancedCodeExecution';
import EnhancedAPIConfig from '../components/enhanced/api_config/api_config/EnhancedAPIConfig';
import { EntityReference, PopulatedEntityReference } from './EntityReferenceTypes';
import EnhancedEntityReference from '../components/enhanced/entity_reference/entity_reference/EnhancedEntityReference';

export type CollectionName = 'agents' | 'chats' | 'models' | 'tasks' | 'prompts' | 'taskresults' | 'users' | 'parameters' | 'apis' | 'files' | 'messages' | 'userinteractions' | 'usercheckpoints' | 'dataclusters' | 'embeddingchunks' | 'toolcalls' | 'codeexecutions' | 'apiconfigs' | 'entityreferences';
export type CollectionElement = AliceAgent | AliceChat | AliceModel | AliceTask | Prompt | TaskResponse | User | ParameterDefinition | API | User | FileReference | MessageType | UserInteraction | UserCheckpoint | DataCluster | EmbeddingChunk | ToolCall | CodeExecution | APIConfig | EntityReference;
export type CollectionPopulatedElement = AliceAgent | PopulatedAliceChat | AliceModel | PopulatedTask | Prompt | PopulatedTaskResponse | User | ParameterDefinition | API | User | PopulatedFileReference | PopulatedMessage | PopulatedUserInteraction | UserCheckpoint | PopulatedDataCluster | EmbeddingChunk | PopulatedToolCall | PopulatedCodeExecution | APIConfig | PopulatedEntityReference;
export type CollectionElementString = 'Agent' | 'Model' | 'Parameter' | 'Prompt' | 'Task' | 'TaskResponse' | 'Chat' | 'API' | 'User' | 'File' | 'Message' | 'UserInteraction' | 'UserCheckpoint' | 'DataCluster' | 'EmbeddingChunk' | 'ToolCall' | 'CodeExecution' | 'APIConfig' | 'EntityReference';

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
    userinteractions: UserInteraction;
    usercheckpoints: UserCheckpoint;
    dataclusters: DataCluster;
    embeddingchunks: EmbeddingChunk;
    toolcalls: ToolCall;
    codeexecutions: CodeExecution;
    apiconfigs: APIConfig;
    entityreferences: EntityReference;
};
export type CollectionPopulatedType = {
    agents: AliceAgent;
    chats: PopulatedAliceChat;
    models: AliceModel;
    tasks: PopulatedTask;
    prompts: Prompt;
    taskresults: PopulatedTaskResponse;
    users: User;
    parameters: ParameterDefinition;
    apis: API;
    files: PopulatedFileReference;
    messages: PopulatedMessage;
    userinteractions: PopulatedUserInteraction;
    usercheckpoints: UserCheckpoint;
    dataclusters: PopulatedDataCluster;
    embeddingchunks: EmbeddingChunk;
    toolcalls: PopulatedToolCall;
    codeexecutions: PopulatedCodeExecution;
    apiconfigs: APIConfig;
    entityreferences: PopulatedEntityReference;
};
export type ElementTypeMap = {
    Agent: AliceAgent;
    Model: AliceModel;
    Parameter: ParameterDefinition;
    Prompt: Prompt;
    Task: AliceTask;
    TaskResponse: TaskResponse;
    Chat: AliceChat;
    API: API;
    User: User;
    File: FileReference;
    Message: MessageType;
    UserInteraction: UserInteraction;
    UserCheckpoint: UserCheckpoint;
    DataCluster: DataCluster;
    EmbeddingChunk: EmbeddingChunk;
    ToolCall: ToolCall;
    CodeExecution: CodeExecution;
    APIConfig: APIConfig;
    EntityReference: EntityReference;
}

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
    userinteractions: 'UserInteraction';
    usercheckpoints: 'UserCheckpoint';
    dataclusters: 'DataCluster';
    embeddingchunks: 'EmbeddingChunk';
    toolcalls: 'ToolCall';
    codeexecutions: 'CodeExecution';
    apiconfigs: 'APIConfig';
    entityreferences: 'EntityReference';
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
    userinteractions: 'UserInteraction',
    usercheckpoints: 'UserCheckpoint',
    dataclusters: 'DataCluster',
    embeddingchunks: 'EmbeddingChunk',
    toolcalls: 'ToolCall',
    codeexecutions: 'CodeExecution',
    apiconfigs: 'APIConfig',
    entityreferences: 'EntityReference',
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
    userinteractions: EnhancedUserInteraction,
    usercheckpoints: EnhancedUserCheckpoint,
    dataclusters: EnhancedDataCluster,
    embeddingchunks: EnhancedEmbeddingChunk,
    toolcalls: EnhancedToolCall,
    codeexecutions: EnhancedCodeExecution,
    apiconfigs: EnhancedAPIConfig,
    entityreferences: EnhancedEntityReference,
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
    UserInteraction: 'UserInteraction',
    UserCheckpoint: 'UserCheckpoint',
    DataCluster: 'DataCluster',
    EmbeddingChunk: 'EmbeddingChunk',
    ToolCall: 'ToolCall',
    CodeExecution: 'CodeExecution',
    APIConfig: 'APIConfig',
    EntityReference: 'EntityReference',
};
export function getCollectionNameFromElement(elementString: CollectionElementString): CollectionName {
    const entry = Object.entries(collectionNameToElementString).find(
        ([_, value]) => value === elementString
    );
    
    if (!entry) {
        throw new Error(`No collection name found for element string: ${elementString}`);
    }
    
    return entry[0] as CollectionName;
}
export type ComponentMode = 'create' | 'edit' | 'view' | 'list' | 'shortList' | 'table';

export interface HandleClickProps {
    handleModelClick?: (modelId: string, item?: AliceModel) => void;
    handleAgentClick?: (agentId: string, item?: AliceAgent) => void;
    handleTaskClick?: (taskId: string, item?: PopulatedTask) => void;
    handlePromptClick?: (promptId: string, item?: Prompt) => void;
    handleParameterClick?: (paramId: string, item?: ParameterDefinition) => void;
    handleApiClick?: (apiId: string, item?: API) => void;
    handleTaskResultClick?: (taskResultId: string, item?: PopulatedTaskResponse) => void;
    handleFileClick?: (fileId: string, item?: PopulatedFileReference) => void;
    handleMessageClick?: (messageId: string, item?: PopulatedMessage) => void;
    handleUserInteractionClick?: (userInteractionId: string, item?: PopulatedUserInteraction) => void;
    handleUserCheckpointClick?: (userCheckpointId: string, item?: UserCheckpoint) => void;
    handleDataClusterClick?: (dataClusterId: string, item?: PopulatedDataCluster) => void;
    handleEmbeddingChunkClick?: (embeddingChunkId: string, item?: EmbeddingChunk) => void;
    handleToolCallClick?: (toolCallId: string, item?: PopulatedToolCall) => void;
    handleCodeExecutionClick?: (codeExecutionId: string, item?: PopulatedCodeExecution) => void;
    handleAPIConfigClick?: (apiConfigId: string, item?: APIConfig) => void;
    handleEntityReferenceClick?: (entityReferenceId: string, item?: PopulatedEntityReference) => void;
}
export interface EnhancedComponentProps<T extends CollectionElement | CollectionPopulatedElement> extends HandleClickProps {
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
export interface Embeddable extends BaseDatabaseObject {
    embedding?: string[];
}

// Define the populated type
type PopulatedFields = {
    embedding?: EmbeddingChunk[];
}

// Create the populated interface
export interface PopulatedEmbeddable extends Omit<Embeddable, keyof PopulatedFields>, PopulatedFields {}

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
    ...convertToBaseDatabaseObject(data),
    embedding: data.embedding || [],
});

export const convertToPopulatedEmbeddable = <T extends Partial<PopulatedEmbeddable>>(data: T): PopulatedEmbeddable => ({
    ...convertToBaseDatabaseObject(data),
    embedding: data.embedding ? data.embedding.map(convertToEmbeddingChunk) : [],
});