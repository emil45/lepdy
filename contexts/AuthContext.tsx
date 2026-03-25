'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, UseAuthReturn } from '@/hooks/useAuth';
import { useMergeOnSignIn } from '@/hooks/useMergeOnSignIn';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { SyncStatusProvider } from '@/contexts/SyncStatusContext';
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';

const AuthContext = createContext<UseAuthReturn | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider that makes auth state available throughout the app.
 * Must be nested inside FeatureFlagProvider (reads cloudSyncEnabled flag).
 * Wraps children in SyncStatusProvider so all progress contexts can access notifySaved.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const authValue = useAuth();
  useMergeOnSignIn(authValue.user, authValue.loading);
  const { getFlag } = useFeatureFlagContext();
  const cloudSyncEnabled = getFlag('cloudSyncEnabled');
  const { isOnline } = useSyncStatus({ uid: authValue.user?.uid ?? null, enabled: cloudSyncEnabled && !!authValue.user });
  return (
    <AuthContext.Provider value={authValue}>
      <SyncStatusProvider isOnline={isOnline}>
        {children}
      </SyncStatusProvider>
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state from any component.
 * Returns { user, loading, signInWithGoogle, signOut }.
 * Must be used within an AuthProvider.
 */
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
