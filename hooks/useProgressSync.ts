'use client';

import { useEffect, useRef } from 'react';

const DEBOUNCE_MS = 30_000;

interface UseProgressSyncOptions {
  debounceMs?: number;
  flushOnBackground?: boolean;
}

/**
 * Debounced cloud sync hook for writing user progress to Firebase RTDB.
 *
 * - When uid is null (signed-out), this hook is a complete no-op.
 * - Debounces writes by 30 seconds to avoid excessive RTDB writes.
 * - Uses dynamic imports for firebase/database to prevent SSR errors.
 * - Wraps writes in try/catch to ensure sync failures never crash the app.
 *
 * @param uid              Firebase Auth user UID. If null, hook does nothing.
 * @param path             RTDB sub-path under users/{uid}/ (e.g. 'progress/letters', 'streak')
 * @param data             The data to write. JSON.stringify is used as dep-array key to avoid
 *                         infinite re-renders from unstable object references.
 * @param onSyncComplete   Optional callback fired after a successful RTDB write. Use to trigger
 *                         UI feedback (e.g. "saved" indicator). Not included in dep array to
 *                         avoid resetting the 30s debounce timer on callback identity changes.
 * @param options          Optional per-path sync behavior overrides.
 */
export function useProgressSync(
  uid: string | null,
  path: string,
  data: unknown,
  onSyncComplete?: () => void,
  options?: UseProgressSyncOptions
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<unknown>(data);
  const onSyncCompleteRef = useRef(onSyncComplete);
  const syncInFlightRef = useRef(false);

  // Always keep refs current so timer callbacks read the latest values.
  dataRef.current = data;
  onSyncCompleteRef.current = onSyncComplete;

  const serialized = JSON.stringify(data);
  const debounceMs = options?.debounceMs ?? DEBOUNCE_MS;
  const flushOnBackground = options?.flushOnBackground ?? false;

  useEffect(() => {
    if (!uid) return;

    const syncNow = async () => {
      if (syncInFlightRef.current) return;

      syncInFlightRef.current = true;

      try {
        const { getFirebaseDatabase } = await import('@/lib/firebase');
        const { ref, set } = await import('firebase/database');
        const db = await getFirebaseDatabase();
        await set(ref(db, `users/${uid}/${path}`), dataRef.current);
        onSyncCompleteRef.current?.();
      } catch (error) {
        console.error(`[sync:${path}] Write failed:`, error);
      } finally {
        syncInFlightRef.current = false;
      }
    };

    // Clear any pending write before scheduling a new one.
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void syncNow();
    }, debounceMs);

    const flushPendingSync = () => {
      if (timerRef.current === null) return;

      clearTimeout(timerRef.current);
      timerRef.current = null;
      void syncNow();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSync();
      }
    };

    if (flushOnBackground) {
      window.addEventListener('pagehide', flushPendingSync);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (flushOnBackground) {
        window.removeEventListener('pagehide', flushPendingSync);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [uid, path, serialized, debounceMs, flushOnBackground]);
}
