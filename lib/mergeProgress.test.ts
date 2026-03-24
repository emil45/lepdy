import { describe, it, expect } from 'vitest';
import {
  mergeCategoryProgress,
  mergeGamesProgress,
  mergeWordCollection,
  mergeStreak,
  WordCollectionData,
} from './mergeProgress';
import { CategoryProgressData } from '@/hooks/useCategoryProgress';
import { GamesProgressData } from '@/hooks/useGamesProgress';
import { StreakData } from '@/hooks/useStreak';
import { CollectedWord } from '@/hooks/useWordCollectionProgress';

// ─── mergeCategoryProgress ───────────────────────────────────────────────────

describe('mergeCategoryProgress', () => {
  it('both null -> returns default empty progress', () => {
    const result = mergeCategoryProgress(null, null);
    expect(result.heardItemIds).toEqual([]);
    expect(result.totalClicks).toBe(0);
  });

  it('unions heardItemIds from local and cloud', () => {
    const local: CategoryProgressData = { heardItemIds: ['a', 'b'], totalClicks: 5 };
    const cloud: CategoryProgressData = { heardItemIds: ['b', 'c'], totalClicks: 8 };
    const result = mergeCategoryProgress(local, cloud);
    expect(result.heardItemIds).toHaveLength(3);
    expect(result.heardItemIds).toContain('a');
    expect(result.heardItemIds).toContain('b');
    expect(result.heardItemIds).toContain('c');
  });

  it('takes Math.max for totalClicks', () => {
    const local: CategoryProgressData = { heardItemIds: [], totalClicks: 5 };
    const cloud: CategoryProgressData = { heardItemIds: [], totalClicks: 8 };
    const result = mergeCategoryProgress(local, cloud);
    expect(result.totalClicks).toBe(8);
  });

  it('cloud is null -> returns local unchanged', () => {
    const local: CategoryProgressData = { heardItemIds: ['a', 'b'], totalClicks: 5 };
    const result = mergeCategoryProgress(local, null);
    expect(result).toEqual(local);
  });

  it('local is null -> returns cloud unchanged', () => {
    const cloud: CategoryProgressData = { heardItemIds: ['x'], totalClicks: 3 };
    const result = mergeCategoryProgress(null, cloud);
    expect(result).toEqual(cloud);
  });
});

// ─── mergeGamesProgress ──────────────────────────────────────────────────────

describe('mergeGamesProgress', () => {
  function makeGamesData(overrides: Partial<GamesProgressData> = {}): GamesProgressData {
    return {
      completedGameTypes: [],
      memoryWins: 0,
      simonHighScore: 0,
      speedChallengeHighScores: 0,
      wordBuilderCompletions: 0,
      soundMatchingPerfect: 0,
      countingGameCompletions: 0,
      totalGamesCompleted: 0,
      ...overrides,
    };
  }

  it('cloud is null -> returns local unchanged', () => {
    const local = makeGamesData({ memoryWins: 3 });
    const result = mergeGamesProgress(local, null);
    expect(result).toEqual(local);
  });

  it('local is null -> returns cloud unchanged', () => {
    const cloud = makeGamesData({ simonHighScore: 7 });
    const result = mergeGamesProgress(null, cloud);
    expect(result).toEqual(cloud);
  });

  it('unions completedGameTypes from local and cloud', () => {
    const local = makeGamesData({ completedGameTypes: ['guess-game'] });
    const cloud = makeGamesData({ completedGameTypes: ['simon-game'] });
    const result = mergeGamesProgress(local, cloud);
    expect(result.completedGameTypes).toContain('guess-game');
    expect(result.completedGameTypes).toContain('simon-game');
  });

  it('does not duplicate completedGameTypes', () => {
    const local = makeGamesData({ completedGameTypes: ['guess-game', 'simon-game'] });
    const cloud = makeGamesData({ completedGameTypes: ['simon-game'] });
    const result = mergeGamesProgress(local, cloud);
    expect(result.completedGameTypes.filter((g) => g === 'simon-game')).toHaveLength(1);
  });

  it('takes Math.max for memoryWins', () => {
    const local = makeGamesData({ memoryWins: 5 });
    const cloud = makeGamesData({ memoryWins: 10 });
    const result = mergeGamesProgress(local, cloud);
    expect(result.memoryWins).toBe(10);
  });

  it('takes Math.max for simonHighScore', () => {
    const local = makeGamesData({ simonHighScore: 12 });
    const cloud = makeGamesData({ simonHighScore: 8 });
    const result = mergeGamesProgress(local, cloud);
    expect(result.simonHighScore).toBe(12);
  });

  it('takes Math.max for all numeric fields', () => {
    const local = makeGamesData({
      speedChallengeHighScores: 3,
      wordBuilderCompletions: 2,
      soundMatchingPerfect: 1,
      countingGameCompletions: 4,
      totalGamesCompleted: 10,
    });
    const cloud = makeGamesData({
      speedChallengeHighScores: 5,
      wordBuilderCompletions: 1,
      soundMatchingPerfect: 3,
      countingGameCompletions: 2,
      totalGamesCompleted: 15,
    });
    const result = mergeGamesProgress(local, cloud);
    expect(result.speedChallengeHighScores).toBe(5);
    expect(result.wordBuilderCompletions).toBe(2);
    expect(result.soundMatchingPerfect).toBe(3);
    expect(result.countingGameCompletions).toBe(4);
    expect(result.totalGamesCompleted).toBe(15);
  });
});

// ─── mergeWordCollection ──────────────────────────────────────────────────────

describe('mergeWordCollection', () => {
  function makeWord(
    wordId: string,
    timesBuilt: number,
    firstBuiltDate: string,
    lastBuiltDate: string
  ): CollectedWord {
    return { wordId, timesBuilt, firstBuiltDate, lastBuiltDate };
  }

  it('cloud is null -> returns local unchanged', () => {
    const local: WordCollectionData = {
      collectedWords: [makeWord('food_תפוח', 2, '2026-01-01', '2026-01-05')],
      totalWordsBuilt: 2,
    };
    const result = mergeWordCollection(local, null);
    expect(result).toEqual(local);
  });

  it('local is null -> returns cloud unchanged', () => {
    const cloud: WordCollectionData = {
      collectedWords: [makeWord('food_תפוח', 3, '2026-01-02', '2026-01-06')],
      totalWordsBuilt: 3,
    };
    const result = mergeWordCollection(null, cloud);
    expect(result).toEqual(cloud);
  });

  it('sums timesBuilt for duplicate wordId', () => {
    const local: WordCollectionData = {
      collectedWords: [makeWord('food_תפוח', 2, '2026-01-01', '2026-01-05')],
      totalWordsBuilt: 2,
    };
    const cloud: WordCollectionData = {
      collectedWords: [makeWord('food_תפוח', 3, '2026-01-02', '2026-01-06')],
      totalWordsBuilt: 3,
    };
    const result = mergeWordCollection(local, cloud);
    const word = result.collectedWords.find((w) => w.wordId === 'food_תפוח');
    expect(word?.timesBuilt).toBe(5);
  });

  it('keeps earliest firstBuiltDate for duplicate wordId', () => {
    const local: WordCollectionData = {
      collectedWords: [makeWord('food_תפוח', 2, '2026-01-01', '2026-01-05')],
      totalWordsBuilt: 2,
    };
    const cloud: WordCollectionData = {
      collectedWords: [makeWord('food_תפוח', 3, '2026-01-03', '2026-01-06')],
      totalWordsBuilt: 3,
    };
    const result = mergeWordCollection(local, cloud);
    const word = result.collectedWords.find((w) => w.wordId === 'food_תפוח');
    expect(word?.firstBuiltDate).toBe('2026-01-01');
  });

  it('keeps latest lastBuiltDate for duplicate wordId', () => {
    const local: WordCollectionData = {
      collectedWords: [makeWord('food_תפוח', 2, '2026-01-01', '2026-01-05')],
      totalWordsBuilt: 2,
    };
    const cloud: WordCollectionData = {
      collectedWords: [makeWord('food_תפוח', 3, '2026-01-02', '2026-01-08')],
      totalWordsBuilt: 3,
    };
    const result = mergeWordCollection(local, cloud);
    const word = result.collectedWords.find((w) => w.wordId === 'food_תפוח');
    expect(word?.lastBuiltDate).toBe('2026-01-08');
  });

  it('adds words from cloud not in local', () => {
    const local: WordCollectionData = {
      collectedWords: [makeWord('food_תפוח', 2, '2026-01-01', '2026-01-05')],
      totalWordsBuilt: 2,
    };
    const cloud: WordCollectionData = {
      collectedWords: [makeWord('animals_כלב', 1, '2026-01-03', '2026-01-03')],
      totalWordsBuilt: 1,
    };
    const result = mergeWordCollection(local, cloud);
    expect(result.collectedWords).toHaveLength(2);
    const dog = result.collectedWords.find((w) => w.wordId === 'animals_כלב');
    expect(dog).toBeDefined();
  });

  it('takes Math.max for totalWordsBuilt', () => {
    const local: WordCollectionData = { collectedWords: [], totalWordsBuilt: 10 };
    const cloud: WordCollectionData = { collectedWords: [], totalWordsBuilt: 15 };
    const result = mergeWordCollection(local, cloud);
    expect(result.totalWordsBuilt).toBe(15);
  });
});

// ─── mergeStreak ─────────────────────────────────────────────────────────────

describe('mergeStreak', () => {
  function makeStreak(overrides: Partial<StreakData> = {}): StreakData {
    return {
      currentStreak: 0,
      lastActivityDate: '2026-01-01',
      longestStreak: 0,
      freezesRemaining: 1,
      freezeUsedThisWeek: false,
      weekStartDate: '2025-12-30',
      ...overrides,
    };
  }

  it('cloud is null -> returns local unchanged', () => {
    const local = makeStreak({ currentStreak: 5 });
    const result = mergeStreak(local, null);
    expect(result).toEqual(local);
  });

  it('local is null -> returns cloud unchanged', () => {
    const cloud = makeStreak({ currentStreak: 3 });
    const result = mergeStreak(null, cloud);
    expect(result).toEqual(cloud);
  });

  it('takes Math.max for currentStreak', () => {
    const local = makeStreak({ currentStreak: 5, lastActivityDate: '2026-01-10' });
    const cloud = makeStreak({ currentStreak: 3, lastActivityDate: '2026-01-08' });
    const result = mergeStreak(local, cloud);
    expect(result.currentStreak).toBe(5);
  });

  it('takes Math.max for longestStreak', () => {
    const local = makeStreak({ longestStreak: 7, lastActivityDate: '2026-01-05' });
    const cloud = makeStreak({ longestStreak: 10, lastActivityDate: '2026-01-04' });
    const result = mergeStreak(local, cloud);
    expect(result.longestStreak).toBe(10);
  });

  it('uses cloud as base when cloud has more recent lastActivityDate', () => {
    const local = makeStreak({
      currentStreak: 3,
      lastActivityDate: '2026-01-05',
      freezesRemaining: 1,
      freezeUsedThisWeek: false,
    });
    const cloud = makeStreak({
      currentStreak: 2,
      lastActivityDate: '2026-01-10',
      freezesRemaining: 0,
      freezeUsedThisWeek: true,
    });
    const result = mergeStreak(local, cloud);
    // Base from cloud (more recent)
    expect(result.freezesRemaining).toBe(0);
    expect(result.freezeUsedThisWeek).toBe(true);
  });

  it('uses local as base when local has more recent lastActivityDate', () => {
    const local = makeStreak({
      currentStreak: 5,
      lastActivityDate: '2026-01-15',
      freezesRemaining: 0,
      freezeUsedThisWeek: true,
    });
    const cloud = makeStreak({
      currentStreak: 3,
      lastActivityDate: '2026-01-08',
      freezesRemaining: 1,
      freezeUsedThisWeek: false,
    });
    const result = mergeStreak(local, cloud);
    // Base from local (more recent)
    expect(result.freezesRemaining).toBe(0);
    expect(result.freezeUsedThisWeek).toBe(true);
  });
});
