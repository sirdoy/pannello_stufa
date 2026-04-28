---
phase: 177
slug: equal-size-dashboard-glass-cards
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-28
revised: 2026-04-28
---

# Phase 177 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + Playwright (smoke) |
| **Config file** | `jest.config.js`, `playwright.config.ts` |
| **Quick run command** | `npm run test:changed` |
| **Full suite command** | `npm run test:components -- --testPathPattern='EmberGlass\|DashboardCards'` |
| **Estimated runtime** | ~30s scoped, ~3min full components |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:changed`
- **After every plan wave:** Run `npm run test:components -- --testPathPattern='EmberGlass\|DashboardCards'`
- **Before `/gsd-verify-work`:** Full scoped suites must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-T1 | 177-01 | 1 | DASH-01 | T-177-01 | N/A (UI-only) | unit | `npm run test:components -- --testPathPattern='EmberGlass/__tests__/(GlassCard\|CardHead\|StatusDot)\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 01-T2 | 177-01 | 1 | DASH-04, DASH-05, DASH-12 | T-177-01 | N/A | unit | `npm run test:components -- --testPathPattern='EmberGlass/__tests__/(MiniStat\|InlineToggle\|PlayingBars)\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 02-T1 | 177-02 | 1 | DASH-12 | T-177-02 | N/A | unit | `npm run test:components -- --testPathPattern='EmberGlass/__tests__/GlassCardSkeleton\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 02-T2 | 177-02 | 1 | DASH-11 | T-177-02 | N/A | unit | `npm run test:components -- --testPathPattern='EmberGlass/cards/__tests__/SheetPlaceholderBody\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 03-T1 | 177-03 | 2 | DASH-02, DASH-11 | T-177-03 | N/A | unit | `npm run test:components -- --testPathPattern='cards/__tests__/StoveCard\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 03-T2 | 177-03 | 2 | DASH-03, DASH-11 | T-177-03 | N/A | unit | `npm run test:components -- --testPathPattern='cards/__tests__/ClimateCard\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 04-T1 | 177-04 | 2 | DASH-04, DASH-11 | T-177-04 | Tampering — accept (existing X-API-Key auth) | unit | `npm run test:components -- --testPathPattern='cards/__tests__/LightsCard\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 04-T2 | 177-04 | 2 | DASH-05, DASH-11 | T-177-04 | N/A | unit | `npm run test:components -- --testPathPattern='cards/__tests__/SonosCard\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 05-T1 | 177-05 | 2 | DASH-06, DASH-07 | T-177-05 | N/A | unit | `npm run test:components -- --testPathPattern='cards/__tests__/(WeatherCard\|CameraCard)\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 05-T2 | 177-05 | 2 | DASH-08, DASH-11 | T-177-05 | N/A | unit | `npm run test:components -- --testPathPattern='cards/__tests__/NetworkCard\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 06-T1 | 177-06 | 2 | DASH-09 | T-177-06 | N/A | unit | `npm run test:components -- --testPathPattern='cards/__tests__/RaspiCard\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 06-T2 | 177-06 | 2 | DASH-10, DASH-11 | T-177-06 | N/A | unit | `npm run test:components -- --testPathPattern='cards/__tests__/(TuyaCard\|DirigeraCard)\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 07-T1 | 177-07 | 3 | DASH-01, DASH-12 | T-177-07 | N/A | component | `npm run test:components -- --testPathPattern='__tests__/DashboardCards\.test'` | ⬜ pre-Wave-0 | ⬜ pending |
| 07-T2 | 177-07 | 3 | DASH-11 | T-177-07 | N/A | manual+grep | `grep -c "useMemo\|useCallback" app/components/DashboardCards.tsx` returns `0` | ⬜ pre-Wave-0 | ⬜ pending |
| 08-T1 | 177-08 | 4 | DASH-01..DASH-12 | T-177-08 | N/A | smoke (Playwright) | `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts` | ⬜ pre-Wave-0 | ⬜ pending |
| 08-T2 | 177-08 | 4 | DASH-12 | T-177-08 | N/A | grep + jest | `grep -RE "useMemo\|useCallback" app/components/EmberGlass/ app/components/DashboardCards.tsx \| grep -v '__tests__/' \| wc -l` returns `0` | ⬜ pre-Wave-0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 ships the test scaffolding referenced by the `<verify><automated>` blocks above. Files created by Plans 01 + 02 + 07 (in-plan TDD) cover all primitives + per-card stubs:

**Plan 01 — Glass primitives (Wave 1, in-plan TDD):**
- [ ] `app/components/EmberGlass/__tests__/GlassCard.test.tsx` — 1:1 aspect-ratio + outer footprint assertions (DASH-01)
- [ ] `app/components/EmberGlass/__tests__/CardHead.test.tsx` — title + status dot + right-slot composition
- [ ] `app/components/EmberGlass/__tests__/StatusDot.test.tsx` — accent color + glow ring
- [ ] `app/components/EmberGlass/__tests__/MiniStat.test.tsx` — 36px font weight + unit suffix
- [ ] `app/components/EmberGlass/__tests__/InlineToggle.test.tsx` — onChange + stopPropagation contract (DASH-04)
- [ ] `app/components/EmberGlass/__tests__/PlayingBars.test.tsx` — 3-bar animation + reduced-motion fallback (DASH-05, A-04)

**Plan 02 — Foundation skeleton + sheet placeholder (Wave 1, in-plan TDD):**
- [ ] `app/components/EmberGlass/__tests__/GlassCardSkeleton.test.tsx` — shimmer mask + 1:1 footprint
- [ ] `app/components/EmberGlass/cards/__tests__/SheetPlaceholderBody.test.tsx` — `Controlli in arrivo` copy + phase-178 marker
- [ ] `app/components/devices/weather/hooks/__tests__/useWeatherSummary.test.ts` — pure-function summary derivation

**Plans 03–06 — Per-card specs (Wave 2, in-plan TDD):**
- [ ] `app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx` — DASH-02, A-01 no-°C assertion
- [ ] `app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx` — DASH-03, D-16 topology fallback (3 fixture variants)
- [ ] `app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx` — DASH-04, true→false flip on `handleAllLightsToggle(false)`
- [ ] `app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx` — DASH-05, PlayingBars per-row
- [ ] `app/components/EmberGlass/cards/__tests__/WeatherCard.test.tsx` — DASH-06
- [ ] `app/components/EmberGlass/cards/__tests__/CameraCard.test.tsx` — DASH-07, A-06 bare-img usage
- [ ] `app/components/EmberGlass/cards/__tests__/NetworkCard.test.tsx` — DASH-08
- [ ] `app/components/EmberGlass/cards/__tests__/RaspiCard.test.tsx` — DASH-09 (read-only, no sheet)
- [ ] `app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx` — DASH-10
- [ ] `app/components/EmberGlass/cards/__tests__/DirigeraCard.test.tsx` — DASH-10, A-02 empty list

**Plan 07 — Dashboard integration (Wave 3, in-plan TDD):**
- [ ] `app/components/__tests__/DashboardCards.test.tsx` — 2-col grid + 9-card render order + stagger flatIndex (DASH-01, DASH-12)

**Plan 08 — Playwright smoke (Wave 4):**
- [ ] `tests/smoke/dashboard-glass-cards.spec.ts` — 6+ DASH-* tests, beforeEach mocks `/api/version` + dismisses VersionEnforcer (W5 hard gate)

**Cleanup audit (per Plan 07 / 08 SUMMARY):**
- [ ] Existing `lib/utils/dashboardColumns.ts` + `__tests__/splitIntoColumns.test.ts` — confirm orphan status; flag for post-178 cleanup phase.

Each test file is created in the same plan/task that ships its production source (TDD inline) — there is no separate "Wave 0" pre-phase. The `wave_0_complete: true` flag means: every `<automated>` reference in the Per-Task Verification Map points to a file produced by the same task or by a strictly-earlier-wave task in this plan set.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| v9.0 mount stagger visible on fresh load | DASH-11 | Animation timing — flaky in jsdom; visual judgment | Hard-reload `/`, observe each card fade-in delayed by initialDelay; record screen capture if regression suspected. |
| React Compiler: zero new opt-outs | DASH-12 | `react-compiler-healthcheck` CLI not installed; substitute is grep-based | Run `grep -RE "useMemo\|useCallback" app/components/EmberGlass/ app/components/cards/ \| wc -l` — must be 0 (or unchanged from baseline). |
| 1:1 aspect ratio + identical outer footprint | DASH-01 | Visual + DOM snapshot on real viewport | Open DevTools at 360x800, inspect each card, confirm `aspect-ratio: 1 / 1` and matching `clientWidth × clientHeight`. |
| Tap-to-open opens correct Sheet (Phase 178 contract) | DASH-03 | Phase 178 not yet executed; placeholder Sheet body acceptable | Tap each card; confirm Sheet opens for non-readonly cards (Stove/Climate/Lights/Sonos/Camera/Network/Tuya/Dirigera); confirm Weather + Raspi do NOT open. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — populated in Per-Task Verification Map (16 task rows)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — every task has its own grep + jest combo
- [x] Wave 0 covers all MISSING references — primitives (Plan 01/02), per-card stubs (Plans 03–06), DashboardCards (Plan 07), Playwright smoke (Plan 08)
- [x] No watch-mode flags — all commands use `npm run test:components` / `test:unit` scoped patterns
- [x] Feedback latency < 60s — scoped patterns return in ~10–30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
