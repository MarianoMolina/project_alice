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
import URLReferenceRoutes from './routes/urlReference.route';
import UserCheckpointRoutes from './routes/userCheckpoint.route';
import UserInteractionRoutes from './routes/userInteraction.route';
import EmbeddingChunkRoutes from './routes/embeddingChunk.route';
import './models';

dotenv.config();

const app = express();

Logger.info('MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI || "mongodb://mongo/alice_database")
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
app.use('/lm-studio', LmStudioRoute);
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
app.use('/api/urlreferences', URLReferenceRoutes)
app.use('/api/usercheckpoints', UserCheckpointRoutes);
app.use('/api/userinteractions', UserInteractionRoutes);
app.use('/api/embeddingchunks', EmbeddingChunkRoutes);

export default app;