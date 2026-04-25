# Phase 173: Cross-Provider Device Aggregator - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand `GET /api/v1/devices` from a Fritz!Box-only implementation to a cross-provider aggregator. The route fans out across all 8 registered device providers via `Promise.allSettled`, normalizes each provider's items into a unified shape carrying a `provider_type` discriminator, tolerates partial provider failures (200 with `errors[]`), and returns a sorted/paginated list. Closes v19.0 audit COMMON-02 partial gap.

In scope:
- Rewriting `app/api/v1/devices/route.ts` as multi-provider aggregator
- Adding per-provider device-mapper functions (one per provider)
- Updating the documented Device shape in `docs/api/README.md` to match the new contract
- Unit tests covering each provider's contribution shape + a failed-provider scenario
- Optional `?provider_type=` filter param

Out of scope:
- Frontend consumers of `/api/v1/devices` (no current consumers; future phase if needed)
- Cross-provider device deduplication / identity matching
- Caching layer / ETag / 304 handling
- Per-provider write/control endpoints (already exist on dedicated routes)

</domain>

<decisions>
## Implementation Decisions

### Item Shape
- **D-01:** Slim core + optional fields. Every item has required `id`, `name`, `provider_type`. Optional fields per item: `ip`, `mac`, `status` (0|1), `type`, `room`. Each provider populates the optional fields it can; absent ones are omitted (or `null` — planner picks one consistent convention, prefer omission for smaller payloads).
- **D-02:** `id` is composite: `{provider_type}:{native_id}` (e.g., `fritzbox:AA:BB:CC:DD:EE:FF`, `hue:1`, `netatmo:09:00:00:01:23:45`, `raspi:host`, `thermorossi:stove`). Guarantees global uniqueness across providers; frontend can stable-key on `id` directly.
- **D-03:** `provider_type` is one of the literal strings: `'fritzbox' | 'hue' | 'sonos' | 'netatmo' | 'dirigera' | 'tuya' | 'raspi' | 'thermorossi'`. Define as a TypeScript union exported alongside the `Device` interface.

### Provider Source Mapping
- **D-04:** All 8 providers contribute (matches `/health` fan-out symmetry): Fritz!Box, Hue, Sonos, Netatmo, DIRIGERA, Tuya, Raspi, Thermorossi. `provider_type` literal mirrors the directory name.
- **D-05:** **Fritz!Box** — `fritzboxClient.getDevices()`. Each network device → one item. Populate `ip`, `mac`, `name`, `status` (1 if active, 0 otherwise), `type='network_device'`. No `room`.
- **D-06:** **Hue** — `getLights()` only. Groups and scenes are NOT devices. Each light → one item. `name` from light name, `status` from reachable, `type='light'`, `room` from group membership if available; `ip`/`mac` omitted.
- **D-07:** **Sonos** — `getDevices()` only (physical speakers). Zones are NOT devices. Each speaker → one item. `name` from speaker name, `room` from speaker room field, `type='speaker'`, `status` from reachable; `ip`/`mac` omitted.
- **D-08:** **Netatmo** — three sources merged: thermostats + valves (from `getProxyHomestatus()` modules, filter by module type) + cameras (from `getProxyCameraStatus()`). Each → one item. `id` composite uses module `_id` (or camera `camera_id`). `name` from module name, `room` from room mapping, `type='thermostat'|'valve'|'camera'`, `status` from reachable. `ip`/`mac` omitted (single-home assumption — no `home_id` qualifier needed in id).
- **D-09:** **DIRIGERA** — `getSensors()` (all sensor types). Each sensor → one item. `name` from sensor name, `room` from room field, `type='contact_sensor'|'motion_sensor'|'sensor'` (use the most specific known type, fallback `'sensor'`), `status` from reachable; `ip`/`mac` omitted.
- **D-10:** **Tuya** — `getPlugs()`. Each plug → one item. `type='plug'` for all (uniform), `name` from plug name, `ip` from plug data, `status` from online state; `mac` if exposed by plug payload, otherwise omitted; no `room`.
- **D-11:** **Raspi** — single item. `id='raspi:host'`, `name='Raspberry Pi'`, `type='host'`, `status` from `raspiClient.getHealth()` result (1 ok, 0 down). No `ip`/`mac`/`room`.
- **D-12:** **Thermorossi** — single item. `id='thermorossi:stove'`, `name='Stufa'` (or pulled from status payload if exposed), `type='stove'`, `status` from `getHealth()` result (1 ok, 0 down). No `ip`/`mac`/`room`.

### Partial Failure Response
- **D-13:** Response shape extended with `errors: Array<{ provider_type, message }>`. Empty array means all providers succeeded. Failed providers contribute zero items but are surfaced in `errors[]`. HTTP status stays **200** even when one or more providers fail (per ROADMAP success criterion #3).
- **D-14:** No explicit per-provider timeout. Trust `haClient` defaults and `Promise.allSettled` semantics. If a provider hangs beyond `haClient`'s internal timeout, it surfaces as a rejected promise → goes into `errors[]`.
- **D-15:** Failures logged via `console.warn` with `provider_type` + error message. Mirrors the diagnostic pattern in `app/health/route.ts`. No PII risk — these are infra errors only.

### Pagination & Filtering
- **D-16:** **Post-merge slice.** Fetch all items from all providers (parallel via `Promise.allSettled`), sort, then apply `offset` and `limit`. `total_count` reflects the full merged length BEFORE pagination (so frontend knows true total).
- **D-17:** **Default sort:** by `provider_type` (alphabetical) then by `name` (locale-sensitive Italian, matching the rooms page convention from Phase 122). Deterministic across requests so pagination is stable.
- **D-18:** **Limit clamping:** valid range 1–1000 (matches docs/api/README.md), default 100. Out-of-range values clamped silently (limit=0→1, limit=2000→1000, limit=-5→100). No 400 for honest mistakes.
- **D-19:** **Offset handling:** negative offset clamped to 0; offset beyond `total_count` returns 200 with `items: []` and `total_count` still reflecting the real total.
- **D-20:** **`?provider_type=` filter:** single-value query param (e.g., `?provider_type=hue`). When set, skip fan-out to excluded providers (perf win — only call the requested provider). Invalid `provider_type` value returns 200 with `items: []`, `total_count: 0`, `errors: []` (consistent with empty-result semantics).

### Documentation Update (in scope)
- **D-21:** `docs/api/README.md` §GET /api/v1/devices must be updated to match the new contract: revised `Device` interface (slim core + optional fields), revised example showing items from multiple providers, documented `errors[]` field, documented `?provider_type=` filter. Doc update is part of this phase, not deferred.

### Claude's Discretion
- Whether to omit absent optional fields entirely or include them as `null` — pick one and apply uniformly across all provider mappers.
- Per-provider mapper file organization: inline in route.ts vs. one file per provider in a new `lib/devices/mappers/` directory. Planner picks based on size estimate.
- Whether `errors[]` carries the raw error message or a sanitized form.
- Test file location: `__tests__/api/v1/devices/aggregator.test.ts` or co-located with the route — follow existing project convention.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Contract & Requirements
- `docs/api/README.md` §GET /api/v1/devices — Current documented contract (will be updated per D-21)
- `.planning/REQUIREMENTS.md` §COMMON-02 — Acceptance: aggregated cross-provider device list
- `.planning/ROADMAP.md` §Phase 173 — Goal + 4 success criteria (Promise.allSettled, provider_type, partial-failure 200, unit tests)

### Prior Phase Decisions (carried forward)
- `.planning/phases/156-path-migration-common-endpoints/156-CONTEXT.md` §D-07 — Origin decision creating `/api/v1/devices` as new aggregator endpoint distinct from device registry routes

### Implementation Precedent
- `app/health/route.ts` — Canonical 8-provider `Promise.allSettled` fan-out template; mirror its structure for the devices aggregator
- `app/api/v1/devices/route.ts` — Existing Fritz!Box-only implementation to evolve (route shell + auth wrapper stay)

### Provider Proxy Modules (each provides the source function for its mapper)
- `lib/fritzbox/fritzboxClient.ts` → `getDevices()`
- `lib/hue/hueProxy.ts` → `getLights()`
- `lib/sonos/sonosProxy.ts` → `getDevices()`
- `lib/netatmo/netatmoProxy.ts` → `getProxyHomestatus()`, `getProxyCameraStatus()`
- `lib/dirigera/dirigeraProxy.ts` → `getSensors()`
- `lib/tuya/tuyaProxy.ts` → `getPlugs()`
- `lib/raspi/raspiClient.ts` → `getHealth()` (single-item provider)
- `lib/stove/thermorossiProxy.ts` → `getHealth()` (single-item provider)

### Route Conventions
- `lib/core` → `withAuthAndErrorHandler`, `success()` — Standard route wrapper used everywhere
- `docs/api-routes.md` — Project API route conventions
- `lib/types/common.ts` — Existing `PaginatedResponse<T>` shape (extend with `errors[]` for this endpoint)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **All 8 provider proxy modules** already expose the listing functions needed (see canonical_refs). No new proxy work required.
- **`app/health/route.ts`** — direct template for the fan-out pattern (`Promise.allSettled` over 8 named promises, then map results to a per-provider status object).
- **`lib/core` route helpers** — `withAuthAndErrorHandler` and `success()` already used by the current `/api/v1/devices` route.
- **`lib/types/common.ts` `PaginatedResponse<T>`** — extend (or compose with) for the new shape that adds `errors[]`.

### Established Patterns
- **Promise.allSettled fan-out** — `app/health/route.ts` is the canonical example. Each result mapped by index to a typed key.
- **Function-module proxy clients** — every provider exposes named exports (e.g., `getLights`), not a class. Mappers can import what they need without instantiation.
- **`console.warn` for infra failures** — used across `/health` and other aggregator-style code; not a logging service abstraction.
- **RFC 9457 problem details** — error responses use this format via `lib/core`. Apply only if rejecting a request entirely (not for per-provider partial failures, which go in `errors[]`).
- **Italian locale sort** — Phase 122 rooms page sorts with `localeCompare('it')`; reuse for `name` ordering.

### Integration Points
- **Single file replaced:** `app/api/v1/devices/route.ts` — current 47-line Fritz!Box-only impl gets fully rewritten.
- **New mapper code:** either inline in route.ts or in a new `lib/devices/mappers/` directory (Claude's discretion D-21).
- **Doc update:** `docs/api/README.md` §GET /api/v1/devices section — replace example + Device interface + add errors[] + filter docs.
- **Tests:** new test file under `__tests__/` mirroring existing aggregator test patterns.

### Constraints / Notes
- No frontend consumer of `/api/v1/devices` exists today — contract change is safe (no migration burden).
- `lib/core` `success()` returns a typed wrapper — verify it can carry the extended shape (or use a typed helper that accepts the new fields). The route currently calls `success({ items, total_count, limit, offset })`; we add `errors`.
- All provider proxies go through `haClient` with `X-API-Key` auth; no per-provider credential handling needed at the aggregator.

</code_context>

<specifics>
## Specific Ideas

- Composite id format `{provider_type}:{native_id}` — exact, no separator alternatives.
- Sort: provider_type ASC, then name ASC (Italian locale).
- Limit default 100, range 1–1000, clamp silently.
- `errors[]` shape: `Array<{ provider_type: ProviderType, message: string }>`, empty when all succeed.
- Status field semantics: `1 = online/reachable/ok`, `0 = offline/unreachable/down`. For single-item providers (Raspi, Thermorossi), derive from health call result.

</specifics>

<deferred>
## Deferred Ideas

- **Per-provider timeout** — discussed and deferred. Trust `haClient` defaults for now. Revisit if a slow provider degrades aggregator latency in production.
- **Response caching / ETag / 304** — out of scope. Phase focuses on correctness; perf optimization can come later if request volume warrants.
- **Multi-value `?provider_type=` filter** (e.g., `?provider_type=hue,sonos`) — single-value only for v1. Multi-value can be added without breaking the contract.
- **Cross-provider device identity / dedup** — out of scope. A Tuya plug and a Fritz!Box network entry for the same physical device remain two separate items.
- **Frontend consumer (UI page listing all devices grouped by provider)** — no current consumer; if a unified devices page is desired, that's a future UI phase.
- **Discriminated-union typing per provider_type** — considered for item shape; rejected in favor of slim core + optional fields. Could be added later as a stricter overlay if frontend type-safety becomes a pain point.

</deferred>

---

*Phase: 173-cross-provider-device-aggregator*
*Context gathered: 2026-04-25*
