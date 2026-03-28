# Phase 143: Netatmo Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28 (updated from 2026-03-27)
**Phase:** 143-netatmo-migration
**Areas discussed:** Hook extraction, WS payload adapter, Data scope, Consumer unification, Adapter placement, Hook return type, Topology re-fetch, Test mocking, Page.tsx polling normalization
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
| Adapter function in hook | Parse raw Record<string, unknown> envelope into existing internal types within handleMessage | |
| Standalone adapter module | Separate utility file, independently testable | ✓ |
| Zod schema validation | Full runtime validation of WS payload before mapping | |

**User's choice:** [auto-updated] Standalone utility function (D-19)
**Notes:** Reversed from initial auto-selection. The adapter is the most complex of all 6 providers (nested Netatmo envelope → flat internal types). Standalone enables unit testing with raw payload fixtures and is consistent with the lights adapter pattern.

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

## Adapter Placement (new — resolves Claude's Discretion)

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone utility function | Separate file, independently testable, consistent with lights adapter | ✓ |
| Inline in handleMessage | Simpler, fewer files, but harder to test in isolation | |

**User's choice:** [auto] Standalone utility function
**Notes:** Most complex adapter of all 6 providers — standalone enables unit testing with raw payload fixtures

---

## Hook Return Type (new — resolves Claude's Discretion)

| Option | Description | Selected |
|--------|-------------|----------|
| Single hook, full data | Card derives subset; matches useSonosData pattern | ✓ |
| Separate hooks per consumer | useThermostatCardData + useThermostatPageData; more specific but duplicates logic | |

**User's choice:** [auto] Single hook with full data
**Notes:** Consistent with all other provider hooks in the codebase

---

## Topology Re-fetch Strategy (new — resolves Claude's Discretion)

| Option | Description | Selected |
|--------|-------------|----------|
| Fetch on mount only | Structural data, changes rarely; consistent with D-08/D-14 | ✓ |
| Re-fetch after WS updates | More current topology but unnecessary network traffic | |

**User's choice:** [auto] Only on mount
**Notes:** Topology changes only when rooms/devices are added or removed

---

## Test Mocking Approach (new — resolves Claude's Discretion)

| Option | Description | Selected |
|--------|-------------|----------|
| Mock useWebSocketContext with jest.fn | Established pattern from Phase 140-142 tests | ✓ |
| Full WS mock server | More realistic but heavy setup, overkill for unit tests | |

**User's choice:** [auto] Mock useWebSocketContext with jest.fn subscribe/unsubscribe
**Notes:** Adapter gets its own unit tests with raw payload fixtures

---

## Page.tsx Polling Normalization (new — resolves Claude's Discretion)

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate to useAdaptivePolling | Consistent with ThermostatCard, visibility-aware | ✓ |
| Preserve setInterval(30000) | Less change but inconsistent with rest of codebase | |

**User's choice:** [auto] Migrate to useAdaptivePolling
**Notes:** Hook extraction normalises all polling through a single mechanism

---

## Claude's Discretion (remaining)

- Internal naming of adapter helper functions
- Error handling strategy within adapter for malformed payloads

## Deferred Ideas

None — discussion stayed within phase scope
