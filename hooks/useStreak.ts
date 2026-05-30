'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface StreakData {
  currentStreak: number;
  lastActivityDate: string; // ISO date (YYYY-MM-DD)
  longestStreak: number;
  freezesRemaining: number;
  freezeUsedThisWeek: boolean;
  weekStartDate: string; // ISO date for tracking freeze reset
}

const STORAGE_KEY = 'lepdy_streak_data';
const HOURS_UNTIL_STREAK_BREAK = 48; // More forgiving than 24h for families

function getDefaultStreakData(): StreakData {
  return {
    currentStreak: 0,
    lastActivityDate: '',
    longestStreak: 0,
    freezesRemaining: 1,
    freezeUsedThisWeek: false,
    weekStartDate: getWeekStartDate(),
  };
}

function getWeekStartDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Get Monday of current week (Monday = 1, Sunday = 0)
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  return monday.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function hoursSinceDate(dateString: string): number {
  if (!dateString) return Infinity;
  const date = new Date(dateString + 'T23:59:59');
  const now = new Date();
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

function loadStreakData(): StreakData {
  if (typeof window === 'undefined') {
    return getDefaultStreakData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load streak data:', error);
  }
  return getDefaultStreakData();
}

function saveStreakData(data: StreakData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save streak data:', error);
  }
}

export interface UseStreakReturn {
  streakData: StreakData;
  recordActivity: () => void;
  isStreakAtRisk: boolean;
  hasActivityToday: boolean;
  milestones: number[];
  isNewMilestone: (streak: number) => boolean;
}

export function useStreak(): UseStreakReturn {
  const [streakData, setStreakData] = useState<StreakData>(getDefaultStreakData);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load streak data on mount
  useEffect(() => {
    const data = loadStreakData();
    const currentWeekStart = getWeekStartDate();

    // Reset freeze if new week started
    if (data.weekStartDate !== currentWeekStart) {
      data.freezesRemaining = 1;
      data.freezeUsedThisWeek = false;
      data.weekStartDate = currentWeekStart;
    }

    // Check if streak should be broken or freeze used
    const hoursSinceLastActivity = hoursSinceDate(data.lastActivityDate);

    if (hoursSinceLastActivity >= HOURS_UNTIL_STREAK_BREAK && data.currentStreak > 0) {
      // Streak would break - check if we can use freeze
      if (data.freezesRemaining > 0 && !data.freezeUsedThisWeek) {
        // Use freeze to save streak
        data.freezesRemaining = 0;
        data.freezeUsedThisWeek = true;
        // Don't break the streak, but don't increment it either
      } else {
        // No freeze available - streak breaks
        data.currentStreak = 0;
      }
    }

    setStreakData(data);
    saveStreakData(data);
    setIsInitialized(true);
  }, []);

  // Save whenever streakData changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      saveStreakData(streakData);
    }
  }, [streakData, isInitialized]);

  const recordActivity = useCallback(() => {
    setStreakData((prev) => {
      const today = getTodayDate();

      // Already recorded activity today
      if (prev.lastActivityDate === today) {
        return prev;
      }

      const newStreak = prev.currentStreak + 1;
      const newLongestStreak = Math.max(newStreak, prev.longestStreak);

      return {
        ...prev,
        currentStreak: newStreak,
        lastActivityDate: today,
        longestStreak: newLongestStreak,
      };
    });
  }, []);

  const hasActivityToday = streakData.lastActivityDate === getTodayDate();

  // Streak is at risk if more than 24 hours since last activity (warning before 48h break)
  const hoursSinceLastActivity = hoursSinceDate(streakData.lastActivityDate);
  const isStreakAtRisk =
    streakData.currentStreak > 0 &&
    !hasActivityToday &&
    hoursSinceLastActivity >= 24 &&
    hoursSinceLastActivity < HOURS_UNTIL_STREAK_BREAK;

  const milestones = useMemo(() => [3, 7, 14, 30, 60, 100], []);

  const isNewMilestone = useCallback(
    (streak: number): boolean => {
      return milestones.includes(streak);
    },
    [milestones]
  );

  return {
    streakData,
    recordActivity,
    isStreakAtRisk,
    hasActivityToday,
    milestones,
    isNewMilestone,
  };
}

export default useStreak;
