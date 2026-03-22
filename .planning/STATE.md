---
gsd_state_version: 1.0
milestone: v14.1
milestone_name: Tech Debt & Type Safety
status: unknown
stopped_at: Completed 117-02-PLAN.md
last_updated: "2026-03-22T18:21:06.894Z"
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 9
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-22)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 117 — dead-code-cleanup

## Current Position

Phase: 117 (dead-code-cleanup) — EXECUTING
Plan: 2 of 2

## Performance Metrics

**Velocity:**

- Total plans completed (all milestones): 398
- v14.0 average: 1.7 plans/phase (12 plans / 7 phases)

**By Milestone (recent):**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v12.0 Data Fetching & E2E | 96-98 | 4 | 2 days |
| v13.0 Thermorossi Proxy | 99-105 | 11 | 2 days |
| v14.0 Hue Proxy Migration | 106-112 | 12 | 2 days |
| Phase 113 P01 | 15 | 3 tasks | 5 files |
| Phase 114-type-safety-lib P01 | 12 | 2 tasks | 2 files |
| Phase 114-type-safety-lib P02 | 15 | 2 tasks | 5 files |
| Phase 115 P01 | 20 | 2 tasks | 10 files |
| Phase 115 P02 | 10 | 2 tasks | 17 files |
| Phase 116-type-safety-routes-pages P01 | 8m | 2 tasks | 8 files |
| Phase 116 P02 | 20 | 2 tasks | 12 files |
| Phase 117 P02 | 15 | 1 tasks | 3 files |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

- v14.1 scope: Known issues (6) + Type Safety lib/ (6) + Type Safety app/ components (6) + Type Safety app/ routes/pages (5) + Dead Code (3) = 26 requirements
- Test file `as any` (~309 occurrences) explicitly out of scope — legitimate mock pattern
- Design system barrel unused exports (131) out of scope — intentional public API
- [Phase 113]: ISSUE-04 StoveState typing was already resolved in prior plan — verified via grep, no code change needed
- [Phase 113]: CopyableIp Button uses iconOnly prop not ButtonIcon — Lucide JSX icons incompatible with ButtonIcon emoji-only prop
- [Phase 114-type-safety-lib]: Use FirebaseStoredPreferences alias for types/firebase/notifications.ts to avoid collision with filter's NotificationPreferences
- [Phase 114-type-safety-lib]: Error type guard pattern: error instanceof Error && 'code' in error — returns undefined when no code, requiring truthiness guard before includes()
- [Phase 114-type-safety-lib]: NotificationWithMaxActions type alias used instead of declare global NotificationConstructor — in-narrowing typed property as unknown
- [Phase 114-type-safety-lib]: migrateFromOldFormat parameter typed as DeviceConfigData | Record<string, unknown> | null to accept both typed and legacy shapes
- [Phase 115]: ToastNotification extends Omit<ToastProps,'children'> with legacy message/type fields; render destructures them
- [Phase 115]: BottomSheet ActionButton variant 'close' changed to 'ghost' (same styling) using satisfies operator
- [Phase 115]: StoveStatusDisplay variant/health narrowed to typed unions in stoveStatusUtils (source), not StoveCard (consumer)
- [Phase 115]: WeatherCardWrapper local WeatherData replaced with imported type from WeatherCard after exporting it
- [Phase 115]: BatteryState exported from BatteryWarning to enable type-safe cross-component use
- [Phase 115]: LightsRoomControl ControlButton variant: toControlButtonVariant() helper maps outline to subtle
- [Phase 116-type-safety-routes-pages]: Inline PidConfig/NetatmoCurrentStatus/PidState interfaces near usage in scheduler route; CalibrationDone interface for calibrateValvesIfNeeded; declare global augmentation for Badging API and PeriodicSync in sw.ts
- [Phase 116]: DaySchedule alias retained for safe noUncheckedIndexedAccess; WeeklySchedule used at component boundary only
- [Phase 116]: ModuleData.name made optional in RoomCard.tsx to match NetatmoModule which lacks name field
- [Phase 116]: NotificationDevice interface fields made explicit; [key:string]:any changed to [key:string]:unknown with runtime fields added
- [Phase 117]: notificationService.ts re-exports removed (no external consumers found via grep)
- [Phase 117]: detectStateMismatch async with userId param; adminDbRemove fire-and-forget for non-STARTING cleanup; Firebase errors return null (fail-safe)

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-22T18:21:06.864Z
Stopped at: Completed 117-02-PLAN.md
Resume file: None
