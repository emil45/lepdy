# Phase 7: Bug Fixes & Cleanup - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix chess game translation key display bugs and remove orphaned Phase 2 files that are no longer imported by any component.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `data/chessPieces.ts` — chess piece config with translationKeys (currently broken: `chessGame.pieces.king` should be `pieces.king` since `useTranslations('chessGame')` scopes the namespace)
- `messages/{he,en,ru}.json` — translation files with `chessGame.ui.*` keys, 5 of which are unused

### Established Patterns
- Translation scoping: `useTranslations('chessGame')` means keys should be relative (e.g., `pieces.king` not `chessGame.pieces.king`)
- Data files use `translationKey` field consumed by `t()` calls in components

### Integration Points
- `PieceIntroduction.tsx`, `MovementPuzzle.tsx`, `CapturePuzzle.tsx` all call `t(config.translationKey)`
- Orphaned files: `components/chess/ChessBoard.tsx`, `ChessBoardDynamic.tsx`, `useChessGame.ts` — not imported anywhere

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
