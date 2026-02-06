---
phase: 39-ui-components-migration
plan: 04
subsystem: design-system
tags: [typescript, ui-components, tanstack-table, radix, namespace-pattern]
requires: [39-01, 39-02]
provides:
  - TypeScript migration of 14 complex/domain UI components
  - SmartHomeCard namespace pattern with typed subcomponents
  - DashboardLayout namespace with useSidebar hook typing
  - DataTable TanStack Table generics implementation
  - Skeleton namespace with multiple variant subcomponents
affects: []
tech-stack:
  added: []
  patterns:
    - Namespace component typing with type assertions
    - TanStack Table generic props DataTableProps<TData>
    - Pragmatic any types for complex legacy integrations
    - forwardRef with explicit HTML element generics
    - ComponentPropsWithoutRef for Radix-based components
key-files:
  created: []
  modified:
    - app/components/ui/SmartHomeCard.tsx
    - app/components/ui/ConnectionStatus.tsx
    - app/components/ui/HealthIndicator.tsx
    - app/components/ui/StatusCard.tsx
    - app/components/ui/DeviceCard.tsx
    - app/components/ui/DashboardLayout.tsx
    - app/components/ui/CommandPalette.tsx
    - app/components/ui/BottomSheet.tsx
    - app/components/ui/ConfirmationDialog.tsx
    - app/components/ui/FormModal.tsx
    - app/components/ui/DataTable.tsx
    - app/components/ui/DataTableRow.tsx
    - app/components/ui/DataTableToolbar.tsx
    - app/components/ui/Skeleton.tsx
decisions:
  - title: Use pragmatic any for complex legacy integrations
    rationale: Banner, InfoBox, Toast not yet migrated - used any to avoid blocking
    impact: Type safety deferred to future migration of those components
  - title: ContextMenuItem interface defined in DeviceCard
    rationale: No global types/components.ts file exists yet
    impact: Interface may need to be moved to shared location later
  - title: TanStack Table generics with pragmatic any
    rationale: Full TData typing complex for toolbar/row - used any for flexibility
    impact: Type safety for table data deferred to usage sites
duration: 21min
completed: 2026-02-06
---

# Phase 39 Plan 04: Complex UI Components Migration Summary

**One-liner:** Migrated 14 complex design system components (SmartHomeCard namespace, DashboardLayout namespace, DataTable TanStack generics, Skeleton variants) to TypeScript with pragmatic typing for legacy integrations.

## What Was Delivered

### Task 1: Domain-specific and namespace components (7 files)

**SmartHomeCard** (237 lines → .tsx):
- Namespace pattern with Header, Status, Controls subcomponents
- CVA VariantProps for size/colorTheme
- forwardRef<HTMLDivElement, SmartHomeCardProps>
- SmartHomeCardComponent type for namespace attachment
- Type assertions for namespace exports

**ConnectionStatus** (127 lines → .tsx):
- CVA variants for status (online/offline/connecting/unknown)
- LucideIcon type for status dot
- Record<string, string> for statusLabels map
- VariantProps integration

**HealthIndicator** (133 lines → .tsx):
- LucideIcon type mapping for status icons
- Record<string, number> for iconSizes
- forwardRef<HTMLSpanElement, HealthIndicatorProps>
- VariantProps<typeof healthIndicatorVariants>

**StatusCard** (120 lines → .tsx):
- Extends Omit<SmartHomeCardProps, 'headerActions'>
- Specialized props for status badge and connection status
- forwardRef<HTMLDivElement, StatusCardProps>

**DeviceCard** (326 lines → .tsx):
- Complex legacy props with backward compatibility
- ContextMenuItem interface defined (icon, label, onSelect, disabled, separator)
- StatusBadge, BannerItem, InfoBoxItem, FooterAction, ToastNotification interfaces
- Pragmatic any for Banner, InfoBox, Toast (not yet migrated)
- RightClickMenu integration (removed controlled state - uses Radix uncontrolled)
- Extends Omit<SmartHomeCardProps, 'headerActions' | 'colorTheme'>

**DashboardLayout** (415 lines → .tsx):
- Namespace with 7 subcomponents: Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarToggle, MobileMenuButton, Main
- SidebarContextValue interface with typed state/setters
- UseSidebarReturn interface exported for hook consumers
- DashboardLayoutComponent type for namespace attachment
- All subcomponents typed with forwardRef generics

**CommandPalette** (221 lines → .tsx):
- cmdk library integration
- CommandItem and CommandGroup interfaces
- Extends Omit<ComponentPropsWithoutRef<typeof Command.Dialog>, 'children'>
- forwardRef<HTMLDivElement, CommandPaletteProps>

### Task 2: Dialog, table, and skeleton components (7 files)

**BottomSheet** (155 lines → .tsx):
- Portal-based component
- BottomSheetProps interface
- ReactNode for children, icon props
- KeyboardEvent typing for ESC handler
- Pragmatic any for ActionButton variant mismatch

**ConfirmationDialog** (265 lines → .tsx):
- Radix Dialog integration
- Extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
- useRef<HTMLButtonElement> for focus management
- VariantProps for CVA variants
- Async onConfirm handler support

**FormModal** (346 lines → .tsx):
- React Hook Form integration
- Pragmatic any for schema, fields, initialValues (complex generic typing)
- SuccessOverlay typed with message prop
- Modal props spread with any to avoid Radix conflicts

**DataTable** (691 lines → .tsx):
- TanStack Table generics: DataTableProps<TData>
- ColumnDef<TData>[], Row<TData> types
- SortingState, ColumnFiltersState imports
- forwardRef<HTMLDivElement, DataTableProps<any>> with pragmatic any
- VariantProps<typeof tableVariants>

**DataTableRow** (148 lines → .tsx):
- Generic props: DataTableRowProps<TData>
- Row<TData>, ColumnDef<TData>[] from TanStack
- React.KeyboardEvent<HTMLTableRowElement> for keyboard nav
- Type assertions for Element → HTMLElement in focus() calls

**DataTableToolbar** (299 lines → .tsx):
- Table<TData> prop from TanStack
- forwardRef<HTMLDivElement, DataTableToolbarProps<any>>
- onBulkAction: (action: string, selectedRows: any) => void
- Array.isArray check for bulkActions.map()
- Pragmatic any for action objects

**Skeleton** (772 lines → .tsx):
- HTMLAttributes<HTMLDivElement> extension
- Namespace pattern with Card subcomponent
- SkeletonCardProps interface for Card variant
- Many additional named variants (not all typed - namespace attachment)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SmartHomeCard namespace exports**
- **Found during:** Task 1
- **Issue:** TypeScript couldn't infer namespace properties on forwardRef export
- **Fix:** Created SmartHomeCardComponent type and cast exports
- **Files modified:** SmartHomeCard.tsx
- **Commit:** 717d2b7

**2. [Rule 3 - Blocking] DeviceCard RightClickMenu controlled state**
- **Found during:** Task 1
- **Issue:** RightClickMenu (Radix ContextMenu) doesn't have open/onOpenChange props
- **Fix:** Removed controlled state, uses Radix uncontrolled pattern
- **Files modified:** DeviceCard.tsx
- **Commit:** 717d2b7

**3. [Rule 1 - Bug] DataTableToolbar duplicate destructuring**
- **Found during:** Task 2
- **Issue:** Props destructured twice causing syntax error
- **Fix:** Removed duplicate, kept single destructuring with defaults
- **Files modified:** DataTableToolbar.tsx
- **Commit:** e3ddbb8

**4. [Rule 2 - Missing Critical] DataTableToolbar missing props**
- **Found during:** Task 2
- **Issue:** showBulkActions, onBulkAction used but not in interface
- **Fix:** Added to DataTableToolbarProps with proper types
- **Files modified:** DataTableToolbar.tsx
- **Commit:** e3ddbb8

**5. [Rule 1 - Bug] DataTableRow Element focus type**
- **Found during:** Task 2
- **Issue:** Element doesn't have focus() method
- **Fix:** Type assertion to HTMLElement | null before focus()
- **Files modified:** DataTableRow.tsx
- **Commit:** e3ddbb8

## Technical Notes

**Namespace Pattern:**
SmartHomeCard and DashboardLayout use namespace attachment. Required type assertion:
```typescript
type ComponentType = React.ForwardRefExoticComponent<Props> & { Subcomponent: typeof Subcomponent };
(Component as ComponentType).Subcomponent = Subcomponent;
export { Component as ComponentWithNamespace };
```

**TanStack Table Generics:**
DataTable, DataTableRow, DataTableToolbar use generic TData parameter. At usage sites, consumers can provide specific data types:
```typescript
<DataTable<MyDataType> data={data} columns={columns} />
```
Current implementation uses pragmatic `any` for default to allow gradual typing.

**Pragmatic Any Strategy:**
Used `any` for:
- Banner, InfoBox, Toast props (not yet migrated)
- React Hook Form schema/fields (complex Zod integration)
- TanStack Table data generics default
- Radix component prop conflicts (Modal, Dialog)

**ContextMenuItem Location:**
Defined in DeviceCard.tsx. Should be moved to shared types file when created.

## Testing Strategy

**Manual verification:**
- tsc --noEmit passes for all 14 migrated files
- Zero TypeScript errors in SmartHomeCard, ConnectionStatus, HealthIndicator, StatusCard, DeviceCard, DashboardLayout, CommandPalette, BottomSheet, ConfirmationDialog, FormModal, DataTable, DataTableRow, DataTableToolbar, Skeleton
- git mv preserved git history for all files

**Remaining errors:**
39 TypeScript errors project-wide (down from ~65), all in files outside this plan's scope.

## Migration Patterns Established

**From 39-04:**
- Namespace component pattern with type assertions for subcomponent attachment
- TanStack Table generics with DataTableProps<TData> pattern
- Pragmatic any for complex integrations (React Hook Form, Radix conflicts)
- forwardRef<HTMLElement, Props> explicit generics for all components
- ComponentPropsWithoutRef for Radix-based components
- VariantProps<typeof xxxVariants> for CVA integration
- React.KeyboardEvent<HTMLElement> for keyboard handlers
- useRef<HTMLButtonElement> for focus management refs
- Record<string, T> for typed object maps
- Array.isArray() guards before .map() on ReactNode arrays

## Next Phase Readiness

**Blockers:**
None

**Concerns:**
1. ContextMenuItem should be moved to shared types file
2. Banner, InfoBox, Toast need migration to remove `any` types
3. TanStack Table TData could be more strictly typed at usage sites
4. Some Skeleton namespace variants not fully typed

**Dependencies satisfied:**
- Phase 39-01 foundation patterns (CVA, forwardRef, ComponentPropsWithoutRef) applied
- Phase 39-02 form/interaction patterns (variant typing, namespace) applied

## Self-Check: PASSED

**Files verified:**
- ✓ app/components/ui/SmartHomeCard.tsx (exists)
- ✓ app/components/ui/ConnectionStatus.tsx (exists)
- ✓ app/components/ui/HealthIndicator.tsx (exists)
- ✓ app/components/ui/StatusCard.tsx (exists)
- ✓ app/components/ui/DeviceCard.tsx (exists)
- ✓ app/components/ui/DashboardLayout.tsx (exists)
- ✓ app/components/ui/CommandPalette.tsx (exists)
- ✓ app/components/ui/BottomSheet.tsx (exists)
- ✓ app/components/ui/ConfirmationDialog.tsx (exists)
- ✓ app/components/ui/FormModal.tsx (exists)
- ✓ app/components/ui/DataTable.tsx (exists)
- ✓ app/components/ui/DataTableRow.tsx (exists)
- ✓ app/components/ui/DataTableToolbar.tsx (exists)
- ✓ app/components/ui/Skeleton.tsx (exists)

**Commits verified:**
- ✓ 717d2b7 (feat(39-04): migrate domain/namespace UI components to TypeScript)
- ✓ e3ddbb8 (feat(39-04): migrate dialog, table, and skeleton components to TypeScript)
