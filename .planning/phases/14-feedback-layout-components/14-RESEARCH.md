# Phase 14: Feedback & Layout Components - Research

**Researched:** 2026-01-29
**Domain:** Feedback UI (Modal, Tooltip, Toast, Loading) + Layout (PageLayout, DashboardLayout, Section, Grid)
**Confidence:** HIGH

## Summary

Phase 14 delivers feedback components (Modal/Dialog, Tooltip, Toast, Spinner, Progress, EmptyState) and layout components (PageLayout, DashboardLayout, Section, Grid) for the Pannello Stufa design system. The codebase already has Radix UI primitives installed (`@radix-ui/react-dialog@1.1.14`, `@radix-ui/react-tooltip@1.2.4`, `@radix-ui/react-toast@1.2.14`, `@radix-ui/react-progress@1.1.4`) and established patterns for wrapping primitives with CVA variants.

Existing implementations provide a solid foundation: Modal, Toast, EmptyState, ProgressBar, Banner, Section, Grid, and Skeleton components exist but need enhancement per CONTEXT.md decisions (Modal sizes + mobile bottom sheet, Toast stacking, consistent layout patterns). The research confirms Radix UI's built-in accessibility features (focus trap, ESC close, ARIA) align perfectly with requirements.

**Primary recommendation:** Enhance existing components rather than rebuild. Wrap Radix primitives with CVA for variants, follow established `cn()` pattern, and use existing animation keyframes from globals.css. Modal needs mobile detection for bottom sheet behavior. Toast needs Provider-based stacking with queue management.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | 1.1.14 | Modal/Dialog primitive | Built-in focus trap, ESC close, ARIA, portal |
| @radix-ui/react-tooltip | 1.2.4 | Tooltip primitive | Keyboard trigger, delay management, collision avoidance |
| @radix-ui/react-toast | 1.2.14 | Toast notifications | Swipe dismiss, stacking, ARIA live regions |
| @radix-ui/react-progress | 1.1.4 | Progress bar primitive | Accessibility, indeterminate support |
| class-variance-authority | 0.7.1 | Variant management | Type-safe variants, compound variants |
| tailwind-merge | 3.4.0 | Class conflict resolution | Via cn() utility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.0 | Icons | Spinner, close buttons, empty state icons |
| clsx | 2.1.1 | Conditional classes | Combined with tailwind-merge in cn() |
| react-dom/createPortal | 19.2.0 | Portal rendering | Modal, Toast viewport |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Toast | sonner | Sonner has nicer stacking animation but adds dependency; Radix already installed |
| Custom focus trap | focus-trap-react | Radix Dialog has built-in focus trap |
| CSS animations | framer-motion | Framer adds bundle size; existing keyframes sufficient |

**Installation:**
Already installed - no additional packages needed.

## Architecture Patterns

### Recommended Project Structure
```
app/components/ui/
  Modal/
    Modal.js           # Enhanced with sizes + mobile bottom sheet
    Modal.test.js      # Accessibility + interaction tests
  Tooltip/
    Tooltip.js         # Radix wrapper with CVA variants
    Tooltip.test.js
  Toast/
    ToastProvider.js   # Provider with stacking logic
    Toast.js           # Individual toast component
    useToast.js        # Hook for imperative toast() calls
    Toast.test.js
  Spinner/
    Spinner.js         # SVG spinner with size/variant
    Spinner.test.js
  Progress/
    Progress.js        # Enhanced with circular variant
    Progress.test.js
  EmptyState/
    EmptyState.js      # Enhance existing
  Banner/
    Banner.js          # Standardize variants
  PageLayout/
    PageLayout.js      # New layout component
  DashboardLayout/
    DashboardLayout.js # New layout with collapsible sidebar
  Section.js           # Enhance existing
  Grid.js              # Enhance existing
```

### Pattern 1: Radix Primitive Wrapping
**What:** Import Radix as namespace, wrap each primitive with cn() for styling
**When to use:** All Radix-based components (Modal, Tooltip, Toast)
**Example:**
```javascript
// Source: Established codebase pattern from Button.js
'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const dialogContentVariants = cva(
  // Base classes
  [
    'fixed z-50',
    'bg-slate-900/95 [html:not(.dark)_&]:bg-white/95',
    'backdrop-blur-3xl',
    'border border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
    'shadow-card-elevated',
    'focus:outline-none',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-[95vw] max-h-[95vh]',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const DialogContent = forwardRef(({ className, size, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md animate-fade-in" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentVariants({ size }), className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
```

### Pattern 2: Namespace Components
**What:** Attach sub-components to main export via dot notation
**When to use:** Compound components (Modal.Header, Toast.Action)
**Example:**
```javascript
// Source: Established pattern from Card.js, Button.js
const Modal = { Root, Trigger, Content, Header, Title, Description, Footer, Close };
Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
// ...
export default Modal;

// Usage:
<Modal>
  <Modal.Header>
    <Modal.Title>Confirm Action</Modal.Title>
  </Modal.Header>
  <Modal.Content>...</Modal.Content>
  <Modal.Footer>...</Modal.Footer>
</Modal>
```

### Pattern 3: Toast Provider with Queue
**What:** Wrap app with ToastProvider, expose useToast hook for imperative API
**When to use:** Toast notifications requiring stacking
**Example:**
```javascript
// Source: Radix Toast documentation + Sonner pattern
// ToastProvider.js
const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ variant, message, duration = 5000, action }) => {
    const id = Date.now();
    setToasts(prev => {
      // Max 3 visible, queue the rest
      const visible = prev.filter(t => !t.queued);
      if (visible.length >= 3) {
        return [...prev, { id, variant, message, duration, action, queued: true }];
      }
      return [...prev, { id, variant, message, duration, action, queued: false }];
    });
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {/* Render visible toasts */}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
```

### Pattern 4: Mobile Detection for Responsive Behavior
**What:** Use CSS media queries + optional JS hook for mobile-specific rendering
**When to use:** Modal bottom sheet on mobile
**Example:**
```javascript
// CSS-first approach (preferred)
const mobileStyles = 'max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:animate-slide-in-from-bottom';

// JS hook for conditional rendering (if needed)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
};
```

### Anti-Patterns to Avoid
- **Building custom focus trap:** Radix Dialog handles this automatically
- **Manual ARIA management:** Radix primitives provide correct ARIA by default
- **Inline animation definitions:** Use existing keyframes from globals.css
- **Ignoring prefers-reduced-motion:** Already handled in globals.css, but verify components respect it
- **Multiple toast libraries:** Use existing Radix Toast, don't add sonner
- **Re-implementing scroll lock:** Modal already has scroll lock pattern

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in modals | Custom focus management | Radix Dialog | Edge cases: Tab wrapping, focus restoration, nested focusable elements |
| Toast queue/stacking | useState array | Radix Toast Provider | Handles swipe, accessibility, timing |
| Tooltip positioning | Manual positioning | Radix Tooltip | Collision detection, arrow alignment, viewport boundaries |
| ESC key handling | addEventListener | Radix onEscapeKeyDown | Proper event cleanup, nested modal handling |
| Scroll lock | overflow:hidden | Existing Modal pattern | iOS scroll bounce, scroll position restoration |
| Progress accessibility | role="progressbar" | Radix Progress | aria-valuenow, aria-valuemin, aria-valuemax |
| Portal rendering | Manual createPortal | Radix Portal | Container prop, forceMount for animations |

**Key insight:** Radix primitives solve accessibility edge cases that are easy to miss. Custom implementations often fail WCAG audits on focus management, keyboard navigation, and screen reader announcements.

## Common Pitfalls

### Pitfall 1: Animation State Mismatch with Radix
**What goes wrong:** Exit animations don't play because component unmounts immediately
**Why it happens:** Radix uses `data-state="open|closed"` for CSS animations; unmounting before animation completes
**How to avoid:** Use `forceMount` on Portal/Content and animate based on `data-state`
**Warning signs:** Exit animations never visible, components "pop" out

```css
/* Correct pattern - animate based on data-state */
[data-state="open"] { animation: fadeIn 0.2s ease-out; }
[data-state="closed"] { animation: fadeOut 0.15s ease-in; }
```

### Pitfall 2: Toast Stacking Z-Index Conflicts
**What goes wrong:** Toasts appear behind modals or other overlays
**Why it happens:** z-index stacking context issues with portals
**How to avoid:** Toast viewport z-index higher than modal overlay (z-[9999] vs z-50)
**Warning signs:** Toasts invisible when modal open

### Pitfall 3: Modal Focus on Open
**What goes wrong:** Focus jumps unexpectedly, screen readers announce wrong content
**Why it happens:** Not setting initial focus target, or Dialog.Title missing
**How to avoid:** Always include Dialog.Title (use VisuallyHidden if needed), use `onOpenAutoFocus` to customize
**Warning signs:** First focusable element isn't the expected one, no title announced

### Pitfall 4: Tooltip on Touch Devices
**What goes wrong:** Tooltips don't work or create accessibility issues on touch
**Why it happens:** Hover-only triggers don't work on touch; click conflicts with button actions
**How to avoid:** Use Radix Tooltip (handles touch appropriately), consider hiding tooltips on touch-primary devices
**Warning signs:** Users can't access tooltip content on mobile

### Pitfall 5: Progress Circular Variant Expectations
**What goes wrong:** Expecting Radix Progress to have circular variant
**Why it happens:** Radix Progress is linear-only; circular requires custom SVG
**How to avoid:** Build Spinner component for circular loading, use Progress only for linear bars
**Warning signs:** Searching for non-existent circular prop

### Pitfall 6: Jest Testing with Radix Portals
**What goes wrong:** Components render to document.body, not testing-library container
**Why it happens:** createPortal default behavior
**How to avoid:** Already handled in jest.setup.js - createPortal mocked to render inline
**Warning signs:** `queryByRole` returns null for portal content

## Code Examples

Verified patterns from official sources and codebase:

### Modal with Sizes and Mobile Bottom Sheet
```javascript
// Source: Radix Dialog docs + CONTEXT.md decisions
'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

const overlayVariants = cva([
  'fixed inset-0 z-50',
  'bg-slate-950/70 [html:not(.dark)_&]:bg-slate-900/40',
  'backdrop-blur-md',
  'data-[state=open]:animate-fade-in',
  'data-[state=closed]:animate-fade-out',
]);

const contentVariants = cva(
  [
    'fixed z-50 p-6',
    'bg-slate-900/95 [html:not(.dark)_&]:bg-white/95',
    'backdrop-blur-3xl',
    'border border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
    'shadow-card-elevated',
    'focus:outline-none',
    'overflow-y-auto',
    // Desktop: centered
    'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
    'rounded-3xl max-h-[85vh]',
    // Animation
    'data-[state=open]:animate-scale-in-center',
    'data-[state=closed]:animate-fade-out',
  ],
  {
    variants: {
      size: {
        sm: 'w-full max-w-sm',
        md: 'w-full max-w-md',
        lg: 'w-full max-w-lg',
        xl: 'w-full max-w-xl',
        full: 'w-[95vw] h-[95vh] max-w-none',
      },
      mobile: {
        bottomSheet: [
          // Mobile bottom sheet overrides
          'max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:top-auto',
          'max-sm:translate-x-0 max-sm:translate-y-0',
          'max-sm:rounded-t-3xl max-sm:rounded-b-none',
          'max-sm:max-h-[85vh] max-sm:w-full max-sm:max-w-none',
          'max-sm:data-[state=open]:animate-slide-in-from-bottom',
        ],
        centered: '', // Keep centered on mobile
      },
    },
    defaultVariants: {
      size: 'md',
      mobile: 'bottomSheet',
    },
  }
);
```

### Tooltip with Keyboard Support
```javascript
// Source: Radix Tooltip docs
'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils/cn';

export function TooltipProvider({ children, delayDuration = 400, skipDelayDuration = 300 }) {
  return (
    <Tooltip.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      {children}
    </Tooltip.Provider>
  );
}

export function TooltipRoot({ children, ...props }) {
  return <Tooltip.Root {...props}>{children}</Tooltip.Root>;
}

export const TooltipTrigger = Tooltip.Trigger;

export const TooltipContent = forwardRef(({ className, sideOffset = 4, children, ...props }, ref) => (
  <Tooltip.Portal>
    <Tooltip.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 px-3 py-1.5 text-sm',
        'bg-slate-800 [html:not(.dark)_&]:bg-slate-900',
        'text-slate-100',
        'rounded-lg shadow-lg',
        'animate-fade-in',
        'data-[state=closed]:animate-fade-out',
        className
      )}
      {...props}
    >
      {children}
      <Tooltip.Arrow className="fill-slate-800 [html:not(.dark)_&]:fill-slate-900" />
    </Tooltip.Content>
  </Tooltip.Portal>
));
```

### Toast with Stacking
```javascript
// Source: Radix Toast docs + CONTEXT.md stacking requirements
'use client';

import * as Toast from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-center justify-between gap-4',
    'overflow-hidden rounded-2xl p-4 shadow-lg',
    'backdrop-blur-xl',
    'border',
    'data-[state=open]:animate-slide-in-from-bottom',
    'data-[state=closed]:animate-fade-out',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:animate-fade-out',
  ],
  {
    variants: {
      variant: {
        success: [
          'bg-sage-900/90 [html:not(.dark)_&]:bg-sage-50/95',
          'border-sage-500/30',
          'text-sage-100 [html:not(.dark)_&]:text-sage-800',
        ],
        error: [
          'bg-danger-900/90 [html:not(.dark)_&]:bg-danger-50/95',
          'border-danger-500/30',
          'text-danger-100 [html:not(.dark)_&]:text-danger-800',
        ],
        warning: [
          'bg-warning-900/90 [html:not(.dark)_&]:bg-warning-50/95',
          'border-warning-500/30',
          'text-warning-100 [html:not(.dark)_&]:text-warning-800',
        ],
        info: [
          'bg-ocean-900/90 [html:not(.dark)_&]:bg-ocean-50/95',
          'border-ocean-500/30',
          'text-ocean-100 [html:not(.dark)_&]:text-ocean-800',
        ],
      },
    },
    defaultVariants: { variant: 'info' },
  }
);

// Viewport positioned bottom-right, stacks newest on top
export function ToastViewport({ className }) {
  return (
    <Toast.Viewport
      className={cn(
        'fixed bottom-4 right-4 z-[9999]',
        'flex flex-col-reverse gap-2',
        'w-full max-w-sm',
        'outline-none',
        className
      )}
    />
  );
}
```

### Spinner Component
```javascript
// Source: Custom implementation following Ember Noir design
'use client';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const spinnerVariants = cva(
  'animate-spin',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        ember: 'text-ember-500',
        white: 'text-white',
        current: 'text-current',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'ember',
    },
  }
);

export default function Spinner({ size, variant, className, ...props }) {
  return (
    <svg
      className={cn(spinnerVariants({ size, variant }), className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
```

### DashboardLayout with Collapsible Sidebar
```javascript
// Source: MUI Toolpad pattern + CONTEXT.md decisions
'use client';

import { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SidebarContext = createContext();

export function DashboardLayout({ children, sidebar, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-0 h-full z-40',
            'bg-slate-900/95 [html:not(.dark)_&]:bg-white/95',
            'backdrop-blur-xl',
            'border-r border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
            'transition-all duration-300 ease-out-expo',
            collapsed ? 'w-16' : 'w-64',
            // Mobile: hidden by default
            'max-lg:hidden'
          )}
        >
          {sidebar}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-6 p-1.5 rounded-full bg-slate-800 border border-slate-700 shadow-md"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </aside>

        {/* Main content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            collapsed ? 'lg:ml-16' : 'lg:ml-64'
          )}
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom modals with useEffect focus | Radix Dialog with built-in focus trap | Radix 1.0 (2022) | Eliminates focus bugs |
| react-toastify | Radix Toast or Sonner | 2024 | Better accessibility, smaller bundle |
| Manual tooltip positioning | Radix Tooltip with Floating UI | 2023 | Automatic collision avoidance |
| CSS-only progress bars | Radix Progress | 2023 | Proper ARIA, indeterminate support |
| Fixed sidebar layouts | Collapsible with CSS transitions | 2024-2025 | Better mobile UX |

**Deprecated/outdated:**
- `react-modal`: Use Radix Dialog (better a11y, smaller)
- `react-tooltip`: Use Radix Tooltip (better keyboard support)
- `body-scroll-lock`: Radix handles internally
- Inline z-index management: Use CSS custom properties

## Open Questions

Things that couldn't be fully resolved:

1. **Swipe gesture implementation for mobile bottom sheet**
   - What we know: Radix Dialog doesn't have built-in swipe-to-dismiss
   - What's unclear: Best library for touch gestures (use-gesture vs custom)
   - Recommendation: Start with CSS-only swipe via scroll snap, add JS gesture later if needed

2. **Toast auto-dismiss duration**
   - What we know: CONTEXT.md says Claude's discretion; Radix default is 5000ms
   - What's unclear: Optimal duration for this app's use cases
   - Recommendation: 5000ms default, 8000ms for error toasts (user needs time to read)

3. **Sidebar collapse breakpoint**
   - What we know: CONTEXT.md says Claude's discretion
   - What's unclear: Optimal breakpoint for this dashboard
   - Recommendation: lg (1024px) - collapse sidebar below lg, hide on mobile (max-lg:hidden)

## Sources

### Primary (HIGH confidence)
- Radix UI Dialog: https://www.radix-ui.com/primitives/docs/components/dialog
- Radix UI Tooltip: https://www.radix-ui.com/primitives/docs/components/tooltip
- Radix UI Toast: https://www.radix-ui.com/primitives/docs/components/toast
- Radix UI Progress: https://www.radix-ui.com/primitives/docs/components/progress
- Existing codebase: Button.js, Card.js, Modal.js, Toast.js, BottomSheet.js patterns

### Secondary (MEDIUM confidence)
- Sonner stacking pattern: https://github.com/emilkowalski/sonner
- MUI DashboardLayout: https://mui.com/toolpad/core/react-dashboard-layout/

### Tertiary (LOW confidence)
- Community patterns for mobile bottom sheets (WebSearch)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, versions verified in package.json
- Architecture: HIGH - Patterns derived from existing codebase components
- Pitfalls: MEDIUM - Some based on Radix docs, others from community reports

**Research date:** 2026-01-29
**Valid until:** 60 days (stable APIs, no major version changes expected)
