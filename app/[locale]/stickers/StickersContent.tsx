'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import BackButton from '@/components/BackButton';
import StickerCard from '@/components/StickerCard';
import StickerPeelAnimation from '@/components/StickerPeelAnimation';
import { useStickerContext } from '@/contexts/StickerContext';
import { useStreakContext } from '@/contexts/StreakContext';
import { useLettersProgressContext } from '@/contexts/LettersProgressContext';
import { useNumbersProgressContext } from '@/contexts/NumbersProgressContext';
import { useAnimalsProgressContext } from '@/contexts/AnimalsProgressContext';
import { useGamesProgressContext } from '@/contexts/GamesProgressContext';
import { useWordCollectionContext } from '@/contexts/WordCollectionContext';
import { useChessProgress } from '@/hooks/useChessProgress';
import {
  STICKER_PAGES,
  getStickersForPage,
  TOTAL_STICKERS,
  Sticker,
  StickerProgressValues,
  checkStickerUnlock,
} from '@/data/stickers';

interface PeelAnimationState {
  isActive: boolean;
  sticker: Sticker | null;
  originX: number;
  originY: number;
}

export default function StickersContent() {
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed tab
  const { hasSticker, earnSticker, totalEarned } = useStickerContext();
  const { streakData } = useStreakContext();
  const { totalHeard: lettersHeard, totalClicks: lettersTotalClicks } = useLettersProgressContext();
  const { totalHeard: numbersHeard, totalClicks: numbersTotalClicks } = useNumbersProgressContext();
  const { totalHeard: animalsHeard, totalClicks: animalsTotalClicks } = useAnimalsProgressContext();
  const { uniqueGamesPlayed, memoryWins, simonHighScore, speedChallengeHighScores, wordBuilderCompletions, soundMatchingPerfect, countingGameCompletions, totalGamesCompleted } = useGamesProgressContext();
  const { uniqueWordsCollected } = useWordCollectionContext();
  const { completedLevels: chessLevelsCompleted } = useChessProgress();
  const t = useTranslations();

  // Peel animation state
  const [peelAnimation, setPeelAnimation] = useState<PeelAnimationState>({
    isActive: false,
    sticker: null,
    originX: 0,
    originY: 0,
  });

  // Memoized progress values for sticker unlock checks
  const progressValues: StickerProgressValues = useMemo(
    () => ({
      currentStreak: streakData.currentStreak,
      lettersHeard,
      lettersTotalClicks,
      numbersHeard,
      numbersTotalClicks,
      animalsHeard,
      animalsTotalClicks,
      uniqueGamesPlayed,
      memoryWins,
      simonHighScore,
      speedChallengeHighScores,
      wordBuilderCompletions,
      soundMatchingPerfect,
      countingGameCompletions,
      totalGamesCompleted,
      chessLevelsCompleted,
      uniqueWordsCollected,
    }),
    [
      streakData.currentStreak,
      lettersHeard,
      lettersTotalClicks,
      numbersHeard,
      numbersTotalClicks,
      animalsHeard,
      animalsTotalClicks,
      uniqueGamesPlayed,
      memoryWins,
      simonHighScore,
      speedChallengeHighScores,
      wordBuilderCompletions,
      soundMatchingPerfect,
      countingGameCompletions,
      totalGamesCompleted,
      chessLevelsCompleted,
      uniqueWordsCollected,
    ]
  );

  // Check if a sticker meets its unlock requirements (uses shared utility)
  const meetsUnlockRequirements = useCallback(
    (sticker: Sticker): boolean => checkStickerUnlock(sticker, progressValues),
    [progressValues]
  );

  // Check if a sticker is unlocked (earned or meets requirements)
  const isStickerUnlocked = (sticker: Sticker): boolean => {
    return hasSticker(sticker.id) || meetsUnlockRequirements(sticker);
  };

  // Handle clicking an unlocked sticker (start peel animation)
  const handleStickerClick = useCallback(
    (sticker: Sticker, event: React.MouseEvent) => {
      const isEarned = hasSticker(sticker.id);
      if (isEarned || !meetsUnlockRequirements(sticker)) {
        return;
      }

      // Get the click position for animation origin
      const rect = event.currentTarget.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;

      setPeelAnimation({
        isActive: true,
        sticker,
        originX,
        originY,
      });
    },
    [hasSticker, meetsUnlockRequirements]
  );

  // Called when peel animation completes
  const handlePeelComplete = useCallback(() => {
    // Capture sticker reference before resetting state
    const stickerToEarn = peelAnimation.sticker;

    // ALWAYS reset animation state first - UI must not get stuck
    setPeelAnimation({
      isActive: false,
      sticker: null,
      originX: 0,
      originY: 0,
    });

    // Then try to award the sticker
    if (stickerToEarn) {
      try {
        const name = t(stickerToEarn.translationKey);
        earnSticker(stickerToEarn.id, name, stickerToEarn.pageNumber);
      } catch (error) {
        console.error('Failed to earn sticker:', error);
      }
    }
  }, [peelAnimation.sticker, t, earnSticker]);

  // Get unlock hint for locked stickers
  function getUnlockHint(sticker: Sticker): string {
    const { unlockType, unlockValue } = sticker;
    if (unlockType === 'streak' && unlockValue !== undefined) {
      return t('stickers.unlockHint.streak', { days: unlockValue });
    }
    if (unlockType === 'letters_progress' && unlockValue !== undefined) {
      return t('stickers.unlockHint.letters', { count: unlockValue });
    }
    if (unlockType === 'letters_total' && unlockValue !== undefined) {
      return t('stickers.unlockHint.lettersTotal', { count: unlockValue });
    }
    if (unlockType === 'numbers_progress' && unlockValue !== undefined) {
      return t('stickers.unlockHint.numbers', { count: unlockValue });
    }
    if (unlockType === 'numbers_total' && unlockValue !== undefined) {
      return t('stickers.unlockHint.numbersTotal', { count: unlockValue });
    }
    if (unlockType === 'animals_progress' && unlockValue !== undefined) {
      return t('stickers.unlockHint.animals', { count: unlockValue });
    }
    if (unlockType === 'animals_total' && unlockValue !== undefined) {
      return t('stickers.unlockHint.animalsTotal', { count: unlockValue });
    }
    if (unlockType === 'games_played' && unlockValue !== undefined) {
      return t('stickers.unlockHint.gamesPlayed', { count: unlockValue });
    }
    if (unlockType === 'memory_wins' && unlockValue !== undefined) {
      return t('stickers.unlockHint.memoryWins', { count: unlockValue });
    }
    if (unlockType === 'simon_score' && unlockValue !== undefined) {
      return t('stickers.unlockHint.simonScore', { level: unlockValue });
    }
    if (unlockType === 'speed_challenge_high' && unlockValue !== undefined) {
      return t('stickers.unlockHint.speedChallengeHigh', { count: unlockValue });
    }
    if (unlockType === 'word_builder_completions' && unlockValue !== undefined) {
      return t('stickers.unlockHint.wordBuilderCompletions', { count: unlockValue });
    }
    if (unlockType === 'sound_matching_perfect' && unlockValue !== undefined) {
      return t('stickers.unlockHint.soundMatchingPerfect', { count: unlockValue });
    }
    if (unlockType === 'counting_game_completions' && unlockValue !== undefined) {
      return t('stickers.unlockHint.countingGameCompletions', { count: unlockValue });
    }
    if (unlockType === 'total_games_completed' && unlockValue !== undefined) {
      return t('stickers.unlockHint.totalGamesCompleted', { count: unlockValue });
    }
    if (unlockType === 'words_collected' && unlockValue !== undefined) {
      return t('stickers.unlockHint.wordsCollected', { count: unlockValue });
    }
    return t('stickers.comingSoon');
  }

  const pageStickers = getStickersForPage(currentPage + 1); // Pages are 1-indexed
  const pageInfo = STICKER_PAGES[currentPage];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        pb: 6,
      }}
    >
      {/* Header */}
      <BackButton />

      {/* Album Cover Header */}
      <Box
        sx={{
          textAlign: 'center',
          px: 2,
          pt: { xs: 1, sm: 2 },
          pb: { xs: 2, sm: 3 },
        }}
      >
        {/* Title with decorative elements */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 0.5,
          }}
        >
          <Box sx={{ fontSize: { xs: '24px', sm: '32px' } }}>⭐</Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FF6B9D 0%, #9B59B6 50%, #4ECDC4 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.6rem', sm: '2.2rem' },
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {t('stickers.title')}
          </Typography>
          <Box sx={{ fontSize: { xs: '24px', sm: '32px' } }}>⭐</Box>
        </Box>

        {/* Progress indicator - below title */}
        <Typography
          sx={{
            color: '#8d6e63',
            fontWeight: 500,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            mt: 0.5,
          }}
        >
          {t('stickers.collected', { count: totalEarned, total: TOTAL_STICKERS })}
        </Typography>
      </Box>

      {/* Page Navigation Tabs - Fun pill style */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 1, sm: 2 },
          pb: 2,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 0.5, sm: 1 },
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: '25px',
            padding: { xs: '4px', sm: '8px' },
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
            flexShrink: 0,
          }}
        >
          {STICKER_PAGES.map((page, index) => (
            <Box
              key={page.pageNumber}
              onClick={() => setCurrentPage(index)}
              sx={{
                cursor: 'pointer',
                padding: { xs: '6px 8px', sm: '10px 18px' },
                borderRadius: '20px',
                fontSize: { xs: '0.7rem', sm: '0.85rem' },
                fontWeight: 700,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                backgroundColor: currentPage === index ? page.color : 'transparent',
                color: currentPage === index ? '#fff' : '#777',
                boxShadow: currentPage === index
                  ? `0 4px 12px ${page.color}60`
                  : 'none',
                transform: currentPage === index ? 'scale(1.05)' : 'scale(1)',
                '&:hover': {
                  backgroundColor: currentPage === index ? page.color : `${page.color}30`,
                  color: currentPage === index ? '#fff' : page.color,
                },
              }}
            >
              {t(page.titleKey)}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Sticker Album Page */}
      <Box
        sx={{
          flex: 1,
          mx: 'auto',
          px: { xs: 1, sm: 3 },
          maxWidth: '800px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Album page with paper texture effect */}
        <Box
          sx={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: { xs: '24px', sm: '32px' },
            padding: { xs: 2.5, sm: 4 },
            minHeight: { xs: '350px', sm: '400px' },
            boxShadow: `
              0 4px 6px rgba(0,0,0,0.05),
              0 10px 40px rgba(0,0,0,0.08),
              inset 0 0 0 1px rgba(255,255,255,0.8)
            `,
            border: `3px solid ${pageInfo?.color || '#ddd'}40`,
            position: 'relative',
            overflow: 'hidden',
            // Decorative corner fold
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: { xs: '30px', sm: '40px' },
              height: { xs: '30px', sm: '40px' },
              background: `linear-gradient(135deg, transparent 50%, ${pageInfo?.color || '#ddd'}30 50%)`,
              borderBottomLeftRadius: '8px',
            },
          }}
        >
          {/* Page Title with emoji */}
          <Box
            sx={{
              textAlign: 'center',
              mb: { xs: 2.5, sm: 3.5 },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: pageInfo?.color || '#5d4037',
                fontWeight: 800,
                fontSize: { xs: '1.2rem', sm: '1.5rem' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: { xs: '40px', sm: '60px' },
                  height: '3px',
                  backgroundColor: pageInfo?.color || '#ddd',
                  borderRadius: '2px',
                  opacity: 0.5,
                }}
              />
              {t(pageInfo?.titleKey || '')}
              <Box
                component="span"
                sx={{
                  width: { xs: '40px', sm: '60px' },
                  height: '3px',
                  backgroundColor: pageInfo?.color || '#ddd',
                  borderRadius: '2px',
                  opacity: 0.5,
                }}
              />
            </Typography>
          </Box>

          {/* Stickers Grid - Using flex for better control */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: { xs: 3, sm: 4 },
              pb: 2,
            }}
          >
            {pageStickers.map((sticker) => {
              const isUnlocked = isStickerUnlocked(sticker);
              const isEarned = hasSticker(sticker.id);

              return (
                <StickerCard
                  key={sticker.id}
                  emoji={sticker.emoji}
                  name={t(sticker.translationKey)}
                  isLocked={!isUnlocked}
                  unlockHint={!isUnlocked ? getUnlockHint(sticker) : undefined}
                  onClick={
                    isUnlocked && !isEarned
                      ? (event) => handleStickerClick(sticker, event)
                      : undefined
                  }
                  pageColor={pageInfo?.color}
                />
              );
            })}
          </Box>

          {/* Hint for unlockable stickers */}
          {currentPage === 4 && ( // Page 5 (0-indexed = 4) is streaks
            <Box
              sx={{
                textAlign: 'center',
                mt: 2,
                pt: 2,
                borderTop: '1px dashed #ddd',
              }}
            >
              <Typography
                sx={{
                  color: '#8d6e63',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <span>💡</span>
                {t('stickers.streakHint')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Page indicator dots */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 3,
          }}
        >
          {STICKER_PAGES.map((page, index) => (
            <Box
              key={page.pageNumber}
              onClick={() => setCurrentPage(index)}
              sx={{
                width: currentPage === index ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: currentPage === index ? page.color : '#ddd',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: page.color,
                  opacity: currentPage === index ? 1 : 0.7,
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Sticker Peel Animation */}
      {peelAnimation.isActive && peelAnimation.sticker && (
        <StickerPeelAnimation
          emoji={peelAnimation.sticker.emoji}
          color={pageInfo?.color || '#FFD93D'}
          originX={peelAnimation.originX}
          originY={peelAnimation.originY}
          onComplete={handlePeelComplete}
        />
      )}
    </Box>
  );
}
