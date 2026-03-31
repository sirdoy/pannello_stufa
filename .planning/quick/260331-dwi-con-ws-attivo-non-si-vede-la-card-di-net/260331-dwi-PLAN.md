---
phase: quick
plan: 260331-dwi
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/devices/camera/hooks/useCameraData.ts
  - app/components/devices/camera/CameraCard.tsx
  - app/components/devices/camera/hooks/useCameraData.test.ts
autonomous: true
requirements: [BUG-camera-visibility]

must_haves:
  truths:
    - "CameraCard renders camera data on homepage regardless of WebSocket connection state"
    - "Camera data refreshes every 60 seconds via useAdaptivePolling (not one-shot fetch)"
    - "Camera data survives React strict mode double-mounting without skipping fetch"
  artifacts:
    - path: "app/components/devices/camera/hooks/useCameraData.ts"
      provides: "Camera data hook with polling"
      exports: ["useCameraData", "UseCameraDataReturn"]
    - path: "app/components/devices/camera/CameraCard.tsx"
      provides: "Camera card consuming useCameraData hook"
  key_links:
    - from: "app/components/devices/camera/hooks/useCameraData.ts"
      to: "/api/netatmo/camera/status"
      via: "fetch in useAdaptivePolling callback"
      pattern: "fetch.*camera.*status"
    - from: "app/components/devices/camera/CameraCard.tsx"
      to: "app/components/devices/camera/hooks/useCameraData.ts"
      via: "useCameraData() hook import"
      pattern: "useCameraData"
---

<objective>
Fix CameraCard not rendering on the home dashboard when WebSocket is active.

Purpose: The camera card uses a fragile one-shot fetch with a connectionCheckedRef guard that fails under React strict mode double-mounting. Unlike all other device hooks, camera has no polling fallback. Extract data fetching into a useCameraData hook using useAdaptivePolling (matching useRaspiData pattern for non-WS devices), so camera data loads reliably regardless of WS state.

Output: New useCameraData hook + simplified CameraCard
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/devices/raspi/hooks/useRaspiData.ts (reference pattern for non-WS device hook with always-active polling)
@app/components/devices/camera/CameraCard.tsx (current component to refactor)
@lib/hooks/useAdaptivePolling.ts (polling infrastructure)
@types/netatmoProxy.ts (CameraStatus and DataFreshness types)
@lib/routes.ts (CAMERA_ROUTES)

<interfaces>
From app/components/devices/raspi/hooks/useRaspiData.ts (reference pattern):
```typescript
export interface UseRaspiDataReturn {
  data: RaspiData | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  health: RaspiHealth;
  lastUpdatedAt: number | null;
}

// Uses useAdaptivePolling with:
useAdaptivePolling({
  callback: fetchData,
  interval,        // 60000 visible, 300000 background
  alwaysActive: false,
  immediate: true,
  initialDelay: 600,
});
```

From types/netatmoProxy.ts:
```typescript
export type DataFreshness = 'LIVE' | 'CACHED' | 'UNREACHABLE';
export interface CameraStatus {
  camera_id: string;
  name: string | null;
  status: string;
  device_type?: string;
  // ... other fields
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create useCameraData hook with useAdaptivePolling</name>
  <files>app/components/devices/camera/hooks/useCameraData.ts, app/components/devices/camera/hooks/useCameraData.test.ts</files>
  <behavior>
    - Test 1: returns loading=true, data=null initially
    - Test 2: after successful fetch, returns cameras array + dataFreshness + connected=true + loading=false
    - Test 3: on fetch error with no prior data, returns error string + connected=false
    - Test 4: on fetch error with prior data, returns stale=true + keeps prior data
    - Test 5: calls useAdaptivePolling with interval=60000, immediate=true, initialDelay=400
  </behavior>
  <action>
Create `app/components/devices/camera/hooks/useCameraData.ts` following the useRaspiData pattern exactly:

1. Define `UseCameraDataReturn` interface:
   - `cameras: CameraStatus[]` (not null, empty array default)
   - `loading: boolean`
   - `error: string | null`
   - `connected: boolean` (true when fetch succeeds)
   - `stale: boolean`
   - `dataFreshness: DataFreshness | null`
   - `lastUpdatedAt: number | null`
   - `refresh: () => Promise<void>` (for manual refresh button)

2. Inside `useCameraData()`:
   - Use `useVisibility()` for interval: `isVisible ? 60000 : 300000`
   - Create `fetchCameras` async function that fetches from `CAMERA_ROUTES.status`, parses response, sets cameras/dataFreshness/connected/error/stale/lastUpdatedAt
   - Keep the existing retry logic (1 retry with 1500ms delay) from the current CameraCard.fetchCameras
   - Use `useAdaptivePolling({ callback: fetchCameras, interval, alwaysActive: false, immediate: true, initialDelay: 400 })`
   - No WebSocket subscription (camera is not a WS topic)
   - No connectionCheckedRef guard (useAdaptivePolling handles mount/unmount correctly)

3. Create test file `app/components/devices/camera/hooks/useCameraData.test.ts` with the behaviors listed above. Mock fetch, useAdaptivePolling, and useVisibility.
  </action>
  <verify>
    <automated>cd /Users/federicomanfredi/Sites/localhost/pannello-stufa && npx jest app/components/devices/camera/hooks/useCameraData.test.ts --no-coverage 2>&1 | tail -20</automated>
  </verify>
  <done>useCameraData hook exists, exports UseCameraDataReturn, uses useAdaptivePolling with 60s interval and immediate=true, all tests pass</done>
</task>

<task type="auto">
  <name>Task 2: Refactor CameraCard to consume useCameraData hook</name>
  <files>app/components/devices/camera/CameraCard.tsx</files>
  <action>
Refactor CameraCard.tsx to use the new useCameraData hook:

1. Remove all inline data fetching state: `loading`, `error`, `connected`, `cameras`, `dataFreshness`, `refreshing`, `connectionCheckedRef`
2. Remove the `fetchCameras` function entirely
3. Remove the mount useEffect with connectionCheckedRef guard
4. Add: `const { cameras, loading, error, connected, stale, dataFreshness, refresh } = useCameraData();`
5. Derive `isStale` from `dataFreshness === 'UNREACHABLE'` (unchanged)
6. Update `handleRefresh` to call `refresh()` from the hook (plus snapshot cache bust logic which stays local)
7. Update the error state's onConnect to call `refresh()` instead of `fetchCameras()`
8. Keep ALL UI rendering logic, snapshot/stream/monitoring logic, and local UI state (selectedCameraId, snapshotUrl, isLiveMode, streamUrl, monitoringOn etc.) exactly as-is
9. Remove the `refreshing` state — use a local `refreshing` flag set around `await refresh()` in handleRefresh

DO NOT change: HlsPlayer usage, snapshot logic, monitoring toggle, camera selector, stream fetching, any visual/UI behavior.
  </action>
  <verify>
    <automated>cd /Users/federicomanfredi/Sites/localhost/pannello-stufa && npx jest --testPathPattern="camera" --no-coverage 2>&1 | tail -20</automated>
  </verify>
  <done>CameraCard imports useCameraData, no connectionCheckedRef, no inline fetchCameras, all camera-related tests pass, component renders identically</done>
</task>

</tasks>

<verification>
1. `npx jest --testPathPattern="camera" --no-coverage` — all camera tests pass
2. Manual: open homepage with WS connected — CameraCard should render camera data
3. Manual: wait 60s — CameraCard should auto-refresh via polling
</verification>

<success_criteria>
- CameraCard displays on homepage regardless of WebSocket connection state
- Camera data polling runs every 60s (visible) / 300s (background) via useAdaptivePolling
- No connectionCheckedRef guard — React strict mode double-mount is safe
- Refresh button still works
- All existing camera UI behavior preserved (snapshot, live, monitoring toggle)
</success_criteria>

<output>
After completion, create `.planning/quick/260331-dwi-con-ws-attivo-non-si-vede-la-card-di-net/260331-dwi-SUMMARY.md`
</output>
