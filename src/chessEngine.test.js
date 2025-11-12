// Unit tests for Chess Engine

const {
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
} = require('./chessEngine');

describe('Chess Engine - Board Initialization', () => {
  test('should initialize board with correct dimensions', () => {
    const board = initializeBoard();
    expect(board.length).toBe(8);
    expect(board[0].length).toBe(8);
  });

  test('should place all pieces in correct starting positions', () => {
    const board = initializeBoard();
    
    // Check white pawns
    for (let col = 0; col < 8; col++) {
      expect(board[6][col].type).toBe(PIECE_TYPES.PAWN);
      expect(board[6][col].color).toBe(COLORS.WHITE);
    }
    
    // Check black pawns
    for (let col = 0; col < 8; col++) {
      expect(board[1][col].type).toBe(PIECE_TYPES.PAWN);
      expect(board[1][col].color).toBe(COLORS.BLACK);
    }
    
    // Check white back rank
    expect(board[7][0].type).toBe(PIECE_TYPES.ROOK);
    expect(board[7][1].type).toBe(PIECE_TYPES.KNIGHT);
    expect(board[7][2].type).toBe(PIECE_TYPES.BISHOP);
    expect(board[7][3].type).toBe(PIECE_TYPES.QUEEN);
    expect(board[7][4].type).toBe(PIECE_TYPES.KING);
    
    // Check empty squares
    expect(board[3][3]).toBeNull();
    expect(board[4][4]).toBeNull();
  });
});

describe('Chess Engine - Position Validation', () => {
  test('should validate positions within board boundaries', () => {
    expect(isValidPosition(0, 0)).toBe(true);
    expect(isValidPosition(7, 7)).toBe(true);
    expect(isValidPosition(3, 4)).toBe(true);
  });

  test('should reject positions outside board boundaries', () => {
    expect(isValidPosition(-1, 0)).toBe(false);
    expect(isValidPosition(0, -1)).toBe(false);
    expect(isValidPosition(8, 0)).toBe(false);
    expect(isValidPosition(0, 8)).toBe(false);
  });
});

describe('Chess Engine - Pawn Move Validation', () => {
  let board;

  beforeEach(() => {
    board = initializeBoard();
  });

  test('should allow white pawn to move forward one square', () => {
    const result = isValidMoveForPiece(board, 6, 0, 5, 0, {});
    expect(result).toBe(true);
  });

  test('should allow white pawn to move forward two squares from starting position', () => {
    const result = isValidMoveForPiece(board, 6, 0, 4, 0, {});
    expect(result).toBe(true);
  });

  test('should not allow pawn to move forward two squares after first move', () => {
    board[5][0] = board[6][0];
    board[6][0] = null;
    board[5][0].position = { row: 5, col: 0 };
    board[5][0].hasMoved = true;
    
    const result = isValidMoveForPiece(board, 5, 0, 3, 0, {});
    expect(result).toBe(false);
  });

  test('should allow pawn diagonal capture', () => {
    // Place black piece for white pawn to capture
    board[5][1] = createPiece(PIECE_TYPES.PAWN, COLORS.BLACK, 5, 1);
    
    const result = isValidMoveForPiece(board, 6, 0, 5, 1, {});
    expect(result).toBe(true);
  });

  test('should not allow pawn to move diagonally without capture', () => {
    const result = isValidMoveForPiece(board, 6, 0, 5, 1, {});
    expect(result).toBe(false);
  });
});

describe('Chess Engine - Rook Move Validation', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[4][4] = createPiece(PIECE_TYPES.ROOK, COLORS.WHITE, 4, 4);
  });

  test('should allow rook to move horizontally', () => {
    expect(isValidMoveForPiece(board, 4, 4, 4, 7, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 4, 0, {})).toBe(true);
  });

  test('should allow rook to move vertically', () => {
    expect(isValidMoveForPiece(board, 4, 4, 0, 4, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 7, 4, {})).toBe(true);
  });

  test('should not allow rook to move diagonally', () => {
    expect(isValidMoveForPiece(board, 4, 4, 6, 6, {})).toBe(false);
  });

  test('should not allow rook to jump over pieces', () => {
    board[4][6] = createPiece(PIECE_TYPES.PAWN, COLORS.WHITE, 4, 6);
    expect(isValidMoveForPiece(board, 4, 4, 4, 7, {})).toBe(false);
  });
});

describe('Chess Engine - Knight Move Validation', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[4][4] = createPiece(PIECE_TYPES.KNIGHT, COLORS.WHITE, 4, 4);
  });

  test('should allow knight L-shaped moves', () => {
    expect(isValidMoveForPiece(board, 4, 4, 6, 5, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 6, 3, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 2, 5, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 2, 3, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 5, 6, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 3, 6, {})).toBe(true);
  });

  test('should not allow knight non-L-shaped moves', () => {
    expect(isValidMoveForPiece(board, 4, 4, 5, 5, {})).toBe(false);
    expect(isValidMoveForPiece(board, 4, 4, 4, 6, {})).toBe(false);
  });

  test('should allow knight to jump over pieces', () => {
    board[5][4] = createPiece(PIECE_TYPES.PAWN, COLORS.WHITE, 5, 4);
    expect(isValidMoveForPiece(board, 4, 4, 6, 5, {})).toBe(true);
  });
});

describe('Chess Engine - Bishop Move Validation', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[4][4] = createPiece(PIECE_TYPES.BISHOP, COLORS.WHITE, 4, 4);
  });

  test('should allow bishop to move diagonally', () => {
    expect(isValidMoveForPiece(board, 4, 4, 7, 7, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 1, 1, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 6, 2, {})).toBe(true);
  });

  test('should not allow bishop to move horizontally or vertically', () => {
    expect(isValidMoveForPiece(board, 4, 4, 4, 7, {})).toBe(false);
    expect(isValidMoveForPiece(board, 4, 4, 7, 4, {})).toBe(false);
  });

  test('should not allow bishop to jump over pieces', () => {
    board[5][5] = createPiece(PIECE_TYPES.PAWN, COLORS.WHITE, 5, 5);
    expect(isValidMoveForPiece(board, 4, 4, 6, 6, {})).toBe(false);
  });
});

describe('Chess Engine - Queen Move Validation', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[4][4] = createPiece(PIECE_TYPES.QUEEN, COLORS.WHITE, 4, 4);
  });

  test('should allow queen to move horizontally', () => {
    expect(isValidMoveForPiece(board, 4, 4, 4, 7, {})).toBe(true);
  });

  test('should allow queen to move vertically', () => {
    expect(isValidMoveForPiece(board, 4, 4, 7, 4, {})).toBe(true);
  });

  test('should allow queen to move diagonally', () => {
    expect(isValidMoveForPiece(board, 4, 4, 7, 7, {})).toBe(true);
  });
});

describe('Chess Engine - King Move Validation', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
  });

  test('should allow king to move one square in any direction', () => {
    expect(isValidMoveForPiece(board, 4, 4, 5, 4, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 3, 4, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 4, 5, {})).toBe(true);
    expect(isValidMoveForPiece(board, 4, 4, 5, 5, {})).toBe(true);
  });

  test('should not allow king to move more than one square', () => {
    expect(isValidMoveForPiece(board, 4, 4, 6, 4, {})).toBe(false);
    expect(isValidMoveForPiece(board, 4, 4, 4, 6, {})).toBe(false);
  });
});

describe('Chess Engine - Castling', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
  });

  test('should allow kingside castling when conditions are met', () => {
    board[7][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 7, 4);
    board[7][7] = createPiece(PIECE_TYPES.ROOK, COLORS.WHITE, 7, 7);
    
    expect(isValidMoveForPiece(board, 7, 4, 7, 6, {})).toBe(true);
  });

  test('should allow queenside castling when conditions are met', () => {
    board[7][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 7, 4);
    board[7][0] = createPiece(PIECE_TYPES.ROOK, COLORS.WHITE, 7, 0);
    
    expect(isValidMoveForPiece(board, 7, 4, 7, 2, {})).toBe(true);
  });

  test('should not allow castling if king has moved', () => {
    const king = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 7, 4);
    king.hasMoved = true;
    board[7][4] = king;
    board[7][7] = createPiece(PIECE_TYPES.ROOK, COLORS.WHITE, 7, 7);
    
    expect(isValidMoveForPiece(board, 7, 4, 7, 6, {})).toBe(false);
  });

  test('should not allow castling if rook has moved', () => {
    board[7][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 7, 4);
    const rook = createPiece(PIECE_TYPES.ROOK, COLORS.WHITE, 7, 7);
    rook.hasMoved = true;
    board[7][7] = rook;
    
    expect(isValidMoveForPiece(board, 7, 4, 7, 6, {})).toBe(false);
  });

  test('should not allow castling if path is blocked', () => {
    board[7][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 7, 4);
    board[7][7] = createPiece(PIECE_TYPES.ROOK, COLORS.WHITE, 7, 7);
    board[7][5] = createPiece(PIECE_TYPES.KNIGHT, COLORS.WHITE, 7, 5);
    
    expect(isValidMoveForPiece(board, 7, 4, 7, 6, {})).toBe(false);
  });
});

describe('Chess Engine - Check Detection', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
  });

  test('should detect when king is in check from rook', () => {
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    board[4][7] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 4, 7);
    
    expect(isKingInCheck(board, COLORS.WHITE, {})).toBe(true);
  });

  test('should detect when king is in check from bishop', () => {
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    board[6][6] = createPiece(PIECE_TYPES.BISHOP, COLORS.BLACK, 6, 6);
    
    expect(isKingInCheck(board, COLORS.WHITE, {})).toBe(true);
  });

  test('should detect when king is in check from knight', () => {
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    board[6][5] = createPiece(PIECE_TYPES.KNIGHT, COLORS.BLACK, 6, 5);
    
    expect(isKingInCheck(board, COLORS.WHITE, {})).toBe(true);
  });

  test('should detect when king is in check from pawn', () => {
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    board[3][5] = createPiece(PIECE_TYPES.PAWN, COLORS.BLACK, 3, 5);
    
    expect(isKingInCheck(board, COLORS.WHITE, {})).toBe(true);
  });

  test('should return false when king is not in check', () => {
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    board[7][7] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 7, 7);
    
    expect(isKingInCheck(board, COLORS.WHITE, {})).toBe(false);
  });
});

describe('Chess Engine - Checkmate Detection', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
  });

  test('should detect back rank checkmate', () => {
    // Simple two-rook checkmate in corner
    board[7][7] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 7, 7);
    board[0][7] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 0, 7);
    board[1][6] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 1, 6);
    
    expect(isCheckmate(board, COLORS.WHITE, {})).toBe(true);
  });

  test('should return false when king can escape check', () => {
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    board[4][7] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 4, 7);
    
    expect(isCheckmate(board, COLORS.WHITE, {})).toBe(false);
  });

  test('should return false when not in check', () => {
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    
    expect(isCheckmate(board, COLORS.WHITE, {})).toBe(false);
  });
});

describe('Chess Engine - Stalemate Detection', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
  });

  test('should detect stalemate when king has no legal moves but not in check', () => {
    board[7][7] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 7, 7);
    board[5][6] = createPiece(PIECE_TYPES.QUEEN, COLORS.BLACK, 5, 6);
    board[6][5] = createPiece(PIECE_TYPES.KING, COLORS.BLACK, 6, 5);
    
    expect(isStalemate(board, COLORS.WHITE, {})).toBe(true);
  });

  test('should return false when king is in check', () => {
    board[7][7] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 7, 7);
    board[7][0] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 7, 0);
    
    expect(isStalemate(board, COLORS.WHITE, {})).toBe(false);
  });

  test('should return false when player has legal moves', () => {
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    
    expect(isStalemate(board, COLORS.WHITE, {})).toBe(false);
  });
});

describe('Chess Engine - makeMove Function', () => {
  let board;

  beforeEach(() => {
    board = initializeBoard();
  });

  test('should execute valid move and return new board state', () => {
    const result = makeMove(board, { row: 6, col: 4 }, { row: 4, col: 4 }, { currentTurn: COLORS.WHITE });
    
    expect(result.valid).toBe(true);
    expect(result.board[4][4].type).toBe(PIECE_TYPES.PAWN);
    expect(result.board[6][4]).toBeNull();
  });

  test('should reject invalid move', () => {
    const result = makeMove(board, { row: 6, col: 4 }, { row: 3, col: 4 }, { currentTurn: COLORS.WHITE });
    
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should reject move when not player turn', () => {
    const result = makeMove(board, { row: 6, col: 4 }, { row: 5, col: 4 }, { currentTurn: COLORS.BLACK });
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not your turn');
  });

  test('should reject move that leaves king in check', () => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    board[4][5] = createPiece(PIECE_TYPES.BISHOP, COLORS.WHITE, 4, 5);
    board[4][7] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 4, 7);
    
    const result = makeMove(board, { row: 4, col: 5 }, { row: 5, col: 6 }, { currentTurn: COLORS.WHITE });
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Move would leave king in check');
  });

  test('should capture opponent piece', () => {
    board[5][4] = createPiece(PIECE_TYPES.PAWN, COLORS.BLACK, 5, 4);
    
    const result = makeMove(board, { row: 6, col: 3 }, { row: 5, col: 4 }, { currentTurn: COLORS.WHITE });
    
    expect(result.valid).toBe(true);
    expect(result.capturedPiece).toBeDefined();
    expect(result.capturedPiece.color).toBe(COLORS.BLACK);
  });
});

describe('Chess Engine - Legal Moves', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
  });

  test('should return all legal moves for a piece', () => {
    board[4][4] = createPiece(PIECE_TYPES.KNIGHT, COLORS.WHITE, 4, 4);
    
    const moves = getLegalMoves(board, 4, 4, {});
    
    expect(moves.length).toBeGreaterThan(0);
    expect(moves).toContainEqual({ row: 6, col: 5 });
    expect(moves).toContainEqual({ row: 2, col: 3 });
  });

  test('should exclude moves that would leave king in check', () => {
    board[4][4] = createPiece(PIECE_TYPES.KING, COLORS.WHITE, 4, 4);
    board[4][5] = createPiece(PIECE_TYPES.BISHOP, COLORS.WHITE, 4, 5);
    board[4][7] = createPiece(PIECE_TYPES.ROOK, COLORS.BLACK, 4, 7);
    
    const moves = getLegalMoves(board, 4, 5, {});
    
    // Bishop cannot move away as it would expose king to check
    expect(moves.length).toBe(0);
  });
});

describe('Chess Engine - En Passant', () => {
  let board;

  beforeEach(() => {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
  });

  test('should allow en passant capture', () => {
    board[3][4] = createPiece(PIECE_TYPES.PAWN, COLORS.WHITE, 3, 4);
    board[3][5] = createPiece(PIECE_TYPES.PAWN, COLORS.BLACK, 3, 5);
    
    const gameState = {
      lastMove: {
        from: { row: 1, col: 5 },
        to: { row: 3, col: 5 },
        piece: { type: PIECE_TYPES.PAWN, color: COLORS.BLACK }
      }
    };
    
    const result = isValidMoveForPiece(board, 3, 4, 2, 5, gameState);
    expect(result).toBe(true);
  });
});

describe('Chess Engine - Edge Cases', () => {
  test('should handle invalid positions gracefully', () => {
    const board = initializeBoard();
    const result = makeMove(board, { row: -1, col: 0 }, { row: 0, col: 0 }, {});
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid position');
  });

  test('should reject move from empty square', () => {
    const board = initializeBoard();
    const result = makeMove(board, { row: 4, col: 4 }, { row: 5, col: 4 }, {});
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No piece at source position');
  });

  test('should not allow capturing own piece', () => {
    const board = initializeBoard();
    const result = isValidMoveForPiece(board, 7, 0, 6, 0, {});
    
    expect(result).toBe(false);
  });

  test('should find king position correctly', () => {
    const board = initializeBoard();
    const whiteKing = findKing(board, COLORS.WHITE);
    const blackKing = findKing(board, COLORS.BLACK);
    
    expect(whiteKing).toEqual({ row: 7, col: 4 });
    expect(blackKing).toEqual({ row: 0, col: 4 });
  });
});
