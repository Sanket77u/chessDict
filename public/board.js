/**
 * BoardRenderer class - Handles rendering and visual updates of the chess board
 */
class BoardRenderer {
    constructor(boardElement) {
        this.boardElement = boardElement;
        this.selectedSquare = null;
        this.legalMoves = [];
        
        // Unicode chess pieces
        this.pieceSymbols = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };
    }

    /**
     * Render the chess board with current game state
     * @param {Object} gameState - Current game state with board configuration
     * @param {string} playerColor - Player's color for board orientation
     */
    render(gameState, playerColor = 'white') {
        this.boardElement.innerHTML = '';
        this.playerColor = playerColor;
        this.gameState = gameState;
        
        // Determine if board should be rotated (black players see from their side)
        const isRotated = playerColor === 'black';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Calculate display position (rotate for black)
                const displayRow = isRotated ? 7 - row : row;
                const displayCol = isRotated ? 7 - col : col;
                
                const square = document.createElement('div');
                square.className = 'square';
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Alternate square colors
                if ((displayRow + displayCol) % 2 === 0) {
                    square.classList.add('light');
                } else {
                    square.classList.add('dark');
                }
                
                // Add piece if present
                const piece = gameState.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = this.pieceSymbols[piece.color][piece.type];
                    pieceElement.dataset.color = piece.color;
                    pieceElement.dataset.type = piece.type;
                    square.appendChild(pieceElement);
                }
                
                this.boardElement.appendChild(square);
            }
        }
        
        // Apply rotation class to board if needed
        if (isRotated) {
            this.boardElement.classList.add('rotated');
        } else {
            this.boardElement.classList.remove('rotated');
        }
    }
    
    /**
     * Highlight king square when in check
     * @param {string} color - Color of the king in check
     */
    highlightKingInCheck(color) {
        // Find the king of the specified color
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.gameState?.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    const square = this.getSquareElement(row, col);
                    if (square) {
                        square.classList.add('in-check');
                    }
                    return;
                }
            }
        }
    }
    
    /**
     * Remove check highlight from all squares
     */
    clearCheckHighlight() {
        const squares = this.boardElement.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('in-check');
        });
    }

    /**
     * Highlight a specific square
     * @param {Object} position - Position object with row and col
     */
    highlightSquare(position) {
        const square = this.getSquareElement(position.row, position.col);
        if (square) {
            square.classList.add('selected');
            this.selectedSquare = position;
        }
    }

    /**
     * Clear all highlights from the board
     */
    clearHighlights() {
        const squares = this.boardElement.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('selected', 'legal-move', 'has-piece');
        });
        this.selectedSquare = null;
        this.legalMoves = [];
    }

    /**
     * Move a piece from one position to another with optional animation
     * @param {Object} from - Starting position {row, col}
     * @param {Object} to - Ending position {row, col}
     * @param {boolean} animate - Whether to animate the move
     */
    movePiece(from, to, animate = true) {
        const fromSquare = this.getSquareElement(from.row, from.col);
        const toSquare = this.getSquareElement(to.row, to.col);
        
        if (!fromSquare || !toSquare) return;
        
        const piece = fromSquare.querySelector('.piece');
        if (!piece) return;
        
        if (animate) {
            piece.classList.add('moving');
            
            setTimeout(() => {
                // Remove piece from destination if capturing
                const capturedPiece = toSquare.querySelector('.piece');
                if (capturedPiece) {
                    capturedPiece.remove();
                }
                
                // Move piece to new square
                toSquare.appendChild(piece);
                piece.classList.remove('moving');
                
                // Clear the from square
                fromSquare.innerHTML = '';
                
                this.clearHighlights();
            }, 300);
        } else {
            // Instant move without animation
            const capturedPiece = toSquare.querySelector('.piece');
            if (capturedPiece) {
                capturedPiece.remove();
            }
            
            toSquare.appendChild(piece);
            fromSquare.innerHTML = '';
            this.clearHighlights();
        }
    }

    /**
     * Show legal moves for a selected piece
     * @param {Array} moves - Array of legal move positions [{row, col}, ...]
     */
    showLegalMoves(moves) {
        this.legalMoves = moves;
        
        moves.forEach(move => {
            const square = this.getSquareElement(move.row, move.col);
            if (square) {
                square.classList.add('legal-move');
                
                // Add different styling if square has a piece (capture move)
                if (square.querySelector('.piece')) {
                    square.classList.add('has-piece');
                }
            }
        });
    }

    /**
     * Get square element by row and column
     * @param {number} row - Row index (0-7)
     * @param {number} col - Column index (0-7)
     * @returns {HTMLElement|null} Square element or null
     */
    getSquareElement(row, col) {
        return this.boardElement.querySelector(
            `.square[data-row="${row}"][data-col="${col}"]`
        );
    }

    /**
     * Check if a position is in the legal moves list
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if position is a legal move
     */
    isLegalMove(row, col) {
        return this.legalMoves.some(move => move.row === row && move.col === col);
    }

    /**
     * Get the currently selected square position
     * @returns {Object|null} Selected position or null
     */
    getSelectedSquare() {
        return this.selectedSquare;
    }
}

export default BoardRenderer;
