---
phase: 31-hide-debug-pages
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - middleware.ts
autonomous: true
requirements:
  - HIDE-DEBUG-01
must_haves:
  truths:
    - "Visiting /debug in production returns a 404 response"
    - "Visiting /debug/design-system in production returns a 404 response"
    - "All /debug/* sub-routes in production return a 404 response"
    - "Visiting /debug in development works normally"
  artifacts:
    - path: "middleware.ts"
      provides: "Production guard for all /debug routes"
      contains: "NODE_ENV"
  key_links:
    - from: "middleware.ts"
      to: "/debug/*"
      via: "matcher config + NextResponse.rewrite to /not-found"
      pattern: "matcher.*debug"
---

<objective>
Block all /debug/* pages in production by returning a 404, while keeping them fully accessible in development.

Purpose: Prevents accidental exposure of debug tooling and internal API consoles to production users.
Output: Root-level middleware.ts that rewrites /debug/* to the 404 page when NODE_ENV === 'production'.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create root middleware.ts to block /debug routes in production</name>
  <files>middleware.ts</files>
  <action>
Create `/middleware.ts` at the project root (next to `package.json`, NOT inside `app/` or `lib/`).

The middleware should:
1. Match all `/debug` and `/debug/*` paths using the `config.matcher` export
2. In production (`process.env.NODE_ENV === 'production'`), rewrite the request to `/not-found` so Next.js renders the app's 404 page with a proper 404 status
3. In development, call `NextResponse.next()` to pass through unchanged

Use `NextResponse.rewrite()` with a URL pointing to `/not-found` — this triggers the `app/not-found.tsx` page with a 404 status without changing the URL in the browser address bar.

Implementation:

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

Do NOT import from `@/lib/core/middleware` — that file is for API route handlers, not Next.js middleware. Root middleware must use only `next/server` imports (Edge Runtime constraint).
  </action>
  <verify>
In development: visit http://localhost:3000/debug — page renders normally.
In production simulation: set NODE_ENV=production in a local env check, or verify by reading the middleware logic directly.
Confirm `middleware.ts` exists at project root (same level as `package.json`).
Confirm the `config.matcher` covers both `/debug` (exact) and `/debug/:path*` (all sub-routes).
  </verify>
  <done>
`middleware.ts` exists at project root with a `config.matcher` for `/debug` and `/debug/:path*`. When NODE_ENV is 'production', all matched routes rewrite to `/not-found`. When NODE_ENV is 'development', all matched routes pass through normally.
  </done>
</task>

</tasks>

<verification>
- `middleware.ts` exists at `/Users/federicomanfredi/Sites/localhost/pannello-stufa/middleware.ts`
- The file exports both `middleware` function and `config` object
- The `config.matcher` array contains `/debug` and `/debug/:path*`
- The production branch uses `NextResponse.rewrite(new URL('/not-found', request.url))`
- The development branch uses `NextResponse.next()`
- No imports from `@/lib/*` (Edge Runtime safe)
</verification>

<success_criteria>
All /debug/* routes are blocked in production (404 response via rewrite to /not-found). Development access is unaffected. Single file change, no modifications to existing debug pages required.
</success_criteria>

<output>
After completion, create `.planning/quick/31-hide-debug-and-design-system-pages-in-pr/31-01-SUMMARY.md` with what was built.
</output>
