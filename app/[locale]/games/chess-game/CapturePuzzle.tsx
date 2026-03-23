'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Chessboard } from 'react-chessboard';
import { useTranslations } from 'next-intl';
import Confetti from 'react-confetti';
import { chessPieces } from '@/data/chessPieces';
import { CapturePuzzle as CapturePuzzleData } from '@/data/chessPuzzles';
import { playAudio, playRandomCelebration } from '@/utils/audio';
import { moveFenPiece } from '@/utils/chessFen';
import { useChessPieceTheme } from '@/hooks/useChessPieceTheme';
import { useChessBoardTheme } from '@/hooks/useChessBoardTheme';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

interface CapturePuzzleProps {
  puzzle: CapturePuzzleData;
  onAnswer: (correct: boolean) => void;
  onExit: () => void;
}

export default function CapturePuzzle({ puzzle, onAnswer, onExit }: CapturePuzzleProps) {
  const t = useTranslations('chessGame');
  const { pieces } = useChessPieceTheme();
  const { boardColors } = useChessBoardTheme();

  const [, setWrongTapCount] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [flashSquare, setFlashSquare] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showCorrectConfetti, setShowCorrectConfetti] = useState(false);
  // displayFen is animated during correct answer; resets to puzzle.fen when puzzle.id changes
  const [displayFenPuzzleId, setDisplayFenPuzzleId] = useState(puzzle.id);
  const [displayFen, setDisplayFen] = useState(puzzle.fen);
  if (displayFenPuzzleId !== puzzle.id) {
    setDisplayFenPuzzleId(puzzle.id);
    setDisplayFen(puzzle.fen);
  }

  // Responsive board sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(480);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setBoardWidth(Math.max(w, 280));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Derived puzzle values
  const targetPieceConfig = chessPieces.find((p) => p.id === puzzle.targetPieceId)!;
  const correctPieceConfig = useMemo(
    () => chessPieces.find((p) => p.id === puzzle.correctPieceId)!,
    [puzzle.correctPieceId]
  );

  const resetFeedbackState = useCallback(() => {
    setWrongTapCount(0);
    setShowHints(false);
    setFlashSquare(null);
    setFlashType(null);
    setShowTryAgain(false);
    setShowCorrectConfetti(false);
    setIsAdvancing(false);
  }, []);

  const handleSquareClick = useCallback(
    (square: string) => {
      if (isAdvancing) return;
      // Ignore taps on the target piece itself
      if (square === puzzle.targetSquare) return;

      if (square === puzzle.correctPieceSquare) {
        // Correct tap
        setIsAdvancing(true);
        const newFen = moveFenPiece(puzzle.fen, puzzle.correctPieceSquare, puzzle.targetSquare);
        setDisplayFen(newFen);
        setFlashSquare(square);
        setFlashType('correct');
        setShowCorrectConfetti(true);
        playRandomCelebration();

        setTimeout(() => {
          resetFeedbackState();
          onAnswer(true);
        }, 1500);
      } else if (puzzle.distractorSquares.includes(square)) {
        // Wrong tap — no sound per FEED-02, gentle feedback only
        onAnswer(false);
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
      // Empty squares — do nothing
    },
    [isAdvancing, puzzle, onAnswer, resetFeedbackState]
  );

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Always: target square gets red/orange ring
    styles[puzzle.targetSquare] = {
      boxShadow: 'inset 0 0 0 4px rgba(220, 80, 40, 0.7)',
      borderRadius: '4px',
    };

    // After 2 wrong taps: correct piece square gets green glow hint
    if (showHints) {
      styles[puzzle.correctPieceSquare] = {
        boxShadow: 'inset 0 0 0 4px rgba(76, 175, 80, 0.7)',
        borderRadius: '4px',
      };
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
  }, [puzzle.targetSquare, puzzle.correctPieceSquare, showHints, flashSquare, flashType]);

  return (
    <Box
      sx={{
        py: 2,
        px: { xs: 0.5, sm: 1 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      {/* Exit button row */}
      <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 600, lg: 480 }, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton
          onClick={onExit}
          aria-label="exit"
          data-testid="exit-button"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Board card — instruction + board wrapped in soft-shadow beige card */}
      <Box sx={{
        bgcolor: '#f5ede1',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        p: { xs: 1, sm: 2 },
        width: '100%',
        maxWidth: { xs: '100%', sm: 600, lg: 480 },
      }}>
        {/* Instruction text */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2, px: 1 }}>
          {t('ui.tapToCapture', { piece: t(targetPieceConfig.translationKey as Parameters<typeof t>[0]) })}
        </Typography>

        {/* Board — always LTR regardless of locale */}
        <Box ref={containerRef} sx={{ direction: 'ltr', width: '100%', maxWidth: { xs: '100%', sm: 600, lg: 480 }, margin: '0 auto' }}>
          <Chessboard
            options={{
              position: displayFen,
              allowDragging: false,
              onSquareClick: ({ square }: { square: string }) => handleSquareClick(square),
              squareStyles,
              boardOrientation: 'white' as const,
              animationDurationInMs: 200,
              boardStyle: { width: `${boardWidth}px` },
              lightSquareStyle: { backgroundColor: boardColors.light },
              darkSquareStyle: { backgroundColor: boardColors.dark },
              darkSquareNotationStyle: { color: 'rgba(67, 66, 67, 0.5)' },
              lightSquareNotationStyle: { color: 'rgba(67, 66, 67, 0.5)' },
              pieces,
            }}
          />
        </Box>
      </Box>

      {/* Hebrew piece name reveal — shown after correct answer */}
      {isAdvancing && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mt: 2 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => playAudio(`chess/he/${correctPieceConfig.audioFile}`)}
          >
            {t(correctPieceConfig.translationKey as Parameters<typeof t>[0])}
          </Typography>
          <IconButton
            onClick={() => playAudio(`chess/he/${correctPieceConfig.audioFile}`)}
            aria-label="play audio"
            data-testid="piece-name-audio-button"
          >
            <VolumeUpIcon />
          </IconButton>
        </Box>
      )}

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
