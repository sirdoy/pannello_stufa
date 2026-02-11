---
status: resolved
trigger: "auth-race-condition-mobile: When accessing the thermostat settings page remotely from mobile, sometimes the app shows the user as not authenticated. The user wants: (1) wait for auth verification to complete before rendering page content, (2) if user is truly not authenticated, redirect to login page."
created: 2026-02-11T10:00:00Z
updated: 2026-02-11T10:00:00Z
---

## Current Focus

hypothesis: ThermostatSettingsPage doesn't check auth loading state, its child components make API calls immediately before Auth0 session is verified
test: Verify child components make API calls in useEffect without waiting for auth, confirm race condition mechanism
expecting: StoveSyncPanel and PidAutomationPanel both call APIs in useEffect without auth checks
next_action: confirm hypothesis by checking child component mount behavior, then implement fix

## Symptoms

expected: Page should wait for auth verification, then either show content (authenticated) or redirect to login (not authenticated)
actual: Sometimes shows "not authenticated" error intermittently on mobile remote access, suggesting the page renders before auth state is resolved
errors: Authentication-related errors when loading the page
reproduction: Access the thermostat settings page from mobile on a remote/slow connection
started: Intermittent - happens sometimes, especially on mobile

## Eliminated

## Evidence

- timestamp: 2026-02-11T10:05:00Z
  checked: Auth system architecture
  found: Auth0Provider wraps entire app in ClientProviders, useUser hook from @auth0/nextjs-auth0/client provides auth state
  implication: Client-side auth hook available but need to verify loading state behavior

- timestamp: 2026-02-11T10:06:00Z
  checked: app/settings/page.tsx (similar protected page)
  found: Uses useUser hook with isLoading check, shows skeleton during loading, shows "not authenticated" message if !user after loading
  implication: Pattern exists for checking auth loading state - should apply to ThermostatSettingsPage

- timestamp: 2026-02-11T10:07:00Z
  checked: app/components/netatmo/PidAutomationPanel.tsx
  found: Also uses useUser with userLoading check, shows skeleton during userLoading, shows "not authenticated" if !user
  implication: Consistent pattern across codebase for handling auth loading state

- timestamp: 2026-02-11T10:08:00Z
  checked: app/settings/thermostat/page.tsx (the problematic page)
  found: NO auth checks at all - directly renders SettingsLayout and child components without checking user or loading state
  implication: THIS IS THE BUG - page doesn't wait for auth, components inside make API calls before auth is verified

- timestamp: 2026-02-11T10:10:00Z
  checked: app/components/netatmo/StoveSyncPanel.tsx
  found: useEffect(() => fetchConfig(), []) on mount - immediately calls fetch(NETATMO_ROUTES.stoveSync) without checking auth
  implication: API call fires before Auth0 session is verified, causing 401 errors on slow connections

- timestamp: 2026-02-11T10:11:00Z
  checked: app/components/netatmo/PidAutomationPanel.tsx
  found: useEffect with dependency on user/userLoading - DOES check if (!user || userLoading) return - BUT useUser hook called inside component
  implication: PidAutomationPanel has proper auth checks, but StoveSyncPanel does not

- timestamp: 2026-02-11T10:12:00Z
  checked: Auth0Provider architecture
  found: Auth0Provider from @auth0/nextjs-auth0/client wraps app, useUser hook returns { user, isLoading }
  implication: Auth loading state is available via useUser hook, just needs to be used consistently

## Resolution

root_cause: Race condition in auth verification flow - ThermostatSettingsPage and StoveSyncPanel don't wait for Auth0 session verification before rendering/making API calls. On slow mobile connections, Auth0's useUser hook is still loading (isLoading=true) when components mount and fire API requests, causing 401 errors. PidAutomationPanel already implements proper auth checks, but page and StoveSyncPanel do not.

fix:
1. ✅ Added useUser hook to ThermostatSettingsPage
2. ✅ Show skeleton while isLoading=true (auth verification in progress)
3. ✅ Redirect to /auth/login if !user after loading completes
4. ✅ Updated StoveSyncPanel to check user/userLoading before fetching config (consistent with PidAutomationPanel)
5. ✅ Added "not authenticated" message to StoveSyncPanel if !user

Pattern now consistent across all protected pages:
- Check isLoading → show skeleton
- Check !user → redirect (page level) or show message (component level)
- Only render/fetch after user is verified

verification:
✅ Created comprehensive test suite for ThermostatSettingsPage - 5/5 tests passing
  - Verifies skeleton shown during auth loading
  - Verifies redirect to login when not authenticated
  - Verifies content renders when authenticated
  - Verifies no API calls made during auth loading
  - Verifies proper auth state transitions

✅ Updated StoveSyncPanel tests - 10/10 tests passing
  - Verifies auth loading state handled correctly
  - Verifies "not authenticated" message shown when no user
  - Verifies no config fetch until user authenticated
  - All existing tests continue to pass

✅ Manual verification logic:
  - Race condition mechanism: Auth0 useUser hook takes time to verify session (especially on slow connections)
  - Before fix: Components mounted immediately and made API calls before auth verified
  - After fix: Components wait for isLoading=false before rendering/fetching
  - Pattern consistent across all protected pages and components

Fix successfully prevents race condition by blocking component mount and API calls until auth state is resolved.

files_changed:
  - app/settings/thermostat/page.tsx (auth checks added)
  - app/components/netatmo/StoveSyncPanel.tsx (auth checks added, loading state fix)
  - __tests__/app/settings/thermostat/page.test.tsx (new test file)
  - __tests__/components/StoveSyncPanel.test.tsx (updated with auth tests)
