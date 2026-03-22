---
phase: 17
slug: session-complete-progression-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 17 — Validation Strategy

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
| 1-3 star display based on accuracy | SESS-03 | Requires playing 10 puzzles with controlled accuracy | Play session, get 8+ correct on first try → verify 3 stars |
| Mastery band per piece displayed | DIFF-04 | Visual check of chip layout | Complete session, verify piece mastery chips shown |
| "Getting harder!" feedback | DIFF-04 | Requires triggering tier advance | Answer 5 correct for one piece, verify arrow-up feedback |
| Confetti on 3 stars | SESS-03 | Visual animation check | Get 3 stars, verify confetti renders |
| Start new session from complete screen | SESS-03 | Button interaction check | Click "Start New Session", verify fresh session starts |

## Validation Sign-Off

- [ ] All tasks have automated lint verify
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
