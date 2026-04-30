---
gsd_state_version: 1.0
milestone: v20.0
milestone_name: Ember Glass Redesign
status: ready_to_plan
stopped_at: Phase 180 context gathered
last_updated: "2026-04-30T14:56:48.181Z"
last_activity: 2026-04-30 -- Phase 180 execution started
progress:
  total_phases: 9
  completed_phases: 7
  total_plans: 46
  completed_plans: 45
  percent: 78
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-27)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 180 — automations-tab-full-editor

## Current Position

Phase: 181
Plan: Not started
Status: Ready to plan
Last activity: 2026-04-30

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 467
- v18.0 average: 2.1 plans/phase (15 plans / 7 phases)
- v19.0 average: 2.2 plans/phase (39 plans / 18 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v17.0 WebSocket Real-Time Transport | 139-144 | 11 | 3 days |
| v17.1 WebSocket Alignment & Tuya Integration | 145-148 | 10 | 3 days |
| v18.0 Dark-Only & Mobile-First | 149-155 | 15 | 2 days |
| v19.0 API Alignment & Full Coverage | 156-173 | 39 | 25 days |
| v20.0 Ember Glass Redesign | 174-182 | TBD | in progress |
| Phase 174 P01 | 3min | 2 tasks | 2 files |
| Phase 174 P03 | 25min | 3 tasks | 7 files |

## v20.0 Phase Map

| Phase | Slug | Reqs | Depends on |
|-------|------|------|------------|
| 174 | ember-glass-tokens | DS-01..06 (6) | — |
| 175 | glass-primitives | DS-07, SHEET-01 (2) | 174 |
| 176 | splash-animation | SPLASH-01..05 (5) | 174 |
| 177 | dashboard-cards | DASH-01..12 (12) | 174, 175 |
| 178 | device-sheets | SHEET-02..06 (5) | 175, 177 |
| 179 | rooms-tab | ROOMS-01..05 (5) | 175, 178 |
| 180 | automations-editor | AUTO-01..08 (8) | 175 |
| 181 | nav-glass | NAV-01..04 (4) | 174, 178 |
| 182 | design-system-reference-v2 | DSREF-01..03 (3) | 174-181 |

**Coverage:** 50/50 v20.0 requirements mapped (100%).

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Recent decisions affecting v20.0 scope (carried over from v19.0 close):

- Scheduler endpoints explicitly excluded from v19.0 (future milestone)
- v19.0 covers proxy client + API routes only; no dedicated UI pages
- All endpoints follow established pattern: proxy client function -> API route -> (optional hook)
- v20.0 is UI-only: zero backend/API route changes; v19.0 surface is final
- Light theme remains explicitly out of scope (v18.0 lockdown); Ember Glass is dark-only
- Recharts charts on /network /analytics /tuya kept as-is for v20.0 (only containing pages adopt glass)
- Orchestrator pattern (StoveCard/LightsCard, v7.0) preserved; only presentational layer changes
- Splash branding (logo/wordmark glyphs) reuses existing flame mark; only the animation is new
- Mobile gesture library (swipe-to-dismiss sheets) deferred; tap/Escape/backdrop sufficient for v20.0
- Phase 174-03: Hand-rolled <button role='switch'> + 6-swatch picker dispatch CustomEvent ember-glass-ambient-change to AmbientBg

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260322-t5k | Remove analytics/monitoring subsystem + fix build errors | 2026-03-22 | de582d37 | [260322-t5k-rimuovi-la-parte-di-monitoring-analytics](./quick/260322-t5k-rimuovi-la-parte-di-monitoring-analytics/) |
| 260325-ds8 | Scheduler technical doc for HA proxy team | 2026-03-25 | c746df6b | [260325-ds8-scheduler-technical-doc-for-ha-proxy-tea](./quick/260325-ds8-scheduler-technical-doc-for-ha-proxy-tea/) |
| 260328-jyf | Align WS types with HA proxy types | 2026-03-28 | 635f6337 | [260328-jyf-align-ws-types-with-ha-proxy-types-same-](./quick/260328-jyf-align-ws-types-with-ha-proxy-types-same-/) |
| 260331-dwi | Fix CameraCard not rendering with WS active | 2026-03-31 | 221f4efb | [260331-dwi-con-ws-attivo-non-si-vede-la-card-di-net](./quick/260331-dwi-con-ws-attivo-non-si-vede-la-card-di-net/) |
| 260331-eyf | Fix broken /monitoring navbar link and notification URLs | 2026-03-31 | ad2b9507 | [260331-eyf-fix-menu-links-and-add-missing-pages-to-](./quick/260331-eyf-fix-menu-links-and-add-missing-pages-to-/) |
| 260423-n6i | Fix jest config performance (worktree ignores, maxWorkers cap, scoped scripts, CLAUDE.md rule 8) | 2026-04-23 | 79b758a6 | [260423-n6i-fix-jest-config-performance-and-resource](./quick/260423-n6i-fix-jest-config-performance-and-resource/) |

## Session Continuity

Last activity: 2026-04-27 — Wrote ROADMAP.md for v20.0 Ember Glass Redesign (9 phases, 174-182, 50/50 reqs mapped)
Stopped at: Phase 180 context gathered
Resume file: .planning/phases/180-automations-tab-full-editor/180-CONTEXT.md

**Next Action:** `/gsd-plan-phase 174` (Ember Glass Tokens & Foundations)

## Deferred Items

Items acknowledged and deferred at v19.0 milestone close on 2026-04-27. Carried into v20.0 unchanged.

### Debug Sessions (7 — orphan `.resolved` state files)

| Slug | Status |
|------|--------|
| build-errors-integration-tests.resolved | investigating |
| build-errors-pages.resolved | investigating |
| build-errors-tests-groupB.resolved | investigating |
| build-errors-ui-tests.resolved | fixing |
| device-activation-permission-denied.resolved | verifying |
| netatmo-invalid-token.resolved | verifying |
| permission-denied-panel-commands.resolved | checkpoint |

### UAT Gaps (3 partial — v19.0 audit accepted)

| Phase | Status | Notes |
|-------|--------|-------|
| 166 | partial | 1 pending: Firebase adminDbPush log write (live env) |
| 169 | partial | 1 pending: /dirigera panels render (Playwright BYPASS_AUTH) |
| 170 | partial | 4 pending: cookie httpOnly, plaintext API key auth, revoke 401, clipboard |

### Verification Gaps (8)

| Phase | Status | Notes |
|-------|--------|-------|
| 05 | gaps_found | Pre-v19.0 historical |
| 39 | gaps_found | Pre-v19.0 historical |
| 42 | gaps_found | Pre-v19.0 historical |
| 50 | human_needed | Pre-v19.0 historical |
| 158 | human_needed | v19.0 — code-verified, 3 browser smoke pending |
| 166 | human_needed | v19.0 — code-verified, live env pending |
| 169 | human_needed | v19.0 — code-verified, Playwright BYPASS_AUTH blocked |
| 170 | human_needed | v19.0 — code-verified, browser/live UAT pending |

### Quick Tasks (39 missing — backlog of unexecuted ideas in `.planning/quick/`)

001..014, 15..32, 260319-kd7, 260322-t5k, 260325-ds8, 260328-jyf, 260331-dwi, 260331-eyf, 260423-n6i

These are idea slugs scaffolded but never executed. Promote individually post-close if needed.

**Planned Phase:** 175 (Glass Primitives — Press Animation & Sheet) — 3 plans — 2026-04-27T13:08:57.254Z
