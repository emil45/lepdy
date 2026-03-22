---
phase: 14
slug: puzzle-pool-expansion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 (E2E) + custom Node validation script |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx tsx scripts/validate-puzzles.ts` |
| **Full suite command** | `npx tsx scripts/validate-puzzles.ts && npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx scripts/validate-puzzles.ts`
- **After every plan wave:** Run `npx tsx scripts/validate-puzzles.ts && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | PGEN-01, PGEN-02 | unit | `npx tsx scripts/validate-puzzles.ts` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 2 | PGEN-01 | unit | `npx tsx scripts/validate-puzzles.ts` | ✅ (from W1) | ⬜ pending |
| 14-03-01 | 03 | 2 | PGEN-02 | unit | `npx tsx scripts/validate-puzzles.ts` | ✅ (from W1) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validate-puzzles.ts` — validates all puzzles against chess.js rules, checks counts per piece/tier, verifies FEN correctness

*Wave 0 is the validation script itself — it must exist before puzzle authoring begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Puzzles are age-appropriate (5-9) | PGEN-01, PGEN-02 | Pedagogical judgment | Review tier 1 puzzles for simplicity, tier 3 for reasonable challenge |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
