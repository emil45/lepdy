'use client';

import { useState, useCallback } from 'react';
import { movementPuzzles, capturePuzzles } from '@/data/chessPuzzles';
import { ChessPieceId } from '@/data/chessPieces';
import { defaultGeneratorState, selectNextPuzzle, GeneratorState } from '@/utils/puzzleGenerator';
import { usePuzzleProgress, PiecePuzzleProgress } from '@/hooks/usePuzzleProgress';
import { SessionPuzzle } from '@/hooks/usePuzzleSession';

export interface UsePracticeSessionReturn {
  currentPuzzle: SessionPuzzle | null;
  consecutiveCorrect: number;
  onAnswer: (correct: boolean) => void;
  startPractice: (pieceId: ChessPieceId) => void;
  currentTiersByPiece: Record<string, PiecePuzzleProgress>;
}

/**
 * Build a practice batch of puzzles for a single piece.
 * Generates 3 movement + 2 capture puzzles (or fewer if the pool is smaller).
 * If capture pool is empty for this piece, fills all 5 slots with movement puzzles.
 */
function buildPracticeBatch(
  pieceId: ChessPieceId,
  getSessionTier: (id: ChessPieceId) => 1 | 2 | 3,
  genState: GeneratorState
): { batch: SessionPuzzle[]; nextGenState: GeneratorState } {
  const tier = getSessionTier(pieceId);

  // Filter puzzle pools to only the selected piece
  const filteredMovement = movementPuzzles.filter((p) => p.pieceId === pieceId);
  const filteredCapture = capturePuzzles.filter((p) => p.correctPieceId === pieceId);

  const batch: SessionPuzzle[] = [];
  let state = genState;

  if (filteredCapture.length === 0) {
    // No capture puzzles for this piece — fill all 5 slots with movement puzzles
    const movCount = Math.min(5, filteredMovement.length);
    for (let i = 0; i < movCount; i++) {
      const { puzzle, nextState } = selectNextPuzzle(filteredMovement, tier, state);
      state = nextState;
      batch.push({ type: 'movement', puzzle });
    }
  } else {
    // 3 movement + 2 capture
    const movCount = Math.min(3, filteredMovement.length);
    for (let i = 0; i < movCount; i++) {
      const { puzzle, nextState } = selectNextPuzzle(filteredMovement, tier, state);
      state = nextState;
      batch.push({ type: 'movement', puzzle });
    }

    const capCount = Math.min(2, filteredCapture.length);
    for (let i = 0; i < capCount; i++) {
      const { puzzle, nextState } = selectNextPuzzle(filteredCapture, tier, state);
      state = nextState;
      batch.push({ type: 'capture', puzzle });
    }
  }

  return { batch, nextGenState: state };
}

/**
 * usePracticeSession — practice mode hook for drilling a single piece.
 *
 * Key differences from usePuzzleSession:
 * - Filters puzzle pools to a single piece (set via startPractice)
 * - No session size cap — loops continuously
 * - No sessionStorage persistence — practice sessions are ephemeral
 */
export function usePracticeSession(): UsePracticeSessionReturn {
  const { getSessionTier, recordCorrect, recordWrong, data } = usePuzzleProgress();

  const [queue, setQueue] = useState<SessionPuzzle[]>([]);
  const [headIndex, setHeadIndex] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [genState, setGenState] = useState<GeneratorState>(defaultGeneratorState);
  const [activePieceId, setActivePieceId] = useState<ChessPieceId | null>(null);

  const startPractice = useCallback(
    (pieceId: ChessPieceId) => {
      setActivePieceId(pieceId);
      const freshGenState = defaultGeneratorState();
      const { batch, nextGenState } = buildPracticeBatch(pieceId, getSessionTier, freshGenState);
      setQueue(batch);
      setHeadIndex(0);
      setConsecutiveCorrect(0);
      setGenState(nextGenState);
    },
    [getSessionTier]
  );

  const onAnswer = useCallback(
    (correct: boolean) => {
      const current = queue[headIndex];
      if (!current || !activePieceId) return;

      // Extract pieceId from current puzzle
      // Practice sessions only contain movement and capture puzzles (no checkmate)
      const pieceId: ChessPieceId =
        current.type === 'movement'
          ? current.puzzle.pieceId
          : current.type === 'capture'
          ? current.puzzle.correctPieceId
          : activePieceId; // checkmate unreachable in practice, fallback to activePieceId

      // Record to progress tracking
      if (correct) {
        recordCorrect(pieceId);
      } else {
        recordWrong(pieceId);
      }

      // Update consecutive correct streak
      setConsecutiveCorrect((prev) => (correct ? prev + 1 : 0));

      // On correct: advance headIndex; on wrong: child retries same puzzle
      if (correct) {
        const nextIndex = headIndex + 1;
        if (nextIndex >= queue.length) {
          // Batch exhausted — generate a fresh batch and loop
          const { batch, nextGenState } = buildPracticeBatch(activePieceId, getSessionTier, genState);
          setQueue(batch);
          setHeadIndex(0);
          setGenState(nextGenState);
        } else {
          setHeadIndex(nextIndex);
        }
      }
    },
    [queue, headIndex, activePieceId, genState, getSessionTier, recordCorrect, recordWrong]
  );

  const currentPuzzle = queue[headIndex] ?? null;

  return {
    currentPuzzle,
    consecutiveCorrect,
    onAnswer,
    startPractice,
    currentTiersByPiece: data.pieces,
  };
}
