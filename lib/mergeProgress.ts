import { CategoryProgressData } from '@/hooks/useCategoryProgress';
import { GamesProgressData } from '@/hooks/useGamesProgress';
import { StreakData } from '@/hooks/useStreak';
import { CollectedWord } from '@/hooks/useWordCollectionProgress';

export interface WordCollectionData {
  collectedWords: CollectedWord[];
  totalWordsBuilt: number;
}

/**
 * Merge two CategoryProgressData objects using union / most-progress-wins strategy.
 * - heardItemIds: union of both sets (no item ever lost)
 * - totalClicks: Math.max of both values
 * - Handles null inputs gracefully
 */
export function mergeCategoryProgress(
  local: CategoryProgressData | null,
  cloud: CategoryProgressData | null
): CategoryProgressData {
  if (local === null && cloud === null) {
    return { heardItemIds: [], totalClicks: 0 };
  }
  if (local === null) return cloud!;
  if (cloud === null) return local;

  const heardItemIds = [...new Set([...local.heardItemIds, ...cloud.heardItemIds])];
  const totalClicks = Math.max(local.totalClicks, cloud.totalClicks);

  return { heardItemIds, totalClicks };
}

/**
 * Merge two GamesProgressData objects using union / most-progress-wins strategy.
 * - completedGameTypes: union of both sets
 * - All numeric fields: Math.max of both values
 * - Handles null inputs gracefully
 */
export function mergeGamesProgress(
  local: GamesProgressData | null,
  cloud: GamesProgressData | null
): GamesProgressData {
  if (local === null && cloud === null) {
    return {
      completedGameTypes: [],
      memoryWins: 0,
      simonHighScore: 0,
      speedChallengeHighScores: 0,
      wordBuilderCompletions: 0,
      soundMatchingPerfect: 0,
      countingGameCompletions: 0,
      totalGamesCompleted: 0,
    };
  }
  if (local === null) return cloud!;
  if (cloud === null) return local;

  const completedGameTypes = [...new Set([...local.completedGameTypes, ...cloud.completedGameTypes])];

  return {
    completedGameTypes,
    memoryWins: Math.max(local.memoryWins, cloud.memoryWins),
    simonHighScore: Math.max(local.simonHighScore, cloud.simonHighScore),
    speedChallengeHighScores: Math.max(local.speedChallengeHighScores, cloud.speedChallengeHighScores),
    wordBuilderCompletions: Math.max(local.wordBuilderCompletions, cloud.wordBuilderCompletions),
    soundMatchingPerfect: Math.max(local.soundMatchingPerfect, cloud.soundMatchingPerfect),
    countingGameCompletions: Math.max(local.countingGameCompletions, cloud.countingGameCompletions),
    totalGamesCompleted: Math.max(local.totalGamesCompleted, cloud.totalGamesCompleted),
  };
}

/**
 * Merge two WordCollectionData objects using union / most-progress-wins strategy.
 * - For duplicate wordIds: sum timesBuilt, keep earliest firstBuiltDate, keep latest lastBuiltDate
 * - totalWordsBuilt: Math.max of both values
 * - Handles null inputs gracefully
 */
export function mergeWordCollection(
  local: WordCollectionData | null,
  cloud: WordCollectionData | null
): WordCollectionData {
  if (local === null && cloud === null) {
    return { collectedWords: [], totalWordsBuilt: 0 };
  }
  if (local === null) return cloud!;
  if (cloud === null) return local;

  // Build a map keyed by wordId, starting with local words
  const wordMap = new Map<string, CollectedWord>();
  for (const word of local.collectedWords) {
    wordMap.set(word.wordId, { ...word });
  }

  // Merge in cloud words
  for (const cloudWord of cloud.collectedWords) {
    const existing = wordMap.get(cloudWord.wordId);
    if (existing) {
      // Sum timesBuilt, keep earliest firstBuiltDate, keep latest lastBuiltDate
      wordMap.set(cloudWord.wordId, {
        wordId: cloudWord.wordId,
        timesBuilt: existing.timesBuilt + cloudWord.timesBuilt,
        firstBuiltDate:
          existing.firstBuiltDate < cloudWord.firstBuiltDate
            ? existing.firstBuiltDate
            : cloudWord.firstBuiltDate,
        lastBuiltDate:
          existing.lastBuiltDate > cloudWord.lastBuiltDate
            ? existing.lastBuiltDate
            : cloudWord.lastBuiltDate,
      });
    } else {
      wordMap.set(cloudWord.wordId, { ...cloudWord });
    }
  }

  return {
    collectedWords: [...wordMap.values()],
    totalWordsBuilt: Math.max(local.totalWordsBuilt, cloud.totalWordsBuilt),
  };
}

/**
 * Merge two StreakData objects using union / most-progress-wins strategy.
 * - currentStreak: Math.max of both values
 * - longestStreak: Math.max of both values
 * - Base object (freezesRemaining, freezeUsedThisWeek, weekStartDate):
 *   use whichever side has the more recent lastActivityDate, as it reflects
 *   the most up-to-date device state for freeze tracking.
 * - Handles null inputs gracefully
 */
export function mergeStreak(
  local: StreakData | null,
  cloud: StreakData | null
): StreakData {
  if (local === null && cloud === null) {
    return {
      currentStreak: 0,
      lastActivityDate: '',
      longestStreak: 0,
      freezesRemaining: 1,
      freezeUsedThisWeek: false,
      weekStartDate: '',
    };
  }
  if (local === null) return cloud!;
  if (cloud === null) return local;

  // Use whichever side has the more recent lastActivityDate as the "base"
  // for freeze-related fields (freezesRemaining, freezeUsedThisWeek, weekStartDate)
  const base = local.lastActivityDate >= cloud.lastActivityDate ? local : cloud;

  return {
    ...base,
    currentStreak: Math.max(local.currentStreak, cloud.currentStreak),
    longestStreak: Math.max(local.longestStreak, cloud.longestStreak),
    lastActivityDate:
      local.lastActivityDate >= cloud.lastActivityDate
        ? local.lastActivityDate
        : cloud.lastActivityDate,
  };
}
