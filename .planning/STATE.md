---
gsd_state_version: 1.0
milestone: v18.0
milestone_name: Dark-Only & Mobile-First
status: verifying
stopped_at: Completed 155-01-PLAN.md
last_updated: "2026-04-02T08:38:35.045Z"
last_activity: 2026-04-02
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 15
  completed_plans: 15
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 155 — phase-153-verification-gap-closure

## Current Position

Phase: 155
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-04-02

Progress: [████████████████████] 304/302 plans (100%)

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 467
- v17.1 average: 2.5 plans/phase (10 plans / 4 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v17.0 WebSocket Real-Time Transport | 139-144 | 11 | 3 days |
| v17.1 WebSocket Alignment & Tuya Integration | 145-148 | 10 | 3 days |
| v18.0 Dark-Only & Mobile-First | 149-154 | TBD | in progress |
| Phase 149 P01 | 414 | 2 tasks | 9 files |
| Phase 149 P02 | 5 | 2 tasks | 1 files |
| Phase 150 P01 | 640s | 2 tasks | 77 files |
| Phase 150 P02 | 16 | 2 tasks | 92 files |
| Phase 150-theme-prefix-cleanup P03 | 20 | 2 tasks | 2 files |
| Phase 151 P02 | 8min | 2 tasks | 1 files |
| Phase 151 P01 | 10min | 2 tasks | 2 files |
| Phase 152-pages-audit-core-device-pages P01 | 5 | 1 tasks | 2 files |
| Phase 152-pages-audit-core-device-pages P02 | 8min | 2 tasks | 3 files |
| Phase 153-pages-audit-extended-device-pages P02 | 5 | 1 tasks | 1 files |
| Phase 153-pages-audit-extended-device-pages P01 | 395s | 1 tasks | 1 files |
| Phase 154 P02 | 31533903 | 2 tasks | 2 files |
| Phase 154-pages-audit-admin-support-pages P01 | 758 | 2 tasks | 0 files |
| Phase 154 P03 | 31535141 | 3 tasks | 0 files |
| Phase 155 P01 | 106 | 2 tasks | 2 files |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

Recent decisions affecting v18.0:

- Theme removal is complete (no light theme preserved) — explicit user request
- Tablet design deferred to future milestone (custom 900px breakpoint already defined)
- Scope is pure CSS/layout — no new features or animation redesign
- [Phase 149]: Hardcode dark class on html element permanently — no runtime theme switching
- [Phase 149]: Replace inline localStorage theme script with static meta tag (#0f172a)
- [Phase 149]: Remove all html:not(.dark) blocks rather than converting to dark: prefix utilities — simpler and eliminates dead code
- [Phase 149]: Remove theme-switching transition entirely — 200ms overhead on every element eliminated
- [Phase 150]: Two-stage approach for theme prefix removal: global regex for html:not(.dark) (multiline-safe), per-line char-scanner for dark: with fallback global pass
- [Phase 150]: lib/version.ts dark: occurrences are changelog text strings — left unchanged to preserve data integrity
- [Phase 150]: useLightsData.ts 'dark: {}' is a TypeScript object key in adaptiveClasses record — not a CSS prefix, left unchanged
- [Phase 150-03]: lib/version.ts dark:/html:not(.dark) are changelog text strings — left unchanged to preserve history (per Plan 02 decision)
- [Phase 150-03]: StatusBadge test bg-warning-500/15 updated to /20 to match Plan 01's dark-only promotion of warning class
- [Phase 151]: Typography already mobile-safe via sm: responsive variants — no changes needed
- [Phase 151]: ButtonGroup adds flex-wrap only — no equal-sizing, no vertical stacking per design decision D-02
- [Phase 151]: All 12 layout DS components confirmed mobile-safe at 375px with no additional changes needed
- [Phase 152-01]: flex flex-wrap gap-3 on header rows for mobile overflow: minimal targeted fix for the two identified risk points, 5 other pages confirmed mobile-safe without changes
- [Phase 152-02]: Stats summary grid keeps 3 columns on mobile with gap-3 sm:gap-6; color presets drop to 3-col sm:5-col; network tab nav gets flex-wrap; SystemInfoCard skeleton also updated to grid-cols-1 sm:grid-cols-3
- [Phase 153-02]: rooms/status/page.tsx and rooms/[room_id]/page.tsx confirmed mobile-safe without changes
- [Phase 153-01]: SonosSleepTimer preset button row gets flex-wrap; all other 13 Sonos sub-components and DIRIGERA/Raspi/Tuya pages confirmed mobile-safe at 375px with 0 further changes
- [Phase 154]: All 7 debug pages confirmed mobile-safe at 375px with no code changes
- [Phase 154]: [Phase 154-02]: changelog Turbopack parse errors fixed via string concatenation (Phase 150-02 dark: removal regression)
- [Phase 154]: [Phase 154-02]: AUDIT-14 confirmed N/A — app/camera/ directory does not exist
- [Phase 154-01]: Registry toolbar (flex items-center justify-between) fits at 375px without flex-wrap — Select + button text are short enough
- [Phase 154-01]: Settings pages already have responsive patterns — no changes needed for any of the 8 pages
- [Phase 154-01]: Playwright scrollWidth check must be combined with title check to guard against false positives from Next.js dev error overlay
- [Phase 154]: Both camera pages confirmed mobile-safe at 375px with no code changes — Grid cols={2} maps to grid-cols-1 sm:grid-cols-2, inner grid-cols-2 stat cells acceptable per D-06
- [Phase 154]: Playwright IPv4 direct connection (127.0.0.1:3001) required — localhost IPv6 resolution caused timeout on Next.js dev server
- [Phase 154]: AUDIT-14 gap closure: Plan 02 incorrectly checked app/camera/ flat path instead of app/(pages)/camera/ Next.js route group — always verify route group paths
- [Phase 155]: Phase 153 evidence already existed in SUMMARY files; VERIFICATION.md was purely a documentation gap, no code re-audit needed

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

## Session Continuity

Last activity: 2026-04-01 - Phase 151 complete, ready to plan Phase 152
Stopped at: Completed 155-01-PLAN.md
Resume file: None
