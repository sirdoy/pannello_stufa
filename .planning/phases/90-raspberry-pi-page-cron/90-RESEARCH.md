# Phase 90: Raspberry Pi Page + Cron - Research

**Researched:** 2026-03-18
**Domain:** Next.js page orchestration, React hook composition, cron health check integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page layout**
- Orchestrator pattern matching /network page: thin page orchestrator + presentational stat cards
- Sections: CPU & Temperature, Memory, Disk, System Info (uptime, load averages, process count), Network I/O
- Use existing design system components (PageLayout, Card, Heading, Text, Skeleton, Button)
- Back button "← Indietro" linking to dashboard, same as /network page header pattern
- Loading skeleton guard on initial load, same pattern as /network page

**Data fetching**
- Create `useRaspiFullData` hook that fetches ALL data from all 4 endpoints (cpu, memory, disk, system)
- Returns full SystemResponse fields (uptime_seconds, load_avg_1/5/15, process_count, network bytes_sent/bytes_recv, interface) plus cpu/memory/disk data
- Reuses useAdaptivePolling with 30s visible / 300s hidden intervals (same as useRaspiData)
- useRaspiData (Phase 89) stays unchanged — it powers the dashboard RaspiCard with card-level summary

**Cron integration**
- Add raspiClient.getHealth() call inside existing `app/api/health-monitoring/check/route.ts`
- Wrap in isolated try/catch so Raspberry Pi failure does NOT abort stove/thermostat health checks
- Include Raspberry Pi status in the response summary (raspiStatus: 'ok' | 'unreachable')
- Log failure with console.warn (fire-and-forget, no notification — Raspberry Pi is informational, not safety-critical like stove)
- No separate cron step in GitHub Actions — single /api/health-monitoring/check endpoint handles all devices

**Page navigation**
- RaspiCard on dashboard links to /raspi when tapped (same pattern as NetworkCard → /network)
- /raspi page has back button to dashboard

### Claude's Discretion
- Exact stat card layout and grouping within the page
- How to format uptime (days/hours/minutes display)
- How to format network I/O bytes (human-readable MB/GB)
- Whether to show load averages as a mini visualization or plain text

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RASPI-06 | Dedicated /raspi page with full system stats (uptime, load avgs, network I/O, process count) | useRaspiFullData hook + orchestrator page pattern well established via /network; all data available from existing /api/raspi/* routes |
| RASPI-08 | Raspberry Pi health included in 5-min cron monitoring check | raspiClient.getHealth() ready; health-monitoring/check route uses Promise.allSettled pattern already; isolated try/catch prevents cross-device abort |
</phase_requirements>

## Summary

Phase 90 is a straightforward extension of established patterns. The /network page orchestrator, the useRaspiData hook structure, and the health-monitoring/check cron route all provide clear, verified templates to follow. No new libraries or infrastructure are needed — everything is reuse and wiring.

The /raspi page requires a new `useRaspiFullData` hook (extends the existing useRaspiData pattern to expose all SystemResponse fields), a thin page orchestrator at `app/raspi/page.tsx`, and several presentational stat section components under `app/raspi/components/`. RaspiCard needs a click handler wired to `router.push('/raspi')` matching exactly how NetworkCard navigates to /network.

The cron integration is minimal: one `raspiClient.getHealth()` call wrapped in a `try/catch` block added to the existing `GET` handler in `app/api/health-monitoring/check/route.ts`. The response object gains a `raspiStatus` field. No GitHub Actions changes are needed — the existing cron already calls this endpoint.

**Primary recommendation:** Two plans — Plan 01 for the /raspi page (hook + orchestrator + components + RaspiCard link + tests), Plan 02 for the cron integration (health-check route update + test).

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | Page routing (`app/raspi/page.tsx`) | Project standard |
| React | 19 | Component model | Project standard |
| TypeScript | 5.x | Types (types/raspi.ts already exists) | Project standard |
| Tailwind CSS | 3.x | Styling, dark/light mode selectors | Project standard |

### Supporting (project-internal, verified by reading source)
| Library | Purpose | Location |
|---------|---------|---------|
| useAdaptivePolling | Visibility-aware interval polling | `lib/hooks/useAdaptivePolling.ts` |
| useVisibility | Tab visibility detection | `lib/hooks/useVisibility.ts` |
| raspiClient | HA proxy client for all 5 raspi endpoints | `lib/raspi/raspiClient.ts` |
| withCronSecret | Route wrapper for cron authentication | `lib/core/index.ts` |
| success() | Standardized success response helper | `lib/core/index.ts` |

### Design System Components (verified available)
| Component | Usage on /raspi page |
|-----------|---------------------|
| PageLayout + PageLayout.Header | Page shell with header slot |
| Card (variant="elevated") | Section containers |
| Heading | Page title, section labels |
| Text | Labels, values, secondary info |
| Button (variant="ghost", size="sm") | "← Indietro" back button |
| Skeleton | Loading guard before data available |
| Badge | Health status, interface name |
| InfoBox | Stat key/value pairs (confirmed used in WanStatusCard) |
| Banner | Stale state warning |

**No installation needed** — all dependencies already present.

## Architecture Patterns

### Recommended File Structure

```
app/raspi/
├── page.tsx                           # Orchestrator — 'use client', ~80 LOC
└── components/
    ├── RaspiSystemInfo.tsx            # Uptime, load averages, process count
    ├── RaspiNetworkIO.tsx             # bytes_sent, bytes_recv, interface
    ├── RaspiCpuTemp.tsx               # CPU% + temperature (combined card)
    ├── RaspiMemoryDisk.tsx            # Memory + Disk side-by-side

app/components/devices/raspi/hooks/
└── useRaspiFullData.ts                # New: full data hook for /raspi page

# Modified:
app/components/devices/raspi/RaspiCard.tsx    # Add onClick → /raspi
app/api/health-monitoring/check/route.ts      # Add raspiClient.getHealth() call
```

### Pattern 1: Page Orchestrator (mirrors /network page.tsx exactly)

**What:** `'use client'` page that owns the hook call and distributes data to presentational components via props. No state/effects in presentational components.

**When to use:** Always for detail pages in this project.

**Example (from verified source `app/network/page.tsx`):**
```typescript
'use client';
import { useRouter } from 'next/navigation';
import { PageLayout, Skeleton, Button, Heading } from '@/app/components/ui';
import { useRaspiFullData } from '@/app/components/devices/raspi/hooks/useRaspiFullData';
import RaspiSystemInfo from './components/RaspiSystemInfo';

export default function RaspiPage() {
  const router = useRouter();
  const { data, loading, stale } = useRaspiFullData();

  // Loading skeleton guard — only on initial load (no cached data)
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-[200px] rounded-2xl" />
        <Skeleton className="h-[200px] rounded-2xl" />
      </div>
    );
  }

  return (
    <PageLayout
      header={
        <PageLayout.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                ← Indietro
              </Button>
              <Heading level={1} size="2xl">Raspberry Pi</Heading>
            </div>
          </div>
        </PageLayout.Header>
      }
    >
      <div className="space-y-6">
        <RaspiSystemInfo data={data} isStale={stale} />
        {/* ... other section components */}
      </div>
    </PageLayout>
  );
}
```

### Pattern 2: useRaspiFullData Hook (mirrors useRaspiData)

**What:** Client hook that fetches all 4 endpoints in parallel and exposes all fields from all responses. Same polling config as useRaspiData.

**Key difference from useRaspiData:** Exposes the full `SystemResponse` fields (uptime_seconds, load_avg_1/5/15, process_count, network) plus raw used_bytes/total_bytes from memory/disk — not just percentages.

**Example (derived from verified `useRaspiData.ts` source):**
```typescript
'use client';
import { useState, useCallback, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type { CpuResponse, MemoryResponse, DiskResponse, SystemResponse } from '@/types/raspi';

export interface RaspiFullData {
  // From cpu endpoint
  cpuPercent: number;
  // From memory endpoint
  memoryPercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  // From disk endpoint
  diskPercent: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  // From system endpoint
  cpuTemperature: number | null;
  uptimeSeconds: number;
  loadAvg1: number;
  loadAvg5: number;
  loadAvg15: number;
  processCount: number;
  networkBytesSent: number;
  networkBytesRecv: number;
  networkInterface: string;
}

export function useRaspiFullData() {
  const [data, setData] = useState<RaspiFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<RaspiFullData | null>(null);
  const isVisible = useVisibility();
  const interval = isVisible ? 30000 : 300000;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [cpuRes, memRes, diskRes, sysRes] = await Promise.all([
        fetch('/api/raspi/cpu'),
        fetch('/api/raspi/memory'),
        fetch('/api/raspi/disk'),
        fetch('/api/raspi/system'),
      ]);
      if (!cpuRes.ok || !memRes.ok || !diskRes.ok || !sysRes.ok) {
        throw new Error('One or more Raspberry Pi endpoints failed');
      }
      const [cpu, mem, disk, sys] = await Promise.all([
        cpuRes.json() as Promise<CpuResponse>,
        memRes.json() as Promise<MemoryResponse>,
        diskRes.json() as Promise<DiskResponse>,
        sysRes.json() as Promise<SystemResponse>,
      ]);
      const newData: RaspiFullData = {
        cpuPercent: cpu.cpu_percent,
        memoryPercent: mem.percent,
        memoryUsedBytes: mem.used_bytes,
        memoryTotalBytes: mem.total_bytes,
        diskPercent: disk.percent,
        diskUsedBytes: disk.used_bytes,
        diskTotalBytes: disk.total_bytes,
        cpuTemperature: sys.cpu_temperature,
        uptimeSeconds: sys.uptime_seconds,
        loadAvg1: sys.load_avg_1,
        loadAvg5: sys.load_avg_5,
        loadAvg15: sys.load_avg_15,
        processCount: sys.process_count,
        networkBytesSent: sys.network.bytes_sent,
        networkBytesRecv: sys.network.bytes_recv,
        networkInterface: sys.network.interface,
      };
      dataRef.current = newData;
      setData(newData);
      setStale(false);
    } catch {
      setStale(true);
      if (!dataRef.current) setError('Raspberry Pi non raggiungibile');
    } finally {
      setLoading(false);
    }
  }, []);

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,  // Same as useRaspiData
  });

  return { data, loading, stale, error };
}
```

### Pattern 3: Cron Health Check Integration

**What:** Isolated try/catch wrapping `raspiClient.getHealth()` added to the existing `GET` handler. Uses `console.warn` on failure (not `console.error`, not a notification). Result included in the `success()` response payload.

**Key constraint:** The existing `withCronSecret` wrapper and `Promise.allSettled` for user stove checks must NOT be changed. Raspberry Pi check is added AFTER the user stove results are assembled (step 7 in the existing route).

**Example (from verified `app/api/health-monitoring/check/route.ts` structure):**
```typescript
// Add after step 7 (prepare response), before the return success() call:

let raspiStatus: 'ok' | 'unreachable' = 'unreachable';
try {
  await raspiClient.getHealth();
  raspiStatus = 'ok';
} catch (err) {
  console.warn('⚠️ Raspberry Pi unreachable during health check:', err);
  // Do NOT throw — other checks already complete
}

return success({
  checked: users.length,
  successCount,
  failureCount,
  mismatches,
  raspiStatus,          // New field
  timestamp: Date.now(),
  duration,
});
```

Note: `raspiClient` must be imported at the top of the file.

### Pattern 4: RaspiCard Navigation Link

**What:** Wrap the main RaspiCard render in a clickable div that navigates to `/raspi` — identical to how NetworkCard wraps its content.

**Example (from verified `NetworkCard.tsx`):**
```typescript
// In RaspiCard.tsx, wrap the main return (data present state) in:
<div
  onClick={() => router.push('/raspi')}
  className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
  role="link"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push('/raspi');
    }
  }}
  aria-label="Vai alla pagina Raspberry Pi"
>
  {/* existing SmartHomeCard JSX unchanged */}
</div>
```

Requires adding `useRouter` import and `const router = useRouter();` to RaspiCard.

### Formatting Utilities (Claude's Discretion)

**Uptime format** — identical to `formatUptime()` in `WanStatusCard.tsx` (verified source):
```typescript
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
```

**Bytes format** — human-readable MB/GB (no external library needed):
```typescript
function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_024).toFixed(0)} KB`;
}
```

**Load averages** — plain text is sufficient; no visualization needed for 3 simple numbers. Display as `0.42 / 0.38 / 0.35` (1m / 5m / 15m).

### Anti-Patterns to Avoid
- **Modifying useRaspiData:** It is used by the dashboard RaspiCard and must remain unchanged. useRaspiFullData is a separate hook.
- **Adding state to presentational components:** All stat components receive `data` as prop, no `useState`/`useEffect`.
- **Making RaspiCard non-clickable states navigable:** Only wrap the main data-present state in the click handler. Error/loading states should NOT navigate.
- **Calling raspiClient.getHealth() in a Promise.allSettled alongside stove checks:** Keep raspi check isolated after stove checks complete — different isolation strategy (simple try/catch, not Promise.allSettled, because the result is a single status string, not per-user results).
- **Aborting cron on raspi failure:** The try/catch must not re-throw. Failure is logged, not propagated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Visibility-aware polling | Custom interval + document.hidden | `useAdaptivePolling` + `useVisibility` | Already handles all edge cases (visibility change, cleanup, immediate fetch) |
| Uptime formatting | New utility | Copy `formatUptime()` pattern from WanStatusCard | Identical requirement, same Italian locale format |
| Bytes formatting | External library | Inline `formatBytes()` helper | No new dependency needed for simple byte conversion |
| Cron protection | Custom auth | `withCronSecret` wrapper | Already handles CRON_SECRET validation |
| API error response | Custom error shape | `success()` / `withAuthAndErrorHandler` | Established RFC 9457 pattern |

**Key insight:** This phase is pure composition of existing building blocks. Every pattern has an exact precedent in the codebase.

## Common Pitfalls

### Pitfall 1: useRaspiData initialDelay vs. useRaspiFullData
**What goes wrong:** New hook uses a different `initialDelay` value, causing visible poll collisions with the dashboard RaspiCard when both pages are somehow mounted simultaneously (unlikely but possible in React dev fast-refresh scenarios).
**Why it happens:** Forgetting that useRaspiData already uses `initialDelay: 600`.
**How to avoid:** Use `initialDelay: 600` in useRaspiFullData. The /raspi page only mounts when navigated to — the dashboard card is unmounted — so collisions don't happen in production, but consistent values are cleaner.
**Warning signs:** During dev, double fetch calls firing within milliseconds on navigation.

### Pitfall 2: Skeleton guard condition mismatch
**What goes wrong:** Using `loading` alone (without `!data`) causes the skeleton to flash on every poll update, not just initial load.
**Why it happens:** `loading` is set to `true` on every fetch cycle in some hook implementations.
**How to avoid:** Guard: `if (loading && !data)` — the `/network` page uses this exact condition. Check the hook: `useRaspiData` sets `loading = true` only on mount (via `useState(true)`), and `finally { setLoading(false) }`. This is correct — `loading` stays false after first successful fetch. Either guard pattern works but `loading && !data` is the established idiom.
**Warning signs:** Page flickers to skeleton during background polls.

### Pitfall 3: cpu_temperature null handling in page components
**What goes wrong:** `data.cpuTemperature.toFixed(1)` throws when temperature sensor is unavailable (null on macOS, containers).
**Why it happens:** TypeScript type is `number | null` — null coercion to number causes runtime error.
**How to avoid:** Always check: `cpuTemperature !== null ? \`${cpuTemperature.toFixed(1)}°C\` : '—'` (same pattern used in existing RaspiStats component).
**Warning signs:** Page crashes in development on macOS (where cpu_thermal sensor returns null).

### Pitfall 4: RaspiCard click handler on error/loading states
**What goes wrong:** Wrapping the entire RaspiCard return (including error and loading states) in the clickable div causes error banners and skeletons to navigate to /raspi, which is confusing UX.
**Why it happens:** Applying the wrapper at the function return level instead of per-state.
**How to avoid:** Only wrap the main data-present `<SmartHomeCard>` render path. The `if (loading)` and `if (error && !data)` returns should remain unwrapped — same as NetworkCard which only wraps the final return.

### Pitfall 5: raspiClient import missing in health-monitoring route
**What goes wrong:** Forgetting to add the import for `raspiClient` causes a build error in the route file.
**Why it happens:** Editing a file without noting its current import list.
**How to avoid:** The existing route imports from `@/lib/healthMonitoring`, `@/lib/core`, etc. Add: `import { raspiClient } from '@/lib/raspi';` alongside existing imports. Verify `lib/raspi/index.ts` exports `raspiClient` (confirmed: `export const raspiClient = { getHealth, getCpu, ... }`).

## Code Examples

### Stat Section Component Structure
```typescript
// Source: pattern from app/network/components/WanStatusCard.tsx
'use client';
import { Card, Text, InfoBox, Badge } from '@/app/components/ui';
import type { RaspiFullData } from '@/app/components/devices/raspi/hooks/useRaspiFullData';

interface RaspiSystemInfoProps {
  data: RaspiFullData | null;
  isStale: boolean;
}

export default function RaspiSystemInfo({ data, isStale }: RaspiSystemInfoProps) {
  if (!data) return null;
  return (
    <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3">
        <InfoBox icon="⏱️" label="Uptime" value={formatUptime(data.uptimeSeconds)} variant="sage" />
        <InfoBox icon="⚡" label="Processi" value={String(data.processCount)} variant="neutral" />
        <InfoBox icon="📊" label="Load 1m" value={data.loadAvg1.toFixed(2)} variant="ocean" />
        <InfoBox icon="📊" label="Load 5m" value={data.loadAvg5.toFixed(2)} variant="ocean" />
      </div>
    </Card>
  );
}
```

### Health Check Route Addition
```typescript
// Source: pattern from existing app/api/health-monitoring/check/route.ts
// Add import at top:
import { raspiClient } from '@/lib/raspi';

// Add before final return success():
let raspiStatus: 'ok' | 'unreachable' = 'unreachable';
try {
  await raspiClient.getHealth();
  raspiStatus = 'ok';
} catch (err) {
  console.warn('⚠️ Raspberry Pi health check failed:', err);
}

// Add raspiStatus to the existing return success({...}) payload
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-device cron job | Single health-monitoring/check endpoint | v10.0 | All devices checked in one endpoint call |
| Class-based API clients | Function module clients | v10.0 / Phase 84-88 | raspiClient is a plain object of functions |
| Custom polling | useAdaptivePolling | v7.0 | All polling uses this hook for consistency |

**No deprecated patterns** relevant to this phase.

## Open Questions

1. **bytes_sent/bytes_recv are cumulative counters since boot — rate vs. total**
   - What we know: API docs explicitly state "cumulative counters since boot — compute deltas between polls for rate calculation"
   - What's unclear: Should /raspi show total bytes (simpler) or computed rate (more meaningful)?
   - Recommendation: Show total bytes formatted as GB/MB (simpler, no delta state needed, honest to API semantics). Rate calculation would require storing previous values and computing delta — adds complexity for a page that refreshes every 30s. Discretion: total bytes is clearer for a system stats page.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="raspi" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RASPI-06 | /raspi page renders stat sections from hook data | unit | `npm test -- --testPathPattern="raspi/page\|useRaspiFullData\|RaspiSystemInfo\|RaspiNetworkIO" --passWithNoTests` | ❌ Wave 0 |
| RASPI-06 | useRaspiFullData exposes all SystemResponse + memory/disk byte fields | unit | `npm test -- --testPathPattern="useRaspiFullData" --passWithNoTests` | ❌ Wave 0 |
| RASPI-06 | RaspiCard navigates to /raspi when clicked | unit | `npm test -- --testPathPattern="RaspiCard" --passWithNoTests` | ✅ (update existing) |
| RASPI-08 | health-monitoring/check includes raspiStatus in response | unit | `npm test -- --testPathPattern="health-monitoring/check" --passWithNoTests` | ❌ Wave 0 |
| RASPI-08 | health-monitoring/check continues if raspiClient.getHealth throws | unit | `npm test -- --testPathPattern="health-monitoring/check" --passWithNoTests` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="raspi" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/components/devices/raspi/hooks/__tests__/useRaspiFullData.test.ts` — covers RASPI-06 hook
- [ ] `app/raspi/__tests__/page.test.tsx` — covers RASPI-06 page render
- [ ] `app/raspi/components/__tests__/RaspiSystemInfo.test.tsx` — covers RASPI-06 system info section
- [ ] `app/api/health-monitoring/check/__tests__/route.test.ts` — covers RASPI-08 (may be new file or update existing)

Note: `app/components/devices/raspi/__tests__/RaspiCard.test.tsx` already exists — it will need updating to test the new navigation behavior (onClick → /raspi), not a Wave 0 gap.

## Sources

### Primary (HIGH confidence)
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/network/page.tsx` — orchestrator page pattern verified
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/devices/raspi/hooks/useRaspiData.ts` — hook pattern verified
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/api/health-monitoring/check/route.ts` — cron route structure verified
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/devices/network/NetworkCard.tsx` — card navigation pattern verified
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/network/components/WanStatusCard.tsx` — formatUptime(), InfoBox, Card patterns verified
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/lib/raspi/raspiClient.ts` — client module structure verified
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/types/raspi.ts` — all type interfaces verified
- `/Users/federicomanfredi/Sites/localhost/pannello-stufa/docs/api/raspberry-pi.md` — API endpoint contracts verified

### Secondary (MEDIUM confidence)
- None required — all findings verified against source code

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified by reading source files
- Architecture: HIGH — exact precedent in /network page + NetworkCard verified line-by-line
- Pitfalls: HIGH — derived from reading existing code patterns and TypeScript types
- Cron integration: HIGH — existing route read in full, integration point is explicit and isolated

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable codebase, patterns are internal conventions)
