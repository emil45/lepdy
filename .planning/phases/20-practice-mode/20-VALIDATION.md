---
phase: 20
slug: practice-mode
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 20 — Validation Strategy

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

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | PRAC-01 | E2E | `npx playwright test --grep "practice"` | ❌ W0 | ⬜ pending |
| 20-01-02 | 01 | 1 | PRAC-02 | manual | Audio check | N/A | ⬜ pending |
| 20-01-03 | 01 | 1 | PRAC-03 | E2E | `npx playwright test --grep "practice"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] E2E tests for practice picker rendering and practice navigation — update existing chess game tests

*Existing Playwright infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hebrew piece name audio plays on tap | PRAC-01 | Audio playback not testable in headless Playwright | Tap a piece card, hear Hebrew pronunciation |
| Continuous puzzle loop works | PRAC-03 | Requires solving multiple puzzles sequentially | Complete 3+ puzzles, verify no end screen appears |
| Adaptive difficulty adjusts | PRAC-02 | Requires multiple correct/wrong answers to observe tier change | Play 5+ puzzles, check tier changes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
