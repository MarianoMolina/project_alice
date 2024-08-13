const net = require('net');

function testConnection(host, port) {
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

async function runTests() {
    try {
        await testConnection('host.docker.internal', 1234);
        console.log('LM Studio server is reachable');
    } catch (error) {
        console.error('LM Studio server is not reachable:', error.message);
    }
}

runTests();