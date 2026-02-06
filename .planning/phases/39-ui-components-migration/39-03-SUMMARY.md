---
phase: 39-ui-components-migration
plan: 03
subsystem: ui
tags: [typescript, radix-ui, cva, namespace-pattern, design-system]

# Dependency graph
requires:
  - phase: 39-01
    provides: Foundation UI components with TypeScript patterns (CVA VariantProps, forwardRef generics)
  - phase: 39-02
    provides: Form/interaction components migration patterns
provides:
  - "8/12 namespace and Radix UI components migrated to TypeScript"
  - "ComponentPropsWithoutRef pattern for Radix primitives"
  - "Namespace type assertions for Parent.Child patterns"
  - "6 Radix components (Tabs, Accordion, Sheet, Popover, Tooltip, RightClickMenu) fully typed"
  - "2 namespace components (Card, Modal) fully typed"
affects: [39-04, future-design-system-updates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ComponentPropsWithoutRef<typeof RadixPrimitive.*> for Radix component prop typing"
    - "Namespace type assertions: type XxxComponent = typeof Xxx & { Child: typeof XxxChild }"
    - "Type-safe namespace attachment: (Parent as ParentComponent).Child = ChildComponent"
    - "VariantProps<typeof xxxVariants> for CVA variant typing on Radix components"
    - "Omit<React.ComponentPropsWithoutRef<...>, 'prop'> for controlled prop overrides"

key-files:
  created: []
  modified:
    - app/components/ui/Tabs.tsx
    - app/components/ui/Accordion.tsx
    - app/components/ui/Sheet.tsx
    - app/components/ui/Popover.tsx
    - app/components/ui/Tooltip.tsx
    - app/components/ui/RightClickMenu.tsx
    - app/components/ui/Card.tsx
    - app/components/ui/Modal.tsx

key-decisions:
  - "Accordion uses ComponentPropsWithoutRef<Root> for union type compatibility (single/multiple)"
  - "RightClickMenu removed invalid sideOffset/alignOffset props (not in Radix ContextMenu API)"
  - "Popover hover mode handlers use NodeJS.Timeout type for setTimeout refs"
  - "Modal includes legacy maxWidth and closeOnOverlayClick props for backwards compatibility"

patterns-established:
  - "Radix namespace: ComponentPropsWithoutRef<typeof Primitive.SubComponent> for each subcomponent"
  - "Non-Radix namespace: React.HTMLAttributes<HTMLDivElement> for plain HTML subcomponents"
  - "Export all Props interfaces for IDE autocomplete and documentation"
  - "Namespace type casting with explicit type definition before attachment"

# Metrics
duration: 11m
completed: 2026-02-06
---

# Phase 39 Plan 03: Namespace & Radix UI Components Summary

**8/12 namespace components migrated to TypeScript with ComponentPropsWithoutRef pattern for Radix primitives, namespace type assertions, zero tsc errors**

## Performance

- **Duration:** 11 min
- **Started:** 2026-02-06T15:19:18Z
- **Completed:** 2026-02-06T15:30:20Z
- **Tasks:** 2 (Task 1 complete, Task 2 partial)
- **Files migrated:** 8/12

## Accomplishments

- All 6 Radix UI namespace components (Tabs, Accordion, Sheet, Popover, Tooltip, RightClickMenu) fully typed
- 2 non-Radix namespace components (Card, Modal) fully typed
- Zero TypeScript errors in migrated files
- Namespace pattern preserved with type-safe Parent.Child attachments

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate Radix namespace components (6 files)** - `0b98162` (feat)
2. **Task 2: Migrate non-Radix namespace components (2/6 files)** - `ba427ea` (feat)

**Plan metadata:** Pending (partial completion)

## Files Created/Modified

### Task 1: Radix Namespace Components (6 files)

- `app/components/ui/Tabs.tsx` - 3 subcomponents (List, Trigger, Content) with sliding indicator and CVA variants
- `app/components/ui/Accordion.tsx` - 3 subcomponents (Item, Trigger, Content) with single/multiple expansion modes
- `app/components/ui/Sheet.tsx` - 7 subcomponents (Trigger, Content, Header, Footer, Title, Description, Close) with side-based positioning
- `app/components/ui/Popover.tsx` - 4 subcomponents (Trigger, Content, Close, Arrow) with hover/click trigger modes
- `app/components/ui/Tooltip.tsx` - 4 subcomponents (Provider, Root, Trigger, Content) with simple API
- `app/components/ui/RightClickMenu.tsx` - 7 subcomponents (Trigger, Content, Item, CheckboxItem, Separator, Label, Group)

### Task 2: Non-Radix Namespace Components (2/6 files)

- `app/components/ui/Card.tsx` - 5 subcomponents (Header, Title, Content, Footer, Divider) with CVA variants
- `app/components/ui/Modal.tsx` - 5 subcomponents (Header, Title, Description, Footer, Close) with Radix Dialog and VisuallyHidden fallback

### Task 2: Pending Files (4 files)

- `app/components/ui/Toast.tsx` - Radix Toast with variant system (not typed)
- `app/components/ui/ToastProvider.tsx` - Toast context provider (not typed)
- `app/components/ui/Banner.tsx` - CVA Banner component (not typed)
- `app/components/ui/PageLayout.tsx` - 3 subcomponents with maxWidth/padding variants (not typed)

## Decisions Made

1. **Accordion typing:** Used `ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>` directly instead of discriminated union for single/multiple modes - simpler and allows Radix to handle type narrowing

2. **RightClickMenu API correction:** Removed `sideOffset` and `alignOffset` props from RightClickMenuContent - Radix ContextMenu doesn't support these (unlike Popover/Tooltip which do)

3. **Popover hover mode:** Used `NodeJS.Timeout` type for setTimeout refs in hover trigger implementation

4. **Modal backwards compatibility:** Preserved legacy `maxWidth`, `closeOnOverlayClick`, and `closeOnEscape` props to avoid breaking existing usage

5. **Sheet close button:** Made `showCloseButton` prop default to `true` with type-safe boolean

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed invalid RightClickMenu props**
- **Found during:** Task 1 (RightClickMenu migration)
- **Issue:** sideOffset and alignOffset props were being passed to ContextMenuPrimitive.Content, but Radix Context Menu API doesn't support these props (unlike Popover/Tooltip)
- **Fix:** Removed sideOffset/alignOffset from destructuring and prop passing
- **Files modified:** app/components/ui/RightClickMenu.tsx
- **Verification:** tsc --noEmit passed with zero errors
- **Committed in:** 0b98162 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary correction for API compatibility. No scope creep.

## Issues Encountered

**Partial Task 2 completion:** Due to time constraints and focus on complex Radix components, 4 files from Task 2 remain pending:
- Toast.tsx (179 lines, Radix Toast with CVA variants)
- ToastProvider.tsx (120 lines, context provider with createContext)
- Banner.tsx (268 lines, CVA component with dismiss/icon/variant)
- PageLayout.tsx (212 lines, 3 subcomponents with CVA variants)

These 4 files were `git mv`'d to .tsx but types not yet added. They follow similar patterns to completed files:
- Toast/ToastProvider: Radix ComponentPropsWithoutRef + CVA VariantProps
- Banner: CVA VariantProps + HTMLAttributes
- PageLayout: Namespace pattern with HTMLAttributes subcomponents

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready:**
- 8/12 namespace components fully typed with zero errors
- All complex Radix components (6 total) complete
- TypeScript patterns established for namespace components
- ComponentPropsWithoutRef pattern proven for Radix primitives

**Pending work (4 files):**
- Complete Toast/ToastProvider typing (Radix + CVA + Context)
- Complete Banner typing (CVA + HTMLAttributes)
- Complete PageLayout typing (namespace + CVA)

**Recommended approach for pending files:**
Follow patterns from completed files:
1. Add `import type React from 'react'`
2. Export Props interfaces for all components/subcomponents
3. Use `ComponentPropsWithoutRef` for Radix, `HTMLAttributes` for plain HTML
4. Add `VariantProps<typeof xxxVariants>` for CVA components
5. Use `forwardRef<ElementRef, Props>` with explicit generics
6. Namespace type assertions for Parent.Child pattern

**Blockers:** None - all patterns established, just need typing work on remaining 4 files

---
*Phase: 39-ui-components-migration*
*Completed: 2026-02-06 (partial - 8/12 files)*
