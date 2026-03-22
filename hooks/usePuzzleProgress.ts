'use client';

import { useState, useEffect, useCallback, useRef, MutableRefObject } from 'react';
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';
import { ChessPieceId } from '@/data/chessPieces';

const STORAGE_KEY = 'lepdy_chess_puzzle_progress';

export interface PiecePuzzleProgress {
  tier: 1 | 2 | 3;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

export interface PuzzleProgressData {
  /** Keyed by ChessPieceId — each piece tracks its own tier and streaks independently */
  pieces: Record<string, PiecePuzzleProgress>;
}

export interface UsePuzzleProgressReturn {
  /**
   * Returns the session-frozen tier for a piece.
   * On first call per piece, captures and freezes the stored tier for the entire session.
   * Subsequent mutations (recordCorrect/recordWrong) update localStorage but NOT this session value.
   */
  getSessionTier: (pieceId: ChessPieceId) => 1 | 2 | 3;
  /** Record a correct answer for a piece — may advance tier after chessAdvanceTierThreshold consecutive correct */
  recordCorrect: (pieceId: ChessPieceId) => void;
  /** Record a wrong answer for a piece — may de-escalate tier after chessDemoTierThreshold consecutive wrong */
  recordWrong: (pieceId: ChessPieceId) => void;
  /**
   * Ref to session-frozen tiers map (for debugging/display).
   * Access via sessionTiers.current outside of render (e.g. in callbacks/effects).
   */
  sessionTiers: MutableRefObject<Record<string, 1 | 2 | 3>>;
  /** Raw persisted data (for display/debugging) */
  data: PuzzleProgressData;
}

const DEFAULT_PIECE_PROGRESS: PiecePuzzleProgress = {
  tier: 1,
  consecutiveCorrect: 0,
  consecutiveWrong: 0,
};

export function usePuzzleProgress(): UsePuzzleProgressReturn {
  const [data, setData] = useState<PuzzleProgressData>({ pieces: {} });
  const [isInitialized, setIsInitialized] = useState(false);
  const { getFlag } = useFeatureFlagContext();

  // Load from localStorage on mount (SSR guard)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.pieces !== null && typeof parsed.pieces === 'object') {
            setData({ pieces: parsed.pieces as Record<string, PiecePuzzleProgress> });
          }
        }
      } catch (e) {
        console.error('[chess] Failed to load puzzle progress:', e);
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
      console.error('[chess] Failed to save puzzle progress:', e);
    }
  }, [data, isInitialized]);

  /**
   * SESSION-FROZEN TIER
   * Captures the tier for each piece at the moment it is first requested in this session.
   * Returns that frozen value for the rest of the session — no mid-session difficulty changes.
   */
  const sessionTiersRef = useRef<Record<string, 1 | 2 | 3>>({});

  const getSessionTier = useCallback(
    (pieceId: ChessPieceId): 1 | 2 | 3 => {
      if (sessionTiersRef.current[pieceId] === undefined) {
        sessionTiersRef.current[pieceId] = (data.pieces[pieceId] ?? DEFAULT_PIECE_PROGRESS).tier;
      }
      return sessionTiersRef.current[pieceId];
    },
    [data.pieces]
  );

  const recordCorrect = useCallback(
    (pieceId: ChessPieceId) => {
      setData((prev) => {
        const current = prev.pieces[pieceId] ?? DEFAULT_PIECE_PROGRESS;
        const nextCorrect = current.consecutiveCorrect + 1;
        const advanceThreshold = getFlag('chessAdvanceTierThreshold') as number;
        const shouldAdvance = nextCorrect >= advanceThreshold;
        return {
          ...prev,
          pieces: {
            ...prev.pieces,
            [pieceId]: {
              tier: shouldAdvance ? (Math.min(3, current.tier + 1) as 1 | 2 | 3) : current.tier,
              consecutiveCorrect: shouldAdvance ? 0 : nextCorrect,
              consecutiveWrong: 0,
            },
          },
        };
      });
    },
    [getFlag]
  );

  const recordWrong = useCallback(
    (pieceId: ChessPieceId) => {
      setData((prev) => {
        const current = prev.pieces[pieceId] ?? DEFAULT_PIECE_PROGRESS;
        const nextWrong = current.consecutiveWrong + 1;
        const demoThreshold = getFlag('chessDemoTierThreshold') as number;
        const shouldDemote = nextWrong >= demoThreshold;
        return {
          ...prev,
          pieces: {
            ...prev.pieces,
            [pieceId]: {
              tier: shouldDemote ? (Math.max(1, current.tier - 1) as 1 | 2 | 3) : current.tier,
              consecutiveWrong: shouldDemote ? 0 : nextWrong,
              consecutiveCorrect: 0,
            },
          },
        };
      });
    },
    [getFlag]
  );

  return {
    getSessionTier,
    recordCorrect,
    recordWrong,
    sessionTiers: sessionTiersRef,
    data,
  };
}

export default usePuzzleProgress;
