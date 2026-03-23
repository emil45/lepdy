# Requirements: Lepdy Cloud Sync

**Defined:** 2026-03-24
**Core Value:** Kids learn chess fundamentals through fun, progressive puzzles while learning Hebrew chess vocabulary

## v1.5 Requirements

Requirements for cloud sync milestone. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Parent can sign in with Google account from settings sidebar
- [ ] **AUTH-02**: Parent can sign out from settings sidebar
- [ ] **AUTH-03**: User can see their Google avatar and name in settings when signed in
- [ ] **AUTH-04**: Auth UI is gated behind `cloudSyncEnabled` Firebase Remote Config flag
- [ ] **AUTH-05**: Sign-in uses redirect fallback when popup is blocked (iOS Safari)
- [ ] **AUTH-06**: Sign-in UI is framed as a parent action for COPPA compliance

### Cloud Sync

- [ ] **SYNC-01**: All progress data writes to Firebase when user is authenticated (debounced)
- [ ] **SYNC-02**: On first sign-in, localStorage progress merges into cloud using union strategy (no progress lost)
- [ ] **SYNC-03**: On subsequent sign-in, cloud data merges into localStorage for cross-device sync
- [ ] **SYNC-04**: Sync works offline — localStorage as cache, syncs back when connectivity returns
- [ ] **SYNC-05**: Firebase security rules restrict users to read/write only their own data

### Polish

- [ ] **POLSH-01**: Subtle "saved" sync status indicator appears in settings after successful cloud write
- [ ] **POLSH-02**: "Progress saved locally" note shown in settings when device is offline
- [ ] **POLSH-03**: App re-fetches cloud state on tab focus (Visibility API) for cross-device pickup

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Profiles

- **PROF-01**: Multiple child profiles under one parent account
- **PROF-02**: Profile switcher in settings

### Parent Dashboard

- **DASH-01**: Parent can view child's progress across all categories
- **DASH-02**: Parent can view child's chess mastery per piece

### Alternative Auth

- **ALTAUTH-01**: Email/password sign-in option
- **ALTAUTH-02**: Apple sign-in option

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mandatory login | COPPA requires parental consent for under-13; mandatory login = mandatory data collection = legal risk. Also kills onboarding conversion |
| Child account creation (email/password) | COPPA consent burden; parent's Google account is sufficient |
| Firebase anonymous auth → upgrade path | Adds extra auth state + migration complexity; localStorage is already the clean no-account path |
| Real-time sync during active sessions | Race conditions, high write cost, no meaningful benefit — sessions complete atomically |
| Sync locale/language preference | Locale is per-device (affects RTL/LTR); syncing would override device language on re-login |
| Per-child profiles | Fundamentally different product scope; single account = single progress for v1.5 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 25 | Pending |
| AUTH-02 | Phase 25 | Pending |
| AUTH-03 | Phase 25 | Pending |
| AUTH-04 | Phase 24 | Pending |
| AUTH-05 | Phase 24 | Pending |
| AUTH-06 | Phase 24 | Pending |
| SYNC-01 | Phase 26 | Pending |
| SYNC-02 | Phase 27 | Pending |
| SYNC-03 | Phase 27 | Pending |
| SYNC-04 | Phase 26 | Pending |
| SYNC-05 | Phase 26 | Pending |
| POLSH-01 | Phase 28 | Pending |
| POLSH-02 | Phase 28 | Pending |
| POLSH-03 | Phase 28 | Pending |

**Coverage:**
- v1.5 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 — traceability filled after roadmap creation*
