import axios from 'axios';
import Agent from '../models/agent.model';
import API from '../models/api.model';
import Chat from '../models/chat.model';
import Model from '../models/model.model';
import Prompt from '../models/prompt.model';
import Task from '../models/task.model';
import TaskResult from '../models/taskResult.model';
import ParameterDefinition from '../models/parameter.model';
import FileReference from '../models/file.model';
import Message from '../models/message.model';
import UserCheckpoint from '../models/userCheckpoint.model';
import UserInteraction from '../models/userInteraction.model';
import Logger from './logger';
import { deleteFile } from './file.utils';
import EmbeddingChunk from '../models/embeddingChunk.model';
import { DataCluster } from '../models/reference.model';
import EntityReference from '../models/entityReference.model';
import ToolCall from '../models/toolCall.model';
import CodeExecution from '../models/codeExecution.model';
import APIConfig from '../models/apiConfig.model';

const workflow_port = process.env.WORKFLOW_PORT_DOCKER || 8000;
const workflow_name = process.env.WORKFLOW_NAME || 'workflow';

export async function purgeAndReinitialize(userId: string, token: string): Promise<void> {
  Logger.info('Purging data for userId:', userId);

  const models = [Agent, API, Chat, Model, Prompt, Task, TaskResult, ParameterDefinition, Message, UserCheckpoint, UserInteraction, FileReference, EmbeddingChunk, DataCluster, EntityReference, ToolCall, CodeExecution, APIConfig];
  
  // Handle file deletions separately
  const fileReferences = await FileReference.find({ created_by: userId });
  for (const fileRef of fileReferences) {
    try {
      await deleteFile(fileRef._id.toString(), userId);
    } catch (error) {
      Logger.error(`Error deleting file ${fileRef._id}:`, error);
    }
  }

  // Delete data from other collections
  for (const ModelClass of models) {
    await (ModelClass as any).deleteMany({ created_by: userId });
  }

  Logger.info('All collections purged');

  // Reinitialize the user database
  const workflowUrl = `http://${workflow_name}:${workflow_port}/initialize_user_database`;
  await axios.post(workflowUrl, {}, {
    headers: {
      Authorization: token
    }
  });

  Logger.info('Database re-initialized successfully');
}