---
phase: 18
slug: daily-featured-puzzle
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 18 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 (E2E) + `npm run lint` (type checking) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15s (lint) / ~30s (E2E) |

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Daily puzzle same for all users | SESS-04 | Requires checking determinism | Open in two browsers, verify same puzzle |
| Daily card on level map | SESS-04 | Visual layout check | Open chess game, verify 4th card visible |
| Come back tomorrow state | SESS-04 | Requires completing daily puzzle | Complete daily, verify disabled card with checkmark |
| Midnight rotation | SESS-04 | Time-dependent | Change system date, verify new puzzle |

## Validation Sign-Off

- [ ] All tasks have automated lint verify
- [ ] Feedback latency < 30s

**Approval:** pending
