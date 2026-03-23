# Phase 124: Room Status Views - Research

**Researched:** 2026-03-23
**Domain:** Next.js 15.5 read-only status page — React client component with fetch hooks, Card grid, Badge variants, provider-specific data rendering
**Confidence:** HIGH

## Summary

Phase 124 is a read-only status visualization page built entirely on top of infrastructure completed in earlier phases. The API layer (Phase 119), TypeScript types (Phase 119), Room CRUD (Phase 122), and device assignment (Phase 123) are all done. This phase adds one new file (`app/rooms/status/page.tsx`) and modifies one existing file (`app/rooms/page.tsx` to add a "Stato" navigation button).

The page fetches `GET /api/rooms/house/status` (returns HouseStatusResponse) and `GET /api/rooms/health` (returns RoomsHealthResponse) on mount. HouseStatusResponse contains everything needed: all rooms, all devices per room, per-device status, and house-level totals. No per-room status calls are needed. The page is entirely static on load; a manual "Aggiorna" button triggers refetch.

The core implementation challenge is rendering provider-specific `DeviceStatus.data` fields correctly for 6 provider types (Light, Sensor, Thermostat, Speaker, Stove, Camera). The discriminated union in `types/rooms.ts` is already typed; the rendering logic must narrow by `device_type` string to show the right metrics inline.

**Primary recommendation:** Follow the exact patterns from `app/rooms/page.tsx` (useRoomsHealth, inline hooks, SettingsLayout) and `app/rooms/[room_id]/page.tsx` (getProviderBadgeVariant, Badge variants, Card glass, device row rendering). No new libraries needed.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** New page at `app/rooms/status/page.tsx` — `/rooms/status` route
- **D-02:** Back button navigates to `/rooms`
- **D-03:** SettingsLayout with back button, Heading "Stato stanze", Text description
- **D-04:** Single page: whole-house overview at top, per-room cards below
- **D-05:** Add "Stato" navigation button on `app/rooms/page.tsx` toolbar (next to "Crea stanza") linking to `/rooms/status`
- **D-06:** Top section shows HouseStatusResponse summary stats: total_devices, total_available, total_unavailable
- **D-07:** Health stats from GET /rooms/health alongside: room_count, total_device_count, orphan_device_count (RSTAT-03)
- **D-08:** Stats displayed in single row of labeled values inside Card header area
- **D-09:** Each room as Card variant="glass", one per room from HouseStatusResponse.rooms[]
- **D-10:** Card header: room_name (Heading), device_count, available/unavailable summary as Badges (green available, red/ember unavailable)
- **D-11:** Sort rooms by room_name Italian locale
- **D-12:** Device list rows (not DataTable), showing custom_name, provider Badge, device_type, status indicator
- **D-13:** Status: green Badge "Disponibile" for status="available", red/ember Badge "Non disponibile" for status="unavailable"
- **D-14:** Provider Badge variant mapping: hue->ocean, netatmo/thermorossi->ember, others->neutral
- **D-15:** Device type as mono text
- **D-16:** DeviceStatus.data inline metrics per provider type:
  - Light: on/off + brightness if available
  - Sensor: temperature + humidity if available
  - Thermostat: measured_temp + setpoint_temp + heating state
  - Speaker: playing state + volume
  - Stove: active state + temperature + power level
  - Camera: reachable state
- **D-17:** When data is null: show only "Non disponibile"
- **D-18:** `useHouseStatus` inline hook — fetches GET `/api/rooms/house/status`, returns `{ houseStatus, loading, error, refetch }`
- **D-19:** Reuse `useRoomsHealth` pattern from Phase 122 — non-critical (errors silently ignored)
- **D-20:** No polling — manual "Aggiorna" button in toolbar
- **D-21:** Single API call (house/status) — no per-room calls
- **D-22:** Loading state: Skeleton placeholder
- **D-23:** Error state: Banner variant="error"
- **D-24:** Empty state (no rooms): centered "Nessuna stanza configurata" with link to /rooms
- **D-25:** Empty room (0 devices): card shows "Nessun dispositivo assegnato"

### Claude's Discretion
- Exact card spacing and responsive grid (1 col mobile, 2 col desktop)
- Device row layout within cards (flex vs grid)
- Status dot implementation (CSS dot vs Badge vs icon)
- Whether to show last_seen/timestamp data
- Exact data formatting for metrics (temperature units, percentage display)

### Deferred Ideas (OUT OF SCOPE)
- Real-time WebSocket updates
- Room floor plan / visual layout
- Device control actions from status view
- Historical status / uptime tracking
- Status notifications / alerts when devices go offline
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RSTAT-01 | User can view aggregated device status for a single room | Per-room cards from HouseStatusResponse.rooms[] show device list with status per D-09 to D-17 |
| RSTAT-02 | User can view whole-house status (all rooms with device status) | HouseStatusResponse fetched by useHouseStatus hook provides complete house view per D-06, D-21 |
| RSTAT-03 | User can view rooms health stats (room count, device count, orphan count) | useRoomsHealth fetches GET /api/rooms/health, stats shown inline per D-07, D-08 |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (Next.js 15.5) | 15.5 | Client component with hooks | Project standard |
| TypeScript | strict + noUncheckedIndexedAccess | Type safety | Project mandate — zero `as any` |
| `types/rooms.ts` | existing | HouseStatusResponse, DeviceStatus, all 6 provider status interfaces | Already defined in Phase 119 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `app/components/SettingsLayout` | existing | Page chrome: back button + title | All settings-style pages in this milestone |
| `app/components/ui/Card` | existing | Room card containers | variant="glass" per D-09 |
| `app/components/ui/Badge` | existing | Provider + status + count badges | Provider: ocean/ember/neutral; Status: green/ember |
| `app/components/ui/Banner` | existing | Persistent error display | Error state per D-23 |
| `app/components/ui/Skeleton` | existing | Loading placeholder | Loading state per D-22 |
| `app/components/ui/Button` | existing | "Aggiorna" refresh + "Stato" nav | Manual refresh per D-20 |
| `app/components/ui` (Heading, Text) | existing | Typography | Page/card headings |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline custom device rows | DataTable | DataTable adds sorting/actions overhead not needed for read-only status rows; plain flex rows are sufficient per D-12 |
| Inline `useHouseStatus` hook | Separate file | Project pattern is inline hooks on pages (see rooms/page.tsx, rooms/[room_id]/page.tsx); no reason to deviate |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
app/rooms/
├── page.tsx                    # MODIFY: add "Stato" button in toolbar
├── status/
│   └── page.tsx                # NEW: whole-house status page
└── [room_id]/
    └── page.tsx                # UNCHANGED
```

### Pattern 1: Inline Hook — useHouseStatus

Matches existing `useRooms` and `useRoom` patterns exactly.

```typescript
// Source: app/rooms/page.tsx (useRooms pattern)
function useHouseStatus() {
  const [houseStatus, setHouseStatus] = useState<HouseStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rooms/house/status');
      if (!res.ok) {
        throw new Error('Errore nel caricamento dello stato');
      }
      setHouseStatus((await res.json()) as HouseStatusResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { houseStatus, loading, error, refetch };
}
```

### Pattern 2: useRoomsHealth — Non-Critical (copy from rooms/page.tsx)

```typescript
// Source: app/rooms/page.tsx (useRoomsHealth pattern)
function useRoomsHealth() {
  const [health, setHealth] = useState<RoomsHealthResponse | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms/health');
      if (!res.ok) return;
      setHealth((await res.json()) as RoomsHealthResponse);
    } catch {
      // silently ignore — health is non-critical
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { health, refetch };
}
```

### Pattern 3: Provider Badge Variant — copy from rooms/[room_id]/page.tsx

```typescript
// Source: app/rooms/[room_id]/page.tsx
function getProviderBadgeVariant(provider: string): 'ocean' | 'ember' | 'neutral' {
  if (provider === 'hue') return 'ocean';
  if (provider === 'netatmo' || provider === 'thermorossi') return 'ember';
  return 'neutral';
}
```

### Pattern 4: Provider-Specific Data Rendering

The `DeviceStatus.data` union must be narrowed by `device_type` string. Since TypeScript's discriminated union uses the `status` field (not `device_type`), and `data` can be null for unavailable devices, the rendering uses `device_type` as a string switch with `as` assertions or type guards.

```typescript
// Source: types/rooms.ts interfaces + CONTEXT.md D-16
function renderDeviceData(device: DeviceStatus): string | null {
  if (!device.data) return null;  // D-17: null means unavailable

  switch (device.device_type) {
    case 'light': {
      const d = device.data as LightStatus;
      const parts = [d.on ? 'Accesa' : 'Spenta'];
      if (d.brightness !== null) parts.push(`${d.brightness}% luminosità`);
      return parts.join(' · ');
    }
    case 'sensor': {
      const d = device.data as SensorStatus;
      const parts: string[] = [];
      if (d.temperature !== null) parts.push(`${d.temperature}°C`);
      if (d.humidity !== null) parts.push(`${d.humidity}% umidità`);
      return parts.join(' · ') || null;
    }
    case 'thermostat': {
      const d = device.data as ThermostatStatus;
      const parts: string[] = [];
      if (d.measured_temp !== null) parts.push(`${d.measured_temp}°C misurata`);
      if (d.setpoint_temp !== null) parts.push(`${d.setpoint_temp}°C setpoint`);
      if (d.heating !== null) parts.push(d.heating ? 'In riscaldamento' : 'Non riscaldante');
      return parts.join(' · ') || null;
    }
    case 'speaker': {
      const d = device.data as SpeakerStatus;
      const parts = [d.playing ? 'In riproduzione' : 'Fermo'];
      if (d.volume !== null) parts.push(`Vol ${d.volume}%`);
      return parts.join(' · ');
    }
    case 'stove': {
      const d = device.data as StoveStatus;
      const parts = [d.active ? 'Attiva' : 'Spenta'];
      if (d.temperature !== null) parts.push(`${d.temperature}°C`);
      if (d.power_level !== null) parts.push(`P${d.power_level}`);
      return parts.join(' · ');
    }
    case 'camera': {
      const d = device.data as CameraStatus;
      return d.is_reachable ? 'Raggiungibile' : 'Non raggiungibile';
    }
    default:
      return null;
  }
}
```

### Pattern 5: Page Layout Structure

```tsx
// Source: app/rooms/page.tsx + app/rooms/[room_id]/page.tsx patterns
export default function RoomStatusPage() {
  const { houseStatus, loading, error, refetch } = useHouseStatus();
  const { health, refetch: healthRefetch } = useRoomsHealth();

  const sortedRooms = houseStatus
    ? [...houseStatus.rooms].sort((a, b) => a.room_name.localeCompare(b.room_name, 'it'))
    : [];

  const handleRefresh = () => {
    void refetch();
    void healthRefetch();
  };

  return (
    <SettingsLayout title="Stato stanze" backHref="/rooms">
      <Text variant="secondary">Stato aggregato di tutti i dispositivi per stanza</Text>

      {/* House + Health stats card */}
      <Card variant="glass" className="p-4 sm:p-6">
        {/* Stats row: house totals + health stats */}
        {/* Toolbar: Aggiorna button */}
        {/* Loading / Error / Empty / Room cards */}
      </Card>
    </SettingsLayout>
  );
}
```

### Pattern 6: Responsive Card Grid (Claude's Discretion)

```tsx
// 1 col mobile, 2 col desktop
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {sortedRooms.map((room) => (
    <Card key={room.room_id} variant="glass" className="p-4">
      {/* room card */}
    </Card>
  ))}
</div>
```

### Anti-Patterns to Avoid

- **Using DataTable for device rows:** Device rows in this page are read-only with no sorting or actions. Use plain `<div>` rows with flex layout. DataTable is overkill and adds unnecessary complexity.
- **Per-room API calls:** HouseStatusResponse already contains all rooms and devices. Never call GET `/api/rooms/{id}/status` per room — it would trigger N+1 network requests.
- **Polling on status page:** D-20 explicitly prohibits polling. Only fetch on mount + manual "Aggiorna" button.
- **Non-null assertion on `data` when `status="unavailable"`:** DeviceStatus.data is null when device is unavailable. Always check `if (!device.data)` before rendering provider-specific fields.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page chrome with back button | Custom header | `SettingsLayout` | Exact same pattern as Phase 120–123 |
| Loading skeleton | Custom shimmer | `Skeleton` component | Design system component |
| Error display | Custom error div | `Banner variant="error"` | Design system component |
| Provider color mapping | Ad-hoc ternary | `getProviderBadgeVariant` helper | Already established in Phase 123 |
| Fetch-on-mount pattern | Custom fetch logic | `useState + useCallback + useEffect` pattern | Copy from useRooms/useRoom exactly |

**Key insight:** This page reuses 100% of existing infrastructure. The only novel work is the provider-specific data rendering switch and the responsive card grid layout.

---

## Common Pitfalls

### Pitfall 1: `data` Field is Null When Status is "unavailable"
**What goes wrong:** Accessing `device.data.on` throws when `device.status === 'unavailable'` and `data` is null.
**Why it happens:** The discriminated union `LightStatus | SensorStatus | ... | null` — null is the unavailable case. TypeScript won't catch device_type-based narrowing without explicit null check.
**How to avoid:** Always guard with `if (!device.data) return 'Non disponibile'` before the switch on device_type. Per D-17.
**Warning signs:** TypeScript strict mode will complain about `device.data.X` if you forget the null check.

### Pitfall 2: HouseStatusResponse 503 When Status Aggregator Not Initialized
**What goes wrong:** GET `/api/rooms/house/status` returns 503 "Room DB or status aggregator not initialized" — not a network error, so `res.ok` is false.
**Why it happens:** The backend status aggregator is a separate service that may not be initialized (e.g., in dev without the full backend running).
**How to avoid:** The hook already handles `if (!res.ok) throw new Error(...)` which surfaces as a Banner error state. No special casing needed — standard error handling is correct.
**Warning signs:** Banner shows unexpectedly in development; confirm backend is running with status aggregator.

### Pitfall 3: Sorting on RoomStatusResponse Uses `room_name` Not `name`
**What goes wrong:** Developer writes `a.name` instead of `a.room_name` — TypeScript catches this (RoomStatusResponse has `room_name`, not `name`).
**Why it happens:** Room objects from GET /rooms/ use `name`, but RoomStatusResponse uses `room_name`. Different field names for the same data.
**How to avoid:** Sort: `[...houseStatus.rooms].sort((a, b) => a.room_name.localeCompare(b.room_name, 'it'))`.

### Pitfall 4: `device_count` vs Actual Devices Array Length
**What goes wrong:** Rendering `room.device_count` in the card header but checking `room.devices.length` for empty state — these could theoretically differ.
**Why it happens:** device_count is a summary field that should match devices.length, but rely on `room.devices.length === 0` for empty state rendering to be defensive.
**How to avoid:** Use `room.devices.length` for the empty state check; use `room.device_count` for the display count badge.

### Pitfall 5: "Stato" Button on rooms/page.tsx Must Not Break Existing Tests
**What goes wrong:** Adding the "Stato" button to `app/rooms/page.tsx` toolbar changes button counts — tests using `getAllByRole('button', { name: /crea stanza/i })` or button index queries may need updating.
**Why it happens:** `app/rooms/__tests__/page.test.tsx` mocks Button and may count buttons by role/index.
**How to avoid:** After modifying `app/rooms/page.tsx`, verify the existing test file still passes. The "Stato" button navigates to `/rooms/status` via `router.push` — mock already covers `mockPush`. No test changes expected, but verify.

---

## Code Examples

### House Status Response Shape (verified from docs/api/rooms.md)
```typescript
// Source: docs/api/rooms.md §TypeScript Interfaces + types/rooms.ts
interface HouseStatusResponse {
  rooms: RoomStatusResponse[];   // all rooms with devices
  total_devices: number;
  total_available: number;
  total_unavailable: number;
}

interface RoomStatusResponse {
  room_id: number;
  room_name: string;             // NOTE: room_name not name
  devices: DeviceStatus[];
  device_count: number;
  available_count: number;
  unavailable_count: number;
}

interface DeviceStatus {
  device_registry_id: number;
  custom_name: string;
  provider_name: string;
  device_type: string;           // "light" | "sensor" | "thermostat" | "speaker" | "stove" | "camera"
  status: 'available' | 'unavailable';
  data: LightStatus | SensorStatus | ThermostatStatus | SpeakerStatus | StoveStatus | CameraStatus | null;
}
```

### Existing API Route (verified — already exists)
```typescript
// Source: app/api/rooms/house/status/route.ts
import { withErrorHandler, success } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';
export const dynamic = 'force-dynamic';
export const GET = withErrorHandler(async () => {
  const data = await roomsProxy.getHouseStatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/House/Status');
```

### Stats Row Pattern (from rooms/page.tsx)
```tsx
// Source: app/rooms/page.tsx (health stats inline)
{(houseStatus !== null || health !== null) && (
  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-400 mb-4">
    {houseStatus !== null && (
      <>
        <span>Totale: <strong className="text-slate-200">{houseStatus.total_devices}</strong></span>
        <span>Disponibili: <strong className="text-slate-200">{houseStatus.total_available}</strong></span>
        <span>Non disponibili: <strong className="text-slate-200">{houseStatus.total_unavailable}</strong></span>
      </>
    )}
    {health !== null && (
      <>
        <span>Stanze: <strong className="text-slate-200">{health.room_count}</strong></span>
        <span>Assegnati: <strong className="text-slate-200">{health.total_device_count}</strong></span>
        <span>Orfani: <strong className="text-slate-200">{health.orphan_device_count}</strong></span>
      </>
    )}
  </div>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-room status API calls | Single house/status call | Phase 119 API design | Eliminates N+1 fetching |
| DataTable for all device lists | Plain flex rows for read-only lists | Phase 123 established pattern | Simpler, no over-engineering |
| Separate status page per room | Single page with drill-down sections | D-04 decision | Single route, single fetch |

---

## Open Questions

1. **Badge variant for "available" status**
   - What we know: D-13 says green for "Disponibile", red/ember for "Non disponibile". The Badge component has variants including "ocean" (blue-green), "ember" (orange-red), "neutral".
   - What's unclear: Whether Badge has a "success" or "green" variant, or if CSS classes must be used for the green status dot.
   - Recommendation: Check Badge component's available variants at `app/components/ui/Badge.tsx`. If no "success" variant exists, use a CSS dot (`<span className="w-2 h-2 rounded-full bg-green-400 inline-block">`) or inline className override. The discretion note in CONTEXT.md explicitly allows CSS dot vs Badge vs icon.

2. **Brightness display as percentage vs raw value**
   - What we know: LightStatus.brightness is `number | null`. The API docs show `"brightness": 200` (raw 0-254 scale for Hue).
   - What's unclear: Whether to display raw value or convert to percentage.
   - Recommendation: Display raw value with label "luminosità" since conversion to percentage may produce confusing fractions. If displaying %, use `Math.round((d.brightness / 254) * 100)`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | jest.config.ts |
| Quick run command | `npx jest app/rooms/status/__tests__/page.test.tsx --no-coverage` |
| Full suite command | `npx jest app/rooms/ --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RSTAT-01 | Room cards render device list with status indicators | unit | `npx jest app/rooms/status/__tests__/page.test.tsx -t "RSTAT-01" --no-coverage` | ❌ Wave 0 |
| RSTAT-02 | Whole-house overview shows all rooms | unit | `npx jest app/rooms/status/__tests__/page.test.tsx -t "RSTAT-02" --no-coverage` | ❌ Wave 0 |
| RSTAT-03 | Health stats (room_count, device_count, orphan_count) visible | unit | `npx jest app/rooms/status/__tests__/page.test.tsx -t "RSTAT-03" --no-coverage` | ❌ Wave 0 |
| D-20 | No polling — Aggiorna button triggers refetch | unit | `npx jest app/rooms/status/__tests__/page.test.tsx -t "D-20" --no-coverage` | ❌ Wave 0 |
| D-05 | "Stato" button added to rooms list page toolbar | unit | `npx jest app/rooms/__tests__/page.test.tsx --no-coverage` | ✅ (modify existing) |

### Sampling Rate
- **Per task commit:** `npx jest app/rooms/status/__tests__/page.test.tsx --no-coverage`
- **Per wave merge:** `npx jest app/rooms/ --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/rooms/status/__tests__/page.test.tsx` — new test file covering RSTAT-01, RSTAT-02, RSTAT-03, D-20
- [ ] `app/rooms/status/` — new directory (no config file needed, Jest picks it up automatically)

Note: `app/rooms/__tests__/page.test.tsx` already exists. Adding "Stato" button to `app/rooms/page.tsx` may require adding one test case to the existing test file (Test 19: "Stato" button navigates to /rooms/status). The existing 18 tests should continue to pass without modification.

---

## Sources

### Primary (HIGH confidence)
- `types/rooms.ts` — all interface definitions verified directly
- `docs/api/rooms.md` — API contract, response shapes, TypeScript interfaces
- `app/rooms/page.tsx` — useRooms, useRoomsHealth patterns, SettingsLayout usage, Badge/Card/Skeleton/Banner/Button patterns
- `app/rooms/[room_id]/page.tsx` — getProviderBadgeVariant, device row rendering
- `app/api/rooms/house/status/route.ts` — existing proxy route confirmed
- `app/api/rooms/health/route.ts` — existing proxy route confirmed
- `app/rooms/__tests__/page.test.tsx` — test patterns, mock shapes

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions D-01 through D-25 — user-locked decisions verified against codebase patterns

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already used in Phase 120–123
- Architecture: HIGH — patterns directly copied from existing pages
- Pitfalls: HIGH — verified against actual types and API contracts
- Provider data rendering: HIGH — types verified from types/rooms.ts

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain — all dependencies already built)
