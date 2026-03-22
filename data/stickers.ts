// Sticker definitions for the Sticker Book feature
// MVP: Only streak-based stickers (Page 5) are unlockable
// All others show as greyed placeholders

export interface Sticker {
  id: string;
  translationKey: string;
  emoji: string;
  pageNumber: number;
  // Unlock types:
  // - 'streak': daily streaks
  // - 'letters_progress': unique letters heard
  // - 'letters_total': total letter clicks/listens (practice milestone)
  // - 'numbers_progress': unique numbers heard
  // - 'numbers_total': total number clicks/listens (practice milestone)
  // - 'animals_progress': unique animals heard
  // - 'animals_total': total animal clicks/listens (practice milestone)
  // - 'games_played': unique games played (unlockValue = number of different games)
  // - 'memory_wins': number of memory match game wins
  // - 'simon_score': highest level reached in simon game
  // - 'speed_challenge_high': number of high accuracy speed challenge completions
  // - 'word_builder_completions': number of word builder game completions
  // - 'sound_matching_perfect': number of perfect sound matching scores
  // - 'counting_game_completions': number of counting game completions
  // - 'total_games_completed': total games completed across all types
  // - 'chess_level': chess level completed (unlockValue = level number 1-3)
  // - 'words_collected': unique Hebrew words collected in word builder
  // - 'words_category_complete': complete collection of a category (category specified in unlockValue as string e.g., "animals")
  // - 'future': shows as locked
  unlockType: 'streak' | 'letters_progress' | 'letters_total' | 'numbers_progress' | 'numbers_total' | 'animals_progress' | 'animals_total' | 'games_played' | 'memory_wins' | 'simon_score' | 'speed_challenge_high' | 'word_builder_completions' | 'sound_matching_perfect' | 'counting_game_completions' | 'total_games_completed' | 'chess_level' | 'words_collected' | 'future';
  // For streak: the streak day required
  // For letters_progress: unique letters heard count
  // For letters_total: total letter clicks count
  // For numbers_progress: unique numbers heard count
  // For numbers_total: total number clicks count
  unlockValue?: number;
}

export interface StickerPage {
  pageNumber: number;
  titleKey: string;
  color: string;
}

// 48 stickers across 6 pages
export const STICKERS: Sticker[] = [
  // Page 1: Letters - Discovery (unique letters heard)
  { id: 'letters_first', translationKey: 'stickers.letters.first', emoji: '🔤', pageNumber: 1, unlockType: 'letters_progress', unlockValue: 1 },
  { id: 'letters_five', translationKey: 'stickers.letters.five', emoji: '📝', pageNumber: 1, unlockType: 'letters_progress', unlockValue: 5 },
  { id: 'letters_ten', translationKey: 'stickers.letters.ten', emoji: '📖', pageNumber: 1, unlockType: 'letters_progress', unlockValue: 10 },
  { id: 'letters_fifteen', translationKey: 'stickers.letters.fifteen', emoji: '⭐', pageNumber: 1, unlockType: 'letters_progress', unlockValue: 15 },
  { id: 'letters_all', translationKey: 'stickers.letters.all', emoji: '🎓', pageNumber: 1, unlockType: 'letters_progress', unlockValue: 22 },
  // Page 1: Letters - Practice (total letter clicks)
  { id: 'letters_practice_50', translationKey: 'stickers.letters.practice50', emoji: '🎯', pageNumber: 1, unlockType: 'letters_total', unlockValue: 50 },
  { id: 'letters_practice_100', translationKey: 'stickers.letters.practice100', emoji: '💪', pageNumber: 1, unlockType: 'letters_total', unlockValue: 100 },
  { id: 'letters_practice_200', translationKey: 'stickers.letters.practice200', emoji: '🚀', pageNumber: 1, unlockType: 'letters_total', unlockValue: 200 },
  { id: 'letters_practice_300', translationKey: 'stickers.letters.practice300', emoji: '🏅', pageNumber: 1, unlockType: 'letters_total', unlockValue: 300 },

  // Page 2: Numbers - Discovery (unique numbers heard)
  { id: 'numbers_one', translationKey: 'stickers.numbers.one', emoji: '1️⃣', pageNumber: 2, unlockType: 'numbers_progress', unlockValue: 1 },
  { id: 'numbers_five', translationKey: 'stickers.numbers.five', emoji: '5️⃣', pageNumber: 2, unlockType: 'numbers_progress', unlockValue: 5 },
  { id: 'numbers_ten', translationKey: 'stickers.numbers.ten', emoji: '🔟', pageNumber: 2, unlockType: 'numbers_progress', unlockValue: 10 },
  // Page 2: Numbers - Practice (total number clicks)
  { id: 'numbers_practice_25', translationKey: 'stickers.numbers.practice25', emoji: '🎯', pageNumber: 2, unlockType: 'numbers_total', unlockValue: 25 },
  { id: 'numbers_practice_50', translationKey: 'stickers.numbers.practice50', emoji: '💪', pageNumber: 2, unlockType: 'numbers_total', unlockValue: 50 },
  { id: 'numbers_practice_100', translationKey: 'stickers.numbers.practice100', emoji: '🚀', pageNumber: 2, unlockType: 'numbers_total', unlockValue: 100 },
  { id: 'numbers_practice_200', translationKey: 'stickers.numbers.practice200', emoji: '🏅', pageNumber: 2, unlockType: 'numbers_total', unlockValue: 200 },

  // Page 3: Animals - Discovery (unique animals heard)
  { id: 'animals_first', translationKey: 'stickers.animals.first', emoji: '🐾', pageNumber: 3, unlockType: 'animals_progress', unlockValue: 1 },
  { id: 'animals_five', translationKey: 'stickers.animals.five', emoji: '🦁', pageNumber: 3, unlockType: 'animals_progress', unlockValue: 5 },
  { id: 'animals_all', translationKey: 'stickers.animals.all', emoji: '🐘', pageNumber: 3, unlockType: 'animals_progress', unlockValue: 19 },
  // Page 3: Animals - Practice (total animal clicks)
  { id: 'animals_sounds', translationKey: 'stickers.animals.sounds', emoji: '🔊', pageNumber: 3, unlockType: 'animals_total', unlockValue: 25 },
  { id: 'animals_zoo', translationKey: 'stickers.animals.zoo', emoji: '🦓', pageNumber: 3, unlockType: 'animals_total', unlockValue: 50 },

  // Page 4: Games - Achievement stickers for game progress (11 stickers!)
  { id: 'games_first', translationKey: 'stickers.games.first', emoji: '🎮', pageNumber: 4, unlockType: 'games_played', unlockValue: 1 },
  { id: 'games_three', translationKey: 'stickers.games.three', emoji: '🎲', pageNumber: 4, unlockType: 'games_played', unlockValue: 3 },
  { id: 'games_memory', translationKey: 'stickers.games.memory', emoji: '🧩', pageNumber: 4, unlockType: 'memory_wins', unlockValue: 5 },
  { id: 'games_simon5', translationKey: 'stickers.games.simon5', emoji: '🟢', pageNumber: 4, unlockType: 'simon_score', unlockValue: 5 },
  { id: 'games_simon7', translationKey: 'stickers.games.simon7', emoji: '🟡', pageNumber: 4, unlockType: 'simon_score', unlockValue: 7 },
  { id: 'games_simon10', translationKey: 'stickers.games.simon10', emoji: '🚦', pageNumber: 4, unlockType: 'simon_score', unlockValue: 10 },
  { id: 'games_speed', translationKey: 'stickers.games.speed', emoji: '⚡', pageNumber: 4, unlockType: 'speed_challenge_high', unlockValue: 3 },
  { id: 'games_words', translationKey: 'stickers.games.words', emoji: '✏️', pageNumber: 4, unlockType: 'word_builder_completions', unlockValue: 5 },
  { id: 'games_sounds', translationKey: 'stickers.games.sounds', emoji: '🎵', pageNumber: 4, unlockType: 'sound_matching_perfect', unlockValue: 3 },
  { id: 'games_counting', translationKey: 'stickers.games.counting', emoji: '🔢', pageNumber: 4, unlockType: 'counting_game_completions', unlockValue: 5 },
  { id: 'games_dedicated', translationKey: 'stickers.games.dedicated', emoji: '💎', pageNumber: 4, unlockType: 'total_games_completed', unlockValue: 25 },
  { id: 'games_master', translationKey: 'stickers.games.master', emoji: '🏆', pageNumber: 4, unlockType: 'games_played', unlockValue: 8 },
  { id: 'chess_intro', translationKey: 'stickers.games.chess1', emoji: '♟', pageNumber: 4, unlockType: 'chess_level', unlockValue: 1 },
  { id: 'chess_movement', translationKey: 'stickers.games.chess2', emoji: '♞', pageNumber: 4, unlockType: 'chess_level', unlockValue: 2 },
  { id: 'chess_capture', translationKey: 'stickers.games.chess3', emoji: '♛', pageNumber: 4, unlockType: 'chess_level', unlockValue: 3 },

  // Page 5: Streaks (THESE ARE UNLOCKABLE IN MVP!)
  { id: 'streak_day_1', translationKey: 'stickers.streaks.day1', emoji: '🔥', pageNumber: 5, unlockType: 'streak', unlockValue: 1 },
  { id: 'streak_day_3', translationKey: 'stickers.streaks.day3', emoji: '🌟', pageNumber: 5, unlockType: 'streak', unlockValue: 3 },
  { id: 'streak_day_7', translationKey: 'stickers.streaks.day7', emoji: '✨', pageNumber: 5, unlockType: 'streak', unlockValue: 7 },
  { id: 'streak_day_14', translationKey: 'stickers.streaks.day14', emoji: '💫', pageNumber: 5, unlockType: 'streak', unlockValue: 14 },
  { id: 'streak_day_30', translationKey: 'stickers.streaks.day30', emoji: '👑', pageNumber: 5, unlockType: 'streak', unlockValue: 30 },

  // Page 6: Word Collection - milestones for collecting words
  { id: 'words_first', translationKey: 'stickers.words.first', emoji: '📖', pageNumber: 6, unlockType: 'words_collected', unlockValue: 1 },
  { id: 'words_five', translationKey: 'stickers.words.five', emoji: '📝', pageNumber: 6, unlockType: 'words_collected', unlockValue: 5 },
  { id: 'words_ten', translationKey: 'stickers.words.ten', emoji: '📚', pageNumber: 6, unlockType: 'words_collected', unlockValue: 10 },
  { id: 'words_twenty', translationKey: 'stickers.words.twenty', emoji: '📕', pageNumber: 6, unlockType: 'words_collected', unlockValue: 20 },
  { id: 'words_fifty', translationKey: 'stickers.words.fifty', emoji: '📗', pageNumber: 6, unlockType: 'words_collected', unlockValue: 50 },
  { id: 'words_hundred', translationKey: 'stickers.words.hundred', emoji: '📘', pageNumber: 6, unlockType: 'words_collected', unlockValue: 100 },
  { id: 'words_collector', translationKey: 'stickers.words.collector', emoji: '🏅', pageNumber: 6, unlockType: 'words_collected', unlockValue: 150 },
];

// Page themes with colors
export const STICKER_PAGES: StickerPage[] = [
  { pageNumber: 1, titleKey: 'stickers.pages.letters', color: '#FF6B9D' },
  { pageNumber: 2, titleKey: 'stickers.pages.numbers', color: '#4ECDC4' },
  { pageNumber: 3, titleKey: 'stickers.pages.animals', color: '#FF8C42' },
  { pageNumber: 4, titleKey: 'stickers.pages.games', color: '#45B7D1' },
  { pageNumber: 5, titleKey: 'stickers.pages.streaks', color: '#FFD93D' },
  { pageNumber: 6, titleKey: 'stickers.pages.words', color: '#9B59B6' },
];

export const TOTAL_PAGES = 6;
export const TOTAL_STICKERS = 48;

// Helper to get stickers for a specific page
export function getStickersForPage(pageNumber: number): Sticker[] {
  return STICKERS.filter((s) => s.pageNumber === pageNumber);
}

// Helper to get page info
export function getPageInfo(pageNumber: number): StickerPage | undefined {
  return STICKER_PAGES.find((p) => p.pageNumber === pageNumber);
}

/**
 * Progress values needed to check sticker unlock conditions.
 * This interface defines the contract between progress contexts and sticker logic.
 */
export interface StickerProgressValues {
  // Streaks
  currentStreak: number;
  // Letters
  lettersHeard: number;
  lettersTotalClicks: number;
  // Numbers
  numbersHeard: number;
  numbersTotalClicks: number;
  // Animals
  animalsHeard: number;
  animalsTotalClicks: number;
  // Games
  uniqueGamesPlayed: number;
  memoryWins: number;
  simonHighScore: number;
  speedChallengeHighScores: number;
  wordBuilderCompletions: number;
  soundMatchingPerfect: number;
  countingGameCompletions: number;
  totalGamesCompleted: number;
  // Chess
  chessLevelsCompleted: number[];
  // Words
  uniqueWordsCollected: number;
}

/**
 * Pure function to check if a sticker's unlock requirements are met.
 * No React dependencies - can be used anywhere.
 */
export function checkStickerUnlock(sticker: Sticker, progress: StickerProgressValues): boolean {
  if (sticker.unlockValue === undefined) {
    return false;
  }

  switch (sticker.unlockType) {
    case 'streak':
      return progress.currentStreak >= sticker.unlockValue;
    case 'letters_progress':
      return progress.lettersHeard >= sticker.unlockValue;
    case 'letters_total':
      return progress.lettersTotalClicks >= sticker.unlockValue;
    case 'numbers_progress':
      return progress.numbersHeard >= sticker.unlockValue;
    case 'numbers_total':
      return progress.numbersTotalClicks >= sticker.unlockValue;
    case 'animals_progress':
      return progress.animalsHeard >= sticker.unlockValue;
    case 'animals_total':
      return progress.animalsTotalClicks >= sticker.unlockValue;
    case 'games_played':
      return progress.uniqueGamesPlayed >= sticker.unlockValue;
    case 'memory_wins':
      return progress.memoryWins >= sticker.unlockValue;
    case 'simon_score':
      return progress.simonHighScore >= sticker.unlockValue;
    case 'speed_challenge_high':
      return progress.speedChallengeHighScores >= sticker.unlockValue;
    case 'word_builder_completions':
      return progress.wordBuilderCompletions >= sticker.unlockValue;
    case 'sound_matching_perfect':
      return progress.soundMatchingPerfect >= sticker.unlockValue;
    case 'counting_game_completions':
      return progress.countingGameCompletions >= sticker.unlockValue;
    case 'total_games_completed':
      return progress.totalGamesCompleted >= sticker.unlockValue;
    case 'chess_level':
      return progress.chessLevelsCompleted.includes(sticker.unlockValue);
    case 'words_collected':
      return progress.uniqueWordsCollected >= sticker.unlockValue;
    case 'future':
      // Future stickers are placeholders that cannot be unlocked yet
      return false;
    default:
      console.warn(`[checkStickerUnlock] Unknown unlock type: "${sticker.unlockType}"`);
      return false;
  }
}

/**
 * Get all stickers that are currently unlocked based on progress.
 */
export function getUnlockedStickerIds(progress: StickerProgressValues): Set<string> {
  return new Set(
    STICKERS.filter((sticker) => checkStickerUnlock(sticker, progress)).map((s) => s.id)
  );
}
