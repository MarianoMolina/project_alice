export const SIDEBAR_COLLAPSED_WIDTH = 40;
export const SIDEBAR_WIDTH = 300;
export const TASK_SIDEBAR_WIDTH = 450;
export const TASK_SIDEBAR_WIDTH_TABLE = 750;
export const TASK_SIDEBAR_WIDTH_COMPACT = 350;

export const HOST = process.env.REACT_APP_HOST || 'localhost';
export const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || 3000;
export const WORKFLOW_PORT = process.env.REACT_APP_WORKFLOW_PORT || 8000;
export const CHAR_TO_TOKEN = parseFloat(process.env.REACT_APP_CHAR_TO_TOKEN!) || 3.2
export const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL?.toUpperCase() || 'INFO'
export const NODE_ENV = process.env.REACT_APP_NODE_ENV || 'production'