import { WORKFLOW_PORT, REACT_APP_DEPLOYMENT } from './Constants';
import Logger from './Logger';

interface WebSocketMessage {
  status: string;
  [key: string]: any;
}

export const setupWebSocketConnection = (
  taskId: string,
  onMessage: (message: WebSocketMessage) => void
): void => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const token = localStorage.getItem('token');

  // Construct WebSocket URL based on deployment type
  let wsUrl;
  if (REACT_APP_DEPLOYMENT === 'hosted') {
    // In hosted environment, use the nginx proxy path
    wsUrl = `${protocol}://${window.location.hostname}/workflow/ws/${taskId}?token=${token}`;
  } else {
    // In local development, use the port
    wsUrl = `${protocol}://${window.location.hostname}:${WORKFLOW_PORT}/ws/${taskId}?token=${token}`;
  }

  Logger.debug(`Attempting WebSocket connection to ${wsUrl}`);
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    Logger.debug(`WebSocket connection opened for task ${taskId}`);
  };

  socket.onmessage = (event: MessageEvent) => {
    const message: WebSocketMessage = JSON.parse(event.data);
    Logger.debug(`Received message for task ${taskId}:`, message);
    onMessage(message);
    // Close the socket if the task is completed or failed
    if (message.status === 'completed' || message.status === 'failed') {
      socket.close();
    }
  };

  socket.onerror = (event: Event) => {
    Logger.error(`WebSocket error for task ${taskId}:`, event);
  };

  socket.onclose = () => {
    Logger.debug(`WebSocket connection closed for task ${taskId}`);
  };
};