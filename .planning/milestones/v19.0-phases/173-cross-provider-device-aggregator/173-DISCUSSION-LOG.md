# Phase 173: Cross-Provider Device Aggregator - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 173-cross-provider-device-aggregator
**Areas discussed:** Item shape, Provider source mapping, Partial failure response, Pagination semantics

---

## Item Shape

### Q: Item shape for cross-provider devices?

| Option | Description | Selected |
|--------|-------------|----------|
| Slim core + optional fields | Required: id, name, provider_type. Optional: ip, mac, status, room, type. Each provider fills what it has. | ✓ |
| Discriminated union by provider_type | Strongly-typed per-provider shape; frontend narrows by provider_type. | |
| Slim core + generic meta blob | Required core + `meta: Record<string, unknown>` blob. | |

**User's choice:** Slim core + optional fields
**Notes:** Backward-compat with current Fritz!Box ip/mac/status fields preserved.

### Q: ID strategy — how to identify a device uniquely across providers?

| Option | Description | Selected |
|--------|-------------|----------|
| Composite id: `{provider_type}:{native_id}` | Guarantees global uniqueness across providers; stable frontend key. | ✓ |
| Native id only | Each provider returns its own id verbatim; frontend keys on (provider_type, id) pair. | |

**User's choice:** Composite id

### Q: Which optional fields belong in the canonical contract?

| Option | Description | Selected |
|--------|-------------|----------|
| ip, mac (network) | Populated by Fritz!Box, Tuya plugs. | ✓ |
| status (online/offline) | 0/1 like current Fritz!Box. | ✓ |
| type (device subtype) | 'light', 'thermostat', 'sensor', etc. | ✓ |
| room (location label) | Provider-supplied room string. | ✓ |

**User's choice:** All four (multi-select)

---

## Provider Source Mapping

### Q: Provider list — which providers contribute items?

| Option | Description | Selected |
|--------|-------------|----------|
| Match /health: all 8 providers | Fritz!Box, Hue, Sonos, Netatmo, DIRIGERA, Tuya, Raspi, Thermorossi. | ✓ |
| ROADMAP literal: 7 providers | Excludes Thermorossi. | |
| Network-capable only | Skips Thermorossi AND Raspi (1-item providers). | |

**User's choice:** All 8 providers (match /health)

### Q: Hue contribution — what counts as a device?

| Option | Description | Selected |
|--------|-------------|----------|
| Lights only | getLights() → one item per light. | ✓ |
| Lights + groups | Both contribute; groups get type='group'. | |

**User's choice:** Lights only

### Q: Sonos contribution?

| Option | Description | Selected |
|--------|-------------|----------|
| Speakers only via getDevices() | Physical speakers; zones excluded. | ✓ |
| Speakers + zones | Both contribute. | |

**User's choice:** Speakers only

### Q: Netatmo contribution — thermostats/valves/cameras?

| Option | Description | Selected |
|--------|-------------|----------|
| Thermostats + valves only | Climate-control modules from getProxyHomestatus(). | |
| Thermostats + valves + cameras | Everything Netatmo exposes. Cameras get type='camera'. | ✓ |
| Thermostats only | Skip valves and cameras. | |

**User's choice:** Thermostats + valves + cameras

### Q: DIRIGERA contribution?

| Option | Description | Selected |
|--------|-------------|----------|
| All sensors via getSensors() | Contact + motion + any other sensors; finer type if available. | ✓ |
| Contact + motion only | Skip generic sensors. | |

**User's choice:** All sensors via getSensors()

### Q: Tuya contribution — type granularity?

| Option | Description | Selected |
|--------|-------------|----------|
| type='plug' for all | All Tuya items get type='plug'. | ✓ |
| Derive type from device category | Use Tuya category code if present, fallback 'plug'. | |

**User's choice:** type='plug' for all

### Q: Raspi & Thermorossi — single-device providers, what shape?

| Option | Description | Selected |
|--------|-------------|----------|
| 1 item each, descriptive type | Raspi type='host', Thermorossi type='stove'. | ✓ |
| Use a generic 'system' type for both | type='system' for both. | |

**User's choice:** 1 item each, descriptive type

### Q: Netatmo native id — what to use?

| Option | Description | Selected |
|--------|-------------|----------|
| Module _id from homestatus | netatmo:{module_id}; cameras use camera_id. | ✓ |
| Combine home_id + module_id | Belt-and-suspenders for multi-home setups. | |

**User's choice:** Module _id from homestatus (single-home assumption)

---

## Partial Failure Response

### Q: How to surface partial provider failures in the response?

| Option | Description | Selected |
|--------|-------------|----------|
| Include errors[] alongside items | `{ items, total_count, limit, offset, errors: [{provider_type, message}] }`. | ✓ |
| Silent drop | Failed providers contribute zero items, no signal in response body. | |
| providers map (mirror /health shape) | `{ items, providers: { fritzbox: 'ok'\|'down', ... } }`. | |

**User's choice:** Include errors[] alongside items

### Q: Provider-call timeout?

| Option | Description | Selected |
|--------|-------------|----------|
| No explicit timeout | Trust HA proxy + haClient defaults. | ✓ |
| Per-provider timeout (e.g., 5s) | Wrap each call in Promise.race with timeout. | |

**User's choice:** No explicit timeout

### Q: What to log on provider failure?

| Option | Description | Selected |
|--------|-------------|----------|
| console.warn with provider_type + error message | Matches /health pattern. | ✓ |
| Silent (no log) | errors[] in response is the only signal. | |

**User's choice:** console.warn with provider_type + error message

---

## Pagination Semantics

### Q: When does limit/offset apply?

| Option | Description | Selected |
|--------|-------------|----------|
| Post-merge slice | Fetch all, concatenate, then apply offset and limit. | ✓ |
| Per-provider proportional split | Allocate limit across providers proportionally. | |
| No pagination — always return all | Drop limit/offset support. | |

**User's choice:** Post-merge slice

### Q: Default sort order before pagination?

| Option | Description | Selected |
|--------|-------------|----------|
| By provider_type, then name | Stable, deterministic; groups easily. | ✓ |
| By name only | Alphabetical across all providers. | |
| Insertion order (no sort) | Order = Promise.allSettled completion order. | |

**User's choice:** By provider_type, then name

### Q: Limit bounds enforcement?

| Option | Description | Selected |
|--------|-------------|----------|
| Clamp to doc bounds: 1–1000, default 100 | Match existing docs/api/README.md contract. | ✓ |
| Accept any positive integer, no upper bound | Trust client. | |

**User's choice:** Clamp to doc bounds

### Q: Out-of-bounds limit — clamp or reject?

| Option | Description | Selected |
|--------|-------------|----------|
| Clamp silently | limit=0→1, limit=2000→1000, limit=-5→100. | ✓ |
| Reject with 400 RFC 9457 problem | Strict contract enforcement. | |

**User's choice:** Clamp silently

### Q: Invalid offset behavior?

| Option | Description | Selected |
|--------|-------------|----------|
| Negative → 0; beyond total → empty items, total_count still real | Lenient mirror of limit clamping. | ✓ |
| Reject negative or out-of-range with 400 | Strict validation. | |

**User's choice:** Lenient (clamp negative, empty result beyond total)

### Q: Add ?provider_type= filter param?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — single value filter | `?provider_type=hue` returns only Hue items; skips fan-out for excluded providers. | ✓ |
| No — keep contract minimal | Frontend filters client-side. | |

**User's choice:** Yes — single value filter

---

## Claude's Discretion

- Whether to omit absent optional fields entirely or include them as `null` (planner picks one consistent convention).
- Per-provider mapper file organization: inline in route.ts vs. new `lib/devices/mappers/` directory.
- Whether `errors[]` carries the raw error message or a sanitized form.
- Test file location: `__tests__/api/v1/devices/aggregator.test.ts` or co-located.

## Deferred Ideas

- Per-provider timeout (revisit if production latency degrades).
- Response caching / ETag / 304.
- Multi-value `?provider_type=` filter (single-value only for v1).
- Cross-provider device identity / dedup.
- Frontend unified devices page (no current consumer).
- Discriminated-union typing per provider_type (could overlay later).
