---
phase: 3
slug: game-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test e2e/app.spec.ts --grep "chess"` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test e2e/app.spec.ts --grep "chess"`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | INTG-01 | e2e | `npx playwright test --grep "chess button"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | INTG-02 | e2e | `npx playwright test --grep "chess game route"` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | INTG-04 | visual | Manual inspection | N/A | ⬜ pending |
| 03-01-04 | 01 | 1 | INTG-05 | e2e | `npx playwright test --grep "back button"` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | PROG-01 | e2e | `npx playwright test --grep "level lock"` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | PROG-02 | visual | Manual inspection | N/A | ⬜ pending |
| 03-02-03 | 02 | 1 | PROG-03 | e2e | `npx playwright test --grep "localStorage"` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | PROG-04 | e2e | `npx playwright test --grep "level map"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/app.spec.ts` — Add chess game E2E tests (button on games page, route loads, back button, level map)
- [ ] Existing Playwright infrastructure covers framework needs — no new install required

*Existing infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Lepdy visual styling match | INTG-04 | Subjective visual assessment | Open chess game, verify pastel colors and MUI theming match other games |
| Level completion indicators | PROG-02 | Visual checkmark/star appearance | Complete Level 1 placeholder, verify green checkmark and star appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
