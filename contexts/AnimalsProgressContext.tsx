'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAnimalsProgress, UseAnimalsProgressReturn } from '@/hooks/useAnimalsProgress';
import { useProgressSync } from '@/hooks/useProgressSync';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSyncStatusContext } from '@/contexts/SyncStatusContext';

const AnimalsProgressContext = createContext<UseAnimalsProgressReturn | null>(null);

interface AnimalsProgressProviderProps {
  children: ReactNode;
}

export function AnimalsProgressProvider({ children }: AnimalsProgressProviderProps) {
  const animalsProgressValue = useAnimalsProgress();
  const { user } = useAuthContext();
  const { notifySaved } = useSyncStatusContext();

  const syncData = useMemo(() => ({
    heardItemIds: Array.from(animalsProgressValue.heardAnimalIds),
    totalClicks: animalsProgressValue.totalClicks,
  }), [animalsProgressValue.heardAnimalIds, animalsProgressValue.totalClicks]);

  useProgressSync(user?.uid ?? null, 'progress/animals', syncData, notifySaved);

  return (
    <AnimalsProgressContext.Provider value={animalsProgressValue}>
      {children}
    </AnimalsProgressContext.Provider>
  );
}

export function useAnimalsProgressContext(): UseAnimalsProgressReturn {
  const context = useContext(AnimalsProgressContext);
  if (!context) {
    throw new Error('useAnimalsProgressContext must be used within an AnimalsProgressProvider');
  }
  return context;
}

export default AnimalsProgressContext;
