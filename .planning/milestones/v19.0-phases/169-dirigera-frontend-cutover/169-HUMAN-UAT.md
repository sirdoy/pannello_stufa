---
status: partial
phase: 169-dirigera-frontend-cutover
source: [169-VERIFICATION.md]
started: 2026-04-22T22:47:33Z
updated: 2026-04-22T22:47:33Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. /dirigera page end-to-end runtime smoke
expected: Navigate to `/dirigera` in a browser; scroll below the sensor list. Three new section headings visible in order: "Statistiche" → "Eventi recenti" → "Telemetria". Each panel shows spinner on first load, then either data rows, empty-state copy ("Nessun evento" / "Nessuna telemetria" / "Statistiche non disponibili"), or the stale/error banner. "Carica altri 50" button appears on Eventi recenti + Telemetria when `items.length < total`, is hidden otherwise. Zero JS console errors.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
