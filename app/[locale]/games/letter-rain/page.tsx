'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import { useTranslations } from 'next-intl';
import RoundFunButton from '@/components/RoundFunButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import FunButton from '@/components/FunButton';
import letters from '@/data/letters';
import { playSound, AudioSounds } from '@/utils/audio';
import { submitScore, getTopScore } from '@/lib/firebase';
import { useGameAnalytics } from '@/hooks/useGameAnalytics';
import { useCelebration } from '@/hooks/useCelebration';
import Celebration from '@/components/Celebration';
import { useGamesProgressContext } from '@/contexts/GamesProgressContext';
import numbers from '@/data/numbers';
import shapes from '@/data/shapes';
import { ModelTypesEnum } from '@/models/ModelsTypesEnum';

type ItemType = (typeof letters)[0] | (typeof numbers)[0] | (typeof shapes)[0];

interface Bubble {
  id: number;
  item: ItemType;
  x: number;
  animationDuration: number;
  colorIndex: number;
}

type GameState = 'menu' | 'playing' | 'finished';
type GameMode = 'freeplay' | 'challenge';
type Difficulty = 'slow' | 'medium' | 'fast' | 'superfast' | 'ultrafast';

const GAME_DURATION = 60;
const SPAWN_INTERVALS: Record<Difficulty, number> = {
  slow: 2500,
  medium: 1800,
  fast: 1200,
  superfast: 700,
  ultrafast: 300, // Much faster spawning
};
const ANIMATION_DURATIONS: Record<Difficulty, { min: number; max: number }> = {
  slow: { min: 10, max: 14 },
  medium: { min: 7, max: 10 },
  fast: { min: 5, max: 7 },
  superfast: { min: 3, max: 5 },
  ultrafast: { min: 1.5, max: 2.5 }, // Much faster falling
};

// Target spawn config: true randomness with guardrails
// warmupMin/Max = random mandatory distractors (you don't know how many)
// spawnChance = probability each spawn after warmup is the target
// hardMax = failsafe maximum wait
const TARGET_SPAWN_CONFIG: Record<Difficulty, { warmupMin: number; warmupMax: number; spawnChance: number; hardMax: number }> = {
  slow: { warmupMin: 3, warmupMax: 6, spawnChance: 0.30, hardMax: 14 },
  medium: { warmupMin: 2, warmupMax: 5, spawnChance: 0.35, hardMax: 12 },
  fast: { warmupMin: 2, warmupMax: 4, spawnChance: 0.40, hardMax: 10 },
  superfast: { warmupMin: 1, warmupMax: 3, spawnChance: 0.45, hardMax: 8 },
  ultrafast: { warmupMin: 1, warmupMax: 2, spawnChance: 0.50, hardMax: 5 },
};
const RESPAWN_SPAWN_CONFIG = { warmupMin: 0, warmupMax: 1, spawnChance: 0.60, hardMax: 3 };

// Position zones for variety (4 horizontal zones)
const NUM_ZONES = 4;
const ZONE_WIDTH = 70 / NUM_ZONES; // 70% usable width divided into zones

// Bubble colors for variety
const BUBBLE_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
];

// Audio folder mapping by item type
const AUDIO_FOLDER_MAP: Record<ModelTypesEnum, string> = {
  [ModelTypesEnum.LETTERS]: 'letters',
  [ModelTypesEnum.NUMBERS]: 'numbers',
  [ModelTypesEnum.SHAPES]: 'shapes',
  [ModelTypesEnum.COLORS]: 'colors',
  [ModelTypesEnum.ANIMALS]: 'animals',
  [ModelTypesEnum.FOOD]: 'food',
  [ModelTypesEnum.MEMORY_MATCH_CARD]: 'common',
};

// Check if two items are the same (by id and type)
function isSameItem(a: ItemType | null | undefined, b: ItemType | null | undefined): boolean {
  if (!a || !b) return false;
  return a.id === b.id && a.type === b.type;
}

export default function LetterRainPage() {
  const t = useTranslations();
  const router = useRouter();
  const { trackGameStarted, trackGameCompleted } = useGameAnalytics({ gameType: 'letter-rain' });
  const { celebrationState, celebrate, resetCelebration } = useCelebration();
  const { recordGameCompleted } = useGamesProgressContext();

  // Game State
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('freeplay');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [includeShapes, setIncludeShapes] = useState(false);
  const [globalHighScore, setGlobalHighScore] = useState(0);
  const [globalHighScoreDate, setGlobalHighScoreDate] = useState<Date | null>(null);

  // Playing State
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [targetItem, setTargetItem] = useState<ItemType | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [gameTime, setGameTime] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Refs
  const nextBubbleId = useRef(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetItemRef = useRef<ItemType | null>(null);
  const hasTargetOnScreenRef = useRef(false);
  const includeNumbersRef = useRef(false);
  const includeShapesRef = useRef(false);

  // True randomness tracking
  const spawnCountRef = useRef(0); // How many spawns since last target
  const warmupEndRef = useRef(0); // Random warmup period (no target during warmup)
  const isRespawnModeRef = useRef(false); // Quick mode after missing target
  const recentZonesRef = useRef<number[]>([]); // Last 2 spawn zones for position variety

  // Get random item (letter, number, or shape)
  const getRandomItem = useCallback((): ItemType => {
    let pool: ItemType[] = [...letters];
    if (includeNumbersRef.current) pool = [...pool, ...numbers];
    if (includeShapesRef.current) pool = [...pool, ...shapes];
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  // Reset spawn tracking with random warmup period
  const resetTargetSpawn = useCallback(
    (isRespawn: boolean = false) => {
      const config = isRespawn ? RESPAWN_SPAWN_CONFIG : TARGET_SPAWN_CONFIG[difficulty];
      spawnCountRef.current = 0;
      isRespawnModeRef.current = isRespawn;
      // Pick random warmup period - you don't know when target becomes possible
      warmupEndRef.current = config.warmupMin + Math.floor(Math.random() * (config.warmupMax - config.warmupMin + 1));
    },
    [difficulty]
  );

  // Get spawn X position with zone variety (prevents clustering)
  const getVariedXPosition = useCallback(() => {
    const recentZones = recentZonesRef.current;
    const availableZones = [0, 1, 2, 3].filter((z) => !recentZones.includes(z));

    // 80% chance to pick a zone not recently used
    const selectedZone =
      availableZones.length > 0 && Math.random() < 0.8
        ? availableZones[Math.floor(Math.random() * availableZones.length)]
        : Math.floor(Math.random() * NUM_ZONES);

    // Update recent zones (keep last 2)
    recentZonesRef.current = [...recentZones, selectedZone].slice(-2);

    // Calculate X within zone (5% base + zone offset + random within zone)
    return 5 + selectedZone * ZONE_WIDTH + Math.random() * ZONE_WIDTH;
  }, []);

  // Clear all bubble timeouts
  const clearBubbleTimeouts = useCallback(() => {
    bubbleTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    bubbleTimeoutsRef.current.clear();
  }, []);

  // Clear all game timers
  const clearGameTimers = useCallback(() => {
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
  }, []);

  // Get a distractor item (different from target, with safeguard against infinite loop)
  const getDistractor = useCallback(
    (target: ItemType): ItemType => {
      let item: ItemType;
      let attempts = 0;
      do {
        item = getRandomItem();
        attempts++;
      } while (isSameItem(item, target) && attempts < 100);
      return item;
    },
    [getRandomItem]
  );

  // Spawn a new bubble
  const spawnBubble = useCallback(
    (forceTargetItem?: ItemType | null) => {
      const durations = ANIMATION_DURATIONS[difficulty];
      const bubbleId = nextBubbleId.current++;

      let itemToUse: ItemType;
      let isTargetItem = false;

      if (forceTargetItem && !hasTargetOnScreenRef.current) {
        // Get current config
        const config = isRespawnModeRef.current ? RESPAWN_SPAWN_CONFIG : TARGET_SPAWN_CONFIG[difficulty];
        const currentSpawn = spawnCountRef.current;
        spawnCountRef.current++;

        // Determine if this spawn is the target using TRUE randomness
        let shouldSpawnTarget = false;

        if (currentSpawn < warmupEndRef.current) {
          // Still in warmup - guaranteed distractor
          shouldSpawnTarget = false;
        } else if (currentSpawn >= config.hardMax) {
          // Hit hard max - force target
          shouldSpawnTarget = true;
        } else {
          // Past warmup - roll the dice each spawn!
          shouldSpawnTarget = Math.random() < config.spawnChance;
        }

        if (shouldSpawnTarget) {
          itemToUse = forceTargetItem;
          isTargetItem = true;
          hasTargetOnScreenRef.current = true;
        } else {
          itemToUse = getDistractor(forceTargetItem);
        }
      } else if (forceTargetItem) {
        // Target already on screen - spawn distractor
        itemToUse = getDistractor(forceTargetItem);
      } else {
        // Freeplay mode
        itemToUse = getRandomItem();
      }

      const bubble: Bubble = {
        id: bubbleId,
        item: itemToUse,
        x: getVariedXPosition(),
        animationDuration: durations.min + Math.random() * (durations.max - durations.min),
        colorIndex: bubbleId % BUBBLE_COLORS.length,
      };
      setBubbles((prev) => [...prev, bubble]);

      // Auto-remove after animation completes
      const timeoutId = setTimeout(
        () => {
          setBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
          bubbleTimeoutsRef.current.delete(bubbleId);
          // If target was missed, switch to quick respawn mode
          if (isTargetItem) {
            hasTargetOnScreenRef.current = false;
            resetTargetSpawn(true);
          }
        },
        bubble.animationDuration * 1000 + 500
      );
      bubbleTimeoutsRef.current.set(bubbleId, timeoutId);
    },
    [difficulty, getRandomItem, getDistractor, getVariedXPosition, resetTargetSpawn]
  );

  // Handle bubble click
  const handleBubbleClick = useCallback(
    (bubble: Bubble, event: React.MouseEvent | React.TouchEvent) => {
      event.stopPropagation();

      // Play audio
      const audioFolder = AUDIO_FOLDER_MAP[bubble.item.type] || 'letters';
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = new Audio(`/audio/${audioFolder}/he/${bubble.item.audioFile}`);
      audioRef.current.play().catch(console.error);

      // Clear the bubble's removal timeout since we're removing it now
      const timeoutId = bubbleTimeoutsRef.current.get(bubble.id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        bubbleTimeoutsRef.current.delete(bubble.id);
      }

      // Remove bubble immediately
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));

      if (gameMode === 'freeplay') {
        setScore((prev) => {
          const newScore = prev + 1;
          if (newScore > 0 && newScore % 100 === 0) {
            playSound(AudioSounds.CELEBRATION);
          }
          return newScore;
        });
        playSound(AudioSounds.POP);
      } else {
        setStats((prev) => ({ ...prev, total: prev.total + 1 }));

        if (isSameItem(bubble.item, targetItem)) {
          setScore((prev) => {
            const newScore = prev + 10;
            // Play celebration sound when crossing 100-point milestones
            if (Math.floor(newScore / 100) > Math.floor(prev / 100)) {
              playSound(AudioSounds.CELEBRATION);
            }
            return newScore;
          });
          setStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
          playSound(AudioSounds.SUCCESS);
          // Target was clicked, reset spawn tracking for next target
          hasTargetOnScreenRef.current = false;
          resetTargetSpawn(false);
          const newTarget = getRandomItem();
          setTargetItem(newTarget);
          targetItemRef.current = newTarget;
        } else {
          setScore((prev) => Math.max(0, prev - 20));
          playSound(AudioSounds.WRONG_ANSWER);
        }
      }
    },
    [gameMode, targetItem, getRandomItem, resetTargetSpawn]
  );

  // End game
  const endGame = useCallback(() => {
    clearGameTimers();
    clearBubbleTimeouts();
    setBubbles([]);
    setGameState('finished');
    celebrate('gameComplete');
  }, [clearGameTimers, clearBubbleTimeouts, celebrate]);

  // Track game completion
  useEffect(() => {
    if (gameState === 'finished') {
      trackGameCompleted(score);
      recordGameCompleted('letter-rain', score);
    }
  }, [gameState, score, trackGameCompleted, recordGameCompleted]);

  // Submit score when game finishes (challenge mode only)
  useEffect(() => {
    if (gameState === 'finished' && gameMode === 'challenge' && score > globalHighScore) {
      submitScore('letter-rain', score);
      setGlobalHighScore(score);
      setGlobalHighScoreDate(new Date());
    }
  }, [gameState, gameMode, score, globalHighScore]);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setStats({ correct: 0, total: 0 });
    setGameTime(0);
    setBubbles([]);
    nextBubbleId.current = 0;
    hasTargetOnScreenRef.current = false;
    includeNumbersRef.current = includeNumbers;
    includeShapesRef.current = includeShapes;
    recentZonesRef.current = [];
    resetTargetSpawn(false); // Initialize with random warmup

    playSound(AudioSounds.GAME_START);
    trackGameStarted();

    const initialTarget = gameMode === 'challenge' ? getRandomItem() : null;
    if (initialTarget) {
      setTargetItem(initialTarget);
      targetItemRef.current = initialTarget;
    }

    // Start spawn timer - in challenge mode, pass target item
    spawnTimerRef.current = setInterval(() => {
      spawnBubble(targetItemRef.current);
    }, SPAWN_INTERVALS[difficulty]);

    // Spawn first bubble immediately (with target item in challenge mode)
    spawnBubble(initialTarget);

    // Start game timer
    gameTimerRef.current = setInterval(() => {
      setGameTime((prev) => prev + 1);
    }, 1000);
  }, [gameMode, difficulty, spawnBubble, getRandomItem, includeNumbers, includeShapes, resetTargetSpawn]);

  // Watch gameTime and end game when time is up
  useEffect(() => {
    if (gameState === 'playing' && gameTime >= GAME_DURATION) {
      endGame();
    }
  }, [gameTime, gameState, endGame]);

  // Reset to menu
  const resetGame = useCallback(() => {
    clearGameTimers();
    clearBubbleTimeouts();
    setBubbles([]);
    setGameState('menu');
    setTargetItem(null);
  }, [clearGameTimers, clearBubbleTimeouts]);

  // Handle back button - go to menu if playing/finished, otherwise go back
  const handleBack = useCallback(() => {
    if (gameState === 'menu') {
      router.push('/games');
    } else {
      resetGame();
    }
  }, [gameState, router, resetGame]);

  // Load global high score
  useEffect(() => {
    getTopScore('letter-rain').then((record) => {
      if (record) {
        setGlobalHighScore(record.score);
        setGlobalHighScoreDate(new Date(record.timestamp));
      }
    });
  }, []);

  // Window size for confetti
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearGameTimers();
      clearBubbleTimeouts();
    };
  }, [clearGameTimers, clearBubbleTimeouts]);

  // Render menu
  const renderMenu = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        p: 2,
        maxWidth: 400,
        mx: 'auto',
      }}
    >
      <Typography
        variant="h3"
        sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#FF6B6B',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          fontSize: { xs: '28px', sm: '36px', md: '48px' },
        }}
      >
        {t('games.letterRain.title')}
      </Typography>

      {/* Mode Selection */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Box sx={{ opacity: gameMode === 'freeplay' ? 1 : 0.5, transition: 'opacity 200ms' }}>
          <FunButton
            text={t('games.letterRain.freePlay')}
            onClick={() => setGameMode('freeplay')}
            backgroundColor="#4CAF50"
            fontSize={18}
            paddingX={16}
          />
        </Box>
        <Box sx={{ opacity: gameMode === 'challenge' ? 1 : 0.5, transition: 'opacity 200ms' }}>
          <FunButton
            text={t('games.letterRain.challenge')}
            onClick={() => setGameMode('challenge')}
            backgroundColor="#FF9800"
            fontSize={18}
            paddingX={16}
          />
        </Box>
      </Box>

      {/* Global High Score for Challenge Mode */}
      {gameMode === 'challenge' && (
        <Typography variant="body1" sx={{ opacity: 0.7, textAlign: 'center' }}>
          🏆 {t('games.letterRain.globalHighScore')}:{' '}
          {globalHighScore > 0 && globalHighScoreDate
            ? `${globalHighScore} (${globalHighScoreDate.toLocaleDateString()})`
            : '---'}
        </Typography>
      )}

      {/* Include Numbers & Shapes */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              sx={{ '& .MuiSvgIcon-root': { fontSize: 32 } }}
            />
          }
          label={
            <Typography sx={{ fontSize: '18px' }}>
              🔢 {t('games.letterRain.includeNumbers')}
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={includeShapes}
              onChange={(e) => setIncludeShapes(e.target.checked)}
              sx={{ '& .MuiSvgIcon-root': { fontSize: 32 } }}
            />
          }
          label={
            <Typography sx={{ fontSize: '18px' }}>
              🔷 {t('games.letterRain.includeShapes')}
            </Typography>
          }
        />
      </Box>

      {/* Difficulty */}
      <FormControl fullWidth sx={{ maxWidth: 300 }}>
        <InputLabel sx={{ fontSize: '18px' }}>{t('games.letterRain.speed')}</InputLabel>
        <Select
          value={difficulty}
          label={t('games.letterRain.speed')}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          sx={{ fontSize: '20px' }}
        >
          <MenuItem value="slow" sx={{ fontSize: '18px' }}>
            🐢 {t('games.letterRain.slow')}
          </MenuItem>
          <MenuItem value="medium" sx={{ fontSize: '18px' }}>
            🚶 {t('games.letterRain.medium')}
          </MenuItem>
          <MenuItem value="fast" sx={{ fontSize: '18px' }}>
            🏃 {t('games.letterRain.fast')}
          </MenuItem>
          <MenuItem value="superfast" sx={{ fontSize: '18px' }}>
            🚀 {t('games.letterRain.superfast')}
          </MenuItem>
          <MenuItem value="ultrafast" sx={{ fontSize: '18px' }}>
            ⚡ {t('games.letterRain.ultrafast')}
          </MenuItem>
        </Select>
      </FormControl>

      <FunButton text={t('games.letterRain.start')} onClick={startGame} />
    </Box>
  );

  // Render game
  const renderGame = () => (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        height: 'calc(100vh - 120px)',
        minHeight: '500px',
        maxWidth: { xs: '100%', md: '700px' },
        mx: 'auto',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 2,
          mx: 1,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '18px', sm: '24px' } }}>
          {t('games.letterRain.score')}: {score}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '18px', sm: '24px' },
            color: gameTime >= GAME_DURATION - 10 ? '#FF6B6B' : 'inherit',
          }}
        >
          {Math.max(0, GAME_DURATION - gameTime)}s
        </Typography>
      </Paper>

      {/* Challenge Mode Target */}
      {gameMode === 'challenge' && targetItem && (
        <Paper
          elevation={6}
          sx={{
            p: 2,
            mt: 2,
            mx: 1,
            textAlign: 'center',
            backgroundColor: '#FFF3E0',
            borderRadius: 3,
            border: '3px solid #FF9800',
            position: 'relative',
            zIndex: 10,
            minHeight: { xs: '80px', sm: '100px' },
          }}
        >
          <Box
            sx={{
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontSize: { xs: '20px', sm: '28px' },
              height: { xs: '50px', sm: '70px' },
            }}
          >
            <Typography sx={{ fontSize: 'inherit', fontWeight: 'bold' }}>
              {t('games.letterRain.findLetter')}
            </Typography>
            {targetItem.type === ModelTypesEnum.SHAPES && 'element' in targetItem ? (
              <Box
                component="svg"
                viewBox="0 0 24 24"
                sx={{
                  width: { xs: '50px', sm: '70px' },
                  height: { xs: '50px', sm: '70px' },
                  fill: targetItem.color,
                  animation: 'pulse 1s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                  },
                }}
              >
                {targetItem.element}
              </Box>
            ) : (
              <Box
                component="span"
                sx={{
                  color: targetItem.color,
                  fontSize: { xs: '40px', sm: '56px' },
                  lineHeight: 1,
                  animation: 'pulse 1s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                  },
                }}
              >
                {t(`${targetItem.translationKey}.name`)}
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Bubbles Container */}
      <Box
        sx={{
          position: 'absolute',
          // Mobile: start at middle of target box so bubbles emerge from behind it
          // Desktop: start below the header/target area
          top: { xs: gameMode === 'challenge' ? 130 : 70, sm: gameMode === 'challenge' ? 180 : 80 },
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {bubbles.map((bubble) => {
          const bubbleColor = BUBBLE_COLORS[bubble.colorIndex];
          const isTarget = gameMode === 'challenge' && isSameItem(bubble.item, targetItem);

          return (
            <Box
              key={bubble.id}
              onClick={(e) => handleBubbleClick(bubble, e)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleBubbleClick(bubble, e);
              }}
              sx={{
                position: 'absolute',
                left: `${bubble.x}%`,
                top: -120,
                width: { xs: 80, sm: 120 },
                height: { xs: 80, sm: 120 },
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${bubbleColor}ee, ${bubbleColor}aa 60%, ${bubbleColor}88)`,
                boxShadow: isTarget
                  ? `0 0 20px 5px ${targetItem?.color || '#FF9800'}, 0 8px 20px rgba(0,0,0,0.3)`
                  : '0 8px 20px rgba(0,0,0,0.2), inset 0 -5px 15px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `fall-${bubble.id % 5} ${bubble.animationDuration}s linear forwards`,
                transition: 'transform 0.15s ease-out',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                '&:hover': {
                  transform: 'scale(1.15)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                '@keyframes fall-0': {
                  '0%': { top: -120, transform: 'rotate(0deg)' },
                  '100%': { top: '100%', transform: 'rotate(20deg)' },
                },
                '@keyframes fall-1': {
                  '0%': { top: -120, transform: 'rotate(0deg)' },
                  '100%': { top: '100%', transform: 'rotate(-15deg)' },
                },
                '@keyframes fall-2': {
                  '0%': { top: -120, transform: 'rotate(0deg)' },
                  '100%': { top: '100%', transform: 'rotate(25deg)' },
                },
                '@keyframes fall-3': {
                  '0%': { top: -120, transform: 'rotate(0deg)' },
                  '100%': { top: '100%', transform: 'rotate(-20deg)' },
                },
                '@keyframes fall-4': {
                  '0%': { top: -120, transform: 'rotate(0deg)' },
                  '100%': { top: '100%', transform: 'rotate(10deg)' },
                },
              }}
            >
              {bubble.item.type === ModelTypesEnum.SHAPES && 'element' in bubble.item ? (
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  sx={{
                    width: { xs: '50px', sm: '70px' },
                    height: { xs: '50px', sm: '70px' },
                    fill: bubble.item.color,
                    filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))',
                  }}
                >
                  {bubble.item.element}
                </Box>
              ) : (
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: { xs: '40px', sm: '52px' },
                    textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                    lineHeight: 1,
                    direction: 'rtl',
                  }}
                >
                  {t(`${bubble.item.translationKey}.name`)}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  // Render results
  const renderResults = () => {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 100;

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          p: 2,
        }}
      >
        <Celebration celebrationState={celebrationState} onComplete={resetCelebration} />

        <Paper
          elevation={8}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 4,
            maxWidth: 400,
            background: 'linear-gradient(135deg, #FFF9C4 0%, #FFECB3 100%)',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              mb: 3,
              fontWeight: 'bold',
              fontSize: { xs: '24px', sm: '32px' },
            }}
          >
            {t('games.letterRain.gameComplete')}
          </Typography>

          <Typography
            variant="h2"
            sx={{
              mb: 2,
              color: '#FF6B6B',
              fontWeight: 'bold',
              fontSize: { xs: '36px', sm: '48px' },
            }}
          >
            {score}
          </Typography>
          <Typography variant="h5" sx={{ mb: 3, color: '#666' }}>
            {t('games.letterRain.totalScore')}
          </Typography>

          {gameMode === 'challenge' && (
            <Typography variant="h5" sx={{ mb: 3 }}>
              {t('games.letterRain.accuracy')}: {accuracy}% ({stats.correct}/{stats.total})
            </Typography>
          )}

          <Box sx={{ mt: 3 }}>
            <FunButton text={t('games.letterRain.playAgain')} onClick={resetGame} />
          </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <>
      <Box sx={{ textAlign: 'left' }}>
        <RoundFunButton onClick={handleBack}>
          <ArrowBackIcon />
        </RoundFunButton>
      </Box>
      <Box
        sx={{
          minHeight: 'calc(100vh - 60px)',
          pt: 2,
          pb: 4,
        }}
      >
        {gameState === 'menu' && renderMenu()}
        {gameState === 'playing' && renderGame()}
        {gameState === 'finished' && renderResults()}
      </Box>
    </>
  );
}
