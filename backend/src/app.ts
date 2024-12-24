import express from 'express';
import mongoose from 'mongoose';
import 'mongoose-schema-jsonschema';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import ModelRoutes from './routes/model.route';
import AgentRoutes from './routes/agent.route';
import TaskRoutes from './routes/task.route';
import UserRoutes from './routes/user.route';
import CollectionsRoutes from './routes/collections.route';
import PromptRoutes from './routes/prompt.route';
import TaskResultRouter from './routes/taskResult.route';
import ChatRoutes from './routes/chat.route';
import ParametersRoutes from './routes/parameter.route';
import HealthRoutes from './routes/health.route';
import APIRoutes from './routes/api.route';
import corsConfigMiddleware from './middleware/corsConfig.middleware';
import loggingMiddleware from './middleware/logging.middleware';
import LmStudioRoute from './routes/lmStudio.route';
import Logger from './utils/logger';
import FileRoutes from './routes/file.route';
import MessageRoutes from './routes/message.route';
import EntityReferenceRoutes from './routes/entityReference.route';
import UserCheckpointRoutes from './routes/userCheckpoint.route';
import UserInteractionRoutes from './routes/userInteraction.route';
import EmbeddingChunkRoutes from './routes/embeddingChunk.route';
import DataClusterRoutes from './routes/dataCluster.route';
import ToolCallRoutes from './routes/toolCall.route';
import CodeExecutionRoutes from './routes/codeExecution.route';
import APIConfigRoutes from './routes/apiConfig.route';

import './models';
import { MONGODB_URI } from './utils/const';

dotenv.config();

const app = express();

Logger.info('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(() => {
        Logger.info('Connected to MongoDB');
    })
    .catch(err => {
        Logger.error('Failed to connect to MongoDB', err);
    });

// Apply the logging middleware
app.use(loggingMiddleware);

// Apply the CORS middlewares
app.use(corsConfigMiddleware);

// Explicitly handle preflight requests
app.options('*', corsConfigMiddleware);

// Increase the size limit for JSON payloads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health route should be registered before other routes
app.use('/lm_studio', LmStudioRoute);
app.use('/api/health', HealthRoutes);
app.use('/api/apis', APIRoutes);
app.use('/api/agents', AgentRoutes);
app.use('/api/chats', ChatRoutes);
app.use('/api/collections', CollectionsRoutes);
app.use('/api/models', ModelRoutes);
app.use('/api/prompts', PromptRoutes);
app.use('/api/taskresults', TaskResultRouter);
app.use('/api/tasks', TaskRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/parameters', ParametersRoutes);
app.use('/api/files', FileRoutes);
app.use('/api/messages', MessageRoutes);
app.use('/api/entityreferences', EntityReferenceRoutes)
app.use('/api/usercheckpoints', UserCheckpointRoutes);
app.use('/api/userinteractions', UserInteractionRoutes);
app.use('/api/embeddingchunks', EmbeddingChunkRoutes);
app.use('/api/dataclusters', DataClusterRoutes);
app.use('/api/toolcalls', ToolCallRoutes);
app.use('/api/codeexecutions', CodeExecutionRoutes);
app.use('/api/apiconfigs', APIConfigRoutes);
export default app;