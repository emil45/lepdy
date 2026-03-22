/**
 * Puzzle Generator — pure TypeScript utility
 *
 * No React imports, no chess.js imports, no browser APIs.
 * All state is in-memory (session-only); callers must NOT persist GeneratorState to localStorage.
 */

export interface GeneratorState {
  /** IDs of recently seen puzzles — ring buffer, max 15 entries. Session-only (in-memory). */
  seenIds: string[];
}

/**
 * Returns the default (empty) generator state.
 * Call once per session mount and hold in component state.
 */
export function defaultGeneratorState(): GeneratorState {
  return { seenIds: [] };
}

/**
 * Select the next puzzle for a given tier, avoiding recently seen puzzles.
 *
 * @param pool   - Full puzzle pool to draw from (can be MovementPuzzle[] or CapturePuzzle[])
 * @param tier   - Current difficulty tier (1 | 2 | 3) — matches puzzle.difficulty
 * @param state  - Current generator state (seenIds ring buffer)
 * @returns      - The selected puzzle and the updated GeneratorState (immutable)
 */
export function selectNextPuzzle<T extends { id: string; difficulty: 1 | 2 | 3 }>(
  pool: T[],
  tier: 1 | 2 | 3,
  state: GeneratorState
): { puzzle: T; nextState: GeneratorState } {
  // Filter to puzzles matching the requested difficulty tier
  const tierPool = pool.filter((p) => p.difficulty === tier);

  // From the tier pool, exclude puzzles already seen in this session
  const eligible = tierPool.filter((p) => !state.seenIds.includes(p.id));

  // If we've seen all puzzles in this tier, reset dedup and use the full tier pool
  const source = eligible.length > 0 ? eligible : tierPool;

  // Pick a random puzzle from the source
  const puzzle = source[Math.floor(Math.random() * source.length)];

  // Update the seenIds ring buffer (max 15 entries)
  const nextSeenIds = [...state.seenIds, puzzle.id].slice(-15);

  return {
    puzzle,
    nextState: { seenIds: nextSeenIds },
  };
}
