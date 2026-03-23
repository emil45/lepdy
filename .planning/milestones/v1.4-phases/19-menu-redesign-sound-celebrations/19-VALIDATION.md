---
phase: 19
slug: menu-redesign-sound-celebrations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 (E2E) |
| **Config file** | playwright.config.ts |
| **Quick run command** | `npx playwright test e2e/app.spec.ts --grep chess` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test e2e/app.spec.ts --grep chess`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | MENU-01 | E2E | `npx playwright test --grep "hub tiles"` | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | MENU-02 | E2E | `npx playwright test --grep "hub navigation"` | ❌ W0 | ⬜ pending |
| 19-02-01 | 02 | 1 | SFX-01 | manual | Visual/audio check | N/A | ⬜ pending |
| 19-02-02 | 02 | 1 | SFX-02 | manual | Visual/audio check | N/A | ⬜ pending |
| 19-02-03 | 02 | 1 | SFX-03 | manual | Visual check for confetti | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] E2E tests for hub tile rendering and navigation — update existing chess game tests

*Existing Playwright infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct answer sound plays | SFX-01 | Audio playback not testable in headless Playwright | Solve a puzzle, hear success sound |
| Wrong answer sound plays | SFX-02 | Audio playback not testable in headless Playwright | Tap wrong square, hear wrong-answer sound |
| Confetti at streak milestones | SFX-03 | Visual animation timing not reliable in E2E | Get 3 correct in a row, see confetti burst |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
