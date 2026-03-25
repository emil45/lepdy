'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useLettersProgress, UseLettersProgressReturn } from '@/hooks/useLettersProgress';
import { useProgressSync } from '@/hooks/useProgressSync';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSyncStatusContext } from '@/contexts/SyncStatusContext';

const LettersProgressContext = createContext<UseLettersProgressReturn | null>(null);

interface LettersProgressProviderProps {
  children: ReactNode;
}

export function LettersProgressProvider({ children }: LettersProgressProviderProps) {
  const lettersProgressValue = useLettersProgress();
  const { user } = useAuthContext();
  const { notifySaved } = useSyncStatusContext();

  const syncData = useMemo(() => ({
    heardItemIds: Array.from(lettersProgressValue.heardLetterIds),
    totalClicks: lettersProgressValue.totalClicks,
  }), [lettersProgressValue.heardLetterIds, lettersProgressValue.totalClicks]);

  useProgressSync(user?.uid ?? null, 'progress/letters', syncData, notifySaved);

  return (
    <LettersProgressContext.Provider value={lettersProgressValue}>
      {children}
    </LettersProgressContext.Provider>
  );
}

export function useLettersProgressContext(): UseLettersProgressReturn {
  const context = useContext(LettersProgressContext);
  if (!context) {
    throw new Error('useLettersProgressContext must be used within a LettersProgressProvider');
  }
  return context;
}

export default LettersProgressContext;
