import { CategoryProgressData } from '@/hooks/useCategoryProgress';
import { GamesProgressData } from '@/hooks/useGamesProgress';
import { StreakData } from '@/hooks/useStreak';
import { CollectedWord } from '@/hooks/useWordCollectionProgress';
import type { GameType } from '@/models/amplitudeEvents';
import type { StickerData } from '@/hooks/useStickers';

export interface WordCollectionData {
  collectedWords: CollectedWord[];
  totalWordsBuilt: number;
}

function getDefaultStickerData(): StickerData {
  return {
    earnedStickerIds: [],
  };
}

function getDefaultGamesProgressData(): GamesProgressData {
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

function normalizeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeGameTypes(value: unknown): GameType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((gameType): gameType is GameType => typeof gameType === 'string');
}

function normalizeGamesProgressData(data: GamesProgressData | null): GamesProgressData | null {
  if (data === null) return null;

  return {
    completedGameTypes: normalizeGameTypes(data.completedGameTypes),
    memoryWins: normalizeNumber(data.memoryWins),
    simonHighScore: normalizeNumber(data.simonHighScore),
    speedChallengeHighScores: normalizeNumber(data.speedChallengeHighScores),
    wordBuilderCompletions: normalizeNumber(data.wordBuilderCompletions),
    soundMatchingPerfect: normalizeNumber(data.soundMatchingPerfect),
    countingGameCompletions: normalizeNumber(data.countingGameCompletions),
    totalGamesCompleted: normalizeNumber(data.totalGamesCompleted),
  };
}

function normalizeStickerIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((stickerId): stickerId is string => typeof stickerId === 'string');
}

function normalizeStickerData(data: StickerData | null): StickerData | null {
  if (data === null) return null;

  return {
    earnedStickerIds: normalizeStickerIds(data.earnedStickerIds),
  };
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
  const normalizedLocal = normalizeGamesProgressData(local);
  const normalizedCloud = normalizeGamesProgressData(cloud);

  if (normalizedLocal === null && normalizedCloud === null) {
    return getDefaultGamesProgressData();
  }
  if (normalizedLocal === null) return normalizedCloud!;
  if (normalizedCloud === null) return normalizedLocal;

  const completedGameTypes = [
    ...new Set([
      ...normalizedLocal.completedGameTypes,
      ...normalizedCloud.completedGameTypes,
    ]),
  ];

  return {
    completedGameTypes,
    memoryWins: Math.max(normalizedLocal.memoryWins, normalizedCloud.memoryWins),
    simonHighScore: Math.max(normalizedLocal.simonHighScore, normalizedCloud.simonHighScore),
    speedChallengeHighScores: Math.max(
      normalizedLocal.speedChallengeHighScores,
      normalizedCloud.speedChallengeHighScores
    ),
    wordBuilderCompletions: Math.max(
      normalizedLocal.wordBuilderCompletions,
      normalizedCloud.wordBuilderCompletions
    ),
    soundMatchingPerfect: Math.max(
      normalizedLocal.soundMatchingPerfect,
      normalizedCloud.soundMatchingPerfect
    ),
    countingGameCompletions: Math.max(
      normalizedLocal.countingGameCompletions,
      normalizedCloud.countingGameCompletions
    ),
    totalGamesCompleted: Math.max(
      normalizedLocal.totalGamesCompleted,
      normalizedCloud.totalGamesCompleted
    ),
  };
}

/**
 * Merge two StickerData objects using union strategy.
 * - earnedStickerIds: union of both sets
 * - Handles null inputs and malformed arrays gracefully
 */
export function mergeStickerData(
  local: StickerData | null,
  cloud: StickerData | null
): StickerData {
  const normalizedLocal = normalizeStickerData(local);
  const normalizedCloud = normalizeStickerData(cloud);

  if (normalizedLocal === null && normalizedCloud === null) {
    return getDefaultStickerData();
  }
  if (normalizedLocal === null) return normalizedCloud!;
  if (normalizedCloud === null) return normalizedLocal;

  return {
    earnedStickerIds: [
      ...new Set([
        ...normalizedLocal.earnedStickerIds,
        ...normalizedCloud.earnedStickerIds,
      ]),
    ],
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
