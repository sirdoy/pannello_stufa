---
phase: 129-sonos-frontend
plan: "01"
subsystem: sonos-frontend
tags: [dashboard, card, polling, skeleton, tdd]
dependency_graph:
  requires:
    - 128-02 (Sonos extended controls API routes)
    - 127-02 (Sonos transport controls)
    - 126-02 (Sonos infrastructure API routes)
  provides:
    - SonosCard dashboard card with now-playing display
    - useSonosData polling hook
    - Skeleton.SonosCard skeleton component
    - DashboardCards registry integration
  affects:
    - app/components/DashboardCards.tsx
    - app/components/ui/Skeleton.tsx
tech_stack:
  added: []
  patterns:
    - orchestrator hook pattern (useSonosData)
    - useAdaptivePolling with initialDelay: 600
    - dataRef stale-while-revalidate
    - Promise.allSettled for parallel zone playback fetches
    - RaspiCard pattern extended for Sonos
key_files:
  created:
    - app/components/devices/sonos/hooks/useSonosData.ts
    - app/components/devices/sonos/SonosCard.tsx
    - app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts
    - app/components/devices/sonos/__tests__/SonosCard.test.tsx
  modified:
    - app/components/ui/Skeleton.tsx
    - app/components/DashboardCards.tsx
decisions:
  - Use Promise.allSettled to fetch playback for up to 5 zones in parallel; pick first PLAYING, fallback to first zone
  - Follow RaspiCard/useRaspiData pattern exactly for structural consistency
  - SonosCard test: use getAllByText for banner title due to mock rendering title + children
metrics:
  duration: "~15 minutes"
  completed: "2026-03-24"
  tasks_completed: 2
  files_created: 4
  files_modified: 2
requirements:
  - SONOS-31
  - SONOS-33
  - SONOS-34
---

# Phase 129 Plan 01: Sonos Dashboard Card Summary

SonosCard dashboard card with useSonosData polling hook, Skeleton.SonosCard, and DashboardCards registry integration — now-playing track, zone/speaker counts, click-to-/sonos navigation.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | useSonosData hook + Skeleton.SonosCard + unit tests | aaef11e7 | useSonosData.ts, useSonosData.test.ts, Skeleton.tsx |
| 2 | SonosCard component + DashboardCards integration + unit tests | e87925d9 | SonosCard.tsx, SonosCard.test.tsx, DashboardCards.tsx |

## What Was Built

**useSonosData hook** (`app/components/devices/sonos/hooks/useSonosData.ts`):
- Fetches `/api/sonos/health`, `/api/sonos/zones`, then playback for up to 5 zones in parallel via `Promise.allSettled`
- "Most interesting zone" logic: first zone with `transport_state === 'PLAYING'`, falls back to first zone
- `{ zones: [...] }` wrapper unwrapped automatically; playback responses used directly
- Standard loading/error/stale state management with `dataRef` for stale-while-revalidate
- `useAdaptivePolling` with `initialDelay: 600`, visible=60s, hidden=300s interval

**SonosCard component** (`app/components/devices/sonos/SonosCard.tsx`):
- Three render branches: skeleton (loading && !data), error (error && !data), data
- Error state: `SmartHomeCard` with sage theme + Banner "Non raggiungibile"
- Data state: clickable div navigating to `/sonos`, with Play/Pause/Square lucide icon, now-playing title + artist, zone count + speaker count stat boxes
- Stale banner shown when data present but fetch failed
- Full keyboard accessibility (Enter/Space navigation, aria-label)

**Skeleton.SonosCard** (`app/components/ui/Skeleton.tsx`):
- Sage accent bar (`from-success-500/50 via-success-400/50 to-success-600/50`)
- Header skeleton (icon + title pulses)
- Now-playing lines (title + artist width pulses)
- Stats row (two flex-1 pulse boxes for zone/speaker counts)

**DashboardCards.tsx** — 4 changes:
- Import `SonosCard` after `RaspiCard` import
- `CARD_COMPONENTS`: `sonos: SonosCard`
- `CARD_SKELETONS`: `sonos: Skeleton.SonosCard`
- `DEVICE_META`: `sonos: { name: 'Sonos', icon: '🎵' }`

## Requirements Verification

- **SONOS-31**: SonosCard on dashboard with now-playing, zone count, speaker count — implemented
- **SONOS-33**: Sonos in device registry — already configured in DEVICE_CONFIG (no code change needed)
- **SONOS-34**: Sonos in navigation menu — already configured via DEVICE_CONFIG (no code change needed)

## Test Results

- `useSonosData.test.ts`: 7/7 passing
- `SonosCard.test.tsx`: 6/6 passing
- Full sonos test suite: 43/43 passing (4 test suites)

## Deviations from Plan

**1. [Rule 1 - Bug] Test assertion for error banner uses getAllByText**
- **Found during:** Task 2
- **Issue:** Mock Banner renders title as text + children, causing `getByText(/Non raggiungibile/i)` to find multiple elements
- **Fix:** Changed to `getAllByText(/Non raggiungibile/i).length > 0` assertion
- **Files modified:** `app/components/devices/sonos/__tests__/SonosCard.test.tsx`
- **Commit:** e87925d9 (included in task commit)

## Known Stubs

None — all data sources wired (useSonosData fetches real API endpoints).

## Self-Check: PASSED
