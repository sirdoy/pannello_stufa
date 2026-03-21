# Phase 109: Cleanup - Research

**Researched:** 2026-03-21
**Domain:** Dead code deletion — legacy Hue CLIP v2 local client, remote/cloud API, OAuth, bridge discovery/pairing, env vars
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Delete all files explicitly listed in CLEAN-01 through CLEAN-07
- Also delete routes that only exist to serve legacy flows: discover, pair, disconnect, remote/*, callback, test
- Delete associated test files for deleted modules (hueApiScenes.test.ts, hueRemoteTokenHelper.test.ts, hueLocalHelper.test.ts, discover/__tests__)
- Delete the disabled callback route (app/api/hue/callback/route.js.disabled)
- Delete all import references to deleted modules in remaining files
- Verify scheduler/check/route.ts no longer needs hueApi/hueConnectionStrategy imports (should already use proxy)
- Verify scenes/[id]/activate/route.ts and scenes/create/route.ts and scenes/[id]/route.ts — if these use hueApi, they must be deleted or migrated
- app/lights/page.tsx env var references must be removed
- Remove HUE_CLIENT_SECRET, NEXT_PUBLIC_HUE_CLIENT_ID, NEXT_PUBLIC_HUE_APP_ID from .env.example
- Remove any references in app/lights/page.tsx or other files
- Update docs/setup/hue-setup.md to remove bridge pairing/OAuth setup instructions; replace with proxy-based setup instructions (just needs HA_BASE_URL + HA_API_KEY)
- Update docs/api/hue.md if it references legacy endpoints

### Claude's Discretion
- Order of file deletion (single sweep vs grouped by module)
- Whether to update CHANGELOG.md inline or leave for version bump
- How to handle any unexpected import chains discovered during deletion

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLEAN-01 | CLIP v2 local API client deleted (hueApi.ts) | File confirmed at lib/hue/hueApi.ts — only used by scenes/create, scenes/[id], test/route.ts (all being deleted) |
| CLEAN-02 | v1 remote/cloud API client deleted (hueRemoteApi.ts) | File confirmed at lib/hue/hueRemoteApi.ts — no surviving imports outside its own test file and deleted modules |
| CLEAN-03 | Connection strategy deleted (hueConnectionStrategy.ts) | File confirmed at lib/hue/hueConnectionStrategy.ts — only surviving import is scenes/[id]/activate/route.ts (being deleted) |
| CLEAN-04 | Bridge discovery and pairing routes deleted | All 9 route files confirmed under app/api/hue/{discover,pair,disconnect,remote/*,callback,test} |
| CLEAN-05 | OAuth token management deleted (hueRemoteTokenHelper.ts) | File confirmed at lib/hue/hueRemoteTokenHelper.ts — only surviving import is scheduler/check/route.ts (proactiveTokenRefresh fire-and-forget, safe to remove) |
| CLEAN-06 | Firebase bridge credentials persistence deleted (hueLocalHelper.ts) | File confirmed at lib/hue/hueLocalHelper.ts — only surviving imports are scenes/create and scenes/[id] (both being deleted) |
| CLEAN-07 | Hue-specific env vars removed | .env.example has all 3 vars (lines 36-40); .env.local confirmed clean (no HUE_ vars present); app/lights/page.tsx line 575 has the only surviving NEXT_PUBLIC_HUE_CLIENT_ID reference |
</phase_requirements>

## Summary

Phase 109 is a pure deletion phase — no new code is written. The prior three phases (106-108) completed the full migration to the HomeAssistant proxy. This phase removes every file and import that belonged to the old direct-bridge approach: CLIP v2 local client, v1 remote client, connection strategy, OAuth token management, Firebase bridge credentials, bridge discovery/pairing routes, and three OAuth-scoped env vars.

The codebase analysis confirmed all CONTEXT.md targets exist exactly where documented. Several important discoveries were made during investigation: (1) The three scene CRUD routes (`scenes/create`, `scenes/[id]`, `scenes/[id]/activate`) all import from modules being deleted — they must be deleted, not migrated, since Scene CRUD is deferred (SCENE-01/02/03 are out of scope for this milestone). (2) The `app/lights/page.tsx` legacy page is a 1,222-line file that still calls discover/pair/disconnect/remote routes, but it cannot be fully deleted because it is linked from the command palette and LightsCard — only its env var reference at line 575 needs removal. (3) The `withHueHandler`, `hueNotConnected`, and `hueNotOnLocalNetwork` helpers in `lib/core/` are only used by the scene routes being deleted — once those routes are gone, these core helpers become dead code candidates, but cleaning them up is a discretionary call.

**Primary recommendation:** Delete all 22+ files/dirs in a single wave, then clean up three surviving files (scheduler/check/route.ts, app/lights/page.tsx, .env.example), then update docs. No new code required — every change is a deletion or line removal.

## Complete Deletion Inventory

### lib/hue/ — 5 files to delete (CLEAN-01, 02, 03, 05, 06)
| File | Requirement | Confirmed imports in |
|------|-------------|---------------------|
| `lib/hue/hueApi.ts` | CLEAN-01 | scenes/create, scenes/[id], test/route.ts (all deleted) |
| `lib/hue/hueRemoteApi.ts` | CLEAN-02 | remote/* routes (all deleted) |
| `lib/hue/hueConnectionStrategy.ts` | CLEAN-03 | scenes/[id]/activate (deleted) |
| `lib/hue/hueRemoteTokenHelper.ts` | CLEAN-05 | scheduler/check/route.ts line 43 (import to remove) |
| `lib/hue/hueLocalHelper.ts` | CLEAN-06 | scenes/create, scenes/[id] (both deleted) |

### lib/hue/__tests__/ — 3 test files to delete
| File | Covers (module being deleted) |
|------|-------------------------------|
| `lib/hue/__tests__/hueApiScenes.test.ts` | hueApi.ts |
| `lib/hue/__tests__/hueRemoteTokenHelper.test.ts` | hueRemoteTokenHelper.ts |
| `lib/hue/__tests__/hueLocalHelper.test.ts` | hueLocalHelper.ts |

Keep: `lib/hue/__tests__/colorUtils.test.ts` and `lib/hue/__tests__/hueProxy.test.ts` — these test surviving modules.

### app/api/hue/ — routes to delete (CLEAN-04)
| Path | Notes |
|------|-------|
| `app/api/hue/discover/` (dir + route.ts) | Includes `__tests__/route.test.ts` |
| `app/api/hue/pair/route.ts` | No test file |
| `app/api/hue/disconnect/route.ts` | No test file |
| `app/api/hue/remote/authorize/route.ts` | References NEXT_PUBLIC_HUE_CLIENT_ID env var |
| `app/api/hue/remote/callback/route.ts` | |
| `app/api/hue/remote/pair/route.ts` | |
| `app/api/hue/remote/disconnect/route.ts` | |
| `app/api/hue/callback/route.js.disabled` | Disabled file |
| `app/api/hue/test/route.ts` | No test file |

### app/api/hue/scenes/ — scene CRUD routes to delete (not CLEAN-04, but consequence of CLEAN-01/06)
| Path | Why deleted |
|------|------------|
| `app/api/hue/scenes/create/route.ts` | Imports hueApi.ts + hueLocalHelper.ts (both deleted); Scene CRUD is deferred |
| `app/api/hue/scenes/[id]/route.ts` | Imports hueApi.ts + hueLocalHelper.ts (both deleted); Scene CRUD is deferred |
| `app/api/hue/scenes/[id]/activate/route.ts` | Imports hueConnectionStrategy.ts (deleted); new proxy equivalent exists at groups/[groupId]/scenes/[sceneId]/route.ts |

No tests exist for scenes/create or scenes/[id] routes. No test cleanup needed for these.

Keep: `app/api/hue/scenes/route.ts` (GET endpoint — already uses hueProxy.ts) and its `__tests__/route.test.ts`.

## Surviving Files That Need Edits (Not Deletions)

### 1. `app/api/scheduler/check/route.ts`
**Change:** Remove line 43 (`import { proactiveTokenRefresh } from '@/lib/hue/hueRemoteTokenHelper';`) and lines 850-855 (the fire-and-forget `proactiveTokenRefresh()` call with its comment block).
**Risk:** LOW — the call is fire-and-forget with a .catch() guard. Removing it eliminates a no-op OAuth refresh that was for a now-deleted capability.

### 2. `app/api/scheduler/check/__tests__/route.test.ts`
**Change:** Remove `jest.mock('@/lib/hue/hueRemoteTokenHelper')` (line 34), `import { proactiveTokenRefresh }` (line 73), `const mockProactiveTokenRefresh = jest.mocked(proactiveTokenRefresh)` (line 96), and the test block at line 616 (`calls proactiveTokenRefresh as fire-and-forget`).

### 3. `app/lights/page.tsx`
**Change:** Remove line 575 only (`const remoteApiAvailable = !!process.env.NEXT_PUBLIC_HUE_CLIENT_ID;`). The page itself must remain — it is linked from the command palette (`/lights`) and from LightsCard. The pairing/discovery UI inside the page will be dead code once the backing routes are deleted, but removing the whole page is out of scope for this phase.
**Note:** The `if (!connected || needsRemotePairing)` branch at line 574 uses `remoteApiAvailable` to conditionally show remote API UI. With the routes deleted, this branch renders a connection-failure state anyway. Safe to leave the broader pairing-state UI logic in place — it just won't function.

### 4. `.env.example`
**Change:** Remove lines 36-40 (comment + 3 Hue OAuth env var entries). `.env.local` confirmed clean — no changes needed there.

## Documentation Updates

### `docs/setup/hue-setup.md`
**Current state:** Full guide for CLIP v2 local API + Remote API OAuth + HueConnectionStrategy hybrid mode. References bridge pairing, OAuth developer account setup, and the `HUE_CLIENT_SECRET`/`NEXT_PUBLIC_HUE_CLIENT_ID`/`NEXT_PUBLIC_HUE_APP_ID` vars.
**Required:** Rewrite as a "proxy-based setup" guide. All that is needed is:
- `HA_BASE_URL` pointing to the HomeAssistant proxy
- `HA_API_KEY` for authentication
No bridge discovery, no pairing button press, no OAuth developer registration required.

### `docs/api/hue.md`
**Current state:** Already documents the new proxy API endpoints correctly (10 endpoints via HA proxy). Has a "Bridge Setup Guide" section at line 1013 that references a "30-second pairing window" and "Bridge LED pulses during pairing" — these are remnant bridge-direct pairing notes.
**Required:** Remove or replace the Bridge Setup Guide section. The proxy handles bridge connectivity; the frontend setup only needs env vars.

## Architecture Patterns

### What survives after cleanup
```
lib/hue/
├── hueProxy.ts         # The replacement — haGet/haPost transport
├── colorUtils.ts       # Color conversion utilities (no legacy deps)
└── __tests__/
    ├── hueProxy.test.ts
    └── colorUtils.test.ts

app/api/hue/
├── lights/             # GET /lights (uses hueProxy)
├── lights/[id]/        # GET + PUT /lights/[id] (uses hueProxy)
├── rooms/              # GET /rooms (uses hueProxy)
├── rooms/[id]/         # GET + PUT /rooms/[id] (uses hueProxy)
├── scenes/             # GET /scenes (uses hueProxy)
├── groups/[groupId]/scenes/[sceneId]/  # POST activate (uses hueProxy)
├── status/             # GET /status (uses hueProxy)
└── history/            # GET /history (uses hueProxy)
```

### lib/core/ helpers — discretionary cleanup
`withHueHandler`, `hueNotConnected`, and `hueNotOnLocalNetwork` in `lib/core/` will have no callers after this phase (all callers are in the deleted scene routes). They are effectively dead code. Cleaning them up involves edits to `lib/core/middleware.ts`, `lib/core/apiErrors.ts`, `lib/core/apiResponse.ts`, `lib/core/index.ts`, and two test files. **This is Claude's discretion** — include in plan if it can be done safely, defer if scope feels too broad. Lean toward including: it's all line removals in well-understood files.

### Deletion order recommendation
1. Delete all `lib/hue/` legacy modules and their tests first (establishes the scope)
2. Delete all legacy route directories (discover, pair, disconnect, remote/*, callback, test)
3. Delete scene CRUD routes (scenes/create, scenes/[id], scenes/[id]/activate)
4. Edit surviving files (scheduler, lights/page.tsx, .env.example)
5. Update documentation (hue-setup.md, docs/api/hue.md)
6. Optionally clean lib/core/ Hue helpers

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verifying no orphan imports after deletion | Custom grep script | TypeScript compiler (`tsc --noEmit`) | tsc will catch any remaining import references to deleted modules; no manual audit needed |
| Env var removal verification | String search | tsc + grep search after edit | Double-verification: tsc catches import-level issues, grep catches string-literal env var refs |

**Key insight:** This phase is deletion-only. The TypeScript compiler is the natural validation tool — after deletions, `tsc --noEmit` will fail if any surviving file still imports a deleted module.

## Common Pitfalls

### Pitfall 1: Deleting a route that is still the backing endpoint for a page
**What goes wrong:** Deleting `scenes/create/route.ts` without knowing `app/lights/scenes/page.tsx` calls `/api/hue/scenes/create` — the page becomes a runtime error, not a compile error.
**Why it happens:** Frontend pages call routes via `fetch()` strings, which tsc cannot trace.
**How to avoid:** Research has identified `app/lights/scenes/page.tsx` as calling `/api/hue/scenes/create`, `/api/hue/scenes/${sceneId}` (PUT+DELETE), and `/api/hue/scenes/${sceneId}/activate` (PUT). This page will lose CRUD functionality but remains navigable (scene listing via GET /scenes still works). The old activate endpoint (`PUT /scenes/[id]/activate`) is already superseded by the new group-scoped route — LightsCard uses the new path.
**Warning signs:** Runtime 404 on POST to /api/hue/scenes/create or PUT to /api/hue/scenes/[id].

### Pitfall 2: Leaving a jest.mock() for a deleted module
**What goes wrong:** `scheduler/check/__tests__/route.test.ts` has `jest.mock('@/lib/hue/hueRemoteTokenHelper')` — if the module is deleted but the mock stays, Jest will warn about mocking a non-existent module.
**Why it happens:** Mock cleanup is easy to miss during deletion.
**How to avoid:** Research has mapped the exact lines to remove in the test file (lines 34, 73, 96, and the test block at 616).

### Pitfall 3: Assuming .env.local needs editing
**What goes wrong:** Planning task to "remove env vars from .env.local" when the file doesn't contain them.
**Reality:** `.env.local` has no `HUE_` variables — confirmed by grep. The CONTEXT.md mentions `.env.local` as a target, but the actual change needed is only in `.env.example` (lines 36-40).

### Pitfall 4: Forgetting the disabled file extension
**What goes wrong:** `app/api/hue/callback/route.js.disabled` — the `.disabled` extension means it won't be caught by TypeScript glob patterns.
**How to avoid:** Delete it explicitly by name, not as part of a directory pattern.

### Pitfall 5: lib/core Hue helpers becoming silent dead code
**What goes wrong:** `withHueHandler`, `hueNotConnected`, `hueNotOnLocalNetwork` remain exported and tested even though no routes use them — misleads future developers.
**How to avoid:** Remove from `middleware.ts`, `apiErrors.ts`, `apiResponse.ts`, `index.ts`, and update `__tests__/apiErrors.test.ts` and `__tests__/apiResponse.test.ts`. This is discretionary but recommended.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.x |
| Config file | jest.config.js |
| Quick run command | `npm test -- --testPathPattern="lib/hue|scheduler/check"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLEAN-01 | hueApi.ts deleted, no surviving imports | compile | `npx tsc --noEmit` | N/A — compiler check |
| CLEAN-02 | hueRemoteApi.ts deleted, no surviving imports | compile | `npx tsc --noEmit` | N/A — compiler check |
| CLEAN-03 | hueConnectionStrategy.ts deleted, no surviving imports | compile | `npx tsc --noEmit` | N/A — compiler check |
| CLEAN-04 | Bridge routes deleted | manual/smoke | `npm test -- --testPathPattern="hue"` | ✅ existing Hue tests still pass |
| CLEAN-05 | hueRemoteTokenHelper.ts deleted, scheduler import removed | unit | `npm test -- --testPathPattern="scheduler/check"` | ✅ `app/api/scheduler/check/__tests__/route.test.ts` |
| CLEAN-06 | hueLocalHelper.ts deleted, no surviving imports | compile | `npx tsc --noEmit` | N/A — compiler check |
| CLEAN-07 | Env vars removed from .env.example, page.tsx ref gone | grep/compile | `grep -r "HUE_CLIENT_SECRET\|HUE_CLIENT_ID\|HUE_APP_ID" app lib --include="*.ts" --include="*.tsx"` | N/A — grep check |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="lib/hue|scheduler/check"` (targeted)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. No new test files needed (this phase deletes tests, not adds them).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CLIP v2 local bridge client (hueApi.ts) | HA proxy (hueProxy.ts + haGet/haPost) | Phase 106 | All Hue reads go through proxy |
| HueConnectionStrategy (local/remote fallback) | Proxy handles connectivity | Phase 106 | No connection mode concept |
| OAuth token management (hueRemoteTokenHelper.ts) | HA API Key auth (X-API-Key header) | Phase 106 | No OAuth flow needed |
| Firebase bridge credentials (hueLocalHelper.ts) | Env vars HA_BASE_URL + HA_API_KEY | Phase 106 | Credentials in env, not Firebase |
| Bridge discovery/pairing routes | Proxy eliminates bridge discovery | Phase 106 | No pairing flow |

**Deprecated/outdated:**
- `HueConnectionStrategy`: Replaced by direct proxy calls; the "automatic local/remote fallback" concept is obsolete since the proxy handles bridge connectivity on the HA side.
- `proactiveTokenRefresh` in scheduler: Was refreshing OAuth tokens for the remote Hue cloud API. With proxy architecture, no OAuth tokens exist on the Next.js side.
- `withHueHandler` middleware: Was catching `HUE_NOT_CONNECTED` and `NETWORK_TIMEOUT` errors from the old clients. The proxy uses standard HTTP error codes (503 for unreachable bridge) which `withAuthAndErrorHandler` already handles.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection (Read tool, Bash grep) — all file paths, line numbers, and import chains verified against actual source files
- `.planning/phases/109-cleanup/109-CONTEXT.md` — locked decisions and explicit deletion targets

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — CLEAN-01 through CLEAN-07 requirement definitions
- Previous phase memory in MEMORY.md — confirms proxy architecture decisions from Phases 106-108

## Metadata

**Confidence breakdown:**
- Deletion inventory: HIGH — every file verified by direct inspection
- Import chains: HIGH — grep confirmed all surviving importers of each deleted module
- Pitfalls: HIGH — discovered by actual code inspection, not assumption
- lib/core dead code: MEDIUM — identified as dead after deletion, discretionary whether to include in this phase

**Research date:** 2026-03-21
**Valid until:** 2026-04-20 (stable codebase, no fast-moving dependencies)
