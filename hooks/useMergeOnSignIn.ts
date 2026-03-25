'use client';

import { useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import {
  mergeCategoryProgress,
  mergeGamesProgress,
  mergeWordCollection,
  mergeStreak,
} from '@/lib/mergeProgress';
import type { CategoryProgressData } from '@/hooks/useCategoryProgress';
import type { GamesProgressData } from '@/hooks/useGamesProgress';
import type { StreakData } from '@/hooks/useStreak';
import type { WordCollectionData } from '@/lib/mergeProgress';

// sessionStorage key — stores the uid after a successful merge so we never
// re-merge on token refresh or same-session re-render cycles.
const SESSION_KEY = 'lepdy_merge_done';

const STORAGE_KEYS = {
  letters: 'lepdy_letters_progress',
  numbers: 'lepdy_numbers_progress',
  animals: 'lepdy_animals_progress',
  games: 'lepdy_games_progress',
  words: 'lepdy_word_collection',
  streak: 'lepdy_streak_data',
} as const;

// RTDB sub-paths under users/{uid}/
const RTDB_PATHS = [
  'progress/letters',
  'progress/numbers',
  'progress/animals',
  'progress/games',
  'progress/words',
  'streak',
] as const;

type RtdbPath = (typeof RTDB_PATHS)[number];
type CloudData = Record<RtdbPath, unknown>;

/**
 * Fetch all 6 RTDB paths in parallel under users/{uid}/.
 * Returns null if the fetch fails, otherwise an object mapping each path to its data (or null
 * if that snapshot doesn't exist in RTDB yet).
 */
async function fetchCloudData(uid: string): Promise<CloudData | null> {
  try {
    const { getFirebaseDatabase } = await import('@/lib/firebase');
    const { ref, get } = await import('firebase/database');
    const db = await getFirebaseDatabase();

    const snapshots = await Promise.all(
      RTDB_PATHS.map((path) => get(ref(db, `users/${uid}/${path}`)))
    );

    const result: Partial<CloudData> = {};
    RTDB_PATHS.forEach((path, i) => {
      result[path] = snapshots[i].exists() ? snapshots[i].val() : null;
    });

    return result as CloudData;
  } catch (error) {
    console.error('[useMergeOnSignIn] fetchCloudData failed:', error);
    return null;
  }
}

interface LocalData {
  letters: CategoryProgressData | null;
  numbers: CategoryProgressData | null;
  animals: CategoryProgressData | null;
  games: GamesProgressData | null;
  words: WordCollectionData | null;
  streak: StreakData | null;
}

/**
 * Read all 6 localStorage keys and JSON.parse each one.
 * Returns null for any key that is missing or fails to parse.
 */
function readLocalStorage(): LocalData {
  const parse = <T>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };

  return {
    letters: parse<CategoryProgressData>(STORAGE_KEYS.letters),
    numbers: parse<CategoryProgressData>(STORAGE_KEYS.numbers),
    animals: parse<CategoryProgressData>(STORAGE_KEYS.animals),
    games: parse<GamesProgressData>(STORAGE_KEYS.games),
    words: parse<WordCollectionData>(STORAGE_KEYS.words),
    streak: parse<StreakData>(STORAGE_KEYS.streak),
  };
}

/**
 * Write merged results back to localStorage.
 */
function writeLocalStorage(
  letters: CategoryProgressData,
  numbers: CategoryProgressData,
  animals: CategoryProgressData,
  games: GamesProgressData,
  words: WordCollectionData,
  streak: StreakData
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.letters, JSON.stringify(letters));
    localStorage.setItem(STORAGE_KEYS.numbers, JSON.stringify(numbers));
    localStorage.setItem(STORAGE_KEYS.animals, JSON.stringify(animals));
    localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(games));
    localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(words));
    localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(streak));
  } catch (error) {
    console.error('[useMergeOnSignIn] writeLocalStorage failed:', error);
  }
}

/**
 * Fetch cloud data, merge with localStorage using union strategy, and write merged
 * data back to localStorage — WITHOUT reloading the page.
 *
 * Does NOT write to RTDB — the existing useProgressSync hooks in each context
 * provider will pick up the merged localStorage data after reload and sync to RTDB
 * via the debounced write path.
 *
 * @param uid  Firebase Auth user UID.
 * @returns    true if merge completed successfully, false if cloud fetch failed.
 */
export async function fetchAndMergeToLocalStorage(uid: string): Promise<boolean> {
  const cloud = await fetchCloudData(uid);

  // If cloud fetch failed, exit early — we cannot safely merge without cloud data.
  if (cloud === null) return false;

  const local = readLocalStorage();

  const mergedLetters = mergeCategoryProgress(
    local.letters,
    cloud['progress/letters'] as CategoryProgressData | null
  );
  const mergedNumbers = mergeCategoryProgress(
    local.numbers,
    cloud['progress/numbers'] as CategoryProgressData | null
  );
  const mergedAnimals = mergeCategoryProgress(
    local.animals,
    cloud['progress/animals'] as CategoryProgressData | null
  );
  const mergedGames = mergeGamesProgress(
    local.games,
    cloud['progress/games'] as GamesProgressData | null
  );
  const mergedWords = mergeWordCollection(
    local.words,
    cloud['progress/words'] as WordCollectionData | null
  );
  const mergedStreak = mergeStreak(
    local.streak,
    cloud['streak'] as StreakData | null
  );

  writeLocalStorage(mergedLetters, mergedNumbers, mergedAnimals, mergedGames, mergedWords, mergedStreak);

  return true;
}

/**
 * Fetch cloud data, merge with localStorage, then reload the page so all context
 * providers re-read the merged data from scratch.
 */
async function runMerge(uid: string): Promise<void> {
  const merged = await fetchAndMergeToLocalStorage(uid);
  if (merged) {
    // Force all context providers to re-initialize from merged localStorage data.
    window.location.reload();
  }
}

/**
 * Hook that detects a sign-in transition (null → User) and orchestrates the
 * cloud-read-and-merge flow exactly once per sign-in session.
 *
 * - No-op when user is null (signed out) or loading is true (auth initializing).
 * - No-op when sessionStorage already has the merge key for the current uid.
 * - No-op when the previous uid matches the current uid (token refresh, not sign-in).
 * - Calls runMerge(uid) on genuine sign-in, then records the uid in sessionStorage.
 *
 * @param user    Current Firebase Auth user (from useAuth).
 * @param loading True while Firebase Auth is still initializing.
 */
export function useMergeOnSignIn(user: User | null, loading: boolean): void {
  // undefined = "not yet resolved" (initial mount)
  // null = "auth resolved, user is signed out"
  // string = "auth resolved, user is signed in"
  const prevUidRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Wait for auth to resolve before doing anything
    if (loading) return;

    const prevUid = prevUidRef.current;
    const currentUid = user?.uid ?? null;

    // Detect genuine sign-in transition: had no uid before, now we have one.
    // prevUid === undefined means first mount (auth not yet resolved).
    // prevUid === null means was signed out; now signed in (currentUid !== null).
    const isSignInTransition =
      currentUid !== null && (prevUid === undefined || prevUid === null);

    // Always update ref to current uid after check
    prevUidRef.current = currentUid;

    if (!isSignInTransition) return;

    // Check if we already merged in this browser session for this uid
    if (sessionStorage.getItem(SESSION_KEY) === currentUid) return;

    // Run merge and record completion in sessionStorage when done
    runMerge(currentUid).then(() => {
      sessionStorage.setItem(SESSION_KEY, currentUid);
    });
  }, [user, loading]);
}
