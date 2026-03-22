'use client';

import { useState, useEffect, useCallback } from 'react';
import { movementPuzzles, capturePuzzles, MovementPuzzle, CapturePuzzle } from '@/data/chessPuzzles';

export type DailyPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle };

const DAILY_STORAGE_PREFIX = 'lepdy_chess_daily_';

/**
 * Returns today's date as a UTC ISO date string (YYYY-MM-DD).
 * Matches the getTodayDate pattern from useStreak.ts.
 */
export function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns a deterministic daily puzzle for a given date string.
 * Uses djb2-style polynomial hash to map date string → puzzle index.
 * Same date always yields the same puzzle for all users.
 */
export function getDailyPuzzle(dateStr: string): DailyPuzzle {
  const allPuzzles: DailyPuzzle[] = [
    ...movementPuzzles.map((p) => ({ type: 'movement' as const, puzzle: p })),
    ...capturePuzzles.map((p) => ({ type: 'capture' as const, puzzle: p })),
  ];

  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }

  const index = Math.abs(hash) % allPuzzles.length;
  return allPuzzles[index];
}

export interface UseDailyPuzzleReturn {
  dateKey: string;
  dailyPuzzle: DailyPuzzle;
  isCompleted: boolean;
  markCompleted: () => void;
}

export function useDailyPuzzle(): UseDailyPuzzleReturn {
  const dateKey = getTodayUTC();
  const dailyPuzzle = getDailyPuzzle(dateKey);
  const storageKey = DAILY_STORAGE_PREFIX + dateKey;

  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Read localStorage on mount (SSR-safe: lazy init can't read window on server)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'true') {
        setIsCompleted(true);
      }
    } catch {
      // silently ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markCompleted = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch (e) {
      console.error('[chess] Failed to save daily puzzle completion:', e);
    }
    setIsCompleted(true);
  }, [storageKey]);

  return {
    dateKey,
    dailyPuzzle,
    isCompleted,
    markCompleted,
  };
}
