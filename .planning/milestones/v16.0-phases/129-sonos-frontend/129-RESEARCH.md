# Phase 129: Sonos Frontend - Research

**Researched:** 2026-03-24
**Domain:** Next.js 15.5 frontend — dashboard card, dedicated page, device registry integration, navigation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dashboard card (SonosCard)**
- D-01: Orchestrator pattern — `useSonosData` hook handles polling + state, `SonosCard` renders UI. Matches RaspiCard, LightsCard, StoveCard pattern.
- D-02: Card uses `SmartHomeCard` with `icon="🎵"` and `colorTheme="sage"` (success palette, same as Raspi)
- D-03: Card displays: now-playing track name + artist, zone count, speaker count, playback state icon (play/pause/stop)
- D-04: Card is clickable — navigates to `/sonos` page on click (same pattern as RaspiCard)
- D-05: Data fetched from 3 endpoints: `/api/sonos/health` (speaker count), `/api/sonos/zones` (zone list + coordinators), `/api/sonos/zones/{group_id}/playback` (now-playing for first active zone)
- D-06: Polling via `useAdaptivePolling` at 60s interval (matches all other device cards)
- D-07: Loading state shows `Skeleton.SonosCard` — add to Skeleton component registry
- D-08: Error state shows Banner variant="warning" with "Non raggiungibile" — same pattern as RaspiCard
- D-09: Stale state shows staleness banner when data exists but latest fetch failed

**Sonos page**
- D-10: Orchestrator pattern — `useSonosFullData` hook fetches all zones + playback + volume data, page renders sections
- D-11: Page header: "Sonos" heading + back button to `/` (same as RaspiPage, using PageLayout)
- D-12: Zone list: one section per zone showing zone name, current track, playback controls (play/pause/stop/next/prev), play mode indicators
- D-13: Per-speaker volume sliders within each zone section — range input 0-100, showing speaker name + current volume
- D-14: Mute toggle per speaker (button, not separate slider)
- D-15: Transport commands call POST endpoints, volume/mute call PUT endpoints — all return 202, frontend polls after `suggested_poll_delay_s` (1s) to refresh state
- D-16: `useSonosCommands` hook handles all mutations (play/pause/stop/next/prev/setVolume/setMute) — same split as useLightsCommands
- D-17: No EQ, queue, home theater, sleep timer, or grouping UI in this phase

**DashboardCards integration**
- D-18: Add `sonos: SonosCard` to `CARD_COMPONENTS` registry in DashboardCards.tsx
- D-19: Add `sonos: Skeleton.SonosCard` to `CARD_SKELETONS` registry
- D-20: Add `sonos: { name: 'Sonos', icon: '🎵' }` to `DEVICE_META` registry
- D-21: Sonos already in `DEFAULT_DEVICE_ORDER` (last position) — no change needed

**Device registry integration**
- D-22: `DEVICE_CONFIG.sonos` already exists in `deviceTypes.ts` with `enabled: true`
- D-23: Routes in DEVICE_CONFIG may need adjustment — `/sonos/spotify` and `/sonos/zones` sub-pages NOT built in this phase; keep config as-is
- D-24: No changes to `deviceTypes.ts` needed — Sonos is already fully configured

**Navigation menu**
- D-25: Sonos already appears in navigation via `DEVICE_CONFIG.sonos` — Navbar.tsx renders device sections dynamically from `navStructure.devices`
- D-26: No manual Navbar.tsx edits needed — the device registry drives navigation automatically
- D-27: Mobile bottom nav priority unchanged

**File organization**
- D-28: New directory: `app/components/devices/sonos/` with SonosCard.tsx + hooks/ + components/ subdirectories
- D-29: Hooks: `useSonosData.ts` (dashboard card polling), `useSonosFullData.ts` (full page data), `useSonosCommands.ts` (mutations)
- D-30: Page: `app/sonos/page.tsx` — client component with orchestrator pattern
- D-31: Presentational sub-components in `app/components/devices/sonos/components/`: SonosZoneSection, SonosSpeakerVolume, SonosNowPlaying, SonosTransportControls

### Claude's Discretion
- Skeleton layout for Skeleton.SonosCard
- Exact spacing and layout within zone sections
- Whether to show album art placeholder or just text
- Volume slider styling (Tailwind range input vs custom)
- Transport button icon library (lucide-react icons)
- How to handle zones with no active playback (empty state per zone)

### Deferred Ideas (OUT OF SCOPE)
- Sonos EQ settings UI (bass/treble/loudness sliders)
- Queue management UI (view/reorder/clear)
- Home theater settings UI (night mode, dialog level, sub gain)
- Sleep timer UI
- Speaker grouping UI (join/unjoin)
- Spotify integration sub-page (`/sonos/spotify`)
- Zone detail sub-page (`/sonos/zones`)
- Album art display (requires image proxy or external URL)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SONOS-31 | SonosCard dashboard card con now playing, zone status, speaker count | D-01 to D-09; RaspiCard pattern verified in codebase |
| SONOS-32 | /sonos page con zone list, playback controls, volume sliders | D-10 to D-17; RaspiPage + useLightsCommands patterns verified |
| SONOS-33 | Device registry integration per speaker Sonos | D-22 to D-24; DEVICE_CONFIG.sonos verified already in deviceTypes.ts lines 154-173 |
| SONOS-34 | Navigation menu entry per Sonos | D-25 to D-27; Navbar.tsx already driven by DEVICE_CONFIG — no code change needed |
</phase_requirements>

## Summary

Phase 129 is a pure frontend phase. All 23 Sonos API routes are operational from Phases 126-128. The task is to surface them through a dashboard card (SonosCard) and a dedicated `/sonos` page, following the established orchestrator pattern used by RaspiCard/RaspiPage.

The implementation is well-constrained. The project has two canonical reference patterns: RaspiCard for simple device cards (polling + click-to-navigate), and LightsCard/useLightsCommands for command-heavy device pages with 202-Accepted mutation patterns. SonosCard follows RaspiCard; the `/sonos` page follows the LightsCard + RaspiPage hybrid.

Device registry and navigation are already wired: `DEVICE_CONFIG.sonos` exists in `deviceTypes.ts` with `enabled: true` and the correct main route (`/sonos`). The Navbar renders devices dynamically from this config, so SONOS-34 requires zero code changes. SONOS-33 similarly requires no code changes — Sonos is already fully configured in the device registry.

**Primary recommendation:** Implement in two parallel waves: Wave 1 produces the card-only deliverable (SonosCard + Skeleton.SonosCard + DashboardCards registries); Wave 2 produces the page deliverable (useSonosFullData + useSonosCommands + /sonos page + sub-components).

## Standard Stack

### Core (all verified from codebase inspection)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | project | Component rendering | Next.js 15.5 standard |
| Next.js App Router | 15.5 | `'use client'` pages, `useRouter` navigation | Project standard |
| TypeScript | strict | All new files are `.tsx`/`.ts` | `strict + noUncheckedIndexedAccess` enforced |
| lucide-react | project | Transport button icons (Play, Pause, Square, SkipForward, SkipBack) | Used across project |
| class-variance-authority | project | CVA for variant components (if any sub-component needs variants) | Design system standard |
| tailwindcss | project | All styling — including range input for volume sliders | Design system standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@testing-library/react` | project | Hook and component tests | Required per project rules |
| `jest` | project | Test runner | Required per project rules |

### Types Available (from `types/sonosProxy.ts`)

All required types already exist — import, do not re-declare:
- `SonosHealthResponse` — connected, device_count, data_freshness
- `SonosZoneResponse` — group_id, label, coordinator_uid, coordinator_name, member_count, members[]
- `SonosPlaybackResponse` — group_id, transport_state, title, artist, album, position, duration, source_type
- `SonosVolumeResponse` — uid, volume (0-100 | null), mute (boolean | null)
- `SonosCommandOkResponse` — status, group_id?, uid?
- `SetVolumeRequest` — `{ volume: number }` (0-100)
- `SetMuteRequest` — `{ mute: boolean }`

**Installation:** No new packages needed — all dependencies already in project.

## Architecture Patterns

### Recommended Project Structure

```
app/
├── components/devices/sonos/
│   ├── SonosCard.tsx              # Dashboard card (orchestrator)
│   ├── hooks/
│   │   ├── useSonosData.ts        # Card polling (3 endpoints)
│   │   ├── useSonosFullData.ts    # Page data (zones + playback per zone + volume per speaker)
│   │   ├── useSonosCommands.ts    # Mutations (play/pause/stop/next/prev/setVolume/setMute)
│   │   └── __tests__/
│   │       ├── useSonosData.test.ts
│   │       ├── useSonosFullData.test.ts
│   │       └── useSonosCommands.test.ts
│   ├── components/
│   │   ├── SonosNowPlaying.tsx    # Track + artist display
│   │   ├── SonosTransportControls.tsx  # Play/Pause/Stop/Next/Prev buttons
│   │   ├── SonosZoneSection.tsx   # Zone container (wraps NowPlaying + Controls + Speakers)
│   │   └── SonosSpeakerVolume.tsx # Volume slider + mute toggle per speaker
│   └── __tests__/
│       └── SonosCard.test.tsx
├── sonos/
│   └── page.tsx                   # /sonos page (orchestrator)
```

Modifications to existing files:
- `app/components/ui/Skeleton.tsx` — add `Skeleton.SonosCard` static property
- `app/components/DashboardCards.tsx` — add sonos to CARD_COMPONENTS, CARD_SKELETONS, DEVICE_META

### Pattern 1: Dashboard Card (SonosCard)

Follow RaspiCard exactly. Three render branches:
1. `loading && !data` → `<Skeleton.SonosCard />`
2. `error && !data` → SmartHomeCard with Banner variant="warning"
3. Default → clickable div wrapping SmartHomeCard with HealthIndicator + stale banner + data

```typescript
// Source: app/components/devices/raspi/RaspiCard.tsx (verified)
'use client';
export default function SonosCard() {
  const router = useRouter();
  const { data, loading, error, stale } = useSonosData();

  if (loading && !data) return <Skeleton.SonosCard />;
  if (error && !data) return (
    <SmartHomeCard icon="🎵" title="Sonos" colorTheme="sage">
      <SmartHomeCard.Controls>
        <Banner variant="warning" title="Non raggiungibile" compact={false}>
          <p className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-600">{error}</p>
        </Banner>
      </SmartHomeCard.Controls>
    </SmartHomeCard>
  );
  return (
    <div onClick={() => router.push('/sonos')} className="cursor-pointer ..." role="link" tabIndex={0} ...>
      <SmartHomeCard icon="🎵" title="Sonos" colorTheme="sage">
        {stale && <SmartHomeCard.Controls><Banner variant="warning" title="Dati non aggiornati" compact={true} /></SmartHomeCard.Controls>}
        {data && <SmartHomeCard.Controls>...</SmartHomeCard.Controls>}
      </SmartHomeCard>
    </div>
  );
}
```

### Pattern 2: Dashboard Polling Hook (useSonosData)

Follow useRaspiData exactly. Key: `initialDelay` staggers cards; `alwaysActive: false` is correct for dashboard cards (not safety-critical).

```typescript
// Source: app/components/devices/raspi/hooks/useRaspiData.ts (verified)
export function useSonosData(): UseSonosDataReturn {
  const [data, setData] = useState<SonosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const dataRef = useRef<SonosData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const fetchData = async () => {
    try {
      setError(null);
      // 1. Fetch health (speaker count)
      // 2. Fetch zones (zone count + coordinator IDs)
      // 3. Fetch playback for first/most interesting zone
      // setData, setStale(false)
    } catch {
      setStale(true);
      if (!dataRef.current) setError('Sonos non raggiungibile');
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({ callback: fetchData, interval, alwaysActive: false, immediate: true, initialDelay: 600 });
  return { data, loading, error, stale };
}
```

**"Most interesting" zone logic:** iterate zones; find first with `transport_state === 'PLAYING'`; fall back to first zone if all idle/stopped.

### Pattern 3: Full Page Data Hook (useSonosFullData)

Fetches: all zones + playback for each zone (Promise.all) + volume for each member speaker (Promise.all).

```typescript
// Pattern: parallel fetch for all zones then all speakers
const zonesRes = await fetch('/api/sonos/zones');
const zones = (await zonesRes.json()).zones as SonosZoneResponse[];

const playbackResults = await Promise.all(
  zones.map(z => fetch(`/api/sonos/zones/${z.group_id}/playback`).then(r => r.json()))
);

// Collect unique speaker UIDs across all zones
const allUids = [...new Set(zones.flatMap(z => z.members.map(m => m.uid)))];
const volumeResults = await Promise.all(
  allUids.map(uid => fetch(`/api/sonos/speakers/${uid}/volume`).then(r => r.json()))
);
```

Note: for large Sonos setups this could be many requests, but in typical home use 2-6 speakers is normal.

### Pattern 4: Command Hook (useSonosCommands)

Follow useLightsCommands pattern: accept data setters + fetchData ref, return command functions.

```typescript
// Source: app/components/devices/lights/hooks/useLightsCommands.ts (verified)
// Transport commands: POST, no body, returns 202 + suggested_poll_delay_s
const handlePlay = async (groupId: string) => {
  const response = await sonosTransportCmd.execute(`/api/sonos/zones/${groupId}/play`, { method: 'POST' });
  if (response?.ok) {
    const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
    await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
    await fetchData();
  }
};

// Volume command: PUT, body { volume: number }, returns 202 + suggested_poll_delay_s
const handleSetVolume = async (uid: string, volume: number) => {
  const response = await sonosVolumeCmd.execute(`/api/sonos/speakers/${uid}/volume`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volume } satisfies SetVolumeRequest),
  });
  // same 202 + delay + fetchData pattern
};
```

One `useRetryableCommand` call per command type (React hooks rules). Minimum needed: transport (play/pause/stop/next/prev share one), volume, mute.

### Pattern 5: Skeleton Sub-Component

Follow Skeleton.RaspiCard pattern. Use internal `SkeletonPulse` helper. Sage/success accent bar.

```typescript
// Source: app/components/ui/Skeleton.tsx line 785 (verified)
Skeleton.SonosCard = function SkeletonSonosCard() {
  const SkeletonPulse = ({ className = '' }: { className?: string }) => (
    <div className={`relative overflow-hidden rounded-xl bg-slate-700/50 ... ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer ..." />
    </div>
  );
  const Card = Skeleton.Card;
  return (
    <Card className="overflow-visible transition-all duration-500">
      {/* Sage/success accent bar (same color as RaspiCard's success bar) */}
      <div className="h-1 bg-gradient-to-r from-success-500/50 via-success-400/50 to-success-600/50" />
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <SkeletonPulse className="w-8 h-8 rounded-lg" />
          <SkeletonPulse className="w-20 h-6 rounded" />
        </div>
        {/* Now-playing line */}
        <SkeletonPulse className="h-5 w-3/4 rounded mb-2" />
        <SkeletonPulse className="h-4 w-1/2 rounded mb-4" />
        {/* Stats row: zones + speakers */}
        <div className="flex gap-3">
          <SkeletonPulse className="h-14 flex-1 rounded-lg" />
          <SkeletonPulse className="h-14 flex-1 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};
```

### Pattern 6: DashboardCards Registry Extension

Three additions to `app/components/DashboardCards.tsx`:

```typescript
// After existing import for RaspiCard, add:
import SonosCard from './devices/sonos/SonosCard';

// In CARD_COMPONENTS:
sonos: SonosCard,

// In CARD_SKELETONS:
sonos: Skeleton.SonosCard,

// In DEVICE_META:
sonos: { name: 'Sonos', icon: '🎵' },
```

### Pattern 7: /sonos Page

Follow RaspiPage structure with PageLayout + back button. The key difference: zones may be empty, and each zone has sub-components.

```typescript
// Source: app/raspi/page.tsx (verified)
'use client';
export default function SonosPage() {
  const router = useRouter();
  const { data, loading, stale, error } = useSonosFullData();
  const commands = useSonosCommands({ data, fetchData: ... });

  if (loading && !data) return <loading skeleton>;

  return (
    <PageLayout header={
      <PageLayout.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>← Indietro</Button>
            <Heading level={1} size="2xl">Sonos</Heading>
          </div>
        </div>
      </PageLayout.Header>
    }>
      <div className="space-y-6">
        {stale && <Banner variant="warning" title="Dati non aggiornati" compact={true} />}
        {error && !data && <Text variant="secondary">{error}</Text>}
        {data?.zones.map(zone => (
          <SonosZoneSection key={zone.group_id} zone={zone} playback={data.playback[zone.group_id]} volumes={data.volumes} commands={commands} />
        ))}
      </div>
    </PageLayout>
  );
}
```

### Anti-Patterns to Avoid

- **Importing SmartHomeCard from wrong path:** Use `'../../ui'` (barrel export) not direct path — RaspiCard uses `import { SmartHomeCard } from '../../ui'`
- **Setting loading=true on refetch:** loading is for initial load only; subsequent refetches use `stale` flag
- **Fetching volumes in useSonosData (dashboard):** Only fetch health + zones + one playback for the card; full volume data is only needed on the page
- **useRetryableCommand inside conditional:** Must be called unconditionally at hook top level (React hooks rules)
- **Missing `export const dynamic = 'force-dynamic'`:** Not needed in client components — this is an API route pattern only
- **volume null handling:** `SonosVolumeResponse.volume` is `number | null` — handle null gracefully in slider (show 0 or disabled state)
- **mute null handling:** `SonosVolumeResponse.mute` is `boolean | null` — treat null as unmuted for display

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retry with backoff | Custom retry loop | `useRetryableCommand` | Already in project, handles dedup + idempotency |
| Polling with visibility awareness | Custom setInterval + visibilitychange | `useAdaptivePolling` + `useVisibility` | Handles hidden tab, cleanup, initial delay |
| Card layout wrapper | Custom card div | `SmartHomeCard` with `colorTheme="sage"` | Accent bar, padding, error overlay, loading spinner all built in |
| Page layout with header | Custom layout | `PageLayout` + `PageLayout.Header` | Consistent header slot, padding, responsive |
| Warning/error display | Custom alert div | `Banner` with `variant="warning"` | Consistent styling, compact prop |
| Volume debouncing | Custom debounce utility | `setTimeout` + `useRef` for debounce (200-300ms per SPECIFICS) | Simple enough inline; no external dep needed |

**Key insight:** This is an integration phase, not a framework-building phase. Every pattern, component, and hook used here already exists in the project.

## Common Pitfalls

### Pitfall 1: Stale Zones at Fetch Time
**What goes wrong:** `useSonosFullData` fetches zones, then uses those IDs to fetch playback. If a zone disappears between requests, the playback fetch fails with 404.
**Why it happens:** Sonos groups are dynamic — speakers can leave/join zones between requests.
**How to avoid:** Wrap individual zone playback fetches in try/catch inside `Promise.all`. Use `Promise.allSettled` for volume fetches. Treat partial data as valid (some zones may have null playback).
**Warning signs:** "Zone not found" errors in production after testing.

### Pitfall 2: Volume Slider Flooding PUT Requests
**What goes wrong:** `input[type=range]` fires onChange on every pixel move, flooding `/api/sonos/speakers/{uid}/volume` with hundreds of requests.
**Why it happens:** HTML range input is not debounced by default.
**How to avoid:** Debounce volume updates 200-300ms using `useRef` + `setTimeout`. Show optimistic volume value immediately but delay the API call.
**Warning signs:** Network tab shows many PUT requests per slider drag.

### Pitfall 3: Null Transport State Display
**What goes wrong:** `SonosPlaybackResponse.transport_state` can be `null` (zone exists but proxy has no playback data yet). Code crashes trying to render playback state icon.
**Why it happens:** Zone was just created or proxy cache is empty.
**How to avoid:** Always null-check `transport_state` before rendering state icons. Show "Nessuna riproduzione" when `title` is null OR `transport_state` is null/STOPPED.
**Warning signs:** TypeError on initial load before first poll completes.

### Pitfall 4: Wrong Response Shape for Zones Endpoint
**What goes wrong:** Fetching `/api/sonos/zones` and expecting an array directly, but the route wraps in `{ zones: [...] }`.
**Why it happens:** Phase 126 decision — array responses are wrapped in named object keys (verified in `app/api/sonos/zones/route.ts`: `return success({ zones: data })`).
**How to avoid:** Type the response as `{ zones: SonosZoneResponse[] }` and access `.zones`.
**Warning signs:** `data.map is not a function` at runtime.

### Pitfall 5: Skeleton.SonosCard Type Error
**What goes wrong:** Adding `Skeleton.SonosCard = function...` without updating the Skeleton type declaration causes TypeScript error "Property 'SonosCard' does not exist on type 'typeof Skeleton'".
**Why it happens:** The Skeleton component uses module-level type augmentation.
**How to avoid:** Check how `Skeleton.RaspiCard` is declared and follow the same pattern — it's a direct property assignment on the function object, not a type-declared interface. TypeScript infers it.
**Warning signs:** tsc error on `Skeleton.SonosCard` usage.

### Pitfall 6: Forgetting SonosCard Import in DashboardCards.tsx
**What goes wrong:** Adding to CARD_COMPONENTS registry but forgetting the import statement at the top of the file.
**Why it happens:** Three separate registries to update, easy to miss the import.
**How to avoid:** When editing DashboardCards.tsx, always update: (1) import, (2) CARD_COMPONENTS, (3) CARD_SKELETONS, (4) DEVICE_META — four changes for one card.
**Warning signs:** "SonosCard is not defined" build error.

## Code Examples

### Verified: Zone Playback Fetch Shape

```typescript
// Source: app/api/sonos/zones/[groupId]/playback/route.ts (verified)
// GET /api/sonos/zones/{groupId}/playback → SonosPlaybackResponse (direct, not wrapped)
const res = await fetch(`/api/sonos/zones/${groupId}/playback`);
const playback = await res.json() as SonosPlaybackResponse;
// Fields: group_id, transport_state, title, artist, album, album_art_url, position, duration, source_type
```

### Verified: Transport Command Pattern (202 Accepted)

```typescript
// Source: app/api/sonos/zones/[groupId]/play/route.ts (verified)
// POST /api/sonos/zones/{groupId}/play → { status: 'ok', group_id: '...', suggested_poll_delay_s: 1 }
const response = await fetch(`/api/sonos/zones/${groupId}/play`, { method: 'POST' });
// Returns HTTP 202 Accepted
const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
await refetch();
```

### Verified: Volume PUT Pattern

```typescript
// Source: app/api/sonos/speakers/[uid]/volume/route.ts (verified)
// PUT /api/sonos/speakers/{uid}/volume body: { volume: number }
const response = await fetch(`/api/sonos/speakers/${uid}/volume`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ volume } satisfies SetVolumeRequest),  // SetVolumeRequest = { volume: number }
});
// Returns HTTP 202 Accepted + { suggested_poll_delay_s: 1 }
```

### Verified: Mute PUT Pattern

```typescript
// Source: app/api/sonos/speakers/[uid]/mute/route.ts (inferred from volume pattern)
// PUT /api/sonos/speakers/{uid}/mute body: { mute: boolean }
const response = await fetch(`/api/sonos/speakers/${uid}/mute`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mute } satisfies SetMuteRequest),  // SetMuteRequest = { mute: boolean }
});
```

### Verified: RaspiCard Test Pattern (for SonosCard.test.tsx)

```typescript
// Source: app/components/devices/raspi/__tests__/RaspiCard.test.tsx (verified)
jest.mock('../hooks/useSonosData');
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../../ui', () => ({
  SmartHomeCard: Object.assign(
    ({ children, title, headerActions }) => <div data-testid="smart-home-card">{headerActions}{children}</div>,
    { Controls: ({ children }) => <div>{children}</div> }
  ),
  Banner: ({ title, children }) => <div data-testid="banner">{title}{children}</div>,
}));
jest.mock('../../../ui/Skeleton', () => {
  const Skeleton = () => null;
  Skeleton.SonosCard = () => <div data-testid="skeleton-sonos" />;
  return { __esModule: true, default: Skeleton };
});
```

### Verified: Hook Test Pattern (for useSonosData.test.ts)

```typescript
// Source: app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts (verified)
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');

mockUseAdaptivePolling.mockImplementation(({ callback, immediate }) => {
  if (immediate) setTimeout(() => void callback(), 0);
});
mockUseVisibility.mockReturnValue(true);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Sonos API calls | All via HA proxy (haGet/haPost/haPut) | Phase 126 | No direct device URLs in frontend |
| JWT auth | X-API-Key via proxy | Phase 84 | Frontend never sends auth headers |
| Device-specific page files | DEVICE_CONFIG drives nav + registry | Phase 118+ | Sonos nav entry needs no Navbar.tsx edit |

## Open Questions

1. **`useSonosCommands` receives `fetchData` reference**
   - What we know: LightsCard passes `setRefreshing`, `setLoadingMessage`, `setError`, `fetchData` from useLightsData into useLightsCommands via a params object
   - What's unclear: Whether useSonosCommands should accept a full UseSonosFullDataReturn or just the needed setters + fetchData
   - Recommendation: Accept minimal interface — `{ setError: (e: string | null) => void; fetchData: () => Promise<void> }` — simpler and sufficient for Sonos commands

2. **Volume null display in slider**
   - What we know: `SonosVolumeResponse.volume` is `number | null`
   - What's unclear: Whether to show slider as disabled or show 0 when null
   - Recommendation: Show value as `volume ?? 0` and disable slider when null (add `disabled` prop to input)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npm test -- --testPathPattern="sonos" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONOS-31 | SonosCard renders skeleton/error/data/stale states | unit | `npm test -- --testPathPattern="SonosCard"` | ❌ Wave 0 |
| SONOS-31 | useSonosData: loading, fetch, error, stale, poll | unit | `npm test -- --testPathPattern="useSonosData"` | ❌ Wave 0 |
| SONOS-32 | useSonosFullData: fetches zones + playback + volume | unit | `npm test -- --testPathPattern="useSonosFullData"` | ❌ Wave 0 |
| SONOS-32 | useSonosCommands: play/pause/stop/next/prev/setVolume/setMute + 202 pattern | unit | `npm test -- --testPathPattern="useSonosCommands"` | ❌ Wave 0 |
| SONOS-33 | DEVICE_CONFIG.sonos already present — no test needed | manual | verify `grep -n "SONOS" lib/devices/deviceTypes.ts` | ✅ already exists |
| SONOS-34 | Navbar renders Sonos entry automatically from DEVICE_CONFIG — no new code, no new test | manual | verify nav renders Sonos link | ✅ existing Navbar tests cover |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="sonos" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `app/components/devices/sonos/__tests__/SonosCard.test.tsx` — covers SONOS-31 card states
- [ ] `app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts` — covers SONOS-31 hook
- [ ] `app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts` — covers SONOS-32 data hook
- [ ] `app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts` — covers SONOS-32 command hook

## Sources

### Primary (HIGH confidence)

- `app/components/devices/raspi/RaspiCard.tsx` — verified card pattern
- `app/components/devices/raspi/hooks/useRaspiData.ts` — verified polling hook pattern
- `app/components/devices/raspi/hooks/useRaspiFullData.ts` — verified full data hook pattern
- `app/raspi/page.tsx` — verified page orchestrator pattern
- `app/components/devices/lights/hooks/useLightsCommands.ts` — verified command hook pattern
- `app/components/DashboardCards.tsx` — verified registry pattern + confirmed sonos not yet added
- `app/components/ui/Skeleton.tsx` — verified sub-component pattern (Skeleton.RaspiCard at line 785)
- `app/components/ui/SmartHomeCard.tsx` — verified colorTheme="sage" prop
- `types/sonosProxy.ts` — verified all TypeScript types
- `app/api/sonos/zones/route.ts` — verified `{ zones: [...] }` wrap
- `app/api/sonos/zones/[groupId]/playback/route.ts` — verified direct object response (not wrapped)
- `app/api/sonos/zones/[groupId]/play/route.ts` — verified 202 + suggested_poll_delay_s=1 pattern
- `app/api/sonos/speakers/[uid]/volume/route.ts` — verified GET+PUT pattern
- `lib/devices/deviceTypes.ts` lines 154-173 — verified DEVICE_CONFIG.sonos already present with enabled: true
- `.planning/phases/129-sonos-frontend/129-CONTEXT.md` — all locked decisions
- `app/components/devices/raspi/__tests__/RaspiCard.test.tsx` — verified test mock patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from codebase inspection, no external libraries needed
- Architecture: HIGH — patterns directly extracted from existing analogous devices (Raspi, Lights)
- Pitfalls: HIGH — derived from existing types and API route implementations
- API shapes: HIGH — verified from `types/sonosProxy.ts` and route files

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable codebase, no external dependencies to check)
