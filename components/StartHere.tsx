'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Modal, Paper, Button, keyframes } from '@mui/material';
import { useTranslations } from 'next-intl';
import { playSound, AudioSounds } from '@/utils/audio';
import { useStreakContext } from '@/contexts/StreakContext';

const FIRST_VISIT_COMPLETED_KEY = 'lepdy_start_here_completed';

const bounce = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7); }
  70% { box-shadow: 0 0 0 20px rgba(255, 107, 53, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
`;

const confettiFall = keyframes`
  0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const CONFETTI_COLORS = ['#ff6b35', '#ffa500', '#ffdd57', '#00c853', '#2196f3', '#9c27b0', '#e91e63'];

type Step = 'welcome' | 'letter' | 'celebration' | 'done';

interface StartHereProps {
  onComplete?: () => void;
}

export default function StartHere({ onComplete }: StartHereProps) {
  const t = useTranslations('startHere');
  const { recordActivity } = useStreakContext();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('welcome');
  const [letterPlayed, setLetterPlayed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Check if first visit on mount - delay to not affect LCP measurement
  useEffect(() => {
    const hasCompleted = localStorage.getItem(FIRST_VISIT_COMPLETED_KEY);
    if (!hasCompleted) {
      const timer = setTimeout(() => setOpen(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const playLetterSound = useCallback(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio('/audio/letters/he/aleph.mp3');
    audio.play().catch((error) => console.error('Error playing audio:', error));

    if (!letterPlayed) {
      setLetterPlayed(true);
      // Record activity for streak
      recordActivity();

      // Short delay then show celebration
      setTimeout(() => {
        playSound(AudioSounds.CELEBRATION);
        setShowConfetti(true);
        setStep('celebration');

        // Hide confetti after animation
        setTimeout(() => setShowConfetti(false), 3000);
      }, 1500);
    }
  }, [letterPlayed, recordActivity]);

  const handleStart = () => {
    setStep('letter');
  };

  const handleComplete = () => {
    localStorage.setItem(FIRST_VISIT_COMPLETED_KEY, new Date().toISOString());
    setOpen(false);
    onComplete?.();
  };

  // Confetti pieces — precompute once so positions stay stable across re-renders
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        left: Math.random() * 100,
        rounded: Math.random() > 0.5,
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 0.5,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    []
  );

  return (
    <Modal
      open={open}
      aria-labelledby="start-here-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: '90%',
          maxWidth: 400,
          p: 4,
          borderRadius: 4,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          animation: `${fadeIn} 0.3s ease-out`,
          background: 'linear-gradient(135deg, #fff9c4 0%, #fff3e0 100%)',
        }}
      >
        {/* Confetti overlay */}
        {showConfetti && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              zIndex: 10,
            }}
          >
            {confettiPieces.map((piece, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  left: `${piece.left}%`,
                  top: '-10px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: piece.color,
                  borderRadius: piece.rounded ? '50%' : '0',
                  animation: `${confettiFall} ${piece.duration}s linear forwards`,
                  animationDelay: `${piece.delay}s`,
                }}
              />
            ))}
          </Box>
        )}

        {/* Welcome Step */}
        {step === 'welcome' && (
          <Box sx={{ animation: `${fadeIn} 0.3s ease-out` }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                color: '#6a1b9a',
                fontWeight: 'bold',
                mb: 3,
              }}
            >
              {t('welcome')}
            </Typography>

            <Typography variant="body1" sx={{ mb: 4, color: '#5d4037' }}>
              {t('tapToHear')}
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={handleStart}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                borderRadius: 3,
                backgroundColor: '#7b1fa2',
                '&:hover': {
                  backgroundColor: '#6a1b9a',
                },
              }}
            >
              {t('letsGo')}
            </Button>
          </Box>
        )}

        {/* Letter Step */}
        {step === 'letter' && (
          <Box sx={{ animation: `${fadeIn} 0.3s ease-out` }}>
            <Typography variant="body1" sx={{ mb: 3, color: '#5d4037' }}>
              {t('tapToHear')}
            </Typography>

            <Box
              onClick={playLetterSound}
              sx={{
                width: 180,
                height: 180,
                mx: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                border: '4px solid #1976d2',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                animation: !letterPlayed ? `${pulse} 2s infinite` : undefined,
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: '6rem',
                  fontWeight: 'bold',
                  color: '#1565c0',
                  fontFamily: '"Noto Sans Hebrew", sans-serif',
                  lineHeight: 1,
                  animation: letterPlayed ? `${bounce} 0.5s ease` : undefined,
                }}
              >
                א
              </Typography>
            </Box>
          </Box>
        )}

        {/* Celebration Step */}
        {step === 'celebration' && (
          <Box sx={{ animation: `${fadeIn} 0.3s ease-out` }}>
            <Typography
              variant="h3"
              sx={{
                color: '#e65100',
                fontWeight: 'bold',
                mb: 2,
              }}
            >
              {t('greatJob')}
            </Typography>

            <Box
              sx={{
                fontSize: '4rem',
                mb: 2,
                animation: `${bounce} 1s infinite`,
              }}
            >
              🎉
            </Box>

            <Typography variant="body1" sx={{ mb: 2, color: '#5d4037' }}>
              {t('comeBackTomorrow')}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
              }}
            >
              <Typography sx={{ fontSize: '2rem' }}>🔥</Typography>
              <Typography
                variant="h6"
                sx={{ color: '#ff6b35', fontWeight: 'bold' }}
              >
                {t('streakStarted')}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleComplete}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                borderRadius: 3,
                backgroundColor: '#4caf50',
                '&:hover': {
                  backgroundColor: '#43a047',
                },
              }}
            >
              {t('continue')}
            </Button>
          </Box>
        )}
      </Paper>
    </Modal>
  );
}
