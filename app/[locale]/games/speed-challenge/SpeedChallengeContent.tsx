'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
} from '@mui/material';
import BackButton from '@/components/BackButton';
import { useTranslations, useLocale } from 'next-intl';
import letters from '@/data/letters';
import numbers from '@/data/numbers';
import shapes from '@/data/shapes';
import animals from '@/data/animals';
import colors from '@/data/colors';
import { ModelTypesEnum } from '@/models/ModelsTypesEnum';
import { shuffle } from '@/utils/common';
import Confetti from 'react-confetti';
import FunButton from '@/components/FunButton';
import { AudioSounds, playSound } from '@/utils/audio';
import { useGameAnalytics } from '@/hooks/useGameAnalytics';
import { useGamesProgressContext } from '@/contexts/GamesProgressContext';

interface GameItem {
  id: string;
  name: string;
  displayName: string;
  color: string;
  audioPath: string | null;
  type: ModelTypesEnum;
  emoji?: string;
  element?: React.ReactElement;
}

interface GameStats {
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
  timeBonus: number;
}

// Constants
const DIFFICULTY_SETTINGS = {
  baby: { time: 10000, options: 2 },
  easy: { time: 6000, options: 2 },
  medium: { time: 4000, options: 3 },
  hard: { time: 2000, options: 4 },
} as const;

const AUDIO_PLAY_DELAY = 800;
const QUESTION_TRANSITION_DELAY = 1200;
const TIMEOUT_GRACE_PERIOD = 200;
const CELEBRATION_THRESHOLD = 0.7;

const CATEGORY_CONFIGS = [
  { data: letters, type: ModelTypesEnum.LETTERS, folder: 'letters', useFullName: true, translationKey: 'letters' },
  { data: numbers, type: ModelTypesEnum.NUMBERS, folder: 'numbers', useFullName: false, translationKey: 'numbers' },
  { data: shapes, type: ModelTypesEnum.SHAPES, folder: 'shapes', useFullName: false, translationKey: 'shapes', hasElement: true },
  { data: animals, type: ModelTypesEnum.ANIMALS, folder: null, useFullName: false, translationKey: 'animals', hasEmoji: true },
  { data: colors, type: ModelTypesEnum.COLORS, folder: 'colors', useFullName: false, translationKey: 'colors' },
] as const;

export default function SpeedChallengeContent() {
  const t = useTranslations();
  const locale = useLocale();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { trackGameStarted, trackGameCompleted } = useGameAnalytics({ gameType: 'speed-challenge' });
  const { recordGameCompleted } = useGamesProgressContext();

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [difficulty, setDifficulty] = useState<'baby' | 'easy' | 'medium' | 'hard'>('medium');
  const [category, setCategory] = useState<'mixed' | ModelTypesEnum>('mixed');
  const [questionsCount, setQuestionsCount] = useState<5 | 15 | 30>(15);
  const [currentItem, setCurrentItem] = useState<GameItem | null>(null);
  const [options, setOptions] = useState<GameItem[]>([]);
  const [timeLeft, setTimeLeft] = useState(3000);
  const [stats, setStats] = useState<GameStats>({
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    timeBonus: 0,
  });
  const [showItem, setShowItem] = useState(true);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(15);
  const [showCelebration, setShowCelebration] = useState(false);

  // Shared styles
  const getInputLabelSx = (isHebrew: boolean) => ({
    fontSize: '1.1rem',
    ...(isHebrew
      ? { right: '12px', left: 'auto', transform: 'translate(0, -5px) scale(0.75)', transformOrigin: 'top right', textAlign: 'right' }
      : { transform: 'translate(14px, -20px) scale(0.75)', transformOrigin: 'top left' }),
  });

  const selectSx = {
    fontSize: '1.1rem',
    '& .MuiOutlinedInput-notchedOutline': { marginTop: '8px' },
    marginTop: '12px',
  };

  const getDifficultySettings = (diff: string) => DIFFICULTY_SETTINGS[diff as keyof typeof DIFFICULTY_SETTINGS] ?? DIFFICULTY_SETTINGS.medium;

  // Stop any playing audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const getAllItems = useCallback((): GameItem[] => {
    return CATEGORY_CONFIGS.flatMap((config) =>
      (config.data as any[]).map((item: any) => ({
        id: item.id,
        name: t(`${config.translationKey}.${item.id}.name`),
        displayName: config.useFullName ? t(`${config.translationKey}.${item.id}.fullName`) : t(`${config.translationKey}.${item.id}.name`),
        color: item.color,
        audioPath: config.folder ? `${config.folder}/he/${item.audioFile}` : null,
        type: config.type,
        ...('hasElement' in config && config.hasElement && { element: item.element }),
        ...('hasEmoji' in config && config.hasEmoji && { emoji: item.imageUrl }),
      }))
    );
  }, [t]);

  const getFilteredItems = useCallback(() => {
    const allItems = getAllItems();
    if (category === 'mixed') return allItems;
    return allItems.filter((item) => item.type === category);
  }, [getAllItems, category]);

  const generateQuestion = useCallback(() => {
    stopAudio(); // Stop any previous audio

    const availableItems = getFilteredItems();
    const settings = getDifficultySettings(difficulty);

    if (availableItems.length === 0) return;

    const correctItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    const wrongItems = shuffle(availableItems.filter((item) => item.id !== correctItem.id)).slice(
      0,
      settings.options - 1
    );

    const allOptions = shuffle([correctItem, ...wrongItems]);

    // Set everything first, ensure showItem is true
    setShowItem(true);
    setCurrentItem(correctItem);
    setOptions(allOptions);

    // Reset timer immediately to ensure 100% start
    setTimeLeft(settings.time);

    // Play audio only if it exists (not for animals)
    if (correctItem.audioPath) {
      setTimeout(() => {
        stopAudio(); // Make sure no audio is playing
        audioRef.current = new Audio(`/audio/${correctItem.audioPath}`);
        audioRef.current.play().catch((e) => console.log('Audio play failed:', e));
      }, 800);
    }
  }, [getFilteredItems, difficulty]);

  const handleAnswer = (selectedItem: GameItem) => {
    // Prevent double-clicks and multiple rapid selections
    if (!currentItem || selectedItem.id === 'timeout') return;

    stopAudio(); // Stop audio immediately when answer is selected

    const isCorrect = selectedItem.id === currentItem?.id;
    const timeBonus = Math.floor(timeLeft / 100);

    // Calculate new question number BEFORE updating stats
    const newQuestionNumber = questionNumber + 1;

    // Temporarily clear currentItem to prevent multiple selections
    setCurrentItem(null);

    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: isCorrect ? prev.streak + 1 : 0,
      bestStreak: Math.max(prev.bestStreak, isCorrect ? prev.streak + 1 : prev.streak),
      timeBonus: prev.timeBonus + (isCorrect ? timeBonus : 0),
    }));

    if (isCorrect) {
      playSound(AudioSounds.SUCCESS);
    } else {
      playSound(AudioSounds.GAME_OVER);
    }

    // Check if game should end BEFORE updating question number
    if (newQuestionNumber >= maxQuestions) {
      // Game is finished, don't update question number or generate another question
      const finalScore = (stats.correct + (isCorrect ? 1 : 0)) * 100 + stats.timeBonus + (isCorrect ? timeBonus : 0);
      const finalCorrect = stats.correct + (isCorrect ? 1 : 0);
      const isHighAccuracy = finalCorrect >= maxQuestions * CELEBRATION_THRESHOLD;
      trackGameCompleted(finalScore);
      recordGameCompleted('speed-challenge', finalScore, { isHighAccuracy });
      setTimeout(() => {
        setGameState('finished');
        if (isHighAccuracy) {
          setShowCelebration(true);
        }
      }, 1200);
    } else {
      // Only update question number if game continues
      setQuestionNumber(newQuestionNumber);
      // Generate next question only if game isn't finished
      setTimeout(generateQuestion, 1200);
    }
  };

  const startGame = () => {
    setGameState('playing');
    setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0, timeBonus: 0 });
    setQuestionNumber(0);
    setMaxQuestions(questionsCount); // Set the selected question count
    trackGameStarted();
    generateQuestion();
  };

  const resetGame = () => {
    stopAudio();
    setGameState('menu');
    setShowCelebration(false);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let timeoutHandler: NodeJS.Timeout;

    if (gameState === 'playing' && timeLeft > 0 && currentItem) {
      // Count down timer - add small delay to ensure UI is fully rendered
      timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 100);
      }, 150); // Slightly longer delay to ensure progress bar renders at 100%
    } else if (gameState === 'playing' && timeLeft <= 0 && currentItem) {
      // Handle timeout after a brief delay to allow last-second clicks
      timeoutHandler = setTimeout(() => {
        if (currentItem) {
          // Double-check currentItem still exists
          stopAudio();

          const newQuestionNumber = questionNumber + 1;
          setCurrentItem(null);

          setStats((prev) => ({
            correct: prev.correct,
            total: prev.total + 1,
            streak: 0,
            bestStreak: prev.bestStreak,
            timeBonus: prev.timeBonus,
          }));

          playSound(AudioSounds.GAME_OVER);

          if (newQuestionNumber >= maxQuestions) {
            const isHighAccuracy = stats.correct >= maxQuestions * CELEBRATION_THRESHOLD;
            trackGameCompleted(stats.correct * 100 + stats.timeBonus);
            recordGameCompleted('speed-challenge', stats.correct * 100 + stats.timeBonus, { isHighAccuracy });
            setTimeout(() => {
              setGameState('finished');
            }, 1200);
          } else {
            setQuestionNumber(newQuestionNumber);
            setTimeout(generateQuestion, 1200);
          }
        }
      }, 200); // 200ms grace period for last-second clicks
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutHandler);
    };
  }, [timeLeft, gameState, currentItem, questionNumber, maxQuestions]);

  useEffect(() => {
    if (gameState === 'playing' && showItem && currentItem) {
      const hideTimer = setTimeout(() => {
        setShowItem(false);
      }, 1200);
      return () => clearTimeout(hideTimer);
    }
  }, [gameState, showItem, currentItem]);

  // Cleanup audio on unmount and reset game state on mount
  useEffect(() => {
    // Reset to menu state when component mounts
    setGameState('menu');
    setShowCelebration(false);
    stopAudio();

    return () => stopAudio();
  }, []);

  const renderGameMenu = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, p: 2 }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 500, width: '100%', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FormControl fullWidth>
            <InputLabel sx={getInputLabelSx(locale === 'he')}>{t('speedChallenge.questions')}</InputLabel>
            <Select
              value={questionsCount.toString()}
              onChange={(e: SelectChangeEvent) => setQuestionsCount(Number(e.target.value) as 5 | 15 | 30)}
              sx={selectSx}
            >
              <MenuItem value="5">🏃 5 {t('speedChallenge.questions')}</MenuItem>
              <MenuItem value="15">⚡ 15 {t('speedChallenge.questions')}</MenuItem>
              <MenuItem value="30">🎯 30 {t('speedChallenge.questions')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={getInputLabelSx(locale === 'he')}>{t('speedChallenge.difficulty')}</InputLabel>
            <Select value={difficulty} onChange={(e: SelectChangeEvent) => setDifficulty(e.target.value as any)} sx={selectSx}>
              <MenuItem value="baby">👶 10 {t('speedChallenge.seconds')}</MenuItem>
              <MenuItem value="easy">🐌 6 {t('speedChallenge.seconds')}</MenuItem>
              <MenuItem value="medium">🚀 4 {t('speedChallenge.seconds')}</MenuItem>
              <MenuItem value="hard">⚡ 2 {t('speedChallenge.seconds')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={getInputLabelSx(locale === 'he')}>{t('speedChallenge.category')}</InputLabel>
            <Select
              value={category === 'mixed' ? 'mixed' : category.toString()}
              onChange={(e: SelectChangeEvent) => setCategory(e.target.value === 'mixed' ? 'mixed' : (Number(e.target.value) as ModelTypesEnum))}
              sx={selectSx}
            >
              <MenuItem value="mixed">🎯 {t('speedChallenge.mixed')}</MenuItem>
              <MenuItem value={ModelTypesEnum.LETTERS.toString()}>🅰️ {t('speedChallenge.letters')}</MenuItem>
              <MenuItem value={ModelTypesEnum.NUMBERS.toString()}>1️⃣ {t('speedChallenge.numbers')}</MenuItem>
              <MenuItem value={ModelTypesEnum.SHAPES.toString()}>🟣 {t('speedChallenge.shapes')}</MenuItem>
              <MenuItem value={ModelTypesEnum.ANIMALS.toString()}>🐶 {t('speedChallenge.animals')}</MenuItem>
              <MenuItem value={ModelTypesEnum.COLORS.toString()}>🎨 {t('speedChallenge.colors')}</MenuItem>
            </Select>
          </FormControl>

          <FunButton onClick={startGame} text={`🚀 ${t('speedChallenge.start')}`} />
        </Box>
      </Paper>
    </Box>
  );

  const renderGame = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, p: 2 }}>
      {/* Game Header */}
      <Paper elevation={3} sx={{ p: 2, borderRadius: 3, width: '100%', maxWidth: 600 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {t('speedChallenge.question')} {questionNumber + 1}/{maxQuestions}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: stats.streak >= 3 ? '#4CAF50' : 'inherit',
              fontWeight: 'bold',
            }}
          >
            {stats.streak >= 3 && '🔥'} {t('speedChallenge.streak')}: {stats.streak}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={(timeLeft / getDifficultySettings(difficulty).time) * 100}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: timeLeft < 1000 ? '#f44336' : '#4caf50',
            },
          }}
        />
      </Paper>

      {/* Item Display */}
      <Paper
        elevation={8}
        sx={{
          p: 6,
          minHeight: 200,
          minWidth: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: showItem ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' : '#fff3e0',
          border: showItem ? '4px solid #2196F3' : '4px solid #f57c00',
          borderRadius: 4,
          transform: 'scale(1.05)',
          transition: 'all 0.3s ease',
        }}
      >
        {showItem && currentItem ? (
          <Typography
            variant="h1"
            sx={{
              color: currentItem.color,
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '4rem',
            }}
          >
            {currentItem.emoji ||
              (currentItem.element && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <svg
                    width="150"
                    height="150"
                    viewBox="0 0 24 24"
                    fill={currentItem.color}
                    style={{ display: 'block' }}
                  >
                    {currentItem.element}
                  </svg>
                </Box>
              )) ||
              currentItem.name}
          </Typography>
        ) : (
          <Typography variant="h5" sx={{ color: '#f57c00', fontWeight: 'bold', textAlign: 'center' }}>
            🤔 {t('speedChallenge.whatWasThat')}
          </Typography>
        )}
      </Paper>

      {/* Answer Options */}
      <Grid container spacing={3} sx={{ maxWidth: 700 }}>
        {options.map((option, index) => (
          <Grid size={{ xs: 6 }} key={option.id}>
            <Card
              elevation={4}
              sx={{
                cursor: currentItem ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                borderRadius: 3,
                opacity: currentItem ? 1 : 0.7,
                '&:hover': currentItem
                  ? {
                      elevation: 8,
                      transform: 'translateY(-4px)',
                      backgroundColor: '#e3f2fd',
                    }
                  : {},
                '&:active': currentItem
                  ? {
                      transform: 'translateY(-2px)',
                    }
                  : {},
              }}
              onClick={() => currentItem && handleAnswer(option)}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#333333', // Neutral dark color for all answers
                    fontWeight: 'bold',
                    fontSize: '1.3rem',
                  }}
                >
                  {option.displayName}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderResults = () => {
    const accuracy = Math.round((stats.correct / stats.total) * 100);
    const totalScore = stats.correct * 100 + stats.timeBonus;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, p: 2 }}>
        <Paper
          elevation={8}
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
            🎉 {t('speedChallenge.gameComplete')} 🎉
          </Typography>
        </Paper>

        <Paper elevation={6} sx={{ p: 4, maxWidth: 500, width: '100%', borderRadius: 3 }}>
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 4, color: '#FF6B6B', fontWeight: 'bold' }}>
            {totalScore} {t('speedChallenge.points')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              ✅ {t('speedChallenge.correct')}: {stats.correct}/{stats.total} ({accuracy}%)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              🔥 {t('speedChallenge.bestStreak')}: {stats.bestStreak}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              ⏱️ {t('speedChallenge.timeBonus')}: {stats.timeBonus}
            </Typography>
          </Box>
        </Paper>

        <FunButton onClick={resetGame} text={`🎮 ${t('speedChallenge.playAgain')}`} />
      </Box>
    );
  };

  return (
    <>
      <BackButton href="/games" />
      {showCelebration && <Confetti recycle={false} numberOfPieces={200} />}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '85vh',
        }}
      >
        {gameState === 'menu' && renderGameMenu()}
        {gameState === 'playing' && renderGame()}
        {gameState === 'finished' && renderResults()}
      </Box>
    </>
  );
}
