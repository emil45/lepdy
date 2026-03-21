'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lepdy_chess_progress';

export interface ChessProgressData {
  completedLevels: number[];
  currentLevel: number;
}

export interface UseChessProgressReturn {
  completedLevels: number[];
  completeLevel: (levelNum: number) => void;
  isLevelUnlocked: (levelNum: number) => boolean;
  isLevelCompleted: (levelNum: number) => boolean;
}

function getDefaultData(): ChessProgressData {
  return {
    completedLevels: [],
    currentLevel: 1,
  };
}

export function useChessProgress(): UseChessProgressReturn {
  const [data, setData] = useState<ChessProgressData>(getDefaultData);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.completedLevels)) {
            setData({
              completedLevels: parsed.completedLevels as number[],
              currentLevel: typeof parsed.currentLevel === 'number' ? parsed.currentLevel : 1,
            });
          }
        }
      } catch (e) {
        console.error('[chess] Failed to load progress:', e);
      }
    }

    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever data changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[chess] Failed to save progress:', e);
    }
  }, [data, isInitialized]);

  const completeLevel = useCallback((levelNum: number) => {
    setData((prev) => {
      const alreadyCompleted = prev.completedLevels.includes(levelNum);
      return {
        completedLevels: alreadyCompleted
          ? prev.completedLevels
          : [...prev.completedLevels, levelNum],
        currentLevel: Math.max(prev.currentLevel, levelNum + 1),
      };
    });
  }, []);

  const isLevelUnlocked = useCallback(
    (levelNum: number): boolean => {
      if (levelNum === 1) return true;
      return data.completedLevels.includes(levelNum - 1);
    },
    [data.completedLevels]
  );

  const isLevelCompleted = useCallback(
    (levelNum: number): boolean => {
      return data.completedLevels.includes(levelNum);
    },
    [data.completedLevels]
  );

  return {
    completedLevels: data.completedLevels,
    completeLevel,
    isLevelUnlocked,
    isLevelCompleted,
  };
}

export default useChessProgress;
