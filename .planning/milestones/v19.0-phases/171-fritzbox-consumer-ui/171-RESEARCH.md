# Phase 171: Fritz!Box Consumer UI - Research

**Researched:** 2026-04-23
**Domain:** React client UI wiring — Next.js 16 App Router, Fritz!Box proxy consumers
**Confidence:** HIGH (entire investigation verified against existing codebase; no external library docs needed beyond what's already in use)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Telephony UI Location (FRITZ-01, FRITZ-02, FRITZ-03)**
- **D-01:** New top-level page `/telefonia` hosting DECT, call history, and TAM.
- **D-02:** Page uses `PageLayout` + `Heading` + orchestrator pattern from `/network/page.tsx`. Three stacked sections: TAM status card (top, small), DECT handsets table (middle), Call history table (bottom).
- **D-03:** Italian labels throughout: "Telefonia", "Cornette DECT", "Cronologia chiamate", "Segreteria".

**Telephony Component Design**
- **D-04:** DECT handsets → `DataTable` with columns: nome, modello, firmware, batteria (percentage badge: ≥50 ember, 20–49 amber, <20 danger), stato registrazione (Badge: registrato / non registrato). Empty state when `items.length === 0`.
- **D-05:** Call history → `DataTable` with columns: tipo chiamata (Badge: in entrata / in uscita / persa — color by type), numero, nome (fallback `—`), durata (humanized `mm:ss` or `hh:mm:ss`), data/ora (Italian locale). Paginated 50 items/page with Prev/Next controls forwarding `limit`/`offset` to `/api/fritzbox/telephony/calls`.
- **D-06:** TAM status → single `Card` with enabled indicator (HealthIndicator green/grey), new-messages count (large number + ember accent when >0), total messages, stale banner (Banner variant="warning") when `is_stale === true`, fetched_at timestamp. No actions (read-only).

**Raw History Surface (FRITZ-04, FRITZ-05, FRITZ-06)**
- **D-07:** New tab **"Storico grezzo"** appended to existing `/network/page.tsx` tab set (after `dispositivi | wifi | servizi | reti-wifi` → add `storico`).
- **D-08:** Tab contains three sub-sections stacked vertically (raw bandwidth DataTable, device presence DataTable, device events DataTable). Device-presence gracefully handles proxy 404 via `EmptyState` with "Endpoint non disponibile sul proxy" — never crashes the tab.
- **D-09:** Reuse existing `TimeRangeSelector` (1h / 24h / 7d) as shared time scope control. Each sub-section forwards the `hours` param; pagination resets on range change.
- **D-10:** Lazy-load the tab content (load hooks only when `activeTab === 'storico'` via `paused` option on each hook — identical to existing wifi/servizi tabs).

**Service Discovery Surface (FRITZ-07)**
- **D-11:** New **"Service Discovery"** tab inside existing `/debug` tabbed page (not a standalone route).
- **D-12:** Tab component `FritzboxServiceDiscoveryTab` in `app/debug/components/tabs/`. Renders a `DataTable` with columns: nome servizio, tipo (TR-064 service URN), URL (copyable via `CopyableIp`-style inline copy button). Manual refresh button only — no polling.
- **D-13:** Empty state renders "Nessun servizio rilevato" when `services.length === 0`. Error state renders `ErrorAlert` with retry.

**Hooks & Data Fetching**
- **D-14:** Seven new hooks colocated under `app/network/hooks/` (raw history) and new `app/telefonia/hooks/` (telephony). Service-discovery hook colocated under `app/debug/hooks/` (new dir acceptable) or inline — Claude's discretion.
- **D-15:** Polling hooks follow the established Fritz!Box pattern (`useAdaptivePolling` + `useVisibility` + `paused` option). 60s default cadence for telephony and raw history. Service-discovery: no polling, fetch on mount + manual refresh.
- **D-16:** Loading → `Skeleton`, stale → subtle stale indicator, empty → `EmptyState`, error → `ErrorAlert` + retry.

**Routing, Nav & Integration**
- **D-17:** CommandPalette: add `id: 'nav-telephony'`, label `Telefonia`, route `/telefonia`. No new CommandPalette entries for raw history or service discovery.
- **D-18:** `/telefonia` follows `/lights/page.tsx` conventions (`'use client'`, orchestrator + presentational split).
- **D-19:** New pages/tabs respect existing Auth0 gate; UI gate inherited from app shell.

**Testing**
- **D-20:** Jest unit coverage for each new hook (success path, error path, paused behavior, stale flag), each new component (DataTable render with sample data, empty state, error state, pagination controls), and CommandPalette `nav-telephony` entry.
- **D-21:** Playwright smoke (add to `tests/smoke/page-loads.spec.ts`): `/telefonia` loads & renders heading + one section; `/network` → click "Storico grezzo" tab → visible, no console errors; `/debug` → click "Service Discovery" tab → visible, no console errors.
- **D-22:** Scoped test subsets during verification — `test:changed`, `test:pages`, `test:components`, `test:api`. Full suite reserved for release gates per CLAUDE.md Rule 8.

### Claude's Discretion
- Exact component file names, prop interfaces, and internal presentational/container split.
- Icon choices from `lucide-react` (suggested: `Phone`, `PhoneIncoming`, `PhoneMissed`, `Voicemail`, `History`, `Network`).
- Whether to use a shared `<FritzboxPaginatedTable>` abstraction or keep the four paginated tables independent (err toward independence — codebase prefers three similar lines over premature abstraction).
- Polling cadence fine-tune within 30–120s if warranted.
- Whether to compose `/telefonia` as a single `page.tsx` or split into orchestrator + `components/` directory.

### Deferred Ideas (OUT OF SCOPE)
- Call-back actions from call history (tap-to-call, add-to-contacts) — UI is read-only.
- Delete/archive for TAM messages — not in FRITZ-01…FRITZ-07.
- Service-discovery deep-dive (invoking TR-064 actions) — future debug-tools phase.
- Bandwidth-raw live chart — existing aggregated `BandwidthChart` covers visual needs; raw tab is intentionally tabular.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRITZ-01 | GET /api/v1/fritzbox/telephony/dect ritorna handset DECT registrati | Route at `app/api/fritzbox/telephony/dect/route.ts` exists (envelope `{ dect: { items, total_count, limit, offset } }`). UI: `useFritzDectHandsets` hook → DECT DataTable on `/telefonia`. |
| FRITZ-02 | GET /api/v1/fritzbox/telephony/calls ritorna storico chiamate paginato | Route exists (envelope `{ calls: { items, total_count, limit, offset } }`). Server-paginated. UI: `useFritzCallHistory` with `limit`/`offset` state → Call history DataTable + Prev/Next (50 per page). |
| FRITZ-03 | GET /api/v1/fritzbox/telephony/tam ritorna stato segreteria telefonica | Route exists (envelope `{ tam: { enabled, new_messages, total_messages, is_stale, fetched_at } }`). UI: `useFritzTamStatus` hook → TAM `Card` with `HealthIndicator` + large message count. |
| FRITZ-04 | GET /api/v1/fritzbox/history/bandwidth ritorna raw bandwidth history | Route exists (envelope `{ bandwidth: { items, total_count, limit, offset } }`). UI: `useFritzBandwidthRaw` hook → DataTable inside `/network` "Storico grezzo" tab. |
| FRITZ-05 | GET /api/v1/fritzbox/history/devices ritorna raw device presence history | Route exists (envelope `{ devices: { items, total_count, limit, offset } }`). **MAY RETURN 404** (phase 162 D-05). UI: `useFritzDevicePresence` → graceful `EmptyState` on 404. |
| FRITZ-06 | GET /api/v1/fritzbox/history/device-events ritorna log eventi join/leave | Route exists (envelope `{ events: { items, total_count, limit, offset } }`). UI: `useFritzDeviceEventsRaw` → DataTable inside "Storico grezzo" tab. |
| FRITZ-07 | GET /api/v1/fritzbox/service-discovery ritorna TR-064 service descriptor | Route exists (envelope `{ discovery: { services: [{ name, type, url }] } }`). UI: `FritzboxServiceDiscoveryTab` in `/debug` with manual-refresh DataTable. |
</phase_requirements>

## Summary

Every API route this phase consumes already ships. Every UI primitive this phase needs (DataTable, TimeRangeSelector, CopyableIp, EmptyState, ErrorAlert, HealthIndicator, Banner, Skeleton, Card, Badge, Heading, Text, Button, PageLayout) is already in the design system. Every hook pattern, test pattern, and smoke-test pattern has a canonical implementation in the codebase (`useFritzWifiClients`, `useFritzNetworkServices`, their `__tests__`, and `tests/smoke/page-loads.spec.ts`). This phase is pure wiring — no new libraries, no new patterns, no unknown API shapes.

The one unverified runtime unknown is FRITZ-05's device-presence endpoint: phase 162 D-05 warned the HA proxy may not expose `/api/v1/fritzbox/history/devices`. Planning must assume the hook can receive a non-OK response and degrade gracefully (EmptyState, never crash).

**Primary recommendation:** Ship seven small hooks (`useFritzDectHandsets`, `useFritzCallHistory`, `useFritzTamStatus`, `useFritzBandwidthRaw`, `useFritzDevicePresence`, `useFritzDeviceEventsRaw`, `useFritzServiceDiscovery`) cloned from `useFritzWifiClients` / `useFritzNetworkServices`, plus presentational components composed from existing primitives. Four independent paginated DataTables — no shared abstraction. Keep the four component families in three locations (`app/telefonia/`, `app/network/components/`, `app/debug/components/tabs/`) with a strict parallel between hook tests and the existing `app/network/hooks/__tests__/` suite.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Fetch telephony/raw/discovery data | Browser (client component) | API route proxy | Polling hooks are client-side per existing Fritz!Box pattern; API routes already exist and enforce auth + rate limit + 60s cache. No work on the backend tier. |
| Auth enforcement | API route (`withAuthAndErrorHandler`) | — | Auth0 session check is upstream of the hook. UI inherits the app shell gate (D-19). |
| Rate limiting (10/min/user) | API route (`checkRateLimitFritzBox`) | — | Client polls at 60s (1/min) — well under budget. No client-side throttling needed. |
| Server-side pagination | API route forwards `limit`/`offset` | Client state (page index) | Call history uses `PaginatedResponse<T>` envelope; client holds page state + refetches on change. Canonical pattern: `app/registry/devices/page.tsx` lines 568–593. |
| Time-range filtering | Client state | API route forwards `hours` param | `TimeRangeSelector` lifts state; each raw-history hook receives `hours` via param. |
| XML → JSON parsing (TR-064) | API route / client-fn (`parseServiceDiscoveryXml`) | — | Already done in `fritzboxClient.getServiceDiscovery`. UI receives structured `{ services: [...] }`. |
| Tab state persistence | URL search params (`/debug`) or local `useState` (`/network`) | — | `/debug` already mirrors tab to URL (`?tab=`); `/network` keeps tab in local state. Mirror existing choice per page. |
| Graceful degradation (404) | Client hook | — | When `/api/fritzbox/history/devices` returns non-OK, hook flags `stale: true` and returns `items: []` — UI renders `EmptyState`. No error boundary needed. |

## Standard Stack

### Core (already installed — NO new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^16.1.0 | App Router framework | [VERIFIED: package.json] In use across the project; `'use client'` directive required for all new pages/components. |
| react | ^19.2.0 | Hooks + components | [VERIFIED: package.json] `useState`/`useEffect`/`useRef` pattern is standard in existing hooks. |
| @tanstack/react-table | ^8.21.3 | DataTable primitive | [VERIFIED: package.json + `app/components/ui/DataTable.tsx`] Already wrapped in the in-house `DataTable`; never import `@tanstack/react-table` directly from phase code. |
| lucide-react | ^0.562.0 | Icons | [VERIFIED: package.json] Existing tabs use `Flame`, `Thermometer`, `Wifi`, etc. |
| date-fns | ^4.1.0 | Locale formatting | [VERIFIED: package.json + `DeviceEventItem.tsx`] `format(date, 'HH:mm:ss')` + `formatDistanceToNow` with `locale: it`. |
| class-variance-authority | ^0.7.1 | Variant styling | [VERIFIED: package.json] Used internally by Badge/Button/Banner; phase code consumes variants through prop surface, does NOT define new CVA variants. |
| jest | (inherited) | Unit tests | [VERIFIED: `jest.config.ts`] `testEnvironment: 'jest-environment-jsdom'`; `testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)']`. |
| @testing-library/react | (inherited) | Component tests | [VERIFIED: `useFritzWifiClients.test.ts`] `renderHook`, `waitFor`, `act`. |
| @playwright/test | (inherited) | Smoke tests | [VERIFIED: `tests/smoke/page-loads.spec.ts`] `test.describe`, `expect`, `page.goto`. |

### Supporting (in-house primitives already exported from `@/app/components/ui`)

| Primitive | Purpose | Where Used in Phase |
|-----------|---------|---------------------|
| `DataTable` | Sortable/paginated table (TanStack) | DECT, Calls, Bandwidth raw, Device presence, Device events raw, Service Discovery — 6 tables. |
| `Card` | Section wrapper | TAM status card; hook of every presentational section. |
| `Badge` | Status/type chips | Call type, DECT registration state, battery level, event type. |
| `Banner` | Stale banner, error banner | `is_stale === true` → `Banner variant="warning"`. |
| `EmptyState` | Empty list message | `items.length === 0` everywhere; device-presence 404 graceful state. |
| `ErrorAlert` | Error display + retry | Service-discovery load failure (per D-13). Note: existing `ErrorAlert` is stove-error-coded; for phase 171 use `Banner variant="error"` with explicit title/description instead of ErrorAlert. See Pitfall 4. |
| `HealthIndicator` | TAM enabled indicator | `status="ok"` when `enabled`, `status="warning"` when `!enabled`. |
| `Skeleton` | Loading shimmer | Initial load of each hook before data arrives. |
| `Heading`, `Text` | Typography | All labels. |
| `Button`, `Button.Group` | Prev/Next, band/type filters, manual refresh | Pagination controls, service-discovery refresh button. |
| `PageLayout`, `PageLayout.Header` | Page shell | `/telefonia` follows `/network` or `/sonos` pattern. |
| `Tabs`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content` | Debug tab container | Service Discovery slots into `/debug` tabs. |

### Existing Hooks to Reuse

| Hook | Source | Use |
|------|--------|-----|
| `useAdaptivePolling` | `@/lib/hooks/useAdaptivePolling` | Foundation for all six polling hooks. `interval: null` pauses. Accepts `immediate: true` to fetch on mount. |
| `useVisibility` | `@/lib/hooks/useVisibility` | Slows polling when tab hidden (60s → 300s per canonical pattern). |

### Alternatives Considered

| Instead of | Could Use | Tradeoff | Recommendation |
|------------|-----------|----------|----------------|
| Shared `<FritzboxPaginatedTable>` abstraction | Four separate column-def + DataTable consumers | Abstraction saves ~30 LOC but adds a parameterized generic Component with column-factory props. Four call sites with mostly-different column shapes (battery bar, call-type badge, timestamp, MAC) don't share enough behavior to justify. | **KEEP INDEPENDENT** (per Claude's Discretion guidance — codebase prefers three similar lines over premature abstraction). |
| Client-side pagination for calls | TanStack built-in pagination (server fetches all) | Avoids client page state, but pulls every row per fetch. Call history can be months of calls. Server-side pagination is the existing pattern in `app/registry/devices/page.tsx`. | **SERVER-SIDE PAGINATION** (per D-05). |
| Single hook for all three raw-history endpoints | `useFritzRawHistory` returning `{ bandwidth, events, presence }` | Mirrors `useFritzNetworkServices` which `Promise.allSettled`s 4 endpoints — tolerates partial failures. But each of the three raw endpoints has independent pagination state + independent 404 behavior for presence. Bundling them fights their independent state. | **THREE SEPARATE HOOKS** — simpler state, independent graceful degradation. |
| URL-state for pagination (e.g. `?page=3`) | Local `useState` | URL state survives refresh and enables share links but none of the existing Fritz!Box tabs persist pagination in the URL. | **LOCAL `useState`** (consistent with codebase). |

**Version verification (recommended by Claude, optional for this phase):** All libraries used already exist in `package.json` at known-good versions. No new installs. No `npm view` needed.

**Installation:** None. Zero new dependencies.

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                               Browser (Client Components)                            │
│                                                                                      │
│  /telefonia page.tsx  ────┐                                                          │
│    ├── useFritzTamStatus() ────────────┐                                             │
│    ├── useFritzDectHandsets() ─────────┤                                             │
│    └── useFritzCallHistory(limit, off)─┤                                             │
│                                        │                                             │
│  /network page.tsx (tab=storico) ──────┤                                             │
│    ├── useFritzBandwidthRaw(hours) ────┤   All hooks use:                            │
│    ├── useFritzDevicePresence() ───────┤   useAdaptivePolling(60s) + useVisibility   │
│    └── useFritzDeviceEventsRaw(hrs)────┤   paused: activeTab !== 'storico'           │
│                                        │                                             │
│  /debug page.tsx (tab=service-disc) ───┤                                             │
│    └── useFritzServiceDiscovery()──────┤   no polling, manual refresh only          │
│                                        │                                             │
│                                        ▼                                             │
│                                  fetch('/api/fritzbox/...')                          │
└────────────────────────────────────────┬─────────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│            Next.js API Routes (already ship — phase 162)                             │
│  /api/fritzbox/telephony/dect   ─┐                                                   │
│  /api/fritzbox/telephony/calls  ─┤  withAuthAndErrorHandler  →  Auth0 session check  │
│  /api/fritzbox/telephony/tam    ─┤  checkRateLimitFritzBox   →  10 req/min/user      │
│  /api/fritzbox/history/bandwidth─┤  getCachedData            →  60s TTL              │
│  /api/fritzbox/history/devices  ─┤  fritzboxClient.method()  →  HA proxy call        │
│  /api/fritzbox/history/device-events                                                 │
│  /api/fritzbox/service-discovery                                                     │
└────────────────────────────────────────┬─────────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│          HA Proxy (external service — X-API-Key auth)                                │
│    /api/v1/fritzbox/* endpoints (raw snake_case JSON, or XML for service-discovery)  │
└──────────────────────────────────────────────────────────────────────────────────────┘

Data flow direction: User → Client polling hook → fetch() → Next.js route →
                     fritzboxClient.X() → haGet → HA proxy → response → hook state →
                     Presentational component → DOM
```

### Component Responsibilities

| Layer | Files |
|-------|-------|
| **Orchestrator pages** | `app/telefonia/page.tsx` (NEW), `app/network/page.tsx` (MODIFIED — add `'storico'` to tab set), `app/debug/page.tsx` (MODIFIED — add "Service Discovery" `Tabs.Trigger` + `Tabs.Content`) |
| **Hooks** (data + polling) | `app/telefonia/hooks/useFritzTamStatus.ts`, `useFritzDectHandsets.ts`, `useFritzCallHistory.ts`; `app/network/hooks/useFritzBandwidthRaw.ts`, `useFritzDevicePresence.ts`, `useFritzDeviceEventsRaw.ts`; `app/debug/hooks/useFritzServiceDiscovery.ts` (or inlined in tab component) |
| **Presentational components** | `app/telefonia/components/TamStatusCard.tsx`, `DectHandsetsTable.tsx`, `CallHistoryTable.tsx`; `app/network/components/BandwidthRawTable.tsx`, `DevicePresenceTable.tsx`, `DeviceEventsRawTable.tsx`; `app/debug/components/tabs/FritzboxServiceDiscoveryTab.tsx` |
| **Command palette** | `app/components/layout/CommandPaletteProvider.tsx` — add `nav-telephony` entry to the `Navigazione` heading (after `nav-camera` is sensible but any position inside the same heading works) |

### Recommended Project Structure

```
app/
├── telefonia/                     # NEW — top-level device page
│   ├── page.tsx                   # orchestrator: 3 hooks + 3 components
│   ├── components/
│   │   ├── TamStatusCard.tsx
│   │   ├── DectHandsetsTable.tsx
│   │   ├── CallHistoryTable.tsx
│   │   └── __tests__/
│   │       ├── TamStatusCard.test.tsx
│   │       ├── DectHandsetsTable.test.tsx
│   │       └── CallHistoryTable.test.tsx
│   └── hooks/
│       ├── useFritzTamStatus.ts
│       ├── useFritzDectHandsets.ts
│       ├── useFritzCallHistory.ts
│       └── __tests__/
│           ├── useFritzTamStatus.test.ts
│           ├── useFritzDectHandsets.test.ts
│           └── useFritzCallHistory.test.ts
│
├── network/                        # MODIFIED — add 'storico' tab
│   ├── page.tsx                    # modify tab set: add 'storico'
│   ├── components/
│   │   ├── RawHistoryTab.tsx       # NEW — container for the three sub-tables
│   │   ├── BandwidthRawTable.tsx   # NEW
│   │   ├── DevicePresenceTable.tsx # NEW
│   │   ├── DeviceEventsRawTable.tsx# NEW
│   │   └── __tests__/              # existing folder — add new tests
│   └── hooks/
│       ├── useFritzBandwidthRaw.ts # NEW
│       ├── useFritzDevicePresence.ts # NEW
│       ├── useFritzDeviceEventsRaw.ts # NEW
│       └── __tests__/              # existing folder — add new tests
│
├── debug/                          # MODIFIED — add Service Discovery tab
│   ├── page.tsx                    # modify Tabs: add value="service-discovery"
│   ├── components/
│   │   └── tabs/
│   │       └── FritzboxServiceDiscoveryTab.tsx  # NEW
│   └── hooks/                      # NEW directory (or inline in tab)
│       └── useFritzServiceDiscovery.ts
│
├── components/
│   └── layout/
│       └── CommandPaletteProvider.tsx  # MODIFIED — add nav-telephony
│
tests/
└── smoke/
    └── page-loads.spec.ts          # MODIFIED — add 3 new smoke tests
```

### Pattern 1: Fritz!Box Polling Hook (the canonical clone target)

**What:** A paused-aware polling hook returning `{ data, loading, stale }` (plus pagination state for paginated endpoints).
**When to use:** Every new telephony / raw-history hook in this phase.
**Source:** `app/network/hooks/useFritzWifiClients.ts`

```typescript
// Source: app/network/hooks/useFritzWifiClients.ts (canonical pattern, verified)
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export interface DectHandset {
  id: string;
  name: string;
  model: string;
  firmware_version: string;
  battery_charge_level: number | null;
  is_registered: boolean;
}

interface UseFritzDectHandsetsOptions {
  paused?: boolean;
}

export function useFritzDectHandsets(options: UseFritzDectHandsetsOptions = {}): {
  handsets: DectHandset[];
  loading: boolean;
  stale: boolean;
  total: number;
} {
  const { paused = false } = options;

  const [handsets, setHandsets] = useState<DectHandset[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [total, setTotal] = useState(0);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/fritzbox/telephony/dect');
      if (!res.ok) { setStale(true); return; }
      const json = await res.json() as {
        dect: { items: DectHandset[]; total_count: number; limit: number; offset: number };
      };
      setHandsets(json.dect.items);
      setTotal(json.dect.total_count);
      setStale(false);
    } catch {
      setStale(true);
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 0,
  });

  return { handsets, loading, stale, total };
}
```

### Pattern 2: Server-Paginated Hook (calls, bandwidth, events, presence)

**What:** Hook that holds `limit`/`offset` state, rebuilds the URL on change, and re-fetches outside of the polling schedule (mirrors the `band`-change pattern in `useFritzWifiClients`).
**Source derivation:** `useFritzWifiClients.ts` (band-change effect) + `app/registry/devices/page.tsx` lines 568–593 (Prev/Next controls).

```typescript
// Source: derived from useFritzWifiClients band-change effect + registry/devices pagination
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export interface CallRecord {
  id: string;
  call_type: string;      // e.g. 'in', 'out', 'missed' — confirm via live fetch in Wave 0
  number: string;
  name: string | null;
  duration_seconds: number;
  timestamp: number;      // Unix seconds per fritzboxClient raw pass-through
  port: string | null;
}

const PAGE_SIZE = 50;

export function useFritzCallHistory(options: { paused?: boolean } = {}): {
  calls: CallRecord[];
  loading: boolean;
  stale: boolean;
  totalCount: number;
  page: number;
  setPage: (p: number) => void;
} {
  const { paused = false } = options;
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      const res = await fetch(`/api/fritzbox/telephony/calls?${params}`);
      if (!res.ok) { setStale(true); return; }
      const json = await res.json() as {
        calls: { items: CallRecord[]; total_count: number };
      };
      setCalls(json.calls.items);
      setTotalCount(json.calls.total_count);
      setStale(false);
    } catch {
      setStale(true);
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({ callback: fetchData, interval, alwaysActive: false, immediate: true, initialDelay: 0 });

  // Re-fetch when page changes (skip first render — immediate already fetched)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    void fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return { calls, loading, stale, totalCount, page, setPage };
}
```

### Pattern 3: Graceful 404 Degradation (device-presence specifically)

**What:** When the upstream HA proxy returns a non-OK status, set `stale: true`, keep `items: []`, and let the presentational component render an `EmptyState` with a proxy-specific message instead of crashing.
**When to use:** `useFritzDevicePresence` — phase 162 D-05 explicitly flagged this endpoint as possibly unavailable.

```typescript
// Source: phase 162 D-05 + the canonical stale pattern from useFritzWifiClients
const fetchData = async () => {
  try {
    const res = await fetch(`/api/fritzbox/history/devices?${params}`);
    if (!res.ok) {
      // 404 / 502 / any non-OK → degrade gracefully. Do not throw.
      setStale(true);
      setItems([]);
      setTotalCount(0);
      return;
    }
    // ... happy path
  } catch {
    setStale(true);
  } finally {
    setLoading(false);
  }
};
```

Then the presentational component:

```tsx
{items.length === 0 && !loading ? (
  <EmptyState
    icon="🌐"
    title="Nessun dato di presenza"
    description={stale
      ? 'Endpoint non disponibile sul proxy'
      : 'Nessun evento nel periodo selezionato'}
  />
) : (
  <DataTable columns={columns} data={items} /* ... */ />
)}
```

### Pattern 4: DataTable Column Definition (TanStack)

**What:** Array of `ColumnDef<T>` with `accessorKey`, `header`, `cell` render, `enableSorting`. Consumed by the in-house `DataTable`.
**Source:** `app/network/components/DeviceListTable.tsx`, `WifiClientsTable.tsx`.

```typescript
// Source: app/network/components/WifiClientsTable.tsx (pattern verified)
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/app/components/ui';
import Badge from '@/app/components/ui/Badge';

const columns: ColumnDef<DectHandset>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    enableSorting: true,
  },
  {
    accessorKey: 'model',
    header: 'Modello',
    enableSorting: true,
  },
  {
    accessorKey: 'firmware_version',
    header: 'Firmware',
    enableSorting: false,
  },
  {
    accessorKey: 'battery_charge_level',
    header: 'Batteria',
    enableSorting: true,
    cell: ({ row }) => {
      const pct = row.original.battery_charge_level;
      if (pct === null) return <span className="text-slate-500">—</span>;
      const variant = pct >= 50 ? 'ember' : pct >= 20 ? 'warning' : 'danger';
      return <Badge variant={variant} size="sm">{pct}%</Badge>;
    },
  },
  {
    accessorKey: 'is_registered',
    header: 'Stato',
    enableSorting: true,
    cell: ({ row }) => (
      <Badge variant={row.original.is_registered ? 'sage' : 'neutral'} size="sm">
        {row.original.is_registered ? 'Registrato' : 'Non registrato'}
      </Badge>
    ),
  },
];

<DataTable columns={columns} data={handsets} density="compact" />
```

**Critical DataTable prop surface (from `app/components/ui/DataTable.tsx`):**
- `columns: ColumnDef<T>[]` — required
- `data: T[]` — required
- `density?: 'compact' | 'default' | 'relaxed'` — default `default`
- `striped?: boolean`
- `stickyHeader?: boolean`
- `enableFiltering?: boolean` — adds a DataTableToolbar with global filter input
- `enablePagination?: boolean` — client-side (do NOT use for server-paginated endpoints)
- `pageSize?: number` — default 10
- `showRowCount?: boolean` — default true
- `onRowClick?: (row: Row<T>) => void`
- `initialSorting?: SortingState`
- `variant?: 'default' | 'compact' | 'striped'` (legacy prop — still accepted)
- Empty state: DataTable renders "No data available" by default when `data.length === 0` (see DataTable.tsx line 574). For Italian labels, wrap DataTable in a parent that checks `data.length === 0` and renders `EmptyState` instead.

### Pattern 5: Tab Lazy-Load via `paused`

**What:** Each tab's hook receives `paused: activeTab !== 'my-tab'`. When paused, `useAdaptivePolling` gets `interval: null` and does not fire.
**Source:** `app/network/page.tsx` lines 100–105.

```tsx
// Source: app/network/page.tsx (verified)
const [activeTab, setActiveTab] = useState<NetworkTab>('dispositivi');

const wifiClients = useFritzWifiClients({ paused: activeTab !== 'wifi' });
const networkServices = useFritzNetworkServices({ paused: activeTab !== 'servizi' });
const wifiNetworks = useFritzWifiNetworks({ paused: activeTab !== 'reti-wifi' });

// For phase 171, append:
const bandwidthRaw = useFritzBandwidthRaw({ paused: activeTab !== 'storico', hours });
const devicePresence = useFritzDevicePresence({ paused: activeTab !== 'storico' });
const deviceEventsRaw = useFritzDeviceEventsRaw({ paused: activeTab !== 'storico', hours });
```

### Pattern 6: Tab Extension (`/network` page)

**Source:** `app/network/page.tsx` lines 84 + 216–235.

```typescript
// Type extension (line 84)
type NetworkTab = 'dispositivi' | 'wifi' | 'servizi' | 'reti-wifi' | 'storico';

// Tab config (line 216)
{([
  { key: 'dispositivi' as const, label: 'Dispositivi' },
  { key: 'wifi' as const, label: 'WiFi Clients' },
  { key: 'servizi' as const, label: 'Servizi di Rete' },
  { key: 'reti-wifi' as const, label: 'Reti WiFi' },
  { key: 'storico' as const, label: 'Storico grezzo' },   // ← NEW
]).map(...)}

// Conditional render (after line 264)
{activeTab === 'storico' && (
  <RawHistoryTab
    bandwidth={bandwidthRaw}
    presence={devicePresence}
    events={deviceEventsRaw}
    hours={hours}
    onHoursChange={setHours}
  />
)}
```

### Pattern 7: Debug Tab Extension (`/debug` page)

**Source:** `app/debug/page.tsx` lines 309 + 382–391.

```tsx
// Keyboard shortcut tabs array (line 309) — add 'service-discovery' as index 9
const tabs = ['stufa', 'netatmo', 'hue', 'weather', 'firebase', 'scheduler', 'log', 'notifiche', 'network', 'service-discovery'];

// Tabs.Trigger (after line 390)
<Tabs.Trigger value="service-discovery" icon={<Network size={18} />}>Service Discovery</Tabs.Trigger>

// Tabs.Content (after line 429)
<Tabs.Content value="service-discovery">
  <div className="mt-6">
    <FritzboxServiceDiscoveryTab />
  </div>
</Tabs.Content>
```

Note: `/debug` persists tab selection via URL search params (`?tab=service-discovery`), handled by `searchParams.get('tab') || 'stufa'`. No extra wiring needed.

### Pattern 8: CommandPalette Nav Entry

**Source:** `app/components/layout/CommandPaletteProvider.tsx` lines 84–129.

```tsx
// Insert after line 115 (after nav-camera, before nav-settings)
{
  id: 'nav-telephony',
  label: 'Telefonia',
  icon: <Phone className="w-4 h-4" />,   // import Phone from 'lucide-react'
  onSelect: () => router.push('/telefonia'),
},
```

Note: the existing provider sets `defaultCommands` as a plain object array; no conditional logic required for telephony (it's a production-visible route, unlike `nav-debug` which is dev-only).

### Anti-Patterns to Avoid

- **Do NOT wrap `DataTable` with a new generic `PaginatedTable` component.** The four paginated tables have distinct column renderers (battery bars vs. call-type badge vs. timestamp formatting vs. MAC formatting). Four parallel lines of code are cheaper to read than one abstraction that needs prop surfaces for every variant. (Claude's Discretion guidance in CONTEXT.md D- "err on the side of independence".)
- **Do NOT use DataTable's built-in `enablePagination={true}` for server-paginated endpoints.** That prop runs client-side pagination on the already-fetched `data` array. Call history / bandwidth raw / device events raw are server-paginated — use external Prev/Next controls (Pattern 2) and feed DataTable only the current page's 50 items.
- **Do NOT throw on non-OK responses in hooks.** Set `stale: true` and return empty data (Pattern 3). This matches the existing `useFritzWifiClients` / `useFritzNetworkServices` behavior and prevents hook errors from reaching error boundaries.
- **Do NOT import `@tanstack/react-table` directly from phase code.** The in-house `DataTable` wraps it; phase code uses `ColumnDef<T>` (type import) and `<DataTable>` only.
- **Do NOT create new Badge / Banner variants.** Existing variants (`ember`, `sage`, `warning`, `danger`, `neutral`, `ocean`) cover every case in this phase.
- **Do NOT register device-presence 404 as an error boundary trigger.** The endpoint's absence is an expected runtime condition. Degrade silently.
- **Do NOT write tests that run against the real HA proxy.** All hook tests mock `global.fetch` and `useAdaptivePolling` / `useVisibility`. See Pattern for testing below.
- **Do NOT run `npm test` alone in a verify block.** CLAUDE.md Rule 8 — always use a scoped subset (`npm test -- <specific paths>`, `test:changed`, `test:pages`, `test:components`, `test:api`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sortable table | Custom `<table>` with header-click handlers | `DataTable` (`ColumnDef<T>.enableSorting: true`) | TanStack handles multi-column sort, ARIA sort announcements, keyboard nav. |
| Copy-to-clipboard | Raw `navigator.clipboard.writeText` in each component | `CopyableIp` or Copy button pattern from `CopyableIp.tsx` | Existing pattern gives visual feedback (Check → Copy), handles errors. |
| Time-range selector | 1h/24h/7d button group | `TimeRangeSelector` (`app/network/components/TimeRangeSelector.tsx`) | Already themed, uses `Button.Group`, consistent. |
| Italian date formatting | `new Date(ts).toLocaleString('it-IT', {...})` | `date-fns` `format(ts, 'HH:mm:ss')` + `locale: it` from `date-fns/locale/it` | Already in use; tree-shakable; handles Unix seconds correctly via simple `ts * 1000`. |
| Empty state | Custom `<div className="text-center...">` | `EmptyState` primitive | Sizes + icon + title + description + action slot in one component. |
| Relative-time display | Custom "5 minutes ago" calculation | `date-fns` `formatDistanceToNow(date, { addSuffix: true, locale: it })` | Used in `DeviceEventItem.tsx`. |
| Polling loop | `setInterval` in `useEffect` | `useAdaptivePolling` | Pauses when tab hidden, handles cleanup, ref-pattern for stale closures, `initialDelay` for stagger. |
| Visibility gating | `document.visibilityState` listener | `useVisibility` hook | Returns `boolean`, handles SSR. |
| Loading shimmer | Custom pulse div | `Skeleton` primitive | Accepts `className="h-10 w-full"` or composed shape. |
| Stale warning banner | Custom div with warning color | `<Banner variant="warning" title="Dati non aggiornati" compact />` | Pattern from `app/sonos/page.tsx` line 62. |
| Pagination footer | Custom Prev/Next with `page` math | Button + count-formula from `app/registry/devices/page.tsx` lines 568–593 | Already Italian-localized ("Pagina X di Y", "Precedente", "Successiva"). |
| Debug tab integration | New full page `/debug/service-discovery/page.tsx` | `<Tabs.Trigger>` + `<Tabs.Content>` in existing `/debug/page.tsx` | D-11 locked: existing tabbed container + auth-gated surface. |

**Key insight:** This is a pure-composition phase. If you catch yourself writing new CSS, new variant logic, or a new timing primitive, stop and check the codebase — there's almost certainly a primitive for it. The one place where new component code is unavoidable is the orchestrator layout for `/telefonia` and the per-section column renderers for the DataTables.

## Runtime State Inventory

Not applicable — this is a greenfield UI addition. No rename / refactor / migration. No stored data, no OS-registered state, no secrets affected. Service-worker cache rules are unchanged (all new URLs start with `/api/fritzbox/` which is already in the cache policy for other Fritz!Box routes).

One runtime consideration: the `/api/fritzbox/history/devices` HA-proxy endpoint MAY 404 at runtime per phase 162 D-05 — but this is a fresh UI consuming a known-possibly-unavailable route, not a migration of an existing consumer. The 404 handling is designed into the hook (Pattern 3).

## Common Pitfalls

### Pitfall 1: Device-presence endpoint crashes the whole /network page

**What goes wrong:** `useFritzDevicePresence` throws on 404, the error propagates up the hook → error boundary swallows the whole `RawHistoryTab` (or worse, the page).
**Why it happens:** Default `fetch` + `.json()` throws if the response is not JSON-parseable; `if (!res.ok) throw` is the naive pattern.
**How to avoid:** Use the Pattern 3 structure — `if (!res.ok) { setStale(true); setItems([]); return; }`. Presentational component branches on `items.length === 0 && stale` to render a proxy-specific `EmptyState`.
**Warning signs:** Jest hook test for `useFritzDevicePresence` should assert that when fetch returns `{ ok: false, status: 404 }`, the hook exposes `stale === true`, `handsets === []`, and does NOT throw.

### Pitfall 2: Prev/Next page state desync with polling refetch

**What goes wrong:** User navigates to page 3; 60s later the polling refetch fires with page state `3`, but if the total count shrunk, page 3 is now empty with no indicator.
**Why it happens:** Polling refetch uses the current `page` state in closure. The ref pattern in `useFritzWifiClients` guards against band changes (re-run on effect), not against shrinking data.
**How to avoid:** On every refetch, if `items.length === 0 && page > 0 && totalCount > 0`, call `setPage(0)` to reset. Add an effect in `useFritzCallHistory`: `useEffect(() => { if (page > 0 && page * PAGE_SIZE >= totalCount) setPage(0); }, [totalCount])`.
**Warning signs:** Manual QA on a DECT-light environment (3 calls in call history). Jest test: mock two fetches with decreasing `total_count`, assert page resets.

### Pitfall 3: Tab activation doesn't trigger initial fetch for lazy hooks

**What goes wrong:** User switches to "Storico grezzo" for the first time. The hook was paused (`interval: null`) so `useAdaptivePolling` never fired. When `paused` flips to `false`, there's no `immediate` fetch because the hook is still mounted with the same mount cycle.
**Why it happens:** `useAdaptivePolling`'s `immediate: true` fires once on mount. When interval changes from `null` to a number post-mount, the adaptive-polling hook's internal effect re-subscribes — need to verify this triggers an immediate call too.
**How to avoid:** Read `lib/hooks/useAdaptivePolling.ts` (lines 78+) — verify `hasRunImmediate` ref resets on paused→active transition, or add an explicit `useEffect` in the consumer hook that calls `fetchData()` when `paused` flips to `false`. The existing `useFritzWifiClients` doesn't address this because it's mounted with `paused: false` from tab 'wifi' → user sees stale data until next poll. **Recommendation:** Plan should test this by switching tabs back and forth and asserting at least one fetch per activation.
**Warning signs:** Playwright smoke for "switch to Storico grezzo tab → expect(DataTable rows or EmptyState).toBeVisible within 5s" — NOT "wait for 65s for the polling interval".

### Pitfall 4: `ErrorAlert` component is stove-specific, not generic

**What goes wrong:** Plan reads "use ErrorAlert" (D-13) and imports `app/components/ui/ErrorAlert.tsx`, which requires an `errorCode: number` and looks up stove error severity.
**Why it happens:** `ErrorAlert.tsx` lines 34–103 are coupled to `lib/errorMonitor` and stove error codes. It renders "Allarme Stufa - Codice {errorCode}" as the title.
**How to avoid:** For service-discovery fetch errors (D-13), use `<Banner variant="error" title="Errore nel caricamento" description={error.message} actions={<Button onClick={retry}>Riprova</Button>}>` instead. Same Banner component is already imported into `/sonos/page.tsx` line 62 for stale warnings.
**Warning signs:** TypeScript error: `Type 'string' is not assignable to type 'number'` on `<ErrorAlert errorCode="proxy_unavailable" />`.

### Pitfall 5: Call-type values are unknown without live fetch

**What goes wrong:** Plan hard-codes call-type badge mapping (`'in' → 'in entrata'`) but `fritzboxClient.getCallHistory` returns `call_type: string` without enumeration — the HA proxy may return German strings, numeric codes, or camelCase.
**Why it happens:** Phase 162 used raw pass-through per D-01. The Fritz!Box TR-064 `X_AVM-DE_OnTel1` call list returns call type as a numeric string: `'1'` (incoming), `'2'` (missed), `'3'` (outgoing), `'4'` (active incoming), `'9'` / `'10'` (rejected). But the HA proxy may normalize these. The actual mapping is unverifiable from the codebase.
**How to avoid:** Plan a Wave 0 task to hit `/api/fritzbox/telephony/calls?limit=5` on a real Fritz!Box (or have the implementer do so in dev) and lock the exact value mapping before writing the badge logic. Alternatively, render the raw `call_type` value in a `<Badge variant="neutral">` for unknown types with a fallback mapping for the three recognized ones — so unknown values don't crash the UI.
**Warning signs:** Component test with `call_type: 'FOO'` renders without error; visual QA reveals a raw string in a badge — plan iteration.

### Pitfall 6: Timestamp unit inconsistency (Unix seconds vs milliseconds)

**What goes wrong:** `CallRecord.timestamp` is in Unix seconds (raw pass-through). Component passes directly to `new Date(ts)` → 1970 dates in the UI.
**Why it happens:** `lib/fritzbox/fritzboxClient.ts` line 476 defines `timestamp: number` but doesn't document the unit. `getDeviceEvents()` (the NON-raw version, line 187) multiplies `* 1000` explicitly. The raw pass-through versions do NOT — they return seconds unchanged.
**How to avoid:** In every component/cell that renders a Fritz!Box timestamp, multiply by 1000: `format(new Date(row.original.timestamp * 1000), 'dd/MM/yyyy HH:mm')`. Document this in each component's JSDoc.
**Warning signs:** Jest component test with `timestamp: 1720000000` should assert the rendered text is "2024" or similar, NOT "1970".

### Pitfall 7: Jest test collision with `testPathIgnorePatterns`

**What goes wrong:** Tests placed in `app/telefonia/hooks/__tests__/` / `app/telefonia/components/__tests__/` are discovered by `**/__tests__/**` testMatch — good. But GSD worktree copies under `.claude/worktrees/agent-*/` are also matched unless the pattern is explicitly ignored.
**Why it happens:** Jest discovers tests via haste map; duplicate test files in worktrees trigger "duplicate manual mock" errors.
**How to avoid:** `jest.config.ts` already ignores `.claude/` via `testPathIgnorePatterns` and `modulePathIgnorePatterns`. No action needed — just don't create tests outside standard locations.
**Warning signs:** "duplicate manual mock" or "haste collision" errors in Jest output.

### Pitfall 8: Adding a navbar link for `/telefonia` is out of scope

**What goes wrong:** Plan adds a navbar/nav-drawer entry alongside other devices.
**Why it happens:** Natural instinct — every other device has a nav entry.
**How to avoid:** CONTEXT.md D-17 explicitly scopes nav to the CommandPalette only. The planner / implementer MAY propose a follow-up for navbar integration, but in this phase the only discoverability is Cmd+K → Telefonia. Grep for existing nav drawer (`app/components/layout/*`) to confirm the scope boundary before modifying.
**Warning signs:** Diff includes `Navbar.tsx` or nav-drawer links — planner sidetrack.

## Code Examples

### Example A: TAM Status Card composition

```tsx
// Source: composed from Card + HealthIndicator + Badge + Banner patterns verified in codebase
import { Card, Heading, Text, Banner, HealthIndicator, Badge } from '@/app/components/ui';
import type { TamStatus } from '@/types/fritzbox';

interface TamStatusCardProps {
  status: TamStatus | null;
  loading: boolean;
  stale: boolean;
}

export function TamStatusCard({ status, loading, stale }: TamStatusCardProps) {
  if (loading && !status) return <Skeleton className="h-[140px] rounded-2xl" />;
  if (!status) return null;

  return (
    <Card variant="elevated" className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Heading level={2} size="lg">Segreteria</Heading>
        <HealthIndicator status={status.enabled ? 'ok' : 'warning'} label={status.enabled ? 'Attiva' : 'Disattiva'} />
      </div>

      {stale && <Banner variant="warning" title="Dati non aggiornati" compact />}

      <div className="flex items-baseline gap-4">
        <div className="flex flex-col">
          <Text variant="label" size="xs">Nuovi messaggi</Text>
          <span className={`text-5xl font-bold ${status.new_messages > 0 ? 'text-ember-400' : 'text-slate-400'}`}>
            {status.new_messages}
          </span>
        </div>
        <div className="flex flex-col">
          <Text variant="label" size="xs">Totale</Text>
          <Text variant="secondary">{status.total_messages}</Text>
        </div>
      </div>

      {status.fetched_at && (
        <Text variant="tertiary" size="xs">
          Aggiornato: {new Date(status.fetched_at.replace(/([+-]\d{2}:\d{2})Z$/, '$1')).toLocaleString('it-IT')}
        </Text>
      )}
    </Card>
  );
}
```

### Example B: Raw-history hook with `hours` param + paused

```typescript
// Source: composite of useFritzWifiClients + useFritzNetworkServices patterns
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export interface BandwidthRawRecord {
  timestamp: number;
  bytes_sent: number;
  bytes_received: number;
  upstream_rate: number;
  downstream_rate: number;
  latency_ms: number | null;
  connection_uptime: number | null;
  external_ip: string | null;
  connection_type: string | null;
}

interface Options {
  paused?: boolean;
  hours?: number;         // 1 | 24 | 168 per TimeRangeSelector value mapping
  pageSize?: number;
}

const HOURS_MAP: Record<string, number> = { '1h': 1, '24h': 24, '7d': 168 };

export function useFritzBandwidthRaw(options: Options = {}): {
  items: BandwidthRawRecord[];
  loading: boolean;
  stale: boolean;
  totalCount: number;
  page: number;
  setPage: (p: number) => void;
} {
  const { paused = false, hours = 24, pageSize = 50 } = options;

  const [items, setItems] = useState<BandwidthRawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        hours: String(hours),
        limit: String(pageSize),
        offset: String(page * pageSize),
      });
      const res = await fetch(`/api/fritzbox/history/bandwidth?${params}`);
      if (!res.ok) { setStale(true); setItems([]); return; }
      const json = await res.json() as {
        bandwidth: { items: BandwidthRawRecord[]; total_count: number };
      };
      setItems(json.bandwidth.items);
      setTotalCount(json.bandwidth.total_count);
      setStale(false);
    } catch {
      setStale(true);
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({ callback: fetchData, interval, alwaysActive: false, immediate: true, initialDelay: 0 });

  // Re-fetch when hours or page change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(0);
    void fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  useEffect(() => {
    if (isFirstRender.current) return;
    void fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return { items, loading, stale, totalCount, page, setPage };
}
```

### Example C: Service Discovery Tab (manual-refresh only)

```tsx
// Source: composed from NetworkTab.tsx (manual refresh + copy button) + DataTable pattern
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, Heading, Text, Button, DataTable, EmptyState, Banner } from '@/app/components/ui';
import { Copy, Check, RefreshCw } from 'lucide-react';

interface ServiceEntry { name: string; type: string; url: string; }

function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fire-and-forget */ }
  };
  return (
    <div className="flex items-center gap-2">
      <code className="font-mono text-xs text-slate-300 truncate max-w-md">{url}</code>
      <Button variant="ghost" size="sm" iconOnly onClick={copy} aria-label={copied ? 'Copiato' : 'Copia URL'}>
        {copied ? <Check className="w-4 h-4 text-sage-400" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}

export default function FritzboxServiceDiscoveryTab() {
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fritzbox/service-discovery');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { discovery: { services: ServiceEntry[] } };
      setServices(json.discovery.services ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const columns: ColumnDef<ServiceEntry>[] = [
    { accessorKey: 'name', header: 'Nome servizio', enableSorting: true },
    { accessorKey: 'type', header: 'Tipo', enableSorting: true,
      cell: ({ row }) => <code className="font-mono text-xs text-slate-400">{row.original.type}</code> },
    { accessorKey: 'url', header: 'URL', enableSorting: false,
      cell: ({ row }) => <CopyUrl url={row.original.url} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Heading level={2} size="lg">TR-064 Service Discovery</Heading>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" /> Aggiorna
        </Button>
      </div>

      {error && (
        <Banner variant="error" title="Errore nel caricamento" description={error}
                actions={<Button size="sm" onClick={fetchData}>Riprova</Button>} />
      )}

      <Card variant="elevated" className="p-4">
        {services.length === 0 && !loading && !error ? (
          <EmptyState icon="🌐" title="Nessun servizio rilevato" description="Il descrittore TR-064 non contiene servizi." />
        ) : (
          <DataTable columns={columns} data={services} density="compact" />
        )}
      </Card>
    </div>
  );
}
```

### Example D: Jest hook test (clone of `useFritzWifiClients.test.ts`)

```typescript
// Source: app/network/hooks/__tests__/useFritzWifiClients.test.ts — structure verified
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFritzDectHandsets } from '../useFritzDectHandsets';

let mockInterval: number | null = null;
jest.mock('@/lib/hooks/useAdaptivePolling', () => ({
  useAdaptivePolling: ({ callback, interval }: { callback: () => void; interval: number | null }) => {
    mockInterval = interval;
    if (interval !== null) callback();
  },
}));
jest.mock('@/lib/hooks/useVisibility', () => ({ useVisibility: () => true }));

describe('useFritzDectHandsets', () => {
  const mockHandsets = [
    { id: '1', name: 'Cucina', model: 'C6', firmware_version: '113.01', battery_charge_level: 75, is_registered: true },
    { id: '2', name: 'Camera', model: 'C6', firmware_version: '113.01', battery_charge_level: 15, is_registered: true },
  ];

  beforeEach(() => { jest.clearAllMocks(); mockInterval = null; });

  it('fetches DECT handsets and exposes items + total', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ dect: { items: mockHandsets, total_count: 2, limit: 50, offset: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDectHandsets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.handsets).toEqual(mockHandsets);
    expect(result.current.total).toBe(2);
    expect(result.current.stale).toBe(false);
  });

  it('sets stale=true on non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as jest.Mock;
    const { result } = renderHook(() => useFritzDectHandsets());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stale).toBe(true);
    expect(result.current.handsets).toEqual([]);
  });

  it('stops polling when paused=true', () => {
    global.fetch = jest.fn() as jest.Mock;
    renderHook(() => useFritzDectHandsets({ paused: true }));
    expect(mockInterval).toBeNull();
  });
});
```

### Example E: Playwright smoke tests (add to `tests/smoke/page-loads.spec.ts`)

```typescript
// Source: existing tests/smoke/page-loads.spec.ts — same collectConsoleErrors pattern
test.describe('Fritz!Box Consumer UI (Phase 171)', () => {
  test('/telefonia loads without console errors', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.goto('/telefonia');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeAttached({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Telefonia/i, level: 1 })).toBeVisible({ timeout: 15000 });
    cleanup();
    expect(errors, `Console errors on /telefonia: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('/network → Storico grezzo tab activates without errors', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.goto('/network');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Storico grezzo/i }).click();
    // Presence of the tab body — either a table or an EmptyState is acceptable
    await expect(page.getByText(/Storico|Bandwidth|Nessun dato|Endpoint non disponibile/i).first()).toBeVisible({ timeout: 15000 });
    cleanup();
    expect(errors, `Console errors on /network storico tab: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('/debug → Service Discovery tab activates without errors', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.goto('/debug');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('tab', { name: /Service Discovery/i }).click();
    await expect(page.getByRole('heading', { name: /TR-064|Service Discovery/i }).first()).toBeVisible({ timeout: 15000 });
    cleanup();
    expect(errors, `Console errors on /debug service-discovery: ${errors.join(', ')}`).toHaveLength(0);
  });
});
```

## State of the Art

| Topic | Current in-project pattern | Notes |
|-------|---------------------------|-------|
| Data fetching | `useAdaptivePolling` + fetch + `useState` | Project migrated away from WebSocket server-side, but WS client hooks exist for Thermorossi/Netatmo/Hue/Sonos/DIRIGERA (v17.0). Fritz!Box does NOT have WS support (confirmed via MEMORY.md: "Raspberry Pi excluded from WS (not in HA proxy topics, stays polling-only)" — Fritz!Box is in the same category). **Stay with polling.** |
| Pagination | Server-side with `PaginatedResponse<T>` envelope + Prev/Next | v15.0 pattern from `app/registry/devices/page.tsx`. Stable since phase 121. |
| Tests | `jest` + `@testing-library/react` + mock `useAdaptivePolling`/`useVisibility`/`global.fetch` | Established since v11.1 (phase 92+). Mock pattern verified in `useFritzWifiClients.test.ts`. |
| Smoke tests | Playwright `test.describe` + `collectConsoleErrors` | Established in v12.0 phase 97. No auth fixture needed (app under test runs locally without Auth0 enforcement in smoke env — routes may show SESSION_EXPIRED banner but no console errors). |
| Design system | Ember Noir dark-first, no light-mode variants | v18.0 milestone — do NOT add `dark:` prefixes. All new code targets dark palette directly. |

**Deprecated / outdated:**
- `useEffect(() => { const id = setInterval(...) }, [])` → **deprecated**; use `useAdaptivePolling`.
- Client-side WebSocket subscriptions → **not applicable for Fritz!Box**; stick with polling.
- `useMemo` / `useCallback` for stability → **generally removed per v11.1**; only retained where TanStack Table requires referential stability (DataTable.tsx internals, not phase consumers).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `CallRecord.call_type` values are `'in'` / `'out'` / `'missed'` string literals | Pattern 4, Example B implicit | Medium — badge mapping misses every record; renders raw string. Mitigated by Pitfall 5 fallback. **Needs live-fetch confirmation in Wave 0.** |
| A2 | `CallRecord.timestamp` is Unix seconds | Pitfall 6, Example B | Low — codebase precedent (`getDeviceEvents` multiplies by 1000 explicitly in `fritzboxClient.ts` line 188) strongly suggests Unix seconds for raw pass-through. Verify with a single real fetch. |
| A3 | `useAdaptivePolling` fires a fresh fetch when `interval` transitions from `null` to a number | Pitfall 3 | Medium — affects lazy-loaded tab UX. If false, plan needs an explicit `useEffect(() => { if (!paused) void fetchData() }, [paused])` in each raw-history hook. **Verify by reading `lib/hooks/useAdaptivePolling.ts` in full before Wave 1.** |
| A4 | HA proxy returns `DevicePresence` records with `is_online: boolean` and `timestamp: number` (Unix seconds) when the endpoint is available | Example D implicit, RawHistoryTab shape | Low — shape locked in `fritzboxClient.getDevicePresenceHistory` at line 541–547; TypeScript compiler will catch mismatches. |
| A5 | `Badge` variants `'sage'`, `'ember'`, `'warning'`, `'danger'`, `'neutral'`, `'ocean'` all exist and render as expected | Pattern 4, Example A | Low — verified in `DeviceCategoryBadge.tsx`, `DeviceEventItem.tsx`, `WifiClientsTable.tsx`. |
| A6 | `Tabs.Trigger` component accepts `icon` prop and renders it before the label | Pattern 7 | Low — verified from `app/debug/page.tsx` lines 382–390 (all existing tabs pass `icon={<IconComponent size={18} />}`). |
| A7 | `/debug` page shows 9 tab keyboard shortcuts; adding a 10th is safe | Pattern 7 | Low — the key handler at `app/debug/page.tsx` line 308 uses `e.key >= '1' && e.key <= '9'`. A 10th tab would not have a keyboard shortcut but would still be click-accessible. Acceptable scope for Service Discovery (power-user feature). |

**If this table looks small:** That's accurate. Almost every claim in this research was verified by reading a source file in this session. The uncertain areas (A1, A3) are runtime behaviors that cannot be confirmed without executing the app against a real Fritz!Box, so they're explicit.

## Open Questions (RESOLVED)

1. **Call-type enum: exact values returned by the HA proxy.**
   - What we know: `fritzboxClient.CallRecord.call_type: string` (raw pass-through).
   - What's unclear: Whether values are `'in'/'out'/'missed'` (our assumption) or numeric (`'1'/'2'/'3'`) per TR-064 `X_AVM-DE_OnTel1`, or localized German/English strings from the proxy.
   - Recommendation: Wave 0 task — implementer runs `curl /api/fritzbox/telephony/calls?limit=3` against dev environment OR inspects the existing phase 162 route test fixture. Lock mapping before writing Badge logic. Component test has a "fallback to neutral Badge for unrecognized types" case.
   - **RESOLVED:** Plans handle this via the fallback-to-neutral Badge pattern in `CallHistoryTable.tsx` (Pitfall 5 — `default: return { variant: 'neutral', icon: <Phone size={14} />, label: 'Sconosciuto' }`). Unknown `call_type` values render as a neutral "Sconosciuto" badge without throwing. Acceptable resolution — live enum confirmation is a nice-to-have, not a blocker.

2. **`useAdaptivePolling` behavior on `interval: null → 60000` transition.**
   - What we know: `immediate: true` fires once on mount (line 78+ of `lib/hooks/useAdaptivePolling.ts`).
   - What's unclear: Whether unpausing (interval flipping from `null`) re-triggers the `immediate` fetch, or just resumes interval-based polling.
   - Recommendation: Plan task should explicitly include a Playwright smoke assertion "switch to Storico grezzo tab → data visible within 3s (not 65s)". If this fails, add a `useEffect(() => { if (!paused) void fetchData(); }, [paused])` to each lazy hook.
   - **RESOLVED:** Defensive paused→active re-fetch effect MUST be present in every paused-aware hook. Pattern: `useEffect(() => { if (!paused) void fetchData(); }, [paused]);` placed after the `useAdaptivePolling` call. This prevents the "switch tab, see stale skeleton for up to 60s" UX bug regardless of `useAdaptivePolling`'s re-immediate semantics. Applied to: `useFritzBandwidthHistoryRaw`, `useFritzDevicePresenceHistory`, `useFritzDeviceEventsRaw` (Plan 02 Task 1) AND `useFritzDectHandsets`, `useFritzCallHistory`, `useFritzTamStatus` (Plan 01 Task 1 — defensive; these are only paused when their host page is unmounted, but the effect is a zero-cost safety net).

3. **Duration humanization exact format.**
   - What we know: Requirement says "durata (humanized `mm:ss` or `hh:mm:ss`)".
   - What's unclear: Exact format when duration < 60s (e.g., `0:45` vs `45s`), and what happens when duration is 0 (never answered).
   - Recommendation: Use a small utility `humanizeDuration(seconds: number)` with `hh:mm:ss` format when `>= 3600`, `mm:ss` otherwise, `—` when 0. Colocate in `app/telefonia/lib/formatDuration.ts` with its own unit test.
   - **RESOLVED:** Inline the `formatDuration(sec: number)` helper inside `CallHistoryTable.tsx` (the sole consumer). Logic: `0 → '—'`; `sec >= 3600 → 'h:mm:ss'`; else `'mm:ss'`. Test cases in `CallHistoryTable.test.tsx` (Plan 01 Task 2 test c) cover `3725 → "1:02:05"`, `125 → "02:05"`, `0 → em-dash`. Colocation with the only consumer reduces indirection; separate utility file is unnecessary overhead.

4. **Service Discovery tab keyboard shortcut.**
   - What we know: `/debug` page's `handleKeyDown` handles keys 1–9 for the first 9 tabs.
   - What's unclear: Whether to extend the handler to support key '0' for the 10th tab or skip the shortcut for Service Discovery.
   - Recommendation: Skip the shortcut (discoverability is via mouse / keyboard-tab navigation). Claude's Discretion.
   - **RESOLVED:** No keyboard shortcut for the Service Discovery tab. Rationale: keys `1`-`9` are already allocated to the existing 9 tabs; adding a 10th shortcut (e.g., `0`) is not a regression because no prior `0` shortcut exists. Tab remains fully accessible via mouse click, keyboard Tab-navigation (Radix Tabs handles arrow keys natively), and URL deep-link `?tab=service-discovery`. Plan 02 Task 4 correctly leaves the `tabs` array at `app/debug/page.tsx:309` unchanged (9 entries ending in `'network'`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js dev server | All UI pages | ✓ | 16.1.0 | — |
| Jest + jsdom | Hook + component unit tests | ✓ | (inherited, runs via `npm run test:*`) | — |
| Playwright | Smoke tests | ✓ | (inherited, runs via `npm run test:e2e`) | — |
| HA proxy backend | `/api/fritzbox/*` live responses (optional for dev; tests mock fetch) | Unknown at research time | — | Mock responses in Jest; Playwright smoke tolerates non-OK (asserts tab activates without console errors) |
| Real Fritz!Box hardware | Live-fetch confirmation of call_type enum (A1) | Unknown — likely yes on user's local network | — | Phase 162 route test fixtures (if present) may be inspected in lieu of live device |

**Missing dependencies with no fallback:** None — this phase is pure UI wiring and its primary validation is Jest + Playwright, both of which mock or tolerate backend unavailability.

**Missing dependencies with fallback:** Real HA proxy during development — fully mockable in tests; manual QA can be deferred to release gate.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.x (via `next/jest.js`) + React Testing Library + jest-environment-jsdom |
| Config file | `/Users/federicomanfredi/Sites/localhost/pannello-stufa/jest.config.ts` |
| Quick run command | `npm run test:changed` |
| Scoped commands | `npm run test:pages` (for `app/telefonia/page.tsx`), `npm run test:components` (presentational components), `npm run test:api` (routes — none in this phase) — WARNING: existing `test:pages` / `test:components` scripts point at `__tests__/app/...` paths; new tests colocated in `app/telefonia/hooks/__tests__/` will be picked up via the global `**/__tests__/**` testMatch only if you run `npm test -- app/telefonia`. Use targeted paths. |
| Full suite command | `npm test` — **reserved for release gates per CLAUDE.md Rule 8; NEVER invoke alone from agents** |
| Smoke framework | Playwright (`@playwright/test`) |
| Smoke config | `tests/smoke/page-loads.spec.ts` |
| Smoke run command | `npm run test:e2e -- tests/smoke/page-loads.spec.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Status |
|--------|----------|-----------|-------------------|-------------|
| FRITZ-01 | DECT handsets render in `/telefonia` | Jest hook + Jest component + Playwright smoke | `npm test -- app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts app/telefonia/components/__tests__/DectHandsetsTable.test.tsx` + `npm run test:e2e -- tests/smoke/page-loads.spec.ts -g /telefonia` | ❌ Wave 0 — create hook + component + tests |
| FRITZ-02 | Call history paginates 50/page with Prev/Next | Jest hook (incl. pagination) + Jest component + Playwright smoke | `npm test -- app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts app/telefonia/components/__tests__/CallHistoryTable.test.tsx` | ❌ Wave 0 |
| FRITZ-03 | TAM card renders enabled indicator + message counts + stale banner | Jest hook + Jest component | `npm test -- app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts app/telefonia/components/__tests__/TamStatusCard.test.tsx` | ❌ Wave 0 |
| FRITZ-04 | Raw bandwidth table renders in `/network` Storico tab | Jest hook + Jest component + Playwright smoke (tab toggle) | `npm test -- app/network/hooks/__tests__/useFritzBandwidthRaw.test.ts app/network/components/__tests__/BandwidthRawTable.test.tsx` | ❌ Wave 0 |
| FRITZ-05 | Device presence gracefully handles 404 with EmptyState | Jest hook (404 case) + Jest component (EmptyState branch) | `npm test -- app/network/hooks/__tests__/useFritzDevicePresence.test.ts app/network/components/__tests__/DevicePresenceTable.test.tsx` | ❌ Wave 0 |
| FRITZ-06 | Raw device-events table renders in Storico tab | Jest hook + Jest component | `npm test -- app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts app/network/components/__tests__/DeviceEventsRawTable.test.tsx` | ❌ Wave 0 |
| FRITZ-07 | Service Discovery tab renders TR-064 services with Copy URL | Jest component + Playwright smoke (tab toggle) | `npm test -- app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx` | ❌ Wave 0 |
| Cross-cutting | CommandPalette `nav-telephony` entry navigates | Jest component | `npm test -- app/components/layout/__tests__/CommandPaletteProvider.test.tsx` (extend existing or create) | ❌ Wave 0 — existing provider has no dedicated test file; create |

### Sampling Rate

- **Per task commit:** `npm run test:changed` (picks up just the modified files) + `npm run test:quick` (bail on first failure for fast iteration).
- **Per wave merge:** Run the scoped union for that wave: e.g. `npm test -- app/telefonia app/network/hooks/__tests__/useFritzBandwidthRaw.test.ts ...` — use explicit paths, never bare `npm test`.
- **Phase gate:** Full suite green (`npm run test:ci`) + Playwright smoke green (`npm run test:e2e:ci`) before `/gsd-verify-work` sign-off. CLAUDE.md Rule 8: full suite is for release, not agent loops.

### Wave 0 Gaps

- [ ] **Framework install:** None needed — Jest + RTL + Playwright already configured.
- [ ] `app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts` — covers FRITZ-03
- [ ] `app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts` — covers FRITZ-01
- [ ] `app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts` — covers FRITZ-02 (includes pagination reset edge case)
- [ ] `app/telefonia/components/__tests__/TamStatusCard.test.tsx` — covers FRITZ-03 rendering
- [ ] `app/telefonia/components/__tests__/DectHandsetsTable.test.tsx` — covers FRITZ-01 rendering + empty state + battery-variant mapping
- [ ] `app/telefonia/components/__tests__/CallHistoryTable.test.tsx` — covers FRITZ-02 rendering + pagination controls + call-type Badge mapping (incl. unknown fallback per Pitfall 5)
- [ ] `app/network/hooks/__tests__/useFritzBandwidthRaw.test.ts` — covers FRITZ-04 incl. `hours` param change resets page
- [ ] `app/network/hooks/__tests__/useFritzDevicePresence.test.ts` — covers FRITZ-05 incl. 404 graceful path
- [ ] `app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts` — covers FRITZ-06
- [ ] `app/network/components/__tests__/BandwidthRawTable.test.tsx` — covers FRITZ-04 rendering
- [ ] `app/network/components/__tests__/DevicePresenceTable.test.tsx` — covers FRITZ-05 rendering (EmptyState when items empty AND stale)
- [ ] `app/network/components/__tests__/DeviceEventsRawTable.test.tsx` — covers FRITZ-06 rendering
- [ ] `app/network/components/__tests__/RawHistoryTab.test.tsx` — covers the container composition + TimeRangeSelector wiring
- [ ] `app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx` — covers FRITZ-07 incl. empty, error, refresh button, copy URL
- [ ] `app/components/layout/__tests__/CommandPaletteProvider.test.tsx` — covers `nav-telephony` entry (per D-20). Create if not present.
- [ ] `tests/smoke/page-loads.spec.ts` — **extend** with 3 new describe blocks (Example E above)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Auth0 session check enforced upstream by `withAuthAndErrorHandler` on every `/api/fritzbox/*` route (already shipped in phase 162). Phase 171 UI inherits this — D-19 locked: no per-page auth gate added. |
| V3 Session Management | yes | Auth0 cookie-based session; CSRF protection via same-origin fetch + cookie SameSite attribute (already configured in `@auth0/nextjs-auth0`). No session logic introduced in this phase. |
| V4 Access Control | yes | Rate limit 10 req/min/user enforced by `checkRateLimitFritzBox` on every route. Client polls at 1/min (60s) — 10% of budget. No client-side throttle needed. |
| V5 Input Validation | yes (lightweight) | Only `limit`, `offset`, `hours`, `mac` query params forwarded. URL construction via `URLSearchParams` — no manual string concat. Phase doesn't accept user-entered values that feed into API calls (only UI state like `page`, `hours`, which are controlled). |
| V6 Cryptography | no | No cryptographic operations introduced. Auth uses existing Auth0 + HA proxy's `X-API-Key` (both upstream of UI). |
| V7 Error Handling | yes | Hooks MUST NOT rethrow fetch errors into React tree (Pattern 3). Use `setStale(true)` + `setItems([])` pattern. Prevents error boundary cascades that would reveal stack traces. |
| V8 Data Protection | yes | Call history contains PII (phone numbers, contact names). Page is Auth0-gated — no additional disclosure mitigation needed. No new logging of call data. Do NOT log `CallRecord.number` / `.name` in console.error from hooks. |
| V11 Business Logic | no | No business workflows; read-only surface. |
| V12 File / Resources | no | No file uploads, no dynamic imports with user-controlled paths. |
| V13 API & Web Services | yes | XHR-style fetch to own-origin routes only; no cross-origin requests from UI (HA proxy is called server-side from Next.js API routes). |
| V14 Configuration | no | No new configuration surface. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via service-discovery XML-parsed values | Tampering (T) | `parseServiceDiscoveryXml` in `fritzboxClient.ts` uses regex extraction into plain strings. React's default JSX escaping prevents HTML injection when rendering `{row.original.name}` / `{row.original.url}` as text. Do NOT use `dangerouslySetInnerHTML` anywhere in the tab. |
| PII leak via console.error | Information Disclosure (I) | Hooks SHOULD swallow fetch errors silently (`catch {}` pattern from `useFritzWifiClients`). Where logging is retained for debug, redact phone numbers / names. |
| Rate limit DoS (polling floods server) | Denial of Service (D) | 60s polling + visibility-aware (300s when hidden) + paused when tab inactive = per-user load well under 10/min budget. |
| CSRF on refresh button | Tampering (T) | GET endpoints only; no mutations in phase scope. CSRF N/A. |
| Deep-linked `/debug?tab=service-discovery` bypass | Elevation of Privilege (E) | `/debug` is already restricted by the app shell's environment check (`process.env.NODE_ENV !== 'production'` gates the CommandPalette entry — but the page itself is accessible if someone knows the URL). D-11 locked: Service Discovery goes inside `/debug`, which is the established admin/debug surface. No additional gate needed. |

**Threat model summary:** This phase adds read-only consumers to Auth0-gated routes. The security posture is inherited from phase 162. New threat surface is effectively zero.

## Sources

### Primary (HIGH confidence)

All sources are files in the working codebase, verified this session:

- `.planning/phases/171-fritzbox-consumer-ui/171-CONTEXT.md` — User decisions (locked).
- `.planning/REQUIREMENTS.md` — FRITZ-01…FRITZ-07 acceptance criteria.
- `.planning/ROADMAP.md` — Phase 171 goal + success criteria.
- `.planning/phases/162-fritz-box-gap-closure/162-CONTEXT.md` + SUMMARY files — upstream API decisions, 404 warning on FRITZ-05.
- `lib/fritzbox/fritzboxClient.ts` — full client surface + all 7 new function signatures + `PaginatedResponse<T>` envelope.
- `app/api/fritzbox/telephony/{dect,calls,tam}/route.ts` — envelope keys: `{ dect }`, `{ calls }`, `{ tam }`.
- `app/api/fritzbox/history/{bandwidth,devices,device-events}/route.ts` — envelope keys: `{ bandwidth }`, `{ devices }`, `{ events }`.
- `app/api/fritzbox/service-discovery/route.ts` — envelope key: `{ discovery }` with shape `{ services: [...] }`.
- `app/network/hooks/useFritzWifiClients.ts` + its `__tests__/useFritzWifiClients.test.ts` — canonical polling hook + Jest pattern.
- `app/network/hooks/useFritzNetworkServices.ts` + its test — multi-fetch / `Promise.allSettled` pattern (reference only; phase uses independent hooks per decision).
- `app/network/page.tsx` — tab set structure + lazy-load `paused` pattern + NetworkTab type union.
- `app/network/components/{DeviceListTable,WifiClientsTable,DeviceEventItem,DeviceHistoryTimeline,TimeRangeSelector,CopyableIp}.tsx` — column defs, Italian labels, Badge usage, date-fns usage.
- `app/components/ui/DataTable.tsx` — full prop surface including density, `enablePagination`, `enableFiltering`, built-in "No data available" empty handling.
- `app/components/ui/{EmptyState,ErrorAlert,HealthIndicator,Banner,Skeleton}.tsx` — primitive signatures + gotcha on ErrorAlert's stove-coupling.
- `app/components/ui/index.ts` — authoritative export list (determines what to import from `@/app/components/ui`).
- `app/lights/page.tsx`, `app/sonos/page.tsx` — device-page layout reference (PageLayout, Heading, skeleton guard pattern).
- `app/debug/page.tsx` — Tabs integration + URL-sync pattern + keyboard shortcut array.
- `app/debug/components/tabs/NetworkTab.tsx` — manual-refresh pattern, copy-URL fine-grained implementation.
- `app/components/layout/CommandPaletteProvider.tsx` — nav entry structure (id, label, icon, onSelect).
- `app/registry/devices/page.tsx` lines 560–593 — canonical Prev/Next pagination UI with Italian labels.
- `tests/smoke/page-loads.spec.ts` — Playwright test structure + `collectConsoleErrors` helper.
- `jest.config.ts` — testMatch / testPathIgnorePatterns / ignored `.claude/` worktrees.
- `package.json` — all library versions confirmed; test scripts (`test:changed`, `test:quick`, `test:pages`, etc.).
- `lib/hooks/useAdaptivePolling.ts` (lines 1–80 read) — options surface + `initialDelay` + `immediate` semantics.
- `CLAUDE.md` — Rule 8 scoped-tests, Rule 3 prefer editing, Rule 5 update unit tests.

### Secondary (MEDIUM confidence)

- `lib/fritzbox/getCachedData` / `checkRateLimitFritzBox` — referenced by every phase 162 route; not read in full but known to be stable (phase 92-94 hardened these).

### Tertiary (LOW confidence)

- TR-064 `X_AVM-DE_OnTel1` call-type encoding (1=in, 2=missed, 3=out) — from general AVM Fritz!Box API knowledge; NOT verified against the HA proxy's actual response format. Feeds Pitfall 5 + Open Question 1. **Needs live-fetch confirmation.**

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library is already installed and exercised in similar patterns.
- Architecture patterns: HIGH — seven patterns mapped to existing files with line numbers.
- API shapes: HIGH — seven route envelope keys verified directly from `route.ts` files; seven client function signatures verified from `fritzboxClient.ts`.
- Pitfalls: HIGH-MEDIUM — six of eight pitfalls are verifiable codebase constraints; two are runtime behaviors (A1, A3) that can only be confirmed live.
- Integration points: HIGH — exact line numbers provided for `NetworkTab` union extension, Tabs.Trigger insertion, CommandPalette entry placement.
- Security domain: MEDIUM — inherited posture from phase 162; no new threat surface except Service Discovery XML parsing, which is handled server-side.

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 — codebase is actively evolving (v17.0 WS migration still has follow-ups in other phases); re-validate UI primitive surfaces if this phase isn't started within 30 days.
