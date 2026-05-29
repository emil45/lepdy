'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  keyframes,
} from '@mui/material';
import BackButton from '@/components/BackButton';
import FunButton from '@/components/FunButton';
import { useTranslations, useLocale } from 'next-intl';
import animals from '@/data/animals';
import shapes from '@/data/shapes';
import colors from '@/data/colors';
import numbers from '@/data/numbers';
import { shuffle } from '@/utils/common';
import Confetti from 'react-confetti';
import { AudioSounds, playSound, playAudio } from '@/utils/audio';
import { useGameAnalytics } from '@/hooks/useGameAnalytics';
import { useGamesProgressContext } from '@/contexts/GamesProgressContext';
import { useCelebration } from '@/hooks/useCelebration';
import Celebration from '@/components/Celebration';

// Types
type GameMode = 'animals' | 'shapes' | 'colors' | 'mixed';
type GameState = 'menu' | 'playing' | 'feedback' | 'finished';
type Difficulty = 'easy' | 'medium' | 'hard';

interface CountableItem {
  id: string;
  emoji?: string;
  element?: React.ReactElement;
  color: string;
  name: string;
  audioPath?: string;
}

interface RoundData {
  items: CountableItem[];
  count: number;
  correctAnswer: number;
  options: number[];
  itemType: CountableItem;
}

// Animation keyframes
const bounceAnimation = keyframes`
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.15) translateY(-8px); }
`;

const popInAnimation = keyframes`
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  60% { transform: scale(1.1) rotate(3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
`;

// Constants
const DIFFICULTY_SETTINGS: Record<Difficulty, { minCount: number; maxCount: number; optionsCount: number }> = {
  easy: { minCount: 1, maxCount: 3, optionsCount: 3 },
  medium: { minCount: 2, maxCount: 6, optionsCount: 4 },
  hard: { minCount: 4, maxCount: 10, optionsCount: 4 },
};

const ROUNDS_PER_GAME = 10;
const FEEDBACK_DELAY = 1500;
const ITEM_ANIMATION_DELAY = 100;

// Pastel colors for visual variety
const PASTEL_COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E0BBE4', '#FEC8D8', '#D4F0F0', '#CCE2CB', '#B6CFB6',
];

// Helper to convert accuracy percentage to star rating
function getStarRating(accuracy: number): number {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 50) return 1;
  return 0;
}

// Background gradients for answer buttons
const ANSWER_BACKGROUNDS = {
  correct: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
  incorrect: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
  default: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
} as const;

function getAnswerBackground(
  option: number,
  selectedAnswer: number | null,
  isCorrect: boolean | null
): string {
  if (selectedAnswer !== option) return ANSWER_BACKGROUNDS.default;
  if (isCorrect) return ANSWER_BACKGROUNDS.correct;
  return ANSWER_BACKGROUNDS.incorrect;
}

export default function CountingGameContent() {
  const t = useTranslations();
  const locale = useLocale();
  const { trackGameStarted, trackGameCompleted } = useGameAnalytics({ gameType: 'counting-game' });
  const { recordGameCompleted } = useGamesProgressContext();
  const { celebrationState, celebrate, resetCelebration } = useCelebration();

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [mode, setMode] = useState<GameMode>('animals');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [tappedItems, setTappedItems] = useState<Set<number>>(new Set());
  const [showFinalCelebration, setShowFinalCelebration] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get items based on mode
  const getItemsForMode = useCallback((): CountableItem[] => {
    const allItems: CountableItem[] = [];

    if (mode === 'animals' || mode === 'mixed') {
      animals.forEach((animal) => {
        allItems.push({
          id: animal.id,
          emoji: animal.imageUrl,
          color: animal.color,
          name: t(`animals.${animal.id}.name`),
          audioPath: `animals/he/${animal.audioFile}`,
        });
      });
    }

    if (mode === 'shapes' || mode === 'mixed') {
      shapes.forEach((shape) => {
        allItems.push({
          id: shape.id,
          element: shape.element,
          color: shape.color,
          name: t(`shapes.${shape.id}.name`),
          audioPath: `shapes/he/${shape.audioFile}`,
        });
      });
    }

    if (mode === 'colors' || mode === 'mixed') {
      colors.forEach((color) => {
        allItems.push({
          id: color.id,
          color: color.color,
          name: t(`colors.${color.id}.name`),
          audioPath: `colors/he/${color.audioFile}`,
        });
      });
    }

    return allItems;
  }, [mode, t]);

  // Generate a round
  const generateRound = useCallback(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const items = getItemsForMode();

    if (items.length === 0) {
      console.error('[counting-game] No items available for mode:', mode);
      return;
    }

    // Pick a random item type
    const itemType = items[Math.floor(Math.random() * items.length)];

    // Random count within difficulty range
    const count = Math.floor(Math.random() * (settings.maxCount - settings.minCount + 1)) + settings.minCount;

    // Create array of items to display
    const displayItems: CountableItem[] = [];
    // For colors mode or when a color item is selected, keep the original color
    // For animals/shapes, use pastel colors for visual variety
    const isColorItem = !itemType.emoji && !itemType.element;
    for (let i = 0; i < count; i++) {
      displayItems.push({
        ...itemType,
        color: isColorItem ? itemType.color : PASTEL_COLORS[i % PASTEL_COLORS.length],
      });
    }

    // Generate answer options
    const correctAnswer = count;
    const wrongAnswers: number[] = [];

    // Generate wrong answers close to correct answer
    for (let i = 1; wrongAnswers.length < settings.optionsCount - 1; i++) {
      if (correctAnswer - i >= 1 && !wrongAnswers.includes(correctAnswer - i)) {
        wrongAnswers.push(correctAnswer - i);
      }
      if (wrongAnswers.length < settings.optionsCount - 1 && correctAnswer + i <= 10 && !wrongAnswers.includes(correctAnswer + i)) {
        wrongAnswers.push(correctAnswer + i);
      }
    }

    const options = shuffle([correctAnswer, ...wrongAnswers.slice(0, settings.optionsCount - 1)]);

    setRoundData({
      items: displayItems,
      count,
      correctAnswer,
      options,
      itemType,
    });
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTappedItems(new Set());
  }, [difficulty, getItemsForMode, mode]);

  // Start game
  const startGame = () => {
    setGameState('playing');
    setRound(1);
    setScore(0);
    setStreak(0);
    trackGameStarted();
    generateRound();
    playSound(AudioSounds.GAME_START);
  };

  // Handle answer selection
  const handleAnswer = (answer: number) => {
    if (selectedAnswer !== null || !roundData) return;

    setSelectedAnswer(answer);
    const correct = answer === roundData.correctAnswer;
    setIsCorrect(correct);
    setGameState('feedback');

    if (correct) {
      playSound(AudioSounds.SUCCESS);
      setScore((prev) => prev + 10 + streak * 2);
      setStreak((prev) => prev + 1);

      // Play the number audio
      const numberData = numbers.find((n) => n.id === `number_${answer}`);
      if (numberData) {
        setTimeout(() => {
          playAudio(`numbers/he/${numberData.audioFile}`);
        }, 300);
      }

      // Milestone celebration every 5 correct answers
      if ((score / 10 + 1) % 5 === 0) {
        celebrate('milestone');
      }
    } else {
      playSound(AudioSounds.WRONG_ANSWER);
      setStreak(0);
    }

    // Next round or finish
    setTimeout(() => {
      if (round >= ROUNDS_PER_GAME) {
        // Game complete
        const finalScore = correct ? score + 10 + streak * 2 : score;
        trackGameCompleted(finalScore);
        recordGameCompleted('counting-game', finalScore);
        setGameState('finished');
        setShowFinalCelebration(true);
        celebrate('gameComplete');
      } else {
        setRound((prev) => prev + 1);
        setGameState('playing');
        generateRound();
      }
    }, FEEDBACK_DELAY);
  };

  // Handle item tap (for counting help and feedback)
  const handleItemTap = (index: number) => {
    if (gameState !== 'playing' || !roundData) return;

    setTappedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
        playSound(AudioSounds.POP);

        // Play item audio if it's an animal
        if (roundData.itemType.audioPath && mode === 'animals') {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          audioRef.current = new Audio(`/audio/${roundData.itemType.audioPath}`);
          audioRef.current.play().catch((error) => {
            console.error('[counting-game] Failed to play item audio:', error.message);
          });
        }
      }
      return newSet;
    });
  };

  // Reset game
  const resetGame = () => {
    setGameState('menu');
    setShowFinalCelebration(false);
    setRound(0);
    setScore(0);
    setStreak(0);
    setRoundData(null);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Input label style for RTL support
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

  // Render menu
  const renderMenu = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, p: 2 }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 500, width: '100%', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Mode Selection */}
          <FormControl fullWidth>
            <InputLabel sx={getInputLabelSx(locale === 'he')}>{t('games.countingGame.mode')}</InputLabel>
            <Select
              value={mode}
              onChange={(e: SelectChangeEvent) => setMode(e.target.value as GameMode)}
              sx={selectSx}
            >
              <MenuItem value="animals">🐾 {t('games.countingGame.modes.animals')}</MenuItem>
              <MenuItem value="shapes">🔷 {t('games.countingGame.modes.shapes')}</MenuItem>
              <MenuItem value="colors">🎨 {t('games.countingGame.modes.colors')}</MenuItem>
              <MenuItem value="mixed">🎯 {t('games.countingGame.modes.mixed')}</MenuItem>
            </Select>
          </FormControl>

          {/* Difficulty Selection */}
          <FormControl fullWidth>
            <InputLabel sx={getInputLabelSx(locale === 'he')}>{t('games.countingGame.difficulty')}</InputLabel>
            <Select
              value={difficulty}
              onChange={(e: SelectChangeEvent) => setDifficulty(e.target.value as Difficulty)}
              sx={selectSx}
            >
              <MenuItem value="easy">🌟 {t('games.countingGame.difficulties.easy')} (1-3)</MenuItem>
              <MenuItem value="medium">⭐ {t('games.countingGame.difficulties.medium')} (2-6)</MenuItem>
              <MenuItem value="hard">🔥 {t('games.countingGame.difficulties.hard')} (4-10)</MenuItem>
            </Select>
          </FormControl>

          <FunButton onClick={startGame} text={`🎮 ${t('games.countingGame.start')}`} />
        </Box>
      </Paper>
    </Box>
  );

  // Render game
  const renderGame = () => {
    if (!roundData) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, p: 2 }}>
        {/* Progress Header */}
        <Paper elevation={3} sx={{ p: 2, borderRadius: 3, width: '100%', maxWidth: 600 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              {t('games.countingGame.round')} {round}/{ROUNDS_PER_GAME}
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#4CAF50' }}>
              {streak >= 3 && '🔥'} {t('games.countingGame.score')}: {score}
            </Typography>
          </Box>
        </Paper>

        {/* Question */}
        <Typography variant="h5" fontWeight="bold" sx={{ textAlign: 'center' }}>
          {t('games.countingGame.howMany')} {roundData.itemType.name}?
        </Typography>

        {/* Items Display */}
        <Paper
          elevation={6}
          sx={{
            p: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: 200,
            width: '100%',
            maxWidth: 500,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {roundData.items.map((item, index) => (
            <Box
              key={index}
              onClick={() => handleItemTap(index)}
              sx={{
                cursor: 'pointer',
                animation: `${popInAnimation} 0.4s ease-out ${index * ITEM_ANIMATION_DELAY}ms both`,
                '&:active': {
                  animation: `${bounceAnimation} 0.3s ease`,
                },
                transform: tappedItems.has(index) ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.2s ease',
                filter: tappedItems.has(index) ? 'drop-shadow(0 0 8px gold)' : 'none',
                position: 'relative',
              }}
            >
              {/* Tap indicator */}
              {tappedItems.has(index) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    zIndex: 1,
                  }}
                >
                  {Array.from(tappedItems).sort((a, b) => a - b).indexOf(index) + 1}
                </Box>
              )}

              {/* Item content */}
              {item.emoji ? (
                <Typography sx={{ fontSize: '3.5rem', lineHeight: 1 }}>
                  {item.emoji}
                </Typography>
              ) : item.element ? (
                <Box sx={{ width: 70, height: 70 }}>
                  <svg
                    width="70"
                    height="70"
                    viewBox="0 0 24 24"
                    fill={item.color}
                    style={{ display: 'block' }}
                  >
                    {item.element}
                  </svg>
                </Box>
              ) : (
                /* Color mode - show colored circles */
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    border: item.color === 'white' ? '2px solid #ccc' : 'none',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  }}
                />
              )}
            </Box>
          ))}
        </Paper>

        {/* Tap hint */}
        <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
          {t('games.countingGame.tapToCount')}
        </Typography>

        {/* Answer Options */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, maxWidth: 400 }}>
          {roundData.options.map((option) => (
            <Paper
              key={option}
              elevation={selectedAnswer === option ? 8 : 4}
              onClick={() => handleAnswer(option)}
              sx={{
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
                cursor: selectedAnswer === null ? 'pointer' : 'default',
                background: getAnswerBackground(option, selectedAnswer, isCorrect),
                animation:
                  selectedAnswer === option && !isCorrect
                    ? `${shakeAnimation} 0.4s ease`
                    : 'none',
                transition: 'all 0.2s ease',
                '&:hover': selectedAnswer === null
                  ? {
                      transform: 'scale(1.05)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    }
                  : {},
              }}
            >
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  color: selectedAnswer === option ? 'white' : '#333',
                }}
              >
                {option}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Feedback Message */}
        {gameState === 'feedback' && (
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              color: isCorrect ? '#4CAF50' : '#f44336',
              animation: `${popInAnimation} 0.3s ease-out`,
            }}
          >
            {isCorrect ? t('games.countingGame.correct') : t('games.countingGame.incorrect')}
          </Typography>
        )}
      </Box>
    );
  };

  // Render results
  const renderResults = () => {
    const accuracy = Math.round((score / (ROUNDS_PER_GAME * 10)) * 100);
    const stars = getStarRating(accuracy);

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
            🎉 {t('games.countingGame.gameComplete')} 🎉
          </Typography>
        </Paper>

        {/* Stars */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[1, 2, 3].map((star) => (
            <Typography
              key={star}
              sx={{
                fontSize: '3rem',
                opacity: star <= stars ? 1 : 0.3,
                animation: star <= stars ? `${popInAnimation} 0.5s ease-out ${star * 200}ms both` : 'none',
              }}
            >
              ⭐
            </Typography>
          ))}
        </Box>

        <Paper elevation={6} sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 3 }}>
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 3, color: '#FF6B6B', fontWeight: 'bold' }}>
            {score} {t('games.countingGame.points')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              📊 {t('games.countingGame.accuracy')}: {accuracy}%
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              🎯 {t('games.countingGame.mode')}: {t(`games.countingGame.modes.${mode}`)}
            </Typography>
          </Box>
        </Paper>

        <FunButton onClick={resetGame} text={`🎮 ${t('games.countingGame.playAgain')}`} />
      </Box>
    );
  };

  return (
    <>
      <BackButton href="/games" />
      {showFinalCelebration && <Confetti recycle={false} numberOfPieces={300} />}
      <Celebration celebrationState={celebrationState} onComplete={resetCelebration} />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '85vh',
        }}
      >
        {gameState === 'menu' && renderMenu()}
        {(gameState === 'playing' || gameState === 'feedback') && renderGame()}
        {gameState === 'finished' && renderResults()}
      </Box>
    </>
  );
}
