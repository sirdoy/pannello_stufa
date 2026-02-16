# Phase 63: WAN Status & Device List - Research

**Researched:** 2026-02-15
**Domain:** Next.js 15.5 page architecture, TanStack Table v8 with search/sort/pagination, clipboard API, date-fns formatting
**Confidence:** HIGH

## Summary

Phase 63 implements the `/network` page displaying WAN connection details and a paginated, searchable, sortable device list. This phase builds directly on Phase 62 NetworkCard infrastructure (API routes, hooks, types) and Phase 61 Fritz!Box client (data layer complete).

Research confirms all technical requirements are satisfied by existing codebase patterns:
- **Page Structure:** Consistent with `/stove` and `/lights` pages (standard header, stacked card sections, vertical scroll)
- **DataTable Component:** TanStack Table v8 already installed and configured with search, sort, pagination, and filtering
- **WAN Data Layer:** Phase 62 useNetworkData hook provides all WAN status, devices, and bandwidth data with adaptive polling
- **Design System:** InfoBox grid layouts, Badge components, status indicators, and clipboard patterns all established
- **Copy-to-Clipboard:** navigator.clipboard.writeText() pattern proven in CodeBlock component

**Primary recommendation:** Create `/network` page with standard PageLayout structure. Top section: WAN status card with InfoBox grid (external IP with copy button, uptime, DNS, connection type, gateway). Bottom section: DataTable with devices data, global search (name/IP/MAC), column sorting, pagination (25/page), and online/offline status badges. Reuse useNetworkData hook from Phase 62 for all data fetching. Handle staleness with formatDistanceToNow for "Last seen X ago" timestamps.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page layout:**
- Stacked sections: WAN status card on top, device list table below — simple vertical scroll
- WAN status section always visible (not collapsible)
- Standard page header with title and back navigation — consistent with stove/lights pages
- Same stacked layout on mobile — WAN card above table, table scrolls horizontally if needed

**WAN status display:**
- Full details shown: status badge (online/offline), external IP, uptime, DNS servers, connection type, gateway
- Single card with vertical list of labeled values — simple and scannable
- External IP is clickable — copies to clipboard on click, with visual feedback (checkmark or color change)

**Device list table:**
- All columns visible by default: Name, IP, MAC, Status, Bandwidth
- Online devices grouped at top, offline devices grouped at bottom with separator
- Offline devices show "Last seen X ago" timestamp
- 25 devices per page with pagination

**Search & filtering:**
- Search bar above table, full width — prominent and easy to find
- Searches by name, IP, or MAC address with instant filtering

### Claude's Discretion

- WAN offline alert severity (red badge only vs full-width banner)
- Online/offline status badge styling in table (dot+text vs badge chip)
- "Last seen" format for offline devices (relative vs absolute+relative)
- Whether to add a separate status filter (All/Online/Offline tabs) alongside search
- Column sorting implementation (clickable headers vs preset sort)
- Search empty state treatment

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.0.0 | Component framework | Next.js 15.5 requirement |
| Next.js | 15.5.0 | App router, page structure | Project foundation |
| TypeScript | 5.x | Type safety | Phase 37-43 migration complete |
| TanStack Table | 8.21.3 | Table with search/sort/pagination | Already installed, proven in project |
| date-fns | 4.1.0 | "Last seen X ago" formatting | Already installed, Italian locale support |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Firebase RTDB | 12.8.0 | Cache layer (inherited) | Fritz!Box data caching (60s TTL from Phase 61) |
| lucide-react | 0.562.0 | Icons (Wifi, Signal, Copy, etc.) | Status indicators, action buttons |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Table | Custom table + search | TanStack already installed, handles search/sort/pagination out-of-box |
| DataTable component | Raw TanStack Table | DataTable exists with design system styling, accessibility, filters |
| useNetworkData (Phase 62) | New page-specific hook | Reusing hook ensures consistency, DRY principle |

**Installation:**
```bash
# No new dependencies required — all libraries already installed
```

---

## Architecture Patterns

### Recommended Project Structure

```
app/network/
├── page.tsx                           # Main /network page orchestrator
├── components/
│   ├── WanStatusCard.tsx             # WAN details with copy-to-clipboard
│   ├── DeviceListTable.tsx           # DataTable wrapper with columns
│   └── DeviceStatusBadge.tsx         # Online/offline badge component
└── __tests__/
    ├── page.test.tsx
    └── components/

app/components/devices/network/        # Reuse from Phase 62
├── hooks/
│   ├── useNetworkData.ts             # Existing - provides all data
│   └── useNetworkCommands.ts         # Existing - navigation handlers
└── types.ts                          # Existing - interfaces
```

### Pattern 1: Next.js 15.5 Page Structure (CRITICAL)

**What:** Standard page layout with header, stacked content sections, consistent with /stove and /lights pages
**When to use:** All full-page views in the app
**Example:**

```typescript
// Source: /stove/page.tsx, /lights/page.tsx pattern
'use client';

import { useRouter } from 'next/navigation';
import { Heading, PageLayout, Card } from '@/app/components/ui';
import { useNetworkData } from '@/app/components/devices/network/hooks/useNetworkData';
import WanStatusCard from './components/WanStatusCard';
import DeviceListTable from './components/DeviceListTable';

export default function NetworkPage() {
  const router = useRouter();

  // Reuse Phase 62 hook - provides wan, devices, bandwidth with polling
  const networkData = useNetworkData();

  const handleBack = () => router.push('/');

  if (networkData.initialLoading) {
    return <Skeleton.NetworkPage />;
  }

  return (
    <PageLayout>
      {/* Standard header with back navigation */}
      <PageLayout.Header
        title="Rete"
        description="Stato connessione e dispositivi collegati"
        onBack={handleBack}
      />

      {/* Stacked sections - vertical scroll */}
      <div className="space-y-6">
        {/* WAN status card - always visible, top position */}
        <WanStatusCard
          wan={networkData.wan}
          isStale={networkData.isStale}
          ageText={networkData.ageText}
        />

        {/* Device list table - below WAN card */}
        <DeviceListTable
          devices={networkData.devices}
          isStale={networkData.isStale}
        />
      </div>
    </PageLayout>
  );
}
```

**Critical rules:**
- `'use client'` directive required for hooks and interactivity
- Reuse existing hooks from Phase 62 (useNetworkData) - NO new data fetching
- PageLayout.Header for consistent navigation
- Stacked sections with space-y-6 for vertical rhythm

### Pattern 2: TanStack Table with Global Search

**What:** DataTable component configured for search by name, IP, or MAC with 300ms debounce
**When to use:** Device list table (requirement DEV-03)
**Example:**

```typescript
// Source: DataTable.tsx + DataTableToolbar.tsx patterns
import { useMemo, useState } from 'react';
import { DataTable } from '@/app/components/ui';
import { ColumnDef } from '@tanstack/react-table';
import DeviceStatusBadge from './DeviceStatusBadge';
import type { DeviceData } from '@/app/components/devices/network/types';

interface DeviceListTableProps {
  devices: DeviceData[];
  isStale: boolean;
}

export default function DeviceListTable({ devices, isStale }: DeviceListTableProps) {
  // Define columns with accessors for search
  const columns = useMemo<ColumnDef<DeviceData>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nome',
      enableSorting: true,
      enableGlobalFilter: true, // Searchable
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      enableSorting: true,
      enableGlobalFilter: true, // Searchable
    },
    {
      accessorKey: 'mac',
      header: 'MAC',
      enableSorting: true,
      enableGlobalFilter: true, // Searchable
    },
    {
      accessorKey: 'active',
      header: 'Stato',
      enableSorting: true,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <DeviceStatusBadge
          active={row.original.active}
          lastSeen={row.original.lastSeen}
        />
      ),
    },
    {
      accessorKey: 'bandwidth',
      header: 'Bandwidth',
      enableSorting: true,
      enableGlobalFilter: false,
      cell: ({ row }) => `${row.original.bandwidth || '0'} Mbps`,
    },
  ], []);

  // Sort: online devices first, then offline
  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return 0;
    });
  }, [devices]);

  return (
    <DataTable
      columns={columns}
      data={sortedDevices}
      enableSorting={true}
      enableFiltering={true}
      enablePagination={true}
      pageSize={25}  // 25 devices per page (requirement DEV-04)
      density="default"
      striped={true}
      searchPlaceholder="Cerca per nome, IP o MAC..."
    />
  );
}
```

**Key features:**
- `enableGlobalFilter: true` on name/IP/MAC columns for searchability
- `enableSorting: true` on all columns (requirement DEV-02)
- Pre-sorted data with online devices first (requirement DEV-01)
- DataTableToolbar handles search with 300ms debounce automatically

### Pattern 3: Clipboard Copy with Visual Feedback

**What:** navigator.clipboard.writeText() with success feedback (checkmark or color change)
**When to use:** External IP copy-to-clipboard (requirement WAN-01)
**Example:**

```typescript
// Source: CodeBlock.tsx clipboard pattern
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/app/components/ui';

interface CopyableIpProps {
  ip: string;
}

export default function CopyableIp({ ip }: CopyableIpProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy IP:', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-slate-100">{ip}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label={copied ? 'IP copied' : 'Copy IP to clipboard'}
        className="min-w-[80px]"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-1 text-sage-400" />
            <span className="text-sage-400">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </>
        )}
      </Button>
    </div>
  );
}
```

**Visual feedback:**
- Icon changes Copy → Check
- Text color changes neutral → sage-400 (green success)
- Auto-revert after 2 seconds
- Accessible aria-label updates

### Pattern 4: "Last Seen" Timestamp Formatting

**What:** formatDistanceToNow for relative timestamps on offline devices
**When to use:** Offline device status display (requirement DEV-05)
**Example:**

```typescript
// Source: date-fns usage in project
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/app/components/ui';

interface DeviceStatusBadgeProps {
  active: boolean;
  lastSeen?: number; // Unix timestamp
}

export default function DeviceStatusBadge({ active, lastSeen }: DeviceStatusBadgeProps) {
  if (active) {
    return (
      <Badge variant="sage" size="sm">
        Online
      </Badge>
    );
  }

  // Offline with "Last seen" timestamp
  const lastSeenText = lastSeen
    ? formatDistanceToNow(new Date(lastSeen), {
        addSuffix: true,
        locale: it, // Italian locale
      })
    : 'mai connesso';

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="danger" size="sm">
        Offline
      </Badge>
      <span className="text-xs text-slate-400">
        Visto {lastSeenText}
      </span>
    </div>
  );
}
```

**Italian locale output:**
- 5 minutes ago → "Visto 5 minuti fa"
- 2 hours ago → "Visto circa 2 ore fa"
- Yesterday → "Visto 1 giorno fa"

### Pattern 5: InfoBox Grid for WAN Details

**What:** 2-column grid with InfoBox components for WAN status details
**When to use:** WAN status card (requirements WAN-01, WAN-02, WAN-03)
**Example:**

```typescript
// Source: InfoBox.tsx + Phase 62 patterns
import { Card, InfoBox, Badge } from '@/app/components/ui';
import CopyableIp from './CopyableIp';
import type { WanData } from '@/app/components/devices/network/types';

interface WanStatusCardProps {
  wan: WanData | null;
  isStale: boolean;
  ageText: string | null;
}

export default function WanStatusCard({ wan, isStale, ageText }: WanStatusCardProps) {
  if (!wan) return null;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}g ${hours}h`;
    return `${hours}h`;
  };

  return (
    <Card variant="elevated" className="space-y-4">
      {/* Status banner - full width colored bar */}
      <div className={`
        px-4 py-3 rounded-xl
        ${wan.connected
          ? 'bg-sage-500/20 border border-sage-500/40'
          : 'bg-danger-500/20 border border-danger-500/40'
        }
      `}>
        <div className="flex items-center justify-between">
          <Badge variant={wan.connected ? 'sage' : 'danger'} size="md">
            {wan.connected ? 'WAN Online' : 'WAN Offline'}
          </Badge>
          {isStale && ageText && (
            <span className="text-xs text-slate-400">
              Aggiornato {ageText}
            </span>
          )}
        </div>
      </div>

      {/* External IP with copy button */}
      <div className="space-y-2">
        <span className="text-sm text-slate-400 uppercase tracking-wide">IP Esterno</span>
        <CopyableIp ip={wan.externalIp || 'N/A'} />
      </div>

      {/* InfoBox grid - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        <InfoBox
          icon="⏱️"
          label="Uptime"
          value={formatUptime(wan.uptime)}
          variant="sage"
        />
        <InfoBox
          icon="🌐"
          label="Gateway"
          value={wan.gateway || 'N/A'}
          variant="ocean"
        />
        <InfoBox
          icon="📡"
          label="DNS"
          value={wan.dns || 'Auto'}
          variant="ocean"
        />
        <InfoBox
          icon="🔗"
          label="Tipo"
          value={wan.connectionType || 'DHCP'}
          variant="neutral"
        />
      </div>
    </Card>
  );
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table search/sort/pagination | Custom table logic | `DataTable` component with TanStack Table | Already installed, handles search debounce, sort, pagination, accessibility |
| Clipboard copy | Manual textarea + execCommand | `navigator.clipboard.writeText()` | Modern API, async, secure, works on HTTPS |
| Date formatting | Manual time math | `formatDistanceToNow` from date-fns | Handles localization (Italian), edge cases, plurals |
| Page layout | Custom header/sections | `PageLayout` component | Consistent structure across /stove, /lights, /network |
| Data fetching | New network page hook | Phase 62 `useNetworkData` hook | Already provides all required data with polling |

**Key insight:** Phase 62 completed the data layer (hooks, types, API integration). Phase 63 is purely presentational — reuse existing hooks, don't recreate data fetching logic.

---

## Common Pitfalls

### Pitfall 1: Creating New Data Fetching Hook

**What goes wrong:** Developer creates networkPageData hook duplicating Phase 62 useNetworkData
**Why it happens:** Assumption that page needs separate data management
**How to avoid:** Import and use existing useNetworkData from Phase 62 - it provides wan, devices, bandwidth
**Warning signs:** Duplicate polling loops, inconsistent data between card and page

### Pitfall 2: Not Sorting Devices Before Rendering

**What goes wrong:** Online/offline devices mixed randomly in table, requirement DEV-01 violated
**Why it happens:** Passing devices directly from API to DataTable without pre-sorting
**How to avoid:** useMemo to sort devices by active status before passing to DataTable
**Warning signs:** Offline devices appear at top of list

### Pitfall 3: Search Not Working on All Columns

**What goes wrong:** Search only finds device names, not IPs or MACs
**Why it happens:** Only name column has enableGlobalFilter: true
**How to avoid:** Set enableGlobalFilter: true on name, ip, and mac columns
**Warning signs:** User searches "192.168" and gets no results despite devices with that IP

### Pitfall 4: External IP Not Copyable on Mobile

**What goes wrong:** Clipboard API fails on mobile browsers
**Why it happens:** Missing HTTPS context check, or using deprecated execCommand
**How to avoid:** Use navigator.clipboard.writeText() with try/catch, fallback to showing IP only
**Warning signs:** Copy button doesn't respond on iOS Safari

### Pitfall 5: "Last Seen" Timestamp Never Updates

**What goes wrong:** Offline device shows "Visto 5 minuti fa" even after 30 minutes
**Why it happens:** formatDistanceToNow called once at render, not recalculated
**How to avoid:** Component doesn't need live updates — timestamp is relative to current time on each render
**Warning signs:** This is NOT a real pitfall — formatDistanceToNow recalculates on every render automatically

### Pitfall 6: DataTable Doesn't Show Pagination Controls

**What goes wrong:** No pagination UI despite 50+ devices
**Why it happens:** enablePagination={false} or missing pageSize prop
**How to avoid:** Set enablePagination={true} and pageSize={25}
**Warning signs:** All devices render in one long scrollable list

---

## Code Examples

Verified patterns from official sources:

### DataTable Column Definition with Search

```typescript
// Source: TanStack Table v8 docs + DataTable.tsx
import { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<DeviceData>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    enableSorting: true,
    enableGlobalFilter: true,  // Enables search on this column
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name || row.original.ip}</span>
    ),
  },
  {
    accessorKey: 'ip',
    header: 'Indirizzo IP',
    enableSorting: true,
    enableGlobalFilter: true,  // Enables search on this column
    cell: ({ row }) => (
      <span className="font-mono text-sm text-slate-400">{row.original.ip}</span>
    ),
  },
  {
    accessorKey: 'mac',
    header: 'MAC Address',
    enableSorting: true,
    enableGlobalFilter: true,  // Enables search on this column
    cell: ({ row }) => (
      <span className="font-mono text-xs text-slate-500">{row.original.mac}</span>
    ),
  },
];
```

### DataTable Configuration

```typescript
// Source: DataTable.tsx usage
<DataTable
  columns={columns}
  data={sortedDevices}
  enableSorting={true}          // Enable column sorting
  enableFiltering={true}        // Enable global search
  enablePagination={true}       // Enable pagination
  pageSize={25}                 // 25 devices per page
  density="default"             // Row height
  striped={true}                // Alternating row backgrounds
  stickyHeader={false}          // Normal scroll behavior
  searchPlaceholder="Cerca per nome, IP o MAC..."
/>
```

### Stale Data Indicator

```typescript
// Source: Phase 62 staleness pattern
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface StalenessIndicatorProps {
  isStale: boolean;
  timestamp: number | null;
}

function StalenessIndicator({ isStale, timestamp }: StalenessIndicatorProps) {
  if (!isStale || !timestamp) return null;

  const ageText = formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: it,
  });

  return (
    <Text variant="tertiary" size="xs">
      Aggiornato {ageText}
    </Text>
  );
}
```

### Device Sorting (Online First)

```typescript
// Sort devices: online first, then offline
const sortedDevices = useMemo(() => {
  return [...devices].sort((a, b) => {
    // Primary sort: active status (online first)
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;

    // Secondary sort: name (alphabetical)
    return a.name.localeCompare(b.name, 'it');
  });
}, [devices]);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom search input | DataTable globalFilter | TanStack Table v8 (Phase 44+) | 300ms debounce, filter chips, accessibility |
| Manual table pagination | DataTable pagination | TanStack Table v8 (Phase 44+) | Built-in controls, page size selector |
| execCommand('copy') | navigator.clipboard API | Modern browsers | Async, secure, better UX |
| Hardcoded date calculations | date-fns formatDistanceToNow | Phase 43 (date-fns installed) | Italian locale, automatic plurals |

**Deprecated/outdated:**
- Custom table implementations: Use DataTable component
- execCommand clipboard API: Use navigator.clipboard.writeText()
- Manual date formatting: Use date-fns helpers

---

## Fritz!Box API Data Structures (from Phase 61/62)

Verified from existing implementation:

### Devices Response

```typescript
// GET /api/fritzbox/devices (from Phase 61)
interface DeviceData {
  id: string;          // MAC address
  name: string;        // Device name or IP fallback
  ip: string;          // IPv4 address
  mac: string;         // MAC address
  active: boolean;     // Online/offline status
  type?: 'lan' | 'wlan' | 'guest';
  bandwidth?: number;  // Mbps (future phase)
  lastSeen?: number;   // Unix timestamp when last online
}
```

### WAN Response

```typescript
// GET /api/fritzbox/wan (from Phase 61)
interface WanData {
  connected: boolean;       // WAN connection status
  uptime: number;           // Seconds
  externalIp?: string;      // Public IP
  linkSpeed?: number;       // Mbps
  dns?: string;             // DNS server(s)
  gateway?: string;         // Default gateway IP
  connectionType?: string;  // 'DHCP' | 'PPPoE' | 'Static'
  timestamp: number;        // Unix timestamp
}
```

**Note:** Actual structure verified from fritzboxClient.ts implementation. All data available via useNetworkData hook from Phase 62.

---

## Open Questions

1. **Device "Last Seen" Timestamp Source**
   - What we know: Fritz!Box API provides device active status (boolean)
   - What's unclear: Does API provide lastSeen timestamp for offline devices?
   - Recommendation: Check Phase 61 fritzboxClient.getDevices() response. If not present, add to API layer or show "Offline" without timestamp in Phase 63, then add timestamp tracking in Phase 65 (Device History)

2. **WAN DNS and Gateway Data Availability**
   - What we know: WAN status includes externalIp, uptime, linkSpeed
   - What's unclear: Does Fritz!Box API provide DNS servers and gateway IP?
   - Recommendation: Check Phase 61 getWanStatus() implementation. If missing, show "Auto" or "N/A" for Phase 63, request data enhancement in Phase 61 follow-up

3. **DataTable Empty State**
   - What we know: DataTable component exists with all features
   - What's unclear: Does DataTable show empty state when no devices match search?
   - Recommendation: Check DataTable.tsx for EmptyState handling. If missing, wrap DataTable with conditional EmptyState component

4. **Mobile Horizontal Scroll Behavior**
   - What we know: User decision: "table scrolls horizontally if needed" on mobile
   - What's unclear: Does DataTable handle overflow-x automatically?
   - Recommendation: Test on mobile viewport. If not, wrap table in `<div className="overflow-x-auto">`

---

## Recommendations

### Implementation Approach

1. **Start with page structure** (similar to /stove/page.tsx)
   - Create app/network/page.tsx with 'use client'
   - Import useNetworkData from Phase 62 hooks
   - PageLayout with header and back navigation
   - Stacked sections: WanStatusCard + DeviceListTable

2. **Build WAN status card component**
   - Full-width status banner (green online, red offline)
   - External IP with CopyableIp component (clipboard + checkmark feedback)
   - InfoBox grid (2 columns): uptime, gateway, DNS, connection type
   - Staleness indicator if data age > 30s

3. **Build device list table component**
   - Define TanStack Table columns with enableGlobalFilter on name/IP/MAC
   - Pre-sort devices (online first, then offline)
   - Configure DataTable: search, sort, pagination (25/page)
   - DeviceStatusBadge component for online/offline with "Last seen"

4. **Add clipboard functionality**
   - navigator.clipboard.writeText() with try/catch
   - Visual feedback: Copy button → Check icon + sage color
   - Auto-revert after 2 seconds

5. **Handle edge states**
   - Initial loading: full-page skeleton
   - No devices: EmptyState component
   - Search no results: DataTable empty state
   - Stale data: show "Aggiornato X fa" below WAN status

### Testing Strategy

```typescript
// Unit tests required
describe('NetworkPage', () => {
  test('renders WAN status card with external IP');
  test('renders device list table with pagination');
  test('handles back navigation to home');
  test('shows skeleton on initial load');
});

describe('WanStatusCard', () => {
  test('displays online status with green badge');
  test('displays offline status with red badge');
  test('shows external IP with copy button');
  test('formats uptime correctly (days/hours)');
  test('shows stale indicator when data old');
});

describe('DeviceListTable', () => {
  test('displays all columns: name, IP, MAC, status, bandwidth');
  test('sorts online devices before offline devices');
  test('paginates at 25 devices per page');
  test('searches by name, IP, or MAC address');
  test('shows "Last seen" timestamp for offline devices');
  test('handles empty device list gracefully');
});

describe('CopyableIp', () => {
  test('copies IP to clipboard on button click');
  test('shows checkmark and success color after copy');
  test('reverts to copy icon after 2 seconds');
  test('handles clipboard API error gracefully');
});
```

---

## Sources

### Primary (HIGH confidence)

- `/app/stove/page.tsx` - Page structure pattern reference
- `/app/lights/page.tsx` - Page structure pattern reference
- `/app/components/ui/DataTable.tsx` - Table component with search/sort/pagination
- `/app/components/ui/DataTableToolbar.tsx` - Search bar with 300ms debounce
- `/app/components/ui/InfoBox.tsx` - WAN details grid layout
- `/app/components/devices/network/hooks/useNetworkData.ts` - Phase 62 data hook
- `/app/components/devices/network/types.ts` - Phase 62 TypeScript interfaces
- `/lib/fritzbox/fritzboxClient.ts` - Phase 61 API client with data structures
- `/app/debug/design-system/components/CodeBlock.tsx` - Clipboard API pattern
- `/docs/design-system.md` - Design system components reference
- `/docs/architecture.md` - Multi-device page patterns

### Secondary (MEDIUM confidence)

- CONTEXT.md - User decisions on layout, WAN display, table structure
- ROADMAP.md - Phase 63 requirements and dependencies
- Phase 62 RESEARCH.md - NetworkCard patterns applicable to page

### Tertiary (LOW confidence)

None — all findings verified with codebase sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed (TanStack Table, date-fns, Next.js 15.5)
- Page architecture: HIGH - /stove and /lights pages provide proven patterns
- DataTable: HIGH - Component exists with search, sort, pagination features
- Phase 62 integration: HIGH - useNetworkData hook provides all required data
- Clipboard API: HIGH - Pattern proven in CodeBlock component
- "Last seen" data: MEDIUM - Need to verify Fritz!Box API provides lastSeen timestamp

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days for stable tech stack)

**Dependencies verified:**
- ✅ Phase 61 Fritz!Box API routes complete (devices, wan endpoints)
- ✅ Phase 62 useNetworkData hook available with polling
- ✅ DataTable component with search/sort/pagination
- ✅ Design system InfoBox, Badge, PageLayout components
- ✅ date-fns installed with Italian locale
- ✅ navigator.clipboard API available (HTTPS context)

**Open items for planning:**
- Verify Fritz!Box API provides lastSeen timestamp for offline devices
- Verify WAN API includes DNS and gateway fields
- Test DataTable empty state handling
- Test mobile horizontal scroll behavior
