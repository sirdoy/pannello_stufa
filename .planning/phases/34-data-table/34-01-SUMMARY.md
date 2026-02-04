---
phase: 34-data-table
plan: 01
subsystem: ui-components
tags: [datatable, tanstack-table, sorting, cva, accessibility]

# Dependency graph
requires: []
provides: [DataTable-base, dataTableVariants]
affects: [34-02, 34-03, 34-04]

# Tech tracking
tech-stack:
  added: ["@tanstack/react-table@8.21.0"]
  patterns: ["useReactTable", "getCoreRowModel", "getSortedRowModel", "flexRender"]

# File tracking
key-files:
  created:
    - app/components/ui/DataTable.js
    - app/components/ui/__tests__/DataTable.test.js
  modified:
    - app/components/ui/index.js
    - package.json
    - package-lock.json

# Decisions
decisions:
  - id: DT-001
    title: "aria-sort three-state cycle"
    choice: "asc -> desc -> none cycle"
    rationale: "Matches WAI-ARIA recommendations for sortable tables"
  - id: DT-002
    title: "Visual sort indicators"
    choice: "ChevronUp/ChevronDown/ChevronsUpDown from lucide-react"
    rationale: "Consistent with existing project icon usage"
  - id: DT-003
    title: "Wrapper element structure"
    choice: "div wrapper with overflow-x-auto around table"
    rationale: "Enables horizontal scroll on mobile while maintaining border-radius"

# Metrics
metrics:
  duration: 4m41s
  completed: 2026-02-04
---

# Phase 34 Plan 01: DataTable Base Component Summary

**TanStack Table v8 integration with sortable columns and CVA variants for visual density**

## What Was Built

DataTable component providing:
- TanStack Table v8 integration via useReactTable hook
- Sortable columns with three-state cycle (ascending -> descending -> none)
- aria-sort ARIA attribute for screen reader accessibility
- Visual sort indicators (ChevronUp/ChevronDown)
- CVA variants for density (compact/default/relaxed), striped, stickyHeader
- Ember Noir styling (bg-slate-800/50 header, border-white/[0.06])
- onRowClick handler for row interaction
- getRowId prop for custom row identification
- Ref forwarding to wrapper div

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Install TanStack Table and create DataTable base component | 244ad42 | DataTable.js, package.json |
| 2 | Create DataTable unit tests | 530ad9e | DataTable.test.js |
| 3 | Export DataTable from barrel file | b393435 | index.js |

## Key Patterns Established

### TanStack Table Integration
```javascript
const table = useReactTable({
  data,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getRowId,
});
```

### CVA Variants for Density
```javascript
const dataTableVariants = cva('w-full border-collapse', {
  variants: {
    density: {
      compact: '[&_td]:py-2 [&_th]:py-2',    // 32px rows
      default: '[&_td]:py-3 [&_th]:py-3',    // 44px rows
      relaxed: '[&_td]:py-4 [&_th]:py-4',    // 52px rows
    },
    // ...
  },
});
```

### Accessible Sort Headers
```javascript
<th aria-sort={canSort ? getAriaSortValue(isSorted, sortDirection) : undefined}>
  <button aria-label={`Sort by ${header} (currently ${state})`}>
    {header} <SortIndicator />
  </button>
</th>
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TanStack Table not installed**
- **Found during:** Task 1
- **Issue:** @tanstack/react-table not in dependencies
- **Fix:** Installed @tanstack/react-table@8.21.0
- **Files modified:** package.json, package-lock.json
- **Commit:** 244ad42

## Test Coverage

40 tests covering:
- Rendering with data, columns, empty state
- Sorting (asc -> desc -> none cycle)
- aria-sort attribute updates
- Visual sort indicator presence
- CVA variants (density, striped, stickyHeader)
- Custom className and props
- onRowClick and getRowId
- Ref forwarding
- Accessibility with jest-axe

## Next Phase Readiness

Ready for Plan 02 (Filtering & Selection):
- DataTable component is exported and tested
- useReactTable pattern established
- CVA variants pattern ready for extension
- Need to add: getFilteredRowModel, column filters, row selection

## Verification Checklist

- [x] DataTable.js exists with TanStack Table integration
- [x] CVA variants for density, striped, stickyHeader work correctly
- [x] Sorting toggles on header click with aria-sort updates
- [x] Visual sort indicators (chevrons) appear on sorted column
- [x] All unit tests pass (40/40)
- [x] DataTable exportable from barrel file

---

*Plan executed: 2026-02-04*
*Duration: 4m41s*
*Executor: Claude Opus 4.5*
