import * as net from 'net';
import WebSocket from 'ws';

export function testConnection(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);  // 5 second timeout

        socket.on('connect', () => {
            console.log(`Successfully connected to ${host}:${port}`);
            socket.destroy();
            resolve();
        });

        socket.on('timeout', () => {
            console.error(`Connection to ${host}:${port} timed out`);
            socket.destroy();
            reject(new Error('Connection timed out'));
        });

        socket.on('error', (error) => {
            console.error(`Failed to connect to ${host}:${port}:`, error.message);
            reject(error);
        });

        socket.connect(port, host);
    });
}

export async function runNetworkTests(): Promise<void> {
    try {
        await testConnection('host.docker.internal', 1234);
        console.log('LM Studio server is reachable');
    } catch (error) {
        console.error('LM Studio server is not reachable:', error);
    }
}

export function testWebSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);

        ws.on('open', () => {
            console.log('WebSocket connection opened');
            
            // Send a test message
            ws.send(JSON.stringify({ type: 'echo', data: 'Hello, LM Studio!' }));
        });

        ws.on('message', (data: WebSocket.Data) => {
            console.log('Received:', data.toString());
            ws.close();
            resolve();
        });

        ws.on('error', (error: Error) => {
            console.error('WebSocket error:', error);
            reject(error);
        });

        ws.on('close', (code: number, reason: string) => {
            console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            ws.close();
            reject(new Error('WebSocket test timed out'));
        }, 10000);
    });
}