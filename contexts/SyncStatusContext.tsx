'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';

interface SyncStatusContextValue {
  showSaved: boolean;
  isOnline: boolean;
  notifySaved: () => void;
}

const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);

interface SyncStatusProviderProps {
  children: ReactNode;
  isOnline: boolean;
}

/**
 * Provides sync status state to the component tree.
 *
 * - `showSaved`: true for 2 seconds after a successful RTDB write (via notifySaved).
 * - `isOnline`: current online/offline status, passed in from the parent that calls useSyncStatus.
 * - `notifySaved`: call this after a successful sync write to trigger the saved indicator.
 */
export function SyncStatusProvider({ children, isOnline }: SyncStatusProviderProps) {
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifySaved = useCallback(() => {
    setShowSaved(true);
    // Clear any pending auto-hide timer before setting a new one
    if (savedTimerRef.current !== null) {
      clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = setTimeout(() => {
      setShowSaved(false);
      savedTimerRef.current = null;
    }, 2000);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  return (
    <SyncStatusContext.Provider value={{ showSaved, isOnline, notifySaved }}>
      {children}
    </SyncStatusContext.Provider>
  );
}

/**
 * Hook to access sync status state from any component.
 * Returns { showSaved, isOnline, notifySaved }.
 * Must be used within a SyncStatusProvider.
 */
export function useSyncStatusContext(): SyncStatusContextValue {
  const context = useContext(SyncStatusContext);
  if (!context) {
    throw new Error('useSyncStatusContext must be used within a SyncStatusProvider');
  }
  return context;
}
