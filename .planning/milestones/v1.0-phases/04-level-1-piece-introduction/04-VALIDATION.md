---
phase: 4
slug: level-1-piece-introduction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 4 — Validation Strategy

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
| 04-01-01 | 01 | 1 | INTRO-01, INTRO-04 | E2E | `npx playwright test --grep "chess"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | INTRO-02 | E2E | `npx playwright test --grep "chess"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | INTRO-03 | build | `npm run build` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 1 | INTRO-04 | E2E | `npx playwright test --grep "chess"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing Playwright infrastructure covers all phase requirements
- E2E tests for chess game Level 1 flow will be added as part of plan tasks

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audio pronunciation plays correctly | INTRO-02 | Audio playback requires user hearing; files are placeholders | 1. Navigate to chess game → Level 1. 2. Tap speaker button on each piece. 3. Verify audio plays (when files exist) or fails silently (when missing) |
| Visual layout looks correct on tablet | INTRO-02 | Visual appearance cannot be automated | 1. Open on tablet viewport. 2. Verify piece symbol is large, Hebrew name is prominent, buttons are touch-friendly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
