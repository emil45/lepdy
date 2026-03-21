'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Square } from 'chess.js';
import Box from '@mui/material/Box';
import { useChessGame, ChessGameState } from './useChessGame';

interface ChessBoardProps {
  initialFen?: string;
  boardWidth?: number;
  onMove?: (from: string, to: string) => void;
  gameRef?: React.MutableRefObject<ChessGameState | null>;
}

const MIN_BOARD_WIDTH = 448; // 56px * 8 squares
const MAX_BOARD_WIDTH = 480;

export default function ChessBoard({ initialFen, boardWidth: propWidth, onMove, gameRef }: ChessBoardProps) {
  const gameState = useChessGame(initialFen);
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(MAX_BOARD_WIDTH);

  // Expose game state to parent via ref
  useEffect(() => {
    if (gameRef) {
      gameRef.current = gameState;
    }
  }, [gameRef, gameState]);

  // Responsive sizing via ResizeObserver
  useEffect(() => {
    if (propWidth !== undefined) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const clamped = Math.max(MIN_BOARD_WIDTH, Math.min(width, MAX_BOARD_WIDTH));
        setMeasuredWidth(clamped);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [propWidth]);

  const computedWidth = propWidth ?? measuredWidth;

  const handleSquareClick = useCallback(({ square }: { piece: unknown; square: string }) => {
    const sq = square as Square;
    const prevSelected = gameState.selectedSquare;
    const prevLegalMoves = gameState.legalMoves;

    gameState.selectSquare(sq);

    // Check if a move was made (selected square existed and clicked square was a legal move)
    if (prevSelected && prevLegalMoves.includes(sq) && onMove) {
      onMove(prevSelected, sq);
    }
  }, [gameState, onMove]);

  // Compute highlight styles for selected square and legal moves
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (gameState.selectedSquare) {
      styles[gameState.selectedSquare] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      };
    }

    const captureSet = new Set(gameState.legalCaptures);

    for (const sq of gameState.legalMoves) {
      if (captureSet.has(sq)) {
        // Capture square — ring highlight
        styles[sq] = {
          background: 'radial-gradient(transparent 0%, transparent 79%, rgba(0,128,0,0.4) 80%)',
          borderRadius: '50%',
        };
      } else {
        // Empty square — dot highlight
        styles[sq] = {
          background: 'radial-gradient(circle, rgba(0,128,0,0.4) 25%, transparent 25%)',
          borderRadius: '50%',
        };
      }
    }

    return styles;
  }, [gameState.selectedSquare, gameState.legalMoves, gameState.legalCaptures]);

  // Board style to constrain width
  const boardStyle = useMemo(() => ({
    width: `${computedWidth}px`,
    maxWidth: `${MAX_BOARD_WIDTH}px`,
  }), [computedWidth]);

  return (
    <Box
      ref={containerRef}
      sx={{
        direction: 'ltr',
        width: 'fit-content',
        margin: '0 auto',
        maxWidth: MAX_BOARD_WIDTH,
      }}
    >
      <Chessboard
        options={{
          position: gameState.fen,
          allowDragging: false,
          onSquareClick: handleSquareClick,
          squareStyles,
          boardOrientation: 'white',
          animationDurationInMs: 200,
          boardStyle,
        }}
      />
    </Box>
  );
}
