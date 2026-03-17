# Phase 89: Raspberry Pi Dashboard Card - Research

**Researched:** 2026-03-17
**Domain:** React dashboard card, device registry integration, adaptive polling, error boundary
**Confidence:** HIGH

## Summary

Phase 89 builds the RaspiCard dashboard component, registers Raspberry Pi in the device registry, and adds its error boundary + skeleton. All infrastructure from Phase 88 is in place: API routes exist at `/api/raspi/{health,cpu,memory,disk,system}`, types are defined in `types/raspi.ts`, and `lib/raspi/raspiClient.ts` wraps every endpoint.

The orchestrator pattern (hook for state/polling + presentational sub-components) is the project standard, established by NetworkCard (Phase 62) and locked in as the codebase pattern. The device registry (RASPI-04) requires changes in three files: `lib/devices/deviceTypes.ts` (add `'raspi'` to the union and `DEVICE_CONFIG`), `lib/devices/deviceTypes.ts` `DEFAULT_DEVICE_ORDER` (add `'raspi'`), and `app/components/DashboardCards.tsx` (add to `CARD_COMPONENTS`, `CARD_SKELETONS`, `DEVICE_META`). The skeleton (RASPI-07) follows the `Skeleton.NetworkCard` pattern: add a new static method `Skeleton.RaspiCard` in `app/components/ui/Skeleton.tsx`.

**Primary recommendation:** Clone the NetworkCard pattern exactly. NetworkCard is the closest precedent (display-only, no navbar, no scheduler, adaptive polling, HealthIndicator in header, 30s/5min intervals). Raspberry Pi is simpler — single API call instead of three parallel calls.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RASPI-04 | Raspberry Pi registered in device registry with adaptive polling | `lib/devices/deviceTypes.ts` + `DEFAULT_DEVICE_ORDER` + `DashboardCards.tsx` registration; `useAdaptivePolling` hook already in `lib/hooks/` |
| RASPI-05 | RaspiCard dashboard component (CPU%, RAM%, disk%, temperature, health badge) | Orchestrator pattern from NetworkCard; `/api/raspi/system` returns all needed fields in one call; `HealthIndicator` component ready |
| RASPI-07 | Error boundary and loading skeleton for RaspiCard | `DeviceCardErrorBoundary` in `app/components/ErrorBoundary/`; `Skeleton.NetworkCard` pattern for new `Skeleton.RaspiCard`; `DashboardCards.tsx` already wraps all cards in both |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + `'use client'` | 19 (Next 15.5) | Client component for polling | All card hooks are client-side |
| `useAdaptivePolling` | internal | Polling + Page Visibility pause | Project standard, all polling cards use it |
| `useVisibility` | internal | Page Visibility API | Used inside `useAdaptivePolling` automatically |
| `react-error-boundary` | installed | Error isolation | `DeviceCardErrorBoundary` uses it already |
| `Skeleton.*` compound component | internal | Loading placeholder | Project design system |
| `SmartHomeCard` | internal | Card shell | All dashboard cards use it |
| `HealthIndicator` | internal | Health badge | Used in NetworkCard header, same use here |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | installed | Icons | Use `Cpu`, `MemoryStick`, `HardDrive`, `Thermometer` if needed in sub-components |
| `@/types/raspi` | internal | TypeScript types for all raspi responses | Import from here, not inline |

**Installation:** None — all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure

```
app/components/devices/raspi/
├── RaspiCard.tsx                    # Orchestrator (RASPI-05)
├── hooks/
│   └── useRaspiData.ts              # State + polling (RASPI-04 adaptive polling)
├── components/
│   └── RaspiStats.tsx               # Presentational sub-component
└── __tests__/
    └── RaspiCard.test.tsx           # Integration tests (RASPI-07)
```

Files also modified:
- `lib/devices/deviceTypes.ts` — add `'raspi'` to `DeviceTypeId` union, `DEVICE_TYPES`, `DEVICE_CONFIG`, `DEFAULT_DEVICE_ORDER` (RASPI-04)
- `app/components/DashboardCards.tsx` — add to `CARD_COMPONENTS`, `CARD_SKELETONS`, `DEVICE_META` (RASPI-04, RASPI-07)
- `app/components/ui/Skeleton.tsx` — add `Skeleton.RaspiCard` method (RASPI-07)
- `lib/services/unifiedDeviceConfigService.ts` — add `'raspi'` description in `getDeviceDescription`

### Pattern 1: Orchestrator Hook (useRaspiData)

**What:** All state, polling, fetch, and error logic in one hook; component is purely presentational.
**When to use:** All dashboard cards — locked project pattern.

```typescript
// Source: lib/hooks/useAdaptivePolling.ts + app/components/devices/network/hooks/useNetworkData.ts
'use client';

import { useState, useCallback } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type { SystemResponse } from '@/types/raspi';

export function useRaspiData() {
  const [data, setData] = useState<SystemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const isVisible = useVisibility();
  const interval = isVisible ? 30000 : 300000; // 30s visible, 5min hidden

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [sysRes, cpuRes, memRes, diskRes] = await Promise.all([
        fetch('/api/raspi/system'),
        fetch('/api/raspi/cpu'),
        fetch('/api/raspi/memory'),
        fetch('/api/raspi/disk'),
      ]);
      // ... process and setState
      setStale(false);
    } catch {
      setStale(true);
      if (!data) setError('Raspberry Pi non raggiungibile');
    } finally {
      setLoading(false);
    }
  }, []); // data dep optional — see pitfall below

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600, // stagger — NetworkCard uses 500ms
  });

  return { data, loading, error, stale };
}
```

**Note on API consolidation:** The card only needs CPU%, RAM%, disk%, and temperature. That is exactly `system` + `cpu` + `memory` + `disk`. However `system` already contains `load_avg_*` and `process_count` (not needed by card). Simplest approach: call all four endpoints in `Promise.all`. The `/api/raspi/system` endpoint returns `cpu_temperature`, `uptime_seconds`, `load_avg_*`, `process_count`, `network` — but NOT `cpu_percent`, `memory.percent`, or `disk.percent`. Those require their respective endpoints. So the hook MUST call at minimum: `/api/raspi/cpu` (cpu_percent), `/api/raspi/memory` (percent), `/api/raspi/disk` (percent), and `/api/raspi/system` (cpu_temperature). Alternatively, three calls: cpu, memory, disk — and skip `/api/raspi/system` on the card, reading only cpu_temperature from the system response. Either works; using all four keeps alignment with the types.

### Pattern 2: Health Badge Mapping

**What:** Map raw system metrics to `HealthIndicator` status values.
**When to use:** Every card with a health badge.

```typescript
// Source: app/components/devices/network/networkHealthUtils.ts (pattern)
type RaspiHealth = 'ok' | 'warning' | 'error';

function computeRaspiHealth(cpuPercent: number, memPercent: number, diskPercent: number, tempC: number | null): RaspiHealth {
  if (diskPercent > 90 || memPercent > 95) return 'error';
  if (cpuPercent > 80 || memPercent > 80 || diskPercent > 75 || (tempC !== null && tempC > 70)) return 'warning';
  return 'ok';
}
```

Thresholds are Claude's discretion (no locked decisions). The above is consistent with common embedded monitoring thresholds.

### Pattern 3: Device Registry Registration (RASPI-04)

**What:** Add `raspi` to `DeviceTypeId` union, `DEVICE_TYPES`, `DEVICE_CONFIG`, `DISPLAY_ITEMS` (or keep as hardware), and `DEFAULT_DEVICE_ORDER`.
**Classification decision:** Raspberry Pi has a dedicated `/raspi` page (Phase 90), so it is a hardware device (not display-only). It goes into `DEVICE_CONFIG`, not `DISPLAY_ITEMS`. Like `network`, it has no scheduler, no maintenance, no errors — just a `main` route.

```typescript
// Source: lib/devices/deviceTypes.ts (pattern from network entry)

// 1. Add to union:
export type DeviceTypeId = 'stove' | 'thermostat' | 'camera' | 'lights' | 'sonos' | 'network' | 'raspi';

// 2. Add to DEVICE_TYPES:
RASPI: 'raspi',

// 3. Add to DEVICE_CONFIG:
[DEVICE_TYPES.RASPI]: {
  id: 'raspi',
  name: 'Raspberry Pi',
  icon: '🖥️',
  color: 'success',   // green — system/health theme
  enabled: true,
  routes: { main: '/raspi' },
  features: { hasScheduler: false, hasMaintenance: false, hasErrors: false },
},

// 4. Add to DEFAULT_DEVICE_ORDER (after network, before sonos):
export const DEFAULT_DEVICE_ORDER: string[] = ['stove', 'thermostat', 'weather', 'lights', 'camera', 'network', 'raspi', 'sonos'];
```

**Note:** `DeviceColor` union must also accept `'success'` — it already does (see `DeviceColors.success` in `deviceTypes.ts`).

### Pattern 4: Skeleton.RaspiCard

**What:** Static method on `Skeleton` compound component. Mirrors card layout with shimmer blocks.
**Pattern:** `Skeleton.NetworkCard` is the reference. RaspiCard has: header (icon + title), health badge, 4 metric boxes (CPU%, RAM%, disk%, temp).

```typescript
// Source: app/components/ui/Skeleton.tsx Skeleton.NetworkCard (lines 785–834)
Skeleton.RaspiCard = function SkeletonRaspiCard() {
  const Card = Skeleton.Card;
  return (
    <Card className="overflow-visible transition-all duration-500">
      {/* Accent bar — success green theme */}
      <div className="h-1 bg-gradient-to-r from-success-500/50 via-success-400/50 to-success-600/50" />
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-32 h-6 rounded" />
        </div>
        {/* 4 metric boxes */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};
```

### Pattern 5: DashboardCards Registration

**What:** Add `raspi` to three registries in `DashboardCards.tsx`.

```typescript
// Source: app/components/DashboardCards.tsx

import RaspiCard from './devices/raspi/RaspiCard';

const CARD_COMPONENTS: Record<string, React.ComponentType> = {
  // ...existing...
  raspi: RaspiCard,
};

const CARD_SKELETONS: Record<string, React.ComponentType> = {
  // ...existing...
  raspi: Skeleton.RaspiCard,
};

const DEVICE_META: Record<string, { name: string; icon: string }> = {
  // ...existing...
  raspi: { name: 'Raspberry Pi', icon: '🖥️' },
};
```

### Anti-Patterns to Avoid

- **Multiple polling loops:** Never call `useAdaptivePolling` twice. One hook, one loop.
- **State in presentational components:** `RaspiStats.tsx` must accept props only — no `useState`, no `useEffect`.
- **Skipping initialDelay:** Use `initialDelay: 600` (or similar) to stagger the first fetch and avoid thundering herd with other cards on mount.
- **Fetching only `/api/raspi/system`:** System endpoint does NOT include cpu_percent, memory.percent, or disk.percent. Must also call cpu/memory/disk endpoints.
- **Ignoring cpu_temperature null:** The API documents `cpu_temperature: number | null`. Always guard before displaying.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page Visibility polling pause | Custom visibilitychange listener | `useAdaptivePolling` (already has it) | Handles SSR, stale closure, visibility restore edge cases |
| Error boundary | Class-based ErrorBoundary | `DeviceCardErrorBoundary` wraps `react-error-boundary`, logs analytics | Project pattern, already wraps every card |
| Loading skeleton | Inline skeleton markup | `Skeleton.RaspiCard` method added to Skeleton.tsx | Consistent with all other card skeletons |
| Health status computation | Inline ternary chains | Separate `raspiHealthUtils.ts` helper (or inline in hook if simple) | Keeps hook lean, enables isolated unit tests |

**Key insight:** Everything needed exists. This is assembly work — plug `raspiClient` calls into `useRaspiData` hook, render with `SmartHomeCard` + `HealthIndicator`, register in three files.

## Common Pitfalls

### Pitfall 1: Forgetting DEFAULT_DEVICE_ORDER
**What goes wrong:** Adding to `DEVICE_CONFIG` but not `DEFAULT_DEVICE_ORDER` means new users never see the card; `getUnifiedDeviceConfigAdmin` backfills from `DEFAULT_DEVICE_ORDER`.
**Why it happens:** Two separate arrays must stay in sync.
**How to avoid:** Always update both `DEVICE_CONFIG` and `DEFAULT_DEVICE_ORDER` together.
**Warning signs:** Card appears in settings but not dashboard for new users.

### Pitfall 2: `DeviceTypeId` Union Out of Sync
**What goes wrong:** TypeScript errors in `deviceRegistry.ts` and `unifiedDeviceConfigService.ts` when `'raspi'` is not in the `DeviceTypeId` union.
**Why it happens:** The union is separate from `DEVICE_CONFIG` keys.
**How to avoid:** Update the type union, `DEVICE_TYPES` const, and `DEVICE_CONFIG` in the same commit.

### Pitfall 3: `hasHomepageCard` / `isDisplayOnly` Classification
**What goes wrong:** If `raspi` is accidentally listed in `DISPLAY_ITEMS` instead of `DEVICE_CONFIG`, it gets display-only behavior (no navbar entry even when Phase 90 adds `/raspi`).
**Why it happens:** Two separate registries for hardware vs display items.
**How to avoid:** `raspi` goes in `DEVICE_CONFIG` (hardware device), NOT `DISPLAY_ITEMS`. The description comment in `unifiedDeviceConfigService.ts` clarifies: display-only = no navbar. Raspi needs a navbar entry for Phase 90.

### Pitfall 4: `cpu_temperature` null Rendering
**What goes wrong:** Runtime crash or "null°C" displayed when temperature sensor unavailable.
**Why it happens:** `SystemResponse.cpu_temperature` is `number | null` per API spec.
**How to avoid:** Render `data.cpu_temperature !== null ? `${data.cpu_temperature.toFixed(1)}°C` : '—'`.

### Pitfall 5: Stale Closure in fetchData useCallback
**What goes wrong:** `fetchData` callback captures stale `data` state for the "no cached data" guard.
**Why it happens:** Missing `data` in `useCallback` deps OR ref pattern not used.
**How to avoid:** Either include `data` in deps (causes fetchData to be recreated on every fetch, acceptable for simple hooks) or use a `dataRef` pattern like NetworkCard does with `bandwidth`/`wan` guards.

## Code Examples

### Verified: useAdaptivePolling signature
```typescript
// Source: lib/hooks/useAdaptivePolling.ts
useAdaptivePolling({
  callback: fetchData,    // () => void | Promise<void>
  interval,               // number | null  (null = pause)
  alwaysActive: false,    // non-safety-critical
  immediate: true,        // fetch on mount
  initialDelay: 600,      // ms stagger
});
```

### Verified: DeviceCardErrorBoundary usage
```typescript
// Source: app/components/DashboardCards.tsx lines 94-101
<DeviceCardErrorBoundary deviceName="Raspberry Pi" deviceIcon="🖥️">
  <Suspense fallback={<Skeleton.RaspiCard />}>
    <RaspiCard />
  </Suspense>
</DeviceCardErrorBoundary>
```

### Verified: HealthIndicator in card header
```typescript
// Source: app/components/devices/network/NetworkCard.tsx lines 101-113
<SmartHomeCard
  icon="🖥️"
  title="Raspberry Pi"
  colorTheme="sage"  // or a new theme; sage works for system/green
  headerActions={
    <HealthIndicator
      status={raspiHealth}  // 'ok' | 'warning' | 'error' | 'critical'
      size="sm"
      showIcon={true}
      label=""
    />
  }
>
```

### Verified: Network card error handling pattern (unreachable proxy)
```typescript
// Source: app/components/devices/network/hooks/useNetworkData.ts lines 277-286
} catch {
  setStale(true);
  if (!data) {
    setError('Raspberry Pi non raggiungibile');
  }
} finally {
  setLoading(false);
}
```

### Verified: Skeleton compound component pattern
```typescript
// Source: app/components/ui/Skeleton.tsx lines 785-834 (NetworkCard skeleton)
Skeleton.RaspiCard = function SkeletonRaspiCard() { ... };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based components with internal state | Orchestrator hook + presentational components | Phase 58 (StoveCard) | Hook owns state, component renders only |
| CSS Grid masonry | Flexbox two-column + parity split | Phase 68 | Cards added to `DashboardCards.tsx` automatically get correct layout |
| Direct API calls in components | All API calls behind `/api/raspi/*` Next.js proxy routes | Phase 88 | No CORS, auth handled server-side |

**Deprecated/outdated:**
- Class-based ErrorBoundary: replaced by `react-error-boundary` + `DeviceCardErrorBoundary` wrapper (Phase 56).
- `useNetworkQuality` for polling strategy: superseded by `useAdaptivePolling` + `useVisibility` (Phase 57).

## Open Questions

1. **Color theme for RaspiCard SmartHomeCard**
   - What we know: `SmartHomeCard` accepts `colorTheme: 'ember' | 'ocean' | 'sage' | 'warning' | 'danger'`
   - What's unclear: No dedicated "system/green" theme; `sage` (emerald/teal) is closest to a "healthy system" feel
   - Recommendation: Use `colorTheme="sage"` — same as NetworkCard. Consistent "infrastructure monitoring" feel.

2. **Single `/api/raspi/system` vs. four separate calls**
   - What we know: `system` returns temperature/uptime/load/processes but NOT cpu_percent/memory.percent/disk.percent
   - What's unclear: Whether the planner should design one hook call or three/four
   - Recommendation: Three calls — `/api/raspi/cpu`, `/api/raspi/memory`, `/api/raspi/disk` give the card's 4 metrics. Skip `/api/raspi/system` on the card (temperature is in `/api/raspi/system` only). Either add system call or display temperature as "n/a" on dashboard card (Phase 90 detail page can show it). **Recommend including system call** since temperature is explicitly listed in RASPI-05 success criteria.

3. **`raspi` visible by default for existing users**
   - What we know: `getUnifiedDeviceConfigAdmin` backfills missing devices from `DEFAULT_DEVICE_ORDER` with `visible: false`
   - What's unclear: Should raspi default to visible for new users?
   - Recommendation: Add to `DEFAULT_DEVICE_ORDER` with `visible: true` for new users (consistent with all other devices except Sonos). Existing users see it as hidden until they enable it in Settings.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + React Testing Library |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern=raspi` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RASPI-04 | `raspi` appears in `DEFAULT_DEVICE_ORDER` | unit | `npm test -- --testPathPattern=deviceTypes` | ❌ Wave 0 |
| RASPI-04 | `useRaspiData` polls with adaptive interval | unit | `npm test -- --testPathPattern=useRaspiData` | ❌ Wave 0 |
| RASPI-04 | `useRaspiData` pauses when tab hidden | unit | `npm test -- --testPathPattern=useRaspiData` | ❌ Wave 0 |
| RASPI-05 | RaspiCard shows CPU%, RAM%, disk%, temp, health badge | unit | `npm test -- --testPathPattern=RaspiCard` | ❌ Wave 0 |
| RASPI-05 | RaspiCard shows loading skeleton during initial fetch | unit | `npm test -- --testPathPattern=RaspiCard` | ❌ Wave 0 |
| RASPI-07 | Error state rendered when proxy unreachable | unit | `npm test -- --testPathPattern=RaspiCard` | ❌ Wave 0 |
| RASPI-07 | `DeviceCardErrorBoundary` catches thrown error from RaspiCard | unit | `npm test -- --testPathPattern=RaspiCard` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=raspi --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/components/devices/raspi/__tests__/RaspiCard.test.tsx` — covers RASPI-05, RASPI-07
- [ ] `lib/hooks/__tests__/useRaspiData.test.ts` — covers RASPI-04 (polling, visibility pause)

*(Existing `lib/raspi/__tests__/raspiClient.test.ts` covers Phase 88 scope, not Phase 89.)*

## Sources

### Primary (HIGH confidence)
- `app/components/devices/network/NetworkCard.tsx` — orchestrator pattern reference
- `app/components/devices/network/hooks/useNetworkData.ts` — polling + error handling pattern
- `lib/hooks/useAdaptivePolling.ts` — hook API and options
- `lib/devices/deviceTypes.ts` — device registry schema
- `app/components/DashboardCards.tsx` — CARD_COMPONENTS/CARD_SKELETONS/DEVICE_META registration
- `app/components/ui/Skeleton.tsx` — Skeleton.NetworkCard compound method pattern
- `app/components/ErrorBoundary/DeviceCardErrorBoundary.tsx` — error boundary usage
- `types/raspi.ts` — all raspi response types
- `docs/api/raspberry-pi.md` — API field reference (which endpoint returns what)

### Secondary (MEDIUM confidence)
- `lib/services/unifiedDeviceConfigService.ts` — backfill migration logic for new devices

### Tertiary (LOW confidence)
- None — all findings verified directly from source files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from source files; all dependencies installed
- Architecture: HIGH — NetworkCard is a direct precedent; patterns are identical
- Pitfalls: HIGH — discovered from reading actual code paths (DEFAULT_DEVICE_ORDER, DeviceTypeId union, null temp)

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable codebase, no fast-moving external deps)
