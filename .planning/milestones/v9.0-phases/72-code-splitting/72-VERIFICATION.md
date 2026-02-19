---
phase: 72-code-splitting
verified: 2026-02-18T17:45:00Z
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "Visit /network without analytics consent, open DevTools Network tab, filter to JS, navigate to /network — confirm no request for BandwidthCorrelationChart chunk"
    expected: "No chunk named after BandwidthCorrelationChart is fetched when consent is denied"
    why_human: "Cannot run the browser with DevTools; chunk request suppression requires runtime verification with consent state denied"
  - test: "Build the app (when permitted), load /network and /analytics at least once while online, then switch DevTools to offline, hard-refresh /network and / — confirm all six dashboard cards render and no ChunkLoadError appears"
    expected: "Dashboard cards (StoveCard, ThermostatCard, CameraCard, LightsCard, WeatherCardWrapper, NetworkCard) render from service worker cache; /network chart shows skeleton or cached render; no ChunkLoadError in console"
    why_human: "PWA offline behavior requires a build + service worker registration + cache warm-up cycle that cannot be verified statically"
---

# Phase 72: Code Splitting Verification Report

**Phase Goal:** Recharts chart code is deferred on the /network and /analytics sub-pages so it only downloads when a user actually visits those pages; the consent-gated correlation chart never downloads JS for users without analytics consent; the PWA offline shell continues to serve all six dashboard cards without ChunkLoadError after the build.
**Verified:** 2026-02-18T17:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                             | Status          | Evidence                                                                                        |
|----|---------------------------------------------------------------------------------------------------|-----------------|-------------------------------------------------------------------------------------------------|
| 1  | User visiting /network downloads Recharts chart code only after navigating to that page           | VERIFIED        | `app/network/page.tsx` lines 31-53: both BandwidthChart and BandwidthCorrelationChart use `dynamic(() => import(...), { ssr: false })`; no static imports of these components exist anywhere in `app/` |
| 2  | User visiting /analytics downloads chart code only after navigating to that page                  | VERIFIED        | `app/analytics/page.tsx` lines 19-53: UsageChart, ConsumptionChart, WeatherCorrelation all use `dynamic(() => import(...), { ssr: false })`; no static imports remain |
| 3  | User without analytics consent never triggers a network request for BandwidthCorrelationChart JS  | VERIFIED (code) | BandwidthCorrelationChart dynamic import at line 43-53; rendered only inside `{hasConsent && (...)}` at line 192; when `hasConsent === false` React never mounts the component → browser never requests the chunk. Human verification still needed to confirm at runtime. |
| 4  | All six dashboard cards render without ChunkLoadError when offline after code splitting changes    | VERIFIED (code) | `app/page.tsx` lines 3-9: all six cards (StoveCard, ThermostatCard, CameraCard, LightsCard, WeatherCardWrapper, NetworkCard) remain statically imported — unaffected by phase 72. `app/sw.ts` line 70-72: `StaleWhileRevalidate` rule caches all `request.destination === 'script'` chunks (covers newly split Recharts chunks after first online visit). Human verification needed to confirm no ChunkLoadError at runtime. |

**Score:** 4/4 truths verified by static analysis (2 require human runtime confirmation)

### Required Artifacts

| Artifact                      | Expected                                                        | Status     | Details                                                                                                             |
|-------------------------------|-----------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------------|
| `app/network/page.tsx`        | Dynamic imports for BandwidthChart and BandwidthCorrelationChart | VERIFIED   | Contains `dynamic(` at lines 31 and 43; `ssr: false` present; loading skeletons at 380px and 360px heights          |
| `app/analytics/page.tsx`      | Dynamic imports for UsageChart, ConsumptionChart, WeatherCorrelation | VERIFIED | Contains `dynamic(` at lines 19, 31, 43; `ssr: false` on all three; `Skeleton` imported from `@/app/components/ui` |

Both artifacts: EXISTS, SUBSTANTIVE (no stub patterns found, real dynamic import logic), WIRED (used in JSX render output).

### Key Link Verification

| From                        | To                                                      | Via                                          | Status     | Details                                                                                     |
|-----------------------------|---------------------------------------------------------|----------------------------------------------|------------|---------------------------------------------------------------------------------------------|
| `app/network/page.tsx`      | `./components/BandwidthChart`                           | `dynamic(() => import(...), { ssr: false })`  | WIRED      | Line 32: `() => import('./components/BandwidthChart')`; used at line 181                    |
| `app/network/page.tsx`      | `./components/BandwidthCorrelationChart`                | `dynamic(() => import(...), { ssr: false })`, gated by `hasConsent` | WIRED | Line 44: `() => import('./components/BandwidthCorrelationChart')`; used at line 194 inside `{hasConsent && (...)}` |
| `app/analytics/page.tsx`    | `@/app/components/analytics/UsageChart`                 | `dynamic(() => import(...), { ssr: false })`  | WIRED      | Line 20: `() => import('@/app/components/analytics/UsageChart')`; used at line 196          |
| `app/analytics/page.tsx`    | `@/app/components/analytics/ConsumptionChart`           | `dynamic(() => import(...), { ssr: false })`  | WIRED      | Line 32: `() => import('@/app/components/analytics/ConsumptionChart')`; used at line 202    |
| `app/analytics/page.tsx`    | `@/app/components/analytics/WeatherCorrelation`         | `dynamic(() => import(...), { ssr: false })`  | WIRED      | Line 44: `() => import('@/app/components/analytics/WeatherCorrelation')`; used at line 208  |

All five key links verified. The chart component target files exist and are substantive (200-220 lines each).

### Requirements Coverage

| Requirement | Source Plan | Description                                                              | Status    | Evidence                                                                                                     |
|-------------|-------------|--------------------------------------------------------------------------|-----------|--------------------------------------------------------------------------------------------------------------|
| SPLIT-01    | 72-01       | User on /network page downloads Recharts only when visiting that page    | SATISFIED | `BandwidthChart` and `BandwidthCorrelationChart` use `next/dynamic` with `ssr: false` in `app/network/page.tsx`; no static import remains |
| SPLIT-02    | 72-01       | User on /analytics page downloads chart code only when visiting that page | SATISFIED | `UsageChart`, `ConsumptionChart`, `WeatherCorrelation` use `next/dynamic` with `ssr: false` in `app/analytics/page.tsx`; no static import remains |
| SPLIT-03    | 72-01       | User without analytics consent never downloads consent-gated chart code  | SATISFIED (code) | `BandwidthCorrelationChart` dynamic import gated by `{hasConsent && (...)}` — component never mounts when consent denied; browser never requests the chunk |
| SPLIT-04    | 72-01       | User's PWA offline functionality remains intact after code splitting changes | SATISFIED (code) | Six dashboard cards on `app/page.tsx` are statically imported (unchanged); `app/sw.ts` `StaleWhileRevalidate` caches all script chunks; no service worker modifications in this phase |

All four SPLIT requirements claimed by plan 72-01 are accounted for. No orphaned requirements found (REQUIREMENTS.md maps only SPLIT-01 through SPLIT-04 to Phase 72).

### Anti-Patterns Found

| File                        | Line | Pattern                                        | Severity | Impact                                                                                                          |
|-----------------------------|------|------------------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------|
| `app/network/page.tsx`      | 54   | Static `import` declaration after `const` dynamic declarations | Info     | `import { STOVE_ROUTES }` and `import type { DeviceCategory }` appear after the dynamic const blocks (lines 31-53). JS imports are hoisted so there is no runtime issue. No ESLint import-order rule configured. Cosmetic only. |

No stub patterns (empty returns, placeholder text, TODO markers) found in either modified file.

### Human Verification Required

#### 1. Consent-Gated Chunk Non-Fetch (SPLIT-03)

**Test:** Open the app in a browser with analytics consent explicitly denied. Open DevTools Network tab filtered to JS files. Navigate to `/network`. Observe network requests.
**Expected:** No network request for a JS chunk matching `BandwidthCorrelationChart` (or the Recharts chunk it pulls). BandwidthChart chunk IS fetched (correct — it is not consent-gated).
**Why human:** Chunk request suppression depends on React not mounting the dynamic component, which requires a live browser environment. Cannot be verified statically.

#### 2. PWA Offline Dashboard Integrity (SPLIT-04)

**Test:** Build the app. Navigate to `/network` and `/analytics` at least once while online (to warm the service worker cache for split chunks). Switch DevTools Network to Offline mode. Hard-refresh `/` (the main dashboard).
**Expected:** All six dashboard cards (Stove, Thermostat, Camera, Lights, Weather, Network) render from cache. No `ChunkLoadError` appears in the browser console.
**Why human:** PWA offline behavior requires a production build, service worker registration, and cache warm-up cycle. Cannot be verified without running `npm run build` (blocked by project rules) and a browser environment.

### Gaps Summary

No functional gaps identified. All five dynamic imports are in place, all are wired to their target components, and the consent gate for SPLIT-03 is correctly preserved. The two human verification items are runtime confirmations of code paths that are correctly implemented statically — they are not gaps, but behavioral guarantees that require browser execution to confirm.

The import ordering cosmetic issue in `app/network/page.tsx` (static import at line 54 appearing after dynamic const blocks) does not affect correctness and is flagged for awareness only.

---

_Verified: 2026-02-18T17:45:00Z_
_Verifier: Claude (gsd-verifier)_
