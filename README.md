# ChessDict - Multiplayer Chess Platform

A real-time multiplayer chess game built with Node.js, Express, and Socket.io.

## 🎮 Live Demo

**Play Now:** [https://chessdict.onrender.com](https://chessdict.onrender.com)

## ✨ Features

- ♟️ Real-time multiplayer chess gameplay
- 🎯 Legal move validation and highlighting
- 🔄 Automatic board rotation for black players
- 🔌 WebSocket-based real-time communication
- 📱 Responsive design for all devices
- 🎨 Beautiful UI with smooth animations
- ♔ Full chess rules implementation (including castling, en passant)
- 🏆 Checkmate and stalemate detection
- 🔗 Game sharing via unique Game IDs
- 🔄 Automatic reconnection handling

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd chessdict
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 🎯 How to Play

1. **Create a Game**: Click "Create New Game" to start a new game
2. **Share Game ID**: Share the generated Game ID with your opponent
3. **Join Game**: Your opponent enters the Game ID and clicks "Join Game"
4. **Play**: Click on a piece to see legal moves, then click on a highlighted square to move

## 🏗️ Project Structure

```
chessdict/
├── public/              # Client-side files
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styling
│   ├── client.js       # Game client logic
│   ├── board.js        # Board rendering
│   └── ui.js           # UI controller
├── src/                # Server-side logic
│   ├── gameManager.js  # Game session management
│   └── chessEngine.js  # Chess rules and validation
├── server.js           # Express + Socket.io server
├── package.json        # Dependencies
└── render.yaml         # Render deployment config
```

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.io
- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **Styling**: CSS3 with Flexbox/Grid
- **Deployment**: Render.com

## 📦 Deployment

### Deploy to Render

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render will automatically detect the configuration from `render.yaml`
6. Click "Create Web Service"

### Environment Variables

No environment variables required for basic deployment.

## 🎮 Game Rules

- Standard chess rules apply
- White moves first
- Click a piece to see legal moves (highlighted squares)
- Board automatically rotates for black player
- Game ends on checkmate or stalemate

## 🐛 Known Issues

- None currently! 🎉

## 📝 License

MIT License

## 👨‍💻 Author

Built with ❤️ for chess enthusiasts

---

**Enjoy playing ChessDict!** ♟️
