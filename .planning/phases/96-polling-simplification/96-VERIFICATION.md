---
phase: 96-polling-simplification
verified: 2026-03-18T00:00:00Z
status: passed
score: 11/11 must-haves verified
---

# Phase 96: Polling Simplification Verification Report

**Phase Goal:** All device polling runs through useAdaptivePolling at 60s intervals, with the Firebase RTDB real-time listener and sync-external-state removed from the stove hook
**Verified:** 2026-03-18
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | useStoveData polls at 60s via useAdaptivePolling with alwaysActive:true | VERIFIED | Line 253-258: `useAdaptivePolling({ callback: fetchStatusAndUpdate, interval: 60000, alwaysActive: true, immediate: true })` |
| 2 | No Firebase RTDB imports exist in useStoveData | VERIFIED | No `firebase/database` or `lib/firebase` imports found in useStoveData.ts or anywhere in stove component tree |
| 3 | No sync-external-state call exists anywhere in the codebase | VERIFIED | `grep -rn "sync-external-state" app/ __tests__/` returns zero results |
| 4 | sync-external-state API route file does not exist | VERIFIED | `ls app/api/stove/sync-external-state/` fails — directory absent |
| 5 | StoveCard and StoveBanners compile without errors after isFirebaseConnected removal | VERIFIED | isFirebaseConnected absent from StoveBanners.tsx, StoveCard.tsx, StovePageBanners.tsx, app/stove/page.tsx, and all test files |
| 6 | Stove staleness threshold is 90s when on, 180s when off | VERIFIED | Lines 138-139: `const stoveStalenessThreshold = isAccesa ? 90000 : 180000; const staleness = useDeviceStaleness('stove', stoveStalenessThreshold)` |
| 7 | ThermostatCard polls at 60s instead of 30s | VERIFIED | Line 109: `interval: topology ? 60000 : null` |
| 8 | LightsCard polls at 60s instead of 30s | VERIFIED | Line 235: `interval: connected ? 60000 : null` |
| 9 | NetworkCard polls at 60s visible / 5min hidden instead of 30s/5min | VERIFIED | Line 94: `const interval = isVisible ? 60000 : 300000` |
| 10 | RaspiCard and RaspiFullData poll at 60s visible / 5min hidden instead of 30s/5min | VERIFIED | useRaspiData.ts line 46 and useRaspiFullData.ts line 42: `const interval = isVisible ? 60000 : 300000` |
| 11 | useDeviceStaleness checks every 60s instead of 5s | VERIFIED | Line 63: `const intervalId = setInterval(fetchStaleness, 60000)` |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/devices/stove/hooks/useStoveData.ts` | Stove data hook with useAdaptivePolling | VERIFIED | Contains `import { useAdaptivePolling }`, `useAdaptivePolling({ interval: 60000, alwaysActive: true })`, no Firebase imports |
| `app/api/stove/sync-external-state/route.ts` | DELETED | VERIFIED | File and directory absent from filesystem |
| `__tests__/components/devices/stove/hooks/useStoveData.test.ts` | Updated test without Firebase mocks | VERIFIED | Has `jest.mock('@/lib/hooks/useAdaptivePolling', ...)`, no `firebase/database` mock |
| `lib/pwa/stalenessDetector.ts` | getDeviceStaleness with optional thresholdMs | VERIFIED | Signature: `getDeviceStaleness(deviceId: string, thresholdMs?: number)`, uses `thresholdMs ?? STALENESS_THRESHOLD` |
| `lib/hooks/useDeviceStaleness.ts` | useDeviceStaleness with optional thresholdMs | VERIFIED | Signature: `useDeviceStaleness(deviceId: string, thresholdMs?: number)`, threads to `getDeviceStaleness`, `setInterval(fetchStaleness, 60000)` |
| `app/components/devices/thermostat/ThermostatCard.tsx` | Thermostat polling at 60s | VERIFIED | `interval: topology ? 60000 : null`, `initialDelay: 50` preserved |
| `app/components/devices/lights/hooks/useLightsData.ts` | Lights polling at 60s | VERIFIED | `interval: connected ? 60000 : null`, `initialDelay: 100` preserved |
| `app/components/devices/network/hooks/useNetworkData.ts` | Network polling at 60s/5min | VERIFIED | `isVisible ? 60000 : 300000`, SPARKLINE comment updated to "2h at 60s" |
| `app/components/devices/raspi/hooks/useRaspiData.ts` | Raspi card polling at 60s/5min | VERIFIED | `isVisible ? 60000 : 300000`, `initialDelay: 600` preserved |
| `app/components/devices/raspi/hooks/useRaspiFullData.ts` | Raspi full data polling at 60s/5min | VERIFIED | `isVisible ? 60000 : 300000`, `initialDelay: 600` preserved |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| useStoveData.ts | lib/hooks/useAdaptivePolling.ts | `import { useAdaptivePolling }` + call | WIRED | Import on line 23, call on lines 253-258 with correct options |
| StoveCard.tsx | useStoveData.ts | useStoveData hook call | WIRED | useStoveData imported and destructured in StoveCard |
| useStoveData.ts | lib/hooks/useDeviceStaleness.ts | useDeviceStaleness('stove', threshold) | WIRED | Lines 138-139, threshold is state-dependent (90000/180000) |
| ThermostatCard.tsx | lib/hooks/useAdaptivePolling.ts | `interval: topology ? 60000` | WIRED | Line 109 confirmed |
| useDeviceStaleness.ts | lib/pwa/stalenessDetector.ts | getDeviceStaleness call at 60s | WIRED | `setInterval(fetchStaleness, 60000)` on line 63, passes thresholdMs |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| POLL-01 | 96-01 | StoveCard usa useAdaptivePolling (60s) invece del polling loop custom | SATISFIED | useAdaptivePolling({interval: 60000, alwaysActive: true}) confirmed in useStoveData.ts |
| POLL-02 | 96-01 | Firebase RTDB real-time listener della stufa rimosso | SATISFIED | No firebase/database imports in stove hook or stove component tree |
| POLL-03 | 96-01 | sync-external-state call rimossa dal ciclo fetch stufa | SATISFIED | Route file deleted, zero references in app/ or __tests__/ |
| POLL-04 | 96-02 | ThermostatCard polling esteso a 60s (da 30s) | SATISFIED | `interval: topology ? 60000 : null` at line 109 |
| POLL-05 | 96-02 | LightsCard polling esteso a 60s (da 30s) | SATISFIED | `interval: connected ? 60000 : null` at line 235 |
| POLL-06 | 96-02 | NetworkCard polling esteso a 60s visible / 5min hidden (da 30s/5min) | SATISFIED | `isVisible ? 60000 : 300000` at line 94 |
| POLL-07 | 96-02 | RaspiCard polling esteso a 60s visible / 5min hidden (da 30s/5min) | SATISFIED | Both useRaspiData.ts and useRaspiFullData.ts use `isVisible ? 60000 : 300000` |
| POLL-08 | 96-02 | useDeviceStaleness polling rimosso o esteso a 60s (da 5s) | SATISFIED | `setInterval(fetchStaleness, 60000)` at line 63 |

All 8 requirements from POLL-01 through POLL-08 are accounted for across the two plans. No orphaned requirements detected.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/components/devices/lights/hooks/useLightsData.ts` | 5 | JSDoc comment says "30s interval" but actual interval is 60000ms | Info | Comment-only stale documentation; functional code is correct |

No blockers or warnings found. One informational item: the JSDoc header of useLightsData.ts still reads "Polling via useAdaptivePolling (30s interval)" while the actual polling interval at line 235 is correctly `60000`. This is cosmetic only — the code is correct.

### Human Verification Required

None. All behavioral truths are fully verifiable via static code analysis:
- Interval values are numeric literals in code
- Firebase imports are absent (grep-verified)
- Route file deletion is confirmed by filesystem check
- Consumer chain cleanup is grep-verified across all files

---

## Summary

Phase 96 achieved its goal completely. The two plans delivered:

**Plan 01 (Stove):** useStoveData was rewritten from a complex Firebase RTDB connection monitor + real-time listener + sandbox listeners + custom polling loop (~265 lines) to a single `useAdaptivePolling(60s, alwaysActive:true)` call. The sync-external-state API route was deleted. The entire `isFirebaseConnected`/`usePollingFallback` prop chain was removed from StoveBanners, StoveCard, StovePageBanners, and stove/page.tsx. Staleness thresholds became device-state-aware (90s when on, 180s when off) via an optional `thresholdMs` parameter threaded through `getDeviceStaleness` and `useDeviceStaleness`.

**Plan 02 (All Devices):** Five device hooks (thermostat, lights, network, raspi x2) had their visible polling intervals changed from 30s to 60s. `useDeviceStaleness` was changed from a 5s polling interval to 60s. All `initialDelay` stagger values were preserved. The SPARKLINE_MAX_POINTS comment was updated to reflect "2h at 60s".

Commits confirmed in git history: 71023c0, 5707677, 1e66a32, f1af301, 9d554b8.

---

_Verified: 2026-03-18_
_Verifier: Claude (gsd-verifier)_
