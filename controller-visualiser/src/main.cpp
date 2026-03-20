#include <windows.h>
#include <Xinput.h>
#include <iostream>

#pragma comment(lib, "Xinput.lib")

int main() {
    XINPUT_STATE state;

    std::cout << "Controller Visualiser Started...\n";

    while (true) {
        ZeroMemory(&state, sizeof(XINPUT_STATE));

        DWORD result = XInputGetState(0, &state);

        if (result == ERROR_SUCCESS) {
            system("cls"); 

            auto& gamepad = state.Gamepad;

            std::cout << "Controller Connected\n\n";

            std::cout << "Buttons:\n";
            if (gamepad.wButtons & XINPUT_GAMEPAD_A) std::cout << "A pressed\n";
            if (gamepad.wButtons & XINPUT_GAMEPAD_B) std::cout << "B pressed\n";
            if (gamepad.wButtons & XINPUT_GAMEPAD_X) std::cout << "X pressed\n";
            if (gamepad.wButtons & XINPUT_GAMEPAD_Y) std::cout << "Y pressed\n";

            if (gamepad.wButtons & XINPUT_GAMEPAD_LEFT_SHOULDER) std::cout << "LB pressed\n";
            if (gamepad.wButtons & XINPUT_GAMEPAD_RIGHT_SHOULDER) std::cout << "RB pressed\n";

            std::cout << "\nTriggers:\n";
            std::cout << "LT: " << (int)gamepad.bLeftTrigger << "\n";
            std::cout << "RT: " << (int)gamepad.bRightTrigger << "\n";

            std::cout << "\nThumbsticks:\n";
            std::cout << "LX: " << gamepad.sThumbLX << "\n";
            std::cout << "LY: " << gamepad.sThumbLY << "\n";
            std::cout << "RX: " << gamepad.sThumbRX << "\n";
            std::cout << "RY: " << gamepad.sThumbRY << "\n";
        }
        else {
            std::cout << "Controller not connected\n";
        }

        Sleep(100); 
    }

    return 0;
}