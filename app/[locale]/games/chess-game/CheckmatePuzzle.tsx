'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Chessboard } from 'react-chessboard';
import { useTranslations } from 'next-intl';
import Confetti from 'react-confetti';
import { chessPieces } from '@/data/chessPieces';
import { CheckmatePuzzle as CheckmatePuzzleData } from '@/data/chessPuzzles';
import { playAudio, playRandomCelebration, playSound, AudioSounds } from '@/utils/audio';
import { moveFenPiece } from '@/utils/chessFen';
import { useChessPieceTheme } from '@/hooks/useChessPieceTheme';

interface CheckmatePuzzleProps {
  puzzle: CheckmatePuzzleData;
  onAnswer: (correct: boolean) => void;
  onExit: () => void;
}

export default function CheckmatePuzzle({ puzzle, onAnswer, onExit }: CheckmatePuzzleProps) {
  const t = useTranslations('chessGame');
  const { pieces } = useChessPieceTheme();

  const [selectedPieceSquare, setSelectedPieceSquare] = useState<string | null>(null);
  const [flashSquare, setFlashSquare] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showCorrectConfetti, setShowCorrectConfetti] = useState(false);

  // displayFen is the piece-placement portion only (Chessboard takes piece-placement FEN)
  // Resets to puzzle's piece-placement FEN when puzzle.id changes
  const [displayFenPuzzleId, setDisplayFenPuzzleId] = useState(puzzle.id);
  const [displayFen, setDisplayFen] = useState(() => puzzle.fen.split(' ')[0]);
  if (displayFenPuzzleId !== puzzle.id) {
    setDisplayFenPuzzleId(puzzle.id);
    setDisplayFen(puzzle.fen.split(' ')[0]);
  }

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
  const matingPieceConfig = useMemo(
    () => chessPieces.find((p) => p.id === puzzle.matingPieceId)!,
    [puzzle.matingPieceId]
  );

  const resetFeedbackState = useCallback(() => {
    setSelectedPieceSquare(null);
    setFlashSquare(null);
    setFlashType(null);
    setShowTryAgain(false);
    setShowCorrectConfetti(false);
    setIsAdvancing(false);
  }, []);

  const handleSquareClick = useCallback(
    (square: string) => {
      if (isAdvancing) return;

      if (!selectedPieceSquare) {
        // First tap — must be the mating piece's square
        if (square === puzzle.matingPieceSquare) {
          setSelectedPieceSquare(square);
        }
        // Ignore taps on any other square
        return;
      }

      // Second tap — piece is already selected
      if (square === puzzle.targetSquare) {
        // CORRECT — animate the piece to target, celebrate
        setIsAdvancing(true);
        const piecePlacement = puzzle.fen.split(' ')[0];
        setDisplayFen(moveFenPiece(piecePlacement, puzzle.matingPieceSquare, puzzle.targetSquare));
        setFlashSquare(puzzle.matingPieceSquare);
        setFlashType('correct');
        setShowCorrectConfetti(true);
        playRandomCelebration();

        setTimeout(() => {
          resetFeedbackState();
          onAnswer(true);
        }, 1500);
      } else if (square === puzzle.matingPieceSquare) {
        // Tapped the same piece again — deselect
        setSelectedPieceSquare(null);
      } else {
        // WRONG target square
        playSound(AudioSounds.WRONG_ANSWER);
        onAnswer(false);
        setFlashSquare(square);
        setFlashType('wrong');
        setShowTryAgain(true);
        setSelectedPieceSquare(null);

        setTimeout(() => {
          setFlashSquare(null);
          setFlashType(null);
        }, 600);

        setTimeout(() => {
          setShowTryAgain(false);
        }, 1200);
      }
    },
    [isAdvancing, selectedPieceSquare, puzzle, onAnswer, resetFeedbackState]
  );

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Highlight selected mating piece with yellow glow
    if (selectedPieceSquare) {
      styles[selectedPieceSquare] = {
        boxShadow: 'inset 0 0 0 4px rgba(255, 215, 0, 0.7)',
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
  }, [selectedPieceSquare, flashSquare, flashType]);

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
      {/* Exit button row */}
      <Box sx={{ width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'flex-end' }}>
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
        p: 2,
        width: '100%',
        maxWidth: 480,
      }}>
        {/* Instruction text */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2, px: 1 }}>
          {t('ui.tapToCheckmate')}
        </Typography>

        {/* Board — always LTR regardless of locale */}
        <Box ref={containerRef} sx={{ direction: 'ltr', width: '100%', maxWidth: 480, margin: '0 auto' }}>
          <Chessboard
            options={{
              position: displayFen,
              allowDragging: false,
              onSquareClick: ({ square }: { square: string }) => handleSquareClick(square),
              squareStyles,
              boardOrientation: 'white' as const,
              animationDurationInMs: 200,
              boardStyle: { width: `${boardWidth}px`, maxWidth: '480px' },
              lightSquareStyle: { backgroundColor: '#f5ede1' },
              darkSquareStyle: { backgroundColor: '#dbc3e2' },
              darkSquareNotationStyle: { color: 'rgba(67, 66, 67, 0.5)' },
              lightSquareNotationStyle: { color: 'rgba(67, 66, 67, 0.5)' },
              pieces,
            }}
          />
        </Box>
      </Box>

      {/* Checkmate confirmation — shown after correct answer */}
      {isAdvancing && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, gap: 1 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 'bold', color: 'success.main', textAlign: 'center' }}
          >
            {t('ui.chessmate')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 'bold', cursor: 'pointer' }}
              onClick={() => playAudio(`chess/he/${matingPieceConfig.audioFile}`)}
            >
              {t(matingPieceConfig.translationKey as Parameters<typeof t>[0])}
            </Typography>
            <IconButton
              onClick={() => playAudio(`chess/he/${matingPieceConfig.audioFile}`)}
              aria-label="play audio"
              data-testid="piece-name-audio-button"
            >
              <VolumeUpIcon />
            </IconButton>
          </Box>
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
