const WebSocket = require('ws');
const { spawn } = require('child_process');

let cppProcess;


beforeAll((done) => {

    cppProcess = spawn('../controller-visualiser/mouse.exe');

    setTimeout(done, 1000); // give it time to connect
});

afterAll(() => {
    if (cppProcess) cppProcess.kill();
});

test('C++ sends real-time data over WebSocket', (done) => {
    const client = new WebSocket('ws://localhost:8080');

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
    const client = new WebSocket('ws://localhost:8080');

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
    const client = new WebSocket('ws://localhost:8080');

    client.on('message', (message) => {
        expect(() => JSON.parse(message.toString())).not.toThrow();
        client.close();
        done();
    });
});

test('C++ sends valid JSON (no corruption)', (done) => {
    const client = new WebSocket('ws://localhost:8080');

    client.on('message', (message) => {
        expect(() => JSON.parse(message.toString())).not.toThrow();
        client.close();
        done();
    });
});

test('C++ state is always valid', (done) => {
    const client = new WebSocket('ws://localhost:8080');

    const validStates = ['idle', 'tracking', 'flick'];

    client.on('message', (message) => {
        const data = JSON.parse(message.toString());

        expect(validStates).toContain(data.state);

        client.close();
        done();
    });
});

test('C++ handles rapid message streaming', (done) => {
    const client = new WebSocket('ws://localhost:8080');

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

    const client = new WebSocket('ws://localhost:8080');

    client.on('open', () => {
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(5000); 

        client.close();
        done();
    });
});

test('fails gracefully when server is offline', (done) => {
    const client = new WebSocket('ws://localhost:9999'); 

    client.on('error', (err) => {
        expect(err).toBeDefined();
        done();
    });
});

test('latency remains stable over time', (done) => {
    const client = new WebSocket('ws://localhost:8080');

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

