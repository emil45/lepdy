// Amplitude Event Taxonomy for Lepdy
// Core analytics events for measuring user engagement and learning progress

export enum AmplitudeEventsEnum {
  // Session Events
  SESSION_START = 'session_start',

  // Category Interaction Events
  ITEM_TAPPED = 'item_tapped',
  AUDIO_PLAYED = 'audio_played',

  // Game Events
  GAME_STARTED = 'game_started',
  GAME_COMPLETED = 'game_completed',

  // Engagement Events
  STREAK_UPDATED = 'streak_updated',
  STICKER_EARNED = 'sticker_earned',

  // Navigation Events
  PAGE_VIEW = 'page_view',
  CATEGORY_VIEWED = 'category_viewed',

  // Chess Game Events
  CHESS_PUZZLE_ANSWERED = 'chess_puzzle_answered',

  // Legacy events (keeping for backwards compatibility)
  BUTTON_CLICK = 'button_click',
}

// Category types
export type CategoryType =
  | 'letters'
  | 'numbers'
  | 'colors'
  | 'shapes'
  | 'animals'
  | 'food';

// Game types
export type GameType =
  | 'guess-game'
  | 'memory-match-game'
  | 'simon-game'
  | 'speed-challenge'
  | 'word-builder'
  | 'counting-game'
  | 'letter-rain'
  | 'sound-matching';
  // letter-tracing disabled - needs proper implementation

// Locale types
export type LocaleType = 'he' | 'en' | 'ru';

// Event Properties Interfaces
export interface SessionStartProperties {
  locale: LocaleType;
  is_first_visit: boolean;
  referrer?: string;
}

export interface ItemTappedProperties {
  category: CategoryType;
  item_id: string;
  locale: LocaleType;
}

export interface AudioPlayedProperties {
  category: CategoryType;
  item_id: string;
  locale: LocaleType;
  audio_file: string;
}

export interface GameStartedProperties {
  game_type: GameType;
  locale: LocaleType;
  category?: CategoryType; // Some games are category-specific
}

export interface GameCompletedProperties {
  game_type: GameType;
  locale: LocaleType;
  score: number;
  duration_seconds: number;
  category?: CategoryType;
  level?: number;
}

export interface StreakUpdatedProperties {
  current_streak: number;
  previous_streak: number;
  longest_streak: number;
  freeze_used: boolean;
}

export interface StickerEarnedProperties {
  sticker_id: string;
  sticker_name: string;
  page_number: number;
  total_stickers: number;
}

export interface PageViewProperties {
  page: string;
  locale: LocaleType;
}

export interface CategoryViewedProperties {
  category: CategoryType;
  locale: LocaleType;
  items_count: number;
}

export interface ButtonClickProperties {
  button_name: string;
  page?: string;
}

export interface ChessPuzzleAnsweredProperties {
  puzzle_type: 'movement' | 'capture' | 'checkmate';
  correct: boolean;
  piece_id: string;
  difficulty: 1 | 2 | 3;
  session_index: number;
}

// Union type for all event properties
export type AmplitudeEventProperties =
  | SessionStartProperties
  | ItemTappedProperties
  | AudioPlayedProperties
  | GameStartedProperties
  | GameCompletedProperties
  | StreakUpdatedProperties
  | StickerEarnedProperties
  | PageViewProperties
  | CategoryViewedProperties
  | ButtonClickProperties
  | ChessPuzzleAnsweredProperties;

// Type-safe event logging helper types
export interface EventMap {
  [AmplitudeEventsEnum.SESSION_START]: SessionStartProperties;
  [AmplitudeEventsEnum.ITEM_TAPPED]: ItemTappedProperties;
  [AmplitudeEventsEnum.AUDIO_PLAYED]: AudioPlayedProperties;
  [AmplitudeEventsEnum.GAME_STARTED]: GameStartedProperties;
  [AmplitudeEventsEnum.GAME_COMPLETED]: GameCompletedProperties;
  [AmplitudeEventsEnum.STREAK_UPDATED]: StreakUpdatedProperties;
  [AmplitudeEventsEnum.STICKER_EARNED]: StickerEarnedProperties;
  [AmplitudeEventsEnum.PAGE_VIEW]: PageViewProperties;
  [AmplitudeEventsEnum.CATEGORY_VIEWED]: CategoryViewedProperties;
  [AmplitudeEventsEnum.BUTTON_CLICK]: ButtonClickProperties;
  [AmplitudeEventsEnum.CHESS_PUZZLE_ANSWERED]: ChessPuzzleAnsweredProperties;
}
