'use client';

import { useState, useEffect, useCallback, MutableRefObject } from 'react';
import { movementPuzzles, capturePuzzles, checkmatePuzzles, MovementPuzzle, CapturePuzzle, CheckmatePuzzle } from '@/data/chessPuzzles';
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';
import { chessPieces, ChessPieceId } from '@/data/chessPieces';
import { defaultGeneratorState, selectNextPuzzle, GeneratorState } from '@/utils/puzzleGenerator';
import { usePuzzleProgress, PiecePuzzleProgress } from '@/hooks/usePuzzleProgress';

const SESSION_STORAGE_KEY = 'lepdy_chess_session';
const SESSION_SIZE = 10;

export type SessionPuzzle =
  | { type: 'movement'; puzzle: MovementPuzzle }
  | { type: 'capture'; puzzle: CapturePuzzle }
  | { type: 'checkmate'; puzzle: CheckmatePuzzle };

export interface UsePuzzleSessionReturn {
  currentPuzzle: SessionPuzzle | null;
  sessionIndex: number;       // 0-based, 0-9
  consecutiveCorrect: number; // session-scoped streak
  isSessionComplete: boolean; // true when sessionIndex reaches 10
  onAnswer: (correct: boolean) => void;
  startNewSession: () => void;
  // firstTryCount is session-memory-only — mid-session refresh resets to 0 (acceptable for 10-puzzle session)
  firstTryCount: number;
  sessionTiers: MutableRefObject<Record<string, 1 | 2 | 3>>;
  currentTiersByPiece: Record<string, PiecePuzzleProgress>;
  pieceAnswerCounts: Record<string, { correct: number; total: number }>;
}

interface PersistedSession {
  queue: Array<{ type: 'movement' | 'capture' | 'checkmate'; id: string }>;
  headIndex: number;
  consecutiveCorrect: number;
}

/**
 * Build a fresh 10-puzzle session queue:
 * 5 movement + 5 capture puzzles, interleaved (mov, cap, mov, cap...)
 * Movement slots rotate through the first 5 pieces by order (king, rook, bishop, queen, knight).
 * Capture slots pick a random piece for each slot.
 */
function buildSessionQueue(
  getSessionTier: (pieceId: ChessPieceId) => 1 | 2 | 3,
  checkmateEnabled: boolean
): SessionPuzzle[] {
  const queue: SessionPuzzle[] = [];
  let genState: GeneratorState = defaultGeneratorState();

  // Pieces sorted by order: king(1), rook(2), bishop(3), queen(4), knight(5) — 5 pieces for 5 movement slots
  const movementPieces = [...chessPieces].sort((a, b) => a.order - b.order).slice(0, 5);

  for (let i = 0; i < 5; i++) {
    // Movement slot
    const movPiece = movementPieces[i];
    const movTier = getSessionTier(movPiece.id);
    const { puzzle: movPuzzle, nextState: afterMov } = selectNextPuzzle(movementPuzzles, movTier, genState);
    genState = afterMov;
    queue.push({ type: 'movement', puzzle: movPuzzle });

    if (checkmateEnabled && i === 4) {
      // Last slot: inject one checkmate puzzle at difficulty tier 1
      // Checkmate puzzles span multiple piece types, so tier is fixed (not per-piece)
      const { puzzle: matePuzzle, nextState: afterMate } = selectNextPuzzle(checkmatePuzzles, 1, genState);
      genState = afterMate;
      queue.push({ type: 'checkmate', puzzle: matePuzzle });
    } else {
      // Capture slot — random piece from all chessPieces
      const capPiece = chessPieces[Math.floor(Math.random() * chessPieces.length)];
      const capTier = getSessionTier(capPiece.id);
      const { puzzle: capPuzzle, nextState: afterCap } = selectNextPuzzle(capturePuzzles, capTier, genState);
      genState = afterCap;
      queue.push({ type: 'capture', puzzle: capPuzzle });
    }
  }

  return queue;
}

/**
 * Attempt to load and hydrate a persisted session from sessionStorage.
 * Returns the full queue if valid, or null if missing/invalid.
 */
function hydrateSession(raw: string): SessionPuzzle[] | null {
  try {
    const parsed: PersistedSession = JSON.parse(raw);
    if (
      !Array.isArray(parsed.queue) ||
      typeof parsed.headIndex !== 'number' ||
      typeof parsed.consecutiveCorrect !== 'number'
    ) {
      return null;
    }

    const queue: SessionPuzzle[] = [];
    for (const entry of parsed.queue) {
      if (entry.type === 'movement') {
        const puzzle = movementPuzzles.find((p) => p.id === entry.id);
        if (!puzzle) return null; // ID lookup failed — discard session
        queue.push({ type: 'movement', puzzle });
      } else if (entry.type === 'capture') {
        const puzzle = capturePuzzles.find((p) => p.id === entry.id);
        if (!puzzle) return null; // ID lookup failed — discard session
        queue.push({ type: 'capture', puzzle });
      } else if (entry.type === 'checkmate') {
        const puzzle = checkmatePuzzles.find((p) => p.id === entry.id);
        if (!puzzle) return null; // ID lookup failed — discard session
        queue.push({ type: 'checkmate', puzzle });
      } else {
        return null;
      }
    }

    return queue;
  } catch {
    return null;
  }
}

export function usePuzzleSession(): UsePuzzleSessionReturn {
  const { getSessionTier, recordCorrect, recordWrong, sessionTiers, data } = usePuzzleProgress();
  const { getFlag } = useFeatureFlagContext();
  const checkmateEnabled = getFlag('chessCheckmateEnabled');

  const [queue, setQueue] = useState<SessionPuzzle[]>([]);
  const [headIndex, setHeadIndex] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [pieceAnswerCounts, setPieceAnswerCounts] = useState<Record<string, { correct: number; total: number }>>({});

  // Initialize session from sessionStorage or fresh build
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let restoredQueue: SessionPuzzle[] | null = null;
    let restoredHead = 0;
    let restoredStreak = 0;

    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed: PersistedSession = JSON.parse(stored);
        const hydratedQueue = hydrateSession(stored);
        if (hydratedQueue) {
          restoredQueue = hydratedQueue;
          restoredHead = typeof parsed.headIndex === 'number' ? parsed.headIndex : 0;
          restoredStreak = typeof parsed.consecutiveCorrect === 'number' ? parsed.consecutiveCorrect : 0;
        }
      }
    } catch {
      // sessionStorage unavailable or parse failed — use fresh session
    }

    if (restoredQueue) {
      setQueue(restoredQueue);
      setHeadIndex(restoredHead);
      setConsecutiveCorrect(restoredStreak);
    } else {
      const freshQueue = buildSessionQueue(getSessionTier, checkmateEnabled);
      setQueue(freshQueue);
      setHeadIndex(0);
      setConsecutiveCorrect(0);
    }

    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount — getSessionTier and checkmateEnabled intentionally excluded (session-frozen)

  // Persist to sessionStorage whenever headIndex or consecutiveCorrect changes (after init)
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined' || queue.length === 0) return;

    try {
      const persisted: PersistedSession = {
        queue: queue.map((sp) => ({ type: sp.type, id: sp.puzzle.id })),
        headIndex,
        consecutiveCorrect,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // sessionStorage write failed — continue without persistence
    }
  }, [isInitialized, queue, headIndex, consecutiveCorrect]);

  const onAnswer = useCallback(
    (correct: boolean) => {
      if (!isInitialized || headIndex >= SESSION_SIZE) return;

      const current = queue[headIndex];
      if (!current) return;

      // Extract pieceId from current puzzle
      const pieceId: ChessPieceId =
        current.type === 'movement'
          ? current.puzzle.pieceId
          : current.type === 'capture'
          ? current.puzzle.correctPieceId
          : current.puzzle.matingPieceId;

      // Record per-piece answer counts for session complete breakdown
      setPieceAnswerCounts((prev) => {
        const existing = prev[pieceId] ?? { correct: 0, total: 0 };
        return {
          ...prev,
          [pieceId]: {
            correct: existing.correct + (correct ? 1 : 0),
            total: existing.total + 1,
          },
        };
      });

      // Record to progress tracking
      if (correct) {
        recordCorrect(pieceId);
      } else {
        recordWrong(pieceId);
      }

      // Update streak with functional setState to avoid stale closure
      setConsecutiveCorrect((prev) => (correct ? prev + 1 : 0));

      // Advance head index only on correct — wrong answers let child retry same puzzle
      if (correct) {
        setFirstTryCount((prev) => prev + 1);
        setHeadIndex((prev) => prev + 1);
      }
    },
    [isInitialized, headIndex, queue, recordCorrect, recordWrong]
  );

  const startNewSession = useCallback(() => {
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    // Build fresh session
    const freshQueue = buildSessionQueue(getSessionTier, checkmateEnabled);
    setQueue(freshQueue);
    setHeadIndex(0);
    setConsecutiveCorrect(0);
    setFirstTryCount(0);
    setPieceAnswerCounts({});
  }, [getSessionTier, checkmateEnabled]);

  const currentPuzzle = isInitialized && headIndex < SESSION_SIZE ? (queue[headIndex] ?? null) : null;
  const isSessionComplete = isInitialized && headIndex >= SESSION_SIZE;

  return {
    currentPuzzle,
    sessionIndex: headIndex,
    consecutiveCorrect,
    isSessionComplete,
    onAnswer,
    startNewSession,
    firstTryCount,
    sessionTiers,
    currentTiersByPiece: data.pieces,
    pieceAnswerCounts,
  };
}
