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
 * - heardItemIds: union of both sets
 * - totalClicks: Math.max of both values
 * - Handles null inputs gracefully
 */
export function mergeCategoryProgress(
  local: CategoryProgressData | null,
  cloud: CategoryProgressData | null
): CategoryProgressData {
  throw new Error('not implemented');
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
  throw new Error('not implemented');
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
  throw new Error('not implemented');
}

/**
 * Merge two StreakData objects using union / most-progress-wins strategy.
 * - currentStreak: Math.max of both values
 * - longestStreak: Math.max of both values
 * - Base object (freezesRemaining, freezeUsedThisWeek, weekStartDate):
 *   use whichever side has the more recent lastActivityDate
 * - Handles null inputs gracefully
 */
export function mergeStreak(
  local: StreakData | null,
  cloud: StreakData | null
): StreakData {
  throw new Error('not implemented');
}
