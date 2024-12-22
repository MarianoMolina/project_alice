import cors from 'cors';
import { CorsOptions } from 'cors';
import { FRONTEND_HOST, FRONTEND_PORT, FRONTEND_PORT_DOCKER, HOST, WORKFLOW_HOST, WORKFLOW_PORT, WORKFLOW_PORT_DOCKER } from '../utils/const';

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