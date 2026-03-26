# Phase 132: Fritz!Box System & Network Services - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 132-fritz-box-system-network-services
**Mode:** Auto (--auto flag, all decisions auto-resolved with recommended defaults)
**Areas discussed:** Type organization, Response transformation, Rate limiting & caching, Client extension approach

---

## Client Extension Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Add to existing fritzboxClient | Extend the exported object in fritzboxClient.ts with 7 new methods | ✓ |
| Create new module | New file like fritzboxSystemClient.ts or fritzboxAdvancedClient.ts | |
| Separate proxy file | Create fritzboxProxy.ts matching Sonos/DIRIGERA pattern | |

**User's choice:** [auto] Add to existing fritzboxClient (recommended — single file, consistent export pattern, no new import paths)
**Notes:** Fritz!Box already has an established client object pattern with 6 methods. Adding to it avoids fragmentation.

---

## Type Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Inline types in client | Keep types as haGet generic parameters, matching current pattern | ✓ |
| Dedicated types file | Create types/fritzboxProxy.ts like Sonos/DIRIGERA | |
| Shared + inline hybrid | Extract common types (PaginatedResponse) to shared, keep endpoint-specific inline | |

**User's choice:** [auto] Inline types in client (recommended — 6 existing methods all use inline types, no separate file exists)
**Notes:** Sonos/DIRIGERA created separate type files because they were new providers. Fritz!Box extends existing infrastructure.

---

## Response Transformation

| Option | Description | Selected |
|--------|-------------|----------|
| Pass through raw | Return API responses as-is, no camelCase or unit conversion | ✓ |
| Transform all | Apply camelCase + unit conversion like bandwidth/device methods | |
| Transform selectively | Only transform fields consumed by charts/hooks | |

**User's choice:** [auto] Pass through raw (recommended — admin/config data doesn't need chart-friendly shapes)
**Notes:** Existing transformations (bps→Mbps, snake_case→camelCase) serve specific chart consumers. New endpoints return config data.

---

## Rate Limiting & Caching

| Option | Description | Selected |
|--------|-------------|----------|
| All routes: rate limit + cache | Every route gets both, matching existing Fritz!Box pattern | ✓ |
| Selective caching | Only cache slow-changing data (system, wifi/networks, mesh) | |
| No caching for network config | Skip cache for DHCP/port-forwarding (rarely queried) | |

**User's choice:** [auto] All routes: rate limit + cache (recommended — consistent with all existing Fritz!Box routes)
**Notes:** 60s TTL cache is low-cost and prevents thundering herd on rarely-changing data.

---

## Claude's Discretion

- JSDoc comments on new client methods
- Exact cache key naming
- PaginatedResponse<T> type alias extraction

## Deferred Ideas

- History tiers — Phase 133
- Budget stats — Phase 133
- Frontend enhancements — Phase 134
- Telephony endpoints — excluded from v16.0
