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
 * @param uid   Firebase Auth user UID. If null, hook does nothing.
 * @param path  RTDB sub-path under users/{uid}/ (e.g. 'progress/letters', 'streak')
 * @param data  The data to write. JSON.stringify is used as dep-array key to avoid
 *              infinite re-renders from unstable object references.
 */
export function useProgressSync(uid: string | null, path: string, data: unknown): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<unknown>(data);

  // Always keep dataRef current so the timer callback reads the latest value.
  dataRef.current = data;

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
