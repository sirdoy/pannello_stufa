---
phase: 91-correzione-problemi-dati-rete-e-netatmo-camera
plan: "01"
subsystem: camera, scheduler, netatmo-hooks
tags: [bug-fix, camera, netatmo, proxy, 503-retry, 302-redirect]
dependency_graph:
  requires: []
  provides: [verified-camera-snapshot-302-redirect, verified-503-retry-hooks]
  affects: [app/api/netatmo/camera/snapshot, lib/hooks/useScheduleData, lib/hooks/useRoomStatus]
tech_stack:
  added: []
  patterns: [302-redirect-for-cdn-auth, transient-503-retry-with-loading-state]
key_files:
  created:
    - .planning/phases/91-correzione-problemi-dati-rete-e-netatmo-camera/91-01-SUMMARY.md
  modified:
    - .planning/debug/camera-snapshot-live-broken.md
    - .planning/debug/topology-not-ready-schedules.md
decisions:
  - "302 redirect for camera snapshot: browser loads CDN URL directly — resilient to server-side network topology issues"
  - "SERVICE_UNAVAILABLE retry (MAX_RETRIES=5, RETRY_DELAY_MS=3000): proxy warm-up is transient, not a fatal error"
  - "Remaining proxy-side issues (VPN URL unavailable, SAS token expiry) require HA proxy changes — documented in docs/camera-proxy-requirements.md, not Next.js fixes"
metrics:
  duration: "10 minutes"
  completed: 2026-03-18
  tasks_completed: 1
  files_modified: 2
---

# Phase 91 Plan 01: Verify and Document Debug Fixes Summary

**One-liner:** Camera snapshot 302 redirect + useScheduleData/useRoomStatus 503 retry — 93 tests confirmed green, debug sessions closed.

## What Was Done

This plan formally verified, documented, and closed two debug sessions from commit d33d210.
All code changes were already committed. This plan confirmed test coverage and updated debug file status.

## Implementation Commit

**d33d210** — Contains all code changes verified in this plan.

## Fixes Documented

### Fix 1: Camera Snapshot 302 Redirect

**File:** `app/api/netatmo/camera/snapshot/route.ts`

Changed the snapshot route from server-side binary proxying to a 302 redirect.
The browser now follows the redirect and loads the JPEG directly from the Netatmo CDN.

This is more resilient because:
- No dependency on the Next.js server's network access to `v.netatmo.com`
- The browser can access the CDN URL regardless of server network topology
- `<img>` tags follow 302 redirects natively

Pattern: `NextResponse.redirect(snapshot_url, { status: 302 })`

### Fix 2: Camera Stream Loading/Error States

**Files:** `app/components/devices/camera/CameraCard.tsx`, `app/(pages)/camera/CameraDashboard.tsx`

Added `streamLoading` and `streamError` states to both components. When user clicks "Live":
- Loading spinner appears while `fetchStreamUrl` runs
- Error message shown if stream fetch fails
- User always gets visible feedback, no silent failure

### Fix 3: CameraDashboard Snapshot Error Handlers

**File:** `app/(pages)/camera/CameraDashboard.tsx`

Added `onError` handlers on all snapshot `<img>` elements. Failed snapshots now show a
graceful "N/D" fallback instead of a broken image icon.

State: `snapshotErrors` map (keyed by `camera_id`) tracks which snapshots failed.
Reset on data refresh.

### Fix 4: useScheduleData 503 Retry Logic

**File:** `lib/hooks/useScheduleData.ts`

Added SERVICE_UNAVAILABLE retry: `MAX_RETRIES=5`, `RETRY_DELAY_MS=3000`.
When the API returns `{ code: 'SERVICE_UNAVAILABLE' }` or HTTP 503:
- Hook stays in loading state (no error flash)
- Retries up to 5 times with 3s delay between attempts
- Only surfaces `'Servizio Netatmo non disponibile, riprova più tardi'` after all retries exhausted
- `refetch()` cancels pending retries
- Unmount cancels pending retries

### Fix 5: useRoomStatus 503 Retry Logic

**File:** `lib/hooks/useRoomStatus.ts`

Identical retry pattern applied to `useRoomStatus` for the `/api/netatmo/homestatus` endpoint.

## Files Changed in d33d210

| File | Change |
|------|--------|
| `app/api/netatmo/camera/snapshot/route.ts` | 302 redirect instead of binary proxy |
| `app/api/netatmo/camera/route.ts` | DELETED — Turbopack alias conflict |
| `app/components/devices/camera/CameraCard.tsx` | streamLoading + streamError states |
| `app/(pages)/camera/CameraDashboard.tsx` | snapshotErrors + stream loading/error |
| `__tests__/app/api/netatmo/camera/snapshot.test.ts` | Rewritten for redirect behavior |
| `__tests__/app/api/netatmo/camera/stream.test.ts` | New test file |
| `lib/hooks/useScheduleData.ts` | 503 retry: MAX_RETRIES=5, RETRY_DELAY_MS=3000 |
| `lib/hooks/useRoomStatus.ts` | 503 retry: same pattern |
| `lib/hooks/__tests__/useScheduleData.test.ts` | 7 tests |
| `lib/hooks/__tests__/useRoomStatus.test.ts` | 7 tests |
| `docs/camera-proxy-requirements.md` | Proxy-side issues documented |

## Test Results

All targeted tests confirmed green:

- **72 camera tests** — 9 test suites: status, events, snapshot, stream, monitoring, CameraDashboard, netatmoCameraApi, netatmoProxy-camera, CameraMonitoringToggle
- **14 hook tests** — useScheduleData (7) + useRoomStatus (7)
- **93 total** — 12 suites matched the pattern (includes additional camera-related files)

## Remaining Proxy-Side Issues (Not Next.js Bugs)

These require changes to the HA proxy, not to the Next.js app. Documented in `docs/camera-proxy-requirements.md`:

1. **Camera live snapshot returns 503 when VPN URL unavailable** — Proxy returns 503 when `vpn_url` is not set. This is a proxy limitation; the camera must be on VPN for live snapshots to work.

2. **Camera event snapshots: SAS tokens expire ~5 min after proxy caches them** — Cached event snapshot URLs have short-lived SAS tokens. The proxy needs to either not cache these or refresh them on demand.

## Deviations from Plan

None — plan executed exactly as written. Tests ran with `--testPathPatterns` (updated CLI flag in newer jest version) instead of `--testPathPattern`, which is expected.

## Debug Session Status

- `.planning/debug/camera-snapshot-live-broken.md` — `status: resolved` (2026-03-18)
- `.planning/debug/topology-not-ready-schedules.md` — `status: resolved` (2026-03-18)
