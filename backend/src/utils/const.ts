import dotenv from 'dotenv';
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongo/alice_database"
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "encryption_key"
export const PORT = process.env.REACT_APP_BACKEND_PORT || 3000
export const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'host.docker.internal:1234';
export const JWT_SECRET = process.env.JWT_SECRET

export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
export const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

export const FRONTEND_PORT = process.env.FRONTEND_PORT || 4000;
export const WORKFLOW_PORT = process.env.REACT_APP_WORKFLOW_PORT || 8000;
export const HOST = process.env.REACT_APP_HOST || 'localhost';
export const FRONTEND_HOST = process.env.FRONTEND_HOST || 'frontend';
export const WORKFLOW_HOST = process.env.REACT_APP_WORKFLOW_HOST || 'workflow';
export const FRONTEND_PORT_DOCKER = process.env.FRONTEND_PORT_DOCKER || 4000;
export const WORKFLOW_PORT_DOCKER = process.env.WORKFLOW_PORT_DOCKER || 8000;

export const UPLOAD_DIR = process.env.SHARED_UPLOAD_DIR || '/app/shared-uploads';

export const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL?.toUpperCase() || 'INFO';
