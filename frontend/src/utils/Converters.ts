import { CollectionName, CollectionType } from "../types/CollectionTypes";
import { convertToAliceAgent } from "../types/AgentTypes";
import { convertToAPI } from "../types/ApiTypes";
import { convertToAliceChat } from "../types/ChatTypes";
import { convertToDataCluster } from "../types/DataClusterTypes";
import { convertToEmbeddingChunk } from "../types/EmbeddingChunkTypes";
import { convertToFileReference } from "../types/FileTypes";
import { convertToMessageType } from "../types/MessageTypes";
import { convertToAliceModel } from "../types/ModelTypes";
import { convertToParameterDefinition } from "../types/ParameterTypes";
import { convertToPrompt } from "../types/PromptTypes";
import { convertToTaskResponse } from "../types/TaskResponseTypes";
import { convertToAliceTask } from "../types/TaskTypes";
import { convertToURLReference } from "../types/URLReferenceTypes";
import { convertToUserCheckpoint } from "../types/UserCheckpointTypes";
import { convertToUserInteraction } from "../types/UserInteractionTypes";
import { convertToUser } from "../types/UserTypes";

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
    userinteractions: convertToUserInteraction,
    usercheckpoints: convertToUserCheckpoint,
    dataclusters: convertToDataCluster,
    embeddingchunks: convertToEmbeddingChunk
};