/**
 * Feature Flag System - Type Definitions
 *
 * This is the abstraction layer. All providers must implement these interfaces.
 * To switch providers (e.g., from Firebase to LaunchDarkly), only the provider
 * implementation needs to change - consumers remain unchanged.
 */

/**
 * All feature flags in the application.
 * Add new flags here with their default values.
 */
export interface FeatureFlags {
  showStickersButton: boolean;
  showVoiceIndicator: boolean;
  soundMatchingWrongAnswerDelayMs: number;
  /** Number of consecutive correct answers required to advance to the next puzzle tier. */
  chessAdvanceTierThreshold: number;
  /** Number of consecutive wrong answers required to de-escalate to the previous puzzle tier. */
  chessDemoTierThreshold: number;
  /** First-try correct count threshold for 3 stars on session complete screen (default 8 out of 10). */
  chessStarThreshold3: number;
  /** First-try correct count threshold for 2 stars on session complete screen (default 5 out of 10). */
  chessStarThreshold2: number;
  /** Enable checkmate-in-1 puzzles in Challenge sessions. */
  chessCheckmateEnabled: boolean;
  /** Gate all cloud sync UI. When false, auth is completely invisible and Firebase Auth never initializes. */
  cloudSyncEnabled: boolean;
}

/**
 * Default values for all feature flags.
 * These are used when:
 * - The provider hasn't loaded yet
 * - The provider fails to fetch
 * - A flag doesn't exist in the remote config
 */
export const DEFAULT_FLAGS: FeatureFlags = {
  showStickersButton: false,
  showVoiceIndicator: false,
  soundMatchingWrongAnswerDelayMs: 2500,
  chessAdvanceTierThreshold: 5,
  chessDemoTierThreshold: 3,
  chessStarThreshold3: 8,
  chessStarThreshold2: 5,
  chessCheckmateEnabled: false,
  cloudSyncEnabled: false,
};

/**
 * Type-safe flag names
 */
export type FeatureFlagKey = keyof FeatureFlags;

/**
 * Status of the feature flag provider
 */
export type FeatureFlagStatus = 'loading' | 'ready' | 'error';

/**
 * Interface that all feature flag providers must implement.
 * This is the contract that allows swapping providers easily.
 */
export interface FeatureFlagProvider {
  /**
   * Initialize the provider and fetch initial flag values
   */
  initialize(): Promise<void>;

  /**
   * Get the current value of a flag
   */
  getFlag<K extends FeatureFlagKey>(key: K): FeatureFlags[K];

  /**
   * Get all current flag values
   */
  getAllFlags(): FeatureFlags;

  /**
   * Refresh flags from the remote source
   */
  refresh(): Promise<void>;

  /**
   * Current status of the provider
   */
  getStatus(): FeatureFlagStatus;

  /**
   * Subscribe to flag changes (for real-time updates)
   * Returns an unsubscribe function
   */
  subscribe(callback: (flags: FeatureFlags) => void): () => void;
}

/**
 * Configuration for creating a feature flag provider
 */
export interface FeatureFlagProviderConfig {
  /**
   * Minimum time between fetches in milliseconds
   * Default: 5 minutes
   */
  minimumFetchIntervalMs?: number;

  /**
   * Whether to fetch on initialization
   * Default: true
   */
  fetchOnInit?: boolean;
}
