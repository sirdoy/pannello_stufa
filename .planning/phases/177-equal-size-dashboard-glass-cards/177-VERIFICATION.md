---
phase: 177-equal-size-dashboard-glass-cards
verified: 2026-04-29T00:00:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Visual 1:1 grid on real device"
    expected: "Open / on a phone (or DevTools mobile emulation). All 10 cards render in a 2-col grid with visually equal square footprints. No card overflows, no aspect drift."
    why_human: "Visual confirmation of 1:1 aspect ratio across mobile breakpoints — programmatically asserted in smoke spec but pending live runtime."
  - test: "Stagger animation visible on cold load"
    expected: "Hard reload /. Cards animate in with a perceptible 100ms cascade (top-left first, bottom-right last). No jank, no double-mount flicker."
    why_human: "Stagger feel + perceived smoothness cannot be verified by grep. animationDelay style is asserted; visual quality is not."
  - test: "Tap → sheet opens for 8 interactive cards"
    expected: "Tap each of Stove, Climate, Lights, Sonos, Camera, Network, Tuya, IKEA. The Phase 175 Sheet primitive slides up with the placeholder 'Controlli in arrivo nella Phase 178' message and the device-specific title."
    why_human: "Smoke spec covers this but Playwright runtime is deferred to user-side execution (CONTEXT.md / 177-08 SUMMARY confirms spec authored, runtime deferred). Confirm interactively."
  - test: "Weather + Raspi do NOT open a sheet on tap"
    expected: "Tap WeatherCard and RaspiCard. Nothing happens — no Sheet, no cursor pointer change, no state mutation. Card has no press affordance."
    why_human: "SC-#3 negative case. Read-only contract must be felt to be confirmed. Programmatic check verified absence of onOpen wiring."
  - test: "Lights master toggle does NOT pop the sheet"
    expected: "On the LightsCard, tap the small InlineToggle in the header. All lights toggle; the sheet does NOT open. Tapping anywhere else on the card opens the sheet."
    why_human: "D-17 stop-propagation behavior is real-world UX-critical and best confirmed with finger taps."
  - test: "React Compiler health"
    expected: "Run `npx react-compiler-healthcheck` (or open DevTools React Compiler badge). No new opt-outs introduced by Phase 177 cards. All 10 card components show 'memoized' in the React profiler."
    why_human: "SC-#5 explicit gate requires runtime tooling. Static grep already verified zero useMemo/useCallback in cards/ but SC-#5 names the healthcheck tool by hand."
  - test: "Sonos card now appears on dashboard (A-03 fix)"
    expected: "Sonos card is visible alongside other 9 cards on a clean session. No need to toggle visibility in /settings."
    why_human: "Service change (`hasHomepageCard` → always true) needs live confirmation that Sonos default is dashboard-visible for new + existing users."
---

# Phase 177: Equal-Size Dashboard Glass Cards — Verification Report

**Phase Goal:** Redesign the dashboard as an equal-size 2-column 1:1 glass-card grid where every device card has identical footprint and the documented per-card content shape, while preserving v9.0 stagger and React Compiler memoization.

**Verified:** 2026-04-29
**Status:** human_needed (all 12 truths VERIFIED programmatically; visual + runtime items routed to human)
**Re-verification:** No — initial verification

## Goal Achievement

### Roadmap Success Criteria

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| SC-1 | Dashboard renders 9+ named cards in a 2-col grid with 1:1 aspect ratio | VERIFIED | `app/components/DashboardCards.tsx:96` — `grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3`. `app/components/EmberGlass/GlassCard.tsx:31` — `aspectRatio: '1 / 1'`. 10 cards imported (`DashboardCards.tsx:4-13`) covering Stove, Climate, Lights, Sonos, Weather, Camera, Network, Raspi, Tuya, Dirigera. |
| SC-2 | Each card matches its content spec | VERIFIED | All 10 card files implement the spec. Stove: `useStoveData` + FlameViz + "Fiamma N · Ventola N" / "Spenta" (StoveCard.tsx:76,95). Climate: ≤4 zones + "N di M attive" (ClimateCard.tsx:59,113). Lights: ≤4 on-light names + StatusDot + "+ altre N" + "Spente" empty + header InlineToggle (LightsCard.tsx:92-118,137). Sonos: ≤4 groups + PlayingBars + "N in riprod." / "In pausa" (SonosCard.tsx:51,63,86). Weather: temp + city + condition + hi/lo (WeatherCard.tsx:25,33-58). Camera: snapshot img + LIVE pill + name·meta (CameraCard.tsx:44-67,86,102). Network: down Mbps + up + device count (NetworkCard.tsx:32-34,65,70). Raspi: 2-stat MiniStat grid + CPU temp footer (RaspiCard.tsx:48-52). Tuya: ≤4 names + W/kW header + "N di M accese" footer + NO inline toggle (TuyaCard.tsx:32-33,71,91). Dirigera: same shape, A-02 empty list documented (DirigeraCard.tsx:50-51,84). |
| SC-3 | Tap → sheet opens; Weather + Raspi read-only | VERIFIED | 8 interactive cards pass `onOpen={() => setOpen(true)}` to `<GlassCard>` (Stove:52, Climate:80, Lights:79, Sonos:69, Camera:71, Network:39, Tuya:60, Dirigera:70). `WeatherCard.tsx:33` and `RaspiCard.tsx:32` render `<GlassCard>` WITHOUT `onOpen` — `GlassCard.tsx:83-93` only wraps in `<Pressable>` when `onOpen` is provided. |
| SC-4 | Stagger preserved | VERIFIED | `DashboardCards.tsx:104-105` — `className="animate-spring-in transition-all duration-300 ease-out"` + `style={{ animationDelay: \`${flatIndex * 100}ms\` }}`. v9.0 initialDelay pattern present. |
| SC-5 | React Compiler health unchanged | VERIFIED | `grep -rEn "^[^*/]*\\b(useMemo\|useCallback)\\(" app/components/EmberGlass/cards/` → 0 matches across 10 production card files (D-28 discipline upheld). Also 0 matches across all of `app/components/EmberGlass/`. Healthcheck CLI run routed to human (SC-5 names the tool explicitly). |

### Observable Truths (DASH-01..DASH-12)

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| DASH-01 | 2-col 1:1 square card grid | VERIFIED | `DashboardCards.tsx:96` `grid-cols-2`; `GlassCard.tsx:31` `aspectRatio: '1 / 1'`. 10 cards in CARD_COMPONENTS registry. |
| DASH-02 | StoveCard: temp + FlameViz + "Fiamma N · Ventola N" / "Spenta" | VERIFIED | `StoveCard.tsx:76` `<FlameViz on={isAccesa} intensity=…>`; line 95 `Fiamma ${powerLevel} · Ventola ${fanLevel}` / `'Spenta'`. A-01 deviation logged (no °C — power_level is dimensionless). |
| DASH-03 | ClimateCard: ≤4 zones + "N di M attive" | VERIFIED | `ClimateCard.tsx:59` `slice(0, 4)`; line 113 `${activeCount} di ${totalCount} attive`. StatusDot per zone (line 96), name resolution helper (line 45). |
| DASH-04 | LightsCard: ≤4 on-lights + dots + +N + Spente + header toggle | VERIFIED | `LightsCard.tsx:92` `slice(0, 4)`; line 110 `+ altre ${onLights.length - 4}`; lines 129-141 `Spente / ${totalLights} disponibili`; lines 67-75 `<InlineToggle>` with D-17 stopPropagation. |
| DASH-05 | SonosCard: ≤4 groups + PlayingBars + "N in riprod."/"In pausa" | VERIFIED | `SonosCard.tsx:51` `slice(0, 4)`; line 63 `${playingCount} in riprod.` / `'In pausa'`; line 86 `<PlayingBars />` for playing groups. Track title rendered (line 116). |
| DASH-06 | WeatherCard: temp + city + condition + hi/lo (read-only) | VERIFIED | `WeatherCard.tsx:53-54` 40px temp; line 29 city; line 58 `${condition} · ↑${high}° ↓${low}°`. No `onOpen`, no `<Pressable>`, no Sheet (read-only). |
| DASH-07 | CameraCard: preview + LIVE badge + source label | VERIFIED | `CameraCard.tsx:86-91` `<img>` snapshot; lines 44-67 LIVE pill (`#ff4d5c` 6×6 dot + `pulse 1.6s` + 10px caps); line 102 `${cam.name} · ${meta}`. A-06 documented. |
| DASH-08 | NetworkCard: down Mbps + up + device count | VERIFIED | `NetworkCard.tsx:65-67` 22px down + Mbps↓; line 70 `${up} Mbps ↑ · ${deviceCount} dispositivi`. WAN status dot (lines 34-44). |
| DASH-09 | RaspiCard: 2-stat MiniStat (CPU/RAM) + temp footer | VERIFIED | `RaspiCard.tsx:48-49` `<MiniStat label="CPU"…/>` + `<MiniStat label="RAM"…/>`; line 52 `CPU temp ${temp ?? '—'}°C`. Read-only (no `onOpen`). |
| DASH-10 | TuyaCard: ≤4 names + W/kW header + "N di M accese" — no inline toggles | VERIFIED | `TuyaCard.tsx:71` `slice(0, 4)`; line 32 `formatPower` (W ≥1000 → kW); line 91 `${onCount} di ${list.length} accese`; `grep -E "role=\"switch\"" TuyaCard.tsx DirigeraCard.tsx` → 0. Header right slot is read-only `<div>` (line 44), not a toggle. |
| DASH-11 | Tap → sheet for interactive cards; Weather/Raspi read-only | VERIFIED | 8 cards mount adjacent `<Sheet open={open} onClose={…}>` with `<SheetPlaceholderBody phase="178" device="…"/>`. WeatherCard.tsx + RaspiCard.tsx have NO `<Sheet>` mount, NO `useState` for open. Smoke spec covers all 10 (lines 222-242). |
| DASH-12 | Stagger preserved + React Compiler discipline | VERIFIED | `DashboardCards.tsx:104-105` `animate-spring-in` + `animationDelay: ${flatIndex * 100}ms`. RC sentinel grep: 0 useMemo/useCallback in `app/components/EmberGlass/cards/`. |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/DashboardCards.tsx` | 2-col grid, 10-card registry, stagger | VERIFIED | 117 lines. Imports 10 cards from EmberGlass, GlassCardSkeleton fallback, error boundaries, Suspense. `splitIntoColumns` removed. |
| `app/components/EmberGlass/GlassCard.tsx` | Square base + onOpen→Pressable wrap | VERIFIED | 99 lines. `aspectRatio: '1 / 1'`. Pressable wrap conditional on `onOpen`. data-testid passthrough. |
| `app/components/EmberGlass/cards/StoveCard.tsx` | DASH-02 | VERIFIED | 105 lines. FlameViz + power_level readout + Fiamma/Ventola/Spenta. Sheet wired. |
| `app/components/EmberGlass/cards/ClimateCard.tsx` | DASH-03 | VERIFIED | 122 lines. Zones, mode pill, attive footer. resolveRoomName fallback. |
| `app/components/EmberGlass/cards/LightsCard.tsx` | DASH-04 | VERIFIED | 151 lines. InlineToggle header + ≤4 list + overflow + empty state. D-17 stopPropagation. |
| `app/components/EmberGlass/cards/SonosCard.tsx` | DASH-05 | VERIFIED | 130 lines. PlayingBars + count copy + track titles. |
| `app/components/EmberGlass/cards/WeatherCard.tsx` | DASH-06 read-only | VERIFIED | 64 lines. No `onOpen`, no Sheet. |
| `app/components/EmberGlass/cards/CameraCard.tsx` | DASH-07 | VERIFIED | 112 lines. LIVE pill + img snapshot + name·meta. A-06 documented. |
| `app/components/EmberGlass/cards/NetworkCard.tsx` | DASH-08 | VERIFIED | 80 lines. Down/up + device count + WAN dot. |
| `app/components/EmberGlass/cards/RaspiCard.tsx` | DASH-09 read-only | VERIFIED | 57 lines. No `onOpen`, no Sheet. 2-stat grid. |
| `app/components/EmberGlass/cards/TuyaCard.tsx` | DASH-10 | VERIFIED | 100 lines. No inline toggles, W/kW formatter. |
| `app/components/EmberGlass/cards/DirigeraCard.tsx` | DASH-10 sibling | VERIFIED | 93 lines. A-02 empty-list documented; hook still consumed for forward compat. |
| `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` | Phase 178 placeholder | VERIFIED | Per-device placeholder; tested. |
| `app/components/EmberGlass/index.ts` | Barrel exports | VERIFIED | All 10 cards + 7 primitives + Sheet/Pressable + AmbientBg + GlassCardSkeleton + SheetPlaceholderBody re-exported. |
| `lib/services/unifiedDeviceConfigService.ts` | A-03 fix (Sonos visible) | VERIFIED | `hasHomepageCard` → always returns `true` (lines 71-73). |
| `tests/smoke/dashboard-glass-cards.spec.ts` | DASH-01..DASH-12 E2E | VERIFIED | 253 lines, 5 named tests + 10 parametrized. Maps every DASH ID. Authored to disk; runtime deferred per 177-08 SUMMARY. |

### Key Link Verification (Wiring)

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| DashboardCards | 10 EmberGlass cards | named imports + CARD_COMPONENTS registry | WIRED | `DashboardCards.tsx:4-13,23-34`. |
| Each interactive card | Sheet primitive | `<Sheet open={open} onClose={…}>` | WIRED | StoveCard:99, ClimateCard:116, LightsCard:145, SonosCard:124, CameraCard:106, NetworkCard:74, TuyaCard:94, DirigeraCard:87. |
| Each interactive card | Pressable | `<GlassCard onOpen={…}>` (GlassCard wraps in Pressable) | WIRED | 8 cards pass `onOpen`; GlassCard.tsx:83-93 wraps in `<Pressable>`. |
| WeatherCard / RaspiCard | (no Pressable) | omits `onOpen` | WIRED (negative) | WeatherCard:33, RaspiCard:32 — `<GlassCard>` without `onOpen`. SC-#3 satisfied. |
| Cards | Domain hooks | useStoveData, useThermostatData, useLightsData, useSonosFullData, useCameraData, useNetworkData, useRaspiData, useTuyaData, useDirigeraData, useWeatherSummary | WIRED | Verified per-card. Real proxy types respected (e.g. SonosCard uses `coordinator_name` + `transport_state`). |
| LightsCard header | useLightsCommands.handleAllLightsToggle | InlineToggle.onChange + e.stopPropagation | WIRED | Lines 67-75. D-17 stop-propagation present. |
| `lib/services/unifiedDeviceConfigService.ts` | DashboardCards | `getVisibleDashboardCards(deviceConfig)` | WIRED | `DashboardCards.tsx:80`. `hasHomepageCard()` always-true unblocks Sonos (A-03). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| StoveCard | `stove.powerLevel/fanLevel/isAccesa` | `useStoveData({ checkVersion, userId })` | Yes (existing v17.0 WS+poll hook) | FLOWING |
| ClimateCard | `status.rooms`, `topology.rooms` | `useThermostatData()` | Yes | FLOWING |
| LightsCard | `lightsData.lights` | `useLightsData()` | Yes | FLOWING |
| SonosCard | `data.zones`, `data.playback` | `useSonosFullData()` | Yes | FLOWING |
| WeatherCard | `temp, city, condition, high, low` | `useWeatherSummary()` (Plan 177-02) | Yes | FLOWING |
| CameraCard | `cameras[0]`, `lastUpdatedAt` | `useCameraData()` | Yes | FLOWING |
| NetworkCard | `network.bandwidth`, `network.devices`, `network.wan` | `useNetworkData()` | Yes | FLOWING |
| RaspiCard | `data.cpuPercent`, `data.memoryPercent`, `data.cpuTemperature` | `useRaspiData()` | Yes | FLOWING |
| TuyaCard | `plugs` | `useTuyaData()` | Yes | FLOWING |
| DirigeraCard | (empty list) | `useDirigeraData()` consumed for forward-compat | KNOWN-EMPTY | STATIC by design (A-02 — proxy exposes only sensors today). Documented and accepted in CONTEXT.md. |

DirigeraCard is intentionally STATIC pending future plug data in the DIRIGERA proxy. This is documented (A-02) and not a regression.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Phase 177 production files compile clean | `npx tsc --noEmit` (filtered to EmberGlass + DashboardCards + cards/) | 0 errors | PASS |
| EmberGlass jest tests pass | `npm run test:components -- --testPathPatterns='EmberGlass'` | 25 suites, 153 tests, all passing in 21s | PASS |
| RC sentinel grep | `grep -rEn "^[^*/]*\\b(useMemo\|useCallback)\\(" app/components/EmberGlass/cards/` | 0 matches | PASS |
| RC sentinel grep (whole EmberGlass dir) | `grep -rEn "…(useMemo\|useCallback)\\(" app/components/EmberGlass/` (excl __tests__) | 0 matches | PASS |
| Sonos visibility (A-03) | `grep -nA2 "function hasHomepageCard"` | returns `true` unconditionally | PASS |
| splitIntoColumns removed from dashboard | `grep -c "splitIntoColumns" app/components/DashboardCards.tsx` | 0 | PASS |
| Stagger animation present | `grep -c "animate-spring-in" app/components/DashboardCards.tsx` | 2 (className + comment) | PASS |
| animationDelay present | `grep -c "animationDelay" app/components/DashboardCards.tsx` | 3 | PASS |
| GlassCardSkeleton wired | `grep -c "GlassCardSkeleton" app/components/DashboardCards.tsx` | 4 | PASS |
| All 10 cards have data-testid | `grep -lE "data-testid=\"…-card\"" cards/*.tsx` | 10 files matched | PASS |
| Smoke spec exists | `ls tests/smoke/dashboard-glass-cards.spec.ts` | EXISTS, 253 lines | PASS |
| Read-only cards lack Pressable wrapping | WeatherCard + RaspiCard: no `<Pressable>`, no `onClick`, no `onOpen` on GlassCard | Confirmed | PASS |
| TuyaCard / DirigeraCard have no role="switch" | grep | 0 each | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DASH-01 | 177-01, 177-07 | 2-col 1:1 grid | SATISFIED | DashboardCards:96 + GlassCard:31. Smoke DASH-01 test (line 182). |
| DASH-02 | 177-03 | StoveCard | SATISFIED | StoveCard.tsx + jest (`StoveCard.test.tsx`) + smoke. |
| DASH-03 | 177-03 | ClimateCard | SATISFIED | ClimateCard.tsx + jest + smoke. |
| DASH-04 | 177-04 | LightsCard | SATISFIED | LightsCard.tsx + jest + smoke. |
| DASH-05 | 177-04, 177-02, 177-07 | SonosCard + A-03 fix | SATISFIED | SonosCard.tsx + PlayingBars + hasHomepageCard fix. |
| DASH-06 | 177-05, 177-02 | WeatherCard + useWeatherSummary | SATISFIED | WeatherCard.tsx + useWeatherSummary hook. |
| DASH-07 | 177-05 | CameraCard | SATISFIED | CameraCard.tsx + jest + smoke. |
| DASH-08 | 177-05 | NetworkCard | SATISFIED | NetworkCard.tsx + jest + smoke. |
| DASH-09 | 177-06 | RaspiCard read-only | SATISFIED | RaspiCard.tsx (no onOpen, no Sheet) + jest + smoke. |
| DASH-10 | 177-06 | TuyaCard + DirigeraCard, no inline toggles | SATISFIED | TuyaCard.tsx + DirigeraCard.tsx; 0 role="switch"; smoke. |
| DASH-11 | 177-01 (GlassCard onOpen), 177-03..06 (per-card Sheet), 177-07 (orchestration) | Tap → sheet; Weather/Raspi exempt | SATISFIED | 8 cards wire `<Sheet>` + `onOpen`; WeatherCard + RaspiCard omit; smoke covers both polarities. |
| DASH-12 | 177-07, 177-08 | Stagger + RC discipline | SATISFIED | animate-spring-in + animationDelay flatIndex*100ms; 0 useMemo/useCallback in cards/. |

No orphaned requirements. All 12 DASH IDs mapped to plan(s) and verified.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | — | — | All 10 card files RC-clean, no TODO/FIXME, no placeholders, no empty implementations. |

`SheetPlaceholderBody` is intentional (not a stub) — Phase 178 swaps real sheet bodies in. Documented in CONTEXT.md D-13.

### Deviations & Acceptances

| Deviation | Rationale | Source |
|-----------|-----------|--------|
| A-01: StoveCard omits °C superscript | Thermorossi proxy exposes power_level (1..5 dimensionless), not temperature. Rendering °C on a power level would be a semantic lie. | StoveCard.tsx:11-18, CONTEXT.md |
| A-02: DirigeraCard renders empty list | `useDirigeraData()` exposes sensors only, not plugs, in current proxy. Hook still consumed for forward-compat. | DirigeraCard.tsx:9-15, CONTEXT.md |
| A-03: hasHomepageCard always true | Original gate hid Sonos card by default; flipped to true so every device with a registered CARD_COMPONENT is dashboard-eligible. | unifiedDeviceConfigService.ts:71-73, 177-07 SUMMARY |
| A-06: CameraCard uses bare `<img>` | /api/camera/snapshot/{id} returns 302 redirect to transient WiNet URL, incompatible with `next/image` remotePatterns. eslint-disable per-line documented. | CameraCard.tsx:85-90 |
| Original PLAN-08 executor agent disconnected mid-run | Spec file was authored to worktree disk; orchestrator transferred to main and committed (`550ba0c8`). Single-commit landing for plan 08. | 177-08-SUMMARY.md "Notes" |
| Pre-existing tsc errors in `app/debug/__tests__` and `app/network/__tests__` | Unrelated to Phase 177 surface (no Phase 177 file edits these). | deferred-items.md |

All deviations are documented at the source and align with locked CONTEXT decisions D-01..D-32.

### Human Verification Required

7 items requiring human testing — see frontmatter `human_verification` array.

These cover visual aspect-ratio rendering, perceived stagger smoothness, live tap → sheet UX, read-only-card press behavior, master-toggle stop-propagation feel, React Compiler healthcheck CLI run, and live confirmation of Sonos default visibility (A-03).

### Gaps Summary

**No programmatic gaps.** All 12 DASH requirements have file-level evidence and pass behavioral spot-checks. All 5 ROADMAP success criteria are verified at the codebase level. The only items routed to human are inherently visual / runtime (smoke spec runtime, RC healthcheck CLI, perceived feel) — these are not implementation gaps but verification class boundaries.

**Status rationale:** `human_needed` (not `passed`) because Step 9 of the verification process requires `human_needed` whenever the human-verification section is non-empty, even when programmatic score is N/N. This matches the orchestrator contract: SC-#3 + SC-#4 + SC-#5 each have a non-trivial visual/runtime dimension that grep alone cannot close.

---

_Verified: 2026-04-29_
_Verifier: Claude (gsd-verifier)_
