---
phase: 26
slug: cloud-write-path
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 26 — Validation Strategy

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

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | SYNC-01 | build | `npm run build` | ✅ | ⬜ pending |
| 26-01-02 | 01 | 1 | SYNC-04, SYNC-05 | build | `npm run build` | ✅ | ⬜ pending |
| 26-02-01 | 02 | 2 | SYNC-01 | build+test | `npm run build && npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Build verification confirms compilation. E2E tests confirm no regressions.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Progress appears in Firebase within 60s | SYNC-01 | Requires signed-in user + Firebase console observation | Sign in, tap a letter card, check RTDB console within 60s |
| Offline writes queue and flush | SYNC-04 | Requires network disconnection simulation | Sign in, disable wifi, tap cards, re-enable, check RTDB |
| Signed-out user has zero behavior change | SYNC-05 | Requires comparing behavior with/without auth | Use app without signing in, verify no console errors |
| Security rules block cross-user access | SYNC-04 | Requires multi-user scenario | Sign in as user A, attempt to read user B's path via RTDB REST API |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
