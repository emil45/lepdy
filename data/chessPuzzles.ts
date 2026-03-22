import { ChessPieceId } from './chessPieces';

export interface MovementPuzzle {
  id: string;
  pieceId: ChessPieceId;
  fen: string;
  pieceSquare: string;
  validTargets: string[];
  difficulty: 1 | 2 | 3;
}

export interface CapturePuzzle {
  id: string;
  fen: string;
  targetSquare: string;
  correctPieceSquare: string;
  correctPieceId: ChessPieceId;
  targetPieceId: ChessPieceId;
  distractorSquares: string[];
  difficulty: 1 | 2 | 3;
}

// ============================================================
// Movement Puzzles — 3 per piece type, 18 total
// Each puzzle has ONE piece on an otherwise empty board.
// FEN uses only the piece-placement portion (8 ranks separated by /).
// ============================================================

export const movementPuzzles: MovementPuzzle[] = [
  // --- Rook (moves along ranks and files) ---
  {
    id: 'rook-move-1',
    pieceId: 'rook',
    fen: '8/8/8/8/4R3/8/8/8',
    pieceSquare: 'e4',
    validTargets: [
      // file e (excluding e4)
      'e1', 'e2', 'e3', 'e5', 'e6', 'e7', 'e8',
      // rank 4 (excluding e4)
      'a4', 'b4', 'c4', 'd4', 'f4', 'g4', 'h4',
    ],
    difficulty: 1,
  },
  {
    id: 'rook-move-2',
    pieceId: 'rook',
    fen: '8/8/8/8/8/8/8/R7',
    pieceSquare: 'a1',
    validTargets: [
      // file a (excluding a1)
      'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
      // rank 1 (excluding a1)
      'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
    ],
    difficulty: 1,
  },
  {
    id: 'rook-move-3',
    pieceId: 'rook',
    fen: '8/3R4/8/8/8/8/8/8',
    pieceSquare: 'd7',
    validTargets: [
      // file d (excluding d7)
      'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd8',
      // rank 7 (excluding d7)
      'a7', 'b7', 'c7', 'e7', 'f7', 'g7', 'h7',
    ],
    difficulty: 2,
  },

  // --- Bishop (moves diagonally) ---
  {
    id: 'bishop-move-1',
    pieceId: 'bishop',
    fen: '8/8/8/8/3B4/8/8/8',
    pieceSquare: 'd4',
    validTargets: [
      // diagonal down-left: c3, b2, a1
      'a1', 'b2', 'c3',
      // diagonal up-right: e5, f6, g7, h8
      'e5', 'f6', 'g7', 'h8',
      // diagonal down-right: e3, f2, g1
      'e3', 'f2', 'g1',
      // diagonal up-left: c5, b6, a7
      'c5', 'b6', 'a7',
    ],
    difficulty: 1,
  },
  {
    id: 'bishop-move-2',
    pieceId: 'bishop',
    fen: '8/8/8/8/8/8/8/2B5',
    pieceSquare: 'c1',
    validTargets: [
      // diagonal up-left: b2, a3
      'b2', 'a3',
      // diagonal up-right: d2, e3, f4, g5, h6
      'd2', 'e3', 'f4', 'g5', 'h6',
    ],
    difficulty: 2,
  },
  {
    id: 'bishop-move-3',
    pieceId: 'bishop',
    fen: '8/8/8/5B2/8/8/8/8',
    pieceSquare: 'f5',
    validTargets: [
      // diagonal up-left: e6, d7, c8
      'e6', 'd7', 'c8',
      // diagonal up-right: g6, h7
      'g6', 'h7',
      // diagonal down-left: e4, d3, c2, b1
      'e4', 'd3', 'c2', 'b1',
      // diagonal down-right: g4, h3
      'g4', 'h3',
    ],
    difficulty: 2,
  },

  // --- Queen (moves like rook + bishop) ---
  {
    id: 'queen-move-1',
    pieceId: 'queen',
    fen: '8/8/8/8/3Q4/8/8/8',
    pieceSquare: 'd4',
    validTargets: [
      // file d (excluding d4)
      'd1', 'd2', 'd3', 'd5', 'd6', 'd7', 'd8',
      // rank 4 (excluding d4)
      'a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'h4',
      // diagonal down-left: c3, b2, a1
      'a1', 'b2', 'c3',
      // diagonal up-right: e5, f6, g7, h8
      'e5', 'f6', 'g7', 'h8',
      // diagonal down-right: e3, f2, g1
      'e3', 'f2', 'g1',
      // diagonal up-left: c5, b6, a7
      'c5', 'b6', 'a7',
    ],
    difficulty: 2,
  },
  {
    id: 'queen-move-2',
    pieceId: 'queen',
    fen: '8/8/8/8/8/8/8/Q7',
    pieceSquare: 'a1',
    validTargets: [
      // file a (excluding a1)
      'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
      // rank 1 (excluding a1)
      'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
      // diagonal up-right: b2, c3, d4, e5, f6, g7, h8
      'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8',
    ],
    difficulty: 2,
  },
  {
    id: 'queen-move-3',
    pieceId: 'queen',
    fen: '8/8/8/4Q3/8/8/8/8',
    pieceSquare: 'e5',
    validTargets: [
      // file e (excluding e5)
      'e1', 'e2', 'e3', 'e4', 'e6', 'e7', 'e8',
      // rank 5 (excluding e5)
      'a5', 'b5', 'c5', 'd5', 'f5', 'g5', 'h5',
      // diagonal up-left: d6, c7, b8
      'd6', 'c7', 'b8',
      // diagonal up-right: f6, g7, h8
      'f6', 'g7', 'h8',
      // diagonal down-left: d4, c3, b2, a1
      'd4', 'c3', 'b2', 'a1',
      // diagonal down-right: f4, g3, h2
      'f4', 'g3', 'h2',
    ],
    difficulty: 3,
  },

  // --- Knight (L-shape: 2+1 or 1+2 squares) ---
  {
    id: 'knight-move-1',
    pieceId: 'knight',
    fen: '8/8/8/8/3N4/8/8/8',
    pieceSquare: 'd4',
    validTargets: [
      'c2', 'e2', 'b3', 'f3', 'b5', 'f5', 'c6', 'e6',
    ],
    difficulty: 1,
  },
  {
    id: 'knight-move-2',
    pieceId: 'knight',
    fen: '8/8/8/8/8/8/8/1N6',
    pieceSquare: 'b1',
    validTargets: [
      'a3', 'c3', 'd2',
    ],
    difficulty: 1,
  },
  {
    id: 'knight-move-3',
    pieceId: 'knight',
    fen: '8/8/6N1/8/8/8/8/8',
    pieceSquare: 'g6',
    validTargets: [
      'e5', 'e7', 'f4', 'f8', 'h4', 'h8',
    ],
    difficulty: 2,
  },

  // --- King (moves one square in any direction) ---
  {
    id: 'king-move-1',
    pieceId: 'king',
    fen: '8/8/8/8/4K3/8/8/8',
    pieceSquare: 'e4',
    validTargets: [
      'd3', 'e3', 'f3', 'd4', 'f4', 'd5', 'e5', 'f5',
    ],
    difficulty: 1,
  },
  {
    id: 'king-move-2',
    pieceId: 'king',
    fen: '8/8/8/8/8/8/8/K7',
    pieceSquare: 'a1',
    validTargets: [
      'a2', 'b1', 'b2',
    ],
    difficulty: 1,
  },
  {
    id: 'king-move-3',
    pieceId: 'king',
    fen: '8/8/8/7K/8/8/8/8',
    pieceSquare: 'h5',
    validTargets: [
      'g4', 'h4', 'g5', 'g6', 'h6',
    ],
    difficulty: 1,
  },

  // --- Pawn (moves forward; 1 or 2 squares from starting rank, 1 otherwise) ---
  {
    id: 'pawn-move-1',
    pieceId: 'pawn',
    fen: '8/8/8/8/8/8/4P3/8',
    pieceSquare: 'e2',
    validTargets: [
      'e3', 'e4',
    ],
    difficulty: 1,
  },
  {
    id: 'pawn-move-2',
    pieceId: 'pawn',
    fen: '8/8/8/8/3P4/8/8/8',
    pieceSquare: 'd4',
    validTargets: [
      'd5',
    ],
    difficulty: 1,
  },
  {
    id: 'pawn-move-3',
    pieceId: 'pawn',
    fen: '8/8/8/8/8/8/P7/8',
    pieceSquare: 'a2',
    validTargets: [
      'a3', 'a4',
    ],
    difficulty: 1,
  },
];

// ============================================================
// Capture Puzzles — 8 total
// White pieces (uppercase FEN) are the player's pieces.
// A single black piece (lowercase FEN) is the target to capture.
// Exactly one white piece can legally capture the target.
// ============================================================

export const capturePuzzles: CapturePuzzle[] = [
  {
    id: 'capture-rook-1',
    fen: '8/8/8/p7/8/8/2B5/R7',
    targetSquare: 'a5',
    correctPieceSquare: 'a1',
    correctPieceId: 'rook',
    targetPieceId: 'pawn',
    distractorSquares: ['c2'],
    difficulty: 1,
  },
  {
    id: 'capture-bishop-1',
    fen: '8/8/8/8/R7/3p4/8/5B2',
    targetSquare: 'd3',
    correctPieceSquare: 'f1',
    correctPieceId: 'bishop',
    targetPieceId: 'pawn',
    distractorSquares: ['a4'],
    difficulty: 1,
  },
  {
    id: 'capture-knight-1',
    fen: '8/8/8/8/4p3/2N5/8/7R',
    targetSquare: 'e4',
    correctPieceSquare: 'c3',
    correctPieceId: 'knight',
    targetPieceId: 'pawn',
    distractorSquares: ['h1'],
    difficulty: 1,
  },
  {
    id: 'capture-queen-1',
    fen: '8/8/3p4/8/8/6N1/8/3Q4',
    targetSquare: 'd6',
    correctPieceSquare: 'd1',
    correctPieceId: 'queen',
    targetPieceId: 'pawn',
    distractorSquares: ['g3'],
    difficulty: 1,
  },
  {
    id: 'capture-king-1',
    fen: '8/8/8/5p2/4K3/8/8/R7',
    targetSquare: 'f5',
    correctPieceSquare: 'e4',
    correctPieceId: 'king',
    targetPieceId: 'pawn',
    distractorSquares: ['a1'],
    difficulty: 1,
  },
  {
    id: 'capture-pawn-1',
    fen: '8/8/8/3p4/2P5/8/8/B7',
    targetSquare: 'd5',
    correctPieceSquare: 'c4',
    correctPieceId: 'pawn',
    targetPieceId: 'pawn',
    distractorSquares: ['a1'],
    difficulty: 1,
  },
  {
    id: 'capture-rook-2',
    fen: '8/4q3/8/8/5B2/1N6/8/4R3',
    targetSquare: 'e7',
    correctPieceSquare: 'e1',
    correctPieceId: 'rook',
    targetPieceId: 'queen',
    distractorSquares: ['b3', 'f4'],
    difficulty: 2,
  },
  {
    id: 'capture-knight-2',
    fen: '8/8/8/6r1/3P4/5N2/B7/8',
    targetSquare: 'g5',
    correctPieceSquare: 'f3',
    correctPieceId: 'knight',
    targetPieceId: 'rook',
    distractorSquares: ['a2', 'd4'],
    difficulty: 2,
  },
];

// ============================================================
// Helper functions
// ============================================================

export function getMovementPuzzlesByPiece(pieceId: ChessPieceId): MovementPuzzle[] {
  return movementPuzzles.filter(p => p.pieceId === pieceId);
}

export function getCapturePuzzlesByDifficulty(difficulty: 1 | 2 | 3): CapturePuzzle[] {
  return capturePuzzles.filter(p => p.difficulty === difficulty);
}
