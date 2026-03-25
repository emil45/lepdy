'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useGamesProgress, UseGamesProgressReturn } from '@/hooks/useGamesProgress';
import { useProgressSync } from '@/hooks/useProgressSync';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSyncStatusContext } from '@/contexts/SyncStatusContext';

const GamesProgressContext = createContext<UseGamesProgressReturn | null>(null);

interface GamesProgressProviderProps {
  children: ReactNode;
}

export function GamesProgressProvider({ children }: GamesProgressProviderProps) {
  const gamesProgressValue = useGamesProgress();
  const { user } = useAuthContext();
  const { notifySaved } = useSyncStatusContext();

  const syncData = useMemo(() => ({
    completedGameTypes: Array.from(gamesProgressValue.completedGameTypes),
    memoryWins: gamesProgressValue.memoryWins,
    simonHighScore: gamesProgressValue.simonHighScore,
    speedChallengeHighScores: gamesProgressValue.speedChallengeHighScores,
    wordBuilderCompletions: gamesProgressValue.wordBuilderCompletions,
    soundMatchingPerfect: gamesProgressValue.soundMatchingPerfect,
    countingGameCompletions: gamesProgressValue.countingGameCompletions,
    totalGamesCompleted: gamesProgressValue.totalGamesCompleted,
  }), [
    gamesProgressValue.completedGameTypes,
    gamesProgressValue.memoryWins,
    gamesProgressValue.simonHighScore,
    gamesProgressValue.speedChallengeHighScores,
    gamesProgressValue.wordBuilderCompletions,
    gamesProgressValue.soundMatchingPerfect,
    gamesProgressValue.countingGameCompletions,
    gamesProgressValue.totalGamesCompleted,
  ]);

  useProgressSync(user?.uid ?? null, 'progress/games', syncData, notifySaved);

  return (
    <GamesProgressContext.Provider value={gamesProgressValue}>
      {children}
    </GamesProgressContext.Provider>
  );
}

export function useGamesProgressContext(): UseGamesProgressReturn {
  const context = useContext(GamesProgressContext);
  if (!context) {
    throw new Error('useGamesProgressContext must be used within a GamesProgressProvider');
  }
  return context;
}

export default GamesProgressContext;
