---
phase: 16
slug: session-hook-puzzle-refactor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 16 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 (E2E) |
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
| 10-puzzle session flow | SESS-01 | Requires 10 sequential interactions | Play through 10 puzzles, verify session complete screen |
| Streak counter at 2+ correct | SESS-02 | Requires answering 2 correctly in a row | Answer 2 correct, verify "2 in a row!" badge |
| Mid-session resume | SESS-01 | Navigate away mid-session, return | Play 5 puzzles, go back, return — verify same session |
| Board rendering unchanged | SESS-02 | Visual regression check | Compare board appearance to v1.2 |

## Validation Sign-Off

- [ ] All tasks have automated lint verify
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
