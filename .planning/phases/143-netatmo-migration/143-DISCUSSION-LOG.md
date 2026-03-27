# Phase 143: Netatmo Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 143-netatmo-migration
**Areas discussed:** Hook extraction, WS payload adapter, Data scope, Consumer unification
**Mode:** Auto (all recommended defaults selected)

---

## Hook Extraction Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Extract hook first, then WS migrate | 2-plan approach: Plan 1 extracts useThermostatData from inline code, Plan 2 adds WS primary | ✓ |
| Combined extraction + WS | Single plan doing both extraction and WS migration simultaneously | |
| Migrate inline without hook | Add WS subscription directly in ThermostatCard and page.tsx | |

**User's choice:** [auto] Extract hook first, then WS migrate (recommended default)
**Notes:** Matches the 2-plan pattern established in phases 140-142. Netatmo is unique among all 7 providers in having no dedicated data hook — extraction is a prerequisite.

---

## WS Payload Adapter

| Option | Description | Selected |
|--------|-------------|----------|
| Adapter function in hook | Parse raw Record<string, unknown> envelope into existing internal types within handleMessage | ✓ |
| Standalone adapter module | Separate lib/netatmo/netatmoWsAdapter.ts utility | |
| Zod schema validation | Full runtime validation of WS payload before mapping | |

**User's choice:** [auto] Adapter function in hook (recommended default)
**Notes:** The WS payload is the raw Netatmo cloud API response (body.home.rooms/modules). Adapter maps to existing NetatmoProxyRoomMeasurement and module shapes. Most complex adapter of all 6 providers due to untyped payload.

---

## Data Scope (WS vs HTTP)

| Option | Description | Selected |
|--------|-------------|----------|
| homestatus via WS, rest HTTP | WS for room temps/heating/modules; homesdata/schedules/health stay HTTP | ✓ |
| All Netatmo data via WS | Wait for expanded WS payload (not currently supported) | |
| WS for status + topology | Fetch homesdata through WS too (not in current WS spec) | |

**User's choice:** [auto] homestatus via WS, rest HTTP (recommended default)
**Notes:** The WS netatmo topic only includes homestatus data per the spec. Topology (homesdata) changes rarely and is fetched on mount only. Schedules and commands remain HTTP.

---

## Consumer Unification

| Option | Description | Selected |
|--------|-------------|----------|
| Both consume useThermostatData | ThermostatCard and page.tsx share the hook; page adds page-specific fetches | ✓ |
| Separate hooks per consumer | useThermostatCardData and useThermostatPageData | |
| Keep page.tsx inline | Only extract hook for ThermostatCard, leave page.tsx as-is | |

**User's choice:** [auto] Both consume useThermostatData (recommended default)
**Notes:** Follows the established pattern where dashboard cards and detail pages share the same data hook. Page.tsx retains additional topology/schedule management logic.

---

## Claude's Discretion

- Adapter function structure (standalone vs inline)
- Hook return type design for dual consumers
- Topology re-fetch strategy
- Test mocking approach
- Page.tsx polling normalisation to useAdaptivePolling

## Deferred Ideas

None
