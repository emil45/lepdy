# Phase 10: Sticker Integration - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire chess level completion into Lepdy's existing sticker system so completing each chess level awards a sticker visible in the sticker collection page.

</domain>

<decisions>
## Implementation Decisions

### Sticker Definitions
- Add new `chess_level` unlock type to the `Sticker` interface's `unlockType` union — `unlockValue` is the level number (1, 2, or 3)
- Chess stickers go on Page 4 (Games) alongside other game stickers — no new page needed
- Emoji progression: Level 1 = ♟️ (pawn/chess intro), Level 2 = ♞ (knight/movement), Level 3 = ♛ (queen/mastery)
- Translation keys follow existing pattern: `stickers.games.chess1`, `stickers.games.chess2`, `stickers.games.chess3`

### Integration Pattern
- Use `useStickerUnlockDetector` pattern — check chess progress in the detector, call `earnSticker` when conditions met. This is how all other stickers work.
- Add `chessLevelsCompleted` field to `StickerProgressValues` interface — populated from `useChessProgress` data
- Keep `useChessProgress` pure — no sticker logic inside it
- No re-awarding on replay — `earnSticker` already guards against duplicate awards via `earnedStickerIds.has(stickerId)`

### Persistence
- Stickers persist via the existing `lepdy_sticker_data` localStorage key managed by `useStickers`
- Chess progress persists via `lepdy_chess_progress` localStorage key managed by `useChessProgress`
- Both are independent — sticker unlock detection runs on each render cycle via `useStickerUnlockDetector`

### Claude's Discretion
- Exact ordering of chess stickers within Page 4's sticker array
- Whether to add `checkStickerUnlock` case inline or as a helper

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `data/stickers.ts` — sticker definitions with `unlockType`/`unlockValue`, `checkStickerUnlock()` pure function, `StickerProgressValues` interface
- `hooks/useStickers.ts` — `earnSticker(stickerId, stickerName, pageNumber)` with duplicate guard and celebration trigger
- `hooks/useStickerUnlockDetector.ts` — runs on each render, checks all stickers against progress values, calls `earnSticker` for newly unlocked ones
- `hooks/useChessProgress.ts` — tracks `completedLevels: number[]` in localStorage
- `contexts/StickerContext.tsx` — provides sticker state to the whole app

### Established Patterns
- All sticker unlocking goes through `checkStickerUnlock` → `getUnlockedStickerIds` → detector compares against earned set → calls `earnSticker`
- Each unlock type has a case in the `checkStickerUnlock` switch statement
- Progress values are gathered from various hooks and passed as `StickerProgressValues` to the detector
- Sticker toast notification fires automatically via `onStickerEarned` callback

### Integration Points
- `data/stickers.ts` — add 3 chess stickers to `STICKERS` array, add `chess_level` to `unlockType` union, add case to `checkStickerUnlock`, add `chessLevelsCompleted` to `StickerProgressValues`
- `hooks/useStickerUnlockDetector.ts` — add chess progress gathering and pass to detector
- `messages/{he,en,ru}.json` — add 3 chess sticker translation keys

</code_context>

<specifics>
## Specific Ideas

- `TOTAL_STICKERS` constant should be updated from 45 to 48 after adding 3 chess stickers
- The detector already runs on each render — no explicit trigger needed from chess game completion

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
