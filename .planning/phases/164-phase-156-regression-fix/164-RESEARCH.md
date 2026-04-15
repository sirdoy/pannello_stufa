# Phase 164: Phase 156 Regression Fix - Research

**Researched:** 2026-04-15
**Domain:** Next.js App Router path migration cleanup + legacy code removal
**Confidence:** HIGH

<user_constraints>
## User Constraints (from phase scope)

### Locked Decisions
- **D-01:** Delete legacy `/api/stove/*` routes entirely — no redirects. Canonical `/api/v1/thermorossi/*` already serves identical data (verified 1:1 proxy wrapper coverage).
- **D-02:** Canonical structure is frozen and MUST NOT be rebuilt. `lib/stove/thermorossiProxy.ts` and all 10 v1 route files are authoritative. Phase 164 is pure frontend wiring + dead code removal.
- **D-03:** Body shape for power/fan-level POSTs is `{ value: number }` (not `{ level }`). The canonical handlers validate `typeof value === 'number' && Number.isFinite(value)` and 400 otherwise.
- **D-04:** Command action paths are camelCase-grouped under `commands/` and `settings/`, not kebab-case at root. Exact mapping in RESEARCH §Canonical Path Map.
- **D-05:** `ignit` (no trailing `e`) is the canonical command segment — this is the HA proxy contract.
- **D-06:** `lib/version.ts` MUST NOT be touched — it is a historical changelog with 2 archived `/api/stove/*` mentions (lines 1393, 1658). These reference past events.
- **D-07:** Never run `npm run build` or `npm install`. Never commit without explicit request. (Project CLAUDE.md)

### Claude's Discretion
- Whether to delete legacy stove test files entirely vs retarget them to canonical paths — recommendation: **retarget**, not delete. Hook tests (`useStoveData.test.ts`, `useStoveCommands.test.ts`) exercise hook behavior against STOVE_ROUTES indirection; updating the string assertion preserves coverage. Idempotency manager tests use the URL as an opaque cache key discriminator and work with any unique string.
- SW cache-version bump strategy to invalidate stale offline response entries for `/api/stove/status`.
- Order/grouping of files within the single plan (mechanical edits with no interdependency — can be batched).

### Deferred Ideas (OUT OF SCOPE)
- Adding new v1 thermorossi routes (complete coverage already confirmed).
- Extending `/health` or `/api/v1/devices` (COMMON-01/02 are partial but scoped to Phase 165).
- Any other provider's legacy path cleanup (Hue/Sonos/Netatmo/Dirigera — those are Phases 166–169).
- Scheduler endpoint renaming (excluded from v19.0).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PATH-01 | Tutte le route thermorossi migrate da `/api/stove/*` a `/api/v1/thermorossi/*` | `app/api/stove/` directory must be deleted (10 route files confirmed live). Canonical `/api/v1/thermorossi/` tree already complete (10 endpoint files verified). |
| PATH-02 | Frontend (hooks, componenti, debug panels) aggiornato ai nuovi path thermorossi | Full inventory of 13 non-route files still referencing `/api/stove/` compiled in §Complete File Inventory. Hooks (`useStoveData.ts`, `useStoveCommands.ts`) already consume `STOVE_ROUTES` constants — updating `lib/routes.ts` fixes them transitively. |
</phase_requirements>

---

## Summary

Phase 156 was silently reverted during Phase 157 execution (merge conflict in commit `9838abb2`, partial restore in `d2140a69`). The canonical `/api/v1/thermorossi/*` tree is fully intact and already wired to `lib/stove/thermorossiProxy.ts`. However, the legacy `/api/stove/*` tree was resurrected (10 route files), AND `lib/routes.ts` STOVE_ROUTES constants point back at the legacy paths — meaning that even though `useStoveCommands.ts` and `useStoveData.ts` use the indirection (`STOVE_ROUTES.ignite`, `.status`, etc.), they currently issue live requests to `/api/stove/*`. Because both trees co-exist with identical handler bodies, the app works at runtime — but the moment Phase 164 deletes `/api/stove/`, any frontend string still using the legacy path 404s.

Phase 164 is a **mechanical cleanup** with zero new logic. The work decomposes into four orthogonal edits:

1. **Delete** `app/api/stove/` (10 route files — identical-logic duplicates of canonical tree).
2. **Rewrite** `lib/routes.ts` STOVE_ROUTES to canonical paths (1 file, 7 lines changed) — this single edit fixes all hook-based callers transitively.
3. **Rewrite** the 5 remaining direct-URL callers: `lib/commands/deviceCommands.tsx`, `app/sw.ts`, `app/debug/components/tabs/StoveTab.tsx`, `app/debug/api/components/tabs/StoveTab.tsx`, `types/api/responses.ts` JSDoc.
4. **Retarget** 4 test files (3 test files with `/api/stove/` string assertions + 1 hook file with JSDoc) to canonical paths.

The highest-risk element is the **service worker**: `app/sw.ts` has THREE distinct categories of stove references, only ONE of which is a URL path, and mishandling either of the other two (notification-action identifier; periodic-sync tag) will silently break interactive notifications and background polling. The research decodes each occurrence.

The second-highest risk is **stale offline cache**: users with the current SW installed have `/api/stove/status` cached in IndexedDB via `cacheDeviceState('stove', data)`. Post-migration SW version bump is required so the new SW activates and begins caching the canonical path.

**Primary recommendation:** Execute as a **single wave with 2 tightly sequenced plans** — (1) delete legacy routes + rewrite routes.ts/commands/SW/debug panels/types (code edits); (2) retarget tests + final grep sweep + bump SW cache version. A single plan is tempting given the mechanical nature, but splitting isolates test retargeting behind a clean commit, matching the original Phase 156 execution shape.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Legacy route deletion | Backend (Next.js App Router) | — | File-system routing: deleting directory removes route |
| Canonical route constants | Frontend (lib/routes.ts) | — | Indirection layer — all hooks already consume this |
| Direct-URL fetch calls | Frontend (components + commands) | — | Debug panels, command palette, notification actions |
| Service worker URL matchers | Browser (sw.ts runtime) | — | Intercepted fetch events, offline cache, background sync |
| Test assertions | Test (Jest) | — | String literals in `expect.stringContaining` — retarget mechanical |
| JSDoc comments | Doc (source files) | — | Cosmetic alignment — no runtime effect |

**Tier summary:** No cross-tier reassignment. All changes stay within their original tier. No new backend logic, no new hooks, no new components.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | File-system routing — delete directory = delete route | Project stack |
| `lib/core` | internal | `withAuthAndErrorHandler`, `withIdempotency`, `success`, `parseJsonOrThrow`, `HTTP_STATUS` — already in canonical routes, nothing changes | Unchanged from Phase 156 |
| `lib/stove/thermorossiProxy` | internal | HA proxy client — unchanged | Unchanged from Phase 156 |
| `lib/routes` | internal | Central STOVE_ROUTES constants — **rewrite required** | Single-edit fix for all hook-based consumers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Serwist (`app/sw.ts`) | installed | Service worker — URL matcher updates | Intercept `/api/v1/thermorossi/status` for offline cache; post-deploy cache invalidation |
| Jest | installed | Test framework — string assertion updates | No new tests, no config change |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Deleting `/api/stove/*` | 301 redirect in `next.config.ts` | **Rejected** per D-01 (locked from Phase 156). Local PWA, no external consumers, 404 is fine. |
| Retargeting legacy tests | Delete them | **Rejected as default.** Hook tests validate hook behavior indirectly via URL string in `expect.stringContaining` — retargeting preserves coverage. Only candidates for deletion: none (all tests remain valuable). |
| Grep-sed bulk replace | Manual file-by-file edit | **Rejected for deviceCommands.tsx** — the file has a semantic bug (wrong body key `{ level }` vs `{ value }`, wrong method POST on GET endpoints). Mechanical replace misses this. Other files: mechanical replace safe. |

**Installation:** No new packages. This phase adds zero dependencies.

**Version verification:** Skipped — no library adds. Existing Next.js 15.5 + Serwist + Jest remain authoritative. [VERIFIED: package.json via codebase read]

---

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────── BEFORE (current regressed state) ────────────────────────┐
│                                                                                  │
│  Browser ──fetch──> /api/stove/status ──> app/api/stove/status/route.ts          │
│                                                 │                                │
│                                                 ├──> lib/stove/thermorossiProxy  │
│                                                 │           │                    │
│                                                 │           └──> HA proxy        │
│                                                 │                                │
│                     ALSO coexists (identical): /api/v1/thermorossi/status        │
│                                                 │                                │
│                                                 └──> same proxy, same result     │
│                                                                                  │
│  Hooks (useStoveData/useStoveCommands)                                           │
│     └──> STOVE_ROUTES.status = '/api/stove/status' ◄─── lib/routes.ts LEGACY     │
│                                                                                  │
│  SW (app/sw.ts)                                                                  │
│     ├──> fetch intercept: url.pathname === '/api/stove/status' (line 597)        │
│     ├──> periodic sync: fetch('/api/stove/status') (line 718)                    │
│     ├──> notification action: executeNotificationAction('stove/shutdown')        │
│     │       └──> fetch('/api/' + 'stove/shutdown') (line 156 template)           │
│     └──> SYNC_TAG = 'stove-command-sync' (opaque identifier, not URL)            │
│                                                                                  │
│  Command palette (deviceCommands.tsx)                                            │
│     ├──> fetch('/api/stove/get-power') — KEBAB-CASE, ROUTE DOES NOT EXIST       │
│     └──> executeStoveAction('set-power', { level }) — WRONG BODY KEY            │
│                                                                                  │
│  Debug panels (StoveTab.tsx × 2)                                                 │
│     └──> 45 hardcoded legacy URL strings                                         │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────── AFTER (Phase 164 target) ────────────────────────────────┐
│                                                                                  │
│  Browser ──fetch──> /api/v1/thermorossi/status ──> canonical route (unchanged)   │
│                                                                                  │
│  /api/stove/* ──> 404 (directory deleted)                                        │
│                                                                                  │
│  Hooks                                                                           │
│     └──> STOVE_ROUTES.status = '/api/v1/thermorossi/status' ◄─── UPDATED         │
│                                                                                  │
│  SW                                                                              │
│     ├──> fetch intercept: '/api/v1/thermorossi/status'                           │
│     ├──> periodic sync: fetch('/api/v1/thermorossi/status')                      │
│     ├──> notification action: executeNotificationAction('v1/thermorossi/commands/shutdown') │
│     └──> SYNC_TAG unchanged ('stove-command-sync' is opaque)                     │
│     └──> SW_CACHE_VERSION bumped to invalidate stale /api/stove/status entries   │
│                                                                                  │
│  Command palette                                                                 │
│     ├──> fetch('/api/v1/thermorossi/power') — camelCase canonical                │
│     └──> executeStoveAction('/api/v1/thermorossi/settings/power', 'POST',        │
│             { value: n }) — FULL PATH + CORRECT BODY                             │
│                                                                                  │
│  Debug panels                                                                    │
│     └──> 45 canonical URL strings each (identical to post-156-02 state)          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Canonical Path Map (authoritative)

| Legacy Path | Method | Canonical Path | Method | Body Shape |
|-------------|--------|----------------|--------|------------|
| `/api/stove/status` | GET | `/api/v1/thermorossi/status` | GET | — |
| `/api/stove/health` | GET | `/api/v1/thermorossi/health` | GET | — |
| `/api/stove/getPower` | GET | `/api/v1/thermorossi/power` | GET | — |
| `/api/stove/getFan` | GET | `/api/v1/thermorossi/fan-level` | GET | — |
| `/api/stove/history` | GET | `/api/v1/thermorossi/history` | GET | — |
| `/api/stove/ignite` | POST | `/api/v1/thermorossi/commands/ignit` | POST | `{ source?: string }` |
| `/api/stove/shutdown` | POST | `/api/v1/thermorossi/commands/shutdown` | POST | `{ source?: string }` |
| `/api/stove/setPower` | POST | `/api/v1/thermorossi/settings/power` | POST | `{ value: number, source?: string }` |
| `/api/stove/setFan` | POST | `/api/v1/thermorossi/settings/fan-level` | POST | `{ value: number, source?: string }` |
| `/api/stove/setWaterTemperature` | POST | `/api/v1/thermorossi/settings/temperature/water` | POST | `{ value: number, source?: string }` |

[VERIFIED: codebase read of `app/api/v1/thermorossi/settings/power/route.ts` — line 16 `const value = body['value']` with finite-number validation. [CITED: docs/api/thermorossi.md]]

Note the legacy-broken-to-canonical mapping for command palette kebab-case strings (these never routed correctly):

| Broken Legacy String | Canonical Path | Method |
|----------------------|----------------|--------|
| `/api/stove/get-power` | `/api/v1/thermorossi/power` | **GET** (not POST) |
| `/api/stove/set-power` | `/api/v1/thermorossi/settings/power` | POST (`{ value }`) |
| `/api/stove/get-fan` | `/api/v1/thermorossi/fan-level` | **GET** (not POST) |
| `/api/stove/set-fan` | `/api/v1/thermorossi/settings/fan-level` | POST (`{ value }`) |

### Pattern 1: `lib/routes.ts` — STOVE_ROUTES Canonical Rewrite

Current state (regressed, lines 46–54):
```typescript
export const STOVE_ROUTES = {
  status: `${API_BASE}/stove/status`,
  ignite: `${API_BASE}/stove/ignite`,
  shutdown: `${API_BASE}/stove/shutdown`,
  getFan: `${API_BASE}/stove/getFan`,
  getPower: `${API_BASE}/stove/getPower`,
  setFan: `${API_BASE}/stove/setFan`,
  setPower: `${API_BASE}/stove/setPower`,
} as const;
```

Target:
```typescript
export const STOVE_ROUTES = {
  status: `${API_BASE}/v1/thermorossi/status`,
  ignite: `${API_BASE}/v1/thermorossi/commands/ignit`,
  shutdown: `${API_BASE}/v1/thermorossi/commands/shutdown`,
  getFan: `${API_BASE}/v1/thermorossi/fan-level`,
  getPower: `${API_BASE}/v1/thermorossi/power`,
  setFan: `${API_BASE}/v1/thermorossi/settings/fan-level`,
  setPower: `${API_BASE}/v1/thermorossi/settings/power`,
} as const;
```

[VERIFIED: `app/components/devices/stove/hooks/useStoveData.ts` line 243 `fetch(STOVE_ROUTES.status)` and `useStoveCommands.ts` lines 99/124/150/176 all consume via constants — single-point-of-change benefit.]

### Pattern 2: `deviceCommands.tsx` — Function Refactor + Bug Fix

The current `executeStoveAction(endpoint, body)` signature concatenates `/api/stove/${endpoint}` and always uses POST. This breaks two ways after migration:

1. Canonical paths have varying depth (`/api/v1/thermorossi/power` vs `/api/v1/thermorossi/commands/ignit`) — cannot be synthesized from a single-segment suffix.
2. Read endpoints (`power`, `fan-level`) require GET, not POST. Current code uses `fetch('/api/stove/get-power')` (manually using GET via default), but `executeStoveAction` always POSTs.

Target signature (per Phase 156 RESEARCH recommendation):
```typescript
async function executeStoveAction(
  path: string,
  method: string = 'POST',
  body: Record<string, unknown> = {}
): Promise<unknown> {
  try {
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(method !== 'GET' && {
        body: JSON.stringify({ ...body, source: 'command_palette' })
      }),
    });
    const data = await response.json();
    if (data.error) console.error(`[CommandPalette] Stove ${path} error:`, data.error);
    return data;
  } catch (err) {
    console.error(`[CommandPalette] Stove ${path} failed:`, err);
  }
}
```

Call site rewrites:

| Current (broken) | Target |
|------------------|--------|
| `executeStoveAction('ignite')` | `executeStoveAction('/api/v1/thermorossi/commands/ignit')` |
| `executeStoveAction('shutdown')` | `executeStoveAction('/api/v1/thermorossi/commands/shutdown')` |
| `fetch('/api/stove/get-power')` | `fetch('/api/v1/thermorossi/power')` |
| `fetch('/api/stove/get-fan')` | `fetch('/api/v1/thermorossi/fan-level')` |
| `executeStoveAction('set-power', { level: n })` | `executeStoveAction('/api/v1/thermorossi/settings/power', 'POST', { value: n })` |
| `executeStoveAction('set-fan', { level: n })` | `executeStoveAction('/api/v1/thermorossi/settings/fan-level', 'POST', { value: n })` |

**Note on current-power/fan read:** The current code reads `statusData?.Result ?? 3`. This references the legacy HA proxy WiNet response shape. The canonical `/api/v1/thermorossi/power` GET handler returns `success(data)` where `data` is the proxy response — verify the shape matches. [ASSUMED: response shape unchanged since legacy `/api/stove/getPower/route.ts` uses the same `getPower()` proxy function.]

### Pattern 3: Service Worker Three-Layer Reference Handling

`app/sw.ts` has **three distinct categories** of stove references, each requiring different handling:

**Category A — Literal URL matchers (MUST update to canonical):**
- Line 597: `if (url.pathname === '/api/stove/status' && event.request.method === 'GET')` → `'/api/v1/thermorossi/status'`
- Line 718: `const response = await fetch('/api/stove/status')` → `fetch('/api/v1/thermorossi/status')`

**Category B — Notification action identifier that becomes URL path fragment (MUST update):**
- Line 293: `executeNotificationAction('stove/shutdown', {...})` — this string is injected into `fetch('/api/' + endpoint)` at line 156. Therefore it IS a URL path fragment and MUST become `'v1/thermorossi/commands/shutdown'`.
- Line 244: `case 'stove/shutdown':` in `getActionSuccessMessage` — must match the new identifier, update to `case 'v1/thermorossi/commands/shutdown':`

**Category C — Opaque identifiers NOT tied to URL (DO NOT update):**
- Line 335: `const SYNC_TAG = 'stove-command-sync'` — background sync tag, registered by the browser. Changing it orphans in-flight pending syncs across SW versions. Leave as-is.
- Line 697: `const PERIODIC_SYNC_TAG = 'check-stove-status'` — periodic-sync registration tag, browser-persisted. Leave as-is.
- Line 325: `NOTIFICATION_ACTION_IDS.STOVE_SHUTDOWN = 'stove-shutdown'` — action button ID exchanged between `showNotification` and `notificationclick`. Must match `lib/notificationActions.ts` constants (SW duplicates them). Leave as-is unless that file also changes. [VERIFIED by reading sw.ts lines 322–329.]
- Line 734: `tag: 'stove-error'` in `showNotification` — browser notification tag for deduplication. Leave as-is.

[VERIFIED: sw.ts lines 150–188 — `executeNotificationAction` does `fetch('/api/' + endpoint)`. This proves Category B is a URL fragment.]

### Pattern 4: Post-Deploy SW Cache Invalidation

Current SW caches `/api/stove/status` response body in IndexedDB via `cacheDeviceState('stove', data)`. After deploy:

- Installed SWs continue to intercept `/api/stove/status` requests (until SW update) and return cached data from IndexedDB — but the browser will see 404s now.
- New SW, once activated, starts caching `/api/v1/thermorossi/status` instead. Old `/api/stove/status` cache entry becomes dead weight but does not cause failures.

**Recommendation:** Bump a cache version constant or rely on Serwist's precache manifest hash (which changes automatically on any SW source change). Since we're editing `sw.ts`, the precache hash will change, forcing SW update. No explicit cache-version bump required. [ASSUMED: Serwist uses content-hash-based precache; confirm in final plan by reading `next.config.ts` or Serwist config before writing SW edits.]

### Anti-Patterns to Avoid

- **Leaving duplicate route handlers:** After deleting `app/api/stove/`, verify canonical tree is intact. Do NOT "backup" legacy routes by renaming — delete them.
- **Updating `lib/version.ts`:** Lines 1393 and 1658 reference legacy paths in historical changelog entries. These are archived records describing past fixes. D-06 prohibits edits.
- **Changing SW sync tag names:** Breaks in-flight background syncs across users who installed the previous SW. Sync tags are opaque browser-persisted identifiers.
- **Bulk grep-sed without hand-review of deviceCommands.tsx:** The file has a semantic bug (wrong method, wrong body key). Sed cannot fix it.
- **Forgetting the notification action string is a URL fragment:** Line 293 in sw.ts looks like an event identifier but becomes a fetch URL at line 156. Easy to miss.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Backward-compatibility shim | Redirect middleware + dual handler | Straight delete + 404 | D-01 locked decision; local PWA, no external callers |
| URL constant management | Hardcoded strings per call site | `STOVE_ROUTES` from `lib/routes.ts` | Already in place; only `lib/routes.ts` needs update to fix ALL hook consumers |
| Ad-hoc cache invalidation | Manual IndexedDB.deleteObjectStore | Serwist content-hash precache | Serwist already handles this on SW source change |
| Custom test fixtures for new paths | Rewrite test setup | `expect.stringContaining(canonical)` | Only string assertions change; test structure stays identical |

**Key insight:** Phase 156 left behind perfect infrastructure — a central `STOVE_ROUTES` indirection that fixes all hook-based consumers via a single file edit. The regression happened at this indirection layer, not at the hook call sites. Exploit that.

---

## Runtime State Inventory

This is a rename/refactor phase — explicit answers required.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — no databases, Firebase paths, Mem0 memories, or ChromaDB collections reference the string `/api/stove/`. Verified by Grep against lib/firebase/, __tests__/firebase/, and docs/. | None |
| Live service config | **None** — no Datadog/Tailscale/Cloudflare configs embed this path. The only external service (HA proxy at `haClient`) already uses `/api/v1/thermorossi/*` paths on the upstream — unaffected. | None |
| OS-registered state | **Service worker background sync / periodic sync tags** exist: `SYNC_TAG = 'stove-command-sync'` (line 335), `PERIODIC_SYNC_TAG = 'check-stove-status'` (line 697). These are browser-registered and persisted. **Decision:** leave unchanged (opaque identifiers, not URLs). Re-registration only occurs on SW update anyway. | None — leave tags as-is |
| Secrets/env vars | **None** — no env var names contain `stove`. `.env.local` and `process.env.*` references checked. | None |
| Build artifacts | **Service worker precache manifest** auto-rebuilt by Serwist on `npm run build` (which we do NOT run per D-07). **IndexedDB `commandQueue` store** contains pending commands with `endpoint: 'stove/shutdown'` field — these will become `v1/thermorossi/commands/shutdown` after SW update. Old queued commands (if any user has pending) will fire against the old endpoint string, which `/api/stove/shutdown` no longer serves → 404 → command dropped. **Impact:** low (queue entries have lifecycle of hours, not weeks). | Accept dropped stale queued commands as acceptable loss |

**The canonical question answered:** After every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?
- Browser IndexedDB `commandQueue` entries with `endpoint: 'stove/shutdown'` (limited lifetime)
- Browser IndexedDB `deviceState` cache keyed by `'stove'` (cache key, not URL — unaffected)
- SW precache manifest referencing legacy path (rebuilt on deploy)
- Background sync tag `'stove-command-sync'` (opaque, not a URL)

---

## Common Pitfalls

### Pitfall 1: Silent Runtime 404 on Hook Paths
**What goes wrong:** After deleting `/api/stove/`, updating debug panels but forgetting `lib/routes.ts` — the production hooks (`useStoveData`, `useStoveCommands`) continue issuing requests to deleted routes, user sees "stove unreachable" with no console error beyond 404.
**Why it happens:** Hooks use `STOVE_ROUTES.status` indirection; visible fetch paths in grep come from the constants file, not the call sites.
**How to avoid:** Include `lib/routes.ts` rewrite in the SAME commit as the route deletion. Verify with `grep -c "'/v1/thermorossi/'" lib/routes.ts` returns exactly 7 (one per constant).
**Warning signs:** Manual test of stove controls from `/stove` page shows no telemetry updates.

### Pitfall 2: Forgetting sw.ts Notification Action is a URL
**What goes wrong:** Developer updates lines 597/718 (obvious URL strings) but leaves `executeNotificationAction('stove/shutdown', ...)` at line 293 unchanged. Notification "Spegni stufa" action button silently fails.
**Why it happens:** Line 293 looks like a constant/identifier pattern, not a URL. Grep for `/api/stove/` doesn't flag it. Only a careful read of `executeNotificationAction` body (line 156) reveals the concatenation.
**How to avoid:** When auditing sw.ts, trace every `stove/` or `stove-` occurrence to its usage. If it flows through `fetch('/api/' + x)`, it's a URL fragment.
**Warning signs:** `case 'stove/shutdown':` in `getActionSuccessMessage` (line 244) should match the identifier passed to `executeNotificationAction`. If one is updated and the other isn't, toast messages break.

### Pitfall 3: Changing SW Sync Tag Names
**What goes wrong:** Renaming `SYNC_TAG = 'stove-command-sync'` to something like `'thermorossi-command-sync'` orphans any pending Background Sync that was registered by the previous SW. Queued commands never fire.
**Why it happens:** Looks like a "related" rename to keep consistency.
**How to avoid:** Sync tags are opaque browser keys, NOT URLs. Leave them alone. Document this in plan as "INTENTIONALLY UNCHANGED."

### Pitfall 4: Command Palette Mechanical Replace Misses Semantic Bugs
**What goes wrong:** `sed -i 's|/api/stove/|/api/v1/thermorossi/|g' lib/commands/deviceCommands.tsx` leaves the function signature, the always-POST method, and the `{ level }` body key intact. Post-migration, `set-power` call still 400s (canonical requires `{ value }`).
**Why it happens:** The file carries inherited bugs from before Phase 156 — the hyphenated paths like `/api/stove/set-power` never routed to anything, meaning that flow was already broken. Migration is the moment to fix it.
**How to avoid:** Hand-edit `deviceCommands.tsx`. Follow Pattern 2 above exactly — rewrite `executeStoveAction` signature, update body key to `value`, separate GET (reads) from POST (writes) at call sites.

### Pitfall 5: Incomplete grep Verification Sweep
**What goes wrong:** Post-migration grep `'/api/stove/'` on `.ts/.tsx` shows zero matches, but the build breaks because `/api/stove/` appears in a `.md` file imported at build time (e.g., MDX documentation routes) or a JSON fixture.
**How to avoid:** Extend verification grep to `.md`, `.mdx`, `.json`, `.mjs` — but explicitly EXCLUDE `lib/version.ts`, `.planning/`, `docs/api/README.md` historical references, and `node_modules/.next/`. Expected post-migration count of `/api/stove/` across entire repo: 2 (lib/version.ts lines 1393, 1658 — historical).

### Pitfall 6: Running `npm run build` or `npm install`
**What goes wrong:** User's CLAUDE.md prohibits both. Build attempts may mask errors or change lockfile.
**How to avoid:** Verification uses `npm test -- --testPathPattern=...` (allowed) and `grep -r` (allowed), never `npm run build` or `npm install`.

---

## Code Examples

### Example 1: Rewriting `lib/commands/deviceCommands.tsx` power-up handler

```typescript
// BEFORE (broken — routes don't exist, body key wrong)
{
  id: 'stove-power-up',
  label: 'Aumenta Potenza Stufa',
  icon: <Plus className="w-4 h-4" />,
  onSelect: async () => {
    const statusRes = await fetch('/api/stove/get-power');
    const statusData = await statusRes.json();
    const currentPower = statusData?.Result ?? 3;
    if (currentPower < 5) {
      await executeStoveAction('set-power', { level: currentPower + 1 });
    }
  },
},

// AFTER
{
  id: 'stove-power-up',
  label: 'Aumenta Potenza Stufa',
  icon: <Plus className="w-4 h-4" />,
  onSelect: async () => {
    const statusRes = await fetch('/api/v1/thermorossi/power');
    const statusData = await statusRes.json();
    const currentPower = statusData?.Result ?? 3;
    if (currentPower < 5) {
      await executeStoveAction(
        '/api/v1/thermorossi/settings/power',
        'POST',
        { value: currentPower + 1 }
      );
    }
  },
},
```

[CITED: `.planning/phases/156-path-migration-common-endpoints/156-RESEARCH.md` Pitfall 3]

### Example 2: sw.ts line 293 correction

```typescript
// BEFORE (will 404 after /api/stove/ deleted)
if (clickedAction === NOTIFICATION_ACTION_IDS.STOVE_SHUTDOWN) {
  event.waitUntil(executeNotificationAction('stove/shutdown', {
    source: 'notification-action',
    type: notificationData.type || 'unknown',
  }));
}

// AFTER
if (clickedAction === NOTIFICATION_ACTION_IDS.STOVE_SHUTDOWN) {
  event.waitUntil(executeNotificationAction('v1/thermorossi/commands/shutdown', {
    source: 'notification-action',
    type: notificationData.type || 'unknown',
  }));
}
```

And update the matching switch case at line 244:
```typescript
// AFTER
function getActionSuccessMessage(endpoint: string): string {
  switch (endpoint) {
    case 'v1/thermorossi/commands/shutdown':
      return 'Stufa spenta con successo';
    default:
      return 'Comando eseguito con successo';
  }
}
```

---

## Complete File Inventory

### Files to DELETE (directory + contents)

| Path | Contents |
|------|----------|
| `app/api/stove/` | 10 route directories: `status/`, `health/`, `getFan/`, `getPower/`, `setFan/`, `setPower/`, `setWaterTemperature/`, `ignite/`, `shutdown/`, `history/` (each with `route.ts`) |

**Command:** `rm -rf app/api/stove/`
**Verification:** `test ! -d app/api/stove && echo "DELETED"`

### Files to MODIFY (source code)

| File | Refs to update | Nature | Risk |
|------|----------------|--------|------|
| `lib/routes.ts` | 7 STOVE_ROUTES values (lines 47–53) | Constants table | LOW (mechanical) |
| `lib/commands/deviceCommands.tsx` | 5 URL refs + `executeStoveAction` function signature + body key `level`→`value` | Function refactor + semantic fix | MEDIUM (semantic bugs) |
| `app/sw.ts` | 2 URL path strings (lines 597, 718) + 1 notification-action URL fragment (line 293) + 1 switch case (line 244) | Three distinct categories — see Pattern 3 | HIGH (easy to miss) |
| `app/debug/api/components/tabs/StoveTab.tsx` | 45 URL string literals | Mechanical string replace per mapping table | LOW |
| `app/debug/components/tabs/StoveTab.tsx` | 45 URL string literals | Mechanical string replace per mapping table | LOW |
| `types/api/responses.ts` | 1 JSDoc comment (line 34) | Cosmetic | LOW |
| `lib/hooks/useRetryableCommand.ts` | 1 JSDoc example (line 74) | Cosmetic | LOW |
| `lib/retry/idempotencyManager.ts` | 1 JSDoc comment referencing `/api/stove/ignite` as example | Cosmetic | LOW |

### Test Files to MODIFY

| File | Refs | Action |
|------|------|--------|
| `__tests__/components/devices/stove/hooks/useStoveData.test.ts` | 1 `expect.stringContaining('/api/stove/status')` (line 141) | Update to canonical |
| `__tests__/components/devices/stove/hooks/useStoveCommands.test.ts` | 9 refs (lines 71, 187, 246, 260, 284, 298, 331, 355, 369) — mix of `poll_endpoint` fixture data + `expect.stringContaining` assertions | Update per mapping table |
| `lib/retry/__tests__/idempotencyManager.test.ts` | 20+ refs — all used as opaque cache-key discriminators | Update for consistency (tests pass either way) |
| `lib/hooks/__tests__/useRetryableCommand.test.ts` | 12 refs at lines 94, 101, 106, 126, 143, 175, 205, 223, 241, 274, 306, 329 — all `execute('/api/stove/ignite')` test inputs | Update per mapping table |

### Files EXPLICITLY UNCHANGED (do not touch)

| File | Reason |
|------|--------|
| `lib/stove/thermorossiProxy.ts` | Proxy client calls HA upstream `/api/v1/thermorossi/*` — already canonical |
| `lib/version.ts` | Historical changelog (lines 1393, 1658) — D-06 prohibits edits |
| `app/api/v1/thermorossi/*/route.ts` (10 files) | Canonical routes — already in place and verified |
| `app/health/route.ts`, `app/api/v1/devices/route.ts` | Aggregate endpoints — COMMON-01/02 are Phase 165 scope |
| SW `SYNC_TAG`, `PERIODIC_SYNC_TAG`, `NOTIFICATION_ACTION_IDS`, notification `tag` strings | Opaque browser identifiers — see Pattern 3 Category C |
| `docs/api/thermorossi.md`, `docs/api/README.md` | Already document canonical paths — Phase 156-02 already aligned |

---

## Project Constraints (from CLAUDE.md)

Required for planner to verify compliance:

1. **NEVER** break existing functionality (the `/api/v1/thermorossi/*` tree remains fully functional; only the duplicate legacy tree is removed; hooks retargeted via `STOVE_ROUTES`)
2. **WAIT** for user confirmation before version updates (no package.json changes in this phase)
3. **PREFER** editing existing files over creating new (no new files created; all changes are deletions or edits to existing files)
4. **NEVER** execute `npm run build` or `npm install` (validation uses `npm test` and grep; no build)
5. **ALWAYS** create/update unit tests (4 test files updated with canonical path assertions)
6. **USE** design system (no UI changes in this phase; not applicable)
7. **NEVER** commit/push without explicit request (plans must respect `commit_docs: true` but source commits require explicit user approval)

---

## Runtime Dependencies Audit

| Dependency | Usage | Status | Fallback |
|------------|-------|--------|----------|
| HA proxy (upstream) | `lib/stove/thermorossiProxy.ts` calls `/api/v1/thermorossi/*` on `process.env.HA_BASE_URL` | Unchanged from Phase 156 | — |
| Firebase (Admin SDK) | Idempotency cache via `withIdempotency` | Unchanged | — |
| Auth0 | `withAuthAndErrorHandler` protects all canonical routes | Unchanged | — |
| Serwist | SW compilation for `app/sw.ts` edits | Rebuilt automatically on deploy | — |

No new dependencies. No version bumps.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via `npm test`) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="stove\|idempotency\|useRetryableCommand" --no-coverage` |
| Full suite command | `npm test -- --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PATH-01 | Legacy `/api/stove/*` directory deleted | smoke | `test ! -d app/api/stove && echo OK` | N/A — filesystem |
| PATH-01 | Canonical `/api/v1/thermorossi/*` tree intact (10 files) | smoke | `ls app/api/v1/thermorossi/**/route.ts \| wc -l` returns 10 | ✓ — already exists |
| PATH-02 | Zero `/api/stove/` refs in production code | grep | `grep -r '/api/stove/' app/ lib/ components/ --include='*.ts' --include='*.tsx' \| grep -v version.ts \| wc -l` returns 0 | ✓ — grep as test |
| PATH-02 | `STOVE_ROUTES` points to canonical paths | grep | `grep -c '/v1/thermorossi/' lib/routes.ts` returns 7 | ✓ |
| PATH-02 | Hook tests pass with canonical assertions | unit | `npm test -- --testPathPattern=useStoveData\|useStoveCommands --no-coverage` | ✓ (after update) |
| PATH-02 | Retryable command tests pass | unit | `npm test -- --testPathPattern=useRetryableCommand --no-coverage` | ✓ (after update) |
| PATH-02 | Idempotency manager tests pass | unit | `npm test -- --testPathPattern=idempotencyManager --no-coverage` | ✓ (after update) |
| PATH-02 | SW references canonical status path | grep | `grep -c '/api/v1/thermorossi/status' app/sw.ts` returns 2 | ✓ |
| PATH-02 | SW notification action is canonical | grep | `grep -c "'v1/thermorossi/commands/shutdown'" app/sw.ts` returns 2 (executeNotificationAction + switch case) | ✓ |
| PATH-02 | Debug panels rewritten | grep | `grep -c '/api/v1/thermorossi/' app/debug/components/tabs/StoveTab.tsx` returns at least 45 | ✓ |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="stove\|idempotency\|useRetryableCommand" --no-coverage`
- **Per wave merge:** Full verification grep sweep + Jest on stove-related tests
- **Phase gate:** Full Jest suite green before `/gsd-verify-work`; zero `/api/stove/` refs outside `lib/version.ts`

### Wave 0 Gaps
None — all required test infrastructure exists. Tests require only string-literal retargeting, not new fixtures or configuration.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `/api/stove/*` (kebab pluralized flat routes) | `/api/v1/thermorossi/*` (nested versioned) | Phase 156 (shipped), Phase 164 (cleanup) | Legacy tree finally deleted; no external consumers |
| STOVE_ROUTES on `/api/stove/*` | STOVE_ROUTES on `/api/v1/thermorossi/*` | This phase | Single-edit-point for all hook consumers |
| Command palette using fake kebab paths | Command palette on canonical paths with GET/POST split | This phase | Fixes 5 broken commands |

**Deprecated/outdated:**
- Direct `/api/stove/*` URL strings in application code — remove all, replaced by canonical (or by STOVE_ROUTES constants for the hook path)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Canonical `/api/v1/thermorossi/power` GET returns response in same shape (`{ Result: number, ... }`) as legacy `/api/stove/getPower` since both call `getPower()` from thermorossiProxy | deviceCommands.tsx Pattern 2 | Command palette power-up/down reads wrong field → reads `undefined`, falls back to default `?? 3`, increment logic wrong but non-fatal. Verify before writing plan by reading canonical route file. |
| A2 | Serwist uses content-hash-based precache manifest, so editing sw.ts triggers SW update on next deploy without explicit cache-version bump | Pattern 4 | If Serwist uses a stable manifest, clients keep old SW indefinitely until manual trigger. Planner should verify by reading `next.config.ts` / Serwist config OR add an explicit `SW_CACHE_VERSION` constant bump as belt-and-suspenders. |
| A3 | No other files in the repo (outside `.planning/` and `lib/version.ts`) reference `/api/stove/` as a string literal | Pitfall 5 | A missed file causes silent 404. Mitigated by explicit repo-wide grep in verification step. |
| A4 | Command palette's `statusData?.Result ?? 3` read uses correct field name on canonical response | Example 1 | Identical to A1; same mitigation |
| A5 | IndexedDB `commandQueue` stale entries with legacy endpoint string are acceptable to drop (limited lifetime, low impact) | Runtime State Inventory | If users have many queued offline commands, they all silently drop post-deploy. Acceptable per core-value (notifications always arrive) vs command-queue resilience (non-goal). |
| A6 | `docs/api/` contents already reflect canonical paths (Phase 156-02 updated them) and need no further edits | Files Explicitly Unchanged | If docs have stale paths, DX degrades but runtime unaffected. Out of scope for this phase. |

**User confirmation recommended for A1 and A2 before executing the plan.**

---

## Open Questions

1. **Canonical GET response shape for `/api/v1/thermorossi/power` and `/fan-level`**
   - What we know: Both canonical routes import `getPower`/`getFan` from `lib/stove/thermorossiProxy.ts` and wrap with `success(data)`. Legacy routes did the same.
   - What's unclear: Whether the response field name is `Result` (legacy WiNet shape preserved) or changed in proxy migration.
   - Recommendation: Before writing the plan, have a task read `lib/stove/thermorossiProxy.ts` to confirm `ThermorossiPowerResponse` field name. If it's not `Result`, update `deviceCommands.tsx` read logic at the same time.

2. **Serwist precache invalidation behavior on sw.ts edit**
   - What we know: Serwist is installed and configured.
   - What's unclear: Exact behavior — content-hash precache (auto-invalidates) vs stable precache (manual bump).
   - Recommendation: Planner reads `next.config.ts` / Serwist plugin config before writing the SW edit plan. If unclear, add a `SW_CACHE_VERSION` bump as defensive measure.

3. **Whether `/api/stove/shutdown` queued commands in IndexedDB can be migrated**
   - What we know: The SW `queueActionForSync` stores commands with `endpoint: string` field.
   - What's unclear: Whether existing queue entries with `'stove/shutdown'` should be rewritten at SW activation.
   - Recommendation: Accept queue loss (per A5). Migration logic adds complexity and queue entries have low persistence.

---

## Environment Availability

Step 2.6: SKIPPED — Pure code deletion + string edit phase. No external tools, services, runtimes, or CLI utilities beyond the existing Jest + grep toolchain.

---

## Security Domain

> Not applicable — no auth logic changes. All canonical routes already use `withAuthAndErrorHandler`. No input validation changes (existing validation on `{ value }` at `settings/power` etc. is preserved). No cryptography. No new attack surface. Deletion reduces attack surface (fewer duplicate handlers).

---

## Sources

### Primary (HIGH confidence)
- `app/api/stove/*` (10 route files) — direct read confirming each is a thin wrapper around `thermorossiProxy` functions [VERIFIED: codebase read]
- `app/api/v1/thermorossi/*` (verified structure) — canonical tree intact [VERIFIED: `ls app/api/v1/thermorossi/`]
- `lib/routes.ts` lines 46–54 — STOVE_ROUTES pointing at legacy paths [VERIFIED: codebase read]
- `lib/commands/deviceCommands.tsx` — 5 /api/stove/ refs + `executeStoveAction` always-POST bug + `{ level }` body bug [VERIFIED: codebase read]
- `app/sw.ts` — 3 URL refs (lines 244, 293, 597, 718) + opaque tags (335, 697) + `executeNotificationAction` URL construction (line 156) [VERIFIED: codebase read]
- Both `StoveTab.tsx` debug panels — 45 refs each [VERIFIED: grep count 45 per file]
- `.planning/v19.0-MILESTONE-AUDIT.md` — regression evidence [CITED]
- `.planning/phases/156-path-migration-common-endpoints/156-RESEARCH.md` — canonical path mapping, pitfalls [CITED]
- `.planning/phases/156-path-migration-common-endpoints/156-VERIFICATION.md` — confirmation of pre-regression state [CITED]
- `docs/api/thermorossi.md` — canonical path structure [CITED]

### Secondary (MEDIUM confidence)
- Phase 156 SUMMARY artifacts referencing commit `9838abb2` (revert) and `d2140a69` (partial restore) — audit claims these caused the regression

### Tertiary (LOW confidence)
- None — all claims verified against codebase or authoritative planning docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new deps; all patterns verified in existing codebase and Phase 156 RESEARCH
- Canonical path mapping: HIGH — Verified against canonical route files + docs
- Runtime state inventory: HIGH — Service worker, IndexedDB, and browser registrations all explicitly audited
- SW pitfalls: HIGH — Three-category decomposition verified by reading `executeNotificationAction` flow
- deviceCommands semantic bugs: HIGH — Verified against canonical body shape (`{ value }` + `Number.isFinite` validation)
- Test file retargeting: HIGH — All 4 test files grep'd for current state; mechanical replace is sufficient
- Serwist cache invalidation (A2): MEDIUM — assumption flagged

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (path structure is locked; SW semantics are stable)
