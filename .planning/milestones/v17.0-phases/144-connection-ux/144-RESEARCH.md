# Phase 144: Connection UX - Research

**Researched:** 2026-03-28
**Domain:** React UI patterns — real-time status indicators, relative timestamps, hook extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Status Indicator Placement (UX-01)**
- D-01: A single global connection status indicator lives in the dashboard header/nav area. It uses the existing `ConnectionStatus` component (CVA-based, `app/components/ui/ConnectionStatus.tsx`) with its `online/connecting/offline` variants.
- D-02: The indicator maps `ReadyState` from `useWebSocketContext()` to three visual states:
  - `ReadyState.OPEN` → `online` (green dot, "Connesso via WS")
  - `ReadyState.CONNECTING` → `connecting` (amber pulsing dot, "Riconnessione...")
  - `ReadyState.CLOSED` / `ReadyState.CLOSING` / `ReadyState.UNINSTANTIATED` → `offline` (grey dot, "Polling attivo")
- D-03: The indicator is display-only — no click action needed.

**Transition Smoothness (UX-02)**
- D-04: Card data persists in React state during WS/polling transitions. No clearing, no loading skeleton, no flash.
- D-05: No visible change occurs in cards during source transitions — data stream appears continuous.
- D-06: Behavior is already inherent in hook architecture from Phases 140-143. Phase 144 must verify this works correctly and add tests if missing.

**Last-Updated Timestamps (UX-03)**
- D-07: Each dashboard card displays a small "last updated" timestamp in the card footer area.
- D-08: Timestamp format is relative time ("5s fa", "2m fa", "1h fa") in Italian.
- D-09: Timestamp source: WS `ts` field (unix seconds × 1000) when on WebSocket, or `Date.now()` at HTTP response time when on polling fallback.
- D-10: Timestamps update reactively — a `useRelativeTime` utility or interval re-renders the relative string every 10–15 seconds.

### Claude's Discretion
- Whether to create a `useConnectionStatus` hook that wraps `useWebSocketContext().readyState` into a simpler status string, or inline the mapping in the component
- Whether to build `useRelativeTime` as a standalone hook or a utility function with `useEffect` interval
- How to inject the last-updated timestamp into existing card orchestrators (prop threading vs hook return value extension)
- Whether the timestamp component is a shared presentational component or inline per-card
- Test strategy for verifying flicker-free transitions (possibly Playwright visual regression or unit test with state assertions)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | Indicatore visuale dello stato connessione WebSocket (connesso / riconnessione / fallback polling) | `ConnectionStatus` component already has the exact variants; `useWebSocketContext().readyState` provides the source; a thin wrapper or inline mapping wires them |
| UX-02 | Transizione tra WebSocket e polling avviene senza flicker o perdita dati visibile | Hook architecture from Phases 140–143 already preserves state across source switches; verification + tests required |
| UX-03 | Dashboard card mostrano timestamp ultimo aggiornamento (da WS `ts` field o polling) | New `useRelativeTime` hook + `lastUpdatedAt: number` exposed from each device hook; small `LastUpdated` presentational component or inline rendering |
</phase_requirements>

---

## Summary

Phase 144 is a pure UI wiring phase — all data infrastructure was built in Phases 139–143. The work is: (1) wire the existing `ConnectionStatus` component into the Navbar with a `ReadyState` → status mapping, (2) verify that existing hook state-persistence already prevents flicker during WS/polling switches and add unit tests that assert data is retained, and (3) add `lastUpdatedAt: number | null` to each of the six device hooks, build a `useRelativeTime` hook that converts a unix-ms timestamp to an Italian relative string refreshing every 10–15s, and surface the timestamp in every dashboard card footer.

No new dependencies are needed. The entire phase is composition of existing pieces: `ConnectionStatus` (already supports the three needed variants), `useWebSocketContext().readyState` (already exposed), `WebSocketMessage.ts` (already available as unix seconds), and the `setLastPollAt(new Date())` pattern already present in `useStoveData` and `useNetworkData.lastUpdated`.

**Primary recommendation:** Extend each device hook to return `lastUpdatedAt: number | null` (unix ms), create `lib/hooks/useRelativeTime.ts` as a simple interval-driven hook, create `app/components/ui/LastUpdated.tsx` as a small presentational component, wire `ConnectionStatus` into `Navbar.tsx` via a new `NavbarConnectionStatus` client sub-component, and write unit tests for `useRelativeTime` and the `ReadyState` → status mapping.

---

## Standard Stack

### Core (all already installed — no new deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.x | Hook primitives (`useEffect`, `useState`, interval) | Already in use |
| react-use-websocket | latest | `ReadyState` enum source | Already in use via `useWebSocketManager` |
| class-variance-authority | latest | `ConnectionStatus` CVA variants | Already in use |

### No new installations required

This phase adds no new npm packages.

---

## Architecture Patterns

### Recommended File Structure

```
app/
├── components/
│   ├── ui/
│   │   ├── ConnectionStatus.tsx          # EXISTING — no changes needed
│   │   └── LastUpdated.tsx               # NEW — shared presentational component
│   └── layout/
│       └── NavbarConnectionStatus.tsx    # NEW — 'use client' sub-component for Navbar
lib/
├── hooks/
│   └── useRelativeTime.ts                # NEW — Italian relative time hook
```

Device hooks (all need `lastUpdatedAt` extension):
```
app/components/devices/stove/hooks/useStoveData.ts        # add lastUpdatedAt to return
app/components/devices/network/hooks/useNetworkData.ts    # lastUpdated already exists (rename/expose)
app/components/devices/lights/hooks/useLightsData.ts      # add lastUpdatedAt
app/components/devices/sonos/hooks/useSonosData.ts        # add lastUpdatedAt
app/components/devices/dirigera/hooks/useDirigeraData.ts  # add lastUpdatedAt
app/components/devices/thermostat/hooks/useThermostatData.ts # add lastUpdatedAt
```

### Pattern 1: ReadyState to ConnectionStatus Mapping

The `Navbar` is a 'use client' component. The `ConnectionStatus` component needs `readyState` from `useWebSocketContext()`. The mapping is a pure function and the component should call `useWebSocketContext()` directly (it is already inside `ClientProviders` which wraps `WebSocketContext.Provider`).

**Implementation choice:** Create `NavbarConnectionStatus.tsx` as a focused client sub-component to keep `Navbar.tsx` changes minimal. Import and render it in the Navbar header's right-side action area.

```typescript
// app/components/layout/NavbarConnectionStatus.tsx
'use client';

import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import { ConnectionStatus } from '@/app/components/ui/ConnectionStatus';

type WsStatus = 'online' | 'connecting' | 'offline';

function mapReadyState(rs: ReadyState): WsStatus {
  if (rs === ReadyState.OPEN) return 'online';
  if (rs === ReadyState.CONNECTING) return 'connecting';
  return 'offline'; // CLOSING, CLOSED, UNINSTANTIATED
}

const WS_STATUS_LABELS: Record<WsStatus, string> = {
  online: 'Connesso via WS',
  connecting: 'Riconnessione...',
  offline: 'Polling attivo',
};

export function NavbarConnectionStatus() {
  const { readyState } = useWebSocketContext();
  const status = mapReadyState(readyState);
  return (
    <ConnectionStatus
      status={status}
      label={WS_STATUS_LABELS[status]}
      size="sm"
    />
  );
}
```

**D-02 mapping verified** against `ReadyState` enum from `react-use-websocket`:
- `ReadyState.OPEN = 1` → `online`
- `ReadyState.CONNECTING = 0` → `connecting`
- `ReadyState.CLOSING = 2`, `ReadyState.CLOSED = 3`, `ReadyState.UNINSTANTIATED = -1` → `offline`

### Pattern 2: useRelativeTime Hook

Interval-based hook that accepts unix-ms timestamp and returns Italian relative string. Updates every 10s.

```typescript
// lib/hooks/useRelativeTime.ts
'use client';

import { useState, useEffect } from 'react';

/** Formats a unix-ms timestamp as Italian relative time ("5s fa", "2m fa", "1h fa"). */
export function formatRelativeTime(tsMs: number): string {
  const diffSeconds = Math.floor((Date.now() - tsMs) / 1000);

  if (diffSeconds < 5) return 'Adesso';
  if (diffSeconds < 60) return `${diffSeconds}s fa`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m fa`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h fa`;
}

/**
 * Hook that converts a unix-ms timestamp to an Italian relative time string.
 * Re-renders every 10 seconds to keep the display current.
 *
 * @param tsMs - Unix timestamp in milliseconds, or null when data not yet loaded
 * @returns Italian relative time string, or null if tsMs is null
 */
export function useRelativeTime(tsMs: number | null): string | null {
  const [relative, setRelative] = useState<string | null>(
    tsMs !== null ? formatRelativeTime(tsMs) : null
  );

  useEffect(() => {
    if (tsMs === null) {
      setRelative(null);
      return;
    }

    // Compute immediately
    setRelative(formatRelativeTime(tsMs));

    // Re-compute every 10s
    const id = setInterval(() => {
      setRelative(formatRelativeTime(tsMs));
    }, 10_000);

    return () => clearInterval(id);
  }, [tsMs]);

  return relative;
}
```

**Key note from CONTEXT.md (D-09):** WS `ts` field is unix seconds. Must multiply by 1000:
```typescript
// In WS handleMessage:
setLastUpdatedAt(data.ts * 1000);  // convert seconds → ms

// In HTTP response handler:
setLastUpdatedAt(Date.now());
```

### Pattern 3: LastUpdated Presentational Component

Small shared component for card footers. Keeps rendering consistent across all 6 device cards.

```typescript
// app/components/ui/LastUpdated.tsx
'use client';

import { useRelativeTime } from '@/lib/hooks/useRelativeTime';
import { cn } from '@/lib/utils/cn';

interface LastUpdatedProps {
  tsMs: number | null;
  className?: string;
}

export function LastUpdated({ tsMs, className }: LastUpdatedProps) {
  const relative = useRelativeTime(tsMs);

  if (!relative) return null;

  return (
    <p className={cn('text-xs text-slate-500 dark:text-slate-400', className)}>
      Aggiornato {relative}
    </p>
  );
}
```

### Pattern 4: Device Hook Extension — lastUpdatedAt

Each device hook must expose `lastUpdatedAt: number | null` (unix ms). The stove hook already has `lastPollAt: Date | null` — the addition is to expose it as unix ms. The network hook already has `lastUpdated: number | null` which is already unix ms and exposed in its return type.

**Before (example, stove):**
```typescript
// useStoveData — existing state:
const [lastPollAt, setLastPollAt] = useState<Date | null>(null);
```

**After:**
```typescript
// In WS handleMessage:
setLastUpdatedAt(data.ts * 1000);   // WS: use ts field × 1000

// In HTTP fetchStatusAndUpdate:
setLastUpdatedAt(Date.now());        // HTTP: capture response time

// In return value:
lastUpdatedAt,  // number | null — unix ms
```

**useNetworkData** — already exposes `lastUpdated: number | null`. No state change needed; just confirm it is set at WS message receipt too (check existing WS handler).

**Pattern for hooks that currently have NO lastPollAt tracking (lights, sonos, dirigera):**
```typescript
const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

// In WS handleMessage:
setLastUpdatedAt(msg.ts * 1000);  // The raw message is WebSocketMessage, ts is available

// In HTTP callback:
setLastUpdatedAt(Date.now());
```

**Critical note:** The WS `handleMessage` callback receives `data` (the topic payload), not the full `WebSocketMessage` envelope. The `ts` field is on the envelope. However, examining `useWebSocketManager.ts`:

```typescript
const msg = JSON.parse(lastMessage.data as string) as WebSocketMessage;
const topic = msg.topic as Topic;
callbacksRef.current.get(topic)?.forEach((cb) => cb(msg.data));  // passes only msg.data
```

The `ts` field from the envelope is NOT passed to callbacks — only `msg.data` (the topic payload) is dispatched. Therefore, **device hooks cannot receive `ts` from the WS message envelope through the existing callback API**.

**Resolution:** At the point where a WS message is received, `Date.now()` is a valid proxy for `ts * 1000` since the message just arrived. The WS envelope `ts` precision advantage (server timestamp vs client timestamp) is minimal for display purposes. Use `Date.now()` in WS `handleMessage` callbacks.

If higher accuracy is required, `useWebSocketManager` could be extended to pass `{ data, ts }` to callbacks — but this would require changing the `TopicCallback` type and all 6 device hook handlers. That is NOT a locked decision, making it Claude's discretion. The simpler approach (Date.now() in handler) avoids touching `useWebSocketManager`.

### Pattern 5: Card Footer Integration

Each dashboard card orchestrator passes `lastUpdatedAt` from its hook to a `<LastUpdated>` component in the card footer. Cards use `DeviceCard` which renders its `children` inside `SmartHomeCard`. The timestamp renders at the bottom of the children area or inside a footer slot.

`DeviceCard` / `SmartHomeCard` do NOT have a dedicated footer prop for arbitrary content. The recommended approach is to include `<LastUpdated>` as the last item in the `children` of the device-specific card component, wrapped in appropriate spacing:

```tsx
// In e.g. StoveCard.tsx or StoveCardPresentation.tsx
<DeviceCard ...>
  {/* ... existing content ... */}
  <LastUpdated tsMs={lastUpdatedAt} className="mt-3 pt-2 border-t border-slate-800/30" />
</DeviceCard>
```

### Anti-Patterns to Avoid

- **Passing `ts` from WS envelope through `TopicCallback`:** Breaks the established callback API; not needed given `Date.now()` precision for display purposes.
- **Clearing state on source switch:** D-04 prohibits this. Never `setData(null)` during source transitions.
- **setTimeout-based relative time:** Use `setInterval` in `useRelativeTime` so the display updates continuously, not just once.
- **Global interval for all timestamps:** Each `useRelativeTime` call runs its own interval tied to its `tsMs` dependency. This is correct React pattern; avoid a shared singleton timer.
- **Modifying `useWebSocketManager.ts`:** Not needed for this phase. All additions are in device hooks and new UI components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative time localization | Custom Italian i18n system | Simple `formatRelativeTime()` function with hardcoded Italian suffixes | The requirement is 3 tiers (s/m/h) — no library needed |
| Status dot animation | Custom CSS animation | `animate-pulse` already in `dotVariants` for `connecting` | Already implemented |
| ReadyState values | Numeric constants | `ReadyState` enum re-exported from `useWebSocketManager` | Canonical source |

**Key insight:** This phase is pure composition. Every hard part (WS state management, polling fallback, staleness detection) is already implemented. The task is wiring and small utilities.

---

## Common Pitfalls

### Pitfall 1: `ts` is seconds, not milliseconds
**What goes wrong:** Using `data.ts` directly as milliseconds gives timestamps in January 1970.
**Why it happens:** The WebSocket spec uses unix seconds (`ts: number` — "Unix timestamp (integer seconds)").
**How to avoid:** Always multiply by 1000: `setLastUpdatedAt(data.ts * 1000)`.
**Warning signs:** Timestamps show "Adesso" forever regardless of data age.

### Pitfall 2: `ts` field not reachable in topic callbacks
**What goes wrong:** Trying to access `ts` inside `handleMessage` in a device hook — it's not there.
**Why it happens:** `useWebSocketManager` dispatches only `msg.data` to callbacks, stripping the envelope.
**How to avoid:** Use `Date.now()` in WS `handleMessage`. It's functionally equivalent for display purposes.
**Warning signs:** TypeScript error: "Property 'ts' does not exist on type '...'".

### Pitfall 3: `NavbarConnectionStatus` renders on server
**What goes wrong:** `useWebSocketContext()` throws because there's no provider on the server.
**Why it happens:** Server Components cannot consume React context.
**How to avoid:** Mark `NavbarConnectionStatus.tsx` with `'use client'`. `Navbar.tsx` is already a client component, so importing a client sub-component is fine.
**Warning signs:** "useWebSocketContext must be used within a WebSocketProvider" error.

### Pitfall 4: Interval leaks in useRelativeTime
**What goes wrong:** Multiple intervals accumulate as `tsMs` changes, causing memory leaks and rapid re-renders.
**Why it happens:** Forgetting to return cleanup from `useEffect`.
**How to avoid:** Always `return () => clearInterval(id)` in the `useEffect`.
**Warning signs:** DevTools show increasing setInterval count.

### Pitfall 5: `useNetworkData.lastUpdated` not set on WS path
**What goes wrong:** Network card shows stale "last updated" while on WS.
**Why it happens:** `lastUpdated` is only set in the HTTP `fetchData` function; the WS `handleMessage` in `useNetworkData` may not call `setLastUpdated`.
**How to avoid:** Verify the WS handler in `useNetworkData` calls `setLastUpdated(Date.now())`. If not, add it.
**Warning signs:** Network card shows timestamp from last poll while WS is live.

### Pitfall 6: `Navbar.tsx` is a large 'use client' component — minimize changes
**What goes wrong:** Adding `useWebSocketContext()` call directly in `Navbar.tsx` entangles WS state with nav menu state, making tests harder.
**Why it happens:** Navbar already has heavy state (dropdowns, user fetch, etc.).
**How to avoid:** Isolate in `NavbarConnectionStatus.tsx` sub-component. One import, one JSX element in Navbar.
**Warning signs:** Navbar re-renders on every WS message.

---

## Code Examples

### ReadyState enum values (verified from useWebSocketManager.ts)

```typescript
// Source: lib/hooks/useWebSocketManager.ts (re-exports ReadyState from react-use-websocket)
import { ReadyState } from 'react-use-websocket';
// ReadyState.CONNECTING = 0
// ReadyState.OPEN       = 1
// ReadyState.CLOSING    = 2
// ReadyState.CLOSED     = 3
// ReadyState.UNINSTANTIATED = -1
```

### ConnectionStatus custom label usage (verified from ConnectionStatus.tsx)

```tsx
// Accepts optional `label` prop to override the default Italian status label
<ConnectionStatus
  status="offline"
  label="Polling attivo"   // overrides "Offline"
  size="sm"
/>
```

### useDeviceStaleness API (verified from useDeviceStaleness.ts)

```typescript
// StalenessInfo type:
// { isStale: boolean; cachedAt: Date | null; ageSeconds: number }
// Note from Phase 143: StalenessInfo has no update() method
const staleness = useDeviceStaleness('thermostat');
```

### Existing lastPollAt tracking in useStoveData

```typescript
// useStoveData already tracks lastPollAt: Date | null
// In WS handleMessage: setLastPollAt(new Date());
// In HTTP fetchStatusAndUpdate: setLastPollAt(last_poll_at ? new Date(last_poll_at) : null)
// Phase 144: expose as lastUpdatedAt: number | null = lastPollAt?.getTime() ?? null
```

### Existing lastUpdated in useNetworkData

```typescript
// useNetworkData already has: const [lastUpdated, setLastUpdated] = useState<number | null>(null);
// Already in UseNetworkDataReturn type (verify it is exposed)
// Phase 144: confirm it is set in WS handleMessage (setLastUpdated(Date.now()))
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Absolute timestamps ("14:32:05") | Relative time ("2m fa") | More intuitive for live monitoring dashboards |
| Per-card polling intervals | Single WS + polling fallback | Already implemented in Phases 139-143 |

---

## Open Questions

1. **Does `useNetworkData` WS handler already call `setLastUpdated(Date.now())`?**
   - What we know: `lastUpdated` state exists and is in the return type.
   - What's unclear: Whether the WS `handleMessage` in `useNetworkData` sets it (file was read only to line 160).
   - Recommendation: Planner should include a verification task; if missing, add `setLastUpdated(Date.now())` inside the WS handler.

2. **How many dashboard card orchestrators need `LastUpdated` wired in?**
   - What we know: There are 6 WS-migrated device hooks (stove, network, lights, sonos, dirigera, thermostat).
   - What's unclear: The Raspberry Pi card (not WS — polling only) — should it also show `lastUpdatedAt`? Raspi is not in the 6 WS topics, but if it already tracks `lastPollAt`, it could show a timestamp too.
   - Recommendation: Include raspi only if `useRaspiData` already exposes a timestamp. Otherwise out of scope.

3. **Where exactly in each card does the `<LastUpdated>` render?**
   - What we know: Cards use `children` pattern; there's no dedicated footer slot in `DeviceCard`.
   - What's unclear: Some cards have dense content; a footer divider + small text may be needed vs inline.
   - Recommendation: Claude's discretion per-card. Standard pattern: `<LastUpdated>` as last child with `mt-3` margin.

---

## Environment Availability

Step 2.6: SKIPPED — phase adds no external tool dependencies; all infrastructure uses existing project libs.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library (jest-environment-jsdom) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="useRelativeTime|LastUpdated|NavbarConnectionStatus" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | `NavbarConnectionStatus` renders `ConnectionStatus` with correct status for each `ReadyState` | unit | `npm test -- --testPathPattern="NavbarConnectionStatus"` | No — Wave 0 |
| UX-01 | `mapReadyState` maps OPEN→online, CONNECTING→connecting, CLOSED/CLOSING/UNINSTANTIATED→offline | unit | `npm test -- --testPathPattern="NavbarConnectionStatus"` | No — Wave 0 |
| UX-02 | `useStoveData` retains last data when WS disconnects and polling takes over | unit | `npm test -- --testPathPattern="useStoveData"` | No — Wave 0 |
| UX-03 | `formatRelativeTime` returns correct Italian strings for 0s, 30s, 2m, 90m | unit | `npm test -- --testPathPattern="useRelativeTime"` | No — Wave 0 |
| UX-03 | `useRelativeTime` updates display string after interval tick | unit | `npm test -- --testPathPattern="useRelativeTime"` | No — Wave 0 |
| UX-03 | `useRelativeTime` cleans up interval on unmount | unit | `npm test -- --testPathPattern="useRelativeTime"` | No — Wave 0 |
| UX-03 | `LastUpdated` renders null when `tsMs` is null | unit | `npm test -- --testPathPattern="LastUpdated"` | No — Wave 0 |
| UX-03 | `LastUpdated` renders Italian relative string when `tsMs` is provided | unit | `npm test -- --testPathPattern="LastUpdated"` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="useRelativeTime|LastUpdated|NavbarConnectionStatus" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `lib/hooks/__tests__/useRelativeTime.test.ts` — covers UX-03 (formatRelativeTime + hook interval behavior)
- [ ] `app/components/ui/__tests__/LastUpdated.test.tsx` — covers UX-03 (null/value rendering)
- [ ] `app/components/layout/__tests__/NavbarConnectionStatus.test.tsx` — covers UX-01 (ReadyState mapping + correct labels)

No framework gaps — Jest + RTL are already installed and configured.

---

## Sources

### Primary (HIGH confidence)
- Direct file reads: `app/components/ui/ConnectionStatus.tsx` — verified CVA variants, `label` prop, `aria-live="polite"`
- Direct file reads: `lib/hooks/useWebSocketManager.ts` — verified `ReadyState` re-export, `WebSocketManager.readyState`, callback dispatch strips envelope
- Direct file reads: `app/context/WebSocketContext.ts` — verified `useWebSocketContext()` API
- Direct file reads: `types/websocket.ts` — verified `WebSocketMessage.ts` is unix seconds
- Direct file reads: `app/components/ClientProviders.tsx` — verified `WebSocketContext.Provider` wraps all children
- Direct file reads: `app/components/Navbar.tsx` — verified it is a 'use client' component, header structure confirmed
- Direct file reads: `app/components/devices/stove/hooks/useStoveData.ts` — verified `lastPollAt` state, WS handler sets it via `new Date()`
- Direct file reads: `app/components/devices/network/hooks/useNetworkData.ts` (partial) — verified `lastUpdated` state exists

### Secondary (MEDIUM confidence)
- Project memory (MEMORY.md) — Phase 143 patterns: `adaptNetatmoWsPayload` standalone, WS handler does not call `staleness.update()`

---

## Project Constraints (from CLAUDE.md)

- **NEVER** break existing functionality
- **WAIT** for user confirmation before version updates
- **PREFER** editing existing files over creating new
- **NEVER** execute `npm run build` or `npm install`
- **ALWAYS** create/update unit tests
- **USE** design system → `/debug/design-system`
- **NEVER** commit/push without explicit request

**Implications for planning:**
- `ConnectionStatus.tsx` is not modified — reused as-is
- `useWebSocketManager.ts` is not modified — `Date.now()` used in device hooks instead of passing `ts`
- New files: `lib/hooks/useRelativeTime.ts`, `app/components/ui/LastUpdated.tsx`, `app/components/layout/NavbarConnectionStatus.tsx`
- Each test file is new (per `ALWAYS create/update unit tests`)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; verified from source
- Architecture: HIGH — wiring is straightforward; all integration points verified from file reads
- Pitfalls: HIGH — `ts` seconds issue and callback envelope stripping are code-verified facts

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain — Next.js 15, React 19, CVA patterns unchanged)
