# Phase 156: Path Migration & Common Endpoints - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 156-path-migration-common-endpoints
**Areas discussed:** Migration strategy, Path mapping, Aggregated health, Aggregated devices
**Mode:** --auto (all decisions auto-selected)

---

## Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Remove old routes entirely | Delete /api/stove/* after creating /api/v1/thermorossi/*, old paths return 404 | ✓ |
| Redirect old to new | Keep old routes as 301 redirects to new paths | |
| Keep both temporarily | Run old and new in parallel during transition | |

**User's choice:** [auto] Remove old routes entirely (recommended — success criteria requires 404 on old paths, no external consumers)
**Notes:** PWA with single consumer, no backward compatibility needed

---

## Path Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Follow docs exactly | Map to documented paths (commands/ignit, settings/power, fan-level, etc.) | ✓ |
| Keep current names under v1 | Just move /api/stove/setPower → /api/v1/thermorossi/setPower | |

**User's choice:** [auto] Follow docs exactly (recommended — docs/api/thermorossi.md is the canonical API specification)
**Notes:** Significant rename: getPower→power, setFan→settings/fan-level, ignite→commands/ignit, etc.

---

## Aggregated Health

| Option | Description | Selected |
|--------|-------------|----------|
| All registered providers | Check all 8 providers, return per-provider status | ✓ |
| Core providers only | Only check Thermorossi, Netatmo, Hue (most critical) | |

**User's choice:** [auto] All registered providers (recommended — COMMON-01 requirement says "stato aggregato di tutti i provider")
**Notes:** 8 providers: Thermorossi, Netatmo, Fritz!Box, Raspberry Pi, Hue, Sonos, DIRIGERA, Tuya

---

## Aggregated Devices

| Option | Description | Selected |
|--------|-------------|----------|
| Unified list from all providers | Single flat list with provider field per device | ✓ |
| Grouped by provider | Nested object with provider keys | |

**User's choice:** [auto] Unified list from all providers (recommended — COMMON-02 says "lista aggregata")
**Notes:** Existing /api/devices/config and /api/devices/preferences are unrelated device registry config

---

## Claude's Discretion

- Response shapes for /health and /api/v1/devices — follow HA proxy docs
- Error handling — use existing withErrorHandler + success() pattern
- Test file organization — follow existing co-located patterns

## Deferred Ideas

None — all areas within phase scope
