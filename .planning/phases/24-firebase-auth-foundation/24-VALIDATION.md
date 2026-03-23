---
phase: 24
slug: firebase-auth-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test e2e/app.spec.ts --reporter=list` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (SSR safety check)
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | AUTH-04 | build | `npm run build` | ✅ | ⬜ pending |
| 24-01-02 | 01 | 1 | AUTH-05 | build | `npm run build` | ✅ | ⬜ pending |
| 24-01-03 | 01 | 1 | AUTH-06 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Playwright E2E tests already exist. Build verification (`npm run build`) confirms SSR safety.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google sign-in popup on desktop | AUTH-05 | Requires real Google OAuth interaction | Click sign-in button on desktop browser, verify popup opens |
| Google sign-in redirect on iOS Safari | AUTH-05 | Requires iOS Safari device/simulator | Open site on iOS Safari, click sign-in, verify redirect flow |
| Auth UI hidden when cloudSyncEnabled=false | AUTH-04 | Requires Firebase Remote Config toggle | Set flag to false in Firebase console, verify no auth UI visible |
| COPPA framing text displays correctly | AUTH-06 | Requires Hebrew native speaker review | Verify Hebrew text reads naturally and frames sign-in as parent action |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
