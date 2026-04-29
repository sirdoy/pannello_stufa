---
phase: 179
slug: rooms-tab-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 179 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `179-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Unit framework** | Jest 29.x + @testing-library/react (project default) |
| **Smoke framework** | Playwright (`tests/smoke/`) |
| **Config files** | `jest.config.*`, `playwright.config.*` (existing) |
| **Quick run command** | `npm run test:components -- app/components/EmberGlass/rooms/__tests__` |
| **Per-touched-file run** | `npm run test:changed` |
| **Smoke run command** | `npx playwright test tests/smoke/rooms-tab.spec.ts` |
| **Full suite (release only)** | `npm test` (NOT for plan `<verify><automated>` per CLAUDE.md rule 8) |
| **Estimated runtime** | ~30s scoped suite + ~60s smoke spec |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:components -- <touched-spec>` (CLAUDE.md rule 8 — scoped subset; never `npm test` from agents).
- **After every plan wave:** Run `npm run test:components -- app/components/EmberGlass/rooms/__tests__` + `npx playwright test tests/smoke/rooms-tab.spec.ts`.
- **Before `/gsd-verify-work`:** Scoped suite + smoke spec must be green; React Compiler grep gate (no `useMemo`/`useCallback`) must equal 0.
- **Max feedback latency:** ≤ 90 seconds per wave merge.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 179-01-* | 01 (types + lib + aggregator) | 0 | ROOMS-01 | — | Pure aggregator never throws on malformed hook output | unit | `npm run test:unit -- app/components/EmberGlass/rooms/__tests__/lib/getDevicesForRoom.test.ts` | ❌ W0 | ⬜ pending |
| 179-02-* | 02 (5 primitives) | 1 | ROOMS-02..05 | — | Primitives are pure; no event handlers fire on disabled state | unit | `npm run test:components -- app/components/EmberGlass/rooms/__tests__/primitives` | ❌ W0 | ⬜ pending |
| 179-03-* | 03 (RoomCard + DeviceChip) | 1 | ROOMS-02 | — | RoomCard onClick gated to non-disabled state; DeviceChip has no handler | unit | `npm run test:components -- RoomCard.test.tsx DeviceChip.test.tsx` | ❌ W0 | ⬜ pending |
| 179-04-* | 04 (DeviceCard + DevicePrimaryControl + DeviceBody dispatcher) | 2 | ROOMS-04 | — | Dispatcher renders correct primary control per kind | unit | `npm run test:components -- DeviceCard.test.tsx DevicePrimaryControl.test.tsx DeviceBody.test.tsx` | ❌ W0 | ⬜ pending |
| 179-05-* | 05 (Stove/Thermo/Valve/Light/Plug bodies) | 2 | ROOMS-05 | T-179-CMD (wired commands) | Debounced commits gated on data; no command fires on placeholder data | unit (fake timers) | `npm run test:components -- bodies/{Stove,Thermo,Valve,Light,Plug}Body.test.tsx` | ❌ W0 | ⬜ pending |
| 179-06-* | 06 (Sonos/Tv/Shade/Camera/Sensor bodies) | 2 | ROOMS-05 | T-179-CMD | Volume slider debounce 250ms before commit; no-op bodies do not fire mock fns | unit (fake timers) | `npm run test:components -- bodies/{Sonos,Tv,Shade,Camera,Sensor}Body.test.tsx` | ❌ W0 | ⬜ pending |
| 179-07-* | 07 (RoomSheet + RoomsTab orchestrator + /stanze route) | 3 | ROOMS-01, ROOMS-03 | — | Auth-gate via Phase 177 pattern; sheet remounts on selectedRoomName change | unit + integration | `npm run test:components -- RoomSheet.test.tsx RoomsTab.test.tsx app/stanze` | ❌ W0 | ⬜ pending |
| 179-08-* | 08 (Playwright smoke) | 3 | ROOMS-01..05 | T-179-A11Y | Zero console errors; focus-visible on RoomCard | smoke | `npx playwright test tests/smoke/rooms-tab.spec.ts` | ❌ W0 | ⬜ pending |
| 179-RC | global | 3 | — | — | No useMemo/useCallback in rooms/ namespace | grep gate | `[ "$(grep -REn 'useMemo\|useCallback' app/components/EmberGlass/rooms/ \| wc -l)" -eq 0 ]` | — | ⬜ pending |
| 179-TSC | global | 3 | — | — | TypeScript strict passes on touched files | type | `npx tsc --noEmit -p tsconfig.json` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/EmberGlass/rooms/types.ts` — `RoomDevice`, `RoomConfig`, `DeviceKind`, `AggregatorState`.
- [ ] `app/components/EmberGlass/rooms/lib/rooms-config.ts` — `ROOMS`, `ROOM_ALIASES`, `EXTRA_DEVICES`, `ICON_FOR`, `CATEGORY_ORDER`, `CATEGORY_LABEL`.
- [ ] `app/components/EmberGlass/rooms/lib/getDevicesForRoom.ts` — pure aggregator (covers ROOMS-01 contract).
- [ ] `app/components/EmberGlass/rooms/__tests__/lib/getDevicesForRoom.test.ts` — fixture-based pure-function tests for every room × every device kind, including ROOM_ALIASES coverage and unmatched-room drop.
- [ ] No new framework install — Jest + Playwright both already configured.

*Optional Wave 0 enhancement:* extract Playwright helpers (`collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, `primeDashboardForSheetTest`) to `tests/smoke/_helpers/` to avoid duplication with `dashboard-glass-cards.spec.ts`. Deferred per CONTEXT D-65 — plan agent decides.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity vs `rooms.jsx` bundle | ROOMS-02..05 | Pixel-perfect bundle parity is a human judgment call (no screenshot snapshot infra in this repo) | Open `/stanze` on mobile-width viewport (375×812). Compare each room's RoomCard chip-grid layout against `.planning/inbox/ember-glass-design/project/Pannello Stufa - Redesign.html` rooms section. Tap each RoomCard, verify summary header gradient + per-category sections + DeviceCard tone-tinting matches bundle. |
| Touch latency on iOS Safari (SliderRow tap-to-seek, RoomCard onOpen) | ROOMS-03, ROOMS-05 | Pointer-events behavior on iOS Safari is not reproducible in headless Playwright | Real iPhone via local network: tap RoomCard → sheet opens within 100ms; SliderRow tap snaps to position; volume slider 250ms debounce feels responsive |
| Color-mix oklab gradient rendering | ROOMS-02, ROOMS-04 | Browser oklab support varies (Safari 16.4+); fallback should still render | Verify on Safari 15 (oklab unsupported) — `color-mix` falls back to plain border per CSS spec; chip grid still legible |
| Bundle Italian copy correctness | ROOMS-04, ROOMS-05 | Native Italian speaker review | Native speaker confirms `Termovalvola radiatore`, `Tutte le Stanze` (existing convention), `Riproduci ovunque` etc. flow naturally per Phase 174-178 voice |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (types, lib, aggregator, fixtures)
- [ ] No watch-mode flags in any plan `<verify><automated>` block
- [ ] Feedback latency < 90s per wave merge
- [ ] React Compiler grep gate (`useMemo`/`useCallback`) in final plan `<verify><automated>`
- [ ] `nyquist_compliant: true` set in frontmatter once plans pass checker

**Approval:** pending
