---
phase: 41-pages-migration
plan: 06
subsystem: ui
tags: [typescript, react, debug, design-system, components]

# Dependency graph
requires:
  - phase: 40-api-routes-migration
    provides: TypeScript API routes with typed responses
provides:
  - 19 TypeScript debug co-located components with typed Props
  - Design-system documentation components (AccessibilitySection, CodeBlock, ComponentDemo, PropTable)
  - component-docs.ts with ComponentDoc interface for documentation metadata
  - 14 API debug tab components with typed test state and handlers
affects: [42-test-migration, type-safety]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Debug component typing: Record<string, any> for API response display (pragmatic any)"
    - "Tab component Props pattern: autoRefresh boolean, refreshTrigger number"
    - "API test state: Record<string, any> response, Record<string, boolean> loading, Record<string, number> timings"
    - "ComponentDoc interface for design-system metadata"

key-files:
  created:
    - app/debug/design-system/components/AccessibilitySection.tsx
    - app/debug/design-system/components/CodeBlock.tsx
    - app/debug/design-system/components/ComponentDemo.tsx
    - app/debug/design-system/components/PropTable.tsx
    - app/debug/design-system/data/component-docs.ts
    - app/debug/api/components/ApiTab.tsx
    - app/debug/api/components/tabs/*.tsx (6 files)
    - app/debug/components/ApiTab.tsx
    - app/debug/components/tabs/*.tsx (6 files)
  modified: []

key-decisions:
  - "Pragmatic any for API response display in debug tabs (external API complexity varies)"
  - "component-docs.js → component-docs.ts (data file, no JSX)"
  - "Separate debug/api and debug/components directories maintained (different import paths)"
  - "Same rigor for debug components as production components per user decision"

patterns-established:
  - "PropDoc, KeyboardDoc, AriaDoc interfaces for component documentation"
  - "ComponentDoc interface with category union type"
  - "ApiParam interface for POST endpoint parameters"
  - "EndpointCardProps, PostEndpointCardProps, JsonDisplayProps for debug UI"

# Metrics
duration: 8min
completed: 2026-02-07
---

# Phase 41 Plan 06: Debug Co-located Components Migration Summary

**19 TypeScript debug components: design-system docs (AccessibilitySection, CodeBlock, ComponentDemo, PropTable), component-docs.ts with ComponentDoc interface, 14 API debug tab components with typed test state**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-02-07T11:34:10Z
- **Completed:** 2026-02-07T11:42:52Z
- **Tasks:** 3
- **Files modified:** 19

## Accomplishments
- All 5 design-system documentation components migrated with typed Props and data structures
- component-docs.ts typed with ComponentDoc interface, PropDoc, KeyboardDoc, AriaDoc interfaces
- 7 debug/api tab components migrated with typed autoRefresh, refreshTrigger, API test state
- 7 debug/components tab components migrated (separate directory from debug/api)
- Zero .js files remain anywhere in app/debug/ tree

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate design-system doc components and data file (5 files)** - `bb2eee4` (feat)
2. **Task 2: Migrate debug/api tab components (7 files)** - `24684f0` (feat)
3. **Task 3: Migrate debug/components tab components (7 files)** - `ae2f398` (feat)

## Files Created/Modified

**Design-system components:**
- `app/debug/design-system/components/AccessibilitySection.tsx` - KeyboardItem, AriaItem, AccessibilitySectionProps
- `app/debug/design-system/components/CodeBlock.tsx` - CodeBlockProps with syntax highlighting
- `app/debug/design-system/components/ComponentDemo.tsx` - ComponentDemoProps with ReactNode children
- `app/debug/design-system/components/PropTable.tsx` - PropDefinition, PropTableProps

**Documentation data:**
- `app/debug/design-system/data/component-docs.ts` - ComponentDoc interface, typed export, helper functions

**debug/api tab components:**
- `app/debug/api/components/ApiTab.tsx` - EndpointCardProps, PostEndpointCardProps, JsonDisplayProps
- `app/debug/api/components/tabs/FirebaseTab.tsx` - FirebaseTabProps
- `app/debug/api/components/tabs/HueTab.tsx` - HueTabProps with bridgeStatus
- `app/debug/api/components/tabs/NetatmoTab.tsx` - NetatmoTabProps with connectionStatus
- `app/debug/api/components/tabs/SchedulerTab.tsx` - SchedulerTabProps
- `app/debug/api/components/tabs/StoveTab.tsx` - StoveTabProps with external URL mapping
- `app/debug/api/components/tabs/WeatherTab.tsx` - WeatherTabProps with cacheStatus

**debug/components tab components:**
- `app/debug/components/ApiTab.tsx` - Separate ApiTab with same interfaces
- `app/debug/components/tabs/FirebaseTab.tsx` - FirebaseTabProps (separate from debug/api)
- `app/debug/components/tabs/HueTab.tsx` - HueTabProps
- `app/debug/components/tabs/NetatmoTab.tsx` - NetatmoTabProps
- `app/debug/components/tabs/SchedulerTab.tsx` - SchedulerTabProps
- `app/debug/components/tabs/StoveTab.tsx` - StoveTabProps
- `app/debug/components/tabs/WeatherTab.tsx` - WeatherTabProps

## Decisions Made

1. **component-docs data file:** Migrated to .ts not .tsx (no JSX, pure data export)
2. **Pragmatic any for API responses:** Debug output varies per endpoint, full typing not warranted
3. **Same rigor for debug components:** Applied production-level typing per user decision
4. **Separate debug directories maintained:** debug/api/ and debug/components/ kept separate (different import paths: @/app/debug/api/components vs @/app/debug/components)
5. **Typed state pattern:** Record<string, any> for responses, Record<string, boolean> for loading, Record<string, number> for timings
6. **ApiParam interface:** type, name, label, defaultValue, required? for POST endpoint params

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Debug components complete - all co-located components TypeScript
- No .js files remain in app/debug/ tree
- Ready for Phase 42 (Test Migration)
- Pattern established: debug components get same typing rigor as production

---
*Phase: 41-pages-migration*
*Completed: 2026-02-07*

## Self-Check: PASSED

All 19 files verified present.
All 3 commits verified in git history.
