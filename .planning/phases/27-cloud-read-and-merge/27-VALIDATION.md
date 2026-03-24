---
phase: 27
slug: cloud-read-and-merge
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 27 — Validation Strategy

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
| First sign-in preserves 6 weeks of local progress | SYNC-02 | Requires pre-populated localStorage + Google auth | Populate localStorage with progress data, sign in, verify nothing lost |
| Second device sees first device's progress | SYNC-03 | Requires two devices/browsers | Sign in on device A, earn progress, sign in on device B, verify same progress |
| Union merge: independent progress merged | SYNC-03 | Requires two-device divergent scenario | Earn different items on each device, sign in on both, verify union |
| Merge runs only once per sign-in | SYNC-02 | Requires observing RTDB writes + sessionStorage | Sign in, check sessionStorage guard key, verify no re-merge on refresh |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
