'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchAndMergeToLocalStorage } from '@/hooks/useMergeOnSignIn';

const VISIBILITY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

interface UseSyncStatusParams {
  uid: string | null;
  /** Set to false when cloudSyncEnabled flag is off or user is signed out. */
  enabled: boolean;
}

interface UseSyncStatusReturn {
  isOnline: boolean;
}

/**
 * Tracks online/offline status and re-fetches cloud data when the tab regains
 * visibility (throttled to once per 5 minutes).
 *
 * - `isOnline`: reflects navigator.onLine, updated via online/offline events.
 * - Visibility re-fetch: when the user returns to the tab and `enabled` is true,
 *   calls fetchAndMergeToLocalStorage to pull latest cloud data into localStorage
 *   without reloading the page (providing cross-device sync without disruption).
 *
 * @param uid      Firebase Auth user UID. Re-fetch is skipped if null.
 * @param enabled  false → no listeners attached, no re-fetches performed.
 */
export function useSyncStatus({ uid, enabled }: UseSyncStatusParams): UseSyncStatusReturn {
  // SSR-safe initialization — navigator is not available during SSR
  const [isOnline, setIsOnline] = useState<boolean>(
    () => (typeof navigator !== 'undefined' ? navigator.onLine : true)
  );

  const lastFetchRef = useRef<number>(0);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Visibility-change re-fetch
  useEffect(() => {
    if (!enabled || !uid) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastFetchRef.current < VISIBILITY_COOLDOWN_MS) return;

      lastFetchRef.current = now;
      fetchAndMergeToLocalStorage(uid).catch(console.error);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, uid]);

  return { isOnline };
}
