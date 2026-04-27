# Phase 162: Fritz!Box Gap Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 162-fritz-box-gap-closure
**Areas discussed:** Telephony data model, Raw history overlap, Service discovery format, Route structure
**Mode:** --auto (all decisions auto-selected)

---

## Telephony Data Model

| Option | Description | Selected |
|--------|-------------|----------|
| Raw pass-through | No transformation, return HA proxy JSON as-is | ✓ |
| CamelCase transform | Convert snake_case to camelCase like early endpoints | |

**User's choice:** [auto] Raw pass-through (recommended default — consistent with phase 133+ pattern)
**Notes:** Matches D-05 convention from earlier Fritz!Box phases. All FRITZ-07+ endpoints use raw pass-through.

---

## Raw History Overlap

| Option | Description | Selected |
|--------|-------------|----------|
| New functions if endpoints differ, skip if covered | Check HA proxy for distinct endpoints before adding | ✓ |
| Always add new functions | Create separate functions regardless of overlap | |

**User's choice:** [auto] New functions only if distinct endpoints exist (recommended default — avoid duplication)
**Notes:** getBandwidthHistory and getDeviceEvents already exist. Researcher should verify HA proxy endpoint availability.

---

## Service Discovery Format

| Option | Description | Selected |
|--------|-------------|----------|
| Parse XML to JSON | Client function converts TR-064 XML to structured JSON | ✓ |
| Return raw XML | Pass XML string through, let consumer handle parsing | |

**User's choice:** [auto] Parse to JSON (recommended default — all other endpoints return JSON)
**Notes:** Consistency with existing API surface. Frontend consumers expect JSON.

---

## Route Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Nested telephony, flat service-discovery | /telephony/dect, /telephony/calls, /telephony/tam, /service-discovery | ✓ |
| All flat | /dect, /calls, /tam, /service-discovery | |

**User's choice:** [auto] Nested telephony, flat service-discovery (recommended default — groups related telephony endpoints)
**Notes:** Matches success criteria URL structure from ROADMAP.md.

---

## Claude's Discretion

- TypeScript interface naming
- Test file placement
- Whether to extend fritzboxClient object or create sub-module

## Deferred Ideas

None — discussion stayed within phase scope.
