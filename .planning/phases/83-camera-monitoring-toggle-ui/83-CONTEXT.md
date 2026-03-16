# Phase 83: Camera Monitoring Toggle UI - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a monitoring toggle (on/off) to the camera UI so users can enable/disable camera monitoring directly from the app. This completes the CAM-05 E2E flow — the API route (`POST /api/netatmo/camera/monitoring`) and proxy function (`proxySetCameraMonitoring`) already exist; only the frontend toggle is missing. Scope is limited to the toggle control and its integration — no new camera features.

</domain>

<decisions>
## Implementation Decisions

### Toggle placement
- Add monitoring toggle to BOTH CameraCard (homepage) and CameraDashboard (/camera page)
- CameraCard: compact toggle near the camera status badge area
- CameraDashboard: toggle in the selected camera detail panel, near the camera info grid

### Toggle control type
- Use a switch/toggle component — standard on/off pattern matching monitoring semantics
- Disable the toggle when `dataFreshness === 'UNREACHABLE'` (consistent with existing stale-data pattern)
- Disable during API call (loading state)

### Optimistic update behavior
- Optimistic UI: flip the toggle immediately on click, roll back if API call fails
- Show brief error feedback on rollback (toast or inline error)
- Track monitoring state locally after successful toggle (don't refetch full camera status)

### Monitoring state source
- CameraStatus type does NOT include a `monitoring` field — need to determine initial state
- Options: (a) extend the proxy status response to include monitoring, (b) infer from camera `status` field, or (c) fetch monitoring state separately on mount
- Recommended: initialize monitoring state from camera `status` field as best-effort, then track locally after toggle calls. If proxy returns monitoring state in the toggle response, use that as source of truth going forward.

### Claude's Discretion
- Exact switch component implementation (reuse existing UI primitives or create minimal toggle)
- Error feedback mechanism (inline text vs toast)
- Animation/transition for the toggle
- Whether to add a monitoring field to CameraStatus type if proxy already returns it

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Camera monitoring API
- `app/api/netatmo/camera/monitoring/route.ts` — POST endpoint, validates camera_id + monitoring ('on'|'off'), calls proxySetCameraMonitoring
- `__tests__/app/api/netatmo/camera/monitoring.test.ts` — Existing test coverage for the API route
- `lib/netatmoProxy.ts` — proxySetCameraMonitoring function

### Camera UI components
- `app/components/devices/camera/CameraCard.tsx` — Homepage camera card, needs toggle integration
- `app/(pages)/camera/CameraDashboard.tsx` — Full camera page, needs toggle in selected camera panel
- `lib/routes.ts` — CAMERA_ROUTES.monitoring already defined

### Types
- `types/netatmoProxy.ts` — CameraStatus interface (lines 229-238), currently lacks monitoring field

### Prior phase context
- `.planning/phases/77-camera-migration/77-CONTEXT.md` — Camera migration decisions, proxy field naming conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CAMERA_ROUTES.monitoring`: Route constant already defined in `lib/routes.ts`
- `proxySetCameraMonitoring`: Proxy function already available
- `Button` component: Used throughout camera UI for mode toggles (Snapshot/Live)
- `DeviceCard` component: CameraCard wrapper with statusBadge support
- Staleness pattern: `dataFreshness === 'UNREACHABLE'` disables controls — reuse for toggle

### Established Patterns
- Optimistic updates not widely used yet — camera toggle would be first instance, keep simple
- Camera status badge overlay pattern in CameraCard (lines 305-313) — toggle could live nearby
- Camera info grid in CameraDashboard (lines 319-340) — natural place for monitoring toggle row
- Failure-only logging via `adminDbPush` in catch blocks (already in monitoring route)

### Integration Points
- `CameraCard.tsx`: Add toggle near status badge or camera info section
- `CameraDashboard.tsx`: Add toggle in camera detail panel info grid
- `CAMERA_ROUTES.monitoring`: Frontend fetch target for POST calls
- `CameraStatus` type may need `monitoring` field addition if proxy provides it

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 83-camera-monitoring-toggle-ui*
*Context gathered: 2026-03-16*
