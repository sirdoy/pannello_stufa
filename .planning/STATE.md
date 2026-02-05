# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Milestone v4.0 Advanced UI Components — Phase 35 Micro-interactions

## Current Position

Phase: 35 of 36 (Micro-interactions)
Plan: 01 of 04 complete
Status: In progress
Last activity: 2026-02-05 — Completed 35-01-PLAN.md (Animation Token Foundation)

Progress: [█████████████████░░░░░░░░░] 81% (17/21 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 140 (v1.0: 29, v2.0: 21, v3.0: 52, v3.1: 13, v3.2: 13, v4.0: 15)
- Average duration: ~4.0 min per plan
- Total execution time: ~9.4 hours across 5 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 - 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 - 2026-01-28) |
| v3.0 Design System | 8 | 52 | 3 days (2026-01-28 - 2026-01-30) |
| v3.1 Compliance | 6 | 13 | 4 days (2026-01-30 - 2026-02-02) |
| v3.2 Weather & Dashboard | 5 | 13 | 2 days (2026-02-02 - 2026-02-03) |
| v4.0 Advanced UI | 7 | 21 | In progress (2026-02-04 -) |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

Key patterns from previous milestones:
- CVA for type-safe component variants (including compound variants)
- Radix UI for accessible interactive components
- Namespace component pattern (Card.Header, Button.Icon, Tabs.List, Accordion.Item, Sheet.Content, RightClickMenu.Item)
- cn() pattern for Tailwind class composition
- Sheet open/onOpenChange API for uncontrolled mode support (vs Modal isOpen/onClose)
- cmdk Dialog pattern for Command Palette with fuzzy search
- Global keyboard shortcut handler with e.preventDefault() for Cmd+K/Ctrl+K
- VisuallyHidden pattern for accessible dialog title/description
- Per-user Firebase preferences at users/${userId} path
- TabsContext pattern for child-to-parent state communication (indicator positioning)
- Hover trigger mode via wrapper div with onMouseEnter/onMouseLeave (Popover)
- Responsive position switching (max-md:fixed + md:static) for mobile-bottom/desktop-top tabs
- Content slot pattern for wrapper components (scheduleContent, manualContent, historyContent)
- Radix CSS variables for height animation (--radix-accordion-content-height)
- getMobileQuickActions pattern for device-aware mobile navigation (priority: stove > thermostat > lights)
- useContextMenuLongPress hook separate from useLongPress (single trigger vs repeat)
- Smart focus management for confirmation dialogs (Cancel for danger, Confirm for default)
- Loading state protection pattern (blocks ESC and backdrop click)
- Render prop pattern for form fields in modals (FormModal children)
- Hybrid validation timing (onBlur + onChange after error) per CONTEXT.md
- Shake animation for validation error feedback (data-field attribute selector)
- Deprecation pattern: @deprecated JSDoc + console.warn once in useEffect (dev only)
- TanStack Table useReactTable pattern with getCoreRowModel and getSortedRowModel
- aria-sort three-state cycle (asc -> desc -> none) for sortable table headers
- CVA variants for table density (compact/default/relaxed row heights)
- Checkbox stopPropagation pattern to prevent row click conflicts
- Debounced search input (300ms) for performance optimization
- Controlled/uncontrolled state pattern for row selection
- ARIA live regions for screen reader announcements (selection, pagination)
- Page number ellipsis algorithm (max 5 visible pages)
- Roving tabindex pattern for keyboard navigation (first row tabIndex=0, others -1)
- DataTableRow component pattern for expandable rows
- Horizontal scroll detection with fade gradient indicator
- Expansion content skipping via data-expansion-row attribute
- CSS animation tokens in @theme block (--duration-*, --ease-*, --stagger-*)
- Stagger animation via calc() with --stagger-index custom property
- Reduced motion: selective :not() exclusions preserve functional animations

### Pending Todos

**Operational Setup (from previous milestones, pending deployment):**
- Scheduler cron configuration (cron-job.org account)
- Health monitoring cron (1-min frequency)
- Coordination cron (1-min frequency)
- Firestore indexes deployment

### Blockers/Concerns

None — v4.0 progressing well.

**Known Tech Debt:**
- Label component not exported from barrel (low impact)

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
| 012 | API debug console with tabs | 2026-02-05 | c51d570 | [012-debug-page-component-tabs-with-api-testi](./quick/012-debug-page-component-tabs-with-api-testi/) |

## Session Continuity

Last session: 2026-02-05 09:13 UTC
Stopped at: Completed 35-01-PLAN.md (Animation Token Foundation)
Resume file: None
Next step: Continue with 35-02-PLAN.md (Component Animation Enhancement)
