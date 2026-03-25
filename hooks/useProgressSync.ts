'use client';

import { useEffect, useRef } from 'react';

const DEBOUNCE_MS = 30_000;

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
 */
export function useProgressSync(
  uid: string | null,
  path: string,
  data: unknown,
  onSyncComplete?: () => void
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<unknown>(data);
  const onSyncCompleteRef = useRef(onSyncComplete);

  // Always keep refs current so timer callbacks read the latest values.
  dataRef.current = data;
  onSyncCompleteRef.current = onSyncComplete;

  const serialized = JSON.stringify(data);

  useEffect(() => {
    if (!uid) return;

    // Clear any pending write before scheduling a new one.
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        const { getFirebaseDatabase } = await import('@/lib/firebase');
        const { ref, set } = await import('firebase/database');
        const db = await getFirebaseDatabase();
        await set(ref(db, `users/${uid}/${path}`), dataRef.current);
        onSyncCompleteRef.current?.();
      } catch (error) {
        console.error(`[sync:${path}] Write failed:`, error);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [uid, path, serialized]);
}
