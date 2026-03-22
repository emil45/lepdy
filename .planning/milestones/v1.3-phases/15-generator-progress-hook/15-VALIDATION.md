---
phase: 15
slug: generator-progress-hook
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 (E2E smoke) + `npm run lint` (type checking) |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (lint) / ~30 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | PGEN-03, DIFF-01 | lint + type check | `npm run lint` | ✅ | ⬜ pending |
| 15-01-02 | 01 | 1 | DIFF-02, DIFF-03 | lint + type check | `npm run lint` | ✅ | ⬜ pending |
| 15-02-01 | 02 | 2 | PGEN-03, PGEN-04 | E2E smoke | `npm test` | ✅ | ⬜ pending |
| 15-02-02 | 02 | 2 | PGEN-04 | E2E smoke | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Puzzle never repeats within 15-puzzle window | PGEN-03 | Requires playing 15+ puzzles sequentially | Play 15 movement puzzles, note IDs — no duplicates |
| Difficulty advances after 5 correct | DIFF-02 | Requires multi-session play | Answer 5 correct in session, close, reopen — check tier |
| Difficulty de-escalates after 3 wrong | DIFF-03 | Requires multi-session play | Answer 3 wrong in session, close, reopen — check tier |
| Hebrew name + audio on every puzzle | PGEN-04 | Visual + audio check | Play puzzles, verify piece name shown and audio plays on tap |
| Existing level progress preserved | DIFF-01 | Data migration check | Complete level 1, upgrade code, verify level 1 still marked complete |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
