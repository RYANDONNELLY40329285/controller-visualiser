const WebSocket = require('ws');
const { spawn } = require('child_process');

let cppProcess;
let server;
const PORT = 8080;

// START SERVER BEFORE TESTS
beforeAll((done) => {
    server = new WebSocket.Server({ port: PORT }, () => {
        console.log("Test WebSocket server running");

        cppProcess = spawn('../controller-visualiser/mouse.exe');

        setTimeout(done, 1500); // give everything time to boot
    });

    server.on('connection', (ws) => {
        ws.on('message', (message) => {
            server.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message.toString());
                }
            });
        });
    });
});

// CLEANUP
afterAll(() => {
    if (cppProcess) cppProcess.kill();
    if (server) server.close();
});

// HELPER
function createClient() {
    return new WebSocket(`ws://127.0.0.1:${PORT}`);
}

// ---------------- TESTS ----------------

test('C++ sends real-time data over WebSocket', (done) => {
    const client = createClient();

    client.on('message', (message) => {
        const data = JSON.parse(message.toString());

        expect(data).toHaveProperty('x');
        expect(data).toHaveProperty('y');
        expect(data).toHaveProperty('speed');
        expect(data).toHaveProperty('hz');
        expect(data).toHaveProperty('latency');
        expect(data).toHaveProperty('state');

        client.close();
        done();
    });
});

test('C++ sends continuous updates', (done) => {
    const client = createClient();
    let count = 0;

    client.on('message', () => {
        count++;
        if (count >= 5) {
            client.close();
            done();
        }
    });
});

test('C++ sends valid JSON (no corruption)', (done) => {
    const client = createClient();

    client.on('message', (message) => {
        expect(() => JSON.parse(message.toString())).not.toThrow();
        client.close();
        done();
    });
});

test('C++ state is always valid', (done) => {
    const client = createClient();
    const validStates = ['idle', 'tracking', 'flick'];

    client.on('message', (message) => {
        const data = JSON.parse(message.toString());

        expect(validStates).toContain(data.state);

        client.close();
        done();
    });
});

test('C++ handles rapid message streaming', (done) => {
    const client = createClient();
    let count = 0;

    client.on('message', () => {
        count++;
        if (count >= 20) {
            client.close();
            done();
        }
    });
});

test('C++ connects successfully within time limit', (done) => {
    const start = Date.now();
    const client = createClient();

    client.on('open', () => {
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(5000);

        client.close();
        done();
    });
});

test('fails gracefully when server is offline', (done) => {
    const client = new WebSocket('ws://127.0.0.1:9999');

    client.on('error', (err) => {
        expect(err).toBeDefined();
        done();
    });
});

test('latency remains stable over time', (done) => {
    const client = createClient();
    let samples = [];

    client.on('message', (message) => {
        const data = JSON.parse(message.toString());

        samples.push(data.latency);

        if (samples.length >= 10) {
            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;

            const variance = samples.reduce((sum, val) => {
                return sum + Math.pow(val - avg, 2);
            }, 0) / samples.length;

            const stdDev = Math.sqrt(variance);

            expect(stdDev).toBeLessThan(10);

            client.close();
            done();
        }
    });
});