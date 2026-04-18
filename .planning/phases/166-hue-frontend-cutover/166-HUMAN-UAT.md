---
status: partial
phase: 166-hue-frontend-cutover
source: [166-VERIFICATION.md]
started: 2026-04-18T10:30:00Z
updated: 2026-04-18T10:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Firebase command log on real toggle
expected: Navigate to `/lights` (authenticated). Toggle any light on or off. Within 2-3 seconds a new entry appears in the Firebase RTDB `log` path with fields: `action` ("Luce accesa" or "Luce spenta"), `device` (LIGHTS constant), `lightId`, `value` ("ON" or "OFF"), `timestamp`, `source: "manual"`.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
