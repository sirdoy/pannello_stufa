# Phase 133: Fritz!Box History & Budget - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 133-fritz-box-history-budget
**Areas discussed:** Response transformation, Query parameter forwarding, Auto endpoint normalization, Budget stats caching
**Mode:** Auto (all recommended defaults applied)

---

## Response transformation

| Option | Description | Selected |
|--------|-------------|----------|
| Raw pass-through | No transformation — return HA proxy response as-is | ✓ |
| Transform (bps→Mbps, camelCase) | Convert like existing getBandwidthHistory() | |

**User's choice:** [auto] Raw pass-through (recommended default)
**Notes:** Consistent with Phase 132 D-05 for new endpoints. Transformation belongs in frontend/hooks (Phase 134). Existing getBandwidthHistory() remains for current chart consumers.

---

## Query parameter forwarding

| Option | Description | Selected |
|--------|-------------|----------|
| URLSearchParams pattern | `params?: URLSearchParams` — matches getWifiClients/getDhcpReservations | ✓ |
| Inline string interpolation | `?days=${days}&limit=${limit}` — like getBandwidthHistory() | |

**User's choice:** [auto] URLSearchParams pattern (recommended default)
**Notes:** Consistent pattern across all newer Fritz!Box endpoints. More flexible for optional params.

---

## Auto endpoint normalization

| Option | Description | Selected |
|--------|-------------|----------|
| Expose as-is | Use BandwidthAggregatedRecord with timestamp + granularity discriminator | ✓ |
| Normalize to hourly/daily types | Map to BandwidthHourlyRecord or BandwidthDailyRecord based on granularity | |

**User's choice:** [auto] Expose as-is (recommended default)
**Notes:** The API already provides a clean union type with granularity discriminator. Frontend can switch on the field.

---

## Budget stats caching

| Option | Description | Selected |
|--------|-------------|----------|
| 60s cache (standard) | Same as all other Fritz!Box routes | ✓ |
| No cache (real-time) | Skip getCachedData for budget monitoring accuracy | |

**User's choice:** [auto] 60s cache (recommended default)
**Notes:** Dashboard doesn't need sub-minute accuracy. Consistent with all other routes per Phase 132 D-09.

---

## Claude's Discretion

- JSDoc comments on new client methods
- Exact cache key naming within kebab-case convention
- Whether to reuse existing PaginatedResponse<T> for history endpoints

## Deferred Ideas

- Fritz!Box frontend page enhancements — Phase 134
- Telephony endpoints — excluded from v16.0
