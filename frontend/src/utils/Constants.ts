export const SIDEBAR_COLLAPSED_WIDTH = 40;
export const SIDEBAR_WIDTH = 300;
export const TASK_SIDEBAR_WIDTH = 450;
export const TASK_SIDEBAR_WIDTH_TABLE = 750;
export const TASK_SIDEBAR_WIDTH_COMPACT = 350;

export const HOST = process.env.REACT_APP_HOST || window.location.hostname;
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
export const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '3000';
export const WORKFLOW_PORT = process.env.REACT_APP_WORKFLOW_PORT || '8000';
export const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'backend';
export const WORKFLOW_HOST = process.env.REACT_APP_WORKFLOW_HOST || 'workflow';
export const CHAR_TO_TOKEN = parseFloat(process.env.REACT_APP_CHAR_TO_TOKEN!) || 3.2
export const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL?.toUpperCase() || 'INFO'
export const NODE_ENV = process.env.NODE_ENV || 'production'
export const REACT_APP_DEPLOYMENT = process.env.REACT_APP_DEPLOYMENT || 'local'
const getBaseUrl = (port: string, host: string, isWebSocket: boolean = false) => {
  if (REACT_APP_DEPLOYMENT === 'hosted') {
    // For hosted environment
    if (isWebSocket) {
      // Use wss:// for secure WebSocket connections through nginx
      return `wss://${window.location.hostname}/workflow`;
    }
    return `/${host}`;
  }
  // For local development
  if (isWebSocket) {
    return `ws://${HOST}:${port}`;
  }
  return `http://${HOST}:${port}`;
};

export const BACKEND_URL = getBaseUrl(BACKEND_PORT, BACKEND_HOST);
export const BACKEND_API_URL = `${BACKEND_URL}/api`;
export const WORKFLOW_URL = getBaseUrl(WORKFLOW_PORT, WORKFLOW_HOST);
export const WORKFLOW_WS_URL = getBaseUrl(WORKFLOW_PORT, WORKFLOW_HOST, true);