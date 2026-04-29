# Phase 178: Per-Device Modal Sheets - Research

**Researched:** 2026-04-29
**Domain:** React 19 / Next.js 15.5 client-side device-control sheet bodies (no new APIs, no new deps)
**Confidence:** HIGH (codebase fully verified by direct file reads)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**File layout & namespace**
- **D-01:** All new sheet body files live under `app/components/EmberGlass/sheets/` — sibling subfolder to `app/components/EmberGlass/cards/` (Phase 177 D-01). Concrete layout:
  - `sheets/StoveSheet.tsx`
  - `sheets/ClimateSheet.tsx`
  - `sheets/LightsSheet.tsx`
  - `sheets/SonosSheet.tsx`
  - `sheets/PlugsSheet.tsx`
  - `sheets/primitives/{SheetRow,Stepper,Slider,RadialDial,SheetBtn,QuickActionButton}.tsx`
  - `sheets/index.ts` — barrel for 5 bodies + 6 sub-primitives. Re-exported from `app/components/EmberGlass/index.ts`.
- **D-02:** Inline-style + `var(--token)` convention (Phase 174 D-12 / 175 D-08 / 176 D-23 / 177 D-02) is mandatory. **No Tailwind for visual values.**
- **D-03:** `<SheetPlaceholderBody>` is NOT deleted in this phase. Still serves CameraCard, NetworkCard, DirigeraCard.
- **D-04:** The Phase 175 `<Sheet>` primitive is consumed unmodified — same `{ open, onClose, title }` API. Each new `<*Sheet>` is a **body-only component** that renders contents and assumes the calling card owns `open` state.

**Sheet body components (D-05..D-09):** StoveSheet, ClimateSheet, LightsSheet, SonosSheet, PlugsSheet — verbatim shape from bundle `sheets.jsx:69-465`. See full per-component specs in CONTEXT D-05..D-09 (StoveSheet drops setpoint slider; ClimateSheet uses new `useThermostatCommands`; LightsSheet uses scene name match; SonosSheet uses `Promise.allSettled` for master action; PlugsSheet is Tuya-only).

**Sheet sub-primitives (D-10..D-15):** `<SheetRow>`, `<Stepper>`, `<Slider>`, `<RadialDial>`, `<SheetBtn>`, `<QuickActionButton>` — bundle-verbatim. Slider ships even though unused this phase (~30 LOC; Phase 179 consumes).

**New commands hook (D-16):** `useThermostatCommands` at `app/components/devices/thermostat/hooks/useThermostatCommands.ts` exposes `setRoomSetpoint(roomId, target)`, `setHomeMode(mode)`, `setRoomMode(roomId, mode)`. Uses `useRetryableCommand`.

**D-17:** No `useDirigeraCommands` is added. Dirigera proxy is read-only.

**Italian copy (D-18..D-23):** Frozen sheet titles + per-sheet copy (see UI-SPEC §Copywriting Contract). Use middle-dot `·` (U+00B7).

**Press behavior (D-24..D-25):**
- Sheet sub-primitives that are interactive are pure clickable buttons. They do NOT wrap in `<Pressable>`. Press feedback is the regular `:active` browser behavior.
- `<Sheet>` primitive lives at z-index 200/201; sheet bodies stay below. No new z-index introductions.

**Loading + error inside sheet bodies (D-26..D-28):**
- D-26: First-load skeleton — single full-width skeleton block, ~360px StoveSheet / ~480px ClimateSheet / ~520px others.
- D-27: Error state — centered 32×32 lucide `<TriangleAlert>` + 14px `Non raggiungibile. Riprova più tardi.` + 8px-margin secondary 12px `{error.message}` (only when `error instanceof Error`). No retry button.
- D-28: Optimistic UI for toggles + steppers — `InlineToggle` flips immediately; underlying command runs; if it fails, the toggle reverts on next data tick.

**Tests (D-29..D-32):**
- D-29: Jest unit tests under `app/components/EmberGlass/sheets/__tests__/` — one spec per sheet body + one per sub-primitive + `findSceneByName` helper test.
- D-30: Playwright extension — 5 new `test.describe` blocks added to existing dashboard spec.
- D-31: NO new Playwright spec file. Filename, beforeAll setup (Auth0, VersionEnforcer dismissal), afterAll cleanup all reused.
- D-32: Existing `useThermostatData` jest spec is untouched. New `useThermostatCommands` gets its own spec.

**React Compiler discipline (D-33..D-34):**
- D-33: NO `useMemo` / `useCallback` in any sheet body or sub-primitive. Plan must include `npx react-compiler-healthcheck` step.
- D-34: Inline event handler functions explicitly allowed.

**Card-level edits (D-35..D-36):** Single-line swap matrix — Stove/Climate/Lights/Sonos/Tuya cards swap `<SheetPlaceholderBody>` → `<*Sheet />`. DirigeraCard, CameraCard, NetworkCard UNCHANGED. WeatherCard / RaspiCard UNCHANGED (no Sheet).

### Claude's Discretion

- Whether `<SonosSheet>` master button uses `Promise.allSettled` (recommended) or `Promise.all`. UI-SPEC locks `Promise.allSettled`.
- Whether `<RadialDial>` exposes a touch/drag gesture in a follow-up phase. Out of scope here.
- Whether `<Slider>` ships in this phase or is deferred. **Recommend ship now.**
- Whether `findSceneByName` lives under `sheets/lib/` or under `app/components/devices/lights/utils/`. **Recommend `sheets/lib/`**.
- Whether `useThermostatCommands` lives at `app/components/devices/thermostat/hooks/` (recommended) or co-located in `EmberGlass/sheets/`.
- Whether to add `data-testid` to every sub-primitive button or only to test-meaningful spots. **Recommend yes.**
- Whether the SonosSheet volume slider is per-group (group's coordinator speaker) or aggregates per-speaker. **Recommend per-group via coordinator.**

### Deferred Ideas (OUT OF SCOPE)

- **CameraSheet body, NetworkSheet body, DirigeraSheet body** — no SHEET-* requirement in v20.0. Cards keep placeholder.
- **Stove "Temperatura obiettivo" slider** — Thermorossi proxy has no setpoint endpoint.
- **Stove pellet percentage** — bundle shows `Pellet 62%`. Plan agent verifies whether `useStoveData` exposes `pelletPercent` (RESEARCH below: it does NOT).
- **`<Slider>` consumption** — Phase 178 ships but doesn't use it (Phase 179 Rooms tab consumes for brightness).
- **`<BigSlider>` primitive** — Phase 179.
- **Long-press / swipe-to-dismiss gestures** on Sheet — Phase 175 D-14 locked tap-only.
- **Reduced-motion overrides** — Phase 175 D-15 deferred.
- **Drag/touch on `<RadialDial>` arc** — only ± buttons.
- **Hue scene creation UI** — sheet only activates existing scenes.
- **Sonos volume per-speaker** — Phase 178 uses group's coordinator.
- **Cleanup phase to delete `<SheetPlaceholderBody>` + legacy big cards** — fires once Camera/Network/Dirigera ship.
- **Design System Reference v2 entry for new sheets** — Phase 182.
- **Web Vitals telemetry on sheet open/close** — out of v20.0 scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **SHEET-02** | StoveSheet — large temp readout, target/fan/power steppers + sliders, Orari/Manutenzione buttons, large Accendi/Spegni primary button | Hooks `useStoveData` + `useStoveCommands` exist with `handleIgnite`, `handleShutdown`, `handlePowerChange({ target: { value } })`, `handleFanChange(...)`. Field gaps (no `temp`, no `target`, no `pelletPercent`) flagged below. |
| **SHEET-03** | ClimateSheet — zone chips + radial dial + mode picker + per-zone toggle | `useThermostatData` exposes `topology` + `status`. New `useThermostatCommands` wraps `/api/v1/netatmo/setroomthermpoint` (POST `{home_id, room_id, mode: 'manual', temp}`) and `/api/v1/netatmo/setthermmode` (POST `{home_id, mode: 'schedule'\|'away'\|'hg'}`). |
| **SHEET-04** | LightsSheet — accese count + Tutte on/off + 4 scene buttons + per-room grouped list | `useLightsData` returns `lights[]`, `groups[]`, `scenes[]`. `useLightsCommands` exposes `handleAllLightsToggle(on)`, `handleSceneActivate(sceneId, groupId)`, `handleRoomToggle(groupId, on)`. Field mapping required (lights→rooms via groups, see below). |
| **SHEET-05** | SonosSheet — group list + volume slider + Riproduci/Pausa ovunque master | `useSonosFullData` returns `data.zones[]` + `data.playback{}` + `data.volumes{}`. `useSonosCommands` has `handlePlay(groupId)`, `handlePause(groupId)`, `handleSetVolume(uid, volume)` AND `handleSetZoneVolume(groupId, volume)` (group-level, simpler). |
| **SHEET-06** | PlugsSheet — accese + total power summary + per-plug list with toggles | `useTuyaData` returns `plugs[]` (TuyaPlug with `device_id, switch_on, power_w, custom_name, device_type`). `useTuyaCommands.togglePlug(deviceId, currentState)`. NO `room` field on plug — handled below. |

</phase_requirements>

---

## Summary

Phase 178 is a **client-side composition phase** — five sheet body components built from existing data + command hooks, six new visual sub-primitives, and one new commands hook (`useThermostatCommands`) that wraps two **already-existing** API routes. No new API routes, no new third-party dependencies, no schema changes.

The bundle `sheets.jsx:1-597` is the visual source of truth. Every CSS rule is lifted verbatim. The major risk surface is the **field-name mismatch between bundle assumptions and the live hooks** — bundle assumes `s.temp`, `s.target`, `s.pelletPercent` on the stove, `light.room`/`light.groupId` on lights, `plug.name`/`plug.room`/`plug.on`/`plug.power` on plugs, `g.coordinator.uid` on Sonos groups, `zone.kind`/`zone.on` on thermostat — none of which match the actual hook return shapes verified in this research.

**Primary recommendation:** Each sheet body must include a small **bundle→hook adapter** at the top of the component (or shared selector functions) that maps live hook fields onto the bundle's prop shapes. This is a known pattern in Phase 177 — `SonosCard.tsx:41-50` does exactly this for `coordinator_name → name`, `transport_state === 'PLAYING' → playing`, `title → track`. The planner should NOT assume the bundle shape exists on the hook; instead, lift the field-mapping logic from existing cards (Stove/Climate/Lights/Sonos/Tuya cards) wherever the same mapping was already solved.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sheet body presentation (5 bodies + 6 sub-primitives) | Browser / Client | — | Pure presentational React 19 components; consume existing hooks; `'use client'`. |
| Sheet body data fetch | Browser / Client | API / Backend | Self-fetched via existing `useStoveData`/`useThermostatData`/`useLightsData`/`useSonosFullData`/`useTuyaData` hooks (already polling 60s + WS-subscribed). NO new server fetches. |
| `useThermostatCommands` (new hook) | Browser / Client | API / Backend | Wraps existing routes `/api/v1/netatmo/setroomthermpoint` and `/api/v1/netatmo/setthermmode`. Authentication handled by `withAuthAndErrorHandler` server-side. |
| Optimistic UI for toggles / steppers | Browser / Client | — | InlineToggle flips immediately; `useRetryableCommand` infrastructure handles retry/dedup. Reverts on next data tick if persistent failure. |
| Setpoint debounce (500ms) and volume debounce (250ms) | Browser / Client | — | `useDebounce` hook from `app/hooks/useDebounce.ts` — local state. |
| Scene name → scene id resolution | Browser / Client | — | `findSceneByName(catalog, name)` runs in component; consumes `useLightsData.scenes[]`. |
| Sheet open state (already wired Phase 177) | Browser / Client | — | Each card owns `useState<boolean>(false)`. Sheet body component is body-only — does not own state. |
| Stove "Orari" / "Manutenzione" navigation | Browser / Client | — | `next/navigation` `useRouter().push('/stove/scheduler' \| '/stove/maintenance')` — existing routes. UI-SPEC locks `router.push` only (no `onClose()` first). |
| Tests (Jest + Playwright) | Browser / Client | — | All new tests run client-side. Playwright extends existing `tests/smoke/dashboard-glass-cards.spec.ts` (NOT `tests/playwright/...` — see Pitfall below). |

---

## Project Constraints (from CLAUDE.md)

These directives apply to the entire phase. Plan agent must verify each plan honors them.

1. **NEVER break existing functionality.** All 5 affected cards (Stove/Climate/Lights/Sonos/Tuya) must continue rendering; the swap is one line per card.
2. **WAIT for user confirmation before version updates.** Phase 178 introduces zero new dependencies. No `npm install` runs.
3. **PREFER editing existing files over creating new.** Sheet bodies are unavoidable new files (D-01); however the per-card edit is single-line each (D-35) — no card rewrites.
4. **NEVER execute `npm run build` or `npm install`.** Plan-task `<verify>` blocks must use only `npx tsc --noEmit` for type checks, scoped Jest subsets for tests, and `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts` for E2E.
5. **ALWAYS create/update unit tests.** D-29 mandates Jest specs for every new file. Plan-task contracts must list `__tests__/` test paths in `<files>`.
6. **USE design system → `/debug/design-system`.** New visual surfaces ship audit-tagged inline literals (UI-SPEC AUDIT-EXCEPTION list).
7. **NEVER commit/push without explicit request.** Each plan task commits locally only.
8. **USE scoped test subsets in verification — NEVER `npm test` alone from agents or PLAN.md `<verify><automated>` blocks.** Use `npm test -- <specific paths>` or `test:changed`/`test:components`/`test:quick`. Full suite reserved for release gates.

---

## Standard Stack

### Core (already in package.json — verified `package.json` deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` | 19.x | Sheet body components | Phase 174..177 baseline `[VERIFIED: package.json]` |
| `next` | 15.5.x | Router (StoveSheet navigation) | Project-wide `[VERIFIED: package.json]` |
| `@radix-ui/react-dialog` | ^1.1.14 | Sheet primitive (consumed via Phase 175 `<Sheet>`) | Phase 175 D-04 / 175-RESEARCH `[VERIFIED: package.json]` |
| `@radix-ui/react-visually-hidden` | ^1.2.4 | Sheet a11y title fallback (already inside `<Sheet>`) | Phase 175 carry-forward `[VERIFIED: package.json]` |
| `lucide-react` | latest | Icons (Calendar, AlertTriangle, TriangleAlert, Volume2, Play, Pause, Power, Music, Lightbulb, Plug, Minus, Plus) | Phase 174..177 baseline `[VERIFIED: package.json]` |
| `@auth0/nextjs-auth0` | v4 | Sheet bodies use existing `useUser()` (StoveSheet only) | Phase 174 baseline `[VERIFIED: package.json]` |
| `jest` + `@testing-library/react` | existing | Unit specs | Project-wide `[VERIFIED: package.json scripts]` |
| `@playwright/test` | existing | E2E spec extension | Project-wide `[VERIFIED: package.json scripts]` |

### Supporting

| Library / Module | Purpose | When to Use |
|---|---|---|
| `useDebounce` (`app/hooks/useDebounce.ts`) | 500ms setpoint debounce (ClimateSheet); 250ms volume debounce (SonosSheet) | Inside ClimateSheet + SonosSheet local state. `[VERIFIED: app/hooks/useDebounce.ts:26]` Signature: `useDebounce<T>(value: T, delay: number = 300): T`. |
| `useRetryableCommand` (`lib/hooks/useRetryableCommand.ts`) | `useThermostatCommands` integration | NEW commands hook only. Pattern: `const cmd = useRetryableCommand({ device: 'netatmo', action: 'setRoomSetpoint' })` then `cmd.execute(url, fetchOptions)`. `[VERIFIED: lib/hooks/useRetryableCommand.ts]` |
| `next/navigation` `useRouter()` | StoveSheet "Orari"/"Manutenzione" buttons | Inside StoveSheet only. `router.push('/stove/scheduler' \| '/stove/maintenance')`. |

### Alternatives Considered

| Instead of | Could Use | Why standard wins |
|------------|-----------|-------------------|
| `useThermostatCommands` (new) | Inline `fetch` in ClimateSheet | Convention parity with `useStoveCommands`/`useLightsCommands`/`useSonosCommands`/`useTuyaCommands`. CONTEXT D-16 locks. |
| `Promise.all` for SonosSheet master | `Promise.allSettled` | `allSettled` survives partial failures — memory v16.0 batch pattern. CONTEXT Specifics + UI-SPEC Discretion locks `allSettled`. |
| Custom `<Slider>` for SonosSheet volume | Plain `<input type="range" accentColor="#b080ff">` | Bundle `sheets.jsx:374-380` uses native `<input>`. Locked. `<Slider>` ships unused for Phase 179. |
| Pass `onClose` prop to StoveSheet for nav | `router.push` only (auto-unmount on route change) | UI-SPEC §"Sheet exit animation timing" locks `router.push` only — avoids prop-passing through body-only component. Acceptable hard-cut UX cost on navigation. |

**No installation needed.** All dependencies present.

**Version verification:** No new dependencies introduced. Existing versions are locked by `package-lock.json`. Per CLAUDE.md rule 4, `npm install` is forbidden — no version bumps anyway.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard page (`app/page.tsx`)                                    │
│      ↓                                                              │
│  DashboardCards (`app/components/EmberGlass/.../DashboardCards.tsx`)│
│      ↓                                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Per-card (Stove/Climate/Lights/Sonos/Tuya):                │    │
│  │   useState<boolean>(false) for sheet open                  │    │
│  │   ↓                                                        │    │
│  │   <GlassCard tone={...} onOpen={...}>{card body}</GlassCard│    │
│  │   <Sheet open onClose title>                               │    │
│  │     <*Sheet />  ← Phase 178 swap                           │    │
│  │   </Sheet>                                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ <*Sheet> body (Phase 178 — new)                            │    │
│  │   self-fetches via existing hook(s):                       │    │
│  │     useStoveData() / useStoveCommands()                    │    │
│  │     useThermostatData() / useThermostatCommands() (NEW)    │    │
│  │     useLightsData() / useLightsCommands()                  │    │
│  │     useSonosFullData() / useSonosCommands()                │    │
│  │     useTuyaData() / useTuyaCommands()                      │    │
│  │                                                            │    │
│  │   composes sub-primitives:                                 │    │
│  │     <SheetRow>, <Stepper>, <Slider>, <RadialDial>,         │    │
│  │     <SheetBtn>, <QuickActionButton>                        │    │
│  │   + reuses Phase 177 <InlineToggle>, <PlayingBars>         │    │
│  │   + reuses Phase 176 <FlameViz> (StoveSheet only)          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                      │
│  Commands fire to existing API routes:                              │
│    POST /api/v1/thermorossi/commands/{ignit,shutdown}               │
│    POST /api/v1/thermorossi/settings/{fan-level,power}              │
│    POST /api/v1/netatmo/setroomthermpoint                           │
│    POST /api/v1/netatmo/setthermmode                                │
│    PUT  /api/v1/hue/groups/{id}/action                              │
│    POST /api/v1/hue/groups/{groupId}/scenes/{sceneId}               │
│    POST /api/v1/sonos/zones/{groupId}/{play\|pause}                 │
│    PUT  /api/v1/sonos/speakers/{uid}/volume   (or zones/{id}/volume)│
│    POST /api/tuya/plugs/{deviceId}/state                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
app/
├── components/
│   ├── EmberGlass/
│   │   ├── sheets/                          # NEW (D-01)
│   │   │   ├── StoveSheet.tsx               # NEW
│   │   │   ├── ClimateSheet.tsx             # NEW
│   │   │   ├── LightsSheet.tsx              # NEW
│   │   │   ├── SonosSheet.tsx               # NEW
│   │   │   ├── PlugsSheet.tsx               # NEW
│   │   │   ├── primitives/                  # NEW
│   │   │   │   ├── SheetRow.tsx
│   │   │   │   ├── Stepper.tsx
│   │   │   │   ├── Slider.tsx               # ships unused (Phase 179)
│   │   │   │   ├── RadialDial.tsx
│   │   │   │   ├── SheetBtn.tsx
│   │   │   │   ├── QuickActionButton.tsx
│   │   │   │   └── __tests__/               # 6 jest specs
│   │   │   ├── lib/                         # NEW
│   │   │   │   ├── findSceneByName.ts
│   │   │   │   └── __tests__/findSceneByName.test.ts
│   │   │   ├── __tests__/                   # 5 sheet body specs
│   │   │   └── index.ts                     # barrel
│   │   ├── cards/
│   │   │   ├── StoveCard.tsx                # EDIT (1-line swap)
│   │   │   ├── ClimateCard.tsx              # EDIT (1-line swap)
│   │   │   ├── LightsCard.tsx               # EDIT (1-line swap)
│   │   │   ├── SonosCard.tsx                # EDIT (1-line swap)
│   │   │   └── TuyaCard.tsx                 # EDIT (1-line swap)
│   │   └── index.ts                         # EDIT (append sheets re-export)
│   └── devices/
│       └── thermostat/
│           └── hooks/
│               ├── useThermostatCommands.ts   # NEW
│               └── __tests__/useThermostatCommands.test.ts  # NEW
└── globals.css                              # EDIT (3 LOC append for [data-sheet-focusable])

tests/
└── smoke/
    └── dashboard-glass-cards.spec.ts        # EDIT (append 5 describe blocks)
```

### Pattern 1: Body-only sheet component with self-fetched hooks

**What:** Each `<*Sheet>` is a no-prop component that calls the device data hook + command hook directly. No `onClose` plumbing through props (CONTEXT D-04).

**When to use:** All 5 sheet bodies in Phase 178.

**Example (StoveSheet skeleton, simplified):**
```typescript
// Source: bundle sheets.jsx:68-129; CONTEXT D-04, D-05, D-19
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Calendar, AlertTriangle, Power } from 'lucide-react';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import { useVersion } from '@/app/context/VersionContext';
import { FlameViz } from '../FlameViz';
import { SheetRow } from './primitives/SheetRow';
import { Stepper } from './primitives/Stepper';
import { SheetBtn } from './primitives/SheetBtn';

export function StoveSheet() {
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stoveData = useStoveData({ checkVersion, userId: user?.sub });
  const cmds = useStoveCommands({ stoveData, router, user });

  // Field adapter — bundle assumes s.temp/s.target/s.pelletPercent (none exist on hook)
  const isAccesa = stoveData.isAccesa;
  const power = stoveData.powerLevel ?? 1;
  const fan = stoveData.fanLevel ?? 1;
  const needsCleaning = stoveData.needsMaintenance;

  // Loading state (D-26)
  if (stoveData.initialLoading) return <SkeletonBlock height={360} />;

  // Error state (D-27) — useStoveData reports errorCode/errorDescription, not error
  // Skip error UI if data is cached; only show on no-data path.

  return (
    <>
      {/* Hero (no temp; pellet line dropped — see Field Gaps section) */}
      <div style={{ borderRadius: 24, padding: '24px 20px', /* ... */ }}>
        <FlameViz on={isAccesa} intensity={power / 5} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, /* caps */ }}>
            {isAccesa ? 'In funzione' : 'Spenta'}
          </div>
          {/* No 54px temp display — hook does not expose temp.
              Display the canonical readout the StoveCard already uses. */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 54, /* ... */ }}>
            {power}<span style={{ fontSize: 22, opacity: 0.5 }}>/5</span>
          </div>
          {/* Footnote dropped per "Field Gaps" — no target, no pelletPercent */}
        </div>
      </div>

      <SheetRow label="Livello fiamma" value={`${power}/5`}>
        <Stepper value={power} min={1} max={5}
          onChange={(v) => void cmds.handlePowerChange({ target: { value: String(v) } })} />
      </SheetRow>

      <SheetRow label="Ventola" value={`${fan}/5`}>
        <Stepper value={fan} min={1} max={5}
          onChange={(v) => void cmds.handleFanChange({ target: { value: String(v) } })} />
      </SheetRow>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
        <SheetBtn Icon={Calendar} label="Orari"
          onClick={() => router.push('/stove/scheduler')} />
        <SheetBtn Icon={AlertTriangle} label="Manutenzione"
          onClick={() => router.push('/stove/maintenance')} />
      </div>

      <button
        disabled={needsCleaning}
        onClick={() => void (isAccesa ? cmds.handleShutdown() : cmds.handleIgnite())}
        style={{ /* ...primary action treatment per UI-SPEC */ }}>
        <Power size={18} strokeWidth={2.2} />
        {needsCleaning ? 'Manutenzione richiesta' : (isAccesa ? 'Spegni stufa' : 'Accendi stufa')}
      </button>
    </>
  );
}
```

### Pattern 2: New commands hook with `useRetryableCommand`

**What:** `useThermostatCommands` mirrors the existing pattern from `useStoveCommands`/`useLightsCommands`/`useSonosCommands`.

**When to use:** Only the new `useThermostatCommands` hook. ClimateSheet consumes it.

**Example (verified against existing ThermostatCard `handleTemperatureChange` and `handleModeChange`):**
```typescript
// Source: app/components/devices/thermostat/ThermostatCard.tsx:183-236 (existing pattern)
// New file: app/components/devices/thermostat/hooks/useThermostatCommands.ts
'use client';

import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import { NETATMO_ROUTES } from '@/lib/routes';
import type { SetRoomThermpointRequest, SetThermmodeRequest } from '@/types/netatmoProxy';

export interface UseThermostatCommandsParams {
  homeId: string;          // from useThermostatData().topology.home_id
  refetch: () => Promise<void>;
  setError?: (e: string | null) => void;
}

export interface UseThermostatCommandsReturn {
  setRoomSetpoint: (roomId: string, target: number) => Promise<void>;
  setHomeMode: (mode: SetThermmodeRequest['mode']) => Promise<void>;
  setRoomMode: (roomId: string, mode: SetRoomThermpointRequest['mode']) => Promise<void>;
  netatmoTempCmd: ReturnType<typeof useRetryableCommand>;
  netatmoModeCmd: ReturnType<typeof useRetryableCommand>;
}

export function useThermostatCommands(params: UseThermostatCommandsParams): UseThermostatCommandsReturn {
  const netatmoTempCmd = useRetryableCommand({ device: 'netatmo', action: 'setRoomSetpoint' });
  const netatmoModeCmd = useRetryableCommand({ device: 'netatmo', action: 'setHomeMode' });

  const setRoomSetpoint = async (roomId: string, target: number) => {
    const body: SetRoomThermpointRequest = {
      home_id: params.homeId,
      room_id: roomId,
      mode: 'manual',
      temp: target,
    };
    const res = await netatmoTempCmd.execute(NETATMO_ROUTES.setRoomThermpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res?.ok) await params.refetch();
  };

  const setHomeMode = async (mode: SetThermmodeRequest['mode']) => {
    const body: SetThermmodeRequest = { home_id: params.homeId, mode };
    const res = await netatmoModeCmd.execute(NETATMO_ROUTES.setThermMode, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res?.ok) await params.refetch();
  };

  // Per-room mode (currently only used to toggle off→manual).
  // Note: setRoomThermpoint mode is 'manual' | 'home' — there is NO 'off' value.
  // For "off" the standard Netatmo dance is setHomeMode('hg') (frost-guard).
  // ClimateSheet Tipo toggle: false → setRoomMode(id, 'home') (revert to schedule)
  //                          true  → setRoomMode(id, 'manual')
  const setRoomMode = async (roomId: string, mode: SetRoomThermpointRequest['mode']) => {
    const body: SetRoomThermpointRequest = { home_id: params.homeId, room_id: roomId, mode };
    const res = await netatmoTempCmd.execute(NETATMO_ROUTES.setRoomThermpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res?.ok) await params.refetch();
  };

  return { setRoomSetpoint, setHomeMode, setRoomMode, netatmoTempCmd, netatmoModeCmd };
}
```

### Pattern 3: Field-name adapter at top of sheet body

**What:** Map live hook fields to the bundle's expected names — `coordinator_name → name`, `transport_state === 'PLAYING' → playing`, etc. Pattern is already used by Phase 177 `SonosCard.tsx:41-50`.

**When to use:** Every sheet body. See "Field Gaps" section for the full mapping table.

### Pattern 4: Manual debounce → command flow

**What:** Local pending state → `useDebounce(pending, 500\|250)` → `useEffect` watches debounced → fires command.

**When to use:** ClimateSheet (RadialDial setpoint, 500ms), SonosSheet (volume slider, 250ms).

**Example (lifted from existing ThermostatCard.tsx:39-89):**
```typescript
const [pendingTarget, setPendingTarget] = useState<number>(zone.target);
const debouncedTarget = useDebounce(pendingTarget, 500);

useEffect(() => {
  if (debouncedTarget === zone.target) return;        // no change, skip
  void cmds.setRoomSetpoint(zone.id, debouncedTarget);
  // CONTEXT D-34: inline arrow OK; no useCallback needed
}, [debouncedTarget, zone.id, zone.target, cmds]);

// Reset pending on zone change to prevent cross-zone writes
useEffect(() => {
  setPendingTarget(zone.target);
}, [selectedRoomIdx, zone.target]);
```

### Pattern 5: Optimistic toggle via existing handlers

**What:** `<InlineToggle>` flips `on` immediately; the underlying command fires; failed command + retry infrastructure auto-recovers; persistent failure visibly reverts on next data tick.

**When to use:** LightsSheet per-room toggle, PlugsSheet per-plug toggle, ClimateSheet Tipo toggle.

### Anti-Patterns to Avoid

- **Wrap `<Stepper>` / `<SheetBtn>` / `<QuickActionButton>` in `<Pressable>`.** CONTEXT D-24 explicitly forbids — sheet sub-primitives are bare buttons, not glass surfaces.
- **Add `useMemo` / `useCallback` to derived data inside sheet bodies.** D-33 forbids. React Compiler 1.0 auto-memoizes.
- **Pass `onClose` from card → sheet body via prop.** D-04 forbids props on sheet body components. UI-SPEC §"Sheet exit animation timing" accepts the hard-cut UX cost.
- **Fire `npm test` (full suite) inside `<verify>` blocks.** CLAUDE.md rule 8 — use scoped scripts (`test:components`, `test:quick`, or `npm test -- <path>`).
- **Run `npm install` or `npm run build`.** CLAUDE.md rule 4. No new deps; type-check via `npx tsc --noEmit` only.
- **Create a NEW Playwright spec file.** D-31 forbids. Append 5 describe blocks to existing `tests/smoke/dashboard-glass-cards.spec.ts`.
- **Set `data-pressable-focusable="true"` on sheet sub-primitives.** That attribute is reserved for `<Pressable>`. Sheet sub-primitives use `data-sheet-focusable="true"` (UI-SPEC §"Focus-visible outlines").
- **Tailwind utility classes for visual values inside sheet bodies or sub-primitives.** D-02 forbids — bundle is inline-style.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sheet open/close + scroll lock + ESC + backdrop tap | New modal primitive | Phase 175 `<Sheet>` (`app/components/EmberGlass/Sheet.tsx`) | Already production-ready: forceMount Radix Dialog + scroll-lock with scrollY restore + tap-to-dismiss. |
| Toggle switch UI | Custom toggle component | Phase 177 `<InlineToggle>` (`app/components/EmberGlass/InlineToggle.tsx`) | Reused by ClimateSheet (Tipo), LightsSheet (per-room), PlugsSheet (per-plug). API: `<InlineToggle on color onChange>`. |
| Animated playing-bars indicator | Custom CSS animation | Phase 177 `<PlayingBars>` (`app/components/EmberGlass/PlayingBars.tsx`) | Reused by SonosSheet album-art tile when playing. |
| Animated flame visualization | New SVG/canvas | Phase 176 `<FlameViz>` (`app/components/EmberGlass/FlameViz.tsx`) | Reused by StoveSheet hero. API: `<FlameViz on intensity>`. |
| Retry / dedup / idempotency for commands | New `fetch` retry wrapper | `useRetryableCommand` (`lib/hooks/useRetryableCommand.ts`) | Phase 7.0 retry infrastructure. Used by `useThermostatCommands`. Signature: `useRetryableCommand({ device, action })` → `{ execute(url, fetchOptions), isRetrying, lastError }`. |
| Debounced input → side effect | Custom timer state | `useDebounce` (`app/hooks/useDebounce.ts`) | Used for ClimateSheet setpoint (500ms) + SonosSheet volume (250ms). Signature: `useDebounce<T>(value, delay = 300): T`. |
| Bottom-sheet z-index management | New z-index var | Phase 175 reservation (200/201) | Already locked. Phase 178 introduces zero new z-indices. |
| Sheet a11y (Title, focus trap, ESC) | Custom keyboard handler | Phase 175 `<Sheet>` already wires `<DialogPrimitive.Title>` + `<VisuallyHidden>` fallback + focus return. |
| Stove ignite/shutdown with retry | New POST + delay logic | `useStoveCommands.handleIgnite/handleShutdown` | Existing. Returns 202 + `suggested_poll_delay_s`. Already wired to retry infra. |
| Hue scene activation | New `/api/v1/hue/groups/{id}/scenes/{id}` POST | `useLightsCommands.handleSceneActivate(sceneId, groupId)` | Existing. |
| Sonos play/pause/volume | Custom POST/PUT | `useSonosCommands.handlePlay/handlePause/handleSetVolume/handleSetZoneVolume` | Existing. |
| Tuya plug toggle | Custom POST | `useTuyaCommands.togglePlug(deviceId, currentState)` | Existing. |
| Routing for "Orari"/"Manutenzione" | Custom navigation | `useRouter().push('/stove/scheduler' \| '/stove/maintenance')` | Existing pages — no new pages required. |
| Loading spinner inside sheet | New CSS spinner | Skeleton block (D-26) | Bundle pattern: single full-width skeleton. NavbarConnectionStatus (Phase 17.0) covers refresh state. |

**Key insight:** Phase 178 is almost entirely composition over invention. The only NEW logic is `useThermostatCommands` (a 80-LOC wrapper over two existing API routes) and the visual sub-primitives (verbatim from bundle).

---

## Common Pitfalls

### Pitfall 1: Bundle field assumptions don't match live hook returns

**What goes wrong:** Bundle `sheets.jsx` was written against a mock state shape (`s.temp`, `s.target`, `s.pelletPercent`, `light.room`, `light.groupId`, `plug.name`, `plug.power`, `g.coordinator.uid`, `zone.kind`, `zone.on`). The live hooks expose entirely different field names.

**Why it happens:** Bundle is from the design preview, not the implementation. Phase 177 already discovered this for cards (StoveCard A-01 deviation: dropped `°C` superscript because `power_level` is dimensionless; SonosCard mapped `coordinator_name → name`, `transport_state === 'PLAYING' → playing`).

**How to avoid:**
- For each sheet body, define a **field adapter** at the top of the component that maps live hook fields onto local variables matching the bundle's prop shape.
- See "Field Gaps" section below for the canonical mapping table.
- When a bundle field has no live equivalent (e.g., `pelletPercent`), gracefully degrade per CONTEXT D-05 / UI-SPEC fallback rules.

**Warning signs:** Bundle says `s.temp` but `useStoveData` exposes `status` (StoveState union) + `powerLevel` (1-5 integer). Bundle says `g.coordinator.uid` but `SonosZoneResponse.coordinator_uid` is a flat string. Bundle says `plug.name`/`plug.room` but `TuyaPlug.custom_name` and there is NO room field.

### Pitfall 2: `STOVE_ROUTES.scheduler` does not exist

**What goes wrong:** CONTEXT D-05 references `STOVE_ROUTES.scheduler` and `STOVE_ROUTES.maintenance` for navigation. UI-SPEC repeats this. **These do NOT exist on the exported `STOVE_ROUTES` constant.** `STOVE_ROUTES` is API-only (`status`, `ignite`, `shutdown`, `getFan`, `getPower`, `setFan`, `setPower`).

**Why it happens:** A separate `STOVE_UI_ROUTES = { main: '/stove', scheduler: '/stove/scheduler', maintenance: '/stove/maintenance', errors: '/stove/errors' }` is declared at `lib/routes.ts:14-20` but is **NOT exported** (verified by grep — `STOVE_UI_ROUTES` appears only at the declaration site).

**How to avoid:** The plan agent has two options. Either:
- (a) **Use literal strings** in StoveSheet: `router.push('/stove/scheduler')` and `router.push('/stove/maintenance')`. Trivial; no `lib/routes.ts` edit. Recommended.
- (b) **Add `export` to `STOVE_UI_ROUTES`** and import it in StoveSheet. ~1 LOC edit; consistent with future `lib/routes.ts` discipline.

**Warning signs:** TypeScript `tsc --noEmit` will fail with `Property 'scheduler' does not exist on type '{ status: string; ignite: string; ... }'` if the planner blindly writes `STOVE_ROUTES.scheduler`.

### Pitfall 3: Playwright spec lives at `tests/smoke/`, not `tests/playwright/`

**What goes wrong:** CONTEXT and UI-SPEC consistently say "extend `tests/playwright/dashboard-glass-cards.spec.ts`". The actual file is at **`tests/smoke/dashboard-glass-cards.spec.ts`** (verified — there is no `tests/playwright/` directory; all specs live under `tests/smoke/` and `tests/features/`).

**How to avoid:** Plan tasks for the Playwright extension MUST reference the correct path: `tests/smoke/dashboard-glass-cards.spec.ts`. Otherwise the Edit tool will fail with "file does not exist".

**Warning signs:** `Read` or `Edit` tool returns "File does not exist" against `tests/playwright/...`.

### Pitfall 4: `useStoveData()` and `useStoveCommands()` require complex param objects, not no-arg calls

**What goes wrong:** CONTEXT D-04 says "sheet body components do NOT take props — they self-fetch via the device data + command hooks". Bundle `StoveSheet({ state, set, open, onClose })` reads from a single `state` object. Real hooks have signatures:
- `useStoveData({ checkVersion, userId })` — needs `useVersion()` + `useUser()`.
- `useStoveCommands({ stoveData, router, user })` — needs the entire `stoveData` return object + `useRouter()` + `useUser()`.
- `useLightsCommands({ lightsData: Pick<UseLightsDataReturn, ...>, router })` — needs picked subset + router.
- `useSonosCommands({ fetchData, setError })` — needs functions from `useSonosFullData()`.
- `useTuyaCommands()` — no params.

**How to avoid:** Each sheet body must:
1. Call `useVersion()` and `useUser()` (StoveSheet only — for `userId`).
2. Call `useRouter()` (StoveSheet + ClimateSheet).
3. Pass the data hook's return to the commands hook with the right shape.
4. The pattern is already established in Phase 177 cards — `LightsCard.tsx:44-59` is the cleanest reference (passes `Pick<>` subset to `useLightsCommands`).

**Warning signs:** TypeScript reports "missing properties" or "type X is not assignable to type Pick<...>". If the planner blindly copies `useStoveCommands()` (no args), tsc fails immediately.

### Pitfall 5: Netatmo `setthermmode` does not accept `'manual'` — only `'schedule' | 'away' | 'hg'`

**What goes wrong:** UI-SPEC mode-pill mapping says `Manuale → 'manual'` for `/setthermmode`. The route's typed body is `SetThermmodeRequest = { home_id, mode: 'schedule' | 'away' | 'hg' }`. There is **no `'manual'` value** at the home-mode level. "Manual" is a per-room concept (`setroomthermpoint` accepts `mode: 'manual' | 'home'`).

**How to avoid:** The "Manuale" pill semantically maps to "switch all rooms to manual setpoint". The Netatmo idiom is:
- **Auto** → `setHomeMode('schedule')`.
- **Eco** → `setHomeMode('away')`.
- **Off** → `setHomeMode('hg')` (frost-guard, the closest "off" mode).
- **Manuale** → `setHomeMode('schedule')` would be wrong. Two viable strategies:
  - Treat "Manuale" as a synthetic UI mode that sets `pendingMode = 'manual'` locally and signals "the user is now driving per-room setpoints" without firing `setHomeMode`. The pill stays selected until another mode pill is tapped.
  - Or, fire a no-op write that flips a local "manual override active" state. Plan agent picks.
- The simplest legitimate mapping: **"Manuale" pill is not a `setHomeMode` call** — it's a UI affordance that highlights when the user has actively pushed any room's setpoint via the radial dial (recompute from `status.rooms[].mode === 'manual'`).

**Warning signs:** TypeScript fails on `setHomeMode('manual')` because the type union excludes `'manual'`. Plan agent must explicitly resolve this in the ClimateSheet plan.

### Pitfall 6: ClimateSheet `zone.kind` and `zone.on` are bundle-only fields

**What goes wrong:** Bundle assumes each zone has `kind: 'termostato' | 'termovalvola'` and `on: boolean`. The real `RoomStatus` shape (from `useThermostatData`) is `{ room_id, temperature, setpoint, mode, heating, ...[key: string]: unknown }`. There's no `kind`, no top-level `on`.

**How to avoid:**
- **`kind`:** derived from `topology.modules` — modules attached to a room with `type === 'NATherm1'` (thermostat) vs `type === 'NRV'` (valve/radiator head). Or simpler: check whether the room has a `module_ids` entry pointing to a `NATherm1` module. The plan agent picks the heuristic and documents.
- **`on`:** map from `RoomStatus.heating` (boolean from existing mapper) or from `mode !== 'off' && mode !== 'hg'` — there is no native "zone on/off" concept in Netatmo, only mode + temperature. The clearest mapping: `zone.on = mode !== 'hg'`. The Tipo toggle's `setRoomMode` writes `mode: 'manual'` (on) vs falls back to `mode: 'home'` (revert to schedule, which is "off relative to manual override").

**Warning signs:** `RoomStatus` is open-typed (`[key: string]: unknown`) so `zone.kind` won't fail tsc, but it'll always be `undefined`. ClimateSheet renders `Termovalvola radiatore` for every zone (the else branch). Tests would catch this.

### Pitfall 7: Sonos `coordinator` is `coordinator_uid` (flat string), not `coordinator: { uid }`

**What goes wrong:** Bundle's `useSonosCommands.handleSetVolume(uid, volume)` expects a per-speaker UID. Bundle text in CONTEXT D-08 says "the sheet picks the group's coordinator speaker" — implies `g.coordinator.uid`. Real shape: `SonosZoneResponse.coordinator_uid` is a flat string.

**How to avoid:** Either
- Use `useSonosCommands.handleSetZoneVolume(groupId, volume)` — group-level write that targets the coordinator on the server. **Recommended** — shorter, single argument, and matches the bundle's "single volume slider per group" UX.
- Or use `handleSetVolume(zone.coordinator_uid, volume)` with the flat field.

**Warning signs:** Compile error `Property 'uid' does not exist on type 'string'` if the planner naively writes `zone.coordinator.uid`.

### Pitfall 8: TuyaPlug has no `room` field

**What goes wrong:** Bundle PlugsSheet renders `{p.room} · {power}W` per row. `TuyaPlug` has `device_id, switch_on, power_w, voltage_v, current_ma, energy_kwh, countdown_s, data_freshness, last_polled_at, custom_name, device_type` — **no `room`**. Tuya plug → room mapping lives in the device registry, not in the proxy.

**How to avoid:** Two options:
- **(a) Drop the `· {room}` segment** in the subtitle when `room` is unknown. PlugsSheet shows `"{custom_name} · {power}W"` (or just `{custom_name}` when off). Document the deviation. Recommended for Phase 178 (registry resolution out of scope).
- **(b) Look up `room` via the device registry hook** (`useDevicesByRoom` or similar — verify exists). Heavier; possibly incomplete data; recommend deferring.

**Warning signs:** Bundle copy assumes `room` is always present; the rendered string shows `undefined · 50W`.

### Pitfall 9: `useLightsData` has no `lights[].room` or `lights[].groupId`; rooms are reverse-mapped via groups

**What goes wrong:** Bundle `lights[].room` and `lights[].groupId` don't exist. `HueLight` exposes `light_id, name, on, brightness, ct_mirek, hue, saturation, colormode, reachable`. Rooms are derived: `groups[].lights[]` is an array of light_id strings; the group's `name` is the room name.

**How to avoid:** Build `byRoom` from groups, not lights:
```typescript
const byRoom: Record<string, HueLight[]> = {};
for (const group of lightsData.groups) {
  if (group.type !== 'Room') continue;            // skip Zone/LightGroup
  byRoom[group.name] = lightsData.lights.filter(l => group.lights.includes(l.light_id));
}
```
And per-room toggle: `handleRoomToggle(group.group_id, !anyOn)` — the group_id is the right parameter, not a per-light id.

**Per-light toggle inside the room list:** Bundle has per-light toggle. Real `useLightsCommands` only exposes `handleRoomToggle` (group-level). The bundle row's `<InlineToggle on={l.on} onChange={() => handleRoomToggle(l.groupId, !l.on)} />` is conceptually wrong — it would toggle the entire room, not the single light. Plan agent picks:
- **(a)** Aggregate to room-level toggle (each row toggles the whole room — semantic inconsistency with the per-light visual).
- **(b)** Add a per-light fetch to `/api/v1/hue/lights/{id}/state` (route may exist — verify). Heavier.
- **(c)** Keep bundle's structural fidelity but document the room-level semantic.

Since Phase 178 honors bundle visual verbatim and CONTEXT D-07 says "row-level toggles" without specifying granularity, **(a)** is the lowest-risk path: keep bundle layout, but each toggle invokes `handleRoomToggle(group.group_id, !groupOn)` and visually reflects the group's `any_on`/`all_on` state. Plan agent confirms.

**Warning signs:** Per-light Hue write requires a different endpoint (`/api/v1/hue/lights/{light_id}/state` PUT) that may or may not be exposed. Verifying that endpoint is a planning gate.

### Pitfall 10: `useTuyaCommands.togglePlug` does NOT use `useRetryableCommand`

**What goes wrong:** Unlike Stove/Lights/Sonos commands, `useTuyaCommands` (`app/components/devices/tuya/hooks/useTuyaCommands.ts`) is a thin direct-fetch wrapper. No retry, no idempotency. Returns `null` on failure (caller sees `null` and shrugs).

**How to avoid:** The PlugsSheet should treat `togglePlug` failures as silent (current behavior). Optimistic `<InlineToggle>` flip + revert-on-next-data-tick is the right UX. Don't try to await a confirmation toast — there isn't one wired.

**Warning signs:** UI-SPEC §"Optimistic toggles + steppers" says "Phase 7.0 retry infrastructure handles transient failures" — that's true for Lights/Sonos but **not** for Tuya. Doc this gap inline; PlugsSheet still uses optimistic UI but there is no auto-retry on failure.

### Pitfall 11: `useStoveData` does NOT expose temperature, target setpoint, or pellet percent

**What goes wrong:** Bundle's StoveSheet hero shows `{s.temp}°C` (54px display) and footnote `Obiettivo {s.target}°C · Pellet {s.pelletPercent}%`. The Thermorossi HA proxy exposes only `stove_state`, `power_level`, `fan_level`, `data_freshness`, `last_poll_at`, `error_code`, `error_description`. No temp, no target, no pellet.

**How to avoid:** Phase 177 already faced this for the StoveCard — see `StoveCard.tsx:13-19` ("A-01 deviation: bundle had mock temp; render power_level alone"). For StoveSheet:
- **Hero 54px display:** show `{powerLevel}` or `{powerLevel}/5` — semantic match.
- **Hero subtitle (12px caps):** show `In funzione` / `Spenta` (works).
- **Hero footnote:** **drop entirely** (CONTEXT Deferred Ideas — "Stove pellet percentage" + "Stove Temperatura obiettivo slider"). UI-SPEC §"Sheet Body Contracts → StoveSheet → Italian copy" already lists "Hero footnote (target only) / (pellet only) / (neither — omit row entirely)" — the third branch always fires here.

**Warning signs:** TypeScript will warn if planner writes `stoveData.temp` (property does not exist on `UseStoveDataReturn`). Tests render `undefined°C` if not handled.

### Pitfall 12: Phase 175 SC-#1 grep — sheet sub-primitives do NOT count

**What goes wrong:** Phase 175 SC-#1 says "every NEW glass surface in Phases 177-181 reuses Pressable" and ships three grep targets (`Pressable`, `usePressed`, `.press-anim`). A naïve plan-checker might flag sheet sub-primitives as missing `<Pressable>` wraps.

**How to avoid:** CONTEXT D-24 explicitly carves out: **sheet sub-primitives are NOT glass surfaces**. The Phase 175 SC-#1 grep is scoped to interactive **cards** and **container surfaces**, not bare `<button>`s inside a sheet. Sub-primitives use the new `data-sheet-focusable="true"` attribute (UI-SPEC §"Focus-visible outlines") + the 3-LOC append to `app/globals.css`. The plan agent must document this carve-out at the top of every sub-primitive file's JSDoc to head off plan-checker false-positives.

**Warning signs:** plan-checker flags a `<Stepper>` button without `<Pressable>`. Resolution: cite CONTEXT D-24.

---

## Code Examples

### Bundle → live hook field-adapter table (the Field Gap canonical reference)

| Sheet | Bundle field | Live hook field | Action |
|-------|--------------|-----------------|--------|
| **StoveSheet** | `s.on` | `stoveData.isAccesa` | derived `isAccesa = status === 'working' \|\| 'igniting' \|\| 'modulating'` |
| | `s.temp` (number, °C) | **MISSING** | DROP hero 54px temp; replace with `{powerLevel}/5` semantic display |
| | `s.target` | **MISSING** | DROP target; setpoint slider already dropped (CONTEXT Out of Scope) |
| | `s.pelletPercent` | **MISSING** | DROP footnote per CONTEXT D-05 fallback (UI-SPEC §StoveSheet copy: omit row) |
| | `s.power` | `stoveData.powerLevel: number \| null` | `powerLevel ?? 1` (default 1) |
| | `s.fan` | `stoveData.fanLevel: number \| null` | `fanLevel ?? 1` |
| | `s.needsCleaning` | `stoveData.needsMaintenance: boolean` | direct rename |
| | (handlers) | `cmds.handleIgnite/Shutdown/PowerChange({target:{value}})/FanChange(...)` | wrap Stepper to `{ target: { value: String(v) } }` |
| **ClimateSheet** | `t.zones[]` | derived from `topology.rooms[]` + `status.rooms[]` | merge: `zones = topology.rooms.map(r => ({ id: r.id, name: r.name, current: status.rooms.find(s => s.room_id === r.id)?.temperature ?? 0, target: ...?.setpoint ?? 20, on: ...?.heating ?? false, mode: ...?.mode })`. See ClimateCard `resolveRoomName` for the same pattern. |
| | `zone.kind` (`'termostato' \| 'termovalvola'`) | **DERIVED** from `topology.modules` | check the module type (`NATherm1` → thermostato, `NRV` → termovalvola) attached to the room |
| | `zone.on` | derived | `mode !== 'hg'` OR `heating === true` (plan agent picks) |
| | `t.mode` | `status.mode: string \| undefined` | use directly; map to selected mode pill |
| | (handlers) | NEW `useThermostatCommands`: `setRoomSetpoint, setHomeMode, setRoomMode` | new hook |
| **LightsSheet** | `lights[].room` | **MISSING** | derive `byRoom` from `groups[].lights[]` (see Pitfall 9) |
| | `lights[].groupId` | **MISSING** | look up via `groups.find(g => g.lights.includes(l.light_id))?.group_id` |
| | `lights[].on` | `light.on: boolean` | direct |
| | `lights[].name` | `light.name: string` | direct |
| | (scenes) | `scenes: HueScene[]` (`scene_id, name, group_id`) | feed to `findSceneByName(scenes, name)` |
| | (handlers) | `cmds.handleAllLightsToggle(on), handleSceneActivate(sceneId, groupId), handleRoomToggle(groupId, on)` | direct |
| **SonosSheet** | `s.groups[]` | `data.zones[]: SonosZoneResponse[]` | rename `zone` → `group` for the local var |
| | `g.id` | `zone.group_id` | direct |
| | `g.name` | `zone.coordinator_name ?? zone.label` | rename (see SonosCard:46) |
| | `g.playing` | `data.playback[zone.group_id]?.transport_state === 'PLAYING'` | derive |
| | `g.track`, `g.artist` | `data.playback[zone.group_id]?.title`, `?.artist` | rename + fall through to `''` |
| | `g.volume` | `data.volumes[zone.coordinator_uid]?.volume ?? 0` | look up by coordinator uid |
| | `g.coordinator.uid` | `zone.coordinator_uid: string` (flat) | NOT nested |
| | (volume write) | `cmds.handleSetZoneVolume(zone.group_id, vol)` OR `handleSetVolume(zone.coordinator_uid, vol)` | **prefer `handleSetZoneVolume`** — group-level, single id, matches bundle's "single slider per group" UX |
| **PlugsSheet** | `plugs[]` | `useTuyaData().plugs: TuyaPlug[] \| null` | guard `plugs ?? []` |
| | `p.id` | `p.device_id` | rename |
| | `p.name` | `p.custom_name ?? p.device_id` | fallback |
| | `p.room` | **MISSING** | drop subtitle room segment OR look up via device registry (defer to follow-up) |
| | `p.on` | `p.switch_on: boolean \| null` | treat `null` as `false` |
| | `p.power` | `p.power_w: number \| null` | treat `null` as `0` |
| | (toggle) | `togglePlug(p.device_id, p.switch_on === true)` | direct (no retry — Pitfall 10) |

### Verified `useThermostatCommands` request bodies

```typescript
// Source: VERIFIED via app/api/v1/netatmo/setroomthermpoint/__tests__/route.test.ts
// + app/components/devices/thermostat/ThermostatCard.tsx:208-236 (live consumer)
// POST /api/v1/netatmo/setroomthermpoint
const body: SetRoomThermpointRequest = {
  home_id: topology.home_id,
  room_id: zone.id,
  mode: 'manual',                  // 'manual' | 'home' (NOT 'off')
  temp: target,                    // 5.0–30.0
};

// POST /api/v1/netatmo/setthermmode
// Source: VERIFIED via app/api/v1/netatmo/setthermmode/__tests__/route.test.ts
const body: SetThermmodeRequest = {
  home_id: topology.home_id,
  mode: 'schedule' | 'away' | 'hg', // NO 'manual' option
};
```

### `findSceneByName` helper (~15 LOC)

```typescript
// app/components/EmberGlass/sheets/lib/findSceneByName.ts
import type { HueScene } from '@/types/hueProxy';

/**
 * Case-insensitive scene name lookup. Returns null if no match.
 * First match wins (callers responsible for catalog uniqueness).
 *
 * Source: CONTEXT D-07 / UI-SPEC §LightsSheet
 */
export function findSceneByName(catalog: readonly HueScene[], name: string): HueScene | null {
  const target = name.toLowerCase();
  return catalog.find(s => s.name.toLowerCase() === target) ?? null;
}
```

### globals.css append (3 LOC, UI-SPEC §"Focus-visible outlines")

```css
/* Phase 178 — sheet sub-primitive focus ring (mirror Phase 175 [data-pressable-focusable]) */
[data-sheet-focusable="true"]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Per-page device control surfaces (`/stove`, `/thermostat`, `/lights`, etc.) | Modal sheets opened from dashboard cards | Phase 175 + 177 set the foundation; Phase 178 ships the bodies | Legacy detail pages stay alive (CONTEXT Out of Scope); cleanup phase removes them later |
| `useMemo` / `useCallback` everywhere | React Compiler 1.0 auto-memoization | Phase 71 / 95 | All Phase 178 files MUST be RC-clean (D-33). Plan includes `npx react-compiler-healthcheck`. |
| Direct device API calls from components | HA proxy via shared `haClient` (`haGet`/`haPost`/`haPut`/`haDelete`) | v11.0 — v17.0 | All Phase 178 commands fire to existing proxy routes. Zero new API code in Phase 178. |
| `useState`-driven setpoint with eager fetch on every keystroke | `useDebounce(pendingValue, 500/250)` | v8.0 / v16.0 | ClimateSheet 500ms; SonosSheet 250ms (memory pattern). |
| Single command POST per UI write | `useRetryableCommand` (retry + dedup + idempotency) | Phase 7.0 | New `useThermostatCommands` adopts the pattern. Tuya commands intentionally do NOT (existing legacy choice). |
| Per-card multiple polls | WS-primary + 60s polling fallback | v17.0 | Existing — Phase 178 adds zero new fetches; sheet bodies share the existing data hook with the underlying card. |
| Class-name based styling for new components | Inline `style={{ }}` + `var(--token)` | Phase 174 D-12 | Mandate continues. |

**Deprecated/outdated:**
- The "bundle `state.thermostat.zones[].kind`" data shape — never existed in production. Use the topology+status merge pattern from `ThermostatCard.tsx`.
- `STOVE_UI_ROUTES` constant — declared but unexported. Either export it or use literal strings (this is a pitfall, not active deprecation).
- Bundle `BigSlider` primitive — explicitly deferred to Phase 179.

---

## Assumptions Log

> The vast majority of architectural decisions are LOCKED in CONTEXT D-01..D-36 and UI-SPEC discretion. The remaining items below are RESEARCH-DRIVEN observations the planner should treat as a verification checklist.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Manuale" mode-pill in ClimateSheet does not map to a `setHomeMode` value (Netatmo `setthermmode` lacks `'manual'`). UI-SPEC suggests local-state behavior. | ClimateSheet | If wrong, the pill appears non-functional. Plan agent must explicitly resolve the mapping in 178-PLAN. **[ASSUMED]** based on Netatmo type shape; alternative interpretation: Manuale ≡ Schedule with active per-room overrides. |
| A2 | LightsSheet per-light `<InlineToggle>` invokes `handleRoomToggle(group.group_id, !groupOn)` — toggles the whole room, not the single light. | LightsSheet | Bundle visual implies per-light, but command surface is room-level. Plan agent picks (a) match command surface (room-level write), (b) add per-light fetch (`/api/v1/hue/lights/{id}/state` PUT — verify exists), or (c) document semantic gap. **[ASSUMED]** — Phase 178 favors lowest-risk path (a). |
| A3 | PlugsSheet drops the `· {room}` segment in plug subtitles when room is unknown (TuyaPlug has no `room` field). | PlugsSheet | Bundle copy assumes room is always present. Without registry lookup, subtitle becomes `{power}W` only. **[ASSUMED]** — alternative is adding a device-registry hook; deferred. |
| A4 | StoveSheet hero 54px display shows `{powerLevel}/5` (not `{temp}°C`) and the `Obiettivo · Pellet` footnote is omitted entirely. | StoveSheet | Bundle visual mock assumed temperature data; live proxy has none. Phase 177 StoveCard already documented the same A-01 deviation. **[ASSUMED]** — could be reversed if a future phase wires Netatmo room-temperature into the stove hero. |
| A5 | ClimateSheet `zone.kind` is derived from `topology.modules` (`type === 'NATherm1'` → termostato, `'NRV'` → termovalvola). | ClimateSheet | Heuristic — there is no explicit "kind" field on RoomStatus. If wrong, all zones render the wrong copy. **[ASSUMED]** — plan agent confirms by inspecting `topology.modules` shape via `useThermostatData()` runtime data. |
| A6 | ClimateSheet `zone.on` is derived from `mode !== 'hg' && mode !== 'off'` (or alternately `heating === true`). | ClimateSheet | Two valid interpretations; plan agent picks one. **[ASSUMED]** |
| A7 | SonosSheet master action uses `handleSetZoneVolume(group_id, ...)` not `handleSetVolume(uid, ...)` for volume; play/pause uses `handlePlay(group_id) / handlePause(group_id)`. | SonosSheet | Both APIs exist; group-level is simpler. UI-SPEC discretion locks per-group. **[VERIFIED: useSonosCommands.ts]** lists both options. |
| A8 | StoveSheet "Orari"/"Manutenzione" buttons use literal route strings `/stove/scheduler` and `/stove/maintenance`. | StoveSheet | `STOVE_UI_ROUTES` is declared but not exported in `lib/routes.ts`. Plan agent picks: literal strings (recommended) OR add `export` (1-line edit). **[VERIFIED: lib/routes.ts]** |
| A9 | Sheet bodies do NOT receive `onClose` as a prop (CONTEXT D-04 lock); StoveSheet relies on `router.push` triggering auto-unmount of the dashboard, accepting hard-cut UX. | StoveSheet | UI-SPEC explicitly accepts the trade-off. **[VERIFIED: UI-SPEC §"Sheet exit animation timing"]** |
| A10 | Phase 175 SC-#1 grep ("every NEW glass surface in Phases 177-181 reuses Pressable") does NOT apply to sheet sub-primitives (Stepper, RadialDial buttons, SheetBtn, QuickActionButton, scene buttons, mode pills, zone chips, group play/pause buttons, master action buttons). | Press behavior | CONTEXT D-24 carves it out explicitly. **[VERIFIED: CONTEXT D-24]** |

**A1, A2, A3, A4, A5, A6 are the items the plan agent must explicitly resolve in 178-PLAN files.** The remaining items are verified.

---

## Open Questions (RESOLVED)

1. **Per-light Hue toggle endpoint availability**
   - What we know: `useLightsCommands` exposes only `handleRoomToggle(groupId, on)` and `handleAllLightsToggle(on)`. No per-light handler.
   - What's unclear: Whether `/api/v1/hue/lights/{light_id}/state` PUT exists and is wired. There IS a `/api/v1/hue/lights` GET (verified in `useLightsData.ts:217`) but the per-light state-mutation route was not verified in this research.
   - **RESOLVED:** Plan agent (a) greps `app/api/v1/hue/lights/` for a state-mutation route; (b) if absent, accept the room-level semantic (per Pitfall 9 option (a)); (c) defers the per-light command extension to a follow-up phase.

2. **Tuya plug → room mapping via device registry**
   - What we know: Tuya proxy exposes `custom_name` and `device_type`; no `room`. v15.0 shipped a Rooms / Device Registry system (`useRoomStatus`, `roomsProxy`, `registryProxy`).
   - What's unclear: Whether a hook exists that returns "this `device_id` is in this `room_name`" suitable for PlugsSheet's per-row subtitle. Likely candidates: `useDevicesByRoom`, `lib/hooks/useRoomStatus.ts`.
   - **RESOLVED:** Plan agent greps `lib/hooks/` and `app/components/rooms/` for an existing helper. If found, wire it; if not, drop the `· {room}` segment per Pitfall 8 option (a).

3. **`useThermostatData()` `error` field surface**
   - What we know: `useThermostatData` returns `{ error: string | null }` (not an `Error` instance).
   - What's unclear: CONTEXT D-27 says "render `{error.message}` only when `error instanceof Error`". With a `string | null`, the error path is `error ? <error /> : null` and there's no `.message` access.
   - **RESOLVED:** Plan agent normalizes — if hook returns string, render the string verbatim as the secondary line; if it returns Error (Stove path uses `errorCode/errorDescription`), apply the type guard. Documented in 178-PLAN per-sheet error blocks.

4. **`useStoveData` skeleton trigger field**
   - What we know: `useStoveData` exposes `initialLoading: boolean` (initial mount) and `loading: boolean` (transient command-in-flight).
   - What's unclear: D-26 says "loading === true && data === null". The hook does NOT have a single boolean matching this — it has `initialLoading` (true until first WS or HTTP message) which is the closest analog. Other hooks: `useThermostatData` has `loading`; `useLightsData` has `loading`; `useSonosFullData` has `loading + data === null`; `useTuyaData` has `loading + plugs === null`.
   - **RESOLVED:** Plan agent uses `initialLoading` for StoveSheet, `loading && (status === null \|\| topology === null)` for ClimateSheet, `loading && lights.length === 0 && groups.length === 0` for LightsSheet, `loading && data === null` for SonosSheet, `loading && plugs === null` for PlugsSheet. Document in each sheet's plan.

5. **Per-room mode revert (Tipo toggle off)**
   - What we know: ClimateSheet Tipo `<InlineToggle>` toggles per-room. `setRoomMode` accepts `'manual' | 'home'`.
   - What's unclear: Bundle says "off → setRoomMode('off')" but `'off'` is not a valid mode value.
   - **RESOLVED:** Off → `setRoomMode(roomId, 'home')` (revert to schedule). On → `setRoomMode(roomId, 'manual')`. Plan agent confirms by reading existing test routes.

---

## Environment Availability

> Phase 178 is a code/config-only phase that runs in the existing Next.js + Jest + Playwright workspace. No external services, no new daemons, no new package installs.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `node` | Build/dev | ✓ | (project standard) | — |
| `npm` (scripts only — never `install`) | Test scripts | ✓ | — | — |
| `@radix-ui/react-dialog` | Sheet primitive (consumed) | ✓ | ^1.1.14 in package.json | — |
| `lucide-react` | Icons | ✓ | (existing dep) | — |
| `jest` | Unit specs | ✓ | (existing dep) | — |
| `@playwright/test` | E2E spec extension | ✓ | (existing dep) | — |
| Next.js dev server (for Playwright) | E2E spec | ✓ | 15.5.x | — |

**No missing dependencies.** No fallbacks needed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (unit) + Playwright (E2E) |
| Config file | `jest.config.js` (existing); `playwright.config.ts` (existing) |
| Quick run command | `npx jest app/components/EmberGlass/sheets --bail` (per-task fast feedback) |
| Full unit suite (sheets + new hook) | `npx jest app/components/EmberGlass/sheets app/components/devices/thermostat/hooks/__tests__` |
| Per-wave merge (broader subset) | `npm run test:components -- --bail` (Jest) + `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts` |
| Phase gate | `npm run test:components` + `npm run test:api` (covers any setroom* / setterm* test edits) + `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts` + `npx tsc --noEmit` + `npx react-compiler-healthcheck` |

**Per CLAUDE.md rule 8:** NEVER `npm test` alone in `<verify><automated>` blocks.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHEET-02 | StoveSheet renders + steppers fire commands + ignite/shutdown wired + needsCleaning lock | unit + e2e | `npx jest app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx` + Playwright "SHEET-02 StoveSheet wires command" | ❌ Wave 0 (new file) |
| SHEET-03 | ClimateSheet zone selection + RadialDial debounced setpoint + mode pills + Tipo toggle | unit + e2e | `npx jest app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx` + Playwright "SHEET-03 …" | ❌ Wave 0 |
| SHEET-04 | LightsSheet count + scene activation + Tutte on/off + per-room toggle + scene-not-found disabled | unit + e2e | `npx jest app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx` + Playwright "SHEET-04 …" | ❌ Wave 0 |
| SHEET-05 | SonosSheet group selection + play/pause stopPropagation + debounced volume + master allSettled | unit + e2e | `npx jest app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx` + Playwright "SHEET-05 …" | ❌ Wave 0 |
| SHEET-06 | PlugsSheet summary cards + per-plug toggle + kW/W boundaries + dashboard card NO toggle (cross-check DASH-10) | unit + e2e | `npx jest app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx` + Playwright "SHEET-06 …" | ❌ Wave 0 |
| (sub-primitive) SheetRow | label + value + child render | unit | `npx jest app/components/EmberGlass/sheets/primitives/__tests__/SheetRow.test.tsx` | ❌ Wave 0 |
| (sub-primitive) Stepper | ± clicks emit clamped values | unit | `... Stepper.test.tsx` | ❌ Wave 0 |
| (sub-primitive) Slider | range input event → onChange(Number) | unit | `... Slider.test.tsx` | ❌ Wave 0 |
| (sub-primitive) RadialDial | ± clicks emit clamped values, dasharray reflects pct | unit | `... RadialDial.test.tsx` | ❌ Wave 0 |
| (sub-primitive) SheetBtn | Icon + label + onClick | unit | `... SheetBtn.test.tsx` | ❌ Wave 0 |
| (sub-primitive) QuickActionButton | active/inactive color states + click | unit | `... QuickActionButton.test.tsx` | ❌ Wave 0 |
| (helper) findSceneByName | case-insensitive + first hit + null | unit | `npx jest app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts` | ❌ Wave 0 |
| (commands hook) useThermostatCommands | setRoomSetpoint POST body + setHomeMode POST body + setRoomMode | unit | `npx jest app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` | ❌ Wave 0 |
| CONTEXT D-26 loading skeleton | render with `loading=true && data=null` → single skeleton | unit (within sheet specs) | (rolled into per-sheet specs) | ❌ Wave 0 |
| CONTEXT D-27 error state | render with `error instanceof Error` → IT message + error.message | unit (within sheet specs) | (rolled into per-sheet specs) | ❌ Wave 0 |
| CONTEXT D-33 React Compiler | zero `useMemo`/`useCallback` in new files | grep + healthcheck | `! grep -rEn "useMemo\\\|useCallback" app/components/EmberGlass/sheets app/components/devices/thermostat/hooks/useThermostatCommands.ts` + `npx react-compiler-healthcheck` | ✅ tools exist |
| Phase-174-inherited DS-02 | hardcoded values inline-tagged with `// AUDIT-EXCEPTION` | repo grep | `grep -rEn '#[0-9a-fA-F]{3,8}\\b\\\|blur\\([0-9]+px\\)' app/components/EmberGlass/sheets` then verify each match has an `// AUDIT-EXCEPTION` annotation on or above the line | ✅ tooling exists |

### Sampling Rate (per Nyquist Dimension 8)

- **Per task commit:** `npx jest <touched test file> --bail` (sub-30s feedback). Plus `npx tsc --noEmit` for the touched file's module.
- **Per wave merge:** `npm run test:components -- app/components/EmberGlass/sheets app/components/devices/thermostat/hooks/__tests__` + Playwright `dashboard-glass-cards.spec.ts` (15-30s for Jest subset; ~60-90s for E2E).
- **Phase gate (post-implementation, pre-/gsd-verify-work):** Full `npm run test:components` + `npm run test:api` (catches any incidental Netatmo route test breakage) + Playwright `dashboard-glass-cards.spec.ts` + `npx tsc --noEmit` + `npx react-compiler-healthcheck` + DS-02 grep gate.
- **Release gate (CI only):** `npm run test:ci` (full Jest + coverage). Reserved for human-merged PRs.

### Wave 0 Gaps

> Wave 0 = setup before implementation can begin. Phase 178 has minimal Wave 0 because all infrastructure already exists.

- [ ] **No new test framework install needed.** Jest + Playwright already wired.
- [ ] **No new shared fixtures needed.** Each Jest spec mocks the relevant hook(s) inline. Playwright extension reuses Phase 177 `collectConsoleErrors` + `dismissVersionEnforcerIfPresent` + `dismissWhatsNewModalIfPresent` helpers verbatim.
- [ ] **One config file edit:** `jest.config.js` may need to confirm that `app/components/EmberGlass/sheets/__tests__` is picked up (the existing config uses `testPathIgnorePatterns` and `testMatch` — verify current matchers cover the new path; if not, it's a 1-line edit). Not strictly Wave 0 — can be discovered when the first sub-primitive spec is added and runs.
- [ ] **No mock factories needed beyond what each spec inlines.** The existing `useStoveData.test.ts`, `useLightsData.test.ts`, etc., spec files demonstrate the inline-mock pattern.

---

## Security Domain

> `security_enforcement` is not explicitly disabled in `.planning/config.json` (only `nyquist_validation` is set). Treat as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes (forwarding only) | Sheet bodies inherit Auth0 session via existing `withAuthAndErrorHandler` server route wrapper. No new auth surface in Phase 178. `useThermostatCommands` POSTs to existing routes that already enforce session. |
| V3 Session Management | no (no session changes) | Phase 174..177 baseline; no edits. |
| V4 Access Control | yes (via existing routes) | Per-route auth (Auth0) + downstream HA proxy auth (X-API-Key, server-only). Sheet bodies are presentational; no new auth code. |
| V5 Input Validation | yes (lightweight) | New `useThermostatCommands` writes typed `SetRoomThermpointRequest`/`SetThermmodeRequest` bodies — types enforce `mode` union. The radial dial clamps `1..27` via `<RadialDial min max>`. The mode-pill mapping is statically typed. **Server-side validation handled by `parseJson` + downstream proxy** — no client validation gates. |
| V6 Cryptography | no | No new crypto. |

### Known Threat Patterns for `{Next.js client + HA proxy}`

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Replay of mutation requests | Tampering | `useRetryableCommand` injects idempotency keys (Phase 7.0). New `useThermostatCommands` adopts the pattern. |
| Cross-site write via stolen session | Spoofing | Auth0 cookie httpOnly + SameSite=Lax (existing). Phase 178 introduces no new write surface — only consumes existing routes. |
| Setpoint out-of-range injection | Tampering | `<RadialDial min={15} max={28}>` clamps client-side; `SetRoomThermpointRequest.temp` is documented `5.0-30.0` server-side; Netatmo proxy hard-validates. |
| Scene name → arbitrary scene_id misroute | Tampering | `findSceneByName` returns null on miss; click is no-op; on hit, `scene_id` is selected from the user's own Hue catalog (no user-supplied path injection). |
| XSS via plug `custom_name` | Tampering | React escapes JSX text by default. No `dangerouslySetInnerHTML` in any sheet body. |

**No new attack surface introduced.** Phase 178 is presentation + composition over existing authenticated routes.

---

## Sources

### Primary (HIGH confidence)

- `[VERIFIED: codebase grep + read]` `app/components/devices/stove/hooks/useStoveData.ts` — full 357 lines read; confirmed `UseStoveDataReturn` shape (no `temp`, no `target`, no `pelletPercent`).
- `[VERIFIED: codebase grep + read]` `app/components/devices/stove/hooks/useStoveCommands.ts` — confirmed `handleIgnite/Shutdown/PowerChange/FanChange` signatures + 202-Accepted dance.
- `[VERIFIED: codebase grep + read]` `app/components/devices/thermostat/hooks/useThermostatData.ts` — confirmed `topology + status + mode + RoomStatus` shape.
- `[VERIFIED: codebase grep + read]` `app/components/devices/thermostat/ThermostatCard.tsx:39-89, 183-236` — debounce + setpoint + mode patterns; the canonical reference for `useThermostatCommands` body shapes.
- `[VERIFIED: codebase grep + read]` `app/components/devices/lights/hooks/useLightsData.ts` — confirmed `lights/groups/scenes` + lookup-by-group.
- `[VERIFIED: codebase grep + read]` `app/components/devices/lights/hooks/useLightsCommands.ts` — confirmed `handleRoomToggle/handleSceneActivate/handleAllLightsToggle` signatures.
- `[VERIFIED: codebase grep + read]` `app/components/devices/sonos/hooks/useSonosFullData.ts` + `useSonosCommands.ts` — confirmed `data.zones[]/playback/volumes` shape + `handlePlay/handlePause/handleSetVolume/handleSetZoneVolume` signatures.
- `[VERIFIED: codebase grep + read]` `app/components/devices/tuya/hooks/useTuyaData.ts` + `useTuyaCommands.ts` — confirmed TuyaPlug shape (no `room`, `name → custom_name`, `on → switch_on`, `power → power_w`).
- `[VERIFIED: codebase grep + read]` `app/api/v1/netatmo/setroomthermpoint/route.ts` + `__tests__/route.test.ts` — confirmed POST body `{home_id, room_id, mode: 'manual', temp}`.
- `[VERIFIED: codebase grep + read]` `app/api/v1/netatmo/setthermmode/route.ts` + `__tests__/route.test.ts` — confirmed POST body `{home_id, mode: 'schedule' | 'away' | 'hg'}`.
- `[VERIFIED: codebase grep + read]` `types/netatmoProxy.ts` — `SetRoomThermpointRequest`, `SetThermmodeRequest` types.
- `[VERIFIED: codebase grep + read]` `types/hueProxy.ts` — `HueLight`, `HueGroup`, `HueScene` shapes.
- `[VERIFIED: codebase grep + read]` `types/sonosProxy.ts` — `SonosZoneResponse.coordinator_uid`, `SonosPlaybackResponse.transport_state`.
- `[VERIFIED: codebase grep + read]` `types/tuyaProxy.ts` — `TuyaPlug` shape (no room).
- `[VERIFIED: codebase grep + read]` `app/hooks/useDebounce.ts` — confirmed signature `useDebounce<T>(value, delay = 300)`.
- `[VERIFIED: codebase grep + read]` `lib/hooks/useRetryableCommand.ts` — confirmed `useRetryableCommand({ device, action })` signature.
- `[VERIFIED: codebase grep + read]` `lib/routes.ts` — confirmed `STOVE_ROUTES` (API-only), `STOVE_UI_ROUTES` (declared but NOT exported), `NETATMO_ROUTES.setRoomThermpoint`/`setThermMode`.
- `[VERIFIED: codebase grep + read]` `app/components/EmberGlass/cards/{Stove,Climate,Lights,Sonos,Tuya}Card.tsx` — confirmed Phase 177 wiring + field-mapping precedents.
- `[VERIFIED: codebase grep + read]` `app/components/EmberGlass/Sheet.tsx` — confirmed Phase 175 primitive API.
- `[VERIFIED: codebase grep + read]` `app/components/EmberGlass/index.ts` — confirmed barrel export pattern.
- `[VERIFIED: codebase grep + read]` `app/globals.css:360-388` — confirmed press-anim + `[data-pressable-focusable]:focus-visible` rule (reference for the new `[data-sheet-focusable]` rule).
- `[VERIFIED: codebase grep + read]` `tests/smoke/dashboard-glass-cards.spec.ts` (lines 1-253) — confirmed actual file path (`tests/smoke/`, NOT `tests/playwright/`), beforeEach setup, helper functions to reuse.
- `[VERIFIED: codebase grep + read]` `package.json` — confirmed test scripts (`test:components`, `test:quick`, `test:e2e`, etc.) per CLAUDE.md rule 8.
- `[CITED: .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md]` D-01..D-36 + Out of Scope + Discretion + Specifics + Deferred.
- `[CITED: .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md]` All 1151 lines — pixel-precise visual contract.
- `[CITED: .planning/inbox/ember-glass-design/project/components/sheets.jsx]` Lines 1-597 — bundle visual source.
- `[CITED: .planning/REQUIREMENTS.md]` SHEET-02..06 acceptance criteria.
- `[CITED: .planning/ROADMAP.md]` Phase 178 §"Goal + 5 SC".

### Secondary (MEDIUM confidence)

- None — every claim is sourced from a verified codebase read.

### Tertiary (LOW confidence)

- The "per-light Hue PUT route exists" assumption for Pitfall 9 option (b) — NOT verified in this research (Open Question 1). Plan agent verifies if pursuing option (b).
- The "device-registry hook returning room for a Tuya plug" assumption for Pitfall 8 option (b) — NOT verified (Open Question 2). Plan agent verifies if pursuing option (b).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dep verified in `package.json` + existing usage; zero new packages.
- Architecture: HIGH — all 5 device hook patterns verified by direct read; commands hook pattern is a verbatim mirror of 4 existing hooks.
- Pitfalls: HIGH — 12 pitfalls identified by direct codebase reads, each with concrete file/line citation. Field-gap mismatches between bundle and live hooks are particularly well-substantiated.
- Validation Architecture: HIGH — Jest scripts and Playwright spec location verified.
- Security: HIGH — no new attack surface; existing route auth inherited.

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days — no upstream changes expected; Phase 175/177 primitives are locked).
