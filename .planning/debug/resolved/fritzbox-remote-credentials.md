---
status: resolved
trigger: "When accessing the app remotely, Fritz!Box network data doesn't show and the app says to configure Fritz!Box. Locally everything works fine. The credentials need to be shared across devices - save them to Firebase."
created: 2026-02-17T00:00:00Z
updated: 2026-02-17T00:05:00Z
---

## Current Focus

hypothesis: RESOLVED
test: N/A
expecting: N/A
next_action: N/A

## Symptoms

expected: When accessing remotely, I should see the same Fritz!Box network data as when accessing locally
actual: Remotely the app shows "configure Fritz!Box" message, no network data. Locally everything works correctly.
errors: No error messages - just the "configure Fritz!Box" prompt as if no credentials are saved
reproduction: Access the app from a different device/remotely - Fritz!Box data is missing
started: Design limitation - Fritz!Box credentials are stored locally and not shared across devices

## Eliminated

- hypothesis: Credentials stored in browser localStorage
  evidence: fritzboxClient.ts reads from process.env (server-side), not localStorage
  timestamp: 2026-02-17T00:00:30Z

- hypothesis: Fritz!Box client uses direct Fritz!Box API
  evidence: Client connects to HOMEASSISTANT_API_URL (a HomeAssistant proxy API), not directly to Fritz!Box
  timestamp: 2026-02-17T00:00:30Z

## Evidence

- timestamp: 2026-02-17T00:00:15Z
  checked: lib/fritzbox/fritzboxClient.ts
  found: "const API_URL = process.env.HOMEASSISTANT_API_URL; const API_USER = process.env.HOMEASSISTANT_USER; const API_PASSWORD = process.env.HOMEASSISTANT_PASSWORD;" - credentials read from env vars at module scope
  implication: If env vars not set on the server, FRITZBOX_NOT_CONFIGURED is thrown

- timestamp: 2026-02-17T00:00:20Z
  checked: app/components/devices/network/NetworkCard.tsx
  found: "if (networkData.error?.type === 'setup') { return <Banner title='Configura Fritz!Box'>" - setup error shows configure banner
  implication: The "configure Fritz!Box" message is shown when API returns FRITZBOX_NOT_CONFIGURED

- timestamp: 2026-02-17T00:00:25Z
  checked: app/components/devices/network/hooks/useNetworkData.ts
  found: "if (errorData.code === 'FRITZBOX_NOT_CONFIGURED') { setError({ type: 'setup' })" - maps API error to UI state
  implication: API error code drives the UI configure prompt

- timestamp: 2026-02-17T00:00:30Z
  checked: app/api/config/location/route.ts + lib/firebaseAdmin.ts + lib/environmentHelper.ts
  found: Config pattern uses adminDbGet/adminDbSet with getEnvironmentPath() - stores config in Firebase RTDB at 'config/...' (prod) or 'dev/config/...' (dev)
  implication: Exact same pattern can be applied to Fritz!Box credentials storage in Firebase

## Resolution

root_cause: Fritz!Box credentials (API URL, username, password) are hardcoded in server environment variables (HOMEASSISTANT_API_URL, HOMEASSISTANT_USER, HOMEASSISTANT_PASSWORD). These env vars are device/server-specific and not shared across remote access. When accessed remotely without these env vars set, the app throws FRITZBOX_NOT_CONFIGURED.

fix: |
  1. Created /app/api/config/fritzbox/route.ts - GET/POST/DELETE API to store/retrieve credentials from Firebase RTDB at config/fritzbox
  2. Modified lib/fritzbox/fritzboxClient.ts - resolveCredentials() reads from Firebase RTDB first (shared), falls back to env vars
  3. Added FritzBoxContent component to app/settings/page.tsx - new "Rete" tab with URL/user/password form
  4. Updated NetworkCard.tsx - "Configura Fritz!Box" banner now links to /settings?tab=rete

verification: |
  - 0 TypeScript errors in source files
  - All 102 Fritz!Box-related tests pass (13 test suites)
  - 19 new tests for the /api/config/fritzbox route pass
  - 12 existing fritzboxClient tests pass (no regression)

files_changed:
  - lib/fritzbox/fritzboxClient.ts (add resolveCredentials() with Firebase-first, env var fallback + invalidateFritzBoxCredentialCache export)
  - app/api/config/fritzbox/route.ts (NEW - GET/POST/DELETE credential management API)
  - app/api/config/fritzbox/__tests__/route.test.ts (NEW - 19 tests for the new API)
  - app/settings/page.tsx (add FritzBoxContent component + "Rete" tab)
  - app/components/devices/network/NetworkCard.tsx (link configure banner to settings)
