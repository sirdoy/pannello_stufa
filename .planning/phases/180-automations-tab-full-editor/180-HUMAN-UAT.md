---
status: partial
phase: 180-automations-tab-full-editor
source: [180-VERIFICATION.md]
started: 2026-04-30T00:00:00Z
updated: 2026-04-30T00:00:00Z
---

## Current Test

[awaiting human testing — auto-approved under `--auto` flag, items persist for follow-up]

## Tests

### 1. Smoke /automazioni live data flow
expected: List populates from real /api/v1/automations response (not empty); Sheet open + Save POST round-trips; row toggle PATCH succeeds; delete confirm DELETE succeeds; no console errors via Playwright collectConsoleErrors gate.
result: pending

### 2. Italian copy + visual parity sweep
expected: Bundle automations.jsx primitives match — 38px input height, 9px radius, 0.5px border, ember accent on Crea automazione, depth-aware sidebar colors on nested groups, 65+ Italian copy strings render correctly.
result: pending

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps

- gap: useAutomationsList → haGet runtime blocker (server-only env vars; deferred-runtime parallel to Phase 175-03)
  status: deferred
  next: small follow-up plan to rewire hook to relative `fetch('/api/v1/automations')`; documented in 180-09-SUMMARY.md and 180-VERIFICATION.md root-cause section.
