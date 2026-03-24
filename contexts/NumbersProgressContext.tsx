'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useNumbersProgress, UseNumbersProgressReturn } from '@/hooks/useNumbersProgress';
import { useProgressSync } from '@/hooks/useProgressSync';
import { useAuthContext } from '@/contexts/AuthContext';

const NumbersProgressContext = createContext<UseNumbersProgressReturn | null>(null);

interface NumbersProgressProviderProps {
  children: ReactNode;
}

export function NumbersProgressProvider({ children }: NumbersProgressProviderProps) {
  const numbersProgressValue = useNumbersProgress();
  const { user } = useAuthContext();

  const syncData = useMemo(() => ({
    heardItemIds: Array.from(numbersProgressValue.heardNumberIds),
    totalClicks: numbersProgressValue.totalClicks,
  }), [numbersProgressValue.heardNumberIds, numbersProgressValue.totalClicks]);

  useProgressSync(user?.uid ?? null, 'progress/numbers', syncData);

  return (
    <NumbersProgressContext.Provider value={numbersProgressValue}>
      {children}
    </NumbersProgressContext.Provider>
  );
}

export function useNumbersProgressContext(): UseNumbersProgressReturn {
  const context = useContext(NumbersProgressContext);
  if (!context) {
    throw new Error('useNumbersProgressContext must be used within a NumbersProgressProvider');
  }
  return context;
}

export default NumbersProgressContext;
