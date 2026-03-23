'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, UseAuthReturn } from '@/hooks/useAuth';

const AuthContext = createContext<UseAuthReturn | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider that makes auth state available throughout the app.
 * Must be nested inside FeatureFlagProvider (reads cloudSyncEnabled flag).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const authValue = useAuth();
  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
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
