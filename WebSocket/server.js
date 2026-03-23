const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log("WebSocket server running on ws://localhost:8080");

wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`Client connected: ${clientIp}`);

    ws.on('message', (message) => {

        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${clientIp}`);
    });

    ws.on('error', (err) => {
        console.log(`Client error: ${err.message}`);
    });
});