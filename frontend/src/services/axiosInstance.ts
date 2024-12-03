import axios from 'axios';
import { getToken } from '../utils/AuthUtils';
import Logger from '../utils/Logger';

// const BACKEND_HOST = process.env.BACKEND_HOST || 'backend';
// const WORKFLOW_HOST = process.env.WORKFLOW_HOST || 'workflow';

// const BACKEND_PORT_DOCKER = process.env.BACKEND_PORT_DOCKER || 3000;
// const WORKFLOW_PORT_DOCKER = process.env.WORKFLOW_PORT_DOCKER || 8000;

export const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
export const WORKFLOW_PORT = process.env.WORKFLOW_PORT || 8000;

// const DB_API_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT_DOCKER}/api`;
// const WORKFLOW_API_BASE_URL = `http://${WORKFLOW_HOST}:${WORKFLOW_PORT_DOCKER}`;

export const BACKEND_URL = `http://localhost:${BACKEND_PORT}/api`;
export const WORKFLOW_URL = `http://localhost:${WORKFLOW_PORT}`;

// Create axios instance for database API
const dbAxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for task API
const taskAxiosInstance = axios.create({
  baseURL: WORKFLOW_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to dbAxiosInstance
dbAxiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a request interceptor to taskAxiosInstance
taskAxiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      Logger.error('No token found');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export { dbAxiosInstance, taskAxiosInstance };
