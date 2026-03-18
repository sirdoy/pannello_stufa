---
status: resolved
resolved: 2026-03-18
trigger: "useScheduleData hook throws 'Topology not yet available — waiting for first poll' error when fetching schedules"
created: 2026-03-16T00:00:00Z
updated: 2026-03-16T00:00:00Z
---

## Current Focus

hypothesis: The hook treats 503 SERVICE_UNAVAILABLE from the proxy as a fatal error. The correct fix is to detect this code and enter a retry/loading state instead of propagating the error to the UI.
test: Implement retry logic in useScheduleData and useRoomStatus for SERVICE_UNAVAILABLE responses
expecting: Hooks retry after delay; no console error shown to user during topology warm-up
next_action: Apply fix to both hooks + write unit tests

## Symptoms

expected: Schedule data loads gracefully, showing a loading state if topology isn't ready yet
actual: Console error thrown: "Topology not yet available — waiting for first poll" at useScheduleData.ts:69
errors: throw new Error(data.message || data.error || 'Errore nel caricamento dei programmi')
reproduction: Load the schedule/thermostat page before the Netatmo proxy has completed its first poll
started: Likely since v10.0 Netatmo API Migration

## Eliminated

- hypothesis: The message originates in the Next.js API route code itself
  evidence: Searched all app/api/ files — "Topology not yet available" only in docs. The message comes from the remote Netatmo proxy, propagated as-is via RFC 9457 detail field
  timestamp: 2026-03-16T00:00:00Z

- hypothesis: Only useScheduleData is affected
  evidence: useRoomStatus.ts line 24 has the identical pattern: throw new Error(data.message || data.error || ...) on any !res.ok response, and calls /api/netatmo/homestatus which also goes through the proxy and can return the same 503
  timestamp: 2026-03-16T00:00:00Z

## Evidence

- timestamp: 2026-03-16T00:00:00Z
  checked: app/api/netatmo/schedules/route.ts
  found: Route calls getProxyHomesdata() which calls netatmoProxyGet('/homesdata'). If proxy returns 503, netatmoProxyGet throws ApiError(SERVICE_UNAVAILABLE, detail, 503). withAuthAndErrorHandler catches and returns JSON { success: false, error: "Topology not yet available — waiting for first poll", code: "SERVICE_UNAVAILABLE" } with HTTP 503.
  implication: The Next.js API route correctly propagates 503 upstream. The hook must handle this gracefully.

- timestamp: 2026-03-16T00:00:00Z
  checked: lib/hooks/useScheduleData.ts:60-69
  found: When !res.ok, checks status 429 specifically, then falls through to generic throw new Error(data.message || data.error || ...). No special handling for 503/SERVICE_UNAVAILABLE.
  implication: Any temporary 503 (topology warming up) is treated identically to a permanent error. This is the bug.

- timestamp: 2026-03-16T00:00:00Z
  checked: lib/hooks/useRoomStatus.ts:23-24
  found: Same pattern — throw new Error(data.message || data.error || ...) with no 503 handling.
  implication: useRoomStatus has the same bug for the homestatus endpoint.

- timestamp: 2026-03-16T00:00:00Z
  checked: lib/core/apiResponse.ts (fromApiError) + lib/core/apiErrors.ts
  found: Error responses include { success: false, error: string, code: ErrorCode }. SERVICE_UNAVAILABLE code is available to discriminate transient vs permanent errors.
  implication: Hooks can check data.code === 'SERVICE_UNAVAILABLE' to identify retryable conditions.

## Resolution

root_cause: useScheduleData and useRoomStatus treat HTTP 503 SERVICE_UNAVAILABLE (proxy topology not yet ready) as a fatal error, throwing it into the error state instead of retrying. The proxy returns this transiently during its first poll warm-up period.

fix: Add SERVICE_UNAVAILABLE retry logic to both hooks. When the API responds with code === 'SERVICE_UNAVAILABLE', stay in loading state and schedule a retry after a configurable delay (default 3s), up to a max retry count (default 5). Only set the error state on permanent failures or after max retries exceeded.

verification: 14/14 unit tests pass. Tests confirm: (1) hook retries on 503 SERVICE_UNAVAILABLE, (2) hook stays loading during retries (no error flash), (3) hook surfaces "Servizio Netatmo non disponibile, riprova più tardi" only after 5 retries exhausted, (4) refetch() cancels pending retries, (5) unmount cancels pending retries, (6) 429 and other errors are still surfaced immediately without retry.

files_changed:
  - lib/hooks/useScheduleData.ts
  - lib/hooks/useRoomStatus.ts
  - lib/hooks/__tests__/useScheduleData.test.ts
  - lib/hooks/__tests__/useRoomStatus.test.ts
