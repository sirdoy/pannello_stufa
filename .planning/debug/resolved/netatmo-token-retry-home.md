---
status: resolved
trigger: "I componenti Netatmo nella home mostrano subito offline senza verificare correttamente i token e senza retry"
created: 2026-02-02T10:00:00Z
updated: 2026-02-02T10:40:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED
test: Implemented retry logic with 1 retry attempt and 1.5s delay
expecting: Components now retry once before showing disconnected state
next_action: Commit and close

## Symptoms

expected: Mostra loading e retry, rinnova token silenziosamente se possibile. Il componente dovrebbe verificare se il problema e un token scaduto vs dispositivo realmente offline.
actual: Mostra subito offline senza ritentare ne verificare i token
errors: Nessun errore visibile nella console, solo il risultato finale errato
reproduction: Quando i token Netatmo scadono o non sono validi, i componenti home mostrano immediatamente "offline"
started: Dopo un aggiornamento recente

## Eliminated

- hypothesis: Backend doesn't refresh tokens automatically
  evidence: lib/netatmoTokenHelper.js lines 46-54 show token cache with auto-refresh before expiry
  timestamp: 2026-02-02T10:12:00Z

- hypothesis: Module reachable status is incorrect
  evidence: reachable defaults to true if status is unavailable (line 85)
  timestamp: 2026-02-02T10:20:00Z

## Evidence

- timestamp: 2026-02-02T10:05:00Z
  checked: app/page.js - Home page structure
  found: Home page renders ThermostatCard and CameraCard as Netatmo components
  implication: Both components fetch Netatmo data independently

- timestamp: 2026-02-02T10:08:00Z
  checked: app/components/devices/thermostat/ThermostatCard.js lines 138-165
  found: checkConnection() sets connected=false immediately on error or reconnect:true response, no retry logic
  implication: Component does not distinguish between token expiry and device offline

- timestamp: 2026-02-02T10:10:00Z
  checked: app/api/netatmo/homesdata/route.js
  found: API uses requireNetatmoToken() which throws ApiError with reconnect:true for TOKEN_EXPIRED
  implication: Backend properly signals token issues with reconnect flag

- timestamp: 2026-02-02T10:12:00Z
  checked: lib/netatmoTokenHelper.js lines 35-76
  found: getValidAccessToken() already has refresh logic built in - checks cache, refreshes if expired
  implication: Token refresh DOES happen server-side, but client doesn't handle reconnect properly

- timestamp: 2026-02-02T10:14:00Z
  checked: app/components/devices/camera/CameraCard.js lines 54-104
  found: CameraCard has similar pattern but also checks for specific error types (invalid_access_token, access_denied) to set needsReauth flag
  implication: Some differentiation exists but no retry mechanism either

- timestamp: 2026-02-02T10:22:00Z
  checked: lib/netatmoTokenHelper.js lines 82-129 (doTokenRefresh)
  found: Token refresh fails fast with TOKEN_EXPIRED when refresh_token is invalid
  implication: When refresh_token is revoked/expired, API immediately returns reconnect:true

## Resolution

root_cause: ThermostatCard.checkConnection() and fetchStatus() immediately set connected=false when receiving data.reconnect=true or any error, without:
1. Attempting a retry after a brief delay (temporary network issues)
2. Showing intermediate "retrying" state to user
3. CameraCard has same issue

The backend token refresh IS working correctly - it refreshes access tokens before they expire. The issue is only when the refresh_token itself is invalid (user revoked, or > 30 days since last use). In this case:
- Backend clears invalid tokens and returns `reconnect: true`
- Client should show "reconnect needed" UI, NOT "device offline"

fix: Added retry logic to both components:

**ThermostatCard.js**:
- checkConnection(retryCount = 0): Retries once with 1.5s delay for token issues, network errors
- fetchStatus(retryCount = 0): Same retry logic for status polling
- Shows "Riconnessione in corso...", "Verifica token in corso...", "Nuovo tentativo..." messages

**CameraCard.js**:
- fetchCameras(retryCount = 0): Retries once with 1.5s delay for reconnect and network errors
- Keeps existing scope-specific error handling (no retry for permission errors)

Both use MAX_RETRIES=1 and RETRY_DELAY_MS=1500ms to balance user experience with avoiding unnecessary delays.

verification:
- ThermostatCard schedule tests: 3/3 passing
- Camera API tests: 23/23 passing
- No regression in related tests

files_changed:
- app/components/devices/thermostat/ThermostatCard.js
- app/components/devices/camera/CameraCard.js
