import axios from 'axios';
import { getToken } from '../utils/AuthUtils';
import Logger from '../utils/Logger';
import { BACKEND_PORT, HOST, WORKFLOW_PORT } from '../utils/Constants';

Logger.info('HOST:', HOST);

export const BACKEND_URL = `/backend`;
export const BACKEND_API_URL = `/backend/api`;
export const WORKFLOW_URL = `/workflow`;

// Create axios instance for database API
const dbAxiosInstanceLMS = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to dbAxiosInstance
dbAxiosInstanceLMS.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// Create axios instance for database API
const dbAxiosInstance = axios.create({
  baseURL: BACKEND_API_URL,
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

// Create axios instance for task API
const taskAxiosInstance = axios.create({
  baseURL: WORKFLOW_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export { dbAxiosInstance, taskAxiosInstance, dbAxiosInstanceLMS };
