# Architecture Research: Advanced UI Components

**Domain:** Design System Extension
**Researched:** 2026-02-03
**Overall confidence:** HIGH

---

## Executive Summary

This research documents architecture patterns for integrating 8 advanced UI components (Tabs, Accordion, Data Table, Command Palette, Context Menu, Popover, Sheet, Dialog) into the existing Ember Noir design system.

**Key finding:** The codebase has established patterns that MUST be followed:

1. **Compound component pattern** with namespace attachment (e.g., `Modal.Header`, `Card.Title`)
2. **CVA variants** for type-safe styling with dark/light mode support
3. **Radix primitives** as the foundation for accessible, interactive components
4. **'use client' directive** only for interactive components; server-compatible wrappers where possible
5. **Dual export pattern**: both named exports and namespace-attached subcomponents

The existing Modal, Card, Select, and Tooltip components provide authoritative templates for new components.

---

## Component File Structure

All new components follow the established flat structure in `app/components/ui/`:

```
app/components/ui/
├── index.js                    # Barrel exports (update for each new component)
├── tabs.js                     # Tabs component (Radix-based)
├── accordion.js                # Accordion component (Radix-based)
├── data-table.js               # Data Table wrapper (TanStack Table)
├── data-table-columns.js       # Column definition helpers
├── command.js                  # Command Palette (cmdk-based)
├── context-menu.js             # Context Menu (Radix-based, replaces current)
├── popover.js                  # Popover (already have Radix, needs component)
├── sheet.js                    # Sheet/Side Panel (Dialog variant)
└── __tests__/
    ├── tabs.test.js
    ├── accordion.test.js
    ├── data-table.test.js
    ├── command.test.js
    ├── context-menu.test.js
    ├── popover.test.js
    └── sheet.test.js
```

**Rationale:** The codebase uses flat structure with single files per component (not nested folders). Tests go in `__tests__/` subdirectory. This matches existing patterns for Card.js, Modal.js, Select.js.

---

## Composition Patterns

### Pattern 1: Compound Components with Namespace (Primary Pattern)

This is the **established pattern** in this codebase. All new components MUST follow it.

```jsx
// Example: Tabs (following Modal.js pattern)
'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

// CVA variants
const tabsTriggerVariants = cva([...], { variants: {...} });

// Subcomponents
const TabsList = forwardRef(function TabsList({ className, ...props }, ref) {
  return <TabsPrimitive.List ref={ref} className={cn(...)} {...props} />;
});

const TabsTrigger = forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return <TabsPrimitive.Trigger ref={ref} className={cn(...)} {...props} />;
});

const TabsContent = forwardRef(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn(...)} {...props} />;
});

// Main component with simple API
function Tabs({ defaultValue, children, ...props }) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue} {...props}>
      {children}
    </TabsPrimitive.Root>
  );
}

// CRITICAL: Attach namespace components
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

// Named exports for tree-shaking
export { Tabs, TabsList, TabsTrigger, TabsContent };
export default Tabs;
```

**Usage:**
```jsx
<Tabs defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs>
```

### Pattern 2: Simple Wrapper + Compound (Dual API)

For backward compatibility, provide both simple and compound APIs (see Select.js, Tooltip.js).

```jsx
// Simple API (quick usage)
<Accordion items={[
  { trigger: 'Section 1', content: 'Content 1' },
  { trigger: 'Section 2', content: 'Content 2' },
]} />

// Compound API (full control)
<Accordion type="single" collapsible>
  <Accordion.Item value="item-1">
    <Accordion.Trigger>Section 1</Accordion.Trigger>
    <Accordion.Content>Content 1</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

---

## Server/Client Boundaries

| Component | Root | List/Trigger | Content | Rationale |
|-----------|------|--------------|---------|-----------|
| **Tabs** | Client | Client | Server-safe* | Triggers manage state; Content can render server content |
| **Accordion** | Client | Client | Server-safe* | Triggers manage expand/collapse state |
| **Data Table** | Client | - | - | TanStack hooks require client |
| **Command** | Client | Client | Client | All interactive (search, filtering, keyboard) |
| **Context Menu** | Client | Client | Client | Event handlers throughout |
| **Popover** | Client | Client | Client | Positioning requires client-side calculation |
| **Sheet** | Client | Client | Client | Modal behavior, animations |
| **Dialog** | Client | Client | Client | Already exists as Modal.js |

*Server-safe means the Content component CAN render Server Components as children, but the component itself needs 'use client' for Radix functionality.

**Key insight:** In Next.js App Router, 'use client' at the component level doesn't prevent Server Component children. The pattern:

```jsx
// tabs.js - 'use client' at top
// But content can receive server components:

// page.tsx (server)
import { Tabs } from '@/app/components/ui';
import { ServerDataDisplay } from './ServerDataDisplay'; // Server Component

export default function Page() {
  return (
    <Tabs defaultValue="data">
      <Tabs.List>
        <Tabs.Trigger value="data">Data</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="data">
        <ServerDataDisplay /> {/* This renders on server! */}
      </Tabs.Content>
    </Tabs>
  );
}
```

---

## CVA Integration Pattern

All components use CVA for type-safe variants. Follow the Modal.js and Card.js patterns:

```jsx
// 1. Define variants with dark/light mode support
const tabsTriggerVariants = cva(
  [
    // Base classes
    'px-4 py-2 font-medium font-display rounded-lg',
    'transition-colors duration-200',
    // Dark mode (default)
    'text-slate-400 hover:text-slate-200',
    'data-[state=active]:text-ember-400 data-[state=active]:bg-ember-900/30',
    // Light mode override
    '[html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:text-slate-800',
    '[html:not(.dark)_&]:data-[state=active]:text-ember-600',
    '[html:not(.dark)_&]:data-[state=active]:bg-ember-100',
  ],
  {
    variants: {
      variant: {
        default: '',
        ember: 'data-[state=active]:border-b-2 data-[state=active]:border-ember-500',
        underline: 'border-b-2 border-transparent data-[state=active]:border-slate-200',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-5 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// 2. Export variants for external composition
export { tabsTriggerVariants };

// 3. Use in component
const TabsTrigger = forwardRef(function TabsTrigger(
  { className, variant, size, ...props },
  ref
) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant, size }), className)}
      {...props}
    />
  );
});
```

**Critical pattern:** Light mode uses `[html:not(.dark)_&]:` prefix (not `.light` class). This matches the existing design system.

---

## Component-Specific Architecture

### 1. Tabs

**Package:** `@radix-ui/react-tabs` (already installed v1.1.12)

```jsx
// tabs.js structure
export const tabsListVariants = cva([...]);
export const tabsTriggerVariants = cva([...]);
export const tabsContentVariants = cva([...]);

function Tabs({ defaultValue, value, onValueChange, children, ...props }) {...}
const TabsList = forwardRef(function TabsList({...}) {...});
const TabsTrigger = forwardRef(function TabsTrigger({...}) {...});
const TabsContent = forwardRef(function TabsContent({...}) {...});

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
export default Tabs;
```

**Variants to support:**
- `variant`: default, ember, underline, pills
- `size`: sm, md, lg
- `orientation`: horizontal, vertical

---

### 2. Accordion

**Package:** `@radix-ui/react-accordion` (NOT installed - needs adding)

```jsx
// accordion.js structure
export const accordionVariants = cva([...]);
export const accordionItemVariants = cva([...]);
export const accordionTriggerVariants = cva([...]);
export const accordionContentVariants = cva([...]);

function Accordion({ type = 'single', collapsible = true, items, children, ...props }) {
  // Support both simple API (items prop) and compound API (children)
  if (items) {
    return (
      <AccordionPrimitive.Root type={type} collapsible={collapsible} {...props}>
        {items.map((item, i) => (
          <AccordionItem key={i} value={\`item-\${i}\`}>
            <AccordionTrigger>{item.trigger}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </AccordionPrimitive.Root>
    );
  }
  return (
    <AccordionPrimitive.Root type={type} collapsible={collapsible} {...props}>
      {children}
    </AccordionPrimitive.Root>
  );
}

const AccordionItem = forwardRef(function AccordionItem({...}) {...});
const AccordionTrigger = forwardRef(function AccordionTrigger({...}) {...});
const AccordionContent = forwardRef(function AccordionContent({...}) {...});

Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
export default Accordion;
```

**Radix features to expose:**
- `type`: 'single' | 'multiple'
- `collapsible`: boolean (for single type)
- `defaultValue` / `value` / `onValueChange`: controlled/uncontrolled

---

### 3. Data Table

**Package:** `@tanstack/react-table` (needs installing)

**Architecture:** Data Table is a complex component that wraps TanStack Table with Ember Noir styling.

```jsx
// data-table.js - Client component (TanStack requires hooks)
'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils/cn';

function DataTable({
  data,
  columns,
  pagination = true,
  sorting = true,
  filtering = false,
  className,
  ...props
}) {
  const [sortingState, setSortingState] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(sorting && { getSortedRowModel: getSortedRowModel(), onSortingChange: setSortingState }),
    ...(filtering && { getFilteredRowModel: getFilteredRowModel(), onColumnFiltersChange: setColumnFilters }),
    ...(pagination && { getPaginationRowModel: getPaginationRowModel() }),
    state: { sorting: sortingState, columnFilters },
  });

  return (
    <div className={cn('rounded-2xl border border-white/[0.06] overflow-hidden', className)}>
      <table className="w-full">
        <DataTableHeader table={table} />
        <DataTableBody table={table} />
      </table>
      {pagination && <DataTablePagination table={table} />}
    </div>
  );
}

// Subcomponents for customization
const DataTableHeader = ({ table }) => {...};
const DataTableBody = ({ table }) => {...};
const DataTableRow = forwardRef(({...}) => {...});
const DataTableCell = forwardRef(({...}) => {...});
const DataTablePagination = ({ table }) => {...};

DataTable.Header = DataTableHeader;
DataTable.Body = DataTableBody;
DataTable.Row = DataTableRow;
DataTable.Cell = DataTableCell;
DataTable.Pagination = DataTablePagination;

export { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell, DataTablePagination };
export default DataTable;
```

**Usage pattern (following shadcn/ui architecture):**

```jsx
// columns.tsx - Client component for column definitions
'use client';
import { createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper();
export const columns = [
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('status', { header: 'Status', cell: (info) => <Badge>{info.getValue()}</Badge> }),
];

// page.tsx - Server component fetches data
import { DataTable } from '@/app/components/ui';
import { columns } from './columns';

export default async function Page() {
  const data = await fetchData(); // Server-side fetch
  return <DataTable data={data} columns={columns} />;
}
```

---

### 4. Command Palette

**Package:** `cmdk` (needs installing)

**Architecture:** Command wraps cmdk with Ember Noir styling and keyboard shortcut handling.

```jsx
// command.js
'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { forwardRef, useEffect, useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { Search } from 'lucide-react';

const commandVariants = cva([
  'flex flex-col w-full overflow-hidden rounded-2xl',
  'bg-slate-900/95 backdrop-blur-3xl',
  'border border-white/[0.08]',
  '[html:not(.dark)_&]:bg-white/95 [html:not(.dark)_&]:border-slate-200',
]);

function Command({ className, ...props }) {
  return (
    <CommandPrimitive
      className={cn(commandVariants(), className)}
      {...props}
    />
  );
}

// Dialog variant (Cmd+K triggered)
function CommandDialog({ open, onOpenChange, children }) {
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} size="lg">
      <Command>{children}</Command>
    </Modal>
  );
}

const CommandInput = forwardRef(({...}) => {...});
const CommandList = forwardRef(({...}) => {...});
const CommandEmpty = forwardRef(({...}) => {...});
const CommandGroup = forwardRef(({...}) => {...});
const CommandItem = forwardRef(({...}) => {...});
const CommandSeparator = forwardRef(({...}) => {...});
const CommandShortcut = ({...}) => {...};

Command.Dialog = CommandDialog;
Command.Input = CommandInput;
Command.List = CommandList;
Command.Empty = CommandEmpty;
Command.Group = CommandGroup;
Command.Item = CommandItem;
Command.Separator = CommandSeparator;
Command.Shortcut = CommandShortcut;

export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut };
export default Command;
```

---

### 5. Context Menu (Replacement)

**Package:** `@radix-ui/react-context-menu` (NOT installed - needs adding)

The current `ContextMenu.js` is a custom implementation. Replace with Radix for full accessibility:

```jsx
// context-menu.js (replaces current implementation)
'use client';

import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { Check, ChevronRight, Circle } from 'lucide-react';

const contextMenuContentVariants = cva([
  'min-w-[12rem] overflow-hidden rounded-xl p-1',
  'bg-slate-800/95 backdrop-blur-2xl',
  'border border-slate-700/60',
  'shadow-lg',
  '[html:not(.dark)_&]:bg-white/95 [html:not(.dark)_&]:border-slate-200',
  'animate-in fade-in-0 zoom-in-95',
]);

function ContextMenu({ children, ...props }) {
  return <ContextMenuPrimitive.Root {...props}>{children}</ContextMenuPrimitive.Root>;
}

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuContent = forwardRef(({...}) => {...});
const ContextMenuItem = forwardRef(({...}) => {...});
const ContextMenuCheckboxItem = forwardRef(({...}) => {...});
const ContextMenuRadioItem = forwardRef(({...}) => {...});
const ContextMenuLabel = forwardRef(({...}) => {...});
const ContextMenuSeparator = forwardRef(({...}) => {...});
const ContextMenuSubTrigger = forwardRef(({...}) => {...});
const ContextMenuSubContent = forwardRef(({...}) => {...});

ContextMenu.Trigger = ContextMenuTrigger;
ContextMenu.Content = ContextMenuContent;
ContextMenu.Item = ContextMenuItem;
// ... etc

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ... };
export default ContextMenu;
```

**Migration:** The current ContextMenu uses a simple items array. Provide backward-compatible API:

```jsx
// Simple API (backward compatible)
<ContextMenu items={[
  { label: 'Edit', icon: 'pencil', onClick: handleEdit },
  { label: 'Delete', icon: 'trash', onClick: handleDelete, variant: 'danger' },
]} />

// Compound API (full Radix features)
<ContextMenu>
  <ContextMenu.Trigger>
    <div>Right-click me</div>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item onSelect={handleEdit}>Edit</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item onSelect={handleDelete} variant="danger">Delete</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu>
```

---

### 6. Popover

**Package:** `@radix-ui/react-popover` (already installed v1.1.14)

The package is installed but no component exists. Create one:

```jsx
// popover.js
'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

const popoverContentVariants = cva([
  'z-50 w-72 rounded-xl p-4',
  'bg-slate-800/95 backdrop-blur-2xl',
  'border border-slate-700/60',
  'shadow-lg outline-none',
  '[html:not(.dark)_&]:bg-white/95 [html:not(.dark)_&]:border-slate-200',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
  'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
]);

function Popover({ children, ...props }) {
  return <PopoverPrimitive.Root {...props}>{children}</PopoverPrimitive.Root>;
}

const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;
const PopoverClose = PopoverPrimitive.Close;

const PopoverContent = forwardRef(function PopoverContent(
  { className, align = 'center', sideOffset = 4, ...props },
  ref
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(popoverContentVariants(), className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});

Popover.Trigger = PopoverTrigger;
Popover.Anchor = PopoverAnchor;
Popover.Content = PopoverContent;
Popover.Close = PopoverClose;

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent, PopoverClose, popoverContentVariants };
export default Popover;
```

---

### 7. Sheet (Side Panel)

**Package:** `@radix-ui/react-dialog` (already installed - reuse)

Sheet is a Dialog variant that slides in from the side. Use the existing Dialog primitive:

```jsx
// sheet.js
'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

const sheetContentVariants = cva(
  [
    'fixed z-50 gap-4 p-6',
    'bg-slate-900/95 backdrop-blur-3xl',
    'border-slate-700/50',
    'shadow-xl',
    '[html:not(.dark)_&]:bg-white/95 [html:not(.dark)_&]:border-slate-200',
    'transition-all duration-300 ease-out',
  ],
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=open]:animate-slide-in-from-top data-[state=closed]:animate-slide-out-to-top',
        bottom: 'inset-x-0 bottom-0 border-t data-[state=open]:animate-slide-in-from-bottom data-[state=closed]:animate-slide-out-to-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=open]:animate-slide-in-from-left data-[state=closed]:animate-slide-out-to-left',
        right: 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=open]:animate-slide-in-from-right data-[state=closed]:animate-slide-out-to-right',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

function Sheet({ open, onOpenChange, children, ...props }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </DialogPrimitive.Root>
  );
}

const SheetTrigger = DialogPrimitive.Trigger;

const SheetOverlay = forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50',
        'bg-slate-950/70 [html:not(.dark)_&]:bg-slate-900/40',
        'backdrop-blur-sm',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className
      )}
      {...props}
    />
  );
});

const SheetContent = forwardRef(function SheetContent(
  { className, children, side = 'right', ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(sheetContentVariants({ side }), className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-2 hover:bg-white/[0.06]">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

const SheetHeader = forwardRef(function SheetHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col space-y-2 mb-6', className)} {...props} />;
});

const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;
const SheetFooter = forwardRef(function SheetFooter({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6', className)} {...props} />;
});

Sheet.Trigger = SheetTrigger;
Sheet.Content = SheetContent;
Sheet.Header = SheetHeader;
Sheet.Title = SheetTitle;
Sheet.Description = SheetDescription;
Sheet.Footer = SheetFooter;

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, sheetContentVariants };
export default Sheet;
```

---

### 8. Dialog (Already Exists)

The existing Modal.js IS the Dialog component. No new component needed. Consider:

1. **Export alias in index.js:**
   ```jsx
   export { default as Dialog } from './Modal'; // Alias for discoverability
   ```

2. **Add description subcomponent** (already exists as Modal.Description)

3. **Consider renaming** Modal to Dialog for consistency with Radix naming (breaking change - defer to user decision)

---

## Build Order (Dependency-Based)

Components should be built in this order based on dependencies:

| Order | Component | Dependencies | Rationale |
|-------|-----------|--------------|-----------|
| 1 | **Popover** | None (Radix installed) | Foundation for Tooltip, DropdownMenu patterns |
| 2 | **Tabs** | None (Radix installed) | Simple, high-value, establishes patterns |
| 3 | **Accordion** | Need to install Radix | Similar to Tabs, extends patterns |
| 4 | **Sheet** | Reuses Modal/Dialog | Variant of existing component |
| 5 | **Context Menu** | Need to install Radix | Replaces existing implementation |
| 6 | **Command** | Need to install cmdk, uses Modal | Depends on Modal for dialog variant |
| 7 | **Data Table** | Need to install TanStack, uses all above | Most complex, may use Popover for filters |

**Packages to install:**
```bash
# Phase 1: Accordion and Context Menu
npm install @radix-ui/react-accordion @radix-ui/react-context-menu

# Phase 2: Command Palette
npm install cmdk

# Phase 3: Data Table
npm install @tanstack/react-table
```

---

## Integration with Existing Components

### With Device Cards

```jsx
// Using Tabs in device settings
<DeviceCard icon="fire" title="Stufa">
  <Tabs defaultValue="status">
    <Tabs.List>
      <Tabs.Trigger value="status">Stato</Tabs.Trigger>
      <Tabs.Trigger value="schedule">Programma</Tabs.Trigger>
      <Tabs.Trigger value="settings">Impostazioni</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="status">
      <StatusDisplay />
    </Tabs.Content>
    <Tabs.Content value="schedule">
      <ScheduleEditor />
    </Tabs.Content>
  </Tabs>
</DeviceCard>
```

### With DashboardLayout

```jsx
// Sheet for mobile navigation / settings panel
<DashboardLayout>
  <Sheet>
    <Sheet.Trigger asChild>
      <Button variant="ghost" size="icon">
        <Menu />
      </Button>
    </Sheet.Trigger>
    <Sheet.Content side="left">
      <NavigationMenu />
    </Sheet.Content>
  </Sheet>
</DashboardLayout>
```

### With Command for Global Search

```jsx
// In layout.tsx
<Command.Dialog open={open} onOpenChange={setOpen}>
  <Command.Input placeholder="Cerca dispositivi, azioni..." />
  <Command.List>
    <Command.Empty>Nessun risultato.</Command.Empty>
    <Command.Group heading="Dispositivi">
      <Command.Item onSelect={() => navigate('/stove')}>
        Stufa
      </Command.Item>
      <Command.Item onSelect={() => navigate('/thermostat')}>
        Termostato
      </Command.Item>
    </Command.Group>
    <Command.Group heading="Azioni">
      <Command.Item onSelect={() => toggleStove()}>
        Accendi Stufa
        <Command.Shortcut>Cmd+S</Command.Shortcut>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
```

---

## Index.js Update Template

After implementing all components, update `app/components/ui/index.js`:

```jsx
// ... existing exports ...

// Tabs (v3.x+)
export { default as Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants } from './tabs';

// Accordion (v3.x+)
export { default as Accordion, AccordionItem, AccordionTrigger, AccordionContent, accordionVariants } from './accordion';

// Data Table (v3.x+)
export { default as DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableCell, DataTablePagination } from './data-table';

// Command Palette (v3.x+)
export { default as Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from './command';

// Context Menu - updated (v3.x+)
export { default as ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from './context-menu';

// Popover (v3.x+)
export { default as Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose, popoverContentVariants } from './popover';

// Sheet (v3.x+)
export { default as Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, sheetContentVariants } from './sheet';

// Dialog alias (v3.x+)
export { default as Dialog } from './Modal';
```

---

## Anti-Patterns to Avoid

### 1. Creating Nested Folder Structure
```
// WRONG - codebase uses flat structure
src/components/ui/tabs/
├── index.ts
├── tabs.tsx
└── tabs.types.ts

// CORRECT - follow existing pattern
app/components/ui/
├── tabs.js
└── __tests__/tabs.test.js
```

### 2. Using .tsx Extensions
```jsx
// WRONG - codebase uses .js
tabs.tsx

// CORRECT
tabs.js
```

### 3. Forgetting Namespace Attachment
```jsx
// WRONG - missing namespace
export { Tabs, TabsList, TabsTrigger };
export default Tabs;

// CORRECT - attach to namespace
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
export { Tabs, TabsList, TabsTrigger };
export default Tabs;
```

### 4. Missing Dark/Light Mode Support
```jsx
// WRONG - dark mode only
'bg-slate-800 text-slate-200'

// CORRECT - both modes
'bg-slate-800 text-slate-200 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:text-slate-800'
```

### 5. Missing forwardRef
```jsx
// WRONG - no ref forwarding
function TabsTrigger({ className, ...props }) {
  return <TabsPrimitive.Trigger className={cn(...)} {...props} />;
}

// CORRECT - always forward refs for primitives
const TabsTrigger = forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return <TabsPrimitive.Trigger ref={ref} className={cn(...)} {...props} />;
});
```

---

## Accessibility Checklist

All components must follow existing accessibility patterns (see Modal.js, Select.js):

- [ ] Radix primitives handle ARIA attributes automatically
- [ ] Focus management works correctly (focus trap for modals/sheets)
- [ ] Keyboard navigation works (Tab, Arrow keys, Escape)
- [ ] Screen reader announcements are meaningful
- [ ] Visible focus indicators use ember glow ring
- [ ] Reduced motion respected (motion-reduce: variant)
- [ ] Touch targets are at least 44px (mobile)

---

## Testing Patterns

Follow existing test structure in `__tests__/`:

```jsx
// __tests__/tabs.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from '../tabs';

describe('Tabs', () => {
  it('renders with default tab selected', () => {
    render(
      <Tabs defaultValue="tab1">
        <Tabs.List>
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
      </Tabs>
    );

    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByText('Content 1')).toBeVisible();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('switches tabs on click', async () => {
    const user = userEvent.setup();
    // ... test implementation
  });

  it('supports keyboard navigation', async () => {
    // ... test arrow key navigation
  });
});
```

---

## Sources

- [Radix UI Accordion Documentation](https://www.radix-ui.com/primitives/docs/components/accordion)
- [Radix UI Collapsible Documentation](https://www.radix-ui.com/primitives/docs/components/collapsible)
- [Radix UI Context Menu Documentation](https://www.radix-ui.com/primitives/docs/components/context-menu)
- [Radix UI Dropdown Menu Documentation](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)
- [Radix UI Popover Documentation](https://www.radix-ui.com/primitives/docs/components/popover)
- [Radix UI Dialog Documentation](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix UI Server-Side Rendering Guide](https://www.radix-ui.com/primitives/docs/guides/server-side-rendering)
- [cmdk GitHub Repository](https://cmdk.paco.me/)
- [shadcn/ui Command Component](https://www.shadcn.io/ui/command)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [shadcn/ui Data Table Pattern](https://ui.shadcn.com/docs/components/data-table)

---

*Researched: 2026-02-03*
*Confidence: HIGH - patterns derived from existing codebase analysis*
