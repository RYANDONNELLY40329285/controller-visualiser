cmake_minimum_required(VERSION 3.10)
project(ControllerVisualiser)

set(CMAKE_CXX_STANDARD 17)

add_executable(controller_visualiser src/main.cpp)

target_link_libraries(controller_visualiser Xinput)