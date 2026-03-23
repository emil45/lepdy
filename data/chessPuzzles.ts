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

export interface CheckmatePuzzle {
  id: string;
  fen: string;               // Full 6-field FEN (required for chess.js)
  correctMove: string;       // SAN without '#', e.g. "Qe8"
  matingPieceId: ChessPieceId;
  matingPieceSquare: string; // Starting square of mating piece
  targetSquare: string;      // Destination square
  difficulty: 1 | 2 | 3;
}

// ============================================================
// Movement Puzzles — 10 per piece type, 60 total
// Each puzzle has the piece on an otherwise empty or same-color-blocked board.
// FEN uses only the piece-placement portion (8 ranks separated by /).
// Tier 1 (easy): center/open square, empty board
// Tier 2 (medium): edge rank/file, OR 1 white pawn blocker for complex pieces
// Tier 3 (hard): near edge/corner, 1-2 white pawn blockers
// ============================================================

export const movementPuzzles: MovementPuzzle[] = [
  // -------------------------------------------------------
  // Rook (moves along ranks and files) — 10 puzzles
  // Existing: rook-move-1 (T1), rook-move-2 (T1), rook-move-3 (T2)
  // New: 2xT1, 2xT2, 3xT3 → totals: 4xT1, 3xT2, 3xT3
  // -------------------------------------------------------
  {
    id: 'rook-move-1',
    pieceId: 'rook',
    fen: '8/8/8/8/4R3/8/8/8',
    pieceSquare: 'e4',
    validTargets: [
      'e1', 'e2', 'e3', 'e5', 'e6', 'e7', 'e8',
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
      'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
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
      'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd8',
      'a7', 'b7', 'c7', 'e7', 'f7', 'g7', 'h7',
    ],
    difficulty: 2,
  },
  // New rook puzzles
  {
    id: 'rook-move-1-1',
    pieceId: 'rook',
    fen: '8/8/8/3R4/8/8/8/8',
    pieceSquare: 'd5',
    validTargets: [
      'a5', 'b5', 'c5', 'e5', 'f5', 'g5', 'h5',
      'd1', 'd2', 'd3', 'd4', 'd6', 'd7', 'd8',
    ],
    difficulty: 1,
  },
  {
    id: 'rook-move-1-2',
    pieceId: 'rook',
    fen: '8/8/8/8/8/5R2/8/8',
    pieceSquare: 'f3',
    validTargets: [
      'a3', 'b3', 'c3', 'd3', 'e3', 'g3', 'h3',
      'f1', 'f2', 'f4', 'f5', 'f6', 'f7', 'f8',
    ],
    difficulty: 1,
  },
  {
    id: 'rook-move-2-1',
    pieceId: 'rook',
    fen: '8/8/8/R7/8/8/8/8',
    pieceSquare: 'a5',
    validTargets: [
      'a1', 'a2', 'a3', 'a4', 'a6', 'a7', 'a8',
      'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    ],
    difficulty: 2,
  },
  {
    id: 'rook-move-2-2',
    pieceId: 'rook',
    fen: '8/7R/8/8/8/8/8/8',
    pieceSquare: 'h7',
    validTargets: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h8',
      'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7',
    ],
    difficulty: 2,
  },
  {
    id: 'rook-move-3-1',
    pieceId: 'rook',
    fen: '8/8/3P4/8/3R4/8/8/8',
    pieceSquare: 'd4',
    validTargets: [
      'd1', 'd2', 'd3', 'd5',
      'a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'h4',
    ],
    difficulty: 3,
  },
  {
    id: 'rook-move-3-2',
    pieceId: 'rook',
    fen: '8/8/8/8/P3R3/8/8/8',
    pieceSquare: 'e4',
    validTargets: [
      'b4', 'c4', 'd4', 'f4', 'g4', 'h4',
      'e1', 'e2', 'e3', 'e5', 'e6', 'e7', 'e8',
    ],
    difficulty: 3,
  },
  {
    id: 'rook-move-3-3',
    pieceId: 'rook',
    fen: '8/8/8/8/4R3/4P3/8/8',
    pieceSquare: 'e4',
    validTargets: [
      'e5', 'e6', 'e7', 'e8',
      'a4', 'b4', 'c4', 'd4', 'f4', 'g4', 'h4',
    ],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // Bishop (moves diagonally) — 10 puzzles
  // Existing: bishop-move-1 (T1), bishop-move-2 (T2), bishop-move-3 (T2)
  // New: 3xT1, 1xT2, 3xT3 → totals: 4xT1, 3xT2, 3xT3
  // -------------------------------------------------------
  {
    id: 'bishop-move-1',
    pieceId: 'bishop',
    fen: '8/8/8/8/3B4/8/8/8',
    pieceSquare: 'd4',
    validTargets: [
      'a1', 'b2', 'c3',
      'e5', 'f6', 'g7', 'h8',
      'e3', 'f2', 'g1',
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
      'b2', 'a3',
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
      'e6', 'd7', 'c8',
      'g6', 'h7',
      'e4', 'd3', 'c2', 'b1',
      'g4', 'h3',
    ],
    difficulty: 2,
  },
  // New bishop puzzles
  {
    id: 'bishop-move-1-1',
    pieceId: 'bishop',
    fen: '8/8/8/8/4B3/8/8/8',
    pieceSquare: 'e4',
    validTargets: [
      'a8', 'b7', 'c6', 'd5', 'f3', 'g2', 'h1',
      'b1', 'c2', 'd3', 'f5', 'g6', 'h7',
    ],
    difficulty: 1,
  },
  {
    id: 'bishop-move-1-2',
    pieceId: 'bishop',
    fen: '8/8/8/8/8/3B4/8/8',
    pieceSquare: 'd3',
    validTargets: [
      'a6', 'b5', 'c4', 'e2', 'f1',
      'b1', 'c2', 'e4', 'f5', 'g6', 'h7',
    ],
    difficulty: 1,
  },
  {
    id: 'bishop-move-1-3',
    pieceId: 'bishop',
    fen: '8/8/8/8/8/8/8/B7',
    pieceSquare: 'a1',
    validTargets: [
      'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8',
    ],
    difficulty: 1,
  },
  {
    id: 'bishop-move-2-1',
    pieceId: 'bishop',
    fen: '8/7B/8/8/8/8/8/8',
    pieceSquare: 'h7',
    validTargets: [
      'b1', 'c2', 'd3', 'e4', 'f5', 'g6', 'g8',
    ],
    difficulty: 2,
  },
  {
    id: 'bishop-move-3-1',
    pieceId: 'bishop',
    fen: '8/8/6P1/8/4B3/8/2P5/8',
    pieceSquare: 'e4',
    validTargets: [
      'a8', 'b7', 'c6', 'd5',
      'd3', 'f3', 'f5', 'g2', 'h1',
    ],
    difficulty: 3,
  },
  {
    id: 'bishop-move-3-2',
    pieceId: 'bishop',
    fen: '8/6B1/8/4P3/8/8/8/8',
    pieceSquare: 'g7',
    validTargets: [
      'f6', 'f8', 'h6', 'h8',
    ],
    difficulty: 3,
  },
  {
    id: 'bishop-move-3-3',
    pieceId: 'bishop',
    fen: '8/8/4P3/8/2B5/P7/8/8',
    pieceSquare: 'c4',
    validTargets: [
      'a2', 'a6', 'b3', 'b5', 'd3', 'd5', 'e2', 'f1',
    ],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // Queen (moves like rook + bishop) — 10 puzzles
  // Existing: queen-move-1 (T2), queen-move-2 (T2), queen-move-3 (T3)
  // New: 3xT1, 2xT2, 2xT3 → totals: 3xT1, 4xT2, 3xT3
  // -------------------------------------------------------
  {
    id: 'queen-move-1',
    pieceId: 'queen',
    fen: '8/8/8/8/3Q4/8/8/8',
    pieceSquare: 'd4',
    validTargets: [
      'd1', 'd2', 'd3', 'd5', 'd6', 'd7', 'd8',
      'a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'h4',
      'a1', 'b2', 'c3',
      'e5', 'f6', 'g7', 'h8',
      'e3', 'f2', 'g1',
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
      'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
      'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
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
      'e1', 'e2', 'e3', 'e4', 'e6', 'e7', 'e8',
      'a5', 'b5', 'c5', 'd5', 'f5', 'g5', 'h5',
      'd6', 'c7', 'b8',
      'f6', 'g7', 'h8',
      'd4', 'c3', 'b2', 'a1',
      'f4', 'g3', 'h2',
    ],
    difficulty: 3,
  },
  // New queen puzzles
  {
    id: 'queen-move-1-1',
    pieceId: 'queen',
    fen: '8/8/8/3Q4/8/8/8/8',
    pieceSquare: 'd5',
    validTargets: [
      'a2', 'a5', 'a8', 'b3', 'b5', 'b7',
      'c4', 'c5', 'c6', 'd1', 'd2', 'd3', 'd4', 'd6', 'd7', 'd8',
      'e4', 'e5', 'e6', 'f3', 'f5', 'f7', 'g2', 'g5', 'g8', 'h1', 'h5',
    ],
    difficulty: 1,
  },
  {
    id: 'queen-move-1-2',
    pieceId: 'queen',
    fen: '8/8/4Q3/8/8/8/8/8',
    pieceSquare: 'e6',
    validTargets: [
      'a2', 'a6', 'b3', 'b6', 'c4', 'c6', 'c8',
      'd5', 'd6', 'd7', 'e1', 'e2', 'e3', 'e4', 'e5', 'e7', 'e8',
      'f5', 'f6', 'f7', 'g4', 'g6', 'g8', 'h3', 'h6',
    ],
    difficulty: 1,
  },
  {
    id: 'queen-move-1-3',
    pieceId: 'queen',
    fen: '8/8/8/8/5Q2/8/8/8',
    pieceSquare: 'f4',
    validTargets: [
      'a4', 'b4', 'b8', 'c1', 'c4', 'c7', 'd2', 'd4', 'd6',
      'e3', 'e4', 'e5', 'f1', 'f2', 'f3', 'f5', 'f6', 'f7', 'f8',
      'g3', 'g4', 'g5', 'h2', 'h4', 'h6',
    ],
    difficulty: 1,
  },
  {
    id: 'queen-move-2-1',
    pieceId: 'queen',
    fen: '8/Q7/8/8/8/8/8/8',
    pieceSquare: 'a7',
    validTargets: [
      'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a8',
      'b6', 'b7', 'b8', 'c5', 'c7', 'd4', 'd7', 'e3', 'e7', 'f2', 'f7', 'g1', 'g7', 'h7',
    ],
    difficulty: 2,
  },
  {
    id: 'queen-move-2-2',
    pieceId: 'queen',
    fen: '8/8/8/8/8/8/8/7Q',
    pieceSquare: 'h1',
    validTargets: [
      'a8', 'b1', 'b7', 'c1', 'c6', 'd1', 'd5', 'e1', 'e4', 'f1', 'f3', 'g1', 'g2', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8',
    ],
    difficulty: 2,
  },
  {
    id: 'queen-move-3-1',
    pieceId: 'queen',
    fen: '8/8/3P4/8/3Q4/3P4/8/8',
    pieceSquare: 'd4',
    validTargets: [
      'a1', 'a4', 'a7', 'b2', 'b4', 'b6', 'c3', 'c4', 'c5',
      'd5', 'e3', 'e4', 'e5', 'f2', 'f4', 'f6', 'g1', 'g4', 'g7', 'h4', 'h8',
    ],
    difficulty: 3,
  },
  {
    id: 'queen-move-3-2',
    pieceId: 'queen',
    fen: '8/8/3P4/8/3Q1P2/8/8/8',
    pieceSquare: 'd4',
    validTargets: [
      'a1', 'a4', 'a7', 'b2', 'b4', 'b6', 'c3', 'c4', 'c5',
      'd1', 'd2', 'd3', 'd5', 'e3', 'e4', 'e5', 'f2', 'f6', 'g1', 'g7', 'h8',
    ],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // Knight (L-shape: 2+1 or 1+2 squares) — 10 puzzles
  // Existing: knight-move-1 (T1), knight-move-2 (T1), knight-move-3 (T2)
  // New: 2xT1, 2xT2, 3xT3 → totals: 4xT1, 3xT2, 3xT3
  // -------------------------------------------------------
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
  // New knight puzzles
  {
    id: 'knight-move-1-1',
    pieceId: 'knight',
    fen: '8/8/8/4N3/8/8/8/8',
    pieceSquare: 'e5',
    validTargets: [
      'c4', 'c6', 'd3', 'd7', 'f3', 'f7', 'g4', 'g6',
    ],
    difficulty: 1,
  },
  {
    id: 'knight-move-1-2',
    pieceId: 'knight',
    fen: '8/8/8/8/5N2/8/8/8',
    pieceSquare: 'f4',
    validTargets: [
      'd3', 'd5', 'e2', 'e6', 'g2', 'g6', 'h3', 'h5',
    ],
    difficulty: 1,
  },
  {
    id: 'knight-move-2-1',
    pieceId: 'knight',
    fen: '8/8/8/8/8/8/8/4N3',
    pieceSquare: 'e1',
    validTargets: [
      'c2', 'd3', 'f3', 'g2',
    ],
    difficulty: 2,
  },
  {
    id: 'knight-move-2-2',
    pieceId: 'knight',
    fen: '8/8/8/N7/8/8/8/8',
    pieceSquare: 'a5',
    validTargets: [
      'b3', 'b7', 'c4', 'c6',
    ],
    difficulty: 2,
  },
  {
    id: 'knight-move-3-1',
    pieceId: 'knight',
    fen: 'N7/8/8/8/8/8/8/8',
    pieceSquare: 'a8',
    validTargets: [
      'b6', 'c7',
    ],
    difficulty: 3,
  },
  {
    id: 'knight-move-3-2',
    pieceId: 'knight',
    fen: '7N/8/8/8/8/8/8/8',
    pieceSquare: 'h8',
    validTargets: [
      'f7', 'g6',
    ],
    difficulty: 3,
  },
  {
    id: 'knight-move-3-3',
    pieceId: 'knight',
    fen: '8/8/8/8/8/8/8/7N',
    pieceSquare: 'h1',
    validTargets: [
      'f2', 'g3',
    ],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // King (moves one square in any direction) — 10 puzzles
  // Existing: king-move-1 (T1), king-move-2 (T1), king-move-3 (T1)
  // New: 0xT1, 4xT2, 3xT3 → totals: 3xT1, 4xT2, 3xT3
  // -------------------------------------------------------
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
  // New king puzzles
  {
    id: 'king-move-1-1',
    pieceId: 'king',
    fen: '8/8/8/3K4/8/8/8/8',
    pieceSquare: 'd5',
    validTargets: [
      'c4', 'c5', 'c6', 'd4', 'd6', 'e4', 'e5', 'e6',
    ],
    difficulty: 1,
  },
  {
    id: 'king-move-2-1',
    pieceId: 'king',
    fen: '8/8/8/8/8/8/8/4K3',
    pieceSquare: 'e1',
    validTargets: [
      'd1', 'd2', 'e2', 'f1', 'f2',
    ],
    difficulty: 2,
  },
  {
    id: 'king-move-2-2',
    pieceId: 'king',
    fen: '8/8/8/K7/8/8/8/8',
    pieceSquare: 'a5',
    validTargets: [
      'a4', 'a6', 'b4', 'b5', 'b6',
    ],
    difficulty: 2,
  },
  {
    id: 'king-move-2-3',
    pieceId: 'king',
    fen: '8/8/4K3/8/8/8/8/8',
    pieceSquare: 'e6',
    validTargets: [
      'd5', 'd6', 'd7', 'e5', 'e7', 'f5', 'f6', 'f7',
    ],
    difficulty: 2,
  },
  {
    id: 'king-move-2-4',
    pieceId: 'king',
    fen: '8/8/8/8/6K1/8/8/8',
    pieceSquare: 'g4',
    validTargets: [
      'f3', 'f4', 'f5', 'g3', 'g5', 'h3', 'h4', 'h5',
    ],
    difficulty: 2,
  },
  {
    id: 'king-move-3-1',
    pieceId: 'king',
    fen: '7K/8/8/8/8/8/8/8',
    pieceSquare: 'h8',
    validTargets: [
      'g7', 'g8', 'h7',
    ],
    difficulty: 3,
  },
  {
    id: 'king-move-3-2',
    pieceId: 'king',
    fen: '8/8/8/8/8/8/8/7K',
    pieceSquare: 'h1',
    validTargets: [
      'g1', 'g2', 'h2',
    ],
    difficulty: 3,
  },
  {
    id: 'king-move-3-3',
    pieceId: 'king',
    fen: 'K7/8/8/8/8/8/8/8',
    pieceSquare: 'a8',
    validTargets: [
      'a7', 'b7', 'b8',
    ],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // Pawn (moves forward; 1 or 2 from starting rank) — 10 puzzles
  // Existing: pawn-move-1 (T1), pawn-move-2 (T1), pawn-move-3 (T1)
  // New: 2xT1, 3xT2, 2xT3 → totals: 5xT1, 3xT2, 2xT3
  // -------------------------------------------------------
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
  // New pawn puzzles
  {
    id: 'pawn-move-1-1',
    pieceId: 'pawn',
    fen: '8/8/8/8/8/8/3P4/8',
    pieceSquare: 'd2',
    validTargets: [
      'd3', 'd4',
    ],
    difficulty: 1,
  },
  {
    id: 'pawn-move-1-2',
    pieceId: 'pawn',
    fen: '8/8/8/8/8/8/6P1/8',
    pieceSquare: 'g2',
    validTargets: [
      'g3', 'g4',
    ],
    difficulty: 1,
  },
  {
    id: 'pawn-move-2-1',
    pieceId: 'pawn',
    fen: '8/8/8/3P4/8/8/8/8',
    pieceSquare: 'd5',
    validTargets: [
      'd6',
    ],
    difficulty: 2,
  },
  {
    id: 'pawn-move-2-2',
    pieceId: 'pawn',
    fen: '8/8/8/8/6P1/8/8/8',
    pieceSquare: 'g4',
    validTargets: [
      'g5',
    ],
    difficulty: 2,
  },
  {
    id: 'pawn-move-2-3',
    pieceId: 'pawn',
    fen: '8/8/8/8/2P5/8/8/8',
    pieceSquare: 'c4',
    validTargets: [
      'c5',
    ],
    difficulty: 2,
  },
  {
    id: 'pawn-move-3-1',
    pieceId: 'pawn',
    fen: '8/8/8/8/8/3P4/8/8',
    pieceSquare: 'd3',
    validTargets: [
      'd4',
    ],
    difficulty: 3,
  },
  {
    id: 'pawn-move-3-2',
    pieceId: 'pawn',
    fen: '8/4P3/8/8/8/8/8/8',
    pieceSquare: 'e7',
    validTargets: [
      'e8',
    ],
    difficulty: 3,
  },
];

// ============================================================
// Capture Puzzles — 10 per piece type, 30 total
// White pieces (uppercase FEN) are the player's pieces.
// A single black piece (lowercase FEN) is the target to capture.
// Exactly one white piece can legally capture the target.
// Tier 1 (easy): 1 distractor, obvious attacker (rook/queen/king straight line)
// Tier 2 (medium): 1-2 distractors, bishop/knight attacker (diagonal or L-shape)
// Tier 3 (hard): 2-3 distractors, any piece, plausible-looking distractors
// ============================================================

export const capturePuzzles: CapturePuzzle[] = [
  // -------------------------------------------------------
  // Rook captures — 6 total (2 existing + 4 new)
  // -------------------------------------------------------
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
    id: 'capture-rook-2-1',
    fen: '8/8/4p3/8/1N6/2B5/8/4R3',
    targetSquare: 'e6',
    correctPieceSquare: 'e1',
    correctPieceId: 'rook',
    targetPieceId: 'pawn',
    distractorSquares: ['c3', 'b4'],
    difficulty: 2,
  },
  {
    id: 'capture-rook-2-2',
    fen: '8/7r/8/8/2B5/8/8/7R',
    targetSquare: 'h7',
    correctPieceSquare: 'h1',
    correctPieceId: 'rook',
    targetPieceId: 'rook',
    distractorSquares: ['c4'],
    difficulty: 2,
  },
  {
    id: 'capture-rook-1-1',
    fen: '8/8/7p/3B4/8/8/8/7R',
    targetSquare: 'h6',
    correctPieceSquare: 'h1',
    correctPieceId: 'rook',
    targetPieceId: 'pawn',
    distractorSquares: ['d5'],
    difficulty: 1,
  },
  {
    id: 'capture-rook-3-1',
    fen: '8/2q5/8/8/1N6/4R3/8/2R5',
    targetSquare: 'c7',
    correctPieceSquare: 'c1',
    correctPieceId: 'rook',
    targetPieceId: 'queen',
    distractorSquares: ['b4', 'e3'],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // Bishop captures — 6 total (1 existing + 5 new)
  // -------------------------------------------------------
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
    id: 'capture-bishop-1-1',
    fen: '8/8/8/8/3p4/8/1B6/R7',
    targetSquare: 'd4',
    correctPieceSquare: 'b2',
    correctPieceId: 'bishop',
    targetPieceId: 'pawn',
    distractorSquares: ['a1'],
    difficulty: 1,
  },
  {
    id: 'capture-bishop-2-1',
    fen: '8/8/8/1R6/3p4/8/1B6/8',
    targetSquare: 'd4',
    correctPieceSquare: 'b2',
    correctPieceId: 'bishop',
    targetPieceId: 'pawn',
    distractorSquares: ['b5'],
    difficulty: 2,
  },
  {
    id: 'capture-bishop-2-2',
    fen: '8/8/5R2/8/2n5/8/8/5B2',
    targetSquare: 'c4',
    correctPieceSquare: 'f1',
    correctPieceId: 'bishop',
    targetPieceId: 'knight',
    distractorSquares: ['f6'],
    difficulty: 2,
  },
  {
    id: 'capture-bishop-3-1',
    fen: '8/8/8/7N/4p3/8/6B1/8',
    targetSquare: 'e4',
    correctPieceSquare: 'g2',
    correctPieceId: 'bishop',
    targetPieceId: 'pawn',
    distractorSquares: ['h5'],
    difficulty: 3,
  },
  {
    id: 'capture-bishop-3-2',
    fen: '8/8/2R5/8/3p4/8/8/B4Q2',
    targetSquare: 'd4',
    correctPieceSquare: 'a1',
    correctPieceId: 'bishop',
    targetPieceId: 'pawn',
    distractorSquares: ['c6', 'f1'],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // Knight captures — 6 total (2 existing + 4 new)
  // -------------------------------------------------------
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
    id: 'capture-knight-2',
    fen: '8/8/8/6r1/3P4/5N2/B7/8',
    targetSquare: 'g5',
    correctPieceSquare: 'f3',
    correctPieceId: 'knight',
    targetPieceId: 'rook',
    distractorSquares: ['a2', 'd4'],
    difficulty: 2,
  },
  {
    id: 'capture-knight-1-1',
    fen: '8/4p3/8/5N2/8/1R6/8/8',
    targetSquare: 'e7',
    correctPieceSquare: 'f5',
    correctPieceId: 'knight',
    targetPieceId: 'pawn',
    distractorSquares: ['b3'],
    difficulty: 1,
  },
  {
    id: 'capture-knight-2-1',
    fen: '8/8/4b3/8/3N4/7R/8/8',
    targetSquare: 'e6',
    correctPieceSquare: 'd4',
    correctPieceId: 'knight',
    targetPieceId: 'bishop',
    distractorSquares: ['h3'],
    difficulty: 2,
  },
  {
    id: 'capture-knight-2-2',
    fen: '8/8/8/8/4p3/2N5/5B2/8',
    targetSquare: 'e4',
    correctPieceSquare: 'c3',
    correctPieceId: 'knight',
    targetPieceId: 'pawn',
    distractorSquares: ['f2'],
    difficulty: 2,
  },
  {
    id: 'capture-knight-3-1',
    fen: '8/3p4/B7/4N1R1/8/8/8/8',
    targetSquare: 'd7',
    correctPieceSquare: 'e5',
    correctPieceId: 'knight',
    targetPieceId: 'pawn',
    distractorSquares: ['a6', 'g5'],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // Queen captures — 6 total (1 existing + 5 new)
  // -------------------------------------------------------
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
    id: 'capture-queen-1-1',
    fen: '8/4p3/8/8/8/8/2N5/4Q3',
    targetSquare: 'e7',
    correctPieceSquare: 'e1',
    correctPieceId: 'queen',
    targetPieceId: 'pawn',
    distractorSquares: ['c2'],
    difficulty: 1,
  },
  {
    id: 'capture-queen-2-1',
    fen: '8/8/1q6/8/8/4Q3/8/4R3',
    targetSquare: 'b6',
    correctPieceSquare: 'e3',
    correctPieceId: 'queen',
    targetPieceId: 'queen',
    distractorSquares: ['e1'],
    difficulty: 2,
  },
  {
    id: 'capture-queen-2-2',
    fen: '8/4B3/8/6Q1/8/8/6r1/8',
    targetSquare: 'g2',
    correctPieceSquare: 'g5',
    correctPieceId: 'queen',
    targetPieceId: 'rook',
    distractorSquares: ['e7'],
    difficulty: 2,
  },
  {
    id: 'capture-queen-3-1',
    fen: '8/8/3b4/8/8/Q4N2/8/2R5',
    targetSquare: 'd6',
    correctPieceSquare: 'a3',
    correctPieceId: 'queen',
    targetPieceId: 'bishop',
    distractorSquares: ['f3', 'c1'],
    difficulty: 3,
  },
  {
    id: 'capture-queen-3-2',
    fen: '8/8/1R4n1/8/3p3Q/8/8/8',
    targetSquare: 'd4',
    correctPieceSquare: 'h4',
    correctPieceId: 'queen',
    targetPieceId: 'pawn',
    distractorSquares: ['g6', 'b6'],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // King captures — 5 total (1 existing + 4 new)
  // -------------------------------------------------------
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
    id: 'capture-king-2-1',
    fen: '8/8/2p5/3K4/8/R7/8/8',
    targetSquare: 'c6',
    correctPieceSquare: 'd5',
    correctPieceId: 'king',
    targetPieceId: 'pawn',
    distractorSquares: ['a3'],
    difficulty: 2,
  },
  {
    id: 'capture-king-2-2',
    fen: '8/8/8/6p1/5K2/4R3/8/8',
    targetSquare: 'g5',
    correctPieceSquare: 'f4',
    correctPieceId: 'king',
    targetPieceId: 'pawn',
    distractorSquares: ['e3'],
    difficulty: 2,
  },
  {
    id: 'capture-king-3-1',
    fen: '8/8/8/8/3p4/3NK3/8/2B5',
    targetSquare: 'd4',
    correctPieceSquare: 'e3',
    correctPieceId: 'king',
    targetPieceId: 'pawn',
    distractorSquares: ['d3', 'c2'],
    difficulty: 3,
  },
  {
    id: 'capture-king-3-2',
    fen: '8/2p1B3/1K6/4N3/8/8/8/8',
    targetSquare: 'c7',
    correctPieceSquare: 'b6',
    correctPieceId: 'king',
    targetPieceId: 'pawn',
    distractorSquares: ['e7', 'e5'],
    difficulty: 3,
  },

  // -------------------------------------------------------
  // Pawn captures — 5 total (1 existing + 4 new)
  // -------------------------------------------------------
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
    id: 'capture-pawn-2-1',
    fen: '8/8/8/4p3/3P4/8/8/R7',
    targetSquare: 'e5',
    correctPieceSquare: 'd4',
    correctPieceId: 'pawn',
    targetPieceId: 'pawn',
    distractorSquares: ['a1'],
    difficulty: 2,
  },
  {
    id: 'capture-pawn-2-2',
    fen: '8/8/8/8/6n1/B4P2/8/8',
    targetSquare: 'g4',
    correctPieceSquare: 'f3',
    correctPieceId: 'pawn',
    targetPieceId: 'knight',
    distractorSquares: ['a3'],
    difficulty: 2,
  },
  {
    id: 'capture-pawn-3-1',
    fen: '8/8/3r4/2P5/1N6/5B2/8/8',
    targetSquare: 'd6',
    correctPieceSquare: 'c5',
    correctPieceId: 'pawn',
    targetPieceId: 'rook',
    distractorSquares: ['b4', 'f3'],
    difficulty: 3,
  },
  {
    id: 'capture-pawn-3-2',
    fen: '8/8/2p5/1P6/3B4/1R6/3N4/8',
    targetSquare: 'c6',
    correctPieceSquare: 'b5',
    correctPieceId: 'pawn',
    targetPieceId: 'pawn',
    distractorSquares: ['d4', 'b3', 'd2'],
    difficulty: 3,
  },
];

// ============================================================
// Checkmate Puzzles — mate-in-1, 5 per mating piece type, 20 total
// Full 6-field FEN required for chess.js isCheckmate() validation
// Tier 1 (easy): obvious mate, minimal defenders
// Tier 2 (medium): one defender to navigate
// Tier 3 (hard): multiple defenders, longer piece travel
// ============================================================

export const checkmatePuzzles: CheckmatePuzzle[] = [
  // -------------------------------------------------------
  // Queen puzzles (5)
  // -------------------------------------------------------
  {
    id: 'mate-queen-1',
    fen: '6k1/5ppp/8/8/8/8/8/4Q1K1 w - - 0 1',
    correctMove: 'Qe8',
    matingPieceId: 'queen',
    matingPieceSquare: 'e1',
    targetSquare: 'e8',
    difficulty: 1,
  },
  {
    id: 'mate-queen-2',
    fen: '6k1/6p1/6Kp/8/8/8/8/7Q w - - 0 1',
    correctMove: 'Qa8',
    matingPieceId: 'queen',
    matingPieceSquare: 'h1',
    targetSquare: 'a8',
    difficulty: 1,
  },
  {
    id: 'mate-queen-3',
    fen: '1k6/8/K1Q5/8/8/8/8/8 w - - 0 1',
    correctMove: 'Qb7',
    matingPieceId: 'queen',
    matingPieceSquare: 'c6',
    targetSquare: 'b7',
    difficulty: 2,
  },
  {
    id: 'mate-queen-4',
    fen: '3r2k1/4Qppp/8/8/8/8/8/6K1 w - - 0 1',
    correctMove: 'Qxd8',
    matingPieceId: 'queen',
    matingPieceSquare: 'e7',
    targetSquare: 'd8',
    difficulty: 2,
  },
  {
    id: 'mate-queen-5',
    fen: '6k1/6pp/6Qp/8/8/8/8/6K1 w - - 0 1',
    correctMove: 'Qe8',
    matingPieceId: 'queen',
    matingPieceSquare: 'g6',
    targetSquare: 'e8',
    difficulty: 3,
  },
  // -------------------------------------------------------
  // Rook puzzles (5)
  // -------------------------------------------------------
  {
    id: 'mate-rook-1',
    fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
    correctMove: 'Ra8',
    matingPieceId: 'rook',
    matingPieceSquare: 'a1',
    targetSquare: 'a8',
    difficulty: 1,
  },
  {
    id: 'mate-rook-2',
    fen: 'r5k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
    correctMove: 'Rxa8',
    matingPieceId: 'rook',
    matingPieceSquare: 'a1',
    targetSquare: 'a8',
    difficulty: 1,
  },
  {
    id: 'mate-rook-3',
    fen: '5k2/7R/5K2/8/8/8/8/8 w - - 0 1',
    correctMove: 'Rh8',
    matingPieceId: 'rook',
    matingPieceSquare: 'h7',
    targetSquare: 'h8',
    difficulty: 2,
  },
  {
    id: 'mate-rook-4',
    fen: '5k2/4pppp/8/8/8/8/8/3R3K w - - 0 1',
    correctMove: 'Rd8',
    matingPieceId: 'rook',
    matingPieceSquare: 'd1',
    targetSquare: 'd8',
    difficulty: 2,
  },
  {
    id: 'mate-rook-5',
    fen: 'k7/2R5/K7/8/8/8/8/8 w - - 0 1',
    correctMove: 'Rc8',
    matingPieceId: 'rook',
    matingPieceSquare: 'c7',
    targetSquare: 'c8',
    difficulty: 3,
  },
  // -------------------------------------------------------
  // Bishop puzzles (5)
  // -------------------------------------------------------
  {
    id: 'mate-bishop-1',
    fen: 'k7/8/KR6/1B6/8/8/8/8 w - - 0 1',
    correctMove: 'Bc6',
    matingPieceId: 'bishop',
    matingPieceSquare: 'b5',
    targetSquare: 'c6',
    difficulty: 1,
  },
  {
    id: 'mate-bishop-2',
    fen: '7k/8/6RK/6B1/8/8/8/8 w - - 0 1',
    correctMove: 'Bf6',
    matingPieceId: 'bishop',
    matingPieceSquare: 'g5',
    targetSquare: 'f6',
    difficulty: 1,
  },
  {
    id: 'mate-bishop-3',
    fen: 'k7/8/KR6/8/2B5/8/8/8 w - - 0 1',
    correctMove: 'Bd5',
    matingPieceId: 'bishop',
    matingPieceSquare: 'c4',
    targetSquare: 'd5',
    difficulty: 2,
  },
  {
    id: 'mate-bishop-4',
    fen: '7k/8/6RK/8/5B2/8/8/8 w - - 0 1',
    correctMove: 'Be5',
    matingPieceId: 'bishop',
    matingPieceSquare: 'f4',
    targetSquare: 'e5',
    difficulty: 2,
  },
  {
    id: 'mate-bishop-5',
    fen: '7k/8/6RK/8/8/4B3/8/8 w - - 0 1',
    correctMove: 'Bd4',
    matingPieceId: 'bishop',
    matingPieceSquare: 'e3',
    targetSquare: 'd4',
    difficulty: 3,
  },
  // -------------------------------------------------------
  // Knight puzzles (5)
  // -------------------------------------------------------
  {
    id: 'mate-knight-1',
    fen: '6rk/5ppp/7N/8/8/8/8/6K1 w - - 0 1',
    correctMove: 'Nxf7',
    matingPieceId: 'knight',
    matingPieceSquare: 'h6',
    targetSquare: 'f7',
    difficulty: 1,
  },
  {
    id: 'mate-knight-2',
    fen: '5brk/6pp/6pN/8/8/8/8/6K1 w - - 0 1',
    correctMove: 'Nf7',
    matingPieceId: 'knight',
    matingPieceSquare: 'h6',
    targetSquare: 'f7',
    difficulty: 2,
  },
  {
    id: 'mate-knight-3',
    fen: '5rkr/5ppp/6N1/8/8/8/8/6K1 w - - 0 1',
    correctMove: 'Ne7',
    matingPieceId: 'knight',
    matingPieceSquare: 'g6',
    targetSquare: 'e7',
    difficulty: 1,
  },
  {
    id: 'mate-knight-4',
    fen: '6nk/5ppp/7N/8/8/8/8/6K1 w - - 0 1',
    correctMove: 'Nxf7',
    matingPieceId: 'knight',
    matingPieceSquare: 'h6',
    targetSquare: 'f7',
    difficulty: 2,
  },
  {
    id: 'mate-knight-5',
    fen: '5rkr/4pppp/8/5N2/8/8/8/6K1 w - - 0 1',
    correctMove: 'Nxe7',
    matingPieceId: 'knight',
    matingPieceSquare: 'f5',
    targetSquare: 'e7',
    difficulty: 3,
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
