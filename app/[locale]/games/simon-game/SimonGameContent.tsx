'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { styled } from '@mui/system';
import BackButton from '@/components/BackButton';
import { preloadSounds, playSound, AudioSounds, stopAllSounds } from '@/utils/audio';
import FunButton from '@/components/FunButton';
import { Color, COLORS, colorToAudioSound, GameState } from '@/models/SimonGameModels';
import { useTranslations } from 'next-intl';
import { submitScore, getTopScore } from '@/lib/firebase';
import { useGameAnalytics } from '@/hooks/useGameAnalytics';
import { useCelebration } from '@/hooks/useCelebration';
import Celebration from '@/components/Celebration';
import { useGamesProgressContext } from '@/contexts/GamesProgressContext';

export const INITIAL_DELAY = 1000;
export const INITIAL_SEQUENCE_DELAY = 500;

const SimonButton = styled(Button)(({ theme }) => ({
  width: '45%',
  height: '45%',
  margin: '2.5%',
  borderRadius: '50%',
  transition: 'transform 0.3s, filter 0.3s',
  border: 'none',
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  '&:nth-of-type(1)': {
    backgroundColor: '#8BC34A',
  },
  '&:nth-of-type(2)': {
    backgroundColor: '#FF6F61',
  },
  '&:nth-of-type(3)': {
    backgroundColor: '#FFD700',
  },
  '&:nth-of-type(4)': {
    backgroundColor: '#42A5F5',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

const SimonContainer = styled(Box)(({ theme }) => ({
  width: '500px',
  height: '500px',
  borderRadius: '25%',
  backgroundColor: '#FFF3E0',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
  boxShadow: '0 0 30px rgba(0,0,0,0.2)',
  [theme.breakpoints.down('sm')]: {
    width: '300px',
    height: '300px',
  },
}));

export default function SimonGameContent() {
  const t = useTranslations();
  const { trackGameStarted, trackGameCompleted } = useGameAnalytics({ gameType: 'simon-game' });
  const { celebrationState, celebrate, resetCelebration } = useCelebration();
  const { recordGameCompleted } = useGamesProgressContext();
  const [sequence, setSequence] = useState<Color[]>([]);
  const [userStep, setUserStep] = useState(0); // Simplified: just track current step instead of full array
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [globalHighScore, setGlobalHighScore] = useState(0);
  const [globalHighScoreDate, setGlobalHighScoreDate] = useState<Date | null>(null);
  const [activeColor, setActiveColor] = useState<Color | null>(null);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const shouldPlayRef = useRef(false);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    preloadSounds();
    getTopScore('simon').then((record) => {
      if (record) {
        setGlobalHighScore(record.score);
        setGlobalHighScoreDate(new Date(record.timestamp));
      }
    });

    return () => {
      clearAllTimeouts();
      stopAllSounds();
    };
  }, []);

  const getSequenceDelay = useCallback(() => {
    return Math.max(INITIAL_SEQUENCE_DELAY - score * 10, 100);
  }, [score]);

  const lightUp = useCallback((color: Color, duration: number) => {
    setActiveColor(color);
    playSound(colorToAudioSound[color]);
    const timeout = setTimeout(() => setActiveColor(null), duration);
    timeoutsRef.current.push(timeout);
  }, []);

  const addToSequence = useCallback(() => {
    const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    shouldPlayRef.current = true;
    setSequence((prev) => [...prev, newColor]);
  }, []);

  const playSequence = useCallback(() => {
    clearAllTimeouts();
    setGameState(GameState.SEQUENCE);
    const sequenceDelay = getSequenceDelay();
    sequence.forEach((color, index) => {
      const timeout = setTimeout(() => lightUp(color, sequenceDelay), INITIAL_DELAY + index * sequenceDelay * 2);
      timeoutsRef.current.push(timeout);
    });

    const endTimeout = setTimeout(
      () => {
        setGameState(GameState.USER_INPUT);
      },
      INITIAL_DELAY + sequence.length * sequenceDelay * 2
    );
    timeoutsRef.current.push(endTimeout);
  }, [sequence, lightUp, getSequenceDelay]);

  const startGame = useCallback(() => {
    clearAllTimeouts();
    setSequence([]);
    setUserStep(0);
    setScore(0);
    setGameState(GameState.IDLE);
    playSound(AudioSounds.GAME_START);
    trackGameStarted();
    addToSequence();
  }, [addToSequence, trackGameStarted]);

  const handleColorClick = useCallback(
    (color: Color) => {
      if (gameState !== GameState.USER_INPUT) return;

      lightUp(color, getSequenceDelay() / 2);

      // Check if user clicked correct color
      if (color !== sequence[userStep]) {
        setGameState(GameState.GAME_OVER);
        playSound(AudioSounds.GAME_OVER);
        trackGameCompleted(score);
        recordGameCompleted('simon-game', score);
        return;
      }

      const nextStep = userStep + 1;
      if (nextStep === sequence.length) {
        // Completed sequence
        const newScore = score + 1;
        setScore(newScore);
        setHighScore((prev) => Math.max(prev, newScore));
        setUserStep(0);
        playSound(AudioSounds.SUCCESS);
        // Celebrate milestones every 5 levels
        if (newScore % 5 === 0) {
          celebrate('milestone');
        }
        // Submit if new world record
        if (newScore > globalHighScore) {
          submitScore('simon', newScore);
          setGlobalHighScore(newScore);
          setGlobalHighScoreDate(new Date());
        }
        const timeout = setTimeout(() => addToSequence(), INITIAL_DELAY);
        timeoutsRef.current.push(timeout);
      } else {
        setUserStep(nextStep);
      }
    },
    [gameState, getSequenceDelay, lightUp, sequence, userStep, score, addToSequence, globalHighScore, celebrate, recordGameCompleted]
  );

  useEffect(() => {
    if (shouldPlayRef.current && sequence.length) {
      shouldPlayRef.current = false;
      // Defer to avoid synchronous setState in effect
      const timeout = setTimeout(playSequence, 0);
      timeoutsRef.current.push(timeout);
    }
  }, [sequence, playSequence]);

  return (
    <>
      <Celebration celebrationState={celebrationState} onComplete={resetCelebration} />
      <BackButton href="/games" />
      <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
        <Typography variant="h4" align="center" sx={{ mb: 2 }}>
          {t('games.simonGame.score')}: {score} | {t('games.simonGame.highScore')}: {highScore}
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 2, opacity: 0.7 }}>
          🏆 {t('games.simonGame.globalHighScore')}:{' '}
          {globalHighScore > 0 && globalHighScoreDate
            ? `${globalHighScore} (${globalHighScoreDate.toLocaleDateString()})`
            : '---'}
        </Typography>
        <SimonContainer>
          {COLORS.map((color) => (
            <SimonButton
              key={color}
              style={{
                filter: activeColor === color ? 'brightness(160%)' : 'brightness(100%)',
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                handleColorClick(color);
              }}
              disabled={gameState !== GameState.USER_INPUT}
              aria-label={color}
            />
          ))}
        </SimonContainer>
        <Box mt={4}>
          <FunButton
            text={gameState === GameState.GAME_OVER ? t('games.simonGame.playAgain') : t('games.simonGame.startGame')}
            onClick={startGame}
          />
        </Box>
      </Box>
    </>
  );
}
