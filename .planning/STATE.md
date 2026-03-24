---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Cloud Sync
status: Ready to execute
stopped_at: Completed 27-01-PLAN.md
last_updated: "2026-03-24T23:03:35.657Z"
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 7
  completed_plans: 6
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary
**Current focus:** Phase 27 — cloud-read-and-merge

## Current Position

Phase: 27 (cloud-read-and-merge) — EXECUTING
Plan: 2 of 2

## Performance Metrics

**Velocity:**

- Total plans completed: 40 (v1.0 through v1.4)
- Average duration: ~3 min

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Firebase Auth with Google sign-in (Firebase already used for leaderboard + Remote Config)
- Union merge on first login — no progress ever lost
- Offline-first: localStorage as cache, writes flush on reconnect
- Login is optional, lives in settings drawer — zero behavior change when signed out
- Open decision: Firestore vs RTDB for cloud storage (resolve before Phase 26 begins)
- [Phase 24-firebase-auth-foundation]: Dynamic import of firebase/auth inside getFirebaseAuth() prevents SSR errors — no top-level firebase/auth import
- [Phase 24-firebase-auth-foundation]: cloudSyncEnabled defaults to false — Firebase Auth never initializes until flag is enabled in Firebase console
- [Phase 24]: AuthProvider placed inside FeatureFlagProvider, outside StreakProvider — ensures flag is readable before auth init runs
- [Phase 24]: cloudSyncEnabled=false causes immediate setLoading(false) — zero Firebase network requests for non-opted-in users
- [Phase 25-sign-in-ui]: Sign-out button uses variant=text (less prominent) per pre-locked UI decision; avatar 32px for single-row signed-in layout
- [Phase 26-cloud-write-path]: 30s debounce with JSON.stringify dep key and dataRef.current pattern for stable, latest-value RTDB writes
- [Phase 26-cloud-write-path]: Dynamic firebase/database import inside setTimeout callback prevents SSR errors — matches existing lib/firebase.ts pattern
- [Phase 26-cloud-write-path]: Category-specific Set field names (heardLetterIds etc.) must be used — generic heardItemIds is internal to useCategoryProgress
- [Phase 26-cloud-write-path]: Streak syncs to path 'streak' not 'progress/streak' — keeps streak conceptually separate for cleaner Phase 27 merge logic
- [Phase 27]: Vitest installed for unit testing pure merge functions; WordCollectionData re-declared in mergeProgress.ts since it is not exported from its hook; mergeStreak uses more-recent lastActivityDate side as base for freeze fields

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1 carry-over]: Hebrew chess piece names sourced from forum, not Israeli Chess Federation. Must verify before recording audio.
- [Phase 26 pre-condition]: Must decide Firestore vs RTDB before planning Phase 26 — affects write API, offline config, and security rules format.
- [Phase 27 pre-condition]: StreakData merge edge case (two devices with independent active streaks in same week) needs concrete rule before merge function is coded.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260323-vhl | Add board color theme selector to chess game settings - 4 fun color options | 2026-03-23 | 34ea254 | [260323-vhl-add-board-color-theme-selector-to-chess-](./quick/260323-vhl-add-board-color-theme-selector-to-chess-/) |
| Phase 24-firebase-auth-foundation P01 | 1 | 2 tasks | 4 files |
| Phase 24 P02 | 2 | 2 tasks | 6 files |
| Phase 25-sign-in-ui P01 | 5 | 2 tasks | 1 files |
| Phase 26-cloud-write-path P01 | 8 | 2 tasks | 3 files |
| Phase 26-cloud-write-path P02 | 5 | 2 tasks | 6 files |
| Phase 27 P01 | 147s | 2 tasks | 3 files |

## Session Continuity

Last session: 2026-03-24T23:03:35.654Z
Stopped at: Completed 27-01-PLAN.md
Resume file: None
