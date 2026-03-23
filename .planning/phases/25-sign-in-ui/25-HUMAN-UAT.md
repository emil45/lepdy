---
status: partial
phase: 25-sign-in-ui
source: [25-VERIFICATION.md]
started: 2026-03-24T00:00:00Z
updated: 2026-03-24T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Google sign-in flow
expected: Click sign-in button, complete OAuth, avatar + name appear in drawer
result: [pending]

### 2. Sign-out returns to anonymous state
expected: Click sign-out, sign-in button reappears
result: [pending]

### 3. Auth section invisible when flag is off
expected: No layout artifacts with cloudSyncEnabled=false (default)
result: [pending]

### 4. Locale translation rendering
expected: Keys resolve correctly (not raw key paths) in /en and /ru
result: [pending]

### 5. RTL layout
expected: Sign-out button sits at correct end of row in Hebrew
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
