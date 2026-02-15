---
status: resolved
trigger: "auth0-state-invalid"
created: 2026-02-15T00:00:00Z
updated: 2026-02-15T00:15:00Z
---

## Current Focus

hypothesis: Fix applied successfully
test: User must restart dev server and test login flow
expecting: Login will work without "state parameter is invalid" error
next_action: User verification required - restart dev server and test Auth0 login

## Symptoms

expected: User clicks login on http://localhost:3000, Auth0 login page appears, after login user is redirected back and authenticated.
actual: After Auth0 login, redirect back fails with "The state parameter is invalid" error. User cannot log in locally.
errors: "The state parameter is invalid" — this is an Auth0/nextauth error that occurs during the OAuth callback when the state parameter sent to Auth0 doesn't match the one received back.
reproduction: Open http://localhost:3000, click login, authenticate with Auth0, observe error on callback.
timeline: Was working before, recently broke. No specific trigger identified yet.

## Eliminated

## Evidence

- timestamp: 2026-02-15T00:05:00Z
  checked: .env.local configuration file
  found: AUTH0_BASE_URL="https://pannello-stufa.vercel.app" (production URL, not localhost)
  implication: This causes state parameter validation to fail because Auth0 compares the redirect_uri from the login request with the callback URL. When running on localhost:3000 but AUTH0_BASE_URL points to production, the state validation fails.

- timestamp: 2026-02-15T00:06:00Z
  checked: lib/auth0.ts configuration
  found: appBaseUrl uses process.env.AUTH0_BASE_URL, session cookies configured correctly (secure:false for dev, sameSite:lax)
  implication: The configuration looks correct for OAuth flow, but the BASE_URL needs to match the actual running environment (localhost vs production)

- timestamp: 2026-02-15T00:08:00Z
  checked: .env.example reference file
  found: AUTH0_BASE_URL=http://localhost:3000 (correct value for local development)
  implication: The .env.local file has production URL instead of localhost, this is the definitive root cause

## Resolution

root_cause: AUTH0_BASE_URL in .env.local is set to production URL "https://pannello-stufa.vercel.app" instead of "http://localhost:3000". During OAuth flow, Auth0 SDK uses this URL to construct the callback redirect_uri. When the authorization request is sent with redirect_uri=https://pannello-stufa.vercel.app/auth/callback but the actual callback comes from http://localhost:3000/auth/callback, the state parameter validation fails because the URLs don't match.
fix: Changed AUTH0_BASE_URL in .env.local from "https://pannello-stufa.vercel.app" to "http://localhost:3000"
verification:
  1. Ensure Auth0 dashboard has "http://localhost:3000/auth/callback" in Allowed Callback URLs (see docs/quick-start.md)
  2. Restart dev server (npm run dev) - required for .env.local changes to take effect
  3. Test login flow: navigate to http://localhost:3000, click login button, authenticate with Auth0
  4. Expected: After Auth0 authentication, user is successfully redirected back to http://localhost:3000 without "state parameter is invalid" error
  5. Verify user is logged in and can access protected pages
files_changed: [".env.local"]
