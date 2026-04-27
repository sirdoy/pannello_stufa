# Phase 166: Hue Frontend Cutover - Research

**Researched:** 2026-04-16
**Domain:** Next.js frontend URL migration — Philips Hue legacy → v1 API paths
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Create `app/api/v1/hue/lights/route.ts` (GET — list all lights) mirroring `app/api/hue/lights/route.ts` using `withAuthAndErrorHandler` + `getLights()`.
- **D-02:** Create `app/api/v1/hue/scenes/route.ts` (GET — list all scenes) mirroring `app/api/hue/scenes/route.ts` using `withAuthAndErrorHandler` + `getScenes()`, supporting optional `group_id` query param.
- **D-03:** Direct rewrite in hooks and pages — same mechanical pattern as thermorossi cutover (Phase 164).
- **D-04:** Path mapping (legacy → v1):
  - `/api/hue/status` → `/api/v1/hue/health`
  - `/api/hue/lights` → `/api/v1/hue/lights`
  - `/api/hue/lights/${id}` GET → `/api/v1/hue/lights/${id}`
  - `/api/hue/lights/${id}` PUT → `/api/v1/hue/lights/${id}/state`
  - `/api/hue/rooms` → `/api/v1/hue/groups`
  - `/api/hue/rooms/${id}` PUT → `/api/v1/hue/groups/${id}/action`
  - `/api/hue/scenes` → `/api/v1/hue/scenes`
  - `/api/hue/groups/${gid}/scenes/${sid}` POST → `/api/v1/hue/groups/${gid}/scenes/${sid}`
- **D-05:** No frontend changes needed for Firebase logging — v1 write routes already call `adminDbPush('log', ...)` server-side. Cutover inherits logging automatically.
- **D-06:** Hooks: `useLightsData.ts` (6 fetch calls), `useLightsCommands.ts` (4 execute calls)
- **D-07:** Pages: `app/lights/page.tsx` (3 fetch calls), `app/lights/scenes/page.tsx` (3 fetch calls)
- **D-08:** Scene modals: `CreateSceneModal.tsx` (1 call), `EditSceneModal.tsx` (1 call)
- **D-09:** Debug panels: both `HueTab.tsx` files (~15 URL refs each)
- **D-10:** Debug panel tests: both `__tests__/HueTab.test.tsx` (3 assertions each)
- **D-11:** Delete entire `app/api/hue/` directory tree after frontend cutover confirmed.
- **D-12:** `lights/page.tsx` PUT calls to `/api/hue/lights/${lightId}` must split to separate path `/api/v1/hue/lights/${lightId}/state`.

### Claude's Discretion
- Response shape alignment if v1 routes return slightly different JSON structure than legacy
- Test assertion updates for changed URLs
- Order of operations (create missing routes first, then rewrite frontend, then delete legacy)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HUE-01 | GET /api/v1/hue/health ritorna stato connettività bridge | Route already exists at `app/api/v1/hue/health/route.ts`; frontend must call this instead of `/api/hue/status` |
| HUE-02 | GET /api/v1/hue/lights/{light_id} ritorna stato singola luce | Route already exists at `app/api/v1/hue/lights/[lightId]/route.ts`; also requires NEW list route `/api/v1/hue/lights/route.ts` |
| HUE-03 | PUT /api/v1/hue/lights/{light_id}/state controlla singola luce | Route exists at `app/api/v1/hue/lights/[lightId]/state/route.ts` with adminDbPush; frontend must update PUT path |
| HUE-04 | GET /api/v1/hue/groups ritorna lista gruppi | Route exists at `app/api/v1/hue/groups/route.ts`; frontend must call this instead of `/api/hue/rooms` |
| HUE-05 | GET /api/v1/hue/groups/{group_id} ritorna stato singolo gruppo | Route exists at `app/api/v1/hue/groups/[groupId]/route.ts` |
| HUE-06 | POST /api/v1/hue/groups/{group_id}/scenes/{scene_id} attiva scena | Route exists at `app/api/v1/hue/groups/[groupId]/scenes/[sceneId]/route.ts` with adminDbPush; frontend already uses correct path pattern |
| HUE-07 | PUT /api/v1/hue/groups/{group_id}/action controlla luci del gruppo | Route exists at `app/api/v1/hue/groups/[groupId]/action/route.ts` with adminDbPush; frontend must update rooms→groups/action |
</phase_requirements>

---

## Summary

Phase 166 is a mechanical URL-migration phase. The v1 Hue API routes were created in Phase 159 (with adminDbPush logging already wired into all write routes), but the frontend — hooks, pages, scene modals, and debug panels — still calls the legacy `/api/hue/*` tree. This phase completes the cutover by: (1) creating two missing v1 list routes (`/lights` and `/scenes`), (2) rewriting all frontend URL strings, and (3) deleting the entire legacy `app/api/hue/` directory.

The critical implementation detail is the **path split** for light control: the legacy `PUT /api/hue/lights/${id}` handled both GET and PUT on the same route, but v1 separates reading (`GET /api/v1/hue/lights/${id}`) from writing (`PUT /api/v1/hue/lights/${id}/state`). All three PUT calls in `app/lights/page.tsx` must be updated to target the `/state` sub-path.

A secondary concern is **response shape alignment**. Legacy routes wrap results in `{ lights: [], groups: [], scenes: [] }` envelopes. The v1 groups route uses the same `{ groups: data }` shape. The two missing list routes (`lights` and `scenes`) must be created to match what the frontend hooks expect: `{ lights: data }` and `{ scenes: data }` respectively. The health/status response shape is identical — both call `getHealth()` and return the raw proxy response.

**Primary recommendation:** Create missing v1 list routes first (Wave 1, no dependencies). Then migrate frontend files (Wave 2, parallel). Then delete legacy tree (Wave 3, sequential after Wave 2). Update tests in each wave.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route creation (lights list, scenes list) | API / Backend (Next.js route) | — | Server-side proxy delegation to HA proxy |
| Frontend URL rewrite | Frontend (Client Components) | — | Hooks and pages run in browser, call Next.js routes |
| Firebase command logging | API / Backend (Next.js route) | — | Already server-side in v1 write routes — no frontend change |
| Legacy route deletion | API / Backend | — | Remove `app/api/hue/` tree from Next.js app router |

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | `app/api/v1/hue/*/route.ts` file-system routing | Project standard — all routes use this pattern |
| `@/lib/core` | internal | `withAuthAndErrorHandler`, `success`, `getPathParam`, `parseJson` | Project-standard route wrapper |
| `@/lib/hue/hueProxy` | internal | `getLights()`, `getScenes()`, `getGroups()`, `getHealth()` | Complete proxy layer — all functions already implemented |
| `useRetryableCommand` | internal | Retry + dedup for command hooks | Already used in `useLightsCommands` |

### New Routes Pattern (from existing v1 routes)
```typescript
// Source: app/api/v1/hue/groups/route.ts (verified)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getLights } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getLights();
  return success({ lights: data });
}, 'Hue/Lights');
```

---

## Architecture Patterns

### URL Migration Pattern

This phase follows the identical mechanical pattern used in Phase 164 (thermorossi cutover). Direct string replacement of URL literals in hooks, pages, modals, and debug panels.

```
Legacy                          →  V1
/api/hue/status                 →  /api/v1/hue/health
/api/hue/lights                 →  /api/v1/hue/lights
/api/hue/lights/${id} (GET)     →  /api/v1/hue/lights/${id}
/api/hue/lights/${id} (PUT)     →  /api/v1/hue/lights/${id}/state   ← PATH SPLIT
/api/hue/rooms                  →  /api/v1/hue/groups
/api/hue/rooms/${id} (PUT)      →  /api/v1/hue/groups/${id}/action
/api/hue/scenes                 →  /api/v1/hue/scenes
/api/hue/groups/${g}/scenes/${s}→  /api/v1/hue/groups/${g}/scenes/${s}  (same path)
```

### System Architecture Diagram (Data Flow)

```
[Browser Client]
      │
      │  fetch('/api/v1/hue/*')    ← after cutover
      ▼
[Next.js App Router — /api/v1/hue/]
  ├── GET  /lights           → getLights() proxy
  ├── GET  /lights/[id]      → getLights() + filter
  ├── PUT  /lights/[id]/state → setLightState() + adminDbPush('log')  ← Firebase logging
  ├── GET  /groups           → getGroups() proxy
  ├── GET  /groups/[id]      → getGroups() + filter
  ├── PUT  /groups/[id]/action → setGroupAction() + adminDbPush('log') ← Firebase logging
  ├── GET  /scenes           → getScenes() proxy
  ├── POST /groups/[g]/scenes/[s] → activateScene() + adminDbPush('log') ← Firebase logging
  └── GET  /health           → getHealth() proxy
      │
      ▼
[lib/hue/hueProxy.ts]  →  [HA Proxy (Raspberry Pi)] → [Hue Bridge]
```

### Recommended File Structure (changes only)

```
app/api/v1/hue/
├── lights/
│   ├── route.ts           ← CREATE (D-01)
│   └── [lightId]/
│       ├── route.ts       existing
│       └── state/route.ts existing
├── scenes/
│   └── route.ts           ← CREATE (D-02)
├── groups/route.ts        existing
├── health/route.ts        existing
└── ...rest existing

app/api/hue/               ← DELETE ENTIRE TREE (D-11)

app/components/devices/lights/hooks/
├── useLightsData.ts       ← REWRITE 6 URLs (D-06)
└── useLightsCommands.ts   ← REWRITE 4 URLs (D-06)

app/lights/
├── page.tsx               ← REWRITE 3 URLs + path split (D-07, D-12)
└── scenes/page.tsx        ← REWRITE 3 URLs (D-07)

app/components/lights/
├── CreateSceneModal.tsx   ← REWRITE 1 URL (D-08)
└── EditSceneModal.tsx     ← REWRITE 1 URL (D-08)

app/debug/components/tabs/HueTab.tsx            ← REWRITE ~15 URLs (D-09)
app/debug/api/components/tabs/HueTab.tsx        ← REWRITE ~15 URLs (D-09)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Proxy delegation in new list routes | Custom HTTP proxy code | `getLights()` / `getScenes()` from `hueProxy.ts` | Complete proxy layer already implemented |
| Auth in new routes | Custom auth check | `withAuthAndErrorHandler` wrapper | Project standard — all v1 routes use this |
| URL enumeration | Grep to find all URLs | The complete list is already compiled in this document | Risk of missing one — use verified list below |

**Key insight:** All proxy functions and auth wrappers are already implemented. The new list routes are 5-line files. The frontend work is mechanical string replacement with one structural change (PUT path split for per-light control).

---

## Complete URL Inventory (Verified)

[VERIFIED: codebase grep 2026-04-16]

### useLightsData.ts — 6 legacy URLs
| Line | Legacy | V1 Replacement |
|------|--------|----------------|
| 136 | `fetch('/api/hue/status')` | `fetch('/api/v1/hue/health')` |
| 160 | `fetch('/api/hue/scenes')` | `fetch('/api/v1/hue/scenes')` |
| 216 | `fetch('/api/hue/rooms')` | `fetch('/api/v1/hue/groups')` |
| 217 | `fetch('/api/hue/lights')` | `fetch('/api/v1/hue/lights')` |
| 218 | `fetch('/api/hue/scenes')` | `fetch('/api/v1/hue/scenes')` |
| JSDoc comment (line 7) | `/api/hue/status` | `/api/v1/hue/health` |

### useLightsCommands.ts — 4 legacy execute calls
| Line | Legacy | V1 Replacement |
|------|--------|----------------|
| 85 | `hueRoomCmd.execute('/api/hue/rooms/${groupId}', {method:'PUT',...})` | `/api/v1/hue/groups/${groupId}/action` |
| 121 | `hueRoomCmd.execute('/api/hue/rooms/${groupId}', {method:'PUT',...})` | `/api/v1/hue/groups/${groupId}/action` |
| 155 | `hueSceneCmd.execute('/api/hue/groups/${groupId}/scenes/${sceneId}', ...)` | `/api/v1/hue/groups/${groupId}/scenes/${sceneId}` (same path, prefix only) |
| 188 | `hueRoomCmd.execute('/api/hue/rooms/${group.group_id}', ...)` | `/api/v1/hue/groups/${group.group_id}/action` |

### app/lights/page.tsx — 3 fetch calls (all PUT, all need path split)
| Line | Legacy | V1 Replacement | Note |
|------|--------|----------------|------|
| 26 | `fetch('/api/hue/lights/${lightId}', {method:'PUT',...})` | `fetch('/api/v1/hue/lights/${lightId}/state', {method:'PUT',...})` | PATH SPLIT |
| 42 | `fetch('/api/hue/lights/${lightId}', {method:'PUT',...})` | `fetch('/api/v1/hue/lights/${lightId}/state', {method:'PUT',...})` | PATH SPLIT |
| 58 | `fetch('/api/hue/lights/${lightId}', {method:'PUT',...})` | `fetch('/api/v1/hue/lights/${lightId}/state', {method:'PUT',...})` | PATH SPLIT |

### app/lights/scenes/page.tsx — 3 fetch calls
| Line | Legacy | V1 Replacement |
|------|--------|----------------|
| 63 | `fetch('/api/hue/scenes')` | `fetch('/api/v1/hue/scenes')` |
| 64 | `fetch('/api/hue/rooms')` | `fetch('/api/v1/hue/groups')` |
| 90 | `fetch('/api/hue/status')` | `fetch('/api/v1/hue/health')` |

### CreateSceneModal.tsx — 1 fetch call
| Line | Legacy | V1 Replacement |
|------|--------|----------------|
| 90 | `fetch('/api/hue/lights')` | `fetch('/api/v1/hue/lights')` |

### EditSceneModal.tsx — 1 fetch call
| Line | Legacy | V1 Replacement |
|------|--------|----------------|
| 94 | `fetch('/api/hue/lights')` | `fetch('/api/v1/hue/lights')` |

### Both HueTab.tsx files (debug/components/tabs and debug/api/components/tabs) — ~15 refs each
| Legacy Pattern | V1 Replacement |
|----------------|----------------|
| `/api/hue/status` (4 refs) | `/api/v1/hue/health` |
| `/api/hue/lights` (4 refs) | `/api/v1/hue/lights` |
| `/api/hue/rooms` (4 refs) | `/api/v1/hue/groups` |
| `/api/hue/scenes` (4 refs) | `/api/v1/hue/scenes` |
| `/api/hue/lights/${values.lightId}` PUT | `/api/v1/hue/lights/${values.lightId}/state` |
| `/api/hue/rooms/${values.roomId}` PUT | `/api/v1/hue/groups/${values.roomId}/action` |
| `/api/hue/groups/${values.groupId}/scenes/${values.sceneId}` POST | `/api/v1/hue/groups/${values.groupId}/scenes/${values.sceneId}` |
| url labels `"api/hue/lights/[id]"` | `"api/v1/hue/lights/[id]/state"` |
| url label `"api/hue/rooms/[id]"` | `"api/v1/hue/groups/[id]/action"` |

### app/registry/devices/page.tsx — 1 fetch call (ADDITIONAL, not in D-09)
| Line | Legacy | V1 Replacement |
|------|--------|----------------|
| 149 | `fetch('/api/hue/lights')` | `fetch('/api/v1/hue/lights')` |

> **Important:** The CONTEXT.md's D-09 list does not mention `app/registry/devices/page.tsx` but it contains `/api/hue/lights` at line 149. The planner must include this file in the rewrite wave. Failing to update it will cause a 404 after legacy route deletion.

---

## Response Shape Analysis (Verified)

[VERIFIED: codebase grep 2026-04-16]

### Health / Status — Shapes are IDENTICAL
- Legacy `GET /api/hue/status/route.ts` calls `getHealth()`, returns `success(data)` → `{ success: true, ...healthFields }`
- V1 `GET /api/v1/hue/health/route.ts` calls `getHealth()`, returns `success(data)` — same wrapper

`useLightsData.checkConnection()` reads `health.connected` and `health.data_freshness` — both fields are present in the `HueBridgeHealth` shape returned by `getHealth()`. **No frontend adaptation needed.**

### Lights List — Shape DIFFERENCE (envelope change)
- Legacy `GET /api/hue/lights` returns `{ success: true, lights: HueLight[] }` via `success({ lights: data })`
- V1 `GET /api/v1/hue/lights` will be created with identical shape (D-01 specifies mirroring)
- `useLightsData.fetchData()` reads `lightsData.lights` → no change needed IF new route uses same envelope

**New route MUST use `success({ lights: data })` to match hook expectation.**

### Groups List — Shape analysis
- Legacy `GET /api/hue/rooms` returns `{ success: true, groups: HueGroup[] }` via `success({ groups: data })`
- V1 `GET /api/v1/hue/groups` already exists and returns `{ success: true, groups: HueGroup[] }` — identical shape
- `useLightsData.fetchData()` reads `groupsData.groups` → no change needed

**Note:** The hook key `reconnect` check (`if (groupsData.reconnect ...)`) was a legacy Bridge reconnect signal. V1 routes never set this key (they use HTTP 503 instead). After cutover, the `reconnect` check will always be falsy (undefined), which is safe — it will simply never trigger.

### Scenes List — Shape DIFFERENCE (needs new route)
- Legacy `GET /api/hue/scenes` returns `{ success: true, scenes: HueScene[] }` via `success({ scenes: data })`
- V1 `GET /api/v1/hue/scenes` does NOT yet exist (to be created by D-02)
- New route MUST use `success({ scenes: data })` to match hook expectation
- The `getScenes(groupId?)` proxy function already supports the optional `group_id` query param

---

## Common Pitfalls

### Pitfall 1: Missing registry/devices/page.tsx
**What goes wrong:** Legacy route deletion breaks the registry devices page (hue provider fetch returns 404).
**Why it happens:** D-09 lists only the debug HueTab files; the registry page also calls `/api/hue/lights` (line 149).
**How to avoid:** Include `app/registry/devices/page.tsx` in the URL rewrite wave.
**Warning signs:** 404 on /registry/devices when filtering by Hue provider after legacy deletion.

### Pitfall 2: PUT path split incomplete
**What goes wrong:** Light toggle/brightness/color controls in `/lights` page fail with 404 after legacy deletion.
**Why it happens:** Legacy `/api/hue/lights/[id]` handled both GET and PUT; v1 only has PUT at `.../[lightId]/state`. If the path split is missed for any of the 3 PUT calls in `lights/page.tsx`, they will 404.
**How to avoid:** All 3 PUT calls (lines 26, 42, 58) must target `/api/v1/hue/lights/${lightId}/state`.
**Warning signs:** 404 when toggling per-light controls; room controls still work (they go through groups/action).

### Pitfall 3: Scenes list route not created before frontend cutover
**What goes wrong:** `useLightsData.fetchScenes()` and scenes page fetch 404 after URL rewrite but before route creation.
**Why it happens:** No `app/api/v1/hue/scenes/route.ts` exists yet.
**How to avoid:** Create missing v1 routes (Wave 1) before rewriting frontend URLs (Wave 2).
**Warning signs:** Empty scene list in LightsCard and ScenesPage after URL rewrite.

### Pitfall 4: `reconnect` key check after cutover
**What goes wrong:** `useLightsData.fetchData()` has `if (groupsData.reconnect || lightsData.reconnect || scenesData.reconnect)` check. This was a legacy Bridge reconnect signal that v1 routes never return. It remains safe (undefined is falsy) but is dead code.
**Why it happens:** Legacy hook pattern never cleaned up.
**How to avoid:** Leave in place (safe), or clean up as discretionary improvement.

### Pitfall 5: Test assertions checking legacy URLs
**What goes wrong:** HueTab tests at lines 61-84 assert `stringContaining('/api/hue/lights/')`, `stringContaining('/api/hue/rooms/')`, `stringContaining('/api/hue/groups/')`. These will fail after cutover.
**Why it happens:** Test assertions hardcode the legacy URL substrings.
**How to avoid:** Update all 3 string assertions to v1 paths (`/api/v1/hue/lights/`, `/api/v1/hue/groups/action`, `/api/v1/hue/groups/`) when rewriting the debug panels.

### Pitfall 6: Legacy routes deleted before smoke tests pass
**What goes wrong:** If legacy `app/api/hue/` is deleted before Jest+Playwright confirm all frontend paths resolve to v1 routes, there is no rollback short of git revert.
**Why it happens:** Deletion is irreversible in the current session.
**How to avoid:** Three-wave order: create missing routes → migrate frontend + tests → delete legacy tree + final tests.

---

## Code Examples

### New v1/hue/lights List Route (D-01)
```typescript
// app/api/v1/hue/lights/route.ts
// Source: pattern from app/api/v1/hue/groups/route.ts (verified)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getLights } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/lights
 * Returns all Hue lights from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getLights();
  return success({ lights: data });
}, 'Hue/Lights');
```

### New v1/hue/scenes List Route (D-02)
```typescript
// app/api/v1/hue/scenes/route.ts
// Source: pattern from app/api/hue/scenes/route.ts (verified)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getScenes } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/scenes
 * Returns all Hue scenes from the HA proxy, optionally filtered by group_id.
 * Query params: group_id (optional) — filter scenes to a single group
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const groupId = request.nextUrl.searchParams.get('group_id') ?? undefined;
  const data = await getScenes(groupId);
  return success({ scenes: data });
}, 'Hue/Scenes');
```

### Per-Light PUT — Path Split (D-12)
```typescript
// Before (lights/page.tsx line 26):
const res = await fetch(`/api/hue/lights/${lightId}`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ on }),
});

// After (path split to /state sub-path):
const res = await fetch(`/api/v1/hue/lights/${lightId}/state`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ on }),
});
```

### Room Toggle — URL Rename
```typescript
// Before (useLightsCommands.ts line 85):
const response = await hueRoomCmd.execute(`/api/hue/rooms/${groupId}`, {
  method: 'PUT', ...
});

// After:
const response = await hueRoomCmd.execute(`/api/v1/hue/groups/${groupId}/action`, {
  method: 'PUT', ...
});
```

### Updated HueTab Test Assertions
```typescript
// Before:
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/hue/lights/'),
  expect.objectContaining({ method: 'PUT' })
);

// After:
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/v1/hue/lights/'),
  expect.objectContaining({ method: 'PUT' })
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy `/api/hue/*` direct Bridge routes | v1 `/api/v1/hue/*` proxy routes with Firebase logging | Phase 159 | Adds audit trail for all commands |
| Both GET+PUT on same `/api/hue/lights/[id]` route | Separate GET `/lights/[id]` and PUT `/lights/[id]/state` | Phase 159 | Cleaner REST semantics; requires path split at cutover |
| No Firebase logging on commands | `adminDbPush('log',...)` in all v1 write routes | Phase 159 | Automatic after cutover — no extra frontend work |

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config changes within the Next.js project. No external tools, CLIs, databases, or runtime services beyond what is already in use.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (existing) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="hue" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HUE-01 | health route returns connected status | unit | `npm test -- --testPathPattern="v1/hue/health"` | ✅ existing |
| HUE-02 | lights list route returns lights array | unit | `npm test -- --testPathPattern="v1/hue/lights"` | ❌ Wave 1 (new route) |
| HUE-03 | light state PUT returns 202 + logs Firebase | unit | `npm test -- --testPathPattern="v1/hue/lights.*state"` | ✅ existing |
| HUE-04 | groups list route returns groups array | unit | `npm test -- --testPathPattern="v1/hue/groups"` | ✅ existing |
| HUE-05 | single group GET returns group | unit | `npm test -- --testPathPattern="v1/hue/groups.*groupId"` | ✅ existing |
| HUE-06 | scene activation POST returns 202 + logs | unit | `npm test -- --testPathPattern="v1/hue/groups.*scenes"` | ✅ existing |
| HUE-07 | group action PUT returns 202 + logs | unit | `npm test -- --testPathPattern="v1/hue/groups.*action"` | ✅ existing |
| HUE-01..07 | HueTab debug panel uses v1 URLs | unit | `npm test -- --testPathPattern="HueTab"` | ✅ existing (update assertions) |
| HUE-01..07 | No /api/hue/* references remain in non-legacy files | smoke | `grep -r "/api/hue" app/ --include="*.ts" --include="*.tsx" \| grep -v "app/api/hue"` | manual/grep |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="hue" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `app/api/v1/hue/lights/__tests__/route.test.ts` — covers HUE-02 list route (created alongside D-01 route)
- [ ] `app/api/v1/hue/scenes/__tests__/route.test.ts` — covers scenes list (created alongside D-02 route)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `withAuthAndErrorHandler` — all new routes inherit this |
| V3 Session Management | no | — |
| V4 Access Control | no | Endpoint is read-only data, auth already gates access |
| V5 Input Validation | yes | `request.nextUrl.searchParams.get('group_id')` — safe (no injection risk, string param) |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated access to new list routes | Elevation of Privilege | `withAuthAndErrorHandler` wrapper (same as all existing v1 routes) |
| Open redirect via `group_id` query param | Tampering | Param is passed to `getScenes()` proxy function as-is; the proxy performs no redirect; safe |

---

## Open Questions

1. **`reconnect` key dead code in hooks**
   - What we know: Legacy hooks check `if (groupsData.reconnect || ...)` — a pattern from Bridge direct-connect era. V1 routes never return this key.
   - What's unclear: Should this dead code be removed as part of this phase or deferred?
   - Recommendation: Leave in place (safe, falsy). Removing it is discretionary cleanup — no functional impact.

2. **HueTab debug panel "rooms" label**
   - What we know: Both HueTab files show `url="/api/hue/rooms/[id]"` as a display label for the PUT control card.
   - What's unclear: Should the label be updated to show `"api/v1/hue/groups/[id]/action"` for accuracy?
   - Recommendation: Yes — update the `url` prop and the `callPutEndpoint` target together so the panel shows what it actually calls.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `app/registry/devices/page.tsx` line 149 will 404 after legacy deletion if not migrated | Complete URL Inventory | If the registry page has its own fallback or is not used, impact is low; but the 404 is real — risk is display breakage |

**All other claims in this research were verified by direct codebase inspection.**

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read — `app/api/hue/*/route.ts`, `app/api/v1/hue/*/route.ts` (all route files verified 2026-04-16)
- Direct codebase read — `useLightsData.ts`, `useLightsCommands.ts` (all URL literals verified)
- Direct codebase read — `app/lights/page.tsx`, `app/lights/scenes/page.tsx` (all fetch calls verified)
- Direct codebase read — `app/debug/*/HueTab.tsx` (all URL refs verified)
- Direct codebase grep — `grep -rn "/api/hue"` across all non-test frontend files (complete inventory)
- `docs/api/hue.md` — v1 API spec (response shapes verified)
- `.planning/phases/166-hue-frontend-cutover/166-CONTEXT.md` — locked decisions D-01 through D-12

### Secondary (MEDIUM confidence)
- None needed — all claims verified against source code

---

## Metadata

**Confidence breakdown:**
- Complete URL inventory: HIGH — verified by grep across entire codebase
- Response shape analysis: HIGH — verified by reading both legacy and v1 route implementations
- Missing file (registry/devices): HIGH — verified by grep
- Firebase logging inheritance: HIGH — verified by reading v1 write routes (adminDbPush present)
- Test gap identification: HIGH — verified by listing existing test files

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable codebase — no external dependencies)
