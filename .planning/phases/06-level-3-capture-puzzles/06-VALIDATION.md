---
phase: 6
slug: level-3-capture-puzzles
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright E2E (existing) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test e2e/app.spec.ts --grep "capture"` |
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
| 06-01-01 | 01 | 1 | CAPT-01, CAPT-04 | E2E | `npx playwright test --grep "capture"` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | CAPT-02, CAPT-03 | E2E | `npx playwright test --grep "capture"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Red/orange ring on target piece is clear | CAPT-01 | Visual quality | Enter Level 3, verify target has distinct red ring |
| Celebration visual matches Level 2 | CAPT-02 | Visual comparison | Complete a puzzle, compare to Level 2 celebration |
| "You learned chess!" message is encouraging | CAPT-02 | Tone is subjective | Complete all 8 puzzles, verify final message |
| No special moves in any puzzle | CAPT-04 | Requires chess knowledge | Review all 8 puzzle positions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
