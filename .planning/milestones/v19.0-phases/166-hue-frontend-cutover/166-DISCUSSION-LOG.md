# Phase 166: Hue Frontend Cutover - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 166-hue-frontend-cutover
**Areas discussed:** Missing v1 routes, URL mapping, Firebase logging, Legacy cleanup, Debug panels
**Mode:** --auto (all decisions auto-selected)

---

## Missing V1 Routes

| Option | Description | Selected |
|--------|-------------|----------|
| Create in this phase | Add lights-list and scenes-list v1 routes as part of cutover | ✓ |
| Separate gap closure phase | Create a dedicated phase for missing routes first | |

**User's choice:** [auto] Create in this phase (recommended — needed for hooks, small scope)
**Notes:** Only 2 routes missing (GET /api/v1/hue/lights, GET /api/v1/hue/scenes). Proxy functions already exist.

---

## URL Mapping Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Direct rewrite | Find-and-replace legacy paths in hooks/pages with v1 equivalents | ✓ |
| Adapter layer | Create URL mapping middleware to redirect legacy→v1 | |

**User's choice:** [auto] Direct rewrite (recommended — same pattern as thermorossi cutover Phase 164)
**Notes:** 8 files to modify. Path split for lights PUT (→/state) is the only non-trivial mapping.

---

## Firebase Command Logging

| Option | Description | Selected |
|--------|-------------|----------|
| Already server-side | V1 write routes have adminDbPush — no frontend changes needed | ✓ |
| Add client-side logging | Duplicate logging in frontend hooks | |

**User's choice:** [auto] Already server-side (recommended — v1 routes already log)
**Notes:** Confirmed: lights/[lightId]/state, groups/[groupId]/action, groups/[groupId]/scenes/[sceneId] all call adminDbPush.

---

## Legacy Route Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Delete in this phase | Remove entire app/api/hue/ tree after cutover | ✓ |
| Keep for backwards compat | Leave legacy routes alongside v1 | |

**User's choice:** [auto] Delete in this phase (recommended — clean break, matches Phase 164 pattern)
**Notes:** Phase 159 D-01 said "do NOT delete old routes" — that was deliberate for backwards compat during transition. Phase 166 completes the transition.

---

## Debug Panel Updates

| Option | Description | Selected |
|--------|-------------|----------|
| Include in cutover | Rewrite both HueTab files (~15 URL refs each) | ✓ |
| Defer to separate phase | Leave debug panels on legacy paths | |

**User's choice:** [auto] Include (recommended — known blind spot from v14.0 audit)
**Notes:** Two identical HueTab.tsx files + their test files. Debug panels were migration blind spots in v14.0.

---

## Claude's Discretion

- Response shape alignment if v1 health returns different fields than legacy status
- Test assertion URL updates
- Execution order (create routes → rewrite frontend → delete legacy)
