# Phase 141: Fritz!Box & Hue Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 141-fritz-box-hue-migration
**Areas discussed:** Sparkline buffer preservation, Fritz!Box WS data mapping, Hue WS data shape, Hue connection check
**Mode:** --auto (all selections auto-resolved with recommended defaults)

---

## Sparkline Buffer Preservation

| Option | Description | Selected |
|--------|-------------|----------|
| Convert in handleMessage | bps→Mbps conversion in WS callback, shared buffer append | ✓ |
| Separate adapter layer | Dedicated conversion utility outside the hook | |
| Raw bps sparklines | Store bps natively, convert only for display | |

**User's choice:** [auto] Convert in handleMessage callback (recommended default)
**Notes:** WS `upstream_bps`/`downstream_bps` divided by 1_000_000. Buffer append logic identical to HTTP path. No buffer reset on source transitions.

---

## Fritz!Box WS Data Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Single handleMessage maps all | Devices + bandwidth + wan processed in one callback | ✓ |
| Separate state updaters | Split into per-domain update functions | |

**User's choice:** [auto] Single handleMessage maps all (recommended default)
**Notes:** Category enrichment fires on WS data too (idempotent via enrichedMacsRef). Health computation runs identically regardless of source.

| Option | Description | Selected |
|--------|-------------|----------|
| Enrichment on every WS message | Fire-and-forget, idempotent via enrichedMacsRef | ✓ |
| Enrichment only on HTTP | Skip enrichment for WS data | |
| Enrichment with debounce | Rate-limit enrichment calls | |

**User's choice:** [auto] Enrichment on every WS message (recommended default)

---

## Hue WS Data Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Object.entries in handleMessage | Convert Record→Array inline, add light_id/group_id from key | ✓ |
| Shared adapter module | Dedicated `mapHueWsData()` utility | |
| Accept Record shape | Refactor hook to work with keyed objects | |

**User's choice:** [auto] Object.entries in handleMessage (recommended default)
**Notes:** bri→brightness mapping needed. Scenes NOT in WS payload — fetched via HTTP separately.

---

## Hue Connection Check

| Option | Description | Selected |
|--------|-------------|----------|
| WS readyState + mount check | WS OPEN = connected, initial checkConnection on mount | ✓ |
| Keep periodic status checks | Continue polling /api/hue/status alongside WS | |
| WS only, no status endpoint | Remove checkConnection entirely | |

**User's choice:** [auto] WS readyState + mount check (recommended default)
**Notes:** checkConnection on mount covers pre-WS period. Once WS sends hue snapshot, connection state derives from WS. reconnect flag only relevant in polling fallback.

---

## Claude's Discretion

- Fritz!Box WS mapping: inline vs helper function
- Hue scenes fetch: separate useEffect vs triggered in handleMessage
- Test mocking approach for both hooks
- checkConnection periodicity in WS mode

## Deferred Ideas

None — discussion stayed within phase scope
