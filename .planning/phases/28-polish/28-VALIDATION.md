---
phase: 28
slug: polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (SSR safety check)
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Saved" indicator appears for 2s after cloud write | POLSH-01 | Requires signed-in user + visual timing check | Sign in, tap a letter card, open settings drawer, observe "saved" indicator |
| "Saved locally" note when offline | POLSH-02 | Requires network disconnection | Sign in, disable wifi, open settings drawer, verify offline note |
| Tab return re-fetches cloud state | POLSH-03 | Requires multi-tab/device scenario | Sign in, earn progress on device B, return to device A tab, verify updated |
| Indicators hidden when signed out | POLSH-01 | Requires auth state transition | Sign out, verify no sync indicators visible |
| RTL layout of indicators | POLSH-01 | Visual verification | Switch to Hebrew, open drawer, verify alignment |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
