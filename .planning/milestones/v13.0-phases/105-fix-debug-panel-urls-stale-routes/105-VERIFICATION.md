---
phase: 105-fix-debug-panel-urls-stale-routes
verified: 2026-03-20T10:30:00Z
status: passed
score: 2/2 must-haves verified
re_verification: false
---

# Phase 105: Fix Debug Panel URLs and Stale Routes — Verification Report

**Phase Goal:** Debug panel POST operations work and no stale route references remain
**Verified:** 2026-03-20T10:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | StoveTab POST buttons hit actual Next.js routes (ignite, shutdown, setPower, setFan, setWaterTemperature) instead of 404ing | VERIFIED | Both StoveTab files contain `/api/stove/{ignite,shutdown,setPower,setFan,setWaterTemperature}` with 4 occurrences each; all 5 target route files confirmed on disk |
| 2 | lib/routes.ts contains no entries for deleted API routes (getRoomTemperature, getSettings, setSettings) | VERIFIED | grep for all 3 keys returns 0 matches in lib/routes.ts; STOVE_ROUTES has exactly 7 live entries |

**Score:** 2/2 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/debug/components/tabs/StoveTab.tsx` | Debug panel StoveTab with correct POST URLs containing `/api/stove/ignite` | VERIFIED | File exists, 257 lines, all 5 POST endpoints use correct Next.js routes; 4 occurrences each (url prop, onExecute callback, onCopyUrl, isCopied) |
| `app/debug/api/components/tabs/StoveTab.tsx` | API debug panel StoveTab with correct POST URLs containing `/api/stove/ignite` | VERIFIED | File exists, 257 lines, identical POST URL structure to main debug variant; only import path differs (relative vs absolute) |
| `lib/routes.ts` | Centralized route definitions without stale entries | VERIFIED | File exists, STOVE_ROUTES has exactly 7 entries: status, ignite, shutdown, getFan, getPower, setFan, setPower — no stale keys |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/debug/components/tabs/StoveTab.tsx` | `app/api/stove/ignite/route.ts` | fetch POST to `/api/stove/ignite` | WIRED | `/api/stove/ignite` present in url prop, callPostEndpoint call, onCopyUrl, isCopied; route file confirmed on disk |
| `app/debug/components/tabs/StoveTab.tsx` | `app/api/stove/setPower/route.ts` | fetch POST to `/api/stove/setPower` | WIRED | `/api/stove/setPower` present 4 times; route file confirmed on disk |

Additional route files confirmed on disk: `app/api/stove/shutdown/route.ts`, `app/api/stove/setFan/route.ts`, `app/api/stove/setWaterTemperature/route.ts` — all targeted by the corresponding PostEndpointCard elements.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DEBUG-01 | 105-01-PLAN.md | StoveTab updated with proxy endpoint URLs and response formats | SATISFIED | Both StoveTab files now use actual Next.js API routes; no HA proxy internal paths remain; REQUIREMENTS.md marks as `[x]` Complete at Phase 105 |
| CLEAN-04 | 105-01-PLAN.md | Dead API routes removed (getRoomTemperature, getActualWaterTemperature, getWaterSetTemperature, settings, setSettings) | SATISFIED | lib/routes.ts has 0 matches for getRoomTemperature, getSettings, setSettings; STOVE_ROUTES trimmed to 7 live entries; REQUIREMENTS.md marks as `[x]` Complete at Phase 105 |

No orphaned requirements: both IDs declared in PLAN frontmatter appear in REQUIREMENTS.md and are assigned to Phase 105 in the traceability table.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | — |

No anti-patterns detected in the three modified files. No TODOs, stubs, placeholder returns, or console-log-only handlers in the changed sections.

**Note on occurrence count:** The plan specified "3 occurrences per endpoint per file" but the actual files have 4 occurrences per endpoint. The 4th occurrence is the `isCopied={copiedUrl === '/api/stove/...'}` JSX prop, which is correct and intentional. The plan's count estimate was off by one; the implementation is correct.

---

### Human Verification Required

#### 1. POST Button Runtime Behavior

**Test:** Open `/debug` in the running app, navigate to Stove tab, click "Ignite Stove" button.
**Expected:** HTTP 200 (or structured error from HA proxy, not 404) response appears in the response pane.
**Why human:** Can only confirm non-404 at runtime; the route files exist and URLs match, but actual HA proxy reachability cannot be verified statically.

#### 2. API Debug Panel Consistency

**Test:** Open `/debug/api` in the running app, navigate to Stove tab, verify POST buttons behave identically to `/debug`.
**Expected:** Same 5 POST endpoints present, same URLs, non-404 responses.
**Why human:** UI rendering and cross-tab parity requires visual inspection.

---

### Gaps Summary

No gaps. All must-haves are verified:

- All 5 stale HA proxy internal URL patterns (`commands/ignit`, `commands/shutdown`, `settings/power`, `settings/fan-level`, `settings/temperature/water`) are absent from both StoveTab files.
- All 5 correct Next.js route URLs are present in both StoveTab files with full wiring (url prop + fetch call + clipboard copy + isCopied state).
- All 5 target route files exist on disk.
- All 3 stale STOVE_ROUTES entries (getRoomTemperature, getSettings, setSettings) are absent from lib/routes.ts.
- STOVE_ROUTES retains all 7 live entries.
- Both requirement IDs (DEBUG-01, CLEAN-04) are satisfied and marked Complete in REQUIREMENTS.md.
- Both commits (`afc12be`, `8fc7a9f`) verified present in git log.

---

_Verified: 2026-03-20T10:30:00Z_
_Verifier: Claude (gsd-verifier)_
