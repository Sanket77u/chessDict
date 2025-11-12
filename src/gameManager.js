const { initializeBoard, COLORS } = require('./chessEngine');
const crypto = require('crypto');

/**
 * GameManager - Manages game sessions, player assignments, and game state
 */
class GameManager {
  constructor() {
    // Store active games in memory using Map
    this.games = new Map();
  }

  /**
   * Creates a new game session with unique ID
   * @returns {string} gameId - Unique identifier for the game
   */
  createGame() {
    // Generate unique game ID
    const gameId = crypto.randomBytes(4).toString('hex');
    
    // Initialize game state
    const gameState = {
      gameId,
      board: initializeBoard(),
      currentTurn: COLORS.WHITE,
      players: {
        white: null,
        black: null
      },
      status: 'waiting', // waiting, active, checkmate, stalemate, draw
      winner: null,
      moveHistory: [],
      lastMove: null,
      createdAt: Date.now()
    };
    
    // Store game in memory
    this.games.set(gameId, gameState);
    
    return gameId;
  }

  /**
   * Joins a player to an existing game
   * @param {string} gameId - Game identifier
   * @param {string} playerId - Player's socket ID
   * @returns {Object} Result with success status, assigned color, and game state
   */
  joinGame(gameId, playerId) {
    const game = this.games.get(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    
    // Check if game is already full
    if (game.players.white && game.players.black) {
      return { success: false, error: 'Game is full' };
    }
    
    // Check if player is already in the game
    if (game.players.white === playerId) {
      return { success: true, color: COLORS.WHITE, gameState: game };
    }
    if (game.players.black === playerId) {
      return { success: true, color: COLORS.BLACK, gameState: game };
    }
    
    // Assign player to available color
    let assignedColor;
    if (!game.players.white) {
      game.players.white = playerId;
      assignedColor = COLORS.WHITE;
    } else {
      game.players.black = playerId;
      assignedColor = COLORS.BLACK;
      // Game becomes active when second player joins
      game.status = 'active';
    }
    
    return { success: true, color: assignedColor, gameState: game };
  }

  /**
   * Retrieves a game by ID
   * @param {string} gameId - Game identifier
   * @returns {Object|null} Game state or null if not found
   */
  getGame(gameId) {
    return this.games.get(gameId) || null;
  }

  /**
   * Updates a game's state
   * @param {string} gameId - Game identifier
   * @param {Object} updates - Partial game state to update
   * @returns {boolean} Success status
   */
  updateGame(gameId, updates) {
    const game = this.games.get(gameId);
    
    if (!game) {
      return false;
    }
    
    // Merge updates into game state
    Object.assign(game, updates);
    
    return true;
  }

  /**
   * Removes a game from active sessions
   * @param {string} gameId - Game identifier
   * @returns {boolean} Success status
   */
  endGame(gameId) {
    return this.games.delete(gameId);
  }

  /**
   * Gets all active games (for debugging/monitoring)
   * @returns {Array} Array of game IDs
   */
  getActiveGames() {
    return Array.from(this.games.keys());
  }

  /**
   * Gets the number of active games
   * @returns {number} Count of active games
   */
  getGameCount() {
    return this.games.size;
  }
}

module.exports = GameManager;
