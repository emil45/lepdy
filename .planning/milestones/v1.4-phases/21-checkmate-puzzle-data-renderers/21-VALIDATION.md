---
phase: 21
slug: checkmate-puzzle-data-renderers
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 (E2E) + chess.js validation script |
| **Config file** | playwright.config.ts |
| **Quick run command** | `npm run build` |
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
| 21-01-01 | 01 | 1 | MATE-01 | script | `node scripts/validate-checkmate-puzzles.cjs` | ❌ W0 | ⬜ pending |
| 21-01-02 | 01 | 1 | MATE-02 | E2E | `npx playwright test --grep checkmate` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Validation script for chess.js isCheckmate() on all puzzle data
- [ ] E2E test for checkmate puzzle rendering

*Existing Playwright infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Two-tap interaction feels natural | MATE-02 | Interaction timing not testable in headless | Tap piece, tap target, observe checkmate confirmation |
| Hebrew instruction text readable | MATE-02 | Visual/linguistic quality check | Load puzzle, verify "שימו את המלך..." text displays |
| Confetti + celebration on checkmate | MATE-02 | Animation timing not reliable in E2E | Solve a mate-in-1, see confetti burst |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
