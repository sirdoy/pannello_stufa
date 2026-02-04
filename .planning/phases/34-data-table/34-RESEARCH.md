# Phase 34: Data Table - Research

**Researched:** 2026-02-04
**Domain:** React data tables, TanStack Table v8, ARIA table patterns
**Confidence:** HIGH

## Summary

Data tables are complex UI components requiring careful consideration of accessibility, performance, and user experience. The industry standard for React is **TanStack Table v8** (v9 is still in alpha as of February 2026), a headless, framework-agnostic library that provides data management logic while leaving styling completely to the developer.

The user has decided on specific interaction patterns: hybrid row height configuration, fixed+flex column sizing, separate behaviors for row click (expand) vs checkbox click (select), dual filtering (global + per-column), and traditional page number pagination. The implementation must integrate with existing Popover (for column filter menus) and Context Menu (for row actions), follow the Ember Noir design system, and meet WCAG AA accessibility requirements.

Key challenges include: preventing infinite re-renders through proper memoization, implementing accessible keyboard navigation without focus traps, providing proper ARIA attributes for sortable/filterable columns, and optimizing performance for large datasets while maintaining smooth interactions.

**Primary recommendation:** Build a custom DataTable component using TanStack Table v8 for state management, Radix UI patterns for accessibility, and CVA for styling variants. Avoid building custom sorting/filtering/pagination logic from scratch—TanStack Table handles these concerns with battle-tested implementations.

## Standard Stack

The established libraries/tools for React data tables:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | v8.21.3 | Headless table logic | Industry standard, 10-15kb, tree-shakable, handles sorting/filtering/pagination/selection/expansion |
| @radix-ui/react-checkbox | ^1.3.2 | Accessible checkboxes | Already in project, WCAG compliant, handles indeterminate state |
| @radix-ui/react-dropdown-menu | ^2.1.15 | Column filter menus | Already in project, keyboard navigation, ARIA compliant |
| @radix-ui/react-popover | ^1.1.14 | Filter dropdowns | Already in project (Phase 30), accessible overlays |
| class-variance-authority | ^0.7.1 | Variant styling | Already in project, type-safe variants |
| lucide-react | ^0.562.0 | Icons (sort arrows, chevrons) | Already in project, tree-shakable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-virtual | (optional) | Virtual scrolling | Only for 10,000+ rows |
| date-fns | ^4.1.0 | Date filtering | Already in project for date operations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Table | Material React Table | Provides pre-built UI but forces Material Design (conflicts with Ember Noir) |
| TanStack Table | AG Grid | Enterprise features but 100kb+ bundle, not free for commercial use |
| Custom implementation | TanStack Table | Hand-rolled sorting/filtering is 10x more code, prone to edge case bugs |

**Installation:**
```bash
npm install @tanstack/react-table
# All Radix primitives already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/components/ui/
├── DataTable.js              # Main component
├── DataTableToolbar.js       # Search + filter chips + bulk actions
├── DataTableColumnHeader.js  # Sortable header with dropdown
├── DataTablePagination.js    # Page numbers + rows per page
├── DataTableRow.js           # Row with selection + expansion
├── DataTableCell.js          # Cell with formatting
└── __tests__/
    └── DataTable.test.js     # Unit tests with jest-axe
```

### Pattern 1: Headless Architecture (TanStack Table)
**What:** TanStack Table provides hooks and state management, you provide rendering
**When to use:** Always—this is the recommended pattern for all React tables
**Example:**
```javascript
// Source: TanStack Table v8 official docs
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

function DataTable({ data, columns }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // State managed by TanStack
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {header.column.columnDef.header}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {cell.renderValue()}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Pattern 2: CVA Variants for Visual Density
**What:** Row height, zebra striping, sticky header as configurable variants
**When to use:** Following existing design system pattern (Badge, Button, Card all use CVA)
**Example:**
```javascript
// Source: Project's existing Badge.js and Button.js patterns
import { cva } from 'class-variance-authority';

const tableVariants = cva(
  'w-full border-collapse',
  {
    variants: {
      density: {
        compact: '[&_td]:py-2 [&_th]:py-2',    // 32px rows
        default: '[&_td]:py-3 [&_th]:py-3',    // 44px rows
        relaxed: '[&_td]:py-4 [&_th]:py-4',    // 52px rows
      },
      striped: {
        true: '[&_tbody_tr:nth-child(even)]:bg-white/[0.02]',
        false: '',
      },
      stickyHeader: {
        true: '[&_thead]:sticky [&_thead]:top-0 [&_thead]:bg-slate-900 [&_thead]:z-10',
        false: '',
      },
    },
    defaultVariants: {
      density: 'default',
      striped: false,
      stickyHeader: false,
    },
  }
);
```

### Pattern 3: Stable References with useMemo
**What:** Memoize data and columns to prevent infinite re-renders
**When to use:** Always—required for TanStack Table performance
**Example:**
```javascript
// Source: TanStack Table docs, Material React Table memoization guide
function MyComponent() {
  // CRITICAL: data and columns must have stable references
  const data = useMemo(() => [...rawData], [rawData]);

  const columns = useMemo(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
  ], []); // Empty deps—columns don't change

  const table = useReactTable({ data, columns, ... });
}
```

### Pattern 4: Floating Bulk Actions Toolbar
**What:** Toolbar appears above table when rows selected, shows count + actions
**When to use:** User decided on this pattern for multi-select mode
**Example:**
```javascript
// Source: shadcn/ui table blocks, Material React Table
function DataTable() {
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  return (
    <div>
      {selectedCount > 0 && (
        <div className="absolute top-0 left-0 right-0 bg-ember-500/10 border border-ember-400/20 p-3 flex items-center gap-4">
          <Text variant="ember">{selectedCount} selected</Text>
          <Button.Group>
            <Button variant="subtle" onClick={handleExport}>Export</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </Button.Group>
        </div>
      )}
      <table>...</table>
    </div>
  );
}
```

### Pattern 5: Row Click vs Checkbox Click Separation
**What:** Row click expands details, checkbox click selects—separate behaviors
**When to use:** User decided on this pattern
**Example:**
```javascript
// Source: TanStack Table row selection docs
<tr
  onClick={() => row.toggleExpanded()}
  className="cursor-pointer hover:bg-white/[0.02]"
>
  <td onClick={(e) => e.stopPropagation()}>
    {/* Checkbox—stop propagation to prevent expand */}
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={row.toggleSelected}
    />
  </td>
  <td>{/* ...other cells */}</td>
</tr>
```

### Pattern 6: Filter Chips Display
**What:** Active filters shown as removable chips (badges) above table
**When to use:** User decided on this for visual feedback of active filters
**Example:**
```javascript
// Source: Material React Table filter guide, project's Badge component
function FilterChips({ table }) {
  const columnFilters = table.getState().columnFilters;

  return (
    <div className="flex gap-2 mb-4">
      {columnFilters.map(filter => (
        <Badge
          key={filter.id}
          variant="ocean"
          className="cursor-pointer"
          onClick={() => table.getColumn(filter.id).setFilterValue(undefined)}
        >
          {filter.id}: {filter.value}
          <X className="w-3 h-3 ml-1" />
        </Badge>
      ))}
      {columnFilters.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
          Clear all
        </Button>
      )}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Generating keys in JSX:** `key={Math.random()}` causes destroy/recreate on every render—huge performance hit
- **Direct state mutation:** Never mutate TanStack Table state directly—use provided methods
- **Making every cell focusable:** Non-interactive cells should not have `tabIndex={0}`—makes keyboard navigation painful
- **Index-based row IDs:** Use `getRowId` with stable unique IDs, not array indices (breaks on sort/filter)
- **Unmemoized data transformations:** Filtering/mapping data inside render causes infinite loops

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sorting logic | Custom sort functions | TanStack Table `getSortedRowModel` | Handles multi-column sort, stable sort, custom comparators, undo/redo |
| Pagination state | useState page numbers | TanStack Table `getPaginationRowModel` | Handles pageIndex/pageSize sync, auto-reset on filter, row count math |
| Filter state | Multiple useState hooks | TanStack Table `getFilteredRowModel` | Syncs global + column filters, debouncing, fuzzy search built-in |
| Selection state | Set of selected IDs | TanStack Table `getSelectedRowModel` | Handles select-all, indeterminate, shift+click ranges, sub-row cascades |
| Row expansion state | Set of expanded IDs | TanStack Table `getExpandedRowModel` | Handles nested expansion, expand-all, conditional expansion logic |
| Column visibility | Object of visible flags | TanStack Table column visibility API | Syncs with sorting/filtering, persists to localStorage |
| Keyboard navigation | Manual key handlers | Radix primitives + roving tabindex | ARIA compliance, screen reader announcements, focus management |

**Key insight:** Data table state management has dozens of edge cases (What happens to selection when you filter? What if you sort while expanded? What about shift+click across pages?). TanStack Table has 8 years of battle-testing these interactions—don't rebuild it.

## Common Pitfalls

### Pitfall 1: Infinite Re-render Loop
**What goes wrong:** Table re-renders continuously, browser freezes, CPU spikes to 100%
**Why it happens:** Data or columns array recreated on every render—TanStack sees "new" data and re-renders
**How to avoid:**
```javascript
// BAD - new array every render
const data = filteredData.filter(x => x.active);
const table = useReactTable({ data, ... }); // ❌ Infinite loop

// GOOD - stable reference
const data = useMemo(() => rawData.filter(x => x.active), [rawData]);
const table = useReactTable({ data, ... }); // ✅ Only updates when rawData changes
```
**Warning signs:** Fans spin up, DevTools shows hundreds of renders/second, React DevTools profiler shows constant updates

### Pitfall 2: Keyboard Focus Trap
**What goes wrong:** User tabs into table and can't tab out—trapped navigating cells
**Why it happens:** Made every `<td>` focusable with `tabIndex={0}` for "accessibility"
**How to avoid:**
- Only make interactive elements focusable (buttons, checkboxes, links inside cells)
- For row selection, make the checkbox focusable, not the entire row
- Use `roving tabindex` pattern: only one cell per row has `tabIndex={0}`, use arrow keys to move within row
**Warning signs:** Pressing Tab cycles through dozens of cells instead of moving to next interactive element

### Pitfall 3: Missing ARIA Attributes on Sortable Columns
**What goes wrong:** Screen reader users can't tell which column is sorted or in what direction
**Why it happens:** Forgot `aria-sort` attribute or only added visual indicators (arrows)
**How to avoid:**
```javascript
// Source: W3C ARIA sortable table pattern
<th
  aria-sort={
    column.getIsSorted() === 'asc' ? 'ascending' :
    column.getIsSorted() === 'desc' ? 'descending' :
    'none'
  }
  onClick={column.getToggleSortingHandler()}
>
  {column.columnDef.header}
  {column.getIsSorted() && (
    <span aria-hidden="true">
      {column.getIsSorted() === 'asc' ? '▲' : '▼'}
    </span>
  )}
</th>
```
**Warning signs:** jest-axe reports missing ARIA attributes, screen reader announces "clickable" but not "sortable"

### Pitfall 4: Horizontal Scroll Without Visual Cue
**What goes wrong:** Users don't realize table scrolls horizontally—data appears cut off
**Why it happens:** Applied `overflow-x: auto` but no visual indicator of more content
**How to avoid:**
- Lock first column (row labels) with `position: sticky; left: 0`
- Add subtle gradient fade at right edge to indicate more content
- On mobile, prefer card view over horizontal scroll
- Consider showing column count: "Showing 5 of 12 columns"
**Warning signs:** Users report "missing data" that's actually just off-screen to the right

### Pitfall 5: Index-Based Row Selection Breaks on Sort
**What goes wrong:** User selects rows, clicks sort, different rows become selected
**Why it happens:** Using array indices as row IDs—indices change when array reorders
**How to avoid:**
```javascript
// BAD - indices change on sort
const table = useReactTable({
  data,
  // Default getRowId uses index ❌
});

// GOOD - stable unique IDs
const table = useReactTable({
  data,
  getRowId: (row) => row.id, // ✅ ID persists through sort/filter
});
```
**Warning signs:** Bug reports: "Selection cleared when I sort" or "Wrong rows selected after filter"

### Pitfall 6: Not Announcing Dynamic Changes
**What goes wrong:** Screen reader users don't know when sort/filter/pagination changes
**Why it happens:** Visual changes without ARIA live regions
**How to avoid:**
- Add `aria-live="polite"` region that announces: "Sorted by Name, ascending"
- Announce filter results: "Showing 12 of 245 results"
- Announce page changes: "Page 2 of 10"
**Warning signs:** Screen reader users report table feels "unresponsive" or they're unsure if actions worked

## Code Examples

Verified patterns from official sources:

### TanStack Table Basic Setup
```javascript
// Source: TanStack Table v8 docs - https://tanstack.com/table/v8
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
} from '@tanstack/react-table';

function DataTable({ data, columns }) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [expanded, setExpanded] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      expanded,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => row.id, // CRITICAL: stable IDs
  });

  return { table };
}
```

### ARIA-Compliant Sortable Header
```javascript
// Source: W3C WAI-ARIA sortable table example
// https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/
function DataTableColumnHeader({ column, children }) {
  const sortDirection = column.getIsSorted();

  return (
    <th
      role="columnheader"
      aria-sort={
        sortDirection === 'asc' ? 'ascending' :
        sortDirection === 'desc' ? 'descending' :
        'none'
      }
      className={cn(
        'py-3 px-4 text-left',
        'hover:bg-white/[0.02]',
        'focus-visible:ring-2 focus-visible:ring-ember-500/50'
      )}
    >
      <button
        type="button"
        onClick={column.getToggleSortingHandler()}
        className="flex items-center gap-2 w-full"
        aria-label={
          sortDirection === 'asc' ? `${children}, sorted ascending` :
          sortDirection === 'desc' ? `${children}, sorted descending` :
          `Sort by ${children}`
        }
      >
        <Text variant="label" size="xs" as="span">
          {children}
        </Text>
        {sortDirection && (
          <span aria-hidden="true">
            {sortDirection === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </button>
    </th>
  );
}
```

### Keyboard Navigation Pattern
```javascript
// Source: Material React Table keyboard navigation guide
// https://www.material-react-table.com/docs/guides/accessibility
function DataTableRow({ row, index }) {
  const handleKeyDown = (e) => {
    const currentRow = e.currentTarget;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextRow = currentRow.nextElementSibling;
        if (nextRow) nextRow.focus();
        break;

      case 'ArrowUp':
        e.preventDefault();
        const prevRow = currentRow.previousElementSibling;
        if (prevRow) prevRow.focus();
        break;

      case 'Space':
        e.preventDefault();
        row.toggleSelected();
        break;

      case 'Enter':
        e.preventDefault();
        row.toggleExpanded();
        break;
    }
  };

  return (
    <tr
      role="row"
      tabIndex={index === 0 ? 0 : -1} // Roving tabindex
      onKeyDown={handleKeyDown}
      aria-selected={row.getIsSelected()}
      aria-expanded={row.getIsExpanded()}
    >
      {/* cells */}
    </tr>
  );
}
```

### Pagination with ARIA Live Announcement
```javascript
// Source: Material React Table pagination guide
// https://www.material-react-table.com/docs/guides/pagination
function DataTablePagination({ table }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {/* ARIA live region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Page {pageIndex + 1} of {pageCount}.
        Showing rows {startRow} to {endRow} of {totalRows}.
      </div>

      {/* Visual display */}
      <Text variant="secondary" size="sm">
        Showing {startRow}-{endRow} of {totalRows}
      </Text>

      {/* Page buttons */}
      <div className="flex gap-2">
        <Button
          variant="subtle"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          Previous
        </Button>

        {/* Page numbers */}
        {Array.from({ length: pageCount }, (_, i) => (
          <Button
            key={i}
            variant={i === pageIndex ? 'ember' : 'ghost'}
            size="sm"
            onClick={() => table.setPageIndex(i)}
            aria-label={`Page ${i + 1}`}
            aria-current={i === pageIndex ? 'page' : undefined}
          >
            {i + 1}
          </Button>
        ))}

        <Button
          variant="subtle"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>

      {/* Rows per page selector */}
      <Select
        label="Rows per page"
        value={pageSize}
        onChange={(e) => table.setPageSize(Number(e.target.value))}
        options={[
          { value: 10, label: '10' },
          { value: 25, label: '25' },
          { value: 50, label: '50' },
          { value: 100, label: '100' },
        ]}
      />
    </div>
  );
}
```

### Responsive with Horizontal Scroll
```javascript
// Source: Project's existing PropTable.js pattern
function DataTable({ children, className }) {
  return (
    <div className="relative">
      {/* Wrapper with horizontal scroll */}
      <div className={cn(
        'overflow-x-auto',
        'rounded-2xl border border-white/[0.06]',
        className
      )}>
        <table className="w-full border-collapse">
          {children}
        </table>
      </div>

      {/* Gradient to indicate more content */}
      <div
        className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, rgb(15 23 42), transparent)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Table v7 | TanStack Table v8 | 2023 | Renamed, improved TypeScript support, better tree-shaking |
| Material-UI DataGrid | TanStack Table + custom UI | 2024+ | Separation of logic and presentation—more flexible styling |
| Index-based keys | Stable getRowId | Always | Prevents selection bugs on sort/filter |
| `tabIndex={0}` on all cells | Roving tabindex pattern | ARIA best practices | Better keyboard navigation UX |
| Manual filter state | Built-in column/global filters | TanStack v8 | Less boilerplate, better performance |
| Custom pagination math | `getPaginationRowModel` | TanStack v7+ | Fewer bugs, handles edge cases |

**Deprecated/outdated:**
- **React Table v7:** Still functional but replaced by TanStack Table v8 (same maintainer, better API)
- **useTable hook:** Now `useReactTable` in v8
- **Making entire rows clickable for selection:** Conflicts with row expansion—use checkbox only

## Open Questions

Things that couldn't be fully resolved:

1. **Virtual scrolling threshold**
   - What we know: Libraries like react-window improve performance for 10,000+ rows
   - What's unclear: Exact threshold where virtualization becomes necessary for this app's data volumes
   - Recommendation: Start without virtualization, add if user reports lag with real data

2. **Column resizing requirement**
   - What we know: TanStack Table supports column resizing via `getColumnSizingRowModel`
   - What's unclear: User didn't specify if columns should be resizable by dragging borders
   - Recommendation: Implement fixed+flex layout as decided, defer resizing to later phase if requested

3. **Mobile card view fallback**
   - What we know: Horizontal scroll on mobile is poor UX, card views are better
   - What's unclear: Whether to implement responsive card view or stick with horizontal scroll
   - Recommendation: Start with horizontal scroll as decided, add locked first column, revisit if UX testing shows issues

4. **Filter dropdown UI complexity**
   - What we know: User decided on dropdown menu for column filters
   - What's unclear: Exact filter types (text input, select, multi-select, date range, etc.)
   - Recommendation: Start with text input filters, add specialized filter types based on column data types in implementation

## Sources

### Primary (HIGH confidence)
- [TanStack Table v8 Official Docs](https://tanstack.com/table/v8) - Core library documentation
- [W3C WAI-ARIA Sortable Table Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/) - Accessibility patterns
- [W3C ARIA Table Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/) - ARIA attributes and roles
- [MDN aria-sort Reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-sort) - ARIA attribute specifications
- Project's existing components (Badge.js, Checkbox.js, Popover.js, PropTable.js) - Established patterns

### Secondary (MEDIUM confidence)
- [Contentful TanStack Table Guide](https://www.contentful.com/blog/tanstack-table-react-table/) - Best practices overview
- [Material React Table Docs](https://www.material-react-table.com/docs/guides/accessibility) - Keyboard navigation patterns
- [shadcn/ui Table Blocks](https://www.shadcn.io/blocks/tables-bulk-actions) - Bulk actions implementation patterns
- [Tink - How Screen Readers Navigate Tables](https://tink.uk/how-screen-readers-navigate-data-tables/) - Screen reader behavior
- [Josh Comeau Common React Mistakes (Jan 2026)](https://www.joshwcomeau.com/react/common-beginner-mistakes/) - Performance pitfalls

### Tertiary (LOW confidence - WebSearch only)
- Medium articles on React table performance optimization - General guidance, needs verification with official docs
- LinkedIn advice on ARIA dynamic sorting - Community advice, verified against W3C specs
- Various React table library comparisons - Useful for ecosystem understanding but implementation should follow official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - TanStack Table is industry standard, version confirmed via npm registry and GitHub releases
- Architecture: HIGH - Patterns verified with official TanStack docs, W3C ARIA specs, and existing project patterns
- Pitfalls: HIGH - Based on official documentation warnings, community discussions with maintainer responses, and accessibility guidelines
- Code examples: HIGH - All sourced from official documentation or existing project files

**Research date:** 2026-02-04
**Valid until:** 30 days (TanStack Table v8 is stable, v9 still in alpha—no breaking changes expected)

**Key constraints from CONTEXT.md applied:**
- Row height: configurable (compact 32px, default 44px, relaxed) ✓
- Column sizing: fixed+flex hybrid ✓
- Selection modes: single-select and multi-select ✓
- Bulk actions: floating toolbar on selection ✓
- Row behaviors: click expands, checkbox selects ✓
- Filtering: global + per-column with chips ✓
- Pagination: traditional page numbers with rows per page selector ✓
- Integration: Popover (Phase 30) and Context Menu (Phase 32) ✓
- Design: Ember Noir with CVA variants ✓
- Accessibility: WCAG AA with ARIA and keyboard navigation ✓
