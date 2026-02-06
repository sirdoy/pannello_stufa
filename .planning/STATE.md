# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v5.0 TypeScript Migration — convert 572 JS/JSX files to TS/TSX

## Current Position

Phase: 39 - UI Components Migration
Plan: 2 of 3 (01 complete, 02 partial)
Status: In progress — Plans 01-02 executed (32/64 components migrated, 02 has 5 pending)
Last activity: 2026-02-06 — Completed 39-02-PLAN.md (9/14 fully typed, 5 pending)

Progress: [██████░░░░░░░░░░░░░░░░░░] 30% (2/7 phases complete, Phase 39 in progress)

## Milestone Overview

**v5.0 TypeScript Migration**
- Phases: 7 (37-43)
- Requirements: 24
- Target: Convert all 572 JS/JSX files to TS/TSX

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 37 | TypeScript Foundation | 8 | COMPLETE (8/8) |
| 38 | Library Migration | 4 | COMPLETE (4/4) |
| 39 | UI Components Migration | 3 | In progress (2/3 plans, 32/64 migrated, 5 pending types) |
| 40 | API Routes Migration | 3 | Pending |
| 41 | Pages Migration | 3 | Pending |
| 42 | Test Migration | 4 | Pending |
| 43 | Verification | 4 | Pending |

## Performance Metrics

**Velocity:**
- Total plans completed: 167 (v1.0: 29, v2.0: 21, v3.0: 52, v3.1: 13, v3.2: 13, v4.0: 24, v5.0: 15)
- Average duration: ~5.6 min per plan
- Total execution time: ~15.6 hours across 7 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 - 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 - 2026-01-28) |
| v3.0 Design System | 8 | 52 | 3 days (2026-01-28 - 2026-01-30) |
| v3.1 Compliance | 6 | 13 | 4 days (2026-01-30 - 2026-02-02) |
| v3.2 Weather & Dashboard | 5 | 13 | 2 days (2026-02-02 - 2026-02-03) |
| v4.0 Advanced UI | 7 | 24 | 2 days (2026-02-04 - 2026-02-05) |
| v5.0 TypeScript Migration | 7 | 15 plans (Phase 38 complete, Phase 39 in progress) | In progress |

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

**Phase 38-01 decisions:**
- Use git mv for file renaming to preserve git history
- Interface-first approach: define interfaces before typing functions
- Use 'as const' for route objects and enums for literal type inference
- Prefer unknown over any for type-safe handling of dynamic data
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

**Known Tech Debt:**
- Label component not exported from barrel (low impact)
- 5 Radix form components need TypeScript typing (Checkbox, Switch, Slider, Select, RadioGroup) - 71 tsc errors
- Phase 39-02 partially complete - follow-up work needed

### TypeScript Migration Patterns (v5.0)

From 37-02, 37-03:
- Barrel export pattern: @/types, @/types/firebase, @/types/api, @/types/components, @/types/config
- Type guards: isApiSuccess(), isApiError()
- Union types for constrained values (StoveStatus, ErrorCode, Size, ColorScheme)
- Interface extension for API responses
- Mixin interfaces for shared props (WithChildren, WithDisabled, WithLoading)

From 38-01 (Leaf utilities):
- git mv preserves git history for better blame tracking
- 'as const' for route definitions and enums enables literal type inference
- Explicit return types on all exported functions for API clarity
- Unknown over any for flexible JSON structures (Record<string, unknown[]>)

From 38-02 (PWA utilities):
- Generic IndexedDB wrapper with type parameters (<T>) for type-safe data retrieval
- Local interface declarations for experimental Web APIs (SyncManager, PeriodicSyncManager)
- Global Navigator augmentation for Badge API (setAppBadge?, clearAppBadge?)
- Browser API wrappers with explicit return types and built-in DOM type usage

From 38-03 (Core infrastructure):
- Firebase SDK built-in types preferred over custom wrappers
- adminDbGet returns unknown (not generic) - forces explicit casting for safety
- Overloaded validation functions for object vs single-value patterns
- Interface-first middleware typing with route handler type aliases

From 38-04 (Repositories, schemas, validators, devices):
- Generic repository pattern: BaseRepository<T> with type-safe CRUD operations
- Zod schema type inference: export type X = z.infer<typeof xSchema>
- Local interfaces in repositories when Firebase structure differs from global types
- Union types for constrained strings (DeviceTypeId, DeviceColor)
- 'as const' with Record types for literal type inference

From 38-08 (Remaining services):
- Transaction temporary fields: Cast to Record<string, unknown> for _metadata fields
- Admin vs Client SDK: Read operations use client SDK, writes require Admin SDK + API routes
- Stale-while-revalidate: In-memory Map cache + background refresh pattern
- Hook return interface: Explicit interface export + function return type for docs/IDE
- Scheduler mode state machine: Explicit type for manual/automatic/semi-manual transitions
- Sandbox testing types: Nested interfaces for config/state/maintenance/error domains
- Unknown for deeply nested API responses rather than full typing

From 38-09 (React hooks):
- Generic hooks with TypeScript generics: useDebounce<T> preserves type safety
- Hook return type interfaces exported: export interface UseXxxReturn
- Hook options interfaces exported: export interface UseXxxOptions
- React event handler types: React.TouchEvent, MediaQueryListEvent
- CSSProperties typing for style constants with 'as const'
- LongPressEventType.Pointer handles both mouse and touch events

From 38-12 (Firebase unknown type access):
- Firebase get().val() and adminDbGet() always cast to typed interface (never leave as unknown)
- Firebase messaging priority uses literal types 'high' | 'normal' not string
- TokenRecord interface for FCM token data with index signature for flexibility
- Type guards for PromiseSettledResult discriminated unions
- Index signature [key: string]: unknown for flexible data structures

From 38-13 (Record conversion & Promise types):
- Double assertion for Firebase writes: (data as unknown as Record<string, unknown>)
- Index signatures on API params for generic Record<string, unknown> casting
- Hook return type interfaces must match actual implementation return values
- Wrap callbacks to match expected return type: async () => { await fn(); }

From 39-01 (Foundation UI components):
- CVA VariantProps<typeof componentVariants> for variant props typing
- React forwardRef<HTMLElement, Props> with explicit generics
- ElementType polymorphic 'as' prop pattern for flexible component rendering
- ComponentPropsWithoutRef<typeof RadixPrimitive> for Radix UI components
- Omit<SVGAttributes, 'size'> for icon components with custom size prop
- Record<string, string> typed maps for variant/size class lookups
- git mv before editing preserves git history for better blame tracking
- Type assertions for unknown hook return values: (value as { prop?: string })

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
Stopped at: Completed 39-02-PLAN.md (9/14 form/interaction components fully typed, 5 Radix pending)
Resume file: None
Next step: Complete 39-02 remaining types (Checkbox, Switch, Slider, Select, RadioGroup) or proceed to 39-03

From 38-10 (Type definitions gap closure):
- Type narrowing with 'in' operator for discriminated unions: if ('property' in object)
- Readonly array casting for includes checks: (array as readonly string[]).includes(value)
- Query<DocumentData, DocumentData> for Firestore query variable type after where() chains
- Widen literal unions to string when storing human-readable messages
- Import shared types instead of duplicating (NetatmoSchedule from netatmoApi)

**Phase 38 gap closure update (2026-02-06):**
All gap closure plans complete. TypeScript error count reduced from 252 to 0 through plans 38-10, 38-11, 38-12, 38-13.

From 39-02 (Form/interaction components):
- VariantProps<typeof xxxVariants> for CVA variant typing
- ComponentPropsWithoutRef<typeof RadixPrimitive.Root> for Radix components
- Omit<HTMLAttributes, 'conflictingProp'> to avoid conflicts (type, onChange, size)
- Namespace sub-component typing: type ButtonComponent = typeof Button & { Icon: ..., Group: ... }
- Type assertions for sub-component attachment: (Button as ButtonComponent).Icon = ButtonIcon
- Synthetic event typing: React.ChangeEvent<HTMLInputElement> for controlled/uncontrolled patterns
- Partial migration documentation: Track pending work as deviation when time-constrained
