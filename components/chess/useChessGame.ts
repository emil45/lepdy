'use client';

import { useState, useCallback, useRef } from 'react';
import { Chess, Square, Piece } from 'chess.js';

export interface ChessGameState {
  fen: string;
  selectedSquare: Square | null;
  legalMoves: Square[];
  legalCaptures: Square[];
  selectSquare: (square: Square) => void;
  makeMove: (from: Square, to: Square) => boolean;
  reset: (fen?: string) => void;
  getSquarePiece: (square: Square) => Piece | null;
  getGame: () => Chess;
}

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function useChessGame(initialFen?: string): ChessGameState {
  const startFen = initialFen ?? DEFAULT_FEN;
  const gameRef = useRef<Chess>(new Chess(startFen));
  const [fen, setFen] = useState(startFen);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [legalCaptures, setLegalCaptures] = useState<Square[]>([]);

  const makeMove = useCallback((from: Square, to: Square): boolean => {
    try {
      gameRef.current.move({ from, to });
      setFen(gameRef.current.fen());
      setSelectedSquare(null);
      setLegalMoves([]);
      setLegalCaptures([]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const selectSquare = useCallback((square: Square) => {
    const game = gameRef.current;

    // If a square is already selected and the tapped square is a legal move, make the move
    if (selectedSquare && legalMoves.includes(square)) {
      makeMove(selectedSquare, square);
      return;
    }

    // If tapping the already-selected square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      setLegalCaptures([]);
      return;
    }

    // Check if the square has a piece of the current turn's color
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map((m) => m.to as Square));
      setLegalCaptures(moves.filter((m) => m.captured).map((m) => m.to as Square));
      return;
    }

    // Empty square or opponent piece with nothing selected — do nothing
    setSelectedSquare(null);
    setLegalMoves([]);
    setLegalCaptures([]);
  }, [selectedSquare, legalMoves, makeMove]);

  const reset = useCallback((newFen?: string) => {
    const resetFen = newFen ?? startFen;
    gameRef.current = new Chess(resetFen);
    setFen(resetFen);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLegalCaptures([]);
  }, [startFen]);

  const getSquarePiece = useCallback((square: Square): Piece | null => {
    return gameRef.current.get(square) || null;
  }, []);

  const getGame = useCallback((): Chess => {
    return gameRef.current;
  }, []);

  return {
    fen,
    selectedSquare,
    legalMoves,
    legalCaptures,
    selectSquare,
    makeMove,
    reset,
    getSquarePiece,
    getGame,
  };
}
