# Phase 145: WS Type Alignment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 145-ws-type-alignment
**Areas discussed:** HueData shape, NetatmoData typing, FritzBox enrichment, RaspiData WS shape
**Mode:** --auto (all decisions auto-selected)

---

## HueData Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Keep arrays, add data_freshness | Proxy already flattens to arrays, all consumers iterate arrays — no breakage | [auto] |
| Switch to Record<string, HueLight> dict | Matches raw Bridge v1 format in docs — would break all useLightsData consumers | |

**User's choice:** [auto] Keep arrays, add data_freshness (recommended default)
**Notes:** Breaking all consumers for doc purity is counterproductive. The WS server may send either format; proxy already normalizes to arrays.

---

## NetatmoData Typing

| Option | Description | Selected |
|--------|-------------|----------|
| Proper interface with body/status/time_server/data_freshness | Enables typed access to data_freshness, matches doc | [auto] |
| Keep Record<string, unknown> | No type safety for WS envelope fields | |

**User's choice:** [auto] Proper interface (recommended default)
**Notes:** Doc specifies these fields; typed access enables consistent freshness handling across all providers.

---

## FritzBox Enrichment

| Option | Description | Selected |
|--------|-------------|----------|
| Add all enrichment fields | data_freshness, is_stale, fetched_at on FritzBoxData + custom_name, device_type on FritzBoxDevice | [auto] |
| Add only data_freshness | Minimal change, skip registry metadata | |

**User's choice:** [auto] Add all enrichment fields (recommended default)
**Notes:** Purely additive, no breaking changes. Aligns with all other provider types.

---

## RaspiData WS Shape

| Option | Description | Selected |
|--------|-------------|----------|
| New unified RaspiData interface | Matches doc shape (cpu_percent, memory, disk, system, data_freshness) | [auto] |
| Reuse existing per-endpoint types | Would require composition; doesn't match WS payload shape | |

**User's choice:** [auto] New unified RaspiData interface (recommended default)
**Notes:** WS payload is a single combined object, not 4 separate endpoint responses.

---

## Claude's Discretion

- Import strategy for freshness types (reuse from proxy files vs local definitions)
- Whether to create shared DataFreshness type or keep per-provider

## Deferred Ideas

None
