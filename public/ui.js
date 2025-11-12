/**
 * UI Controller - Manages game status display and user interface controls
 */
class UIController {
    constructor() {
        this.elements = {
            // Connection status
            connectionStatus: document.getElementById('connectionStatus'),
            
            // Game information
            gameIdDisplay: document.getElementById('gameIdDisplay'),
            playerColor: document.getElementById('playerColor'),
            turnIndicator: document.getElementById('turnIndicator'),
            
            // Game controls
            createGameBtn: document.getElementById('createGameBtn'),
            joinGameBtn: document.getElementById('joinGameBtn'),
            gameIdInput: document.getElementById('gameIdInput'),
            newGameBtn: document.getElementById('newGameBtn'),
            
            // Game areas
            gameArea: document.getElementById('gameArea'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            gameResult: document.getElementById('gameResult'),
            
            // Messages
            gameMessage: document.getElementById('gameMessage')
        };
        
        this.messageTimeout = null;
    }

    /**
     * Update connection status indicator
     * @param {string} status - Connection status ('connected', 'disconnected', 'connecting', 'reconnecting', 'error')
     */
    updateConnectionStatus(status) {
        const statusText = {
            'connected': 'Connected',
            'disconnected': 'Disconnected',
            'connecting': 'Connecting...',
            'reconnecting': 'Reconnecting...',
            'error': 'Connection Error',
            'failed': 'Connection Failed'
        };

        this.elements.connectionStatus.textContent = statusText[status] || status;
        this.elements.connectionStatus.className = `connection-status ${status}`;
    }

    /**
     * Display game ID for sharing
     * @param {string} gameId - The unique game identifier
     */
    displayGameId(gameId) {
        if (gameId) {
            this.elements.gameIdDisplay.textContent = `Game ID: ${gameId}`;
            this.elements.gameIdDisplay.style.display = 'block';
        } else {
            this.elements.gameIdDisplay.textContent = '';
            this.elements.gameIdDisplay.style.display = 'none';
        }
    }

    /**
     * Display player color assignment
     * @param {string} color - Player color ('white' or 'black')
     */
    displayPlayerColor(color) {
        if (color) {
            const colorCapitalized = color.charAt(0).toUpperCase() + color.slice(1);
            this.elements.playerColor.textContent = `You are playing as: ${colorCapitalized}`;
            this.elements.playerColor.style.display = 'block';
        } else {
            this.elements.playerColor.textContent = '';
            this.elements.playerColor.style.display = 'none';
        }
    }

    /**
     * Update turn indicator
     * @param {string} currentTurn - Current turn color
     * @param {string} playerColor - This player's color
     */
    updateTurnIndicator(currentTurn, playerColor) {
        if (!currentTurn || !playerColor) {
            this.elements.turnIndicator.textContent = 'Waiting for opponent...';
            return;
        }

        const isMyTurn = currentTurn === playerColor;
        const turnText = isMyTurn ? 'Your turn' : "Opponent's turn";
        const turnColor = currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1);
        
        this.elements.turnIndicator.textContent = `${turnText} (${turnColor})`;
        this.elements.turnIndicator.style.color = isMyTurn ? '#10b981' : '#667eea';
    }

    /**
     * Show a message to the user
     * @param {string} message - Message text
     * @param {string} type - Message type ('info', 'success', 'warning', 'error')
     * @param {number} duration - Duration in milliseconds (0 for no auto-hide)
     */
    showMessage(message, type = 'info', duration = 3000) {
        // Clear any existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }

        this.elements.gameMessage.textContent = message;
        this.elements.gameMessage.className = `game-message ${type}`;
        this.elements.gameMessage.style.display = 'block';

        // Auto-hide after duration (if duration > 0)
        if (duration > 0) {
            this.messageTimeout = setTimeout(() => this.clearMessage(), duration);
        }
    }

    /**
     * Clear the message display
     */
    clearMessage() {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }
        this.elements.gameMessage.style.display = 'none';
        this.elements.gameMessage.textContent = '';
    }

    /**
     * Show the game area (board and controls)
     */
    showGameArea() {
        this.elements.gameArea.style.display = 'flex';
    }

    /**
     * Hide the game area
     */
    hideGameArea() {
        this.elements.gameArea.style.display = 'none';
    }

    /**
     * Show game over screen with result
     * @param {string} result - Game result message
     * @param {string} resultType - Result type ('win', 'lose', 'draw')
     */
    showGameOverScreen(result, resultType = null) {
        this.elements.gameResult.textContent = result;
        
        // Add result type class for styling
        this.elements.gameResult.className = 'game-result';
        if (resultType) {
            this.elements.gameResult.classList.add(resultType);
        }
        
        this.elements.gameOverScreen.style.display = 'block';
    }

    /**
     * Hide game over screen
     */
    hideGameOverScreen() {
        this.elements.gameOverScreen.style.display = 'none';
        this.elements.gameResult.textContent = '';
    }

    /**
     * Get game ID from input field
     * @returns {string} Trimmed game ID
     */
    getGameIdInput() {
        return this.elements.gameIdInput.value.trim();
    }

    /**
     * Clear game ID input field
     */
    clearGameIdInput() {
        this.elements.gameIdInput.value = '';
    }

    /**
     * Validate game ID input
     * @returns {Object} Validation result {valid: boolean, error: string}
     */
    validateGameIdInput() {
        const gameId = this.getGameIdInput();
        
        if (!gameId) {
            this.elements.gameIdInput.classList.add('error');
            return { valid: false, error: 'Please enter a game ID' };
        }
        
        if (gameId.length < 3) {
            this.elements.gameIdInput.classList.add('error');
            return { valid: false, error: 'Game ID is too short' };
        }
        
        // Remove error class if validation passes
        this.elements.gameIdInput.classList.remove('error');
        return { valid: true, gameId };
    }

    /**
     * Clear error state from game ID input
     */
    clearGameIdInputError() {
        this.elements.gameIdInput.classList.remove('error');
    }

    /**
     * Reset all UI elements to initial state
     */
    resetUI() {
        this.hideGameArea();
        this.hideGameOverScreen();
        this.clearMessage();
        this.displayGameId(null);
        this.displayPlayerColor(null);
        this.elements.turnIndicator.textContent = '';
        this.clearGameIdInput();
    }

    /**
     * Set up event listeners for UI controls
     * @param {Object} handlers - Event handler functions
     */
    setupEventListeners(handlers) {
        if (handlers.onCreateGame) {
            this.elements.createGameBtn.addEventListener('click', handlers.onCreateGame);
        }
        
        if (handlers.onJoinGame) {
            this.elements.joinGameBtn.addEventListener('click', handlers.onJoinGame);
            
            // Also allow Enter key in game ID input
            this.elements.gameIdInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handlers.onJoinGame();
                }
            });
        }
        
        if (handlers.onNewGame) {
            this.elements.newGameBtn.addEventListener('click', handlers.onNewGame);
        }

        // Clear error state when user starts typing in game ID input
        this.elements.gameIdInput.addEventListener('input', () => {
            this.clearGameIdInputError();
        });
    }

    /**
     * Disable game controls
     */
    disableControls() {
        this.elements.createGameBtn.disabled = true;
        this.elements.joinGameBtn.disabled = true;
        this.elements.gameIdInput.disabled = true;
    }

    /**
     * Enable game controls
     */
    enableControls() {
        this.elements.createGameBtn.disabled = false;
        this.elements.joinGameBtn.disabled = false;
        this.elements.gameIdInput.disabled = false;
    }
}

export default UIController;
