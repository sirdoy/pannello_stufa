# Phase 138: Sonos Frontend Wiring & Nav Fix - Research

**Researched:** 2026-03-26
**Domain:** Frontend gap closure — hook extension, UI component addition, nav config fix
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SONOS-04 | GET /sonos/devices — lista speaker con identity e topology | Route exists (`app/api/sonos/devices/route.ts`); `getDevices()` proxy function exists; needs a fetch call added to `useSonosFullData` and exposed in `SonosFullData` interface |
| SONOS-05 | GET /sonos/devices/{uid} — dettaglio speaker con audio state on-demand | Route exists (`app/api/sonos/devices/[uid]/route.ts`); `getDevice(uid)` proxy exists; used on-demand only (not polled); needs fetch utility or a hook, and device list from SONOS-04 to know which UIDs to fetch |
| SONOS-16 | PUT /sonos/zones/{group_id}/volume — set volume per tutti gli speaker in una zona | Route exists (`app/api/sonos/zones/[groupId]/volume/route.ts`); `setZoneVolume(groupId, volume)` proxy exists; `useSonosCommands` does NOT expose `handleSetZoneVolume` — must add it to hook return + interface |
| SONOS-17 | PUT /sonos/zones/{group_id}/seek — seek a posizione nel brano (HH:MM:SS) | Route exists (`app/api/sonos/zones/[groupId]/seek/route.ts`); `seek(groupId, position)` proxy exists; no UI component and no handler in `useSonosCommands` — must add `handleSeek` to hook and add `SonosSeekControl` component wired into `SonosZoneSection` |
| SONOS-31 | SonosCard dashboard card con now playing, zone status, speaker count | Satisfied. No additional work needed. Listed because nav sub-item fix restores full SONOS-31 intent |
| SONOS-34 | Navigation menu entry per Sonos | Partially broken: Sonos main nav entry works, but `spotify` and `zones` sub-items in `DEVICE_CONFIG` produce 404s via `getDeviceNavItems()`. Fix: remove those two routes from `deviceTypes.ts` |
</phase_requirements>

## Summary

Phase 138 is a gap-closure phase with four distinct problems all in the Sonos frontend layer. No new API routes are needed — all proxy functions and route handlers already exist from Phases 126-128. The work is entirely in `useSonosCommands`, `useSonosFullData`, a new UI component, and `deviceTypes.ts`.

**Gap 1 (SONOS-34 nav 404):** `deviceTypes.ts` line 164-165 registers `spotify: '/sonos/spotify'` and `zones: '/sonos/zones'` in `DEVICE_CONFIG.sonos.routes`. `getDeviceNavItems()` in `deviceRegistry.ts` iterates all routes except a hardcoded skip-list (`main`, `scheduler`, etc.) and renders them as nav sub-items. Since no `app/sonos/spotify/` or `app/sonos/zones/` pages exist, clicking these nav items triggers a 404. Fix: remove the two route keys and their corresponding `hasSpotify`, `hasZones`, `hasSearch` feature flags from `DEVICE_CONFIG.sonos`.

**Gap 2 (SONOS-04/05 orphaned routes):** `/api/sonos/devices` and `/api/sonos/devices/[uid]` have no frontend consumer. `SonosFullData` interface in `useSonosFullData` does not include a `devices` field. Fix: add a `devices: SonosDeviceResponse[]` field to `SonosFullData` and fetch it alongside zones in the `fetchData` function. SONOS-05 (single device detail) is an on-demand enrichment; exposing the device list satisfies SONOS-04 and provides UID-level model/firmware/serial metadata.

**Gap 3 (SONOS-16 zone volume):** `setZoneVolume(groupId, volume)` exists in `sonosProxy.ts` and the PUT route exists, but `useSonosCommands` does not expose `handleSetZoneVolume`. The interface `UseSonosCommandsReturn` needs a new handler. The handler belongs on `sonosVolumeCmd` (same retryable command instance as `handleSetVolume`). A zone-level volume control can be added to `SonosZoneSection` (a single slider above the per-speaker sliders, or beside the zone header).

**Gap 4 (SONOS-17 seek UI):** The seek route and proxy both exist. `SetSeekRequest` has `position: string` in `"HH:MM:SS"` format. `SonosPlaybackResponse` includes `position: string | null` and `duration: string | null`. A seek control needs: (a) `handleSeek(groupId, position)` added to `useSonosCommands`, and (b) a `SonosSeekControl` component that shows current position and allows input/scrubbing. The component is wired into `SonosZoneSection` below transport controls.

**Primary recommendation:** Three file edits + one new component. All changes are additive (no regressions). Scope is small — 1-2 plans.

## Standard Stack

### Core (already in use — no new installations)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (Next.js 15.5) | 15.5 | Component model, hooks | Project stack |
| TypeScript (strict) | 5.x | Type safety | Project standard |
| lucide-react | latest | Icons (Play, SkipBack, etc.) | Used in SonosTransportControls, all device components |
| Tailwind CSS | 3.x | Styling | Design system |

No new packages required. This phase is purely additive TypeScript/React work.

## Architecture Patterns

### File Locations (all established)

```
lib/devices/deviceTypes.ts          # Fix: remove spotify/zones routes from DEVICE_CONFIG.sonos
types/sonosProxy.ts                 # Possibly add nothing (all types exist)
app/components/devices/sonos/
  hooks/
    useSonosFullData.ts             # Add devices[] to SonosFullData + fetch
    useSonosCommands.ts             # Add handleSetZoneVolume + handleSeek
    __tests__/
      useSonosFullData.test.ts      # Add tests for devices fetch
      useSonosCommands.test.ts      # Add tests for 2 new handlers
  components/
    SonosSeekControl.tsx            # New component
    SonosZoneSection.tsx            # Wire: zone volume slider + SonosSeekControl
    __tests__/
      SonosSeekControl.test.tsx     # New test file
```

### Pattern 1: Adding a handler to useSonosCommands

All existing handlers follow the same pattern — call `sonosVolumeCmd.execute` or `sonosExtendedCmd.execute`, check `response.ok`, read `suggested_poll_delay_s`, wait, then `fetchData()`. New handlers MUST follow this exact structure.

```typescript
// Source: app/components/devices/sonos/hooks/useSonosCommands.ts (existing pattern)
const handleSetZoneVolume = async (groupId: string, volume: number) => {
  try {
    params.setError(null);
    const response = await sonosVolumeCmd.execute(`/api/sonos/zones/${groupId}/volume`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume } satisfies SetVolumeRequest),
    });
    if (response) {
      if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
      const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
      await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
      await params.fetchData();
    }
  } catch (err: unknown) {
    params.setError(err instanceof Error ? err.message : String(err));
  }
};

const handleSeek = async (groupId: string, position: string) => {
  try {
    params.setError(null);
    const response = await sonosVolumeCmd.execute(`/api/sonos/zones/${groupId}/seek`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position } satisfies SetSeekRequest),
    });
    if (response) {
      if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
      const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
      await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
      await params.fetchData();
    }
  } catch (err: unknown) {
    params.setError(err instanceof Error ? err.message : String(err));
  }
};
```

Both new handlers use `sonosVolumeCmd` (the second retryable instance) because they are volume/position mutations — same category as `handleSetVolume` and `handleSetMute`. The existing test mock cycling pattern (`callCount % 3`) already covers 3 instances; new handler tests pass the same `mockVolumeCmd` mock.

### Pattern 2: Extending SonosFullData with device list

`useSonosFullData` already fetches zones, playback, volumes, EQ, home-theater, play-modes, sleep-timers using `Promise.allSettled`. Adding devices is a single `fetch('/api/sonos/devices')` call that returns `{ devices: SonosDeviceResponse[] }`.

```typescript
// Source: app/components/devices/sonos/hooks/useSonosFullData.ts (extension)
// Add to SonosFullData interface:
devices: SonosDeviceResponse[];

// Add to fetchData, before or alongside the zones fetch:
const devicesRes = await fetch('/api/sonos/devices');
if (!devicesRes.ok) throw new Error('Devices endpoint failed');
const devicesBody = (await devicesRes.json()) as { devices: SonosDeviceResponse[] };
const devices = devicesBody.devices;

// Add to newData object:
const newData: SonosFullData = { devices, zones, playback, volumes, ... };
```

The existing `SonosFullData` type is imported directly in tests — updating the interface requires updating test fixtures too.

### Pattern 3: SonosSeekControl component

Seek requires `position: string` in `"HH:MM:SS"` format. `SonosPlaybackResponse.position` and `.duration` are both `string | null` in `"HH:MM:SS"` format. The component:

- Receives `playback: SonosPlaybackResponse | undefined`, `groupId: string`, `onSeek: (groupId: string, position: string) => Promise<void>`
- Shows current position and duration as text (e.g. `1:23 / 3:45`)
- Has an `<input type="range">` that maps 0-100 to a position within the track duration
- On slider release (onMouseUp/onTouchEnd/onChange with debounce), converts the percentage back to `"HH:MM:SS"` and calls `onSeek`
- Disabled when `transport_state === 'STOPPED'` or duration is null (live stream / no track)

**Time conversion utility needed:**

```typescript
// Convert "HH:MM:SS" → seconds
function hhmmssToSeconds(ts: string): number {
  const [h, m, s] = ts.split(':').map(Number);
  return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
}

// Convert seconds → "HH:MM:SS"
function secondsToHhmmss(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
```

These are pure functions — define them inline in `SonosSeekControl.tsx` or in a shared `sonosUtils.ts` in the components directory. Given no other utility files exist in this component tree, inline is simpler.

### Pattern 4: deviceTypes.ts fix

The fix is surgical: in `DEVICE_CONFIG.sonos.routes`, remove `spotify: '/sonos/spotify'` and `zones: '/sonos/zones'`. In `DEVICE_CONFIG.sonos.features`, remove `hasSpotify: true`, `hasZones: true`, `hasSearch: true` (or set to false). The `DeviceFeatures` interface has these as optional booleans so removal or `false` both work — setting to `false` is safer since it preserves the interface shape.

```typescript
// Before (deviceTypes.ts lines 163-176):
routes: {
  main: '/sonos',
  spotify: '/sonos/spotify',   // REMOVE
  zones: '/sonos/zones',       // REMOVE
},
features: {
  hasSpotify: true,   // REMOVE or set false
  hasPlayback: true,
  hasZones: true,     // REMOVE or set false
  hasSearch: true,    // REMOVE or set false
},

// After:
routes: {
  main: '/sonos',
},
features: {
  hasPlayback: true,
},
```

`getDeviceNavItems()` in `deviceRegistry.ts` will then only produce one nav item for Sonos: `{ label: 'Controllo', route: '/sonos' }`. No change to `deviceRegistry.ts` is needed.

### Pattern 5: Zone volume slider in SonosZoneSection

The zone volume slider controls ALL speakers in the zone simultaneously. It belongs in `SonosZoneSection` above the per-speaker volume section. It follows the same `<input type="range">` + 250ms debounce pattern as `SonosSpeakerVolume`. The prop required is `onSetZoneVolume: (groupId: string, volume: number) => Promise<void>` passed from `useSonosCommands`.

A zone-level volume default can be derived from the coordinator's current volume (from `volumes[zone.coordinator_uid]`) as the initial display value.

### Anti-Patterns to Avoid

- **Do not add a new `useRetryableCommand` call for new handlers** — the three existing instances (`sonosTransportCmd`, `sonosVolumeCmd`, `sonosExtendedCmd`) must remain exactly 3 (React hooks count must be stable). Route `handleSetZoneVolume` and `handleSeek` through `sonosVolumeCmd`.
- **Do not use a separate polling hook for devices list** — fetch devices once inside `useSonosFullData.fetchData()` alongside zones. The devices endpoint is not polled separately.
- **Do not create a new hook** for zone volume — add `handleSetZoneVolume` to the existing `useSonosCommands`.
- **Do not create sub-pages** for `/sonos/spotify` or `/sonos/zones` — the correct fix is to remove those routes from `deviceTypes.ts`, not build empty placeholder pages.
- **Do not change `deviceRegistry.ts`** — the fix is in `deviceTypes.ts` only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Range input debouncing | Custom debounce utility | Pattern from SonosSpeakerVolume (setTimeout 250ms + useRef) | Already established in this exact codebase |
| 202 Accepted + poll delay | Custom retry logic | `useRetryableCommand.execute` + existing handler pattern | All Sonos commands follow this exact pattern |
| Time format conversion | External library | Pure inline functions (hhmmssToSeconds + secondsToHhmmss) | Simple arithmetic, no edge cases needing a library |

## Common Pitfalls

### Pitfall 1: Adding a 4th useRetryableCommand call
**What goes wrong:** React will throw a hooks-count error or silently break if a new `useRetryableCommand` is added conditionally or if the count changes between renders.
**Why it happens:** The mock cycling pattern in `useSonosCommands.test.ts` uses `callCount % 3` — adding a 4th call breaks that pattern and test cycle assignment.
**How to avoid:** Route both new handlers through existing `sonosVolumeCmd` instance. Position mutations (seek) and zone volume mutations are both volume-domain commands.
**Warning signs:** Test output shows wrong mock assigned to a handler.

### Pitfall 2: SonosFullData interface change breaks useSonosFullData tests
**What goes wrong:** Test fixtures that mock the full `SonosFullData` object will fail TypeScript strict mode if `devices` is added to the interface but not to fixture objects.
**Why it happens:** `useSonosFullData.test.ts` likely constructs `SonosFullData` objects manually in test assertions.
**How to avoid:** After adding `devices: SonosDeviceResponse[]` to the interface, update all test fixtures to include a `devices: []` or `devices: [mockDevice]` field.
**Warning signs:** `TS2322: Property 'devices' is missing` errors in test files.

### Pitfall 3: Seek slider sends position on every onChange event
**What goes wrong:** Dragging the seek slider fires onChange many times per second, sending a PUT request for each intermediate value.
**Why it happens:** `<input type="range">` onChange fires continuously during drag.
**How to avoid:** Use `onMouseUp`/`onTouchEnd` for the seek commit (not onChange), or use onChange with a debounce ref (250ms minimum). Show optimistic local position during drag.
**Warning signs:** Network tab shows many PUT requests during a single slider drag.

### Pitfall 4: Seek slider enabled on live streams or stopped state
**What goes wrong:** Live streams and radio have no `duration` (null). Sending a seek command with `position: "00:00:00"` to a live stream will likely return a 4xx error from the HA proxy.
**Why it happens:** `SonosPlaybackResponse.duration` is `string | null`. The seek component doesn't check for null.
**How to avoid:** Disable the seek input when `playback?.duration === null` or `playback?.transport_state === 'STOPPED'`.
**Warning signs:** Console errors on seek during radio playback.

### Pitfall 5: Zone volume slider initial value undefined
**What goes wrong:** `volumes[zone.coordinator_uid]` may be undefined if the coordinator's volume fetch failed (Promise.allSettled partial failure). The zone volume slider renders `NaN%`.
**Why it happens:** Volumes are keyed by UID; `SonosFullData.volumes` is `Record<string, SonosVolumeResponse>` with no guarantee every UID has an entry.
**How to avoid:** Default to `volumeData?.volume ?? 50` (or `0`) when coordinator volume is missing, and disable the slider if the value is genuinely unavailable.
**Warning signs:** Slider shows `NaN%` or 0 while speaker sliders show real values.

## Code Examples

### Verified: Existing handler structure (source: useSonosCommands.ts)

```typescript
const handleSetVolume = async (uid: string, volume: number) => {
  try {
    params.setError(null);
    const response = await sonosVolumeCmd.execute(`/api/sonos/speakers/${uid}/volume`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume } satisfies SetVolumeRequest),
    });
    if (response) {
      if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
      const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
      await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
      await params.fetchData();
    }
  } catch (err: unknown) {
    params.setError(err instanceof Error ? err.message : String(err));
  }
};
```

### Verified: SonosSpeakerVolume debounce pattern (source: SonosSpeakerVolume.tsx)

```typescript
const [localVolume, setLocalVolume] = useState(volume);
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  setLocalVolume(volume);
}, [volume]);

const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newVol = parseInt(e.target.value, 10);
  setLocalVolume(newVol); // optimistic
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    void onSetVolume(uid, newVol);
  }, 250);
};
```

### Verified: Test mock cycling pattern (source: useSonosCommands.test.ts)

```typescript
let callCount = 0;
mockUseRetryableCommand.mockImplementation(() => {
  callCount++;
  if (callCount % 3 === 1) return mockTransportCmd as ReturnType<typeof useRetryableCommand>;
  if (callCount % 3 === 2) return mockVolumeCmd as ReturnType<typeof useRetryableCommand>;
  return mockExtendedCmd as ReturnType<typeof useRetryableCommand>;
});
```

New tests for `handleSetZoneVolume` and `handleSeek` use `mockVolumeCmd` — the second instance in the cycle.

### Verified: devices endpoint response shape (source: app/api/sonos/devices/route.ts)

```typescript
// Returns { devices: SonosDeviceResponse[] }
return success({ devices: data });  // data is SonosDeviceResponse[]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No zone volume in UI | Zone volume handler exists in proxy, not exposed in hook | Phase 127 | Phase 138 closes the gap |
| No seek UI | Seek route + proxy exist, not wired | Phase 127 | Phase 138 closes the gap |
| Sonos nav sub-items registered | Aspirational routes in DEVICE_CONFIG cause 404 | Phase 129 D-23 | Phase 138 removes them |
| No devices list in frontend | `/api/sonos/devices` orphaned | Phase 126 | Phase 138 adds fetch to useSonosFullData |

## Open Questions

None. All gaps have clear resolutions with existing infrastructure. No ambiguity about approach.

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code changes with no external dependencies beyond the existing Next.js dev server.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | jest.config.js (root) |
| Quick run command | `npm test -- --testPathPattern="sonos" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONOS-04 | useSonosFullData fetches /api/sonos/devices and exposes devices[] | unit | `npm test -- --testPathPattern="useSonosFullData"` | ✅ (extend existing) |
| SONOS-05 | devices list contains UID/name/model per SonosDeviceResponse | unit | `npm test -- --testPathPattern="useSonosFullData"` | ✅ (extend existing) |
| SONOS-16 | useSonosCommands.handleSetZoneVolume sends PUT zones/{id}/volume | unit | `npm test -- --testPathPattern="useSonosCommands"` | ✅ (extend existing) |
| SONOS-17 | useSonosCommands.handleSeek sends PUT zones/{id}/seek + SonosSeekControl renders | unit | `npm test -- --testPathPattern="useSonosCommands|SonosSeekControl"` | ❌ Wave 0: SonosSeekControl.test.tsx |
| SONOS-31 | SonosCard unaffected by changes | unit | `npm test -- --testPathPattern="SonosCard"` | ✅ (run as regression) |
| SONOS-34 | deviceTypes.ts no longer has spotify/zones routes | unit | `npm test -- --testPathPattern="deviceRegistry|Navbar"` | ✅ (run as regression) |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="sonos" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `app/components/devices/sonos/components/__tests__/SonosSeekControl.test.tsx` — covers SONOS-17 (seek component render + disabled states + time conversion)

## Project Constraints (from CLAUDE.md)

- NEVER break existing functionality — all 4 gaps are additive; no existing hook signatures change (only additions)
- PREFER editing existing files over creating new — only one new file needed (`SonosSeekControl.tsx`); all other changes are edits to existing files
- ALWAYS create/update unit tests — required for every changed file
- USE design system — seek slider uses same Tailwind range input pattern as `SonosSpeakerVolume`
- NEVER execute `npm run build` or `npm install`
- NEVER commit/push without explicit request

## Sources

### Primary (HIGH confidence)

- Direct code inspection of `app/components/devices/sonos/hooks/useSonosCommands.ts` — confirmed 14 handlers, no `handleSetZoneVolume` or `handleSeek`
- Direct code inspection of `app/components/devices/sonos/hooks/useSonosFullData.ts` — confirmed `SonosFullData` has no `devices` field
- Direct code inspection of `lib/devices/deviceTypes.ts` lines 162-165 — confirmed `spotify: '/sonos/spotify'` and `zones: '/sonos/zones'` present
- Direct code inspection of `lib/devices/deviceRegistry.ts` lines 122-133 — confirmed all non-standard routes become nav items
- Direct code inspection of `app/api/sonos/zones/[groupId]/seek/route.ts` — route exists, expects `SetSeekRequest { position: string }`
- Direct code inspection of `app/api/sonos/zones/[groupId]/volume/route.ts` — route exists, expects `SetVolumeRequest { volume: number }`
- Direct code inspection of `app/api/sonos/devices/route.ts` — returns `{ devices: SonosDeviceResponse[] }`
- Direct code inspection of `.planning/v16.0-MILESTONE-AUDIT.md` — gap analysis authoritative source

### Secondary (MEDIUM confidence)

- None required — all findings are from direct code inspection

## Metadata

**Confidence breakdown:**
- Gap identification: HIGH — audit document + direct code verification confirm all 4 gaps
- Fix approach: HIGH — patterns are established and consistent across the codebase
- Component design (SonosSeekControl): HIGH — mirrors SonosSpeakerVolume pattern exactly
- Scope estimate: HIGH — 1-2 plans, ~6-8 files touched

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable codebase, no external API changes)
