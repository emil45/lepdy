'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useWordCollectionProgress, UseWordCollectionReturn } from '@/hooks/useWordCollectionProgress';
import { useProgressSync } from '@/hooks/useProgressSync';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSyncStatusContext } from '@/contexts/SyncStatusContext';

const WordCollectionContext = createContext<UseWordCollectionReturn | null>(null);

interface WordCollectionProviderProps {
  children: ReactNode;
}

export function WordCollectionProvider({ children }: WordCollectionProviderProps) {
  const wordCollectionValue = useWordCollectionProgress();
  const { user } = useAuthContext();
  const { notifySaved } = useSyncStatusContext();

  const syncData = useMemo(() => ({
    collectedWords: wordCollectionValue.collectedWords,
    totalWordsBuilt: wordCollectionValue.totalWordsBuilt,
  }), [wordCollectionValue.collectedWords, wordCollectionValue.totalWordsBuilt]);

  useProgressSync(user?.uid ?? null, 'progress/words', syncData, notifySaved);

  return (
    <WordCollectionContext.Provider value={wordCollectionValue}>
      {children}
    </WordCollectionContext.Provider>
  );
}

export function useWordCollectionContext(): UseWordCollectionReturn {
  const context = useContext(WordCollectionContext);
  if (!context) {
    throw new Error('useWordCollectionContext must be used within a WordCollectionProvider');
  }
  return context;
}

export default WordCollectionContext;
