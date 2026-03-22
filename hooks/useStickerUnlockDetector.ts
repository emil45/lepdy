'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  STICKERS,
  StickerProgressValues,
  getUnlockedStickerIds,
} from '@/data/stickers';
import { useStickerContext } from '@/contexts/StickerContext';
import { useStickerToastContext } from '@/contexts/StickerToastContext';
import { useStreakContext } from '@/contexts/StreakContext';
import { useLettersProgressContext } from '@/contexts/LettersProgressContext';
import { useNumbersProgressContext } from '@/contexts/NumbersProgressContext';
import { useAnimalsProgressContext } from '@/contexts/AnimalsProgressContext';
import { useGamesProgressContext } from '@/contexts/GamesProgressContext';
import { useWordCollectionContext } from '@/contexts/WordCollectionContext';
import { useChessProgress } from '@/hooks/useChessProgress';

const NOTIFIED_STORAGE_KEY = 'lepdy_sticker_toasts_shown';

function loadNotifiedStickers(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveNotifiedSticker(stickerId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadNotifiedStickers();
    current.add(stickerId);
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify([...current]));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Gathers all progress values from contexts into a single object.
 * Memoized to prevent unnecessary recalculations.
 */
function useProgressValues(): StickerProgressValues {
  const { streakData } = useStreakContext();
  const { totalHeard: lettersHeard, totalClicks: lettersTotalClicks } =
    useLettersProgressContext();
  const { totalHeard: numbersHeard, totalClicks: numbersTotalClicks } =
    useNumbersProgressContext();
  const { totalHeard: animalsHeard, totalClicks: animalsTotalClicks } =
    useAnimalsProgressContext();
  const {
    uniqueGamesPlayed,
    memoryWins,
    simonHighScore,
    speedChallengeHighScores,
    wordBuilderCompletions,
    soundMatchingPerfect,
    countingGameCompletions,
    totalGamesCompleted,
  } = useGamesProgressContext();
  const { uniqueWordsCollected } = useWordCollectionContext();
  const { completedLevels: chessLevelsCompleted } = useChessProgress();

  return useMemo(
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
}

/**
 * Hook that detects when stickers become unlocked and shows a toast notification.
 * Shows each toast only ONCE ever (persisted in localStorage).
 * Does NOT auto-earn the sticker - kids enjoy peeling them in the sticker album!
 *
 * Should be used once at the app level (in providers).
 */
export function useStickerUnlockDetector(): void {
  const t = useTranslations();
  const { hasSticker } = useStickerContext();
  const { showStickerToast } = useStickerToastContext();
  const progress = useProgressValues();

  // Track which stickers we've shown toasts for in this render cycle
  const shownThisRenderRef = useRef<Set<string>>(new Set());

  // Get currently unlocked sticker IDs
  const currentlyUnlocked = useMemo(
    () => getUnlockedStickerIds(progress),
    [progress]
  );

  useEffect(() => {
    // Load already-notified stickers from localStorage
    const alreadyNotified = loadNotifiedStickers();

    // Find stickers that are:
    // 1. Currently unlocked (meets requirements)
    // 2. Not already earned (peeled)
    // 3. Never shown a toast before (persisted in localStorage)
    // 4. Not shown in this render cycle (prevents duplicates during hydration)
    const toNotify = STICKERS.filter((sticker) => {
      if (!currentlyUnlocked.has(sticker.id)) return false;
      if (hasSticker(sticker.id)) return false;
      if (alreadyNotified.has(sticker.id)) return false;
      if (shownThisRenderRef.current.has(sticker.id)) return false;
      return true;
    });

    // Show toast for each newly unlocked sticker
    for (const sticker of toNotify) {
      shownThisRenderRef.current.add(sticker.id);
      saveNotifiedSticker(sticker.id);

      let name: string;
      try {
        name = t(sticker.translationKey);
      } catch {
        name = sticker.id;
      }

      showStickerToast({
        emoji: sticker.emoji,
        name,
        pageNumber: sticker.pageNumber,
      });
    }
  }, [currentlyUnlocked, hasSticker, showStickerToast, t]);
}
