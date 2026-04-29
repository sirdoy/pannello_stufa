---
phase: 178
plan: 08
subsystem: EmberGlass / Sheets
tags: [ember-glass, sheets, plugs, tuya, sheet-06]
requirements: [SHEET-06]
dependency_graph:
  requires:
    - 178-01 (sheet primitives — InlineToggle reused)
    - 178-02 (sheet body stubs — replaces PlugsSheet stub)
    - Phase 175 (Sheet primitive — host wrapper)
    - Phase 177 (TuyaCard — mounts the sheet)
  provides:
    - SHEET-06 PlugsSheet body — Tuya plugs control surface
    - 2-col summary grid (Accese + Consumo) reusable visual idiom
  affects:
    - app/components/EmberGlass/cards/TuyaCard.tsx (consumes via barrel)
    - app/components/EmberGlass/sheets/index.ts (re-exports unchanged)
tech-stack:
  added: []
  patterns:
    - "Inline-style + var(--token) (Phase 174 D-12 / 178 D-02)"
    - "Field adapter at component top (Sonos/Tuya precedent)"
    - "Optimistic InlineToggle (no per-toggle pending state)"
    - "Bundle-verbatim power formatting (2 decimals summary, 1 decimal row)"
key-files:
  created:
    - app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx
  modified:
    - app/components/EmberGlass/sheets/PlugsSheet.tsx
decisions:
  - "Drop {room} segment from per-row subtitle (Pitfall 8 / D-09 / SHEET-06 deferred deviation)"
  - "Treat power_w === null as 0 (UNREACHABLE plugs render empty subtitle even when switch_on=true)"
  - "Slugify name for stable testids; multiple identical names collide intentionally (rare in practice)"
  - "AUDIT-EXCEPTION inline rgba literals tagged where bundle-verbatim values diverge from tokens"
metrics:
  duration_seconds: 540
  task_count: 1
  file_count: 2
  completed_at: "2026-04-29T13:00:00Z"
---

# Phase 178 Plan 08: PlugsSheet Summary

**Tuya plugs control sheet (SHEET-06) — bundle-verbatim 2-col summary + per-plug list with subtitle dropping the room segment (Pitfall 8 deferred deviation).**

## What shipped

The Plan 178-02 PlugsSheet stub is replaced by a full body-only component that:

1. Renders a 2-column summary grid: **Accese** (orange tint card, `{onCount}/{total}`) and **Consumo** (neutral card, total power auto-formatted).
2. Renders a rounded 18px plug list: per row a 36×36 plug-tile (orange when `on`, neutral when off), the plug name, a subtitle, and an `<InlineToggle color="#ffb84a">`.
3. Self-fetches via `useTuyaData()` and delegates writes via `useTuyaCommands().togglePlug(deviceId, currentState)` — body-only contract per CONTEXT D-04.
4. Maps live `TuyaPlug` fields to bundle prop names: `device_id → id`, `custom_name ?? device_id → name`, `switch_on === true → on`, `typeof power_w === 'number' ? power_w : 0 → power`.
5. Drops the bundle's `{room} · {power}` subtitle segment per Pitfall 8 — the codebase has no `useDeviceRegistry()` join, and `TuyaPlug` exposes no `room` field. Subtitle reads `750W` (or `1.5kW` ≥ 1kW) when on with non-zero power, empty otherwise.
6. Loading skeleton (520px pulse block) + error state (`TriangleAlert` + `"Non raggiungibile. Riprova più tardi."` + raw error string) per D-26 / D-27.

## Power formatting (bundle verbatim)

| Where | Threshold | Format |
|-------|-----------|--------|
| Summary `Consumo` | `total ≥ 1000W` | `(total/1000).toFixed(2)` + `kW` (2 decimals) |
| Summary `Consumo` | `total < 1000W`  | `String(total)` + `W` |
| Per-row subtitle  | `power ≥ 1000W`  | `(power/1000).toFixed(1)` + `kW` (1 decimal) |
| Per-row subtitle  | `power < 1000W`  | `${power}W` |
| Per-row subtitle  | `!on || power === 0` | empty string |

## Italian copy frozen (D-23)

`Accese`, `Consumo`, `Non raggiungibile. Riprova più tardi.`. No room copy (Pitfall 8).

## Test coverage

`app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx` — 16 test cases:

1. Summary cards + 4 plug rows render with correct testids.
2. Total power < 1000W → `W` suffix, no kW conversion.
3. Total power = 1000W (boundary) → `1.00kW`.
4. Total power = 1500W → `1.50kW`.
5. Per-plug subtitle when on with `power=750` reads `750W` (no leading room name).
6. Per-plug subtitle when on with `power=1500` reads `1.5kW`.
7. Per-plug subtitle empty when off.
8. Per-plug subtitle empty when on but `power=0`.
9. Click on Frigo (on) toggle invokes `togglePlug('d-frigo', true)`.
10. Click on Lavatrice (off) toggle invokes `togglePlug('d-lava', false)`.
11. `custom_name === null` falls back to `device_id` as the row label.
12. Loading state → skeleton renders, body does not.
13. Empty `plugs[]` → `0 / 0`, consumption `0W`, both summary cards still rendered.
14. Error state → error testid + Italian copy + raw error string.
15. `power_w === null` defensively treated as 0 (UNREACHABLE plugs).
16. `Accese` and `Consumo` Italian eyebrows render.

All 16 tests pass under `npm run test:components -- app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx` (1.7s, 0 fails).

## Acceptance gates

| Gate | Result |
|------|--------|
| File `PlugsSheet.tsx` ≥ 130 LOC | 312 LOC |
| File `PlugsSheet.test.tsx` ≥ 130 LOC | 214 LOC |
| `'use client'` directive | yes |
| `useTuyaData()` AND `useTuyaCommands()` references | yes |
| `cmds.togglePlug(p.id, p.on)` invocation | yes |
| `'Accese'` AND `'Consumo'` literals | yes |
| `formatPowerSummary` (≥1000 → 2 decimals + kW; <1000 → bare + W) | yes |
| `formatPowerRow` (≥1000 → 1 decimal + kW) | yes |
| `'#ffb84a'` Tuya orange | yes |
| Field adapter uses `p.device_id`, `p.custom_name`, `p.switch_on`, `p.power_w` | yes |
| testids: `plugs-sheet`, `-count`, `-consumption`, `-plug-{slug}`, `-plug-{slug}-toggle`, `-skeleton`, `-error` | yes |
| `! grep -E "useMemo\|useCallback" PlugsSheet.tsx` | 0 hits |
| `! grep -E "p\.room\|plug\.room" PlugsSheet.tsx` | 0 hits |
| Spec ships ≥ 11 `it(` cases; exits 0 | 16 cases, exits 0 |
| `npx tsc --noEmit` clean for PlugsSheet | yes (pre-existing errors in unrelated network/debug test files only) |

## Deviations from plan

### Auto-fixed (Rule 3 — blocking environment issue)

**1. [Rule 3 — Worktree contamination] Cross-plan file picked up in feat commit**
- **Found during:** Task 1 `git commit` after `git add app/components/EmberGlass/sheets/PlugsSheet.tsx`.
- **Issue:** A parallel Plan 178-04 executor (StoveSheet GREEN) had staged `app/components/EmberGlass/sheets/StoveSheet.tsx` into the same shared `main` branch index between my Read and my commit. My commit (`3d51f710`) therefore included a 263-line StoveSheet.tsx change in addition to PlugsSheet.tsx. `branching_strategy: "none"` (worktrees share `main` index) makes this race unavoidable when atomic per-task commits land back-to-back.
- **Fix:** None applied — the StoveSheet content is the legitimate Plan 178-04 work product (not a regression). Reverting would erase work from a peer plan. The destructive-git-prohibition rule blocks `git reset --hard` here.
- **Files affected:** `app/components/EmberGlass/sheets/StoveSheet.tsx` (not Plan 178-08 scope).
- **Commit:** `3d51f710` (carries both PlugsSheet GREEN and the cross-plan StoveSheet body — Plan 178-04 SUMMARY should reference this commit if it tracks the StoveSheet artifact).
- **No semantic divergence** from this plan's deliverable: PlugsSheet.tsx and PlugsSheet.test.tsx contain exactly what Plan 178-08 specifies.

### Worktree base reset

The agent harness placed me on a worktree branch with base `ec305afe75e…` instead of the expected `137224261e7…`. I followed the documented `<worktree_branch_check>` flow: `git reset --hard 137224261e…` brought HEAD to `13722426`, after which all per-task commits stack cleanly. Documented for transparency; not a deviation from plan content.

### Out-of-scope tsc errors

`npx tsc --noEmit` reports 7 pre-existing errors in `app/debug/components/tabs/__tests__/FritzboxServiceDiscoveryTab.test.tsx`, `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts`, `app/network/__tests__/storico-tab.test.tsx`, and `app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts`. None touch `EmberGlass/sheets`. Logged here as out-of-scope; not blocking SHEET-06 acceptance.

## Pitfall enforcement (RESEARCH cross-check)

| Pitfall | Status |
|---------|--------|
| 8 — drop `{room}` segment | enforced by code + grep gate + test 5/6 |
| 10 — `togglePlug` no retry wrap | documented in JSDoc; UI relies on 60s polling tick |
| `custom_name` null fallback | test 11 |
| `power_w` null defensive `=== 'number'` guard | test 15 |
| `switch_on === true` strict equality (rejects null) | covered by field adapter; null switch_on rendered as off |

## Threat surface scan

No new threat surface beyond what the existing route `/api/tuya/plugs/{id}/state` already exposes (consumed via the unchanged `useTuyaCommands.togglePlug`). Custom_name is rendered through React JSX (auto-escaped). T-178-08-01 (silent toggle failure) and T-178-08-02 (custom_name XSS escape) accepted per plan threat register.

## Self-Check: PASSED

- File `app/components/EmberGlass/sheets/PlugsSheet.tsx` — FOUND
- File `app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx` — FOUND
- Commit `0777ac7b` (RED test) — FOUND
- Commit `3d51f710` (GREEN feat) — FOUND
- Acceptance grep gates — all pass
- Test suite — 16/16 pass

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `0777ac7b` | test | add failing PlugsSheet jest spec (RED gate) |
| `3d51f710` | feat | implement PlugsSheet body (SHEET-06 GREEN) |

(SUMMARY commit added below with `--no-verify`.)
