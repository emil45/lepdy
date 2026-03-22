---
phase: 12
slug: custom-piece-svgs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npm test -- --grep "chess"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --grep "chess"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | PIECE-01, PIECE-03, PIECE-04 | smoke | `npm test -- --grep "chess"` | ✅ existing | ⬜ pending |
| 12-01-02 | 01 | 1 | PIECE-01, PIECE-03 | build | `npm run build` | ✅ existing | ⬜ pending |
| 12-02-01 | 02 | 2 | PIECE-02 | smoke | `npm test -- --grep "chess"` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 2 | PIECE-02, PIECE-03 | manual | Visual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add Playwright test: chess game renders with horsey theme — load page with `lepdy_chess_piece_theme: 'horsey'` in localStorage, verify board renders without blank squares

*Existing chess tests cover staunty (default) rendering.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pieces render at 320px and 480px without clipping | PIECE-03 | Playwright can't easily verify SVG sizing/clipping | Resize browser to 320px and 480px, verify no pieces are cut off |
| Pieces are visually distinct at both sizes | PIECE-03 | Subjective visual assessment | At 320px width, confirm each piece type is recognizable |
| Adding a third theme requires only SVGs + one entry | PIECE-04 | Architecture verification | Code review of pieceThemes.tsx — confirm no conditional logic beyond registry |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
