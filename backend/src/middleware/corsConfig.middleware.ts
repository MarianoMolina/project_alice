import cors from 'cors';
import { CorsOptions } from 'cors';

const FRONTEND_PORT = process.env.FRONTEND_PORT || 4000;
const WORKFLOW_PORT = process.env.WORKFLOW_PORT || 8000;
const HOST = process.env.HOST || 'localhost';
const FRONTEND_HOST = process.env.FRONTEND_HOST || 'frontend';
const WORKFLOW_HOST = process.env.WORKFLOW_HOST || 'workflow';
const FRONTEND_PORT_DOCKER = process.env.FRONTEND_PORT_DOCKER || 4000;
const WORKFLOW_PORT_DOCKER = process.env.WORKFLOW_PORT_DOCKER || 8000;

// Define CORS options
const corsOptions: CorsOptions = {
  origin: [
    `http://${HOST}:${FRONTEND_PORT}`,
    `http://${HOST}:${WORKFLOW_PORT}`,
    `http://${FRONTEND_HOST}:${FRONTEND_PORT_DOCKER}`,
    `http://${WORKFLOW_HOST}:${WORKFLOW_PORT_DOCKER}`
  ],
  optionsSuccessStatus: 200,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false, // Ensure preflight requests are handled
};

export default cors(corsOptions);