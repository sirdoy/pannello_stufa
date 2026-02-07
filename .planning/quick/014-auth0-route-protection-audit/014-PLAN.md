# Quick Task 014: Auth0 Route Protection Audit

## Goal
Audit all 97 API routes for correct Auth0 protection. Cron routes must be open (CRON_SECRET protected). All data routes must require Auth0 session.

## Tasks

### Task 1: Audit all API routes
- Enumerate all `app/api/**/route.ts` files
- Check which middleware wrapper each uses
- Identify any unprotected data endpoints

### Task 2: Fix unprotected routes
- `/api/notifications/stats` found with NO authentication
- Wrap with `withAuthAndErrorHandler` to require Auth0 session
- Remove manual try/catch (middleware handles errors)

## Findings

### Protected (93 routes) - OK
- 88 routes: `withAuthAndErrorHandler` (Auth0 required)
- 5 routes: `withHueHandler` (Auth0 + Hue error handling)

### Cron-protected (5 routes) - OK, intentionally open
- `/api/scheduler/check` - `withCronSecret`
- `/api/health-monitoring/check` - `withCronSecret`
- `/api/coordination/enforce` - `withCronSecret`
- `/api/notifications/cleanup` POST - inline CRON_SECRET check
- `/api/notifications/check-rate` POST - inline CRON_SECRET check

### Intentionally unprotected (4 routes) - OK
- `/api/health` - uptime monitoring, no sensitive data
- `/api/hue/remote/authorize` - OAuth flow initiation
- `/api/hue/remote/callback` - OAuth callback (checks session internally)
- `/api/netatmo/callback` - webhook with signature verification

### Vulnerability fixed (1 route)
- `/api/notifications/stats` - was completely open, now protected with `withAuthAndErrorHandler`
