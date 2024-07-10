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
import TaskResultRouter from './routes/taskresult.route';
import ChatRoutes from './routes/chat.route';
import ParametersRoutes from './routes/parameter.route';
import HealthRoutes from './routes/health.route';

import corsConfigMiddleware from './middleware/corsConfig.middleware';
import loggingMiddleware from './middleware/logging.middleware'; 

dotenv.config();

const app = express();

console.log('MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI || "mongodb://mongo/alice_database")
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
    });
    
// // Apply the logging middleware
// app.use(loggingMiddleware);

// Apply the CORS middlewares
app.use(corsConfigMiddleware);

// Explicitly handle preflight requests
app.options('*', corsConfigMiddleware);

app.use(bodyParser.json());

app.use('/api/agents', AgentRoutes);
app.use('/api/chats', ChatRoutes);
app.use('/api/collections', CollectionsRoutes);
app.use('/api/models', ModelRoutes);
app.use('/api/prompts', PromptRoutes);
app.use('/api/taskresults', TaskResultRouter);
app.use('/api/tasks', TaskRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/parameters', ParametersRoutes);
app.use('/api/health', HealthRoutes);

export default app;