# Phase 168: Netatmo Frontend Cutover - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 22 (19 production/test + 2 debug panels + 1 analog legacy-tree deletion target `app/api/netatmo/`)
**Analogs found:** 22 / 22 (every target file has a direct Phase 166 or Phase 167 precedent)

Planner authority: the file list below comes from **RESEARCH.md Grep Inventory Groups A–C** (the expanded 19-file production + 2 debug + legacy-tree scope), NOT CONTEXT.md's narrower 7-file list. RESEARCH C-1..C-9 documented the scope correction.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `lib/routes.ts` (Netatmo + Camera entries) | routes-config rewrite | constants indirection | Phase 166 `lib/routes.ts` rewrite (implicit — Hue went direct-string; Phase 168 must rewrite `NETATMO_ROUTES` + `CAMERA_ROUTES` keys) | role-match (first cutover to touch `lib/routes.ts`) |
| `app/components/devices/thermostat/hooks/useThermostatData.ts` | hook shape-adapter rewrite | request-response + shape-unwrap | Phase 166 `useLightsData.ts` URL swap + Phase 167 `useSonosData.ts` WS side-fetch file-wide pattern | role-match (adds shape unwrap — novel) |
| `lib/hooks/useScheduleData.ts` | hook endpoint-drop rewrite | request-response + endpoint-collapse | Phase 167 `useSonosHistory.ts` URL swap (template) + NO direct precedent for endpoint-drop (closest: Sonos `/devices` legacy-only contract removed per 167 D-12) | partial-match |
| `lib/hooks/useRoomStatus.ts` | hook shape-adapter (or routes-indirection) rewrite | request-response + shape-unwrap | Phase 166 `useLightsData.ts` (if routes.ts strategy chosen, URL unchanged at call site) | role-match |
| `app/components/devices/camera/hooks/useCameraData.ts` | hook (routes-indirection only) | request-response | Phase 166 `useLightsData.ts` (routes-indirection path) | exact (URL changes at routes.ts; call site unchanged) |
| `app/components/devices/camera/CameraCard.tsx` | component runtime rewrite + cache-bust + POST body change + JSDoc | request-response + image-rendering | Phase 166 `app/lights/page.tsx` path-split PUT pattern | role-match |
| `app/(pages)/camera/CameraDashboard.tsx` | component runtime rewrite + cache-bust + POST body change | request-response + image-rendering | Phase 166 `app/lights/page.tsx` path-split PUT pattern | role-match |
| `app/(pages)/camera/events/CameraEventsPage.tsx` | page (routes-indirection only) | request-response | Phase 166 `app/lights/scenes/page.tsx` URL swap | exact |
| `app/components/devices/camera/EventPreviewModal.tsx` | component (routes-indirection only) | request-response | Phase 166 `app/components/lights/CreateSceneModal.tsx` single-fetch swap | exact |
| `app/registry/devices/page.tsx` | page direct-string swap (+ possible shape unwrap) | request-response | Phase 166 `app/registry/devices/page.tsx` direct-string swap | exact (same file touched in Phase 166 for Hue key; grep confirmed) |
| `app/thermostat/page.tsx` | page (routes-indirection only) | request-response | Phase 166 `app/lights/page.tsx` routes-indirection path | exact |
| `app/components/devices/thermostat/ThermostatCard.tsx` | component (routes-indirection only) | request-response | Phase 166 `useLightsCommands.ts` execute()-via-routes-constant pattern | exact |
| `app/components/netatmo/RoomCard.tsx` | component (routes-indirection, 3 write call sites) | request-response | Phase 166 `useLightsCommands.ts` fetch-with-body pattern | exact |
| `app/components/netatmo/PidAutomationPanel.tsx` | component (routes-indirection + shape read) | request-response | Phase 166 `useLightsData.ts` (if shape unwrap needed downstream) | role-match |
| `app/thermostat/schedule/components/ActiveOverrideBadge.tsx` | component (routes-indirection only) | request-response | Phase 166 `app/components/lights/CreateSceneModal.tsx` | exact |
| `app/thermostat/schedule/components/ScheduleSelector.tsx` | component (routes-indirection only) | request-response | Phase 166 `app/components/lights/CreateSceneModal.tsx` | exact |
| `app/thermostat/schedule/components/ManualOverrideSheet.tsx` | component (routes-indirection only) | request-response | Phase 166 `app/components/lights/CreateSceneModal.tsx` | exact |
| `lib/commands/deviceCommands.tsx` | command-palette string interpolation fix + latent-bug fix | request-response | `executeLightsAction` in the same file (already on `/api/v1/hue/...`) | exact (target lives in the SAME FILE as the analog) |
| `app/sw.ts` | service-worker dead-branch delete | event-handler | Phase 166/167 precedent: Phase 109 Hue `app/sw.ts` stale cache rule deletion | exact (same pattern — `if (url.pathname === '…')` branch removal) |
| `app/thermostat/page.test.tsx` | test mock-URL swap | test | Phase 167 `useSonosCommands.test.ts` string-literal + regex swap | exact |
| `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` | test assertion update + assertion deletion | test | Phase 166 `HueTab.test.tsx` `stringContaining` update | role-match (adds assertion *deletion* for dropped `schedules` key) |
| `app/debug/api/components/tabs/NetatmoTab.tsx` | debug-panel full rewrite + 4 tile drops + 1 tile relabel | request-response | Phase 166 `app/debug/api/components/tabs/HueTab.tsx` | exact |
| `app/debug/components/tabs/NetatmoTab.tsx` | debug-panel full rewrite + 4 tile drops + 1 tile relabel | request-response | Phase 166 `app/debug/components/tabs/HueTab.tsx` | exact (near-duplicate of the `/debug/api/` twin per Phase 166 pattern) |
| `app/api/netatmo/` (entire tree ≈18 route.ts files + `__tests__/`) | legacy-tree deletion | rm -rf + grep sweep | Phase 167 `167-03-PLAN.md` (Sonos legacy tree delete — 7-step safety gate procedure) | exact |

---

## Pattern Assignments

### `app/debug/{api/,/}components/tabs/NetatmoTab.tsx` (debug-panel, request-response)

**Analog:** `app/debug/components/tabs/HueTab.tsx` (Phase 166 output — the rewrite that landed)

**GET-endpoint batch call pattern** (HueTab.tsx lines 53-58) — drops `schedules` per D-10:
```typescript
const fetchAllGetEndpoints = () => {
  fetchGetEndpoint('status', '/api/v1/hue/health');
  fetchGetEndpoint('lights', '/api/v1/hue/lights');
  fetchGetEndpoint('rooms', '/api/v1/hue/groups');
  fetchGetEndpoint('scenes', '/api/v1/hue/scenes');
};
```
Note: demonstrates the "drop a loader call when no v1 equivalent exists" move — the exact shape Netatmo's `schedules` drop takes (RESEARCH A5 line 59).

**EndpointCard lockstep-4-props pattern** (HueTab.tsx lines 150-160) — four refs per tile in lockstep:
```typescript
<EndpointCard
  name="Bridge Status"
  url="/api/v1/hue/health"
  externalUrl="https://api.meethue.com/..."
  response={getResponses.status}
  loading={loadingGet.status ?? false}
  timing={timings.status}
  onRefresh={() => fetchGetEndpoint('status', '/api/v1/hue/health')}
  onCopyUrl={() => copyUrlToClipboard('/api/v1/hue/health')}
  isCopied={copiedUrl === '/api/v1/hue/health'}
/>
```
Pattern note: **4 URL refs per tile** (`url=`, `onRefresh` callback arg, `onCopyUrl` callback arg, `isCopied` comparison). Rewrite all 4 in lockstep or drift accumulates. Each remaining Netatmo tile (health, homesdata, homestatus, valves, camera/status, camera/events, setroomthermpoint, setthermmode) needs this 4-ref swap. RESEARCH A5 table shows exactly which line numbers carry each of the 4 refs per tile.

**POST-tile rewrite pattern** (HueTab.tsx lines 206-230 — "Control Light" section):
```typescript
<PostEndpointCard
  name="Control Light"
  url="/api/v1/hue/lights/[id]/state"
  params={[...]}
  response={postResponses.controlLight}
  loading={loadingPost.controlLight ?? false}
  timing={timings.controlLight}
  onExecute={(values) =>
    callPutEndpoint('controlLight', `/api/v1/hue/lights/${values.lightId}/state`, { /* body */ })
  }
  onCopyUrl={() => copyUrlToClipboard('/api/v1/hue/lights/[id]/state')}
  isCopied={copiedUrl === '/api/v1/hue/lights/[id]/state'}
/>
```
Pattern note: for Netatmo POST tiles (`setthermmode`, `setroomthermpoint`, `calibrate`), same 4-ref lockstep rule applies. The `calibrate` tile additionally needs its URL value swapped from `/api/netatmo/calibrate` → `/api/v1/netatmo/valves/calibrate` (D-04 semantic-equivalent mapping), not a prefix swap.

**Tile-drop pattern** (implicit from Phase 166 — no Hue tile was dropped, but the `schedules` drop is structurally "remove the `<EndpointCard>` block entirely + remove the matching loader call in `fetchAllGetEndpoints`"). The Sonos Phase 167 D-12 "drop legacy-only endpoints with no v1 equivalent" supplies the wave-level discipline.

---

### `app/api/netatmo/` (entire tree) — legacy-tree delete (Wave 3)

**Analog:** `.planning/phases/167-sonos-frontend-cutover/167-03-PLAN.md` Task 1 (Sonos delete)

**7-step safety-gated deletion procedure** (167-03-PLAN.md lines 68-144):

```bash
# Step 1 — Pre-deletion consumer check (BLOCKING):
grep -rn "/api/sonos/" app/ --include="*.ts" --include="*.tsx" | grep -v "app/api/sonos/"
# Expected: zero matches.

# Step 2 — Assert v1 tree exists BEFORE deletion (SAFETY):
ls -d app/api/v1/sonos/
ls app/api/v1/sonos/ | wc -l   # Expect >= 6 entries

# Step 3 — Delete the legacy route tree:
rm -rf app/api/sonos/
# CRITICAL PATH GUARD: path is app/api/sonos/ (NO v1). Deleting app/api/v1/sonos/ is catastrophic.

# Step 4 — Post-deletion repo-wide grep sweep (BLOCKING):
grep -rn "/api/sonos/" app/ lib/ types/ --include="*.ts" --include="*.tsx"
# Expected: zero matches.

# Step 5 — Verify v1 tree intact (SAFETY):
test -d app/api/v1/sonos/ && echo "V1_TREE_OK" || echo "V1_TREE_DESTROYED"

# Step 6 — Run full Jest suite regression (BLOCKING):
npm test

# Step 7 — Run Playwright smoke regression (BLOCKING per SC-4):
npx playwright test --grep @smoke
```

Pattern note: Phase 168 Wave 3 substitutes `netatmo` for `sonos` at every path. **Also delete** the co-located `__tests__/` directories under `app/api/netatmo/setroomthermpoint/__tests__/`, `app/api/netatmo/setthermmode/__tests__/`, plus `__tests__/app/api/netatmo/**` and `__tests__/api/netatmo/**` (RESEARCH Risk 8 + Open Q4 — 11 legacy test files not present in Sonos scope, so plan must explicitly enumerate them or use `rm -rf` on the parent dirs).

**Path-guard phrasing to copy verbatim** (167-03-PLAN.md line 93):
> "CRITICAL PATH GUARD: The path is `app/api/sonos/` (NO `v1`). Double-check before executing. Deleting `app/api/v1/sonos/` would destroy Phase 160's output AND Plan 01's output — catastrophic."

For Phase 168: s/sonos/netatmo/g; s/Phase 160/Phase 161/g; s/Plan 01/21 existing v1 routes/g.

---

### `app/sw.ts` (service-worker, event-handler) — dead branch delete

**Analog:** Same file at lines 596-619 — the `/api/v1/thermorossi/status` branch that IS alive and should be preserved.

**Live branch pattern** (sw.ts lines 595-619) — what to preserve as-is:
```typescript
// Intercept stove status API responses to cache for offline
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Cache stove status responses
  if (url.pathname === '/api/v1/thermorossi/status' && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const clone = response.clone();
            try {
              const data = await clone.json();
              await cacheDeviceState('stove', data);
            } catch {
              // Ignore parsing errors
            }
          }
          return response;
        })
        .catch((error) => {
          throw error;
        })
    );
  }
```

**Dead branch to DELETE** (sw.ts lines 621-641 — the exact block):
```typescript
  // Cache thermostat status responses
  if (url.pathname === '/api/netatmo/status' && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const clone = response.clone();
            try {
              const data = await clone.json();
              await cacheDeviceState('thermostat', data);
            } catch {
              // Ignore parsing errors
            }
          }
          return response;
        })
        .catch((error) => {
          throw error;
        })
    );
  }
});
```

Pattern note: match-by-pathname service-worker branches that reference a path that NEVER EXISTED (`/api/netatmo/status` is not in either legacy or v1 tree per RESEARCH line 427) are removed wholesale. Do NOT replace with `/api/v1/netatmo/homestatus` — that's scope creep (RESEARCH "Pitfall to watch for" at line 441). Leave a one-line breadcrumb comment per CONTEXT "Claude's Discretion" bullet.

Precedent wave note: Phase 109 (Hue) deleted `app/sw.ts` stale cache rules during its legacy-Hue sweep. Phase 168 inherits that precedent.

---

### `lib/routes.ts` (constants indirection)

**Analog:** This file's *existing* `STOVE_ROUTES` block (lines 46-54) — already on v1, shows the target shape:

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

**Current Netatmo block to rewrite** (routes.ts lines 62-75):
```typescript
export const NETATMO_ROUTES = {
  homesData: `${API_BASE}/netatmo/homesdata`,
  homeStatus: `${API_BASE}/netatmo/homestatus`,
  schedules: `${API_BASE}/netatmo/schedules`,       // ← DELETE KEY per D-04
  switchHomeSchedule: `${API_BASE}/netatmo/switchhomeschedule`,
  setRoomThermpoint: `${API_BASE}/netatmo/setroomthermpoint`,
  setThermMode: `${API_BASE}/netatmo/setthermmode`,
  calibrate: `${API_BASE}/netatmo/calibrate`,       // ← VALUE becomes /api/v1/netatmo/valves/calibrate
} as const;
```

**Current Camera block to rewrite** (routes.ts lines 78-87):
```typescript
export const CAMERA_ROUTES = {
  status: `${API_BASE}/netatmo/camera/status`,
  allEvents: `${API_BASE}/netatmo/camera/events`,
  monitoring: `${API_BASE}/netatmo/camera/monitoring`,                       // ← TYPE CHANGE: string → (id) => string
  stream: (cameraId: string): string => `${API_BASE}/netatmo/camera/stream?cameraId=${encodeURIComponent(cameraId)}`,    // ← URL shape: query → path
  snapshot: (cameraId: string): string => `${API_BASE}/netatmo/camera/snapshot?cameraId=${encodeURIComponent(cameraId)}`, // ← same
  eventSnapshot: (eventId: string): string => `${API_BASE}/netatmo/camera/events/${encodeURIComponent(eventId)}/snapshot`,
} as const;
```

Pattern note: **this is the indirection master switch.** Flipping values here cascades to all 16 consumers (RESEARCH B1–B16) without editing their call sites for the pure URL swaps. However, three CAMERA_ROUTES entries require call-site edits because of path-shape changes (RESEARCH D-03): `monitoring` goes from string constant to a function `(cameraId) => ...`; `stream` and `snapshot` change from query-param to path-segment URL shape (the function signature stays the same). Consumers of `CAMERA_ROUTES.monitoring` in CameraCard:111 and CameraDashboard:155 must change `CAMERA_ROUTES.monitoring` → `CAMERA_ROUTES.monitoring(cameraId)` AND drop `camera_id` from the POST body.

---

### `app/components/devices/thermostat/hooks/useThermostatData.ts` (hook, request-response + shape-unwrap)

**Analog (URL-swap mechanics):** Phase 167 `useSonosData.ts` — the file-wide find/replace pattern (Phase 167 Plan 02 Task 1, lines 117-131).

**Analog (shape-unwrap decision):** No exact precedent exists in 166/167 because both went pure URL-swap. RESEARCH Open Q1 recommends option (b) — modify v1 route to emit flattened shape; this preserves the hook unchanged except for the URL.

**Current URL-reference pattern to change** (useThermostatData.ts line 107):
```typescript
const response = await fetch(NETATMO_ROUTES.homesData);
const data = await response.json() as Record<string, unknown>;

if (data['reconnect']) { /* ... */ }
if (!data['error'] && data['home_id']) {
  setConnected(true);
  setTopology(data as unknown as NetatmoTopology);
}
```

**Analog-swap target** (if `lib/routes.ts` indirection is chosen — call site unchanged, reads `data['home_id']` and `data['reconnect']` unchanged). Requires v1 route wrapper to emit `{ home_id, home_name, rooms, modules, schedules }` flattened shape. That route-wrapper edit is analog-free in Phase 166/167 (both left v1 routes thin); it is a Phase 168-specific decision the planner must settle before Wave 2.

**Alternate consumer-rewrite pattern** (if planner chooses Option (a) instead — consumer unwraps raw proxy shape):
```typescript
const response = await fetch(NETATMO_ROUTES.homesData);
const data = await response.json() as { body?: { homes?: Array<{ id: string; name: string; rooms: unknown[]; modules: unknown[]; schedules: unknown[] }> } };
const home = data.body?.homes?.[0];
if (home?.id) {
  setConnected(true);
  setTopology({ home_id: home.id, home_name: home.name, rooms: home.rooms, modules: home.modules, schedules: home.schedules } as NetatmoTopology);
}
```

Pattern note: **this is the phase's only structural divergence from 166/167**. Decision locks before Wave 2 writes. Line 173 (`fetchStatus`) has the same fork.

---

### `lib/hooks/useScheduleData.ts` (hook, endpoint-drop + extract-from-homesdata)

**Analog:** None exact. Closest: Phase 167 D-12 "drop legacy-only endpoints with no v1 equivalent" — dropped the standalone endpoint and nothing replaced it because no consumer depended on it. Netatmo diverges: `useScheduleData` IS a consumer, so the hook rewrites to read schedules from `homesdata` response body.

**Current pattern to rewrite** (useScheduleData.ts line 74):
```typescript
const res = await fetch(NETATMO_ROUTES.schedules);
// then reads data.schedules, data.home_id, data._source
```

**Target pattern** (no direct analog — novel this phase):
```typescript
const res = await fetch(NETATMO_ROUTES.homesData);  // or /api/v1/netatmo/homesdata direct
const data = await res.json() as { body?: { homes?: Array<{ id: string; schedules: unknown[] }> } };
const home = data.body?.homes?.[0];
const schedules = home?.schedules ?? [];
const home_id = home?.id;
```

Pattern note: **endpoint-collapse rewrite**, not prefix swap. Planner must update the hook body; cannot do this via `lib/routes.ts` alone. The `schedules` key in `NETATMO_ROUTES` is deleted entirely.

---

### `app/registry/devices/page.tsx` (page, direct-string swap)

**Analog (same file, prior Hue cutover):** This exact file was touched in Phase 166 Plan 02 Task 1 at line 149 for the Hue branch.

**Hue pattern already landed** (registry/devices/page.tsx lines 148-153):
```typescript
case 'hue': {
  const res = await fetch('/api/v1/hue/lights');
  if (!res.ok) return [];
  const json = (await res.json()) as { lights: { light_id: string; name: string }[] };
  return (json.lights ?? []).map(l => ({ device_id: l.light_id, name: l.name }));
}
```

**Netatmo branch to rewrite** (registry/devices/page.tsx lines 154-159):
```typescript
case 'netatmo': {
  const res = await fetch('/api/netatmo/homesdata');               // ← swap to /api/v1/netatmo/homesdata
  if (!res.ok) return [];
  const json = (await res.json()) as { success: boolean; modules: { id: string; name: string }[] };   // ← shape may need unwrap to body.homes[0].modules if v1 stays thin
  return (json.modules ?? []).map(m => ({ device_id: m.id, name: m.name }));
}
```

Pattern note: exact 1:1 with the Hue sibling branch. The only open question (same as hook): if v1 `homesdata` route stays thin, the destructure `json.modules` must become `json.body?.homes?.[0]?.modules`. Locks to the same decision as useThermostatData.ts.

---

### `app/components/devices/camera/CameraCard.tsx` (component, request-response + image-rendering)

**Analog (path-split + body change):** Phase 166 Plan 02 Task 1 — `app/lights/page.tsx` PUT path split from `/api/hue/lights/${lightId}` → `/api/v1/hue/lights/${lightId}/state`.

**Phase 166 path-split pattern that landed** (from 166-02-PLAN.md D-07 section):
```typescript
// BEFORE:
fetch(`/api/hue/lights/${lightId}`, { method: 'PUT', body: JSON.stringify({...}) })
// AFTER:
fetch(`/api/v1/hue/lights/${lightId}/state`, { method: 'PUT', body: JSON.stringify({...}) })
```

**Netatmo equivalent** — three structural changes in CameraCard.tsx:

1. **Snapshot `<img src>` cache-bust** (CameraCard.tsx line 90):
```typescript
// BEFORE (legacy query-param shape allows `&t=` cache bust):
setSnapshotUrl(CAMERA_ROUTES.snapshot(selectedCameraId) + `&t=${Date.now()}`);
// AFTER (v1 path-segment shape — first query param uses `?`, not `&`):
setSnapshotUrl(CAMERA_ROUTES.snapshot(selectedCameraId) + `?t=${Date.now()}`);
```

2. **Monitoring POST URL + body** (CameraCard.tsx lines 111-118):
```typescript
// BEFORE:
const res = await fetch(CAMERA_ROUTES.monitoring, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    camera_id: selectedCameraId,
    monitoring: newValue ? 'on' : 'off',
  }),
});
// AFTER (URL becomes function; cameraId moves path-segment; body drops camera_id):
const res = await fetch(CAMERA_ROUTES.monitoring(selectedCameraId), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    monitoring: newValue ? 'on' : 'off',
  }),
});
```

3. **Snapshot 302-redirect decision** (RESEARCH Open Q3): if the planner modifies v1 `camera/[cameraId]/snapshot/route.ts` to emit 302 like legacy, the `<img src>` consumer at lines 46/90 is unchanged beyond the cache-bust `?t=` fix. If planner chooses consumer rewrite instead, lines 46/90 become fetch-then-setState. **Recommended option (1) 302-emit** matches the Phase 166 pattern of keeping consumers untouched via route-wrapper preservation.

Pattern note: CameraDashboard.tsx:87, :155 carry the identical 3-change pattern (mirror file — same edits in lockstep).

---

### `lib/commands/deviceCommands.tsx` (command-palette, request-response + latent-bug fix)

**Analog (exact, same file):** The `executeLightsAction` function at lines 88-103 — already migrated to v1 in Phase 166.

**Hue pattern already landed** (deviceCommands.tsx lines 88-103):
```typescript
async function executeLightsAction(endpoint: string, method: string = 'PUT', body: Record<string, unknown> = {}): Promise<unknown> {
  try {
    const response = await fetch(`/api/v1/hue/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(method !== 'GET' && { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (data.error) {
      console.error(`[CommandPalette] Lights ${endpoint} error:`, data.error);
    }
    return data;
  } catch (err) {
    console.error(`[CommandPalette] Lights ${endpoint} failed:`, err);
  }
}
```

**Netatmo function to rewrite** (deviceCommands.tsx lines 68-83):
```typescript
async function executeThermostatAction(endpoint: string, body: Record<string, unknown> = {}): Promise<unknown> {
  try {
    const response = await fetch(`/api/netatmo/${endpoint}`, {     // ← swap to /api/v1/netatmo/${endpoint}
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // ... error handling unchanged
  }
}
```

**Callers with latent-bug fix** (deviceCommands.tsx lines 228, 234, 240 — RESEARCH Risk 9):
```typescript
// BEFORE (all 3 callers pass hyphenated endpoint that never existed on legacy either):
onSelect: async () => { await executeThermostatAction('set-therm-mode', { mode: 'schedule' }); },
onSelect: async () => { await executeThermostatAction('set-therm-mode', { mode: 'away' }); },
onSelect: async () => { await executeThermostatAction('set-therm-mode', { mode: 'hg' }); },
// AFTER (drop hyphens to match real v1 endpoint name):
onSelect: async () => { await executeThermostatAction('setthermmode', { mode: 'schedule' }); },
onSelect: async () => { await executeThermostatAction('setthermmode', { mode: 'away' }); },
onSelect: async () => { await executeThermostatAction('setthermmode', { mode: 'hg' }); },
```

Pattern note: **two bugs fixed in one edit** — the URL prefix swap AND the hyphen removal. Mirrors Phase 166 D-07's dual-change approach (prefix + path split). The analog is literally on adjacent lines in the same file.

---

### `app/thermostat/page.test.tsx` (test, mock-URL swap)

**Analog:** Phase 167 Plan 02 Task 3 — `useSonosCommands.test.ts` string-literal swaps (14 assertions at table in 167-02-PLAN.md lines 274-290).

**Phase 167 test-swap pattern** (from 167-02-PLAN.md Task 3 File 2):
```typescript
// BEFORE:
expect(mockFetch).toHaveBeenCalledWith('/api/sonos/zones/RINCON_A/play', {...});
// AFTER:
expect(mockFetch).toHaveBeenCalledWith('/api/v1/sonos/zones/RINCON_A/play', {...});
```

**Current Netatmo mocks to rewrite** (page.test.tsx lines 18-25):
```typescript
// Mock NETATMO_ROUTES
jest.mock('@/lib/routes', () => ({
  NETATMO_ROUTES: {
    homesData: '/api/netatmo/homes-data',          // ← /api/v1/netatmo/homesdata (DROP hyphen — was always wrong)
    homeStatus: '/api/netatmo/home-status',         // ← /api/v1/netatmo/homestatus
    setThermMode: '/api/netatmo/set-therm-mode',    // ← /api/v1/netatmo/setthermmode
  },
}));
```

Plus line 146 assertion swap and lines 180-189 mock-body-shape update (RESEARCH A4 table).

Pattern note: **double fix** — both the prefix AND the hyphen convention. Analog to the Phase 166 path-split pattern (one edit changes both prefix and shape) and matches Phase 167's regex-lockstep discipline (RESEARCH Risk 4 — "regex `\/api\/sonos\/` is NOT a prefix of `\/api\/v1\/sonos\/`" — same caution applies here if any test uses regex matchers).

---

### `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` (test, assertion update + deletion)

**Analog:** Phase 166 Plan 02 Task 2 — `HueTab.test.tsx` `stringContaining` updates.

**Phase 166 assertion-update pattern** (from 166-02-PLAN.md Task 2):
```typescript
// BEFORE:
expect.stringContaining('/api/hue/lights/')
// AFTER:
expect.stringContaining('/api/v1/hue/lights/')
```

**Current Netatmo assertions to rewrite** (ThermostatCard.schedule.test.tsx lines 211-219):
```typescript
// Line 211 — UPDATE:
expect(NETATMO_ROUTES.switchHomeSchedule).toBe('/api/netatmo/switchhomeschedule');
// → expect(NETATMO_ROUTES.switchHomeSchedule).toBe('/api/v1/netatmo/switchhomeschedule');

// Line 212 — DELETE (schedules key is being removed from NETATMO_ROUTES per D-04):
expect((NETATMO_ROUTES as any).schedules).toBe('/api/netatmo/schedules');

// Lines 215-219 — DELETE entire schedulePostCall block (endpoint dropped):
const schedulePostCall = mockedFetch.mock.calls.find(([url, opts]) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  return urlStr.includes('/api/netatmo/schedules') && (opts as RequestInit)?.method === 'POST';
});
expect(schedulePostCall).toBeUndefined();
```

Pattern note: **assertion-deletion** is novel vs Phase 166/167 which were pure swaps. This is the test-suite side-effect of D-04 dropping `NETATMO_ROUTES.schedules` entirely. Planner must enumerate deletions (not just swaps) in the file list for this test.

---

## Shared Patterns

### File-wide prefix swap (Plan 01/02 mechanic)

**Source:** `.planning/phases/167-sonos-frontend-cutover/167-02-PLAN.md` Task 1 "Implementation approach" (line 146)
**Apply to:** Both debug NetatmoTab files, and (if routes.ts indirection NOT chosen) every production consumer in Group B.

```text
Use the Edit tool with a file-wide old_string: '/api/sonos/' → new_string: '/api/v1/sonos/'
replacement (expecting multiple occurrences). The string '/api/sonos/' does not appear in
any other context in these files — every occurrence is a URL that should be swapped.
```

Pattern note: for Netatmo, substitute `sonos` → `netatmo` in that guidance. However, the CAMERA shape changes (`camera/snapshot`, `/stream`, `/monitoring`) and the three dropped tiles in debug NetatmoTab mean a pure file-wide swap is NOT sufficient for those specific files; use targeted Edits for those and file-wide swap only where every occurrence is unambiguous.

### Pre-/post-deletion grep-sweep gate (Plan 03 mechanic)

**Source:** `.planning/phases/167-sonos-frontend-cutover/167-03-PLAN.md` Task 1 Steps 1 & 4
**Apply to:** Wave 3 Plan 168-03 verification.

```bash
# Pre-deletion (BLOCKING — must return zero before rm -rf):
grep -rn "/api/netatmo/" app/ --include="*.ts" --include="*.tsx" | grep -v "app/api/netatmo/"

# Post-deletion (BLOCKING — must return zero after rm -rf):
grep -rn "/api/netatmo/" app/ lib/ types/ --include="*.ts" --include="*.tsx"
```

Pattern note: second grep widens scope to `lib/` and `types/` because legacy refs can hide in helpers (RESEARCH B2 `lib/commands/deviceCommands.tsx` + B11 `lib/hooks/useRoomStatus.ts` + B12 `lib/hooks/useScheduleData.ts`). The third scope exclusion (`| grep -v ".planning/"`) is implicit because the search paths don't include `.planning/`.

### V1-tree safety assertion (Plan 03 mechanic)

**Source:** `.planning/phases/167-sonos-frontend-cutover/167-03-PLAN.md` Task 1 Step 2 + Step 5
**Apply to:** Wave 3 Plan 168-03, both before and after `rm -rf app/api/netatmo/`.

```bash
# Before:
ls -d app/api/v1/netatmo/
find app/api/v1/netatmo -name route.ts | wc -l   # Expect 21 (Phase 161 + pre-existing)

# After:
test -d app/api/v1/netatmo/ && echo "V1_TREE_OK" || echo "V1_TREE_DESTROYED"
find app/api/v1/netatmo -name route.ts | wc -l   # Expect 21 still
```

Pattern note: guards against the `rm -rf app/api/v1/netatmo/` typo that would delete Phase 161's 21 route wrappers — catastrophic.

### Debug-panel dual-file lockstep

**Source:** `.planning/phases/166-hue-frontend-cutover/166-02-PLAN.md` Task 2 opener: "Both HueTab files are structurally identical — apply the same changes to each."
**Apply to:** `app/debug/api/components/tabs/NetatmoTab.tsx` and `app/debug/components/tabs/NetatmoTab.tsx` (RESEARCH confirmed 42 refs each on identical line numbers).

Pattern note: whichever tile-drop / URL-swap discipline is applied to one file must be applied identically to the other. Drift here would leave one panel broken post-cutover. Dedupe is explicitly deferred per CONTEXT deferred-ideas section.

### Authentication (unchanged)

**Source:** every `app/api/v1/netatmo/*/route.ts` — `withAuthAndErrorHandler` wrapper (Phase 161 output, unchanged).
**Apply to:** N/A — this phase does not touch server routes except to delete legacy ones. The v1 routes are already auth-gated; deletion removes code with identical auth gating.

### Error handling (unchanged at consumer layer)

**Source:** Hue cutover precedent — consumers read `data.error` in both legacy and v1 responses, unchanged. Example from `app/components/netatmo/RoomCard.tsx` line ~105-120.
**Apply to:** All Group B component call sites — keep `if (data.error)` checks unchanged. V1 202 Accepted responses return `data.error === undefined` on success which is still falsy, so legacy checks still work (RESEARCH "Write endpoints" table).

---

## No Analog Found

Files with no close match in the 166/167 precedent (planner should flag these to user before Wave 2):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `useThermostatData.ts` line 107/173 shape-unwrap | hook shape-adapter | request-response + shape-unwrap | Phase 166/167 never needed shape adaptation; v1 routes matched legacy shapes byte-for-byte. Netatmo diverges (RESEARCH Open Q1/Q2). Decision required before writing plans. |
| `useScheduleData.ts` endpoint-collapse | hook endpoint-drop + extract-from-sibling | request-response | Phase 167 dropped endpoints with no consumers; Phase 168 drops `/schedules` with an active consumer that must be rewritten to extract from `homesdata`. Novel. |
| `app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts` 302-redirect modification | server route wrapper shape change | 302-redirect vs JSON | RESEARCH Open Q3 recommendation. Phase 166/167 left v1 routes unchanged — only URLs flipped. Phase 168 may need a route-wrapper edit to preserve `<img src>` compatibility, which has no precedent in 166/167. |
| `app/api/v1/netatmo/homesdata/route.ts` + `homestatus/route.ts` shape-flatten + Firebase side-effect port | server route wrapper enrichment | request-response + side-effect | RESEARCH Open Q1/Q2 recommendation (Option b). Phase 161 left these thin; preserving legacy side-effects (Firebase topology write) requires a wrapper change. Novel to Phase 168. |

---

## Metadata

**Analog search scope:** `.planning/phases/166-hue-frontend-cutover/`, `.planning/phases/167-sonos-frontend-cutover/`, `app/debug/components/tabs/HueTab.tsx`, `app/sw.ts`, `lib/routes.ts`, `lib/commands/deviceCommands.tsx`, `app/registry/devices/page.tsx` (Hue branch), `app/components/devices/thermostat/hooks/useThermostatData.ts`.
**Files scanned:** 14 analogs read + 22 target files cross-referenced against RESEARCH Grep Inventory Groups A–D.
**Pattern extraction date:** 2026-04-20
