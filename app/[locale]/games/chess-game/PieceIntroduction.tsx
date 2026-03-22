'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';
import Confetti from 'react-confetti';
import { chessPieces } from '@/data/chessPieces';
import { playAudio, playSound, AudioSounds } from '@/utils/audio';
import { useDirection } from '@/hooks/useDirection';

interface PieceIntroductionProps {
  onComplete: () => void;
  completeLevel: (levelNum: number) => void;
}

export default function PieceIntroduction({ onComplete, completeLevel }: PieceIntroductionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const t = useTranslations('chessGame');
  const direction = useDirection();

  const currentPiece = chessPieces[currentIndex];

  const handlePlayAudio = useCallback(() => {
    playAudio(`chess/he/${currentPiece.audioFile}`);
  }, [currentPiece.audioFile]);

  const handleNext = useCallback(() => {
    if (currentIndex < chessPieces.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Last piece — complete the level
      completeLevel(1);
      playSound(AudioSounds.CELEBRATION);
      setIsComplete(true);
      setTimeout(() => onComplete(), 3000);
    }
  }, [currentIndex, completeLevel, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

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

  const nextButtonProps = direction === 'rtl'
    ? { startIcon: <ArrowBackIcon /> }
    : { endIcon: <ArrowForwardIcon /> };
  const backButtonProps = direction === 'rtl'
    ? { endIcon: <ArrowForwardIcon /> }
    : { startIcon: <ArrowBackIcon /> };

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
      <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton
          onClick={onComplete}
          aria-label="exit"
          data-testid="exit-button"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* Dot progress indicator */}
        <Box
          data-testid="progress-dots"
          sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}
        >
          {chessPieces.map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: idx <= currentIndex ? 'primary.main' : 'grey.300',
                transition: 'bgcolor 0.2s',
              }}
            />
          ))}
        </Box>

        {/* Piece card */}
        <Box
          sx={{
            bgcolor: currentPiece.color,
            borderRadius: 4,
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: 96, sm: 120 },
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {currentPiece.symbol}
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontWeight: 'bold', mt: 2, textAlign: 'center' }}
          >
            {t(currentPiece.translationKey as Parameters<typeof t>[0])}
          </Typography>
          <IconButton
            onClick={handlePlayAudio}
            data-testid="audio-button"
            sx={{ mt: 2, width: 64, height: 64 }}
            aria-label="play audio"
          >
            <VolumeUpIcon sx={{ fontSize: 36 }} />
          </IconButton>
        </Box>

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={currentIndex === 0}
            {...backButtonProps}
          >
            {t('ui.back')}
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            data-testid="next-button"
            {...nextButtonProps}
          >
            {t('ui.next')}
          </Button>
        </Box>

        {/* Step counter */}
        <Typography
          variant="body2"
          data-testid="step-counter"
          sx={{ color: 'text.secondary' }}
        >
          {currentIndex + 1} / {chessPieces.length}
        </Typography>
      </Box>
    </Box>
  );
}
