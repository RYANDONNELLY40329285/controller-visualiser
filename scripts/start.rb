# scripts/start.rb

puts "Starting Aim Trainer..."

# 1️Start Node server
puts "Starting WebSocket server..."
node_pid = spawn("cmd /c node server.js", chdir: "../WebSocket")

sleep 2

# 2 Start C++ tracker
puts "Starting mouse tracker..."
mouse_pid = spawn("cmd /c mouse.exe", chdir: "../controller-visualiser")

sleep 1

# 3Open browser
puts "Opening game..."
system("start ../aimTrainer/src/index.html")

puts "Everything running!"

# Keep alive
Process.waitall