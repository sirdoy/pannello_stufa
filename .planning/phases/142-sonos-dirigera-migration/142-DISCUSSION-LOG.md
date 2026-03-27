# Phase 142: Sonos & DIRIGERA Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 142-sonos-dirigera-migration
**Areas discussed:** Sonos data mapping, DIRIGERA data mapping, Side-fetch strategy, Summary derivation
**Mode:** --auto (all decisions auto-selected)

---

## Sonos Data Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Map groups→zones + side-fetch health/playback | WS groups = zones concept, derive counts from array lengths, keep health + playback as HTTP side-fetches | ✓ |
| Full adapter layer | Create adapter that reconstructs full SonosData from WS + multiple HTTP calls | |
| WS-only (drop playback from card) | Only show topology data available from WS, remove nowPlaying | |

**User's choice:** [auto] Map groups→zones + side-fetch health/playback (recommended default)
**Notes:** WS SonosData.groups and HTTP SonosZoneResponse share identical structure (group_id, label, coordinator_uid, members). Direct passthrough with no adapter needed. Playback and health are separate concerns not included in WS topic.

---

## DIRIGERA Data Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Derive summary from raw sensors in-hook | Compute total/offline/low_battery/open counts from DirigeraSensor[] array | ✓ |
| Keep HTTP summary endpoint as side-fetch | Fetch /api/dirigera/sensors/summary alongside WS data | |
| Hybrid (WS counts + HTTP health) | Use WS for sensor counts, HTTP for health endpoint only | |

**User's choice:** [auto] Derive summary from raw sensors in-hook (recommended default)
**Notes:** All summary fields are simple aggregations of sensor array data (filter + count). Computing in-hook eliminates one HTTP round-trip. The HTTP endpoint applies identical server-side logic. Health endpoint still needed as side-fetch since firmware_version and is_reachable aren't in WS payload.

---

## Side-Fetch Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Fire on mount + after each data update | Same pattern as stove scheduler/maintenance (Phase 140) | ✓ |
| Fire on mount only | One-time fetch, rely on WS for ongoing data | |
| Periodic independent fetch | Separate polling loop for side-fetch data | |

**User's choice:** [auto] Fire on mount + after each data update (recommended default)
**Notes:** Consistent with Phase 140/141 pattern. Health status can change independently of device data, so periodic refresh via data-update trigger ensures reasonably fresh health info.

---

## Summary Derivation

| Option | Description | Selected |
|--------|-------------|----------|
| Compute from sensors array | Inline derivation in handleMessage or utility function | ✓ |
| Keep HTTP summary call | Side-fetch /api/dirigera/sensors/summary | |

**User's choice:** [auto] Compute from sensors array (recommended default)
**Notes:** Sensors array from WS contains all fields needed: is_reachable (offline), battery_percentage (low battery), type + is_open (open count). Eliminates unnecessary HTTP call.

---

## Claude's Discretion

- Helper adapter functions vs inline mapping
- Playback side-fetch trigger mechanism (separate useEffect vs inside handleMessage)
- DIRIGERA summary derivation placement (utility function vs inline)
- Test mocking approach
- Visibility-based interval in fallback mode

## Deferred Ideas

None — discussion stayed within phase scope
