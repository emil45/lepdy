'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';

export interface UseAuthReturn {
  /** Current Firebase user, or null if not authenticated */
  user: User | null;
  /** True while Firebase Auth is initializing */
  loading: boolean;
  /** Sign in with Google — uses redirect on iOS, popup on desktop */
  signInWithGoogle: () => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { getFlag } = useFeatureFlagContext();
  const cloudSyncEnabled = getFlag('cloudSyncEnabled');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // AUTH-04: When flag is off, skip Firebase Auth entirely
    if (!cloudSyncEnabled) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      if (typeof window === 'undefined') return;

      const { getFirebaseAuth } = await import('@/lib/firebaseAuth');
      const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth');
      const auth = await getFirebaseAuth();

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });

      // Complete any pending redirect flow (iOS Safari — Pitfall 2)
      try {
        await getRedirectResult(auth);
      } catch {
        // Not a redirect flow — normal on desktop
      }
    };

    init();

    return () => {
      unsubscribe?.();
    };
  }, [cloudSyncEnabled]);

  const signInWithGoogle = useCallback(async () => {
    const { getFirebaseAuth, isIOS } = await import('@/lib/firebaseAuth');
    const {
      GoogleAuthProvider,
      signInWithPopup,
      signInWithRedirect,
      browserPopupRedirectResolver,
    } = await import('firebase/auth');

    const auth = await getFirebaseAuth();
    const provider = new GoogleAuthProvider();

    // AUTH-05: Redirect on iOS (popup is blocked), popup on desktop
    if (isIOS()) {
      await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
    } else {
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    const { getFirebaseAuth } = await import('@/lib/firebaseAuth');
    const { signOut: firebaseSignOut } = await import('firebase/auth');
    const auth = await getFirebaseAuth();
    await firebaseSignOut(auth);
  }, []);

  return { user, loading, signInWithGoogle, signOut: signOutUser };
}
