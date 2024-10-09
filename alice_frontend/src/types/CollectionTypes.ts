import { AliceAgent, convertToAliceAgent } from './AgentTypes';
import { AliceChat, convertToAliceChat } from './ChatTypes';
import { AliceModel, convertToAliceModel } from './ModelTypes';
import { AliceTask, convertToAliceTask } from './TaskTypes';
import { Prompt, convertToPrompt } from './PromptTypes';
import { TaskResponse, convertToTaskResponse } from './TaskResponseTypes';
import { ParameterDefinition, convertToParameterDefinition } from './ParameterTypes';
import { User, convertToUser } from './UserTypes';
import { API, convertToAPI } from './ApiTypes';
import { convertToFileReference, FileReference } from './FileTypes';
import { convertToMessageType, MessageType } from './MessageTypes';
import { convertToURLReference, URLReference } from './URLReferenceTypes';
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

export type CollectionName = 'agents' | 'chats' | 'models' | 'tasks' | 'prompts' | 'taskresults' | 'users' | 'parameters' | 'apis' | 'files' | 'messages' | 'urlreferences';
export type CollectionElement = AliceAgent | AliceChat | AliceModel | AliceTask | Prompt | TaskResponse | User | ParameterDefinition | API | User | FileReference | MessageType | URLReference;
export type CollectionElementString = 'Agent' | 'Model' | 'Parameter' | 'Prompt' | 'Task' | 'TaskResponse' | 'Chat' | 'API' | 'User' | 'File' | 'Message' | 'URLReference';

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
    urlreferences: 'URLReference'
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
    urlreferences: EnhancedURLReference
};


export const converters: { [K in CollectionName]: (data: any) => CollectionType[K] } = {
    agents: convertToAliceAgent,
    chats: convertToAliceChat,
    models: convertToAliceModel,
    tasks: convertToAliceTask,
    prompts: convertToPrompt,
    taskresults: convertToTaskResponse,
    users: convertToUser,
    parameters: convertToParameterDefinition,
    apis: convertToAPI,
    files: convertToFileReference,
    messages: convertToMessageType,
    urlreferences: convertToURLReference,
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