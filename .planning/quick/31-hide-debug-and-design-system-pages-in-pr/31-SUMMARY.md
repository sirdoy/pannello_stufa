---
phase: 31-hide-debug-pages
plan: "01"
subsystem: middleware
tags: [security, production, debug, middleware, next.js]
dependency_graph:
  requires: []
  provides: [production-debug-guard]
  affects: [/debug, /debug/design-system, /debug/*]
tech_stack:
  added: []
  patterns: [Next.js root middleware, Edge Runtime, NextResponse.rewrite]
key_files:
  created:
    - middleware.ts
  modified: []
decisions:
  - "Use NextResponse.rewrite to /not-found rather than NextResponse.redirect — preserves original URL in browser while returning 404 status"
  - "Use config.matcher instead of runtime path check — Next.js optimizes matcher at build time, only invokes middleware for matched routes"
  - "Import only from next/server — no @/lib/* imports to maintain Edge Runtime compatibility"
metrics:
  duration: "2 minutes"
  completed: "2026-02-18"
  tasks_completed: 1
  files_changed: 1
---

# Phase 31 Plan 01: Hide Debug and Design System Pages in Production Summary

Root Next.js middleware that blocks all /debug/* routes in production by rewriting to /not-found (404), while passing through unchanged in development.

## What Was Built

A single `middleware.ts` at the project root that:

1. Matches all `/debug` and `/debug/:path*` requests via `config.matcher`
2. In production (`NODE_ENV === 'production'`): rewrites the request to `/not-found`, triggering the app's 404 page with proper 404 status without altering the URL shown in the browser
3. In development: calls `NextResponse.next()` allowing the debug tooling to remain fully accessible

## Files Created

**`/Users/federicomanfredi/Sites/localhost/pannello-stufa/middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.rewrite(new URL('/not-found', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/debug', '/debug/:path*'],
};
```

## Verification

- `middleware.ts` exists at project root (same level as `package.json`)
- Exports `middleware` function and `config` object
- `config.matcher` covers both `/debug` (exact) and `/debug/:path*` (all sub-routes including `/debug/design-system`, `/debug/logs`, `/debug/stove`, etc.)
- Production branch: `NextResponse.rewrite(new URL('/not-found', request.url))`
- Development branch: `NextResponse.next()`
- Only `next/server` imports — Edge Runtime safe (no `@/lib/*` imports)

## Debug Routes Now Blocked in Production

All of the following `/debug` sub-routes will return 404 in production:
- `/debug` (index)
- `/debug/design-system`
- `/debug/logs`
- `/debug/notifications`
- `/debug/stove`
- `/debug/transitions`
- `/debug/weather-test`
- `/debug/api/*`
- `/debug/components/*`

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | d8df62c | feat(31-01): block /debug routes in production via root middleware |

## Self-Check: PASSED

- [x] `middleware.ts` exists at `/Users/federicomanfredi/Sites/localhost/pannello-stufa/middleware.ts`
- [x] Commit d8df62c present in git log
- [x] File exports both `middleware` function and `config` object
- [x] matcher covers `/debug` and `/debug/:path*`
- [x] No `@/lib/*` imports
