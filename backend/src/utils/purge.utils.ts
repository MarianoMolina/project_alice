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
import User from '../models/user.model';
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

  try {
    // Reset the user's default chat config with empty schema structure
    const defaultChatConfig = {
      alice_agent: null,
      agent_tools: [],
      retrieval_tools: [],
      data_cluster: null,
      default_user_checkpoints: new Map()
    };

    const updateResult = await User.updateOne(
      { _id: userId },
      { $set: { default_chat_config: defaultChatConfig } }
    );
    
    if (updateResult.modifiedCount > 0) {
      Logger.info('Successfully reset default chat config for user');
    } else {
      Logger.warn('No default chat config found to reset for user');
    }

    // Handle file deletions separately
    const fileReferences = await FileReference.find({ created_by: userId });
    for (const fileRef of fileReferences) {
      try {
        await deleteFile(fileRef._id.toString(), userId);
      } catch (error: unknown) {
        if (error instanceof Error) {
          Logger.error(`Error deleting file ${fileRef._id}:`, error.message);
        } else {
          Logger.error(`Unknown error deleting file ${fileRef._id}`);
        }
      }
    }

    // Delete data from all collections
    const models = [
      Agent, API, Chat, Model, Prompt, Task, TaskResult, 
      ParameterDefinition, Message, UserCheckpoint, UserInteraction, 
      FileReference, EmbeddingChunk, DataCluster, EntityReference, 
      ToolCall, CodeExecution, APIConfig
    ];

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
  } catch (error: unknown) {
    if (error instanceof Error) {
      Logger.error('Error during purge and reinitialize:', error.message);
      throw new Error(`Failed to purge and reinitialize user data: ${error.message}`);
    } else {
      Logger.error('Unknown error during purge and reinitialize');
      throw new Error('Failed to purge and reinitialize user data: Unknown error');
    }
  }
}