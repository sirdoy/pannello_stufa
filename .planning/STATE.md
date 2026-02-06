# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v5.0 TypeScript Migration — convert 572 JS/JSX files to TS/TSX

## Current Position

Phase: 38 - Library Migration
Plan: 02 of 9
Status: In progress
Last activity: 2026-02-06 — Completed 38-02-PLAN.md (PWA utilities)

Progress: [████░░░░░░░░░░░░░░░░░░░░] 14% (1/7 phases complete)

## Milestone Overview

**v5.0 TypeScript Migration**
- Phases: 7 (37-43)
- Requirements: 24
- Target: Convert all 572 JS/JSX files to TS/TSX

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 37 | TypeScript Foundation | 8 | COMPLETE (8/8) |
| 38 | Library Migration | 4 | In progress (2/9 plans) |
| 39 | UI Components Migration | 3 | Pending |
| 40 | API Routes Migration | 3 | Pending |
| 41 | Pages Migration | 3 | Pending |
| 42 | Test Migration | 4 | Pending |
| 43 | Verification | 4 | Pending |

## Performance Metrics

**Velocity:**
- Total plans completed: 152 (v1.0: 29, v2.0: 21, v3.0: 52, v3.1: 13, v3.2: 13, v4.0: 24)
- Average duration: ~4.0 min per plan
- Total execution time: ~10 hours across 6 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 - 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 - 2026-01-28) |
| v3.0 Design System | 8 | 52 | 3 days (2026-01-28 - 2026-01-30) |
| v3.1 Compliance | 6 | 13 | 4 days (2026-01-30 - 2026-02-02) |
| v3.2 Weather & Dashboard | 5 | 13 | 2 days (2026-02-02 - 2026-02-03) |
| v4.0 Advanced UI | 7 | 24 | 2 days (2026-02-04 - 2026-02-05) |
| v5.0 TypeScript Migration | 7 | 3/? | In progress |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

Key patterns from previous milestones preserved for v5.0 migration:
- Namespace component pattern (Tabs.List, Accordion.Item, Sheet.Content, RightClickMenu.Item)
- cmdk Dialog pattern for Command Palette with fuzzy search
- Global keyboard shortcut handler with e.preventDefault() for Cmd+K/Ctrl+K
- VisuallyHidden pattern for accessible dialog title/description
- useContextMenuLongPress hook (500ms threshold) for mobile context menu
- TanStack Table useReactTable pattern with getCoreRowModel and getSortedRowModel
- aria-sort three-state cycle (asc -> desc -> none) for sortable table headers
- Roving tabindex pattern for keyboard navigation
- CSS animation tokens in @theme block (--duration-*, --ease-*, --stagger-*)
- Stagger animation via calc() with --stagger-index custom property
- Reduced motion: selective :not() exclusions preserve functional animations
- DeviceCard contextMenuItems prop for declarative context menu
- Button.Icon quick actions pattern with conditional visibility

### Pending Todos

**Operational Setup (from previous milestones, pending deployment):**
- Scheduler cron configuration (cron-job.org account)
- Health monitoring cron (1-min frequency)
- Coordination cron (1-min frequency)
- Firestore indexes deployment

### Blockers/Concerns

None — Phase 37 in progress.

**Known Tech Debt:**
- Label component not exported from barrel (low impact)

### TypeScript Migration Patterns (v5.0)

From 37-02, 37-03:
- Barrel export pattern: @/types, @/types/firebase, @/types/api, @/types/components, @/types/config
- Type guards: isApiSuccess(), isApiError()
- Union types for constrained values (StoveStatus, ErrorCode, Size, ColorScheme)
- Interface extension for API responses
- Mixin interfaces for shared props (WithChildren, WithDisabled, WithLoading)

From 38-02 (PWA utilities):
- Generic IndexedDB wrapper with type parameters (<T>) for type-safe data retrieval
- Local interface declarations for experimental Web APIs (SyncManager, PeriodicSyncManager)
- Global Navigator augmentation for Badge API (setAppBadge?, clearAppBadge?)
- Browser API wrappers with explicit return types and built-in DOM type usage

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 002 | Weather data cron + manual refresh | 2026-02-03 | 5ff4c93 | [002-weather-data-cron-manual-refresh](./quick/002-weather-data-cron-manual-refresh/) |
| 003 | iOS PWA haptic feedback + viewport optimizations | 2026-02-04 | c38be8d | [003-ios-pwa-haptic-siri-shorts](./quick/003-ios-pwa-haptic-siri-shortcuts/) |
| 004 | Dynamic mobile nav + complete debug submenu | 2026-02-04 | 65333a5 | [004-menu-mobile-first-review-routes](./quick/004-menu-mobile-first-review-routes/) |
| 005 | Thermostat card active device indicator | 2026-02-04 | 1a77f7f | [005-thermostat-card-active-indicator](./quick/005-thermostat-card-active-indicator/) |
| 006 | Netatmo thermostat/valve control tests | 2026-02-04 | 1f9a4e8 | [006-thermostat-valves-commands-check](./quick/006-thermostat-valves-commands-check/) |
| 007 | Thermostat active devices list | 2026-02-04 | ecfdd3d | [007-thermostat-active-devices-list](./quick/007-thermostat-active-devices-list/) |
| 008 | Active devices filter only | 2026-02-04 | 66b2bb6 | [008-active-devices-filter-only](./quick/008-active-devices-filter-only/) |
| 010 | Stove-thermostat PID automation | 2026-02-04 | 707fcb1 | [010-stove-thermostat-pid-automation](./quick/010-stove-thermostat-pid-automation/) |
| 011 | Settings tabs unification | 2026-02-05 | 601c3da | [011-refactor-settings-tabs-unification](./quick/011-refactor-settings-tabs-unification/) |
| 012 | API debug console with tabs | 2026-02-05 | 34aaa52 | [012-debug-page-component-tabs-with-api-testi](./quick/012-debug-page-component-tabs-with-api-testi/) |

## Session Continuity

Last session: 2026-02-06
Stopped at: Completed 38-02-PLAN.md (PWA utilities migration)
Resume file: None
Next step: Continue Phase 38 Library Migration (7 more plans remaining)
