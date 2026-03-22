---
phase: 5
slug: level-2-movement-puzzles
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright E2E (existing) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test e2e/app.spec.ts --grep "chess"` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (type-check + build verification)
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | MOVE-01, MOVE-05, MOVE-06 | E2E | `npx playwright test --grep "movement"` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | MOVE-02, MOVE-03, MOVE-04, FEED-01, FEED-02, FEED-03 | E2E | `npx playwright test --grep "movement"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing Playwright infrastructure covers all phase requirements
- E2E tests for chess movement puzzles will be added as part of plan tasks

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Celebration animation visual quality | FEED-01 | Visual quality is subjective | Navigate to Level 2, complete a puzzle correctly, verify confetti burst looks good |
| "Try again" message is gentle/encouraging | FEED-02 | Tone is subjective | Tap wrong square, verify message is gentle (no buzzer, no harsh red) |
| Hint highlights are visible and helpful | FEED-03 | Visual clarity for kids | Make 2 wrong taps, verify green dots appear on valid squares |
| No timer pressure anywhere | MOVE-06 | Absence of feature | Play through Level 2, verify no timer or countdown appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
