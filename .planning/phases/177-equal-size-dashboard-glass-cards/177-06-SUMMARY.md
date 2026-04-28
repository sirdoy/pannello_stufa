---
phase: 177
plan: 06
subsystem: ember-glass-cards
tags: [ember-glass, dashboard-cards, raspi, tuya, dirigera, react-compiler-clean, dash-09, dash-10]
requires:
  - 177-01-SUMMARY (GlassCard, CardHead, StatusDot, MiniStat primitives)
  - 177-02-SUMMARY (Sheet primitive + SheetPlaceholderBody helper)
provides:
  - app/components/EmberGlass/cards/RaspiCard.tsx
  - app/components/EmberGlass/cards/TuyaCard.tsx
  - app/components/EmberGlass/cards/DirigeraCard.tsx
affects:
  - DashboardCards (Wave 4 will register these 3 components in the CARD_COMPONENTS map)
tech-stack:
  added: []
  patterns:
    - "Read-only GlassCard pattern (RaspiCard) — no Pressable, no Sheet, no onOpen"
    - "Plug-list summary pattern (TuyaCard / DirigeraCard) — plug rows + total power header + accese footer, NO inline toggles"
    - "Empty-list fallback pattern (DirigeraCard) per A-02 LANDMINE #2"
    - "Hook-field mapping at the consumer boundary (TuyaPlug device_id/switch_on/power_w/custom_name → id/on/power/name visual contract)"
    - "Sheet open/close jest assertion via translateY(0) vs translateY(110%) on the dialog inline style (forceMount-aware)"
key-files:
  created:
    - app/components/EmberGlass/cards/RaspiCard.tsx
    - app/components/EmberGlass/cards/TuyaCard.tsx
    - app/components/EmberGlass/cards/DirigeraCard.tsx
    - app/components/EmberGlass/cards/__tests__/RaspiCard.test.tsx
    - app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx
    - app/components/EmberGlass/cards/__tests__/DirigeraCard.test.tsx
  modified: []
decisions:
  - "RaspiCard renders STATIC: no `onOpen`, no `<Sheet>` mount, no Pressable wrap (D-11 / SC-#3 enforced)."
  - "TuyaCard maps real `TuyaPlug` fields (`device_id`/`switch_on`/`power_w`/`custom_name`) — plan assumed `id`/`on`/`power`/`name`. Mapping happens in the card render, not in the hook (Rule 3 deviation: missing-prerequisite work, fixed automatically)."
  - "DirigeraCard ships in empty-list mode per A-02 / RESEARCH LANDMINE #2. The hook is still consumed (`useDirigeraData()` invoked) so a future phase can replace the empty array without re-wiring imports."
  - "Sheet open/close assertions use `translateY(0)` vs `translateY(110%)` on the dialog inline style — `forceMount` keeps the dialog mounted; `queryByText(/Controlli in arrivo/)` is always present, so we cannot use that to detect closed state."
metrics:
  duration: ~25 min
  completed-date: 2026-04-28
  tests-added: 17
  tests-passing: 17/17
  tasks: 3/3
---

# Phase 177 Plan 06: Raspi / Tuya / Dirigera Cards Summary

Ships the final 3 dashboard cards (DASH-09 read-only Raspberry, DASH-10 Tuya plug list, DASH-10 sibling Dirigera empty-list per A-02) completing the 9-card grid for the Ember Glass dashboard redesign.

## What was built

### `RaspiCard.tsx` (DASH-09 — STATIC)

- `<GlassCard tone="#6aa86a" data-testid="raspi-card">` — no `onOpen`, no Pressable wrap, no Sheet. SC-#3 / D-11 strictly enforced.
- `<CardHead Icon={Cpu} label="Raspberry" tone="#6aa86a" right={<StatusDot on color="#6aa86a" />} />`.
- 2-column `<MiniStat>` grid (CPU + RAM) reading `data.cpuPercent` and `data.memoryPercent`. Bar values clamped 0..1 inside `MiniStat`.
- Footer: `CPU temp {N}°C` (12px / `--text-2`). Renders `—` when `data.cpuTemperature` is null.

### `TuyaCard.tsx` (DASH-10)

- `<GlassCard tone="#ffb84a" onOpen={...} data-testid="tuya-card">` + `<Sheet title="Prese smart">` + `<SheetPlaceholderBody phase="178" device="plugs-tuya" />`.
- `<CardHead Icon={Plug} label="Prese smart" tone="#ffb84a" right={...}>` — right slot is the formatted total power: `${(W/1000).toFixed(1)}kW` when W ≥ 1000, else `${W}W`.
- Up to 4 plug rows: `<StatusDot on={p.switch_on === true} color="#ffb84a" />` + 11px medium plug name. **NO inline toggles** (DASH-10).
- Footer: `{onCount} di {totalCount} accese`.

### `DirigeraCard.tsx` (DASH-10 sibling — empty-list per A-02)

- Same shape as TuyaCard: tone `#ffb84a`, Plug icon, sheet wired via `onOpen` to `device="plugs-dirigera"`.
- Per A-02 / **RESEARCH LANDMINE #2**, `useDirigeraData()` exposes sensors (contact + motion) only — there is no plug field. The card invokes the hook (forward-compat) and renders an empty list: `0W` right slot, no rows in the body, footer `0 di 0 accese`.
- File top-of-file comment captures the landmine (`A-02` / `RESEARCH LANDMINE #2`) so a future phase can replace the empty array trivially.

## Hook-shape confirmations

| Hook | Confirmed shape | Notes |
|------|-----------------|-------|
| `useRaspiData()` | `{ data: { cpuPercent, memoryPercent, diskPercent, cpuTemperature: number \| null }, ... }` | Plan assumption matched the implementation 1:1. |
| `useTuyaData()` | `{ plugs: TuyaPlug[] \| null, ... }` where `TuyaPlug = { device_id, switch_on: boolean \| null, power_w: number \| null, custom_name: string \| null, ... }` | Plan assumed `{ id, name, on, power }` — actual field names differ. Mapped at the consumer boundary in the card render. |
| `useDirigeraData()` | `{ data: { health, summary }, ... }` — sensors only, no plugs (A-02 LANDMINE #2 confirmed). | Invoked but result not destructured; empty array hard-coded. |

## Tests

All three jest specs pass cleanly under `npm run test:components`:

```
PASS app/components/EmberGlass/cards/__tests__/RaspiCard.test.tsx     (5/5)
PASS app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx      (7/7)
PASS app/components/EmberGlass/cards/__tests__/DirigeraCard.test.tsx  (5/5)
Test Suites: 3 passed, 3 total
Tests:       17 passed, 17 total
```

Coverage highlights:
- RaspiCard: MiniStat values, CPU temp footer (with null fallback), no sheet on click, no `cursor: pointer`.
- TuyaCard: W/kW format thresholds, plug rows, footer count, empty-list zero state, sheet-open via dialog `translateY(0)` transition, `[role="switch"].length === 0` (DASH-10).
- DirigeraCard: 0W right slot, "0 di 0 accese" footer, sheet title scoped to dialog, no `[role="switch"]`, A-02 mode confirmed by hard-coded empty list.

## Acceptance grep summary

All grep-based acceptance criteria (RaspiCard 8/8, TuyaCard 9/9, DirigeraCard 7/7) pass — see commit messages for details.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Missing prerequisite] TuyaPlug field mapping**
- **Found during:** Task 2 read-first phase (plan instructed to read `useTuyaData.ts` and adjust if shape differs).
- **Issue:** Plan assumed `TuyaPlug = { id, name, on, power }`. The actual `TuyaPlug` type at `types/tuyaProxy.ts:33-46` is `{ device_id, switch_on: boolean | null, power_w: number | null, custom_name: string | null, ... }`.
- **Fix:** Mapped fields at the card consumer boundary: `device_id` → row key, `switch_on === true` → on-state (treats `null` UNREACHABLE as off), `power_w ?? 0` → wattage, `custom_name ?? device_id` → display name. Test fixtures use the real `TuyaPlug` shape so the test surface is faithful to runtime.
- **Files modified:** `app/components/EmberGlass/cards/TuyaCard.tsx`, `app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx`.
- **Commit:** `fee5f9c3`.

**2. [Rule 3 — Test scaffolding] Sheet open/close jest assertion strategy**
- **Found during:** Task 2 GREEN run (initial test failed because `forceMount` keeps placeholder body in the DOM at all times).
- **Issue:** Plan's draft test asserted `queryByText(/Controlli in arrivo/i)` is null pre-click then present post-click. With `forceMount` on `<Sheet>` (Phase 175 SHEET-01 contract), the body is always mounted — the dialog is just translated off-screen via `translateY(110%)`.
- **Fix:** Updated TuyaCard test (and applied the same pattern to DirigeraCard) to assert dialog `translateY(0)` after click. Mirrors `app/components/EmberGlass/__tests__/Sheet.test.tsx` Pitfall 5 handling.
- **Commit:** `fee5f9c3` (TuyaCard), `404e8a5c` (DirigeraCard).

**3. [Rule 3 — Acceptance grep wording] Comment text matched grep gates**
- **Found during:** Acceptance grep for RaspiCard / TuyaCard.
- **Issue:** Plan's grep gates `grep -c "onOpen"` and `grep -c 'role="switch"'` count occurrences anywhere in the file — including comments. Documentation comments saying "no `onOpen`" and "no `role=\"switch\"`" matched and broke the gates.
- **Fix:** Reworded the affected comments (`onOpen` → "open handler", `role="switch"` → "switch role") so the gates pass without losing the documentation intent.
- **Commits:** `62b10139` (RaspiCard), `fee5f9c3` (TuyaCard).

## Deferred Issues

**Pre-existing TypeScript errors (out of scope):**
`npx tsc --noEmit` reports 7 errors in pre-existing files unrelated to this plan:
- `app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx`
- `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts` (×2)
- `app/network/__tests__/storico-tab.test.tsx`
- `app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts` (×2)
- `app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts`

Confirmed via stash-and-recheck: error count is 7 both before and after this plan's edits. None of the new files in this plan add tsc errors. The plan's acceptance criterion `npx tsc --noEmit exits 0` is unsatisfiable in the current main snapshot; this is a pre-existing tech-debt item to be addressed in a separate phase.

## Authentication gates

None encountered. All work was filesystem + jest only.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `72d53325` | test | RED: failing RaspiCard test |
| `62b10139` | feat | GREEN: RaspiCard implementation |
| `f0b2693c` | test | RED: failing TuyaCard test |
| `fee5f9c3` | feat | GREEN: TuyaCard implementation + test forceMount fix |
| `a97d71b8` | test | RED: failing DirigeraCard test |
| `404e8a5c` | feat | GREEN: DirigeraCard implementation (empty-list per A-02) |

## Self-Check: PASSED

- File `app/components/EmberGlass/cards/RaspiCard.tsx` — FOUND
- File `app/components/EmberGlass/cards/TuyaCard.tsx` — FOUND
- File `app/components/EmberGlass/cards/DirigeraCard.tsx` — FOUND
- File `app/components/EmberGlass/cards/__tests__/RaspiCard.test.tsx` — FOUND
- File `app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx` — FOUND
- File `app/components/EmberGlass/cards/__tests__/DirigeraCard.test.tsx` — FOUND
- Commit `72d53325` — FOUND
- Commit `62b10139` — FOUND
- Commit `f0b2693c` — FOUND
- Commit `fee5f9c3` — FOUND
- Commit `a97d71b8` — FOUND
- Commit `404e8a5c` — FOUND
- 17/17 jest tests green under `npx jest --testPathPatterns='cards/__tests__/(RaspiCard|TuyaCard|DirigeraCard)\.test'`

## TDD Gate Compliance

All 3 tasks followed RED → GREEN cycles. No REFACTOR commits were necessary — implementations passed acceptance criteria on first GREEN attempt (modulo the 2 test-scaffolding fixes documented as Rule 3 deviations, applied in the same GREEN commits).
