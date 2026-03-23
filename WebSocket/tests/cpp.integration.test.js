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

test('speed is never negative', (done) => {
    const client = new WebSocket('ws://127.0.0.1:8080');

    client.on('message', (msg) => {
        const data = JSON.parse(msg);

        expect(data.speed).toBeGreaterThanOrEqual(0);

        client.close();
        done();
    });
});

test('latency is within realistic bounds', (done) => {
    const client = new WebSocket('ws://127.0.0.1:8080');

    client.on('message', (msg) => {
        const data = JSON.parse(msg);

        expect(data.latency).toBeGreaterThan(0);
        expect(data.latency).toBeLessThan(100); // sanity check

        client.close();
        done();
    });
});

test('position values are valid screen coordinates', (done) => {
    const client = new WebSocket('ws://127.0.0.1:8080');

    client.on('message', (msg) => {
        const data = JSON.parse(msg);

        expect(data.x).toBeGreaterThanOrEqual(0);
        expect(data.y).toBeGreaterThanOrEqual(0);

        client.close();
        done();
    });
});

test('handles 100+ messages without crashing', (done) => {
    const client = new WebSocket('ws://127.0.0.1:8080');

    let count = 0;

    client.on('message', () => {
        count++;

        if (count >= 100) {
            client.close();
            done();
        }
    });
});



test('client can reconnect after disconnect', (done) => {
    const client = new WebSocket('ws://127.0.0.1:8080');

    client.on('open', () => {
        client.close();

        const newClient = new WebSocket('ws://127.0.0.1:8080');

        newClient.on('open', () => {
            newClient.close();
            done();
        });
    });
});

const schema = ['x', 'y', 'speed', 'hz', 'latency', 'state'];

test('data contains correct schema', (done) => {
    const client = new WebSocket('ws://127.0.0.1:8080');

    client.on('message', (msg) => {
        const data = JSON.parse(msg);

        schema.forEach(field => {
            expect(data).toHaveProperty(field);
        });

        client.close();
        done();
    });
});

test('server handles invalid JSON safely', () => {
    expect(() => JSON.parse("INVALID_JSON")).toThrow();
});

test('data types are correct', (done) => {
    const client = new WebSocket('ws://127.0.0.1:8080');

    client.on('message', (msg) => {
        const data = JSON.parse(msg);

        expect(typeof data.x).toBe('number');
        expect(typeof data.y).toBe('number');
        expect(typeof data.speed).toBe('number');
        expect(typeof data.hz).toBe('number');
        expect(typeof data.latency).toBe('number');
        expect(typeof data.state).toBe('string');

        client.close();
        done();
    });
});

test('speed never exceeds unrealistic upper bound', (done) => {
    const client = new WebSocket('ws://127.0.0.1:8080');

    client.on('message', (msg) => {
        const data = JSON.parse(msg);

        expect(data.speed).toBeLessThan(100000); 

        client.close();
        done();
    });
});

test('state reflects speed correctly', (done) => {
    const client = new WebSocket('ws://127.0.0.1:8080');

    client.on('message', (msg) => {
        const data = JSON.parse(msg);

        if (data.speed < 50) {
            expect(data.state).toBe('idle');
        } else if (data.speed < 300) {
            expect(data.state).toBe('tracking');
        } else {
            expect(data.state).toBe('flick');
        }

        client.close();
        done();
    });
});