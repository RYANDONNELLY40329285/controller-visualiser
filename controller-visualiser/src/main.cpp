#include <winsock2.h>   // MUST come before windows.h
#include <windows.h>
#include <iostream>
#include <cmath>
#include <chrono>
#include <sstream>
#include <ixwebsocket/IXWebSocket.h>

int main() {

    // Initialise Winsock FIRST
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cout << "WSAStartup failed\n";
        return 1;
    }




    //  WebSocket setup
    ix::WebSocket webSocket;
webSocket.setUrl("ws://localhost:8080");

    bool isConnected = false;

    webSocket.setOnMessageCallback([&](const ix::WebSocketMessagePtr& msg) {
        if (msg->type == ix::WebSocketMessageType::Open) {
            std::cout << "Connected to server!\n";
            isConnected = true;
        }
        else if (msg->type == ix::WebSocketMessageType::Error) {
            std::cout << "Connection error: " << msg->errorInfo.reason << "\n";
        }
    });

    std::cout << "Trying to connect...\n";
webSocket.start();


    
int attempts = 0;

while (!isConnected && attempts < 500) { // ~5 seconds
    Sleep(10);
    attempts++;
}

if (!isConnected) {
    std::cout << "❌ Failed to connect after timeout\n";
    return 1;
}

    POINT p, prev = {0, 0};

    double smoothDX = 0.0;
    double smoothDY = 0.0;
    double smoothSpeed = 0.0;

    double pollingRate = 0.0;
    double latencyMs = 0.0;

    const double alpha = 0.05;

    auto prevTime = std::chrono::high_resolution_clock::now();

    std::cout << " Mouse Performance Monitor + WebSocket Started...\n";

    int counter = 0;


while (true) {

    GetCursorPos(&p);

    auto currentTime = std::chrono::high_resolution_clock::now();
    double deltaTime = std::chrono::duration<double>(currentTime - prevTime).count();
    prevTime = currentTime;

    if (deltaTime <= 0 || deltaTime > 0.1) continue; 

    double currentHz = 1.0 / deltaTime;
    pollingRate = alpha * currentHz + (1 - alpha) * pollingRate;
    latencyMs = alpha * (deltaTime * 1000.0) + (1 - alpha) * latencyMs;

    int dx = p.x - prev.x;
    int dy = p.y - prev.y;

    smoothDX = alpha * dx + (1 - alpha) * smoothDX;
    smoothDY = alpha * dy + (1 - alpha) * smoothDY;

    double speed = std::sqrt(smoothDX * smoothDX + smoothDY * smoothDY) / deltaTime;
    smoothSpeed = alpha * speed + (1 - alpha) * smoothSpeed;

    prev = p;

   
    std::string movementState;
    if (smoothSpeed < 50) movementState = "idle";
    else if (smoothSpeed < 300) movementState = "tracking";
    else movementState = "flick";

    
    std::stringstream ss;
    ss << "{"
       << "\"x\":" << p.x << ","
       << "\"y\":" << p.y << ","
       << "\"speed\":" << smoothSpeed << ","
       << "\"hz\":" << pollingRate << ","
       << "\"latency\":" << latencyMs << ","
       << "\"state\":\"" << movementState << "\""
       << "}";

    if (isConnected) {
        webSocket.send(ss.str());
    }

 
    static int printCounter = 0;
    if (printCounter++ % 100 == 0) {
        system("cls");
        std::cout << "Position: " << p.x << ", " << p.y << "\n";
        std::cout << "Speed: " << (int)smoothSpeed << " px/s\n";
        std::cout << "Hz: " << (int)pollingRate << "\n";
        std::cout << "Latency: " << latencyMs << " ms\n";
        std::cout << "State: " << movementState << "\n";
    }

    Sleep(5);
}


    webSocket.stop();
    WSACleanup();
    return 0;
}