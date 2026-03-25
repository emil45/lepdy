---
phase: 25
slug: sign-in-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 25 — Validation Strategy

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

- **After every task commit:** Run `npm run build` (SSR safety + compilation check)
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | AUTH-01, AUTH-02, AUTH-03 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Build verification confirms compilation. E2E tests confirm no regressions.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google sign-in completes successfully | AUTH-01 | Requires real Google OAuth interaction | Open settings drawer, tap sign-in button, complete Google flow, verify avatar appears |
| Sign-out returns to anonymous state | AUTH-02 | Requires authenticated session first | Sign in, then tap sign-out, verify sign-in button reappears |
| Avatar and display name shown when signed in | AUTH-03 | Requires live Google profile data | Sign in, verify 32px avatar and display name in drawer |
| Skeleton placeholder shown during auth loading | AUTH-03 | Requires slow network or initial page load observation | Open drawer on fresh page load, verify skeleton appears briefly |
| Auth section hidden when cloudSyncEnabled=false | AUTH-01 | Requires Firebase Remote Config toggle | Set flag to false in console, verify no auth section in drawer |
| RTL layout correct in Hebrew | AUTH-01 | Visual verification needed | Switch to Hebrew, open drawer, verify alignment |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
