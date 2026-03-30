# Phase 147: Tuya Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 147-tuya-infrastructure
**Areas discussed:** Response mapping, Route organization, Error handling, Health auth
**Mode:** --auto (all decisions auto-selected with recommended defaults)

---

## Response Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| 200 pass-through | Match upstream Tuya API which returns 200 with data_confirmed field | ✓ |
| 202 Accepted | Follow Thermorossi pattern with suggested_poll_delay_s | |

**User's choice:** [auto] 200 pass-through (recommended default)
**Notes:** Tuya's data_confirmed boolean is a different confirmation pattern from Thermorossi's fire-and-forget. The upstream already handles re-poll and reports success/failure inline.

---

## Route Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Match API spec paths | Nest under app/api/tuya/ with [device_id] dynamic segments | ✓ |
| Flat structure | All routes at top level under app/api/tuya/ | |

**User's choice:** [auto] Match API spec paths (recommended default)
**Notes:** Standard pattern used by all existing providers.

---

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Map to ApiError | Let haClient's RFC 9457 mapping handle all error codes | ✓ |
| Custom error mapping | Add Tuya-specific error handling in proxy or routes | |

**User's choice:** [auto] Map to ApiError (recommended default)
**Notes:** haClient already maps 401, 404, 422, 503 correctly. No Tuya-specific error codes need custom handling.

---

## Health Endpoint Auth

| Option | Description | Selected |
|--------|-------------|----------|
| No auth for health | Skip session check on /api/tuya/health, matching upstream spec | ✓ |
| Auth required | Require session auth on all routes including health | |

**User's choice:** [auto] No auth for health (recommended default)
**Notes:** Upstream health endpoint explicitly requires no authentication per docs/api/tuya.md.

---

## Claude's Discretion

- JSDoc depth, helper organization, test file placement -- deferred to planner/implementer.

## Deferred Ideas

None -- discussion stayed within phase scope.
