---
id: 260505-o8n
title: Home WS-primary coverage — fix Raspi polling suppression
status: complete
date: 2026-05-05
---

# 260505-o8n — Home WebSocket coverage / Raspi fix

## Audit result

The dashboard home (`app/components/DashboardCards.tsx`) renders 10 cards. After auditing every data hook against the WebSocket topic list in `docs/api/websocket.md`, only **one** real gap remained — every other gap was constrained server-side.

| Card | Hook | WS topic | Polling fallback only when WS down |
|------|------|----------|-------------------------------------|
| Stufa | useStoveData | thermorossi | ✅ |
| Termostato | useThermostatData | netatmo | ✅ |
| Luci | useLightsData | hue | ✅ |
| Sonos | useSonosData | sonos | ✅ |
| DIRIGERA | useDirigeraData | dirigera | ✅ |
| Rete | useNetworkData | fritzbox | ✅ |
| Tuya | useTuyaData | tuya | ✅ |
| **Raspi** | **useRaspiData** | **raspi** | **❌ → ✅ (this task)** |
| Camera | useCameraData | — (REST only) | n/a |
| Meteo | useWeatherSummary | — (external Open-Meteo) | n/a |

### Camera + Netatmo group — server-side limitation

User asked to verify whether the camera card could ride the existing `netatmo` WS topic (Netatmo "security camera" lives in the same Netatmo product family as the thermostat).

The HA proxy `netatmo` WS topic schema is energy-only:

```typescript
interface NetatmoPayload {
  rooms: NetatmoRoom[];           // therm_measured_temperature, therm_setpoint_*, etc.
  data_freshness: "LIVE" | "STALE";
}
```

There is **no camera/security data on the `netatmo` topic**, and there is **no `camera` topic at all** in the published list (`fritzbox, dirigera, netatmo, thermorossi, tuya, hue, sonos, raspi, scheduler, sonos_transport, sonos_volume, sonos_topology, automations`). Camera state is REST-only via `GET /api/v1/netatmo/camera/status`, served from a server-side homedata cache that itself refreshes only every 5 minutes.

Migrating Camera (and Weather) to WebSocket therefore requires a server-side change on the HA proxy (publish a `camera` topic, push state changes from the homedata cache). That is a separate, larger task — out of scope for `/gsd-quick`.

## Changes

### `app/components/devices/raspi/hooks/useRaspiData.ts`

```diff
- // Raspi is not in HA proxy WS topics — always poll regardless of WS state
+ // Polling fallback: suppressed when WS is OPEN (raspi topic delivers live snapshot + events).
  useAdaptivePolling({
    callback: fetchData,
-   interval,
+   interval: isWsConnected ? null : interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });
```

The `useAdaptivePolling` contract documents `interval: null` as "polling paused" (`lib/hooks/useAdaptivePolling.ts:18-20`). The stale comment claimed Raspi wasn't a WS topic, which contradicted both `docs/api/websocket.md` (publishes `raspi`) and the hook's own existing `subscribe('raspi', ...)` call.

### `app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts`

Replaced the test asserting "polling stays at 60000ms when WS is OPEN" (it was locking in the bug) with two tests reflecting the correct behavior:
- `suppresses polling when WS is OPEN (interval=null)`
- `polls at 60000ms when WS is CLOSED (fallback)`

## Verification

```
npm test -- app/components/devices/raspi/hooks/__tests__/useRaspiData.test.ts
  Tests: 16 passed, 16 total

npx tsc --noEmit
  (clean — 0 errors)
```

## Out of scope

- **Camera + Weather**: need server-side WS topic on the HA proxy (`camera` and/or `weather`). Recommend a follow-up phase that adds those topics and migrates `useCameraData` / `useWeatherSummary` to WS-primary + REST-fallback (same pattern as the other 8 hooks).
- The other 7 hooks: already correctly WS-primary + suppressed polling fallback per v17.0 milestone — no changes needed.

## Commits

- `feat(260505-o8n): suppress Raspi REST polling while WS is OPEN` (b8196c34)
- `docs(quick-260505-o8n): home WS audit + Raspi polling-suppression fix` (4b04283a)
- `feat(260505-o8n): WS-primary fetch for Sonos home card` (34299f63)

## Follow-up — Sonos card was still polling REST after the Raspi fix

After the Raspi commit, the user reported still seeing `GET /api/v1/sonos/devices`
every minute on the home dashboard. Root cause: the home `SonosCard`
(`app/components/EmberGlass/cards/SonosCard.tsx`) consumes `useSonosFullData`,
**not** the already-WS-aware `useSonosData`. `useSonosFullData` was polling all
~5+ Sonos endpoints per zone every 60 s regardless of WS state.

Fix in the same task: made `useSonosFullData` WS-aware.

- Subscribes to three Sonos topics on the HA proxy:
  - `sonos` → `speakers` + `groups` (snapshot on subscribe)
  - `sonos_transport` → playback per `group_id` (push-only)
  - `sonos_volume` → volume per speaker or zone (push-only)
- `useAdaptivePolling` interval becomes `null` when WS is OPEN — full polling
  fallback resumes on disconnect.
- One-shot REST fetch on mount still runs to populate EQ / home-theater /
  play-mode / sleep-timer (these fields are not on any WS topic) and to seed
  initial playback / volumes before the first push arrives.
- Added `sonos_transport` and `sonos_volume` to the `Topic` union in
  `types/websocket.ts` so `subscribe()` typechecks.
- `secondsToHms()` adapter converts WS `position`/`duration` (numbers) to the
  `HH:MM:SS` strings the rest of the app already expects.

Tests: 22/22 in `useSonosFullData.test.ts` (12 existing + 10 new for WS
subscriptions, polling suppression, snapshot/transport/volume handlers,
unmount cleanup). 65/65 across the full Sonos hook test suite. `tsc --noEmit`
clean.
