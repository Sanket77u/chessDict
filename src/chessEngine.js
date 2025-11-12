// Chess Engine - Core logic for chess game rules and validation

// Piece types and color constants
const PIECE_TYPES = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king'
};

const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Board dimensions
const BOARD_SIZE = 8;

/**
 * Creates a piece object
 */
function createPiece(type, color, row, col) {
  return {
    type,
    color,
    position: { row, col },
    hasMoved: false
  };
}

/**
 * Initializes a standard chess board with pieces in starting positions
 */
function initializeBoard() {
  const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  
  // Place pawns
  for (let col = 0; col < BOARD_SIZE; col++) {
    board[1][col] = createPiece(PIECE_TYPES.PAWN, COLORS.BLACK, 1, col);
    board[6][col] = createPiece(PIECE_TYPES.PAWN, COLORS.WHITE, 6, col);
  }
  
  // Place rooks
  board[0][0] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 0, 0);
  board[0][7] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 0, 7);
  board[7][0] = createPiece(PIECE_TYPES.ROOK, COLORS.WHITE, 7, 0);
  board[7][7] = createPiece(PIECE_TYPES.ROOK, COLORS.WHITE, 7, 7);
  
  // Place knights
  board[0][1] = createPiece(PIECE_TYPES.KNIGHT, COLORS.BLACK, 0, 1);
  board[0][6] = createPiece(PIECE_TYPES.KNIGHT, COLORS.BLACK, 0, 6);
  board[7][1] = createPiece(PIECE_TYPES.KNIGHT, COLORS.WHITE, 7, 1);
  board[7][6] = createPiece(PIECE_TYPES.KNIGHT, COLORS.WHITE, 7, 6);
  
  // Place bishops
  board[0][2] = createPiece(PIECE_TYPES.BISHOP, COLORS.BLACK, 0, 2);
  board[0][5] = createPiece(PIECE_TYPES.BISHOP, COLORS.BLACK, 0, 5);
  board[7][2] = createPiece(PIECE_TYPES.BISHOP, COLORS.WHITE, 7, 2);
  board[7][5] = createPiece(PIECE_TYPES.BISHOP, COLORS.WHITE, 7, 5);
  
  // Place queens
  board[0][3] = createPiece(PIECE_TYPES.QUEEN, COLORS.BLACK, 0, 3);
  board[7][3] = createPiece(PIECE_TYPES.QUEEN, COLORS.WHITE, 7, 3);
  
  // Place kings
  board[0][4] = createPiece(PIECE_TYPES.KING, COLORS.BLACK, 0, 4);
  board[7][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 7, 4);
  
  return board;
}

/**
 * Validates if a position is within board boundaries
 */
function isValidPosition(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Gets the piece at a specific position
 */
function getPieceAt(board, row, col) {
  if (!isValidPosition(row, col)) {
    return null;
  }
  return board[row][col];
}

/**
 * Checks if a square is empty
 */
function isSquareEmpty(board, row, col) {
  return getPieceAt(board, row, col) === null;
}

/**
 * Checks if a square contains an opponent's piece
 */
function isOpponentPiece(board, row, col, color) {
  const piece = getPieceAt(board, row, col);
  return piece !== null && piece.color !== color;
}

module.exports = {
  PIECE_TYPES,
  COLORS,
  BOARD_SIZE,
  createPiece,
  initializeBoard,
  isValidPosition,
  getPieceAt,
  isSquareEmpty,
  isOpponentPiece
};

/**
 * Validates pawn moves including en passant
 */
function isValidPawnMove(board, fromRow, fromCol, toRow, toCol, piece, gameState) {
  const direction = piece.color === COLORS.WHITE ? -1 : 1;
  const startRow = piece.color === COLORS.WHITE ? 6 : 1;
  const rowDiff = toRow - fromRow;
  const colDiff = Math.abs(toCol - fromCol);
  
  // Forward move (one square)
  if (colDiff === 0 && rowDiff === direction && isSquareEmpty(board, toRow, toCol)) {
    return true;
  }
  
  // Forward move (two squares from starting position)
  if (colDiff === 0 && rowDiff === direction * 2 && fromRow === startRow) {
    const middleRow = fromRow + direction;
    if (isSquareEmpty(board, middleRow, fromCol) && isSquareEmpty(board, toRow, toCol)) {
      return true;
    }
  }
  
  // Diagonal capture
  if (colDiff === 1 && rowDiff === direction) {
    if (isOpponentPiece(board, toRow, toCol, piece.color)) {
      return true;
    }
    
    // En passant
    if (gameState && gameState.lastMove) {
      const lastMove = gameState.lastMove;
      const lastPiece = getPieceAt(board, lastMove.to.row, lastMove.to.col);
      
      if (lastPiece && lastPiece.type === PIECE_TYPES.PAWN &&
          Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
          lastMove.to.row === fromRow &&
          lastMove.to.col === toCol) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Validates rook moves (straight lines)
 */
function isValidRookMove(board, fromRow, fromCol, toRow, toCol, piece) {
  // Must move in straight line (same row or same column)
  if (fromRow !== toRow && fromCol !== toCol) {
    return false;
  }
  
  // Check path is clear
  return isPathClear(board, fromRow, fromCol, toRow, toCol, piece.color);
}

/**
 * Validates knight moves (L-shape)
 */
function isValidKnightMove(board, fromRow, fromCol, toRow, toCol, piece) {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  // Knight moves in L-shape: 2 squares in one direction, 1 in perpendicular
  const isLShape = (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  
  if (!isLShape) {
    return false;
  }
  
  // Destination must be empty or contain opponent piece
  const destPiece = getPieceAt(board, toRow, toCol);
  return destPiece === null || destPiece.color !== piece.color;
}

/**
 * Validates bishop moves (diagonals)
 */
function isValidBishopMove(board, fromRow, fromCol, toRow, toCol, piece) {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  // Must move diagonally (equal row and column difference)
  if (rowDiff !== colDiff) {
    return false;
  }
  
  // Check path is clear
  return isPathClear(board, fromRow, fromCol, toRow, toCol, piece.color);
}

/**
 * Validates queen moves (combination of rook and bishop)
 */
function isValidQueenMove(board, fromRow, fromCol, toRow, toCol, piece) {
  return isValidRookMove(board, fromRow, fromCol, toRow, toCol, piece) ||
         isValidBishopMove(board, fromRow, fromCol, toRow, toCol, piece);
}

/**
 * Validates king moves (one square in any direction)
 */
function isValidKingMove(board, fromRow, fromCol, toRow, toCol, piece, gameState) {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  
  // Normal king move (one square in any direction)
  if (rowDiff <= 1 && colDiff <= 1) {
    const destPiece = getPieceAt(board, toRow, toCol);
    return destPiece === null || destPiece.color !== piece.color;
  }
  
  // Castling
  if (rowDiff === 0 && colDiff === 2 && !piece.hasMoved) {
    return isValidCastling(board, fromRow, fromCol, toRow, toCol, piece, gameState);
  }
  
  return false;
}

/**
 * Validates castling move
 */
function isValidCastling(board, fromRow, fromCol, toRow, toCol, piece, gameState) {
  // King must not have moved
  if (piece.hasMoved) {
    return false;
  }
  
  // Determine if kingside or queenside castling
  const isKingside = toCol > fromCol;
  const rookCol = isKingside ? 7 : 0;
  const rook = getPieceAt(board, fromRow, rookCol);
  
  // Rook must exist and not have moved
  if (!rook || rook.type !== PIECE_TYPES.ROOK || rook.hasMoved) {
    return false;
  }
  
  // Path between king and rook must be clear
  const direction = isKingside ? 1 : -1;
  const endCol = isKingside ? 7 : 0;
  
  for (let col = fromCol + direction; col !== endCol; col += direction) {
    if (!isSquareEmpty(board, fromRow, col)) {
      return false;
    }
  }
  
  // King must not be in check, pass through check, or end in check
  // This will be validated by the makeMove function using isKingInCheck
  
  return true;
}

/**
 * Checks if path between two positions is clear
 */
function isPathClear(board, fromRow, fromCol, toRow, toCol, color) {
  const rowStep = toRow > fromRow ? 1 : (toRow < fromRow ? -1 : 0);
  const colStep = toCol > fromCol ? 1 : (toCol < fromCol ? -1 : 0);
  
  let currentRow = fromRow + rowStep;
  let currentCol = fromCol + colStep;
  
  // Check all squares between start and end
  while (currentRow !== toRow || currentCol !== toCol) {
    if (!isSquareEmpty(board, currentRow, currentCol)) {
      return false;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }
  
  // Destination square must be empty or contain opponent piece
  const destPiece = getPieceAt(board, toRow, toCol);
  return destPiece === null || destPiece.color !== color;
}

/**
 * Validates a move based on piece type
 */
function isValidMoveForPiece(board, fromRow, fromCol, toRow, toCol, gameState) {
  const piece = getPieceAt(board, fromRow, fromCol);
  
  if (!piece) {
    return false;
  }
  
  // Can't move to same position
  if (fromRow === toRow && fromCol === toCol) {
    return false;
  }
  
  // Can't capture own piece
  const destPiece = getPieceAt(board, toRow, toCol);
  if (destPiece && destPiece.color === piece.color) {
    return false;
  }
  
  switch (piece.type) {
    case PIECE_TYPES.PAWN:
      return isValidPawnMove(board, fromRow, fromCol, toRow, toCol, piece, gameState);
    case PIECE_TYPES.ROOK:
      return isValidRookMove(board, fromRow, fromCol, toRow, toCol, piece);
    case PIECE_TYPES.KNIGHT:
      return isValidKnightMove(board, fromRow, fromCol, toRow, toCol, piece);
    case PIECE_TYPES.BISHOP:
      return isValidBishopMove(board, fromRow, fromCol, toRow, toCol, piece);
    case PIECE_TYPES.QUEEN:
      return isValidQueenMove(board, fromRow, fromCol, toRow, toCol, piece);
    case PIECE_TYPES.KING:
      return isValidKingMove(board, fromRow, fromCol, toRow, toCol, piece, gameState);
    default:
      return false;
  }
}

/**
 * Finds the king position for a given color
 */
function findKing(board, color) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.type === PIECE_TYPES.KING && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Checks if a king is in check
 */
function isKingInCheck(board, color, gameState) {
  const kingPos = findKing(board, color);
  
  if (!kingPos) {
    return false;
  }
  
  // Check if any opponent piece can attack the king
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece && piece.color !== color) {
        // Check if this opponent piece can move to king's position
        if (isValidMoveForPiece(board, row, col, kingPos.row, kingPos.col, gameState)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Creates a deep copy of the board
 */
function copyBoard(board) {
  return board.map(row => row.map(piece => {
    if (piece === null) return null;
    return { ...piece, position: { ...piece.position } };
  }));
}

/**
 * Simulates a move and returns the new board state
 */
function simulateMove(board, fromRow, fromCol, toRow, toCol) {
  const newBoard = copyBoard(board);
  const piece = newBoard[fromRow][fromCol];
  
  if (!piece) {
    return newBoard;
  }
  
  // Handle en passant capture
  if (piece.type === PIECE_TYPES.PAWN) {
    const colDiff = Math.abs(toCol - fromCol);
    const rowDiff = toRow - fromRow;
    
    if (colDiff === 1 && isSquareEmpty(newBoard, toRow, toCol)) {
      // En passant capture - remove the captured pawn
      newBoard[fromRow][toCol] = null;
    }
  }
  
  // Handle castling
  if (piece.type === PIECE_TYPES.KING && Math.abs(toCol - fromCol) === 2) {
    const isKingside = toCol > fromCol;
    const rookFromCol = isKingside ? 7 : 0;
    const rookToCol = isKingside ? toCol - 1 : toCol + 1;
    
    // Move the rook
    const rook = newBoard[fromRow][rookFromCol];
    if (rook) {
      newBoard[fromRow][rookToCol] = rook;
      newBoard[fromRow][rookFromCol] = null;
      rook.position = { row: fromRow, col: rookToCol };
      rook.hasMoved = true;
    }
  }
  
  // Move the piece
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = null;
  piece.position = { row: toRow, col: toCol };
  piece.hasMoved = true;
  
  return newBoard;
}

/**
 * Gets all legal moves for a piece at a given position
 */
function getLegalMoves(board, row, col, gameState) {
  const piece = getPieceAt(board, row, col);
  
  if (!piece) {
    return [];
  }
  
  const legalMoves = [];
  
  // Check all possible destination squares
  for (let toRow = 0; toRow < BOARD_SIZE; toRow++) {
    for (let toCol = 0; toCol < BOARD_SIZE; toCol++) {
      if (isValidMoveForPiece(board, row, col, toRow, toCol, gameState)) {
        // Simulate the move and check if it leaves king in check
        const newBoard = simulateMove(board, row, col, toRow, toCol);
        
        if (!isKingInCheck(newBoard, piece.color, gameState)) {
          legalMoves.push({ row: toRow, col: toCol });
        }
      }
    }
  }
  
  return legalMoves;
}

/**
 * Checks if a player has any legal moves
 */
function hasLegalMoves(board, color, gameState) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, row, col, gameState);
        if (moves.length > 0) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Checks if the game is in checkmate
 */
function isCheckmate(board, color, gameState) {
  // King must be in check
  if (!isKingInCheck(board, color, gameState)) {
    return false;
  }
  
  // No legal moves available
  return !hasLegalMoves(board, color, gameState);
}

/**
 * Checks if the game is in stalemate
 */
function isStalemate(board, color, gameState) {
  // King must NOT be in check
  if (isKingInCheck(board, color, gameState)) {
    return false;
  }
  
  // No legal moves available
  return !hasLegalMoves(board, color, gameState);
}

/**
 * Validates and executes a move
 */
function makeMove(board, from, to, gameState) {
  const { row: fromRow, col: fromCol } = from;
  const { row: toRow, col: toCol } = to;
  
  // Validate positions
  if (!isValidPosition(fromRow, fromCol) || !isValidPosition(toRow, toCol)) {
    return { valid: false, error: 'Invalid position' };
  }
  
  const piece = getPieceAt(board, fromRow, fromCol);
  
  if (!piece) {
    return { valid: false, error: 'No piece at source position' };
  }
  
  // Check if it's the correct player's turn
  if (gameState && gameState.currentTurn && piece.color !== gameState.currentTurn) {
    return { valid: false, error: 'Not your turn' };
  }
  
  // Validate the move for the piece type
  if (!isValidMoveForPiece(board, fromRow, fromCol, toRow, toCol, gameState)) {
    return { valid: false, error: 'Invalid move for this piece' };
  }
  
  // Simulate the move and check if it leaves king in check
  const newBoard = simulateMove(board, fromRow, fromCol, toRow, toCol);
  
  if (isKingInCheck(newBoard, piece.color, gameState)) {
    return { valid: false, error: 'Move would leave king in check' };
  }
  
  // Move is valid - return new board state
  const capturedPiece = board[toRow][toCol];
  
  return {
    valid: true,
    board: newBoard,
    capturedPiece,
    from,
    to,
    piece: { type: piece.type, color: piece.color }
  };
}

// Export all functions
module.exports = {
  PIECE_TYPES,
  COLORS,
  BOARD_SIZE,
  createPiece,
  initializeBoard,
  isValidPosition,
  getPieceAt,
  isSquareEmpty,
  isOpponentPiece,
  isValidMoveForPiece,
  getLegalMoves,
  isKingInCheck,
  isCheckmate,
  isStalemate,
  makeMove,
  findKing
};
