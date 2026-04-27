---
status: partial
phase: 170-auth-ui
source: [170-VERIFICATION.md]
started: 2026-04-23T00:00:00Z
updated: 2026-04-23T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Cookie `HttpOnly` flag observed in real browser DevTools
expected: Against the real HA proxy (stage/prod), opening `/login` in Chrome and Safari, submitting valid credentials, and checking DevTools → Application → Cookies shows `ha_auth` with `HttpOnly` flag set true (and `Secure` true in prod).
result: [pending]

### 2. Created plaintext API key authenticates against HA proxy
expected: Create a new API key via `/settings/api-keys` → copy the one-shot plaintext → run `curl -H "X-API-Key: <plaintext>" <HA_API_URL>/health` → HTTP 200.
result: [pending]

### 3. Revoked key returns 401 on subsequent use
expected: Revoke a previously-created key via the UI → immediately run the same `curl -H "X-API-Key: <plaintext>" <HA_API_URL>/health` → HTTP 401.
result: [pending]

### 4. Copy-to-clipboard button populates OS clipboard
expected: After creating a new key, click the "Copia chiave" button in the reveal modal → paste into another application (Notes, Terminal) → the full plaintext `ha_live_...` string matches exactly what was displayed.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
