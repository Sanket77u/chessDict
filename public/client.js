import BoardRenderer from './board.js';
import UIController from './ui.js';

/**
 * Game Client - Handles user interactions and game logic on the client side
 */
class GameClient {
    constructor() {
        this.boardRenderer = null;
        this.uiController = null;
        this.gameState = null;
        this.playerColor = null;
        this.socket = null;
        this.gameId = null;
        this.selectedPiece = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000; // Start with 1 second
        
        this.initializeUI();
        this.initializeSocket();
    }

    /**
     * Initialize Socket.io connection with automatic reconnection
     */
    initializeSocket() {
        // Initialize Socket.io client with reconnection settings
        // When deployed, it will automatically connect to the same domain
        this.socket = io({
            reconnection: true,
            reconnectionDelay: this.reconnectDelay,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: this.maxReconnectAttempts,
            transports: ['websocket', 'polling']
        });

        // Connection event handlers
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.uiController.updateConnectionStatus('connected');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000; // Reset delay
            
            // If we have a gameId, attempt to reconnect to the game
            if (this.gameId) {
                this.socket.emit('reconnect', { gameId: this.gameId });
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.uiController.updateConnectionStatus('disconnected');
            
            // If disconnect was not initiated by client, attempt reconnection
            if (reason === 'io server disconnect') {
                // Server disconnected the client, manually reconnect
                this.socket.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.uiController.updateConnectionStatus('error');
            this.handleReconnection();
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Reconnection attempt ${attemptNumber}`);
            this.uiController.updateConnectionStatus('reconnecting');
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Reconnection failed');
            this.uiController.updateConnectionStatus('failed');
            this.uiController.showMessage('Unable to connect to server. Please refresh the page.', 'error', 0);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`Reconnected after ${attemptNumber} attempts`);
            this.uiController.updateConnectionStatus('connected');
            this.uiController.showMessage('Reconnected to server', 'success');
        });

        // Setup game event handlers (will be implemented in sub-task 7.2)
        this.setupSocketEventHandlers();
    }

    /**
     * Handle manual reconnection with exponential backoff
     */
    handleReconnection() {
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.uiController.updateConnectionStatus('failed');
            this.uiController.showMessage('Maximum reconnection attempts reached. Please refresh the page.', 'error', 0);
            return;
        }

        // Exponential backoff: delay doubles with each attempt
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
        
        setTimeout(() => {
            if (!this.socket.connected) {
                console.log(`Manual reconnection attempt ${this.reconnectAttempts}`);
                this.socket.connect();
            }
        }, this.reconnectDelay);
    }

    /**
     * Setup Socket.io event handlers for game events
     */
    setupSocketEventHandlers() {
        // Handle gameCreated event
        this.socket.on('gameCreated', (data) => {
            console.log('Game created:', data);
            this.gameId = data.gameId;
            this.playerColor = data.color;
            
            // Display game ID for sharing
            this.uiController.displayGameId(this.gameId);
            
            // Display player color
            this.uiController.displayPlayerColor(this.playerColor);
            
            // Show game area
            this.uiController.showGameArea();
            
            // Update game state and render board
            this.updateGameState(data.gameState);
            
            this.uiController.showMessage(`Game created! Share this ID: ${this.gameId}`, 'success');
        });

        // Handle gameJoined event
        this.socket.on('gameJoined', (data) => {
            console.log('Game joined:', data);
            this.gameId = data.gameId;
            this.playerColor = data.color;
            
            // Display game ID
            this.uiController.displayGameId(this.gameId);
            
            // Display player color
            this.uiController.displayPlayerColor(this.playerColor);
            
            // Show game area
            this.uiController.showGameArea();
            
            // Update game state and render board
            this.updateGameState(data.gameState);
            
            if (data.reconnected) {
                this.uiController.showMessage('Reconnected to game', 'success');
            } else {
                this.uiController.showMessage('Successfully joined game!', 'success');
            }
        });

        // Handle opponentJoined event
        this.socket.on('opponentJoined', (data) => {
            console.log('Opponent joined:', data);
            this.updateGameState(data.gameState);
            this.uiController.showMessage('Opponent joined! Game starting...', 'success');
        });

        // Handle moveMade event
        this.socket.on('moveMade', (data) => {
            console.log('Move made:', data);
            
            // Update game state
            this.updateGameState(data.gameState);
            
            // Animate the move on the board
            this.boardRenderer.movePiece(data.from, data.to, true);
            
            // Show whose turn it is
            const isMyTurn = data.currentTurn === this.playerColor;
            if (isMyTurn) {
                this.uiController.showMessage('Your turn', 'info');
            }
        });

        // Handle invalidMove event
        this.socket.on('invalidMove', (data) => {
            console.log('Invalid move:', data);
            
            // Show error message with visual feedback
            this.uiController.showMessage(`Invalid move: ${data.error}`, 'error');
            
            // Re-render the board to reset any optimistic updates
            if (this.gameState) {
                this.boardRenderer.render(this.gameState);
            }
            
            // Clear selection
            this.deselectPiece();
        });

        // Handle gameOver event
        this.socket.on('gameOver', (data) => {
            console.log('Game over:', data);
            
            // Update final game state
            this.updateGameState(data.gameState);
            
            // Determine result message and type
            let resultMessage = '';
            let resultType = null;
            
            if (data.result === 'checkmate') {
                if (data.winner === this.playerColor) {
                    resultMessage = '🎉 Checkmate! You Win! 🎉';
                    resultType = 'win';
                } else {
                    resultMessage = '😔 Checkmate! You Lose.';
                    resultType = 'lose';
                }
            } else if (data.result === 'stalemate') {
                resultMessage = '🤝 Stalemate! Game is a Draw.';
                resultType = 'draw';
            } else {
                resultMessage = `Game Over: ${data.result}`;
                resultType = 'draw';
            }
            
            // Show game over screen
            this.uiController.showGameOverScreen(resultMessage, resultType);
        });

        // Handle opponentDisconnected event
        this.socket.on('opponentDisconnected', (data) => {
            console.log('Opponent disconnected:', data);
            this.uiController.showMessage('Opponent disconnected. Waiting for reconnection...', 'warning', 0);
        });

        // Handle opponentReconnected event
        this.socket.on('opponentReconnected', (data) => {
            console.log('Opponent reconnected:', data);
            this.uiController.showMessage('Opponent reconnected. Game continues!', 'success');
        });

        // Handle error event
        this.socket.on('error', (data) => {
            console.error('Socket error:', data);
            this.uiController.showMessage(data.message || 'An error occurred', 'error');
        });

        // Handle gameNotFound event (for invalid game IDs)
        this.socket.on('gameNotFound', (data) => {
            console.error('Game not found:', data);
            this.uiController.showMessage(data.message || 'Game not found. Please check the Game ID.', 'error');
        });

        // Handle gameFull event (when trying to join a full game)
        this.socket.on('gameFull', (data) => {
            console.error('Game full:', data);
            this.uiController.showMessage(data.message || 'This game is already full.', 'error');
        });
    }

    /**
     * Initialize UI elements and event listeners
     */
    initializeUI() {
        // Initialize UI controller
        this.uiController = new UIController();

        // Initialize board renderer
        const chessBoard = document.getElementById('chessBoard');
        this.boardRenderer = new BoardRenderer(chessBoard);

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Set up UI control event handlers
        this.uiController.setupEventListeners({
            onCreateGame: () => this.createGame(),
            onJoinGame: () => this.joinGame(),
            onNewGame: () => this.resetAndCreateGame()
        });

        // Board click handler
        const chessBoard = document.getElementById('chessBoard');
        chessBoard.addEventListener('click', (e) => this.handleBoardClick(e));
    }

    /**
     * Handle clicks on the chess board
     * @param {Event} e - Click event
     */
    handleBoardClick(e) {
        // Find the clicked square
        const square = e.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        // Check if game is active
        if (!this.gameState || this.gameState.status !== 'active') {
            return;
        }

        // Check if it's player's turn
        if (this.gameState.currentTurn !== this.playerColor) {
            this.uiController.showMessage('Not your turn!', 'error');
            return;
        }

        // If no piece is selected, try to select one
        if (!this.selectedPiece) {
            this.selectPiece(row, col);
        } else {
            // A piece is already selected, try to move it
            this.attemptMove(row, col);
        }
    }

    /**
     * Select a piece on the board
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    selectPiece(row, col) {
        const piece = this.gameState.board[row][col];

        // Check if there's a piece at this position
        if (!piece) {
            return;
        }

        // Check if the piece belongs to the current player
        if (piece.color !== this.playerColor) {
            this.uiController.showMessage('You can only move your own pieces!', 'error');
            return;
        }

        // Select the piece
        this.selectedPiece = { row, col, piece };
        this.boardRenderer.clearHighlights();
        this.boardRenderer.highlightSquare({ row, col });

        // Get and show legal moves for this piece
        const legalMoves = this.getLegalMovesForPiece(row, col);
        this.boardRenderer.showLegalMoves(legalMoves);

        this.uiController.clearMessage();
    }

    /**
     * Attempt to move the selected piece to a destination
     * @param {number} toRow - Destination row
     * @param {number} toCol - Destination column
     */
    attemptMove(toRow, toCol) {
        const fromRow = this.selectedPiece.row;
        const fromCol = this.selectedPiece.col;

        // Check if clicking the same square (deselect)
        if (fromRow === toRow && fromCol === toCol) {
            this.deselectPiece();
            return;
        }

        // Check if clicking another piece of the same color (reselect)
        const targetPiece = this.gameState.board[toRow][toCol];
        if (targetPiece && targetPiece.color === this.playerColor) {
            this.selectPiece(toRow, toCol);
            return;
        }

        // Check if the move is in the legal moves list (client-side check)
        if (!this.boardRenderer.isLegalMove(toRow, toCol)) {
            this.uiController.showMessage('Invalid move!', 'error');
            this.deselectPiece();
            return;
        }

        // Send move to server for authoritative validation and execution
        this.sendMove(fromRow, fromCol, toRow, toCol);
    }

    /**
     * Deselect the currently selected piece
     */
    deselectPiece() {
        this.selectedPiece = null;
        this.boardRenderer.clearHighlights();
        this.uiController.clearMessage();
    }

    /**
     * Get legal moves for a piece (client-side calculation for immediate feedback)
     * @param {number} row - Piece row
     * @param {number} col - Piece column
     * @returns {Array} Array of legal move positions
     */
    getLegalMovesForPiece(row, col) {
        const piece = this.gameState.board[row][col];
        if (!piece) return [];

        const moves = [];
        const board = this.gameState.board;

        switch (piece.type) {
            case 'pawn':
                moves.push(...this.getPawnMoves(row, col, piece, board));
                break;
            case 'rook':
                moves.push(...this.getRookMoves(row, col, piece, board));
                break;
            case 'knight':
                moves.push(...this.getKnightMoves(row, col, piece, board));
                break;
            case 'bishop':
                moves.push(...this.getBishopMoves(row, col, piece, board));
                break;
            case 'queen':
                moves.push(...this.getQueenMoves(row, col, piece, board));
                break;
            case 'king':
                moves.push(...this.getKingMoves(row, col, piece, board));
                break;
        }

        return moves;
    }

    getPawnMoves(row, col, piece, board) {
        const moves = [];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        // Forward one square
        const newRow = row + direction;
        if (newRow >= 0 && newRow < 8 && !board[newRow][col]) {
            moves.push({ row: newRow, col });

            // Forward two squares from starting position
            if (row === startRow) {
                const twoSquaresRow = row + direction * 2;
                if (!board[twoSquaresRow][col]) {
                    moves.push({ row: twoSquaresRow, col });
                }
            }
        }

        // Diagonal captures
        for (const colOffset of [-1, 1]) {
            const newCol = col + colOffset;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = board[newRow][newCol];
                if (targetPiece && targetPiece.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    getRookMoves(row, col, piece, board) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dRow, dCol] of directions) {
            let newRow = row + dRow;
            let newCol = col + dCol;

            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dRow;
                newCol += dCol;
            }
        }

        return moves;
    }

    getKnightMoves(row, col, piece, board) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dRow, dCol] of knightMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    getBishopMoves(row, col, piece, board) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (const [dRow, dCol] of directions) {
            let newRow = row + dRow;
            let newCol = col + dCol;

            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dRow;
                newCol += dCol;
            }
        }

        return moves;
    }

    getQueenMoves(row, col, piece, board) {
        return [
            ...this.getRookMoves(row, col, piece, board),
            ...this.getBishopMoves(row, col, piece, board)
        ];
    }

    getKingMoves(row, col, piece, board) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    /**
     * Send a move to the server with client-side validation
     */
    sendMove(fromRow, fromCol, toRow, toCol) {
        if (!this.socket || !this.socket.connected) {
            this.uiController.showMessage('Not connected to server', 'error');
            this.deselectPiece();
            return;
        }

        if (!this.gameId) {
            this.uiController.showMessage('Not in a game', 'error');
            this.deselectPiece();
            return;
        }

        // Client-side validation for immediate feedback
        const validationResult = this.validateMoveClientSide(fromRow, fromCol, toRow, toCol);
        if (!validationResult.valid) {
            this.uiController.showMessage(validationResult.error, 'error');
            this.deselectPiece();
            return;
        }

        // Send move to server for authoritative validation
        this.socket.emit('makeMove', {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol }
        });

        // Note: We don't optimistically update the UI here
        // We wait for the server's moveMade event to ensure consistency
        // The server will validate and broadcast the move if valid
        
        this.deselectPiece();
    }

    /**
     * Perform client-side move validation for immediate feedback
     * @param {number} fromRow - Source row
     * @param {number} fromCol - Source column
     * @param {number} toRow - Destination row
     * @param {number} toCol - Destination column
     * @returns {Object} Validation result {valid: boolean, error: string}
     */
    validateMoveClientSide(fromRow, fromCol, toRow, toCol) {
        // Check if game is active
        if (!this.gameState || this.gameState.status !== 'active') {
            return { valid: false, error: 'Game is not active' };
        }

        // Check if it's player's turn
        if (this.gameState.currentTurn !== this.playerColor) {
            return { valid: false, error: 'Not your turn' };
        }

        // Check if source position has a piece
        const piece = this.gameState.board[fromRow][fromCol];
        if (!piece) {
            return { valid: false, error: 'No piece at source position' };
        }

        // Check if piece belongs to player
        if (piece.color !== this.playerColor) {
            return { valid: false, error: 'You can only move your own pieces' };
        }

        // Check if destination is within bounds
        if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
            return { valid: false, error: 'Move is out of bounds' };
        }

        // Check if destination has player's own piece
        const targetPiece = this.gameState.board[toRow][toCol];
        if (targetPiece && targetPiece.color === this.playerColor) {
            return { valid: false, error: 'Cannot capture your own piece' };
        }

        // Basic validation passed - server will do detailed rule validation
        return { valid: true };
    }

    /**
     * Create a new game
     */
    createGame() {
        if (this.socket) {
            this.socket.emit('createGame');
        }
    }

    /**
     * Join an existing game
     */
    joinGame() {
        const validation = this.uiController.validateGameIdInput();
        
        if (!validation.valid) {
            this.uiController.showMessage(validation.error, 'error');
            return;
        }

        if (this.socket) {
            this.socket.emit('joinGame', { gameId: validation.gameId });
        }
    }

    /**
     * Reset UI and create a new game
     */
    resetAndCreateGame() {
        this.uiController.resetUI();
        this.gameState = null;
        this.playerColor = null;
        this.gameId = null;
        this.selectedPiece = null;
        this.createGame();
    }

    /**
     * Update the game state and render the board
     */
    updateGameState(newGameState) {
        this.gameState = newGameState;
        this.boardRenderer.render(this.gameState, this.playerColor);
        this.uiController.updateTurnIndicator(this.gameState.currentTurn, this.playerColor);
        this.deselectPiece();
    }
}

// Initialize the game client when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameClient = new GameClient();
    console.log('Game client initialized and connected');
});

export default GameClient;
