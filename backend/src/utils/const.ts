import dotenv from 'dotenv';
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongo/alice_database"
export const PORT = process.env.BACKEND_PORT || 3000
export const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'host.docker.internal:1234';
export const JWT_SECRET = process.env.JWT_SECRET

export const FRONTEND_PORT = process.env.FRONTEND_PORT || 4000;
export const WORKFLOW_PORT = process.env.WORKFLOW_PORT || 8000;
export const HOST = process.env.HOST || 'localhost';
export const FRONTEND_HOST = process.env.FRONTEND_HOST || 'frontend';
export const WORKFLOW_HOST = process.env.WORKFLOW_HOST || 'workflow';
export const FRONTEND_PORT_DOCKER = process.env.FRONTEND_PORT_DOCKER || 4000;
export const WORKFLOW_PORT_DOCKER = process.env.WORKFLOW_PORT_DOCKER || 8000;

export const UPLOAD_DIR = process.env.SHARED_UPLOAD_DIR || '/app/shared-uploads';

export const LOG_LEVEL = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
