# Phase 14: Puzzle Pool Expansion - Research

**Researched:** 2026-03-22
**Domain:** Static chess puzzle data authoring, chess.js move validation, TypeScript data arrays
**Confidence:** HIGH

## Summary

Phase 14 is a pure data expansion phase. No new UI components, no new React hooks, and no new npm dependencies are introduced. The work is: (1) write a dev-only generation/validation script in `scripts/`, (2) author 42 new movement puzzles and 22 new capture puzzles in `data/chessPuzzles.ts`, and (3) run the automated test confirming every puzzle is solvable and unambiguous.

The critical technical finding is that `chess.js@1.4.0` (already installed) fully covers all validation needs. The `moves({verbose:true, square})` API returns every legal destination for a given piece, which lets the script both compute `validTargets` and assert that capture puzzle distractors cannot reach the target. The only non-obvious constraint is that chess.js refuses to parse FEN without both kings; a lightweight wrapper adds dummy kings into throwaway positions at generation/validation time, then stores the original piece-only FEN in the puzzle record.

A secondary finding from validating all 8 existing capture puzzles: `capture-rook-1` has an ambiguous distractor — bishop on c3 can reach the target on a5 via the b4-a5 diagonal. The generation/validation script will surface this, and the plan should include fixing this existing puzzle as part of phase work.

**Primary recommendation:** Write a Node.js generation/validation script (`scripts/validate-puzzles.ts`) that uses chess.js to verify every puzzle, then author the puzzle records directly in `chessPuzzles.ts` using the validated patterns. Do not use a probabilistic random generator for the authored positions — hand-select positions with the generator computing and verifying `validTargets`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Algorithmically generate valid positions per piece type using chess rules, then hand-verify edge cases
- Algorithmically generate capture puzzles — place target, correct attacker, and distractors using chess.js validation
- Generation script lives in `scripts/` as a dev-only tool — reproducible, auditable, can regenerate if rules change
- Automated test validates every puzzle: correct FEN, valid targets match chess.js output, difficulty tag present
- Tier 1 (easy): Piece on center/open square, empty board, simple pieces (king, rook, pawn) — few concepts to process
- Tier 3 (hard): Piece near edge with blocking pieces on board — child must understand pieces can't jump through others (except knight)
- Capture difficulty: Easy = 1 distractor, obvious attacker. Hard = 2-3 distractors, attacker requires diagonal/L-shape vision
- Blocking pieces appear in tier 2-3 movement puzzles only — tier 1 stays empty board (matches current pattern)
- 10 movement puzzles per piece (60 total) — equal coverage across all 3 tiers
- 5 capture puzzles per piece as correct attacker (30 total) — every piece well-represented
- Capture targets mix pawns, minor pieces, and major pieces for variety
- Puzzle IDs follow `{piece}-move-{tier}-{n}` and `capture-{piece}-{tier}-{n}` convention — sortable, debuggable

### Claude's Discretion
- Specific board positions and piece placements for generated puzzles
- Exact distribution of puzzles across tiers within each piece (roughly equal)
- Choice of blocking piece types for tier 2-3 puzzles

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PGEN-01 | User gets a randomly selected movement puzzle every time (never runs out) | 60+ movement puzzles across 6 piece types enable random selection without rapid repetition |
| PGEN-02 | User gets a randomly selected capture puzzle every time (never runs out) | 30+ capture puzzles across 6 piece types enable random selection without rapid repetition |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chess.js | 1.4.0 (installed) | Move validation, legal move generation | Already in project; `moves({verbose:true, square})` is the complete validation API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js built-ins (fs, path) | Node 24 | Read/write TypeScript data files from script | Script file I/O only |
| TypeScript (tsx or ts-node) | Project TS5 | Run generation script in TypeScript | Dev-only script execution |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-computing validTargets | chess.js moves() | chess.js is authoritative; hand-computed arrays are error-prone (existing bug found in capture-rook-1) |
| Random position generation | Hand-selected positions + script validation | Hand-selection produces pedagogically meaningful positions; random may produce trivial or confusing boards |

**Installation:** No new packages needed. chess.js 1.4.0 is already installed.

## Architecture Patterns

### Recommended Project Structure
```
scripts/
└── validate-puzzles.ts      # dev-only validator; run with: npx tsx scripts/validate-puzzles.ts
data/
└── chessPuzzles.ts          # expanded puzzle arrays (60 movement + 30 capture)
```

### Pattern 1: chess.js Validation with Dummy Kings

The existing puzzle FEN format stores only piece placement without kings (e.g. `'8/8/8/8/4R3/8/8/8'`). chess.js 1.4.0 requires both kings to parse a FEN. The validation script adds throwaway dummy kings at unoccupied corner squares before calling `moves()`, then discards them — the stored FEN retains the original piece-only format.

**What:** Insert dummy `K` (a1 or h1, whichever is free) and `k` (h8 or a8, whichever is free) into a temporary FEN, call `moves()`, extract targets, discard dummy FEN.

**When to use:** Every time chess.js validation is called on puzzle data. Not needed for king movement puzzles — just add black king dummy (white king is the piece itself).

**Example:**
```typescript
// Source: verified against chess.js 1.4.0 locally
import { Chess } from 'chess.js';

function getValidTargets(pieceOnlyFen: string, pieceSquare: string, isKingPuzzle = false): string[] {
  const ranks = pieceOnlyFen.split('/');
  const occupied = new Set<string>();
  ranks.forEach((rank, rankIdx) => {
    let fileIdx = 0;
    for (const ch of rank) {
      if (/[1-8]/.test(ch)) fileIdx += parseInt(ch);
      else { occupied.add(String.fromCharCode(97 + fileIdx) + (8 - rankIdx)); fileIdx++; }
    }
  });

  function setSquare(rankArr: string[], square: string, piece: string): void {
    const file = square.charCodeAt(0) - 97;
    const rankIdx = 8 - parseInt(square[1]);
    let row = rankArr[rankIdx];
    let expanded = '';
    for (const ch of row) {
      if (/[1-8]/.test(ch)) expanded += '.'.repeat(parseInt(ch));
      else expanded += ch;
    }
    expanded = expanded.substring(0, file) + piece + expanded.substring(file + 1);
    let compressed = '', count = 0;
    for (const ch of expanded) {
      if (ch === '.') count++;
      else { if (count) { compressed += count; count = 0; } compressed += ch; }
    }
    if (count) compressed += count;
    rankArr[rankIdx] = compressed;
  }

  const newRanks = [...ranks];
  if (!isKingPuzzle) {
    const wk = ['a1', 'h1'].find(s => !occupied.has(s))!;
    setSquare(newRanks, wk, 'K');
  }
  const bk = ['h8', 'a8'].find(s => !occupied.has(s))!;
  setSquare(newRanks, bk, 'k');

  const fullFen = newRanks.join('/') + ' w - - 0 1';
  const chess = new Chess(fullFen);
  const moves = chess.moves({ verbose: true, square: pieceSquare });
  // Deduplicate: pawn promotions produce 4 moves to the same square
  return [...new Set(moves.map(m => m.to))];
}
```

### Pattern 2: Capture Puzzle Validation

For each capture puzzle, assert two things:
1. `correctPiece` CAN reach `targetSquare` (in moves output)
2. Every `distractorSquare` CANNOT reach `targetSquare`

Both assertions use the same `Chess` instance initialized with the puzzle's full FEN (including all pieces).

**Example:**
```typescript
// Source: verified against chess.js 1.4.0 locally
function validateCapturePuzzle(puzzle: CapturePuzzle): string[] {
  const errors: string[] = [];
  // Build full FEN with dummy kings added as above
  const chess = buildChessWithDummyKings(puzzle.fen, puzzle.correctPieceId === 'king');

  const correctMoves = chess.moves({ verbose: true, square: puzzle.correctPieceSquare }).map(m => m.to);
  if (!correctMoves.includes(puzzle.targetSquare)) {
    errors.push(`Correct piece on ${puzzle.correctPieceSquare} cannot reach target ${puzzle.targetSquare}`);
  }

  for (const d of puzzle.distractorSquares) {
    const dMoves = chess.moves({ verbose: true, square: d }).map(m => m.to);
    if (dMoves.includes(puzzle.targetSquare)) {
      errors.push(`Distractor on ${d} CAN reach target ${puzzle.targetSquare} — ambiguous puzzle`);
    }
  }
  return errors;
}
```

### Pattern 3: Puzzle ID Naming

New puzzles follow: `{piece}-move-{tier}-{n}` and `capture-{piece}-{tier}-{n}`.

Examples: `rook-move-1-1`, `rook-move-1-2`, `rook-move-2-1`, `capture-rook-2-1`, `capture-bishop-3-1`.

Existing puzzles keep their original IDs (`rook-move-1`, `capture-rook-1`) to avoid breaking any downstream references.

### Difficulty Tier Definitions (Locked)

**Movement puzzles:**
| Tier | Board Condition | Piece Position | Concept Tested |
|------|----------------|----------------|----------------|
| 1 (easy) | Empty board | Center-ish (c3–f6) | Piece moves in all directions freely |
| 2 (medium) | Empty board OR 1 blocking same-color piece | Edge rank/file OR slightly off-center | Piece movement near edges (restricted directions) |
| 3 (hard) | 1–2 blocking same-color pieces | Near edge/corner | Blocking pieces restrict movement; piece-type determines jump ability |

**Capture puzzles:**
| Tier | Distractor Count | Attacker Type | Concept Tested |
|------|-----------------|----------------|----------------|
| 1 (easy) | 1 distractor | Rook/queen/king (obvious line) | Which piece is on a clear path to target |
| 2 (medium) | 1–2 distractors | Bishop/knight (less obvious) | Diagonal or L-shape vision required |
| 3 (hard) | 2–3 distractors | Any piece with non-trivial geometry | Multiple plausible pieces, only one valid |

### Puzzle Count Breakdown

**Movement puzzles (60 total):**
- 3 existing per piece (18 total) → 7 new per piece needed (42 new)
- Distribution target per new group: ~2 tier-1, ~2 tier-2, ~3 tier-3 (or similar to reach 10 total per piece with at least 3 per tier counting existing)

**Capture puzzles (30 total):**
- Existing: rook=2, bishop=1, knight=2, queen=1, king=1, pawn=1 (8 total)
- New needed: rook=3, bishop=4, knight=3, queen=4, king=4, pawn=4 (22 new)
- Existing puzzles already provide tier-1 coverage; new ones should cover tier-2 and tier-3

### Anti-Patterns to Avoid
- **Pawn on rank 7 in movement puzzle:** chess.js returns 4 duplicate promotion moves to the same square — avoid rank 7 for pawn movement puzzles, or deduplicate with `Set`.
- **Not checking blocker square availability before placing blocker:** if blocker occupies dummy-king corners, the FEN builder picks alternate corners — always run through `getValidTargets()` to confirm the stored `validTargets` is correct.
- **Assuming bishop can never reach a target on the same color:** always validate with chess.js; human diagonal-counting errors are common (as confirmed in existing capture-rook-1 bug).
- **Ambiguous capture distractors:** place distractors on squares from which they provably cannot reach the target. Validate with `moves({verbose:true, square:distractor})`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Legal move computation | Custom movement tables per piece | `chess.js moves({verbose:true, square})` | Handles edge cases: castling exclusion, pawn forward-only (no diagonal without target), pin detection, promotion deduplication |
| FEN string construction | Custom FEN encoder | Build from rank strings + `' w - - 0 1'` suffix | chess.js only needs piece-placement + side-to-move for `moves()` purposes |
| Puzzle solvability check | Manual review | Automated validation script | Prevents the existing `capture-rook-1` class of bug from recurring |

**Key insight:** Chess movement rules have many subtle exceptions. chess.js has been battle-tested across millions of games — any custom implementation will miss edge cases that only appear in specific board positions.

## Common Pitfalls

### Pitfall 1: Pawn Diagonal in Movement Puzzles
**What goes wrong:** If a black piece is placed adjacent to a pawn (even accidentally via a distractor in a separate puzzle), `moves()` returns diagonal capture moves that shouldn't be part of a "where can the pawn move?" movement puzzle.
**Why it happens:** chess.js correctly includes capture-available squares in pawn moves.
**How to avoid:** Keep movement puzzle boards free of any pieces that would give pawns capture options. Tier 1 uses empty boards — safe. Tier 2–3 blocking pieces must be same-color white pieces only (can't be captured, not included in pawn captures).
**Warning signs:** `validTargets` for a pawn includes a non-forward diagonal square.

### Pitfall 2: chess.js King-in-Check Exclusions
**What goes wrong:** When the puzzle piece is a white king, and the dummy black king is too close, chess.js excludes squares adjacent to the black king (king can't move into check / adjacent to opponent king).
**Why it happens:** chess.js enforces the "kings can't be adjacent" rule.
**How to avoid:** Place dummy black king far from the white king's movement area — opposite corner (h8) works for most center/edge positions. For white king near h8 corner, use a8 for dummy black king.
**Warning signs:** `validTargets` for king seems shorter than expected; squares near h8 are missing.

### Pitfall 3: Blocking Piece Creates King Exposure
**What goes wrong:** In tier 2–3 movement puzzles with a blocking piece, if the blocking piece is on the same rank/file as the white king (dummy or real), it may appear to "shield" the king, changing which squares chess.js considers legal.
**Why it happens:** chess.js enforces check prevention; if the blocking piece creates an absolute pin on the path to the dummy king, the piece loses some legal moves.
**How to avoid:** For validation purposes, place dummy kings at corners far from the puzzle action. Verify `validTargets` matches expected count before committing a puzzle.
**Warning signs:** A rook on e4 with blocker P on e6 cannot reach e3 — unexpected restriction caused by king-pin dynamics.

### Pitfall 4: Existing capture-rook-1 Bug
**What goes wrong:** The existing `capture-rook-1` puzzle has bishop on c3 as a distractor, but bishop c3 can reach target a5 via the b4 diagonal — making the puzzle ambiguous.
**Why it happens:** Human visual diagonal counting missed the b4–a5 path.
**How to avoid:** Run the validation script against ALL puzzles including existing ones. Fix the distractor before expanding the pool.
**Warning signs:** Validation script reports "Distractor on c3 CAN reach target a5".

### Pitfall 5: Tier Count Shortfall
**What goes wrong:** After writing all puzzles, tier counts per piece don't meet the minimum of "at least 10 puzzles per piece" or "at least 10 puzzles per tier across the pool."
**Why it happens:** Informal "roughly equal" distribution across tiers leads to slight imbalances.
**How to avoid:** Track counts in a spreadsheet or comments while authoring. Aim for exactly 3–4 per tier per piece for movement, and check totals before committing.
**Warning signs:** Fewer than 10 puzzles for any single piece, or fewer than 10 puzzles in any difficulty tier across the full pool.

## Code Examples

### Running the Validation Script
```bash
# Source: project pattern (tsx for ts in scripts)
npx tsx scripts/validate-puzzles.ts
```

### FEN Position Examples for Each Tier

**Tier 1 movement — rook on e4 (center, empty board):**
```
fen: '8/8/8/8/4R3/8/8/8'
pieceSquare: 'e4'
// validTargets: all of rank 4 (minus e4) + all of file e (minus e4) = 14 squares
```

**Tier 2 movement — rook on a4 (edge file, empty board):**
```
fen: '8/8/8/8/R7/8/8/8'
pieceSquare: 'a4'
// validTargets: a1-a3, a5-a8 (file) + b4-h4 (rank) = 13 squares
```

**Tier 3 movement — rook on d4 with white pawn blocker on d6:**
```
fen: '8/8/3P4/8/3R4/8/8/8'
pieceSquare: 'd4'
// validTargets: d1-d3, d5 (blocked at d6), a4-c4, e4-h4 = 11 squares (no d6,d7,d8)
```

**Tier 1 capture — rook attacks pawn on a5, bishop distractor cannot reach a5:**
```
// FIX for existing bug: move bishop c3 to c2 (cannot reach a5 from c2)
fen: '8/8/8/p7/8/8/2B5/R7'  // bishop on c2 instead of c3
targetSquare: 'a5'
correctPieceSquare: 'a1'     // rook
distractorSquares: ['c2']    // bishop c2: moves to b1, d1, a4, b3, d3, e4... NOT a5
```

**Tier 3 capture — knight attacks rook, 3 distractors:**
```
// Example: black rook on g5, white knight on f3 (correct), 3 distractors that can't reach g5
fen: '8/8/8/6r1/8/5N2/8/8'  + distractors positioned on non-g5-reaching squares
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3 puzzles per piece (18 total) | 10 puzzles per piece (60 total) | Phase 14 | Enables random selection without rapid repeats |
| No generation script | `scripts/validate-puzzles.ts` | Phase 14 | Automated correctness guarantee; catches ambiguous distractors |
| No tier structure (all puzzles happened to be tiers 1-2) | Explicit 3-tier system with min 10 per tier | Phase 14 | Enables difficulty progression in Phase 15 |

**Deprecated/outdated:**
- Existing IDs (`rook-move-1`, `capture-rook-1`) are kept but do NOT follow the new convention. New puzzles use `{piece}-move-{tier}-{n}` format.

## Open Questions

1. **Fix capture-rook-1 bug in this phase or defer?**
   - What we know: The validation script will flag it; it's a one-line FEN edit
   - What's unclear: Whether any other code references this specific puzzle ID
   - Recommendation: Fix it in this phase since the validation script is being written here anyway. The fix is moving bishop from c3 to c2 in the FEN.

2. **Blocking piece type for tier 2-3 movement puzzles**
   - What we know: Must be white (uppercase) piece to avoid giving the main piece a capture option; context says Claude's discretion
   - What's unclear: Whether using pawns vs. rooks/bishops as blockers makes puzzles more pedagogically clear
   - Recommendation: Use white pawns (P) as blockers — they're the most visually distinct "obstacle" piece and children already know pawns can't jump over.

3. **Movement puzzles — should tier 2 also allow edge positions (not just blockers)?**
   - What we know: Context says tier 2 = edge OR mid-board + 1 blocker; this is Claude's discretion
   - What's unclear: Whether edge-without-blocker is meaningfully harder than center-empty
   - Recommendation: For tier 2, use edge positions (no blocker) for simpler pieces (rook, king) and add 1 blocker for complex pieces (bishop, knight, queen) to make the difficulty consistent.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.57.0 (project E2E framework) |
| Config file | `playwright.config.ts` |
| Quick run command | `npx tsx scripts/validate-puzzles.ts` (Node script, not Playwright) |
| Full suite command | `npm test` (Playwright E2E — verifies page loads) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PGEN-01 | 60+ movement puzzles exist with 10+ per piece and 10+ per tier | unit (Node script) | `npx tsx scripts/validate-puzzles.ts` | ❌ Wave 0 |
| PGEN-02 | 30+ capture puzzles exist with 5+ per piece and 10+ per tier | unit (Node script) | `npx tsx scripts/validate-puzzles.ts` | ❌ Wave 0 |
| PGEN-01 | validTargets matches chess.js for every movement puzzle | unit (Node script) | `npx tsx scripts/validate-puzzles.ts` | ❌ Wave 0 |
| PGEN-02 | Correct piece can reach target, no distractor can, for every capture puzzle | unit (Node script) | `npx tsx scripts/validate-puzzles.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsx scripts/validate-puzzles.ts`
- **Per wave merge:** `npx tsx scripts/validate-puzzles.ts && npm run lint`
- **Phase gate:** All puzzles pass validation + `npm test` green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `scripts/validate-puzzles.ts` — covers PGEN-01, PGEN-02 (validation script is Wave 0 deliverable; puzzles are Wave 1+)

## Sources

### Primary (HIGH confidence)
- chess.js 1.4.0 — verified locally via Node REPL: `moves({verbose:true, square})`, FEN parsing, blocker behavior, pawn promotion deduplication
- `data/chessPuzzles.ts` — existing data shape: `MovementPuzzle`, `CapturePuzzle` interfaces, difficulty type, helper functions
- `data/chessPieces.ts` — `ChessPieceId` union type; `fenChar` for each piece

### Secondary (MEDIUM confidence)
- Existing puzzle validation results — all 8 existing capture puzzles validated programmatically; 7/8 correct, capture-rook-1 has confirmed ambiguous distractor

### Tertiary (LOW confidence)
- Pedagogical difficulty tier definitions (center = easy, edge = medium, corner + blocker = hard) — reasonable heuristic but not validated against child user testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — chess.js already installed, API verified locally
- Architecture: HIGH — script pattern, dummy-king workaround, data shape all verified in REPL
- Pitfalls: HIGH for technical pitfalls (verified), MEDIUM for pedagogical choices (untested with children)

**Research date:** 2026-03-22
**Valid until:** 2026-06-22 (chess.js API is stable; puzzle data is static)
