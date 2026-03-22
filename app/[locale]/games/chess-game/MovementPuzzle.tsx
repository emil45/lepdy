'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Chessboard } from 'react-chessboard';
import { useTranslations } from 'next-intl';
import Confetti from 'react-confetti';
import { chessPieces } from '@/data/chessPieces';
import { movementPuzzles } from '@/data/chessPuzzles';
import { playRandomCelebration, playSound, AudioSounds } from '@/utils/audio';

// Build the ordered puzzle list at module level: King, Rook, Bishop, Queen, Knight, Pawn
// Each group sorted by difficulty (1, 2, 3), 3 puzzles per piece = 18 total
const PIECE_ORDER = chessPieces
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((p) => p.id);

const ORDERED_PUZZLES = PIECE_ORDER.flatMap((pieceId) =>
  movementPuzzles
    .filter((p) => p.pieceId === pieceId)
    .sort((a, b) => a.difficulty - b.difficulty)
);

interface MovementPuzzleProps {
  onComplete: () => void;
  completeLevel: (levelNum: number) => void;
}

export default function MovementPuzzle({ onComplete, completeLevel }: MovementPuzzleProps) {
  const t = useTranslations('chessGame');

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [wrongTapCount, setWrongTapCount] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [flashSquare, setFlashSquare] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showCorrectConfetti, setShowCorrectConfetti] = useState(false);

  // Responsive board sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(480);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setBoardWidth(Math.min(Math.max(w, 320), 480));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Derived puzzle values
  const puzzle = ORDERED_PUZZLES[puzzleIndex];
  const pieceConfig = chessPieces.find((p) => p.id === puzzle.pieceId)!;
  const piecePuzzles = ORDERED_PUZZLES.filter((p) => p.pieceId === puzzle.pieceId);
  const indexWithinPiece = piecePuzzles.findIndex((p) => p.id === puzzle.id) + 1;

  const resetFeedbackState = useCallback(() => {
    setWrongTapCount(0);
    setShowHints(false);
    setFlashSquare(null);
    setFlashType(null);
    setShowTryAgain(false);
    setShowCorrectConfetti(false);
    setIsAdvancing(false);
  }, []);

  const handlePuzzleSquareClick = useCallback(
    (square: string) => {
      if (isAdvancing || isComplete) return;
      if (square === puzzle.pieceSquare) return;

      if (puzzle.validTargets.includes(square)) {
        // Correct tap
        setFlashSquare(square);
        setFlashType('correct');
        setShowCorrectConfetti(true);
        playRandomCelebration();
        setIsAdvancing(true);

        setTimeout(() => {
          if (puzzleIndex === ORDERED_PUZZLES.length - 1) {
            // Last puzzle — level complete
            completeLevel(2);
            playSound(AudioSounds.CELEBRATION);
            setIsComplete(true);
            setTimeout(() => onComplete(), 3000);
          } else {
            setPuzzleIndex((prev) => prev + 1);
            resetFeedbackState();
          }
        }, 1500);
      } else {
        // Wrong tap — no sound per FEED-02
        setFlashSquare(square);
        setFlashType('wrong');
        setShowTryAgain(true);
        setWrongTapCount((prev) => {
          const next = prev + 1;
          if (next >= 2) setShowHints(true);
          return next;
        });

        setTimeout(() => {
          setFlashSquare(null);
          setFlashType(null);
        }, 600);

        setTimeout(() => {
          setShowTryAgain(false);
        }, 1200);
      }
    },
    [isAdvancing, isComplete, puzzle, puzzleIndex, completeLevel, onComplete, resetFeedbackState]
  );

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Always highlight the piece's current square
    styles[puzzle.pieceSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };

    // Show green dot hints on all valid targets after 2 wrong taps
    if (showHints) {
      for (const sq of puzzle.validTargets) {
        styles[sq] = {
          background: 'radial-gradient(circle, rgba(0,128,0,0.4) 25%, transparent 25%)',
          borderRadius: '50%',
        };
      }
    }

    // Flash correct square green
    if (flashSquare && flashType === 'correct') {
      styles[flashSquare] = { backgroundColor: 'rgba(0, 200, 0, 0.5)' };
    }

    // Flash wrong square orange
    if (flashSquare && flashType === 'wrong') {
      styles[flashSquare] = { backgroundColor: 'rgba(255, 100, 0, 0.4)' };
    }

    return styles;
  }, [puzzle.pieceSquare, showHints, puzzle.validTargets, flashSquare, flashType]);

  // Level complete screen
  if (isComplete) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3,
        }}
      >
        <Confetti recycle={false} numberOfPieces={300} />
        <Typography sx={{ fontSize: 96, lineHeight: 1 }}>&#x2605;</Typography>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', textAlign: 'center', px: 2 }}>
          {t('ui.levelComplete')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 2,
        px: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      {/* Overall progress: "3 / 18" */}
      <Typography
        data-testid="puzzle-progress"
        variant="body2"
        sx={{ color: 'text.secondary', mb: 0.5 }}
      >
        {puzzleIndex + 1} / {ORDERED_PUZZLES.length}
      </Typography>

      {/* Piece group label: "רץ 2/3" */}
      <Typography
        data-testid="piece-group-label"
        variant="body2"
        sx={{ color: 'text.secondary', mb: 1 }}
      >
        {t(pieceConfig.translationKey as Parameters<typeof t>[0])} {indexWithinPiece}/{piecePuzzles.length}
      </Typography>

      {/* Instruction text */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2, px: 1 }}>
        {t('ui.tapToMove', { piece: t(pieceConfig.translationKey as Parameters<typeof t>[0]) })}
      </Typography>

      {/* Board — always LTR regardless of locale */}
      <Box ref={containerRef} sx={{ direction: 'ltr', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <Chessboard
          options={{
            position: puzzle.fen,
            allowDragging: false,
            onSquareClick: ({ square }: { square: string }) => handlePuzzleSquareClick(square),
            squareStyles,
            boardOrientation: 'white' as const,
            animationDurationInMs: 200,
            boardStyle: { width: `${boardWidth}px`, maxWidth: '480px' },
          }}
        />
      </Box>

      {/* Try again overlay — shown after wrong tap */}
      {showTryAgain && (
        <Typography
          data-testid="try-again-text"
          variant="h6"
          sx={{ mt: 2, color: 'warning.main', fontWeight: 'bold', textAlign: 'center' }}
        >
          {t('ui.tryAgain')}
        </Typography>
      )}

      {/* Per-puzzle confetti burst on correct tap */}
      {showCorrectConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={80}
          gravity={0.3}
          style={{ position: 'fixed', top: 0, left: 0 }}
        />
      )}
    </Box>
  );
}
