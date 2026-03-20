C++ (mouse.exe)
↓
WebSocket Server (Node.js)
↓
Browser Game (HTML/JS)


---

## 📂 Project Structure


controller-visualiser/
│
├── controller-visualiser/
│ ├── mouse.exe
│ └── src/
│ └── main.cpp
│
├── WebSocket/
│ ├── server.js
│ ├── package.json
│
├── aimTrainer/
│ └── src/
│ └── index.html
│
├── scripts/
│ └── start.rb


---

## ▶️ How to Run

### 1️⃣ Start WebSocket server

```bash
cd WebSocket
node server.js
2️⃣ Run C++ tracker
cd controller-visualiser
mouse.exe
3️⃣ Open the game

Open in browser:

aimTrainer/src/index.html
🔥 OR (Automated)
cd scripts
ruby start.rb
🎮 Gameplay

Click targets as fast as possible

Track accuracy and reaction time

Use real mouse performance data

Improve aim consistency

📊 Example Data Stream
{
  "x": 1200,
  "y": 800,
  "speed": 350.2,
  "hz": 64,
  "latency": 15.4
}