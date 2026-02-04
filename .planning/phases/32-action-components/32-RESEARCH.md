# Phase 32: Action Components - Research

**Researched:** 2026-02-04
**Domain:** Context Menu (right-click/long-press) and Command Palette (⌘K) for React/Next.js
**Confidence:** HIGH

## Summary

This phase implements two distinct interaction patterns: Context Menu (right-click on desktop, long-press on mobile) and Command Palette (⌘K/Ctrl+K fuzzy search). The standard stack is Radix UI's Context Menu primitive for right-click menus and cmdk (by Paco Coursey) for command palettes. Both are widely adopted in production applications (Linear, Raycast, Vercel).

The project already uses Radix UI extensively (@radix-ui/react-dialog, @radix-ui/react-dropdown-menu, etc.), so adding @radix-ui/react-context-menu maintains consistency. The existing ContextMenu.js component is actually a dropdown menu (click-triggered), not a true context menu, so this phase will create a new component following Radix patterns.

User decisions from CONTEXT.md establish: scale animation on long-press (iOS-style), icons on all menu items, no keyboard shortcuts in menu items (shown in Command Palette instead), grouped commands with section headers, full-screen mobile layout, haptic feedback, and blur+dim backdrop matching existing Sheet/Modal patterns.

**Primary recommendation:** Use @radix-ui/react-context-menu v2.2.16 with use-long-press v3.3.0 for mobile long-press detection, and cmdk (latest) with built-in fuzzy search for Command Palette. Namespace components (ContextMenu.Trigger, CommandPalette.Input) matching existing Sheet/Modal architecture.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-context-menu | 2.2.16 | Right-click/long-press context menus | Industry standard (1281+ projects), built-in accessibility, keyboard navigation, collision detection, mobile touch support |
| cmdk | 1.0.0+ | Command palette with fuzzy search | Powers Linear, Raycast, Vercel command menus. Built-in filtering/sorting, accessible combobox, Dialog integration |
| use-long-press | 3.3.0 | Long-press detection for mobile | Configurable threshold, touch event handling, onStart/onFinish/onCancel callbacks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | 1.1.14 | Command Palette modal container | Already in project. cmdk Dialog component wraps this for overlay pattern |
| lucide-react | 0.562.0 | Menu item icons | Already in project. Consistent icon system across all components |
| class-variance-authority | 0.7.1 | CVA variants for menu styling | Already in project. Type-safe variant composition for menu items |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Context Menu | Custom implementation with useEffect | Radix handles collision detection, accessibility, keyboard navigation, submenus, checkable items—hand-rolling loses all of this |
| cmdk | kbar, react-cmdk | cmdk is the most battle-tested (Linear, Raycast), smallest bundle, built-in Dialog integration |
| use-long-press | Custom useEffect with touch events | Library handles threshold timing, cancelation on scroll, cross-browser touch quirks |

**Installation:**
```bash
npm install @radix-ui/react-context-menu use-long-press cmdk
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── components/
│   ├── ui/
│   │   ├── ContextMenu.js           # Rename existing to Dropdown.js
│   │   ├── RightClickMenu.js        # NEW: Radix Context Menu wrapper
│   │   ├── CommandPalette.js        # NEW: cmdk Dialog wrapper
│   │   └── Kbd.js                   # NEW: Keyboard shortcut display component
│   └── layout/
│       └── CommandPaletteProvider.js # Global ⌘K handler + command registry
├── hooks/
│   ├── useLongPress.js              # Re-export use-long-press with project defaults
│   └── useCommandPalette.js         # Hook to register commands, open/close palette
└── lib/
    └── commands/
        ├── navigationCommands.js     # "Go to Dashboard", "Go to Settings"
        ├── deviceCommands.js         # "Turn on Stove", "Set Temperature"
        └── settingsCommands.js       # "Toggle Dark Mode", "Clear Cache"
```

### Pattern 1: Namespace Component Pattern (Existing Project Pattern)
**What:** Group related sub-components under parent component namespace (e.g., Sheet.Content, Sheet.Header)
**When to use:** Complex components with multiple parts (Context Menu, Command Palette)
**Example:**
```javascript
// Source: Existing project pattern from Sheet.js
// app/components/ui/RightClickMenu.js
function RightClickMenu({ children, ...props }) {
  return (
    <RadixContextMenu.Root {...props}>
      {children}
    </RadixContextMenu.Root>
  );
}

RightClickMenu.Trigger = RadixContextMenu.Trigger;
RightClickMenu.Content = RightClickMenuContent; // Wrapped with CVA variants
RightClickMenu.Item = RightClickMenuItem;
RightClickMenu.CheckboxItem = RightClickMenuCheckboxItem;
RightClickMenu.Separator = RadixContextMenu.Separator;
RightClickMenu.Label = RadixContextMenu.Label;
RightClickMenu.Group = RadixContextMenu.Group;

export default RightClickMenu;
```

### Pattern 2: Long-Press with Visual Feedback
**What:** Combine use-long-press hook with scale animation (iOS-style) during press
**When to use:** Mobile context menu triggers
**Example:**
```javascript
// Source: User decision from CONTEXT.md + https://motion.dev/docs/react-animation
import { useLongPress } from 'use-long-press';
import { motion } from 'framer-motion'; // If Framer Motion is added

function DeviceCard({ device }) {
  const [isPressed, setIsPressed] = useState(false);

  const bind = useLongPress(() => {
    // Open context menu
    openContextMenu();
    // Trigger haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10); // Light vibration on open
    }
  }, {
    threshold: 500, // Platform convention: 500ms
    onStart: () => setIsPressed(true),
    onFinish: () => setIsPressed(false),
    onCancel: () => setIsPressed(false),
  });

  return (
    <motion.div
      {...bind()}
      animate={{ scale: isPressed ? 0.95 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Card content */}
    </motion.div>
  );
}
```

### Pattern 3: Command Palette with Dialog Integration
**What:** cmdk provides Command.Dialog component that wraps Radix Dialog for modal overlay pattern
**When to use:** Command Palette (not inline combobox)
**Example:**
```javascript
// Source: https://github.com/pacocoursey/cmdk + https://ui.shadcn.com/docs/components/radix/command
import { Command } from 'cmdk';

function CommandPalette({ open, onOpenChange }) {
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="fixed inset-0 z-50"
    >
      {/* Overlay with blur+dim (match Sheet pattern) */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />

      {/* Command Palette content */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <Command className="rounded-3xl border border-slate-700/50 bg-slate-900/95">
          <Command.Input placeholder="Type a command or search..." />
          <Command.List>
            <Command.Empty>No results found.</Command.Empty>

            <Command.Group heading="Navigation">
              <Command.Item>
                <span>Dashboard</span>
                <Kbd>⌘D</Kbd>
              </Command.Item>
            </Command.Group>

            <Command.Separator />

            <Command.Group heading="Device Actions">
              <Command.Item>
                <span>Turn on Stove</span>
                <Kbd>⌘S</Kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </Command.Dialog>
  );
}
```

### Pattern 4: Global Keyboard Shortcut Handler
**What:** useEffect with keydown listener to detect ⌘K/Ctrl+K, prevent default browser behavior
**When to use:** Command Palette trigger
**Example:**
```javascript
// Source: https://www.taniarascia.com/keyboard-shortcut-hook-react/
// app/components/layout/CommandPaletteProvider.js
function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); // Prevent browser's default "focus address bar"
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
```

### Pattern 5: CVA Variants for Menu Items
**What:** Use CVA to create type-safe menu item variants (existing project pattern)
**When to use:** Styling menu items with different states (default, destructive, checkable)
**Example:**
```javascript
// Source: Existing project pattern from Sheet.js + user decision (no destructive styling)
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const menuItemVariants = cva(
  [
    'relative flex items-center gap-3 px-3 py-2 rounded-xl',
    'text-sm font-medium cursor-pointer',
    'text-slate-300 [html:not(.dark)_&]:text-slate-700',
    'hover:bg-slate-700/50 [html:not(.dark)_&]:hover:bg-slate-100',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
    'transition-colors duration-150',
  ],
  {
    variants: {
      // User decision: No destructive variant (rely on label clarity)
    },
    defaultVariants: {},
  }
);

const RightClickMenuItem = forwardRef(function RightClickMenuItem(
  { className, icon, children, ...props },
  ref
) {
  return (
    <RadixContextMenu.Item
      ref={ref}
      className={cn(menuItemVariants(), className)}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </RadixContextMenu.Item>
  );
});
```

### Anti-Patterns to Avoid
- **Hand-rolling context menu positioning:** Radix handles collision detection, viewport constraints, submenus—custom solutions miss edge cases
- **Custom fuzzy search in Command Palette:** cmdk's built-in `command-score` algorithm is battle-tested; custom implementations are slower and less accurate
- **Not preventing default on ⌘K:** Browser focuses address bar; always call `e.preventDefault()`
- **Missing focus trap in Command Palette:** Radix Dialog handles this automatically; custom modals often forget
- **Ignoring haptic feedback on mobile:** User decision requires haptics; test with `navigator.vibrate()` API (supported in modern browsers)
- **Text selection during long-press on iOS:** Apply `WebkitUserSelect: 'none'`, `userSelect: 'none'`, `WebkitTouchCallout: 'none'` to trigger elements

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Context menu positioning | Custom absolute positioning with viewport detection | Radix Context Menu collision detection | Radix handles submenus, scrollable content, viewport edges, reading direction—custom solutions break in edge cases |
| Long-press detection | useEffect with touchstart/touchend | use-long-press library | Handles scroll cancelation, threshold timing, pressure sensitivity, cross-browser touch event quirks |
| Fuzzy search filtering | Custom string matching with .includes() | cmdk's built-in command-score | Considers continuous matches, word jumps, character position weighting—manual scoring is inaccurate |
| Keyboard shortcut detection | Multiple useEffect hooks per component | Single global handler with command registry | Prevents conflicts, centralizes preventDefault, enables runtime remapping |
| Command Palette Dialog | Custom modal with overlay | cmdk Command.Dialog | Wraps Radix Dialog, handles focus trap, ESC key, backdrop click, aria attributes |
| Mobile haptic feedback | Custom vibration patterns | navigator.vibrate() Web API | Standardized, works in modern browsers, iOS/Android compatible |
| Keyboard shortcut display | Custom <span> with styling | Kbd component (Radix Themes pattern) | Consistent sizing, platform-aware rendering (⌘ on Mac, Ctrl on Windows) |

**Key insight:** Context Menu and Command Palette are deceptively complex—accessibility, keyboard navigation, collision detection, focus management, and mobile touch handling have dozens of edge cases. Battle-tested libraries (Radix, cmdk) solve all of these; custom implementations take weeks and still miss edge cases.

## Common Pitfalls

### Pitfall 1: Text Selection on iOS Long-Press
**What goes wrong:** On iOS Safari, long-press on context menu trigger selects text inside the element, showing native selection UI and context menu simultaneously.
**Why it happens:** iOS defaults to text selection on long-press. Radix sets `WebkitTouchCallout: 'none'` but this doesn't prevent text selection, only the native callout menu.
**How to avoid:** Apply these CSS properties to trigger elements:
```css
-webkit-user-select: none;
user-select: none;
-webkit-touch-callout: none;
```
**Warning signs:** Blue text selection highlight appears during long-press on mobile Safari.
**Source:** [Radix UI GitHub Discussion #930](https://github.com/radix-ui/primitives/discussions/930)

### Pitfall 2: Missing preventDefault on ⌘K/Ctrl+K
**What goes wrong:** Browser's default behavior (focus address bar, search bar, or browser-specific shortcuts) fires instead of opening Command Palette.
**Why it happens:** Browsers have native shortcuts for Ctrl+K (search) and Cmd+K (varies by browser). Event handlers don't automatically prevent defaults.
**How to avoid:** Always call `e.preventDefault()` in keyboard shortcut handler:
```javascript
if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
  e.preventDefault(); // CRITICAL: Prevent browser default
  setOpen(true);
}
```
**Warning signs:** Command Palette opens but browser also focuses address bar or opens search.
**Source:** [FreeCodeCamp Tutorial (Dec 2024)](https://www.freecodecamp.org/news/how-to-build-a-reusable-keyboard-shortcut-listener-component-in-react/)

### Pitfall 3: Focus Trap Without Escape Route
**What goes wrong:** Command Palette opens, focus is trapped inside, but ESC key doesn't close it or there's no visible close button. Keyboard users are stuck.
**Why it happens:** Focus trap is implemented but no exit mechanism is provided. WCAG 2.1.2 requires keyboard users to move focus freely.
**How to avoid:** Always provide:
- ESC key handler to close (Radix Dialog handles this automatically)
- Visible close button with keyboard focus
- Focus return to element that triggered palette on close
**Warning signs:** Tab key cycles through palette items indefinitely, ESC does nothing.
**Source:** [Okenlabs: Accessibility Focus Traps](https://okenlabs.com/blog/accessibility-implementing-focus-traps/)

### Pitfall 4: Z-Index Conflicts with Portals
**What goes wrong:** Command Palette or Context Menu appears behind other UI elements (navigation, modals) despite high z-index value.
**Why it happens:** Parent element creates new stacking context (position: relative, z-index, transform, etc.). z-index is relative to stacking context, not global.
**How to avoid:**
- Use React Portal to render at document.body level (Radix does this automatically)
- Use `position: fixed` instead of `absolute` for overlay components
- Ensure portal target (#modal-root) has high z-index on body
**Warning signs:** Inspecting element shows z-index: 9999 but still renders behind lower z-index elements.
**Source:** [Developer Way: Positioning and Portals in React](https://www.developerway.com/posts/positioning-and-portals-in-react)

### Pitfall 5: Forgetting Mobile Full-Screen Layout
**What goes wrong:** Command Palette renders as small centered dialog on mobile, making touch targets too small and search input hard to focus.
**Why it happens:** Desktop-first design with fixed max-width and centered positioning doesn't adapt to mobile viewports.
**How to avoid:** User decision specifies full-screen on mobile. Use responsive classes:
```javascript
// Desktop: centered dialog with max-width
// Mobile: full-screen with touch-friendly spacing
<div className="
  fixed inset-x-4 top-20 md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
  w-auto md:w-full md:max-w-2xl
  max-h-[85vh] md:max-h-[600px]
">
```
**Warning signs:** On mobile, command palette appears as tiny centered box, keyboard covers half the results.
**Source:** User decision from CONTEXT.md + existing Sheet pattern (full-screen on mobile)

### Pitfall 6: Long-Press Threshold Too Short or Too Long
**What goes wrong:**
- Too short (< 400ms): Accidental triggers during scrolling
- Too long (> 700ms): Feels unresponsive, users think it's broken
**Why it happens:** No platform guidelines consulted, arbitrary value chosen.
**How to avoid:** Use platform convention: **500ms** (iOS default, Android recommends 400-600ms). Configurable via use-long-press:
```javascript
useLongPress(callback, { threshold: 500 })
```
**Warning signs:** User complaints about "too sensitive" or "doesn't work" on mobile.
**Source:** [React Native Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/long-press-gesture/)

### Pitfall 7: Context Menu Doesn't Close on iOS Touch Outside
**What goes wrong:** User taps outside context menu, moves finger slightly before lifting, menu doesn't close (iOS Safari).
**Why it happens:** iOS touch event model differs from pointer events. `onPointerDownOutside` doesn't capture the move-before-lift gesture.
**How to avoid:** Radix handles this in recent versions. If issue persists, add custom touch handler:
```javascript
<RadixContextMenu.Content
  onPointerDownOutside={(e) => {
    // Force close on any outside interaction
    e.preventDefault();
  }}
>
```
**Warning signs:** Context menu stays open after tapping outside on iOS Safari only.
**Source:** [Radix UI GitHub Issue #1727](https://github.com/radix-ui/primitives/issues/1727)

### Pitfall 8: Missing Haptic Feedback on Mobile
**What goes wrong:** Context menu opens/selects item on mobile but no tactile feedback, feels "dead" compared to native apps.
**Why it happens:** Developer forgets to implement or assumes browser handles automatically.
**How to avoid:** User decision requires haptics. Add to open and select events:
```javascript
// On menu open
if (navigator.vibrate) {
  navigator.vibrate(10); // Light vibration
}

// On item select
if (navigator.vibrate) {
  navigator.vibrate([10, 20, 10]); // Confirmation pattern
}
```
**Warning signs:** Mobile testers report "feels less responsive than expected."
**Source:** User decision from CONTEXT.md + [MDN Web Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)

## Code Examples

Verified patterns from official sources:

### Context Menu with Checkable Items
```javascript
// Source: https://www.radix-ui.com/primitives/docs/components/context-menu
import * as ContextMenu from '@radix-ui/react-context-menu';

function DeviceCard({ device }) {
  const [autoMode, setAutoMode] = useState(device.autoMode);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        {/* Device card content - right-click to open menu */}
        <div className="p-4 rounded-xl bg-slate-800">
          {device.name}
        </div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[220px] rounded-xl bg-slate-900/95 backdrop-blur-3xl p-2">
          {/* Regular items */}
          <ContextMenu.Item className="px-3 py-2 rounded-lg">
            View Details
          </ContextMenu.Item>

          {/* Separator */}
          <ContextMenu.Separator className="h-px bg-slate-700/50 my-1" />

          {/* Checkable item (toggle state) */}
          <ContextMenu.CheckboxItem
            checked={autoMode}
            onCheckedChange={setAutoMode}
            className="px-3 py-2 rounded-lg flex items-center gap-2"
          >
            <ContextMenu.ItemIndicator>
              <Check className="w-4 h-4" />
            </ContextMenu.ItemIndicator>
            Auto Mode
          </ContextMenu.CheckboxItem>

          {/* Submenu */}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className="px-3 py-2 rounded-lg">
              More Options →
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className="min-w-[220px] rounded-xl bg-slate-900/95">
                <ContextMenu.Item>Reset</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
```

### Command Palette with Grouped Commands
```javascript
// Source: https://github.com/pacocoursey/cmdk + https://ui.shadcn.com/docs/components/radix/command
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';

function CommandPalette({ open, onOpenChange }) {
  const router = useRouter();

  // Auto-focus input when opened (user decision from CONTEXT.md)
  useEffect(() => {
    if (open) {
      // cmdk handles focus automatically
    }
  }, [open]);

  const handleSelect = (callback) => {
    callback();
    onOpenChange(false); // Close after action

    // Haptic feedback on selection (user decision)
    if (navigator.vibrate) {
      navigator.vibrate([10, 20, 10]);
    }
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      loop // Enable arrow key wrapping
    >
      {/* Backdrop with blur+dim (match Sheet pattern) */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" />

      {/* Command Palette - Full screen on mobile (user decision) */}
      <div className="
        fixed inset-x-4 top-20 md:left-1/2 md:top-1/2
        md:-translate-x-1/2 md:-translate-y-1/2
        w-auto md:w-full md:max-w-2xl
      ">
        <Command className="rounded-3xl border border-slate-700/50 bg-slate-900/95 shadow-card-elevated">
          {/* Search input with placeholder (user decision) */}
          <Command.Input
            placeholder="Press ⌘K to open"
            autoFocus
          />

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty>No results found.</Command.Empty>

            {/* Navigation commands (user decision: grouped by type) */}
            <Command.Group heading="Navigation">
              <Command.Item
                onSelect={() => handleSelect(() => router.push('/dashboard'))}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
                <Kbd>⌘D</Kbd>
              </Command.Item>

              <Command.Item onSelect={() => handleSelect(() => router.push('/settings'))}>
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </div>
                <Kbd>⌘,</Kbd>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-slate-700/50 my-2" />

            {/* Device actions (user decision: grouped by type) */}
            <Command.Group heading="Device Actions">
              <Command.Item onSelect={() => handleSelect(() => turnOnStove())}>
                <div className="flex items-center gap-3">
                  <Power className="w-4 h-4" />
                  <span>Turn on Stove</span>
                </div>
                <Kbd>⌘S</Kbd>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-slate-700/50 my-2" />

            {/* Settings (user decision: grouped by type) */}
            <Command.Group heading="Settings">
              <Command.Item onSelect={() => handleSelect(() => toggleDarkMode())}>
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4" />
                  <span>Toggle Dark Mode</span>
                </div>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </Command.Dialog>
  );
}
```

### Global Keyboard Shortcut Handler (⌘K/Ctrl+K)
```javascript
// Source: https://www.taniarascia.com/keyboard-shortcut-hook-react/
// app/components/layout/CommandPaletteProvider.js
'use client';

import { useState, useEffect } from 'react';
import CommandPalette from '@/components/ui/CommandPalette';

export default function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Detect Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); // CRITICAL: Prevent browser default
        setOpen((prev) => !prev);
      }

      // ESC to close (backup - cmdk Dialog handles this automatically)
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
```

### Long-Press Detection with Visual Feedback
```javascript
// Source: https://www.npmjs.com/package/use-long-press + user decision (scale animation)
import { useLongPress } from 'use-long-press';
import { useState } from 'react';

function DeviceCard({ device, onContextMenu }) {
  const [isPressed, setIsPressed] = useState(false);

  const bind = useLongPress(
    (event) => {
      // Open context menu at touch position
      onContextMenu(event);

      // Haptic feedback (user decision)
      if (navigator.vibrate) {
        navigator.vibrate(10); // Light vibration on open
      }
    },
    {
      threshold: 500, // Platform convention: 500ms
      onStart: (event) => {
        setIsPressed(true);
      },
      onFinish: (event) => {
        setIsPressed(false);
      },
      onCancel: (event) => {
        setIsPressed(false);
      },
      // Prevent text selection during long-press (iOS fix)
      cancelOnMovement: true,
    }
  );

  return (
    <div
      {...bind()}
      style={{
        // Scale animation (user decision: iOS-style shrink)
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        // Prevent text selection on iOS (pitfall fix)
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      className="p-4 rounded-xl bg-slate-800 cursor-pointer"
    >
      {device.name}
    </div>
  );
}
```

### Kbd Component for Keyboard Shortcuts
```javascript
// Source: https://www.radix-ui.com/themes/docs/components/kbd (pattern adapted for project)
// app/components/ui/Kbd.js
export default function Kbd({ children, className }) {
  return (
    <kbd className={cn(
      'inline-flex items-center justify-center',
      'px-2 py-1 rounded-md',
      'text-xs font-mono font-medium',
      'bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200',
      'text-slate-300 [html:not(.dark)_&]:text-slate-700',
      'border border-slate-600/50 [html:not(.dark)_&]:border-slate-300',
      'shadow-sm',
      className
    )}>
      {children}
    </kbd>
  );
}

// Usage in Command Palette
<Command.Item className="flex items-center justify-between">
  <span>Dashboard</span>
  <Kbd>⌘D</Kbd>
</Command.Item>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom context menu with absolute positioning | Radix UI Context Menu with collision detection | Radix v1.0 (2021) | Automatic viewport constraints, submenus, accessibility |
| kbar for command palette | cmdk by Paco Coursey | cmdk v1.0 (2022) | Simpler API, better performance, Dialog integration |
| Manual keyboard event handling per component | Centralized command registry with global handler | Modern pattern (2023+) | Prevents conflicts, runtime remapping, single source of truth |
| touchstart/touchend custom hooks | use-long-press library | v3.0 (2024) | Handles scroll cancelation, threshold timing, cross-browser quirks |
| Custom fuzzy search with .includes() | cmdk's command-score algorithm | cmdk default (2022+) | Weighted scoring, continuous matches, word jump detection |

**Deprecated/outdated:**
- **react-contexify**: Older context menu library, replaced by Radix UI (better accessibility, collision detection)
- **kbar**: Earlier command palette library, replaced by cmdk (simpler, faster)
- **Custom touch event handlers**: Replaced by use-long-press (handles edge cases, cancelation)

## Open Questions

Things that couldn't be fully resolved:

1. **Does Framer Motion need to be added as a dependency?**
   - What we know: User decision specifies scale animation during long-press (iOS-style)
   - What's unclear: Project doesn't list framer-motion in package.json. CSS transitions might be sufficient for simple scale animation.
   - Recommendation: Start with CSS transform + transition (shown in code examples). If more complex animations needed (spring physics, gesture tracking), add framer-motion later. User decision specifies "subtle shrink" which CSS can handle.

2. **Should existing ContextMenu.js be renamed or replaced?**
   - What we know: Current ContextMenu.js is a dropdown menu (click-triggered with MoreVertical icon), not a true context menu
   - What's unclear: Is this component actively used? Will renaming break existing code?
   - Recommendation: Rename to Dropdown.js (more accurate), create new RightClickMenu.js for Radix Context Menu. Planning phase should audit usage of ContextMenu.js before renaming.

3. **What should the Command Palette command registry structure be?**
   - What we know: User decision specifies Navigation + Device Actions + Settings groups
   - What's unclear: How should commands be registered dynamically? Should components register their own commands (decentralized) or should all commands be defined in one place (centralized)?
   - Recommendation: Start centralized (easier to implement), migrate to dynamic registration in Phase 36 when device cards need to register their own context menu actions.

4. **Should Command Palette support recent commands (user decision says no)?**
   - What we know: User decision explicitly says "No — always start fresh, no history tracking"
   - What's unclear: This decision was made but might impact UX negatively for power users
   - Recommendation: Follow user decision (no recent commands). If users request this later, can be added as opt-in feature with localStorage persistence.

## Sources

### Primary (HIGH confidence)
- [Radix UI Context Menu Documentation](https://www.radix-ui.com/primitives/docs/components/context-menu) - Official API reference
- [cmdk GitHub Repository](https://github.com/pacocoursey/cmdk) - Official source code and documentation
- [use-long-press npm Package](https://www.npmjs.com/package/use-long-press) - v3.3.0, latest version (July 2025)
- [Radix UI Context Menu npm](https://www.npmjs.com/package/@radix-ui/react-context-menu) - v2.2.16, latest version (Jan 2026)
- [shadcn/ui Command Component](https://ui.shadcn.com/docs/components/radix/command) - Implementation patterns with cmdk
- [Radix UI Kbd Component](https://www.radix-ui.com/themes/docs/components/kbd) - Keyboard shortcut display component
- Project's existing Sheet.js - Established namespace pattern, CVA variants, blur+dim backdrop

### Secondary (MEDIUM confidence)
- [Tania Rascia: Keyboard Shortcut Hook in React](https://www.taniarascia.com/keyboard-shortcut-hook-react/) - ⌘K/Ctrl+K detection pattern
- [FreeCodeCamp: Reusable Keyboard Shortcut Listener](https://www.freecodecamp.org/news/how-to-build-a-reusable-keyboard-shortcut-listener-component-in-react/) - Dec 2024 tutorial
- [Radix UI GitHub Discussion #930](https://github.com/radix-ui/primitives/discussions/930) - iOS long-press text selection fix
- [React Native Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/long-press-gesture/) - Long-press threshold timing (500ms)
- [Developer Way: Positioning and Portals in React](https://www.developerway.com/posts/positioning-and-portals-in-react) - Stacking context pitfalls
- [Okenlabs: Accessibility Focus Traps](https://okenlabs.com/blog/accessibility-implementing-focus-traps/) - Focus management best practices

### Tertiary (LOW confidence)
- [Motion.dev React Animation](https://motion.dev/docs/react-animation) - Framer Motion scale animation patterns (not verified if needed in project)
- [Fuse.js](https://www.fusejs.io/) - Alternative fuzzy search library (cmdk's command-score is built-in, so external library not needed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Radix UI and cmdk are industry standard, version numbers verified via official sources
- Architecture: HIGH - Namespace pattern matches existing project conventions (Sheet.js), user decisions provide clear constraints
- Pitfalls: HIGH - Multiple official sources document iOS text selection, focus traps, z-index issues, keyboard shortcut conflicts

**Research date:** 2026-02-04
**Valid until:** 2026-03-06 (30 days - stable libraries, slow-moving domain)

**Notes:**
- User decisions from CONTEXT.md constrain research scope significantly (locked choices: scale animation, haptics, grouping, no recent commands)
- Existing project patterns strongly influence architecture (namespace components, CVA variants, blur+dim backdrops)
- Mobile-first considerations are critical due to user decision (full-screen layout, haptics, long-press detection)
