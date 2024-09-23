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

export type CollectionName = 'agents' | 'chats' | 'models' | 'tasks' | 'prompts' | 'taskresults' | 'users' | 'parameters' | 'apis' | 'files';
export type CollectionElement = AliceAgent | AliceChat | AliceModel | AliceTask | Prompt | TaskResponse | User | ParameterDefinition | API | User | FileReference;
export type CollectionElementString = 'Agent' | 'Model' | 'Parameter' | 'Prompt' | 'Task' | 'TaskResponse' | 'Chat' | 'API' | 'User' | 'File';

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
};

export type ComponentMode = 'create' | 'edit' | 'view' | 'list' | 'shortList' | 'table';

export interface HandleClickProps {
    handleModelClick?: (modelId: string) => void;
    handleAgentClick?: (agentId: string) => void;
    handleTaskClick?: (taskId: string) => void;
    handlePromptClick?: (promptId: string) => void;
    handleParameterClick?: (paramId: string) => void;
    handleApiClick?: (apiId: string) => void;
    handleTaskResultClick?: (taskResultId: string) => void;
}