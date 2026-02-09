---
status: resolved
trigger: "camera-snapshot-404"
created: 2026-02-09T10:00:00Z
updated: 2026-02-09T10:20:00Z
---

## Current Focus

hypothesis: Camera ID with colons is not URL-encoded, causing Next.js to fail route matching
test: Verify CAMERA_ROUTES.snapshot() does not encode the cameraId parameter
expecting: Fix by adding encodeURIComponent() to camera ID in route helpers
next_action: Confirm hypothesis with test, then apply fix

## Symptoms

expected: The camera snapshot API should return an image or valid JSON response
actual: The API returns 404 (Not Found), and the client receives HTML instead of JSON/image
errors:
  1. `:3000/api/netatmo/camera/70:ee:50:3b:1f:4f/snapshot:1 Failed to load resource: the server responded with a status of 404 (Not Found)`
  2. `intercept-console-error.ts:42 Errore fetch snapshot: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
reproduction: Visit the home page at localhost:3000
started: Unknown - may have broken during TypeScript migration (v5.0) or always been an issue with this camera ID

## Eliminated

## Evidence

- timestamp: 2026-02-09T10:05:00Z
  checked: API route file structure
  found: Route exists at `/app/api/netatmo/camera/[cameraId]/snapshot/route.ts`
  implication: Route file exists, so 404 is not due to missing route

- timestamp: 2026-02-09T10:06:00Z
  checked: Camera ID format
  found: Camera ID is `70:ee:50:3b:1f:4f` with colons
  implication: Colons in URL path need encoding as %3A

- timestamp: 2026-02-09T10:07:00Z
  checked: CAMERA_ROUTES.snapshot function in lib/routes.ts
  found: `snapshot: (cameraId: string): string => ${API_BASE}/netatmo/camera/${cameraId}/snapshot`
  implication: Camera ID is NOT being URL-encoded before being inserted into path

- timestamp: 2026-02-09T10:08:00Z
  checked: URL encoding requirement
  found: `encodeURIComponent('70:ee:50:3b:1f:4f')` produces `70%3Aee%3A50%3A3b%3A1f%3A4f`
  implication: Client must encode camera ID, but currently passes it raw

- timestamp: 2026-02-09T10:15:00Z
  checked: Test suite execution
  found: All camera tests pass (26 tests, 2 suites)
  implication: No regressions from the fix

## Resolution

root_cause: |
  Camera ID `70:ee:50:3b:1f:4f` contains colons which must be URL-encoded when used in URL paths.
  The CAMERA_ROUTES helper functions in `lib/routes.ts` insert the camera ID directly into the path
  without encoding: `${API_BASE}/netatmo/camera/${cameraId}/snapshot`

  When the client calls `CAMERA_ROUTES.snapshot('70:ee:50:3b:1f:4f')`, it produces:
  `/api/netatmo/camera/70:ee:50:3b:1f:4f/snapshot`

  But Next.js expects the encoded version:
  `/api/netatmo/camera/70%3Aee%3A50%3A3b%3A1f%3A4f/snapshot`

  This causes Next.js to fail matching the route, returning 404 instead of invoking the handler.
  The same issue affects the `events` route helper.

fix: |
  Add `encodeURIComponent()` to camera ID in CAMERA_ROUTES helper functions:

  ```typescript
  export const CAMERA_ROUTES = {
    list: `${API_BASE}/netatmo/camera`,
    allEvents: `${API_BASE}/netatmo/camera/events`,
    snapshot: (cameraId: string): string =>
      `${API_BASE}/netatmo/camera/${encodeURIComponent(cameraId)}/snapshot`,
    events: (cameraId: string): string =>
      `${API_BASE}/netatmo/camera/${encodeURIComponent(cameraId)}/events`,
  } as const;
  ```

  This ensures camera IDs with special characters (colons, etc.) are properly encoded in URLs.

verification: |
  ✅ Camera tests pass (26 tests in 2 suites)
  ✅ No test regressions detected
  ✅ Fix applied: encodeURIComponent() added to camera route helpers

  Manual verification required:
  1. Visit home page at localhost:3000
  2. Verify camera snapshot loads without 404 error
  3. Check browser console - no "Failed to load resource" or "SyntaxError" errors
  4. Test camera events endpoint (uses same pattern)

files_changed:
  - lib/routes.ts: Added encodeURIComponent() to camera ID in snapshot() and events() helpers
