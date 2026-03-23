/**
 * Firebase Remote Config Provider
 *
 * Implementation of FeatureFlagProvider using Firebase Remote Config.
 * To switch to a different provider (e.g., LaunchDarkly, PostHog),
 * create a new file implementing the same FeatureFlagProvider interface.
 */

import {
  FeatureFlagProvider,
  FeatureFlagProviderConfig,
  FeatureFlags,
  FeatureFlagKey,
  FeatureFlagStatus,
  DEFAULT_FLAGS,
} from '../types';

type RemoteConfig = import('firebase/remote-config').RemoteConfig;

const DEFAULT_CONFIG: Required<FeatureFlagProviderConfig> = {
  minimumFetchIntervalMs: 1 * 60 * 1000, // 1 minute
  fetchOnInit: true,
};

export class FirebaseRemoteConfigProvider implements FeatureFlagProvider {
  private remoteConfig: RemoteConfig | null = null;
  private flags: FeatureFlags = { ...DEFAULT_FLAGS };
  private status: FeatureFlagStatus = 'loading';
  private subscribers: Set<(flags: FeatureFlags) => void> = new Set();
  private config: Required<FeatureFlagProviderConfig>;

  constructor(config: FeatureFlagProviderConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    // Skip on server-side
    if (typeof window === 'undefined') {
      this.status = 'ready';
      return;
    }

    try {
      const { getFirebaseApp } = await import('@/lib/firebaseApp');
      const { getRemoteConfig } = await import('firebase/remote-config');

      const app = await getFirebaseApp();
      this.remoteConfig = getRemoteConfig(app);

      // Set minimum fetch interval (use 0 in development for faster testing)
      this.remoteConfig.settings.minimumFetchIntervalMillis =
        process.env.NODE_ENV === 'development' ? 0 : this.config.minimumFetchIntervalMs;

      // Set default values
      this.remoteConfig.defaultConfig = this.convertFlagsToRemoteConfigDefaults();

      if (this.config.fetchOnInit) {
        await this.fetchFlags();
      }

      this.status = 'ready';
    } catch (error) {
      console.error('[FeatureFlags] Failed to initialize Firebase Remote Config:', error);
      this.status = 'error';
      // Continue with default values
    }
  }

  getFlag<K extends FeatureFlagKey>(key: K): FeatureFlags[K] {
    return this.flags[key];
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  async refresh(): Promise<void> {
    await this.fetchFlags();
  }

  getStatus(): FeatureFlagStatus {
    return this.status;
  }

  subscribe(callback: (flags: FeatureFlags) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private async fetchFlags(): Promise<void> {
    if (!this.remoteConfig) {
      return;
    }

    try {
      const { fetchAndActivate, getValue } = await import('firebase/remote-config');

      await fetchAndActivate(this.remoteConfig);

      // Read all flags from Remote Config
      // Use getSource() to check if value exists remotely, otherwise use our defaults
      const newFlags: FeatureFlags = {
        showStickersButton: this.getBooleanFlag('showStickersButton', getValue),
        showVoiceIndicator: this.getBooleanFlag('showVoiceIndicator', getValue),
        soundMatchingWrongAnswerDelayMs: this.getNumberFlag('soundMatchingWrongAnswerDelayMs', getValue),
        chessAdvanceTierThreshold: this.getNumberFlag('chessAdvanceTierThreshold', getValue),
        chessDemoTierThreshold: this.getNumberFlag('chessDemoTierThreshold', getValue),
        chessStarThreshold3: this.getNumberFlag('chessStarThreshold3', getValue),
        chessStarThreshold2: this.getNumberFlag('chessStarThreshold2', getValue),
        chessCheckmateEnabled: this.getBooleanFlag('chessCheckmateEnabled', getValue),
        cloudSyncEnabled: this.getBooleanFlag('cloudSyncEnabled', getValue),
      };

      this.flags = newFlags;
      this.notifySubscribers();
    } catch (error) {
      console.error('[FeatureFlags] Failed to fetch remote config:', error);
      // Keep using current/default values
    }
  }

  /**
   * Get a boolean flag value, falling back to DEFAULT_FLAGS if not set in remote config.
   * This handles the case where a parameter doesn't exist in Firebase yet.
   */
  private getBooleanFlag(
    key: FeatureFlagKey,
    getValue: typeof import('firebase/remote-config').getValue
  ): boolean {
    if (!this.remoteConfig) return DEFAULT_FLAGS[key] as boolean;

    const value = getValue(this.remoteConfig, key);
    // 'static' means the value wasn't found in remote config or defaults
    // 'default' means it's using our defaultConfig
    // 'remote' means it's from Firebase Remote Config
    if (value.getSource() === 'static') {
      return DEFAULT_FLAGS[key] as boolean;
    }
    return value.asBoolean();
  }

  /**
   * Get a number flag value, falling back to DEFAULT_FLAGS if not set in remote config.
   */
  private getNumberFlag(
    key: FeatureFlagKey,
    getValue: typeof import('firebase/remote-config').getValue
  ): number {
    if (!this.remoteConfig) return DEFAULT_FLAGS[key] as number;

    const value = getValue(this.remoteConfig, key);
    if (value.getSource() === 'static') {
      return DEFAULT_FLAGS[key] as number;
    }
    return value.asNumber();
  }

  private convertFlagsToRemoteConfigDefaults(): Record<string, string | number | boolean> {
    // Firebase Remote Config expects default values in this format
    return Object.entries(DEFAULT_FLAGS).reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string | number | boolean>
    );
  }

  private notifySubscribers(): void {
    const flagsCopy = { ...this.flags };
    this.subscribers.forEach((callback) => {
      try {
        callback(flagsCopy);
      } catch (error) {
        console.error('[FeatureFlags] Subscriber error:', error);
      }
    });
  }
}

/**
 * Create a Firebase Remote Config provider instance
 */
export function createFirebaseRemoteConfigProvider(
  config?: FeatureFlagProviderConfig
): FeatureFlagProvider {
  return new FirebaseRemoteConfigProvider(config);
}
