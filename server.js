const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameManager = require('./src/gameManager');
const ChessEngine = require('./src/chessEngine');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS for Render deployment
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3000;

// Initialize GameManager
const gameManager = new GameManager();

// CORS middleware for Express routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public directory

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes for game management
// Create new game
app.post('/api/game/create', (req, res) => {
  try {
    const gameId = gameManager.createGame();
    const game = gameManager.getGame(gameId);
    
    res.status(201).json({
      success: true,
      gameId,
      gameState: game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create game'
    });
  }
});

// Get game by ID
app.get('/api/game/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const game = gameManager.getGame(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    res.status(200).json({
      success: true,
      gameState: game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve game'
    });
  }
});

// Player-to-game mapping for tracking which game each player is in
const playerGameMap = new Map(); // socketId -> gameId

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle createGame event
  socket.on('createGame', () => {
    try {
      const gameId = gameManager.createGame();
      const result = gameManager.joinGame(gameId, socket.id);
      
      if (result.success) {
        // Join socket room for this game
        socket.join(gameId);
        playerGameMap.set(socket.id, gameId);
        
        // Emit gameCreated event with game details
        socket.emit('gameCreated', {
          gameId,
          color: result.color,
          gameState: result.gameState
        });
        
        console.log(`Game ${gameId} created by ${socket.id} as ${result.color}`);
      } else {
        socket.emit('error', { message: result.error || 'Failed to create game' });
      }
    } catch (error) {
      console.error('Error creating game:', error);
      socket.emit('error', { message: error.message || 'Failed to create game' });
    }
  });
  
  // Handle joinGame event
  socket.on('joinGame', (data) => {
    try {
      const { gameId } = data;
      
      if (!gameId) {
        socket.emit('error', { message: 'Game ID is required' });
        return;
      }
      
      const result = gameManager.joinGame(gameId, socket.id);
      
      if (result.success) {
        // Join socket room for this game
        socket.join(gameId);
        playerGameMap.set(socket.id, gameId);
        
        // Emit gameJoined event to the joining player
        socket.emit('gameJoined', {
          gameId,
          color: result.color,
          gameState: result.gameState
        });
        
        // Notify the other player that opponent has joined
        socket.to(gameId).emit('opponentJoined', {
          gameState: result.gameState
        });
        
        console.log(`Player ${socket.id} joined game ${gameId} as ${result.color}`);
      } else {
        socket.emit('error', { message: result.error || 'Failed to join game' });
      }
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: error.message || 'Failed to join game' });
    }
  });
  
  // Handle makeMove event
  socket.on('makeMove', (data) => {
    try {
      const { from, to } = data;
      
      if (!from || !to || typeof from.row !== 'number' || typeof from.col !== 'number' ||
          typeof to.row !== 'number' || typeof to.col !== 'number') {
        socket.emit('invalidMove', { error: 'Invalid move format' });
        return;
      }
      
      const gameId = playerGameMap.get(socket.id);
      
      if (!gameId) {
        socket.emit('invalidMove', { error: 'Not in a game' });
        return;
      }
      
      const game = gameManager.getGame(gameId);
      
      if (!game) {
        socket.emit('invalidMove', { error: 'Game not found' });
        return;
      }
      
      // Check if game is active
      if (game.status !== 'active') {
        socket.emit('invalidMove', { error: 'Game is not active' });
        return;
      }
      
      // Verify it's the player's turn
      const playerColor = game.players.white === socket.id ? 'white' : 'black';
      if (game.currentTurn !== playerColor) {
        socket.emit('invalidMove', { error: 'Not your turn' });
        return;
      }
      
      // Validate and execute the move using chess engine
      const moveResult = ChessEngine.makeMove(game.board, from, to, game);
      
      if (!moveResult.valid) {
        socket.emit('invalidMove', { error: moveResult.error || 'Invalid move' });
        return;
      }
      
      // Update game state with new board
      game.board = moveResult.board;
      game.lastMove = { from, to, piece: moveResult.piece };
      game.moveHistory.push({
        from,
        to,
        piece: moveResult.piece,
        capturedPiece: moveResult.capturedPiece,
        timestamp: Date.now()
      });
      
      // Switch turns
      game.currentTurn = game.currentTurn === 'white' ? 'black' : 'white';
      
      // Check for game end conditions
      const opponentColor = game.currentTurn;
      const isCheckmate = ChessEngine.isCheckmate(game.board, opponentColor, game);
      const isStalemate = ChessEngine.isStalemate(game.board, opponentColor, game);
      
      if (isCheckmate) {
        game.status = 'checkmate';
        game.winner = playerColor;
        
        // Emit gameOver event to both players
        io.to(gameId).emit('gameOver', {
          result: 'checkmate',
          winner: playerColor,
          gameState: game
        });
        
        console.log(`Game ${gameId} ended: ${playerColor} wins by checkmate`);
      } else if (isStalemate) {
        game.status = 'stalemate';
        game.winner = null;
        
        // Emit gameOver event to both players
        io.to(gameId).emit('gameOver', {
          result: 'stalemate',
          winner: null,
          gameState: game
        });
        
        console.log(`Game ${gameId} ended: stalemate`);
      } else {
        // Game continues - broadcast move to both players
        io.to(gameId).emit('moveMade', {
          from,
          to,
          piece: moveResult.piece,
          capturedPiece: moveResult.capturedPiece,
          currentTurn: game.currentTurn,
          gameState: game
        });
      }
    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('invalidMove', { error: error.message || 'Failed to process move' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const gameId = playerGameMap.get(socket.id);
    
    if (gameId) {
      const game = gameManager.getGame(gameId);
      
      if (game && game.status === 'active') {
        // Notify opponent of disconnection
        socket.to(gameId).emit('opponentDisconnected', {
          message: 'Your opponent has disconnected'
        });
        
        console.log(`Player ${socket.id} disconnected from game ${gameId}`);
      }
      
      // Keep the game in memory for potential reconnection
      // In a production system, you might want to implement a timeout
      // to clean up abandoned games after a certain period
    }
  });
  
  // Handle reconnection
  socket.on('reconnect', (data) => {
    try {
      const { gameId } = data;
      
      if (!gameId) {
        socket.emit('error', { message: 'Game ID is required for reconnection' });
        return;
      }
      
      const game = gameManager.getGame(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      // Determine player color
      let playerColor = null;
      if (game.players.white === socket.id) {
        playerColor = 'white';
      } else if (game.players.black === socket.id) {
        playerColor = 'black';
      } else {
        // Player was not in this game originally, try to rejoin
        const result = gameManager.joinGame(gameId, socket.id);
        if (result.success) {
          playerColor = result.color;
        } else {
          socket.emit('error', { message: result.error || 'Cannot reconnect to this game' });
          return;
        }
      }
      
      // Rejoin socket room
      socket.join(gameId);
      playerGameMap.set(socket.id, gameId);
      
      // Send restored game state
      socket.emit('gameJoined', {
        gameId,
        color: playerColor,
        gameState: game,
        reconnected: true
      });
      
      // Notify opponent of reconnection
      socket.to(gameId).emit('opponentReconnected', {
        message: 'Your opponent has reconnected'
      });
      
      console.log(`Player ${socket.id} reconnected to game ${gameId} as ${playerColor}`);
    } catch (error) {
      console.error('Error reconnecting:', error);
      socket.emit('error', { message: error.message || 'Failed to reconnect' });
    }
  });
});

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler for undefined routes (must be last)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ChessDict server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server is ready to accept connections`);
});
