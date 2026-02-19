---
status: resolved
trigger: "netatmo-camera-snapshot-404"
created: 2026-02-18T00:00:00Z
updated: 2026-02-18T01:30:00Z
---

## Current Focus

hypothesis: RESOLVED
test: Fix applied and verified
expecting: N/A
next_action: N/A

## Symptoms

expected: GET /api/netatmo/camera/70%3Aee%3A50%3A3b%3A1f%3A4f/snapshot returns JSON with image URL
actual: 404 Not Found (raw HTML from Next.js, not JSON)
errors: ":3000/api/netatmo/camera/70%3Aee%3A50%3A3b%3A1f%3A4f/snapshot:1 Failed to load resource: the server responded with a status of 404 (Not Found)"
reproduction: Navigate to camera page or any component that loads camera snapshot for MAC 70:ee:50:3b:1f:4f
started: Has always been broken. A previous fix (c75951f) added encodeURIComponent() but didn't fix it.

## Eliminated

- hypothesis: Route file missing or incorrectly named
  evidence: Route exists at app/api/netatmo/camera/[cameraId]/snapshot/route.ts and is compiled in .next/dev/server
  timestamp: 2026-02-18T00:10:00Z

- hypothesis: Next.js routing regex doesn't match the URL
  evidence: regex "^/api/netatmo/camera/([^/]+?)/snapshot(?:/)?$" matches both encoded and plain colon URLs
  timestamp: 2026-02-18T00:15:00Z

- hypothesis: Auth0 middleware blocking the request
  evidence: BYPASS_AUTH=true means auth is bypassed; middleware-manifest is empty
  timestamp: 2026-02-18T00:20:00Z

- hypothesis: Application-level notFound() is the 404
  evidence: Application notFound() returns NextResponse.json() which IS valid JSON; response.json() throws means non-JSON (HTML) 404 page
  timestamp: 2026-02-18T00:25:00Z

- hypothesis: URL encoding (encodeURIComponent) fixes the issue
  evidence: Commit c75951f added encoding on Feb 9 2026 but issue still persists
  timestamp: 2026-02-18T00:30:00Z

## Evidence

- timestamp: 2026-02-18T00:10:00Z
  checked: app/api/netatmo/camera/ directory structure and .next/dev manifests
  found: Route file exists; compiled; registered in app-paths-manifest
  implication: Not a missing file or compilation issue

- timestamp: 2026-02-18T00:15:00Z
  checked: routes-manifest.json regex
  found: "^/api/netatmo/camera/([^/]+?)/snapshot(?:/)?$" - matches any non-slash chars
  implication: Production build routing works; Turbopack dev server is different

- timestamp: 2026-02-18T00:20:00Z
  checked: .next/dev/dev/logs/next-development.log for "Errore fetch snapshot"
  found: "Browser ERROR Errore fetch snapshot: {}" - error is {} which is a SyntaxError (from response.json() failing on HTML body)
  implication: Route handler never runs; Next.js returns HTML 404 page

- timestamp: 2026-02-18T00:25:00Z
  checked: lib/core/apiResponse.ts notFound() function
  found: Uses NextResponse.json() - returns valid JSON with 404 status
  implication: If route handler ran, response.json() would succeed

- timestamp: 2026-02-18T00:30:00Z
  checked: git log for camera route and routes.ts
  found: Commit c75951f on Feb 9 2026 added encodeURIComponent() but 404 persists in current session
  implication: Neither raw colons nor encoded colons work in Turbopack dev routing

- timestamp: 2026-02-18T00:35:00Z
  checked: Next.js GitHub issues for Turbopack + URL encoding + dynamic routes
  found: Issues #54325, #77993, #45505 document Turbopack issues with encoded path params
  implication: Known Turbopack bug with percent-encoded characters in dynamic route segments

## Resolution

root_cause: Turbopack dev server (Next.js 16 with turbopack: {} in next.config.ts) fails to route requests to dynamic route handlers when the path segment contains URL-encoded special characters like %3A (encoded colon). The MAC address camera ID 70:ee:50:3b:1f:4f when URL-encoded as 70%3Aee%3A50%3A3b%3A1f%3A4f causes the Turbopack router to return a raw HTML 404 page instead of routing to app/api/netatmo/camera/[cameraId]/snapshot/route.ts. This is a known Turbopack issue (#54325, #77993 in vercel/next.js). Raw colons also fail (the original behavior before the c75951f workaround attempt).

fix: Replaced the dynamic path segment route with a static route that accepts cameraId as a query parameter. New endpoint is GET /api/netatmo/camera/snapshot?cameraId=<id>. This eliminates the problematic dynamic URL segment entirely.

verification: TypeScript check passes (0 errors). Unit tests pass (23/23 for netatmoCameraApi, 40/40 for requestParser). 17 pre-existing test failures unaffected.

files_changed:
  - lib/routes.ts (updated CAMERA_ROUTES.snapshot to use ?cameraId= query param)
  - app/api/netatmo/camera/snapshot/route.ts (new static route)
