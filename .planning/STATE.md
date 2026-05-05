---
gsd_state_version: 1.0
milestone: v20.0
milestone_name: Ember Glass Redesign
status: verifying
stopped_at: Completed 183-04-PLAN.md
last_updated: "2026-05-03T17:48:10.819Z"
last_activity: 2026-05-03
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03 after v20.0 close)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Between milestones — v20.0 Ember Glass Redesign shipped 2026-05-03; awaiting `/gsd-new-milestone` for next cycle

## Current Position

Milestone: v20.0 — SHIPPED 2026-05-03
Status: Closed (10 phases, 66 plans, 50/50 reqs)
Last activity: 2026-05-03

Progress: [██████████] 100% (v20.0 closed)

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
| v20.0 Ember Glass Redesign | 174-183 | 66 | 7 days |
| Phase 174 P01 | 3min | 2 tasks | 2 files |
| Phase 174 P03 | 25min | 3 tasks | 7 files |
| Phase 183 P01 | 4min | 3 tasks | 7 files |
| Phase 183 P02 | 2min | 3 tasks | 1 files |
| Phase 183 P03 | 3min | 2 tasks | 2 files |
| Phase 183 P04 | 2min | 2 tasks | 2 files |
| Phase 183-v20-hygiene-cleanup P05 | 3min | 1 tasks | 7 files |

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
- Phase 183-01: Deferred ui/Sheet.tsx + ui/BottomSheet.tsx deletion to follow-up legacy-design-system-retirement phase per RESEARCH grep evidence (live importers in /debug/design-system + scheduler IntervalBottomSheet)
- Phase 183-01: Source+test paired deletion pattern (Pitfall 5) — orphaned tests must be deleted alongside their sources to keep test:changed green
- [Phase 183]: Phase 183-02: Per-row evidence-anchored Edit calls (not bulk replace) keep traceability flips auditable per row — REQUIREMENTS.md drift fix; 26 Pending->Complete + 2 [x] flips
- [Phase ?]: Phase 183-03: Append-only Post-Verification Update pattern preserves original audit trail (2026-04-30 footer untouched) when re-verifying deferred blockers
- [Phase ?]: Phase 183-03: ROADMAP Progress-row drift remediation owned by hygiene phase (Phase 174 row 0/0->3/3 was authored in a different session and never auto-updated)
- [Phase ?]: 183-04: console.error logging in catch blocks (5 calls in useAutomationsList) + jest.spyOn(console,'error') in beforeEach/afterEach to absorb test noise
- [Phase ?]: Phase 183-05: VALIDATION.md frontmatter normalized via direct Edit + Audit Trail (Skill tool unavailable in subagents); terminal status convention is 'complete' not 'final'

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
| 260504-jyc | Dashboard 4 colonne su desktop + tablet landscape (mobile resta 2) | 2026-05-04 | 3ce72294 | [260504-jyc-dashboard-4-cols-desktop-tablet](./quick/260504-jyc-dashboard-4-cols-desktop-tablet/) |
| 260504-kn6 | BottomTabBar sticky always visible (move out of SplashGate transform wrapper) | 2026-05-04 | faeb136b | [260504-kn6-menu-sticky-bottom-centered-desktop](./quick/260504-kn6-menu-sticky-bottom-centered-desktop/) |
| 260505-nf1 | Aggiorna gli skeleton nella home che rispecchino il nuovo design | 2026-05-05 | cbbd2af1 | [260505-nf1-aggiorna-gli-skeleton-nella-home-che-ris](./quick/260505-nf1-aggiorna-gli-skeleton-nella-home-che-ris/) |
| 260505-o8n | Home WS-primary coverage — suppress Raspi REST polling while WS OPEN (camera/weather need server-side topics) | 2026-05-05 | b8196c34 | [260505-o8n-home-ws-raspi-fix](./quick/260505-o8n-home-ws-raspi-fix/) |

## Session Continuity

Last activity: 2026-05-05 — Completed quick task 260505-o8n: Home WS-primary coverage / Raspi polling-suppression fix
Stopped at: v20.0 milestone closed
Resume file: None

**Next Action:** `/gsd-new-milestone` to define the next milestone cycle (questioning → research → requirements → roadmap)

## Deferred Items

Items acknowledged and deferred at v20.0 milestone close on 2026-05-03. Audit-documented backlog from `milestones/v20.0-MILESTONE-AUDIT.md` — re-audit `passed`, residual items parked.

### Debug Sessions (7 — orphan `.resolved` state files, carried over from v19.0)

| Slug | Status |
|------|--------|
| build-errors-integration-tests.resolved | investigating |
| build-errors-pages.resolved | investigating |
| build-errors-tests-groupB.resolved | investigating |
| build-errors-ui-tests.resolved | fixing |
| device-activation-permission-denied.resolved | verifying |
| netatmo-invalid-token.resolved | verifying |
| permission-denied-panel-commands.resolved | checkpoint |

### UAT Gaps (3 partial — v20.0 visual UAT, audit-acknowledged)

| Phase | Status | Notes |
|-------|--------|-------|
| 178 | partial | 6 pending: visual sheet polish, motion curves, real-device fidelity |
| 179 | partial | 16 pending: Rooms tab visual UAT, type-specific body parity |
| 180 | partial | 2 pending: Automations editor visual UAT, Italian copy parity |

### Verification Gaps (6)

| Phase | Status | Notes |
|-------|--------|-------|
| 39 | gaps_found | Pre-v19.0 historical |
| 42 | gaps_found | Pre-v19.0 historical |
| 174 | human_needed | v20.0 — 5/5 must-haves code-verified, visual UAT deferred |
| 177 | human_needed | v20.0 — 12/12 must-haves code-verified, dashboard visual UAT deferred |
| 178 | human_needed | v20.0 — 12/12 must-haves code-verified, sheet visual UAT deferred |
| 179 | human_needed | v20.0 — 5/5 SC + 16 UAT items code-verified, visual UAT deferred |

### Quick Tasks (39 missing — backlog of unexecuted ideas in `.planning/quick/`)

001..014, 15..32, 260319-kd7, 260322-t5k, 260325-ds8, 260328-jyf, 260331-dwi, 260331-eyf, 260423-n6i

These are idea slugs scaffolded but never executed. Promote individually post-close if needed.

### v20.0 Audit Tech Debt (parked for next milestone)

- Visual UAT debt (~50+ items across phases 174, 177, 178, 179, 180, 181, 182): real-device fidelity, motion curves, Italian copy parity, iOS safe-area, ambient gradient motion, blur fallback
- Playwright runtime gates (174, 175, 176, 178, 180, 181, 182): specs authored + statically reviewed, runtime blocked by Auth0 storageState + Firebase Database URL + VersionEnforcer overlay
- Legacy `app/components/ui/Sheet.tsx` + `ui/BottomSheet.tsx` retention (live importers — deletion deferred to follow-up migration phase)
- CircBtn + BigSlider extracted in Phase 182 but not yet imported in production sheets (CONTEXT D-07)
- DASH-10: DirigeraCard renders empty list (proxy exposes only sensors today)
- Locked deviations: AUTO-03 (2 trigger types vs bundle's 5, D-08), AUTO-05 (11 action types vs bundle's 9 generic, D-09)
- Stale comment in `types/automations.ts:13` (informational drift)
