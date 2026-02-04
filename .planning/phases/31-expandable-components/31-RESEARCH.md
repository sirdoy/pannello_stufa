# Phase 31: Expandable Components - Research

**Researched:** 2026-02-04
**Domain:** React UI components with Radix Accordion and Dialog primitives, CVA variants, expandable/sliding patterns
**Confidence:** HIGH

## Summary

Phase 31 adds Accordion and Sheet components using Radix UI primitives. Accordion requires installing @radix-ui/react-accordion (~1.2.12 current), while Sheet adapts the already-installed @radix-ui/react-dialog (v1.1.14) with positioning variants for sliding from screen edges.

Both follow established patterns from Phase 30: CVA for variants, namespace components (Component.Subcomponent), lucide-react icons, cn() utility, and Ember Noir styling. Accordion provides WAI-ARIA compliant expand/collapse with smooth height animations using CSS variables (--radix-accordion-content-height). Sheet extends Dialog with side positioning (top/right/bottom/left), size presets, and slide-in animations.

Key implementation decisions from CONTEXT.md: Accordion supports type="single|multiple" with keyboard navigation (Enter/Space toggle, arrows navigate), Sheet supports all four sides with both size presets and content-based sizing, animations use existing globals.css keyframes (animate-slide-in-from-bottom, animate-scale-in) respecting prefers-reduced-motion.

**Primary recommendation:** Install @radix-ui/react-accordion, wrap primitives in CVA-styled components matching Modal.js pattern, use Radix CSS variables for smooth height animations, implement Sheet as Dialog variant with side-based positioning classes, respect existing animation system and design tokens.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-accordion | 1.2.x | Accessible accordion primitive | WAI-ARIA Accordion pattern, keyboard navigation, height animation support |
| @radix-ui/react-dialog | 1.1.14 | Sheet/drawer foundation | Already installed, WAI-ARIA Dialog pattern, focus trap, Portal |
| class-variance-authority | 0.7.1 | Type-safe variants | Project standard for all components (Button, Card, Modal, etc.) |
| lucide-react | 0.562.0 | Icon library | Project standard (ChevronDown for accordion, X for close) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwind-merge | 3.4.0 | Class merging (cn utility) | All components for className override support |
| clsx | 2.1.1 | Conditional classes | Used by cn() utility for dynamic classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Accordion | Custom details/summary | Full control but lose WAI-ARIA, keyboard nav, animation helpers |
| Radix Dialog for Sheet | Custom modal + positioning | More control but lose focus trap, accessibility, portal management |
| CVA variants | Tailwind classes directly | Simpler but lose type safety, variant composition |
| CSS Grid for height animation | max-height transitions | More predictable but flickers with dynamic content |

**Installation:**
```bash
npm install @radix-ui/react-accordion
# @radix-ui/react-dialog already installed (v1.1.14)
```

## Architecture Patterns

### Recommended Project Structure
```
app/components/ui/
├── Accordion.js         # Accordion component with namespace
├── Sheet.js             # Sheet component (Dialog wrapper)
└── __tests__/
    ├── Accordion.test.js
    └── Sheet.test.js
```

### Pattern 1: Radix Accordion Wrapper with CVA
**What:** Wrap Radix Accordion parts in CVA-styled components with namespace pattern
**When to use:** All accordion implementations (FAQ, help sections)
**Example:**
```javascript
// Source: Radix Accordion docs + existing Modal.js pattern
'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

const itemVariants = cva([
  'border-b border-white/[0.06]',
  '[html:not(.dark)_&]:border-slate-200',
  'last:border-b-0',
]);

const triggerVariants = cva([
  'flex w-full items-center justify-between',
  'py-4 px-0 min-h-[48px]', // 48px touch target
  'font-display font-medium text-left',
  'text-slate-200 [html:not(.dark)_&]:text-slate-900',
  'hover:text-ember-400 [html:not(.dark)_&]:hover:text-ember-700',
  'transition-colors duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
  'group',
]);

const contentVariants = cva([
  'overflow-hidden',
  'text-slate-400 [html:not(.dark)_&]:text-slate-600',
  'text-sm',
  // Radix height animation using CSS variables
  'data-[state=open]:animate-accordion-down',
  'data-[state=closed]:animate-accordion-up',
]);

const AccordionItem = forwardRef(function AccordionItem(
  { className, ...props },
  ref
) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(itemVariants(), className)}
      {...props}
    />
  );
});

const AccordionTrigger = forwardRef(function AccordionTrigger(
  { className, children, ...props },
  ref
) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(triggerVariants(), className)}
        {...props}
      >
        {children}
        <ChevronDown className={cn(
          'h-5 w-5 shrink-0',
          'transition-transform duration-300',
          'group-data-[state=open]:rotate-180',
        )} />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

const AccordionContent = forwardRef(function AccordionContent(
  { className, children, ...props },
  ref
) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(contentVariants(), className)}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </AccordionPrimitive.Content>
  );
});

function Accordion({ children, ...props }) {
  return (
    <AccordionPrimitive.Root {...props}>
      {children}
    </AccordionPrimitive.Root>
  );
}

Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
```

### Pattern 2: Height Animation with Radix CSS Variables
**What:** Use --radix-accordion-content-height for smooth expand/collapse
**When to use:** Accordion content animation
**Example:**
```css
/* Source: Radix Accordion docs + globals.css pattern */
@keyframes accordion-down {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
    opacity: 1;
  }
}

@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height);
    opacity: 1;
  }
  to {
    height: 0;
    opacity: 0;
  }
}

.animate-accordion-down {
  animation: accordion-down 0.3s var(--ease-out-expo) forwards;
}

.animate-accordion-up {
  animation: accordion-up 0.2s ease-in forwards;
}

/* Respect motion preference */
@media (prefers-reduced-motion: reduce) {
  .animate-accordion-down,
  .animate-accordion-up {
    animation: none !important;
    transition: none !important;
  }
}
```

### Pattern 3: Sheet as Dialog Variant with Side Positioning
**What:** Extend Dialog with CVA side variants for drawer behavior
**When to use:** Mobile-friendly panels, settings forms, detail views
**Example:**
```javascript
// Source: Existing Modal.js + Radix Dialog docs + CONTEXT.md decisions
'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
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
    // Transition
    'transition-transform duration-300',
    'data-[state=open]:animate-in',
    'data-[state=closed]:animate-out',
  ],
  {
    variants: {
      side: {
        top: [
          'inset-x-0 top-0',
          'rounded-b-3xl',
          'max-h-[85vh]',
          'data-[state=closed]:slide-out-to-top',
          'data-[state=open]:slide-in-from-top',
        ],
        bottom: [
          'inset-x-0 bottom-0',
          'rounded-t-3xl',
          'max-h-[85vh]',
          // iOS safe area
          'pb-safe',
          'data-[state=closed]:slide-out-to-bottom',
          'data-[state=open]:slide-in-from-bottom',
        ],
        left: [
          'inset-y-0 left-0',
          'h-full rounded-r-3xl',
          'max-w-sm',
          'data-[state=closed]:slide-out-to-left',
          'data-[state=open]:slide-in-from-left',
        ],
        right: [
          'inset-y-0 right-0',
          'h-full rounded-l-3xl',
          'max-w-sm',
          'data-[state=closed]:slide-out-to-right',
          'data-[state=open]:slide-in-from-right',
        ],
      },
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        auto: 'w-auto',
      },
    },
    defaultVariants: {
      side: 'bottom',
      size: 'md',
    },
  }
);

const SheetContent = forwardRef(function SheetContent(
  { side, size, className, children, showCloseButton = true, ...props },
  ref
) {
  return (
    <DialogPrimitive.Content
      ref={ref}
      className={cn(contentVariants({ side, size }), className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className={cn(
          'absolute top-4 right-4',
          'p-2 rounded-xl',
          'text-slate-400 hover:text-slate-200',
          '[html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700',
          'hover:bg-white/[0.06] [html:not(.dark)_&]:hover:bg-black/[0.04]',
          'transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
        )}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  );
});

function Sheet({ children, ...props }) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={cn(overlayVariants())} />
        {children}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

Sheet.Trigger = DialogPrimitive.Trigger;
Sheet.Content = SheetContent;
Sheet.Title = DialogPrimitive.Title;
Sheet.Description = DialogPrimitive.Description;
Sheet.Close = DialogPrimitive.Close;

export { Sheet };
```

### Pattern 4: Namespace Component Export
**What:** Attach subcomponents to main component for dot notation
**When to use:** All compound components (established project pattern)
**Example:**
```javascript
// Source: Existing Button.js, Card.js, Modal.js pattern
function Accordion({ children, ...props }) {
  return <AccordionPrimitive.Root {...props}>{children}</AccordionPrimitive.Root>;
}

// Attach namespace
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

// Named exports for tree-shaking
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

// Default export for convenience
export default Accordion;
```

### Anti-Patterns to Avoid
- **Don't use max-height for accordion animation:** Flickers with dynamic content, use Radix CSS variables instead
- **Don't manually implement keyboard navigation:** Radix handles arrow keys, Home/End, Enter/Space—don't override
- **Don't forget Portal for Sheet:** Without Portal, content renders in DOM tree causing z-index/overflow issues
- **Don't use inline styles for animations:** Use Tailwind classes + CVA variants for consistency with design system
- **Don't hardcode Sheet dimensions:** Support both size presets AND content-based (auto) sizing per CONTEXT.md

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accordion height animation | Custom JavaScript height calculation | Radix CSS variables (--radix-accordion-content-height) | Handles dynamic content, no flicker, GPU-accelerated |
| Keyboard navigation | Arrow key event handlers | Radix Accordion keyboard support | Implements WAI-ARIA, handles Home/End, roving tabindex, focus management |
| Focus trap in Sheet | Manual focusable element tracking | Radix Dialog built-in focus management | Handles Tab/Shift+Tab, initial focus, return focus, focus scope edge cases |
| Click outside detection | Document event listeners | Radix onPointerDownOutside | Works with portals, nested components, prevents race conditions |
| Accessible ARIA attributes | Manual role/aria-* props | Radix primitive defaults | Implements WAI-ARIA spec correctly (role="region", aria-expanded, aria-controls, etc.) |
| Sheet positioning | Absolute positioning logic | CVA variants with fixed positioning | Handles all four sides, mobile-safe, respects safe areas |
| Z-index portal management | Custom z-index values | Radix Portal component | Creates new stacking context, renders at document.body, avoids conflicts |

**Key insight:** Radix handles 90% of accessibility complexity. Custom implementations almost always miss edge cases (RTL, screen readers, mobile, keyboard-only users, nested accordions). The primitives are battle-tested across thousands of production sites.

## Common Pitfalls

### Pitfall 1: Accordion Animation Flicker on Close
**What goes wrong:** Content flickers or jumps when accordion closes in React 18+ concurrent mode
**Why it happens:** animation-fill-mode: forwards persists height post-animation, conflicting with React's rendering
**How to avoid:**
- Remove `forwards` from close animation (open direction doesn't suffer)
- Avoid vertical margins on accordion content children—use padding on parent instead
- Use opacity transition alongside height for smoother perception
**Warning signs:** Content briefly visible at wrong height, animation stutters, React 18+ specific
**Source:** [Radix GitHub Issue #1074](https://github.com/radix-ui/primitives/issues/1074), [Radix Discussion #1311](https://github.com/radix-ui/primitives/discussions/1311)

### Pitfall 2: Forgetting prefers-reduced-motion
**What goes wrong:** Animations run for users who requested reduced motion, causing vestibular discomfort
**Why it happens:** Animations defined without motion preference check
**How to avoid:**
- Add media query to disable all accordion/sheet animations
- Use `transition-duration: 0.01ms !important` for instant transitions
- Test with system motion preferences disabled
**Warning signs:** No motion preference check in CSS, animations always run, accessibility audit fails WCAG 2.3.3
**Source:** [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

### Pitfall 3: Sheet Not Respecting iOS Safe Areas
**What goes wrong:** Bottom sheet covers home indicator, content hidden behind notch
**Why it happens:** No padding for safe area insets on iOS devices
**How to avoid:**
- Use `pb-safe` (env(safe-area-inset-bottom)) for bottom sheets
- Use `pt-safe` for top sheets
- Test on iOS simulator or physical device with notch
- Apply to content container, not backdrop
**Warning signs:** Content unreachable on iPhone X+, home indicator covered, scrolling feels wrong
**Source:** [Expo Safe Areas](https://docs.expo.dev/develop/user-interface/safe-areas/), [React Navigation Safe Area](https://reactnavigation.org/docs/handling-safe-area/)

### Pitfall 4: Z-Index Conflicts with Nested Components
**What goes wrong:** Sheet inside Modal renders behind Modal overlay, or Tooltip inside Sheet disappears
**Why it happens:** Multiple portals with conflicting z-index values
**How to avoid:**
- Always use Portal components (don't render content inline)
- Layer components in order opened (Modal > Sheet > Tooltip)
- Avoid custom z-index values (use auto, 0, or -1 only)
- If conflict occurs, use CSS custom properties: `--radix-toast-viewport-right: 50`
**Warning signs:** Content disappears when component opens, clicks don't register, overlay intercepts events
**Source:** [Radix GitHub Issue #1317](https://github.com/radix-ui/primitives/issues/1317)

### Pitfall 5: Touch Target Too Small on Mobile
**What goes wrong:** Accordion triggers hard to tap on mobile, especially for users with motor impairments
**Why it happens:** Default padding creates touch targets < 44px (iOS) or 48dp (Android)
**How to avoid:**
- Use `min-h-[48px]` (WCAG 2.5.5 AA standard) on AccordionTrigger
- Test on physical mobile device, not just browser DevTools
- Ensure padding/spacing doesn't reduce clickable area
**Warning signs:** Users miss taps, need multiple attempts, accessibility audit fails
**Source:** CONTEXT.md decision ("Touch target sizing for accordion headers (48px min)")

### Pitfall 6: Sheet Width Mismatch on Desktop
**What goes wrong:** Sheet too narrow or too wide for content on desktop screens
**Why it happens:** Fixed max-width doesn't adapt to content or viewport
**How to avoid:**
- Provide size variants (sm: 384px, md: 448px, lg: 512px) per CONTEXT.md
- Support `size="auto"` for content-based width
- Consider viewport constraints: `max-w-[calc(100vw-2rem)]` for narrow screens
**Warning signs:** Sheet content overflows, looks disconnected, inconsistent widths across use cases
**Source:** CONTEXT.md decision ("Sizing supports both fixed presets AND auto/content-based")

## Code Examples

Verified patterns from official sources:

### Accordion Basic Usage (FAQ Pattern)
```javascript
// Source: Radix Accordion docs + CONTEXT.md use case
'use client';

import { Accordion } from '@/app/components/ui/Accordion';

function FAQSection() {
  return (
    <Accordion type="single" collapsible defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Trigger>
          Come posso programmare la stufa?
        </Accordion.Trigger>
        <Accordion.Content>
          Puoi programmare la stufa usando la sezione Schedule nel pannello di
          controllo. Imposta orari e temperature per ogni giorno della settimana.
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="item-2">
        <Accordion.Trigger>
          Cosa significa "needsCleaning"?
        </Accordion.Trigger>
        <Accordion.Content>
          La stufa richiede manutenzione quando ha funzionato per il numero
          di ore configurato. L'accensione automatica viene bloccata fino
          alla pulizia.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
```

### Accordion Multiple Open Mode
```javascript
// Source: CONTEXT.md decision + Radix API
<Accordion type="multiple" defaultValue={['item-1', 'item-2']}>
  <Accordion.Item value="item-1">
    <Accordion.Trigger>Sezione 1</Accordion.Trigger>
    <Accordion.Content>Contenuto 1</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.Trigger>Sezione 2</Accordion.Trigger>
    <Accordion.Content>Contenuto 2</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

### Sheet Bottom (Mobile Settings Form)
```javascript
// Source: CONTEXT.md use case + existing BottomSheet.js pattern
'use client';

import { Sheet } from '@/app/components/ui/Sheet';
import { Button } from '@/app/components/ui/Button';
import { useState } from 'react';

function SettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="subtle">Impostazioni</Button>
      </Sheet.Trigger>
      <Sheet.Content side="bottom" size="md">
        <Sheet.Title className="text-xl font-display font-semibold mb-4">
          Impostazioni Stufa
        </Sheet.Title>
        <Sheet.Description className="text-sm text-slate-400 mb-6">
          Configura i parametri della tua stufa
        </Sheet.Description>

        {/* Form content */}
        <form className="space-y-4">
          {/* Settings controls */}
        </form>

        <div className="flex gap-3 mt-6">
          <Button variant="subtle" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button variant="ember" onClick={handleSave}>
            Salva
          </Button>
        </div>
      </Sheet.Content>
    </Sheet>
  );
}
```

### Sheet Right (Desktop Detail View)
```javascript
// Source: CONTEXT.md use case ("device info, notifications")
'use client';

import { Sheet } from '@/app/components/ui/Sheet';
import { Badge } from '@/app/components/ui/Badge';

function DeviceDetailSheet({ device, open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.Content side="right" size="lg">
        <Sheet.Title>{device.name}</Sheet.Title>
        <Sheet.Description>Dettagli dispositivo</Sheet.Description>

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-medium mb-2">Stato</h3>
            <Badge variant={device.connected ? 'sage' : 'neutral'}>
              {device.connected ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div>
            <h3 className="font-medium mb-2">Temperatura</h3>
            <p className="text-3xl font-display">{device.temperature}°C</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Ore di funzionamento</h3>
            <p>{device.operatingHours}h</p>
          </div>
        </div>
      </Sheet.Content>
    </Sheet>
  );
}
```

### Sheet with Content-Based Sizing
```javascript
// Source: CONTEXT.md decision ("auto/content-based")
<Sheet open={open} onOpenChange={setOpen}>
  <Sheet.Content side="bottom" size="auto">
    <Sheet.Title>Notifica</Sheet.Title>
    <Sheet.Description>
      La stufa ha completato il ciclo di riscaldamento.
    </Sheet.Description>
    <Button variant="ember" onClick={() => setOpen(false)}>
      OK
    </Button>
  </Sheet.Content>
</Sheet>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| max-height transitions | Radix CSS variables (--radix-accordion-content-height) | 2023 | No flicker with dynamic content, smoother animation |
| Custom keyboard handlers | Radix keyboard navigation | 2023 | WAI-ARIA compliance, RTL support, orientation-aware |
| Fixed z-index values | Portal stacking contexts | 2024 | Fewer conflicts, composable components |
| Custom BottomSheet component | Radix Dialog with side variants | 2026 (this phase) | Unified API, better accessibility, less maintenance |
| animation-fill-mode: forwards | Remove forwards on close animation | 2024 | Fixes React 18+ flicker in concurrent mode |

**Deprecated/outdated:**
- **Custom BottomSheet.js:** Phase 31 replaces with Sheet component (Radix-based, more flexible)
- **Manual height calculation:** Use Radix CSS variables, not JavaScript getBoundingClientRect()
- **Custom aria-* attributes on primitives:** Radix sets these automatically, overriding can break screen readers
- **z-index: 9999 patterns:** Use Portal components and stacking contexts instead

## Open Questions

Things that couldn't be fully resolved:

1. **Accordion indicator icon style**
   - What we know: CONTEXT.md leaves choice between "rotating chevron vs plus/minus"
   - What's unclear: User preference not specified
   - Recommendation: Use rotating ChevronDown (simpler, matches Modal close pattern, less visual noise)

2. **Sheet backdrop click-to-close**
   - What we know: CONTEXT.md mentions "dark overlay, click-to-close" as discretion
   - What's unclear: Should this be configurable or always-on?
   - Recommendation: Default enabled (matches Modal behavior), allow `closeOnOverlayClick={false}` prop override

3. **Sheet snap points/detents**
   - What we know: CONTEXT.md suggests "50%, 75%, 100%" for bottom sheet
   - What's unclear: Whether to implement in Phase 31 or defer to future enhancement
   - Recommendation: Defer—adds complexity (drag gesture, spring physics), not in requirements, can add later

4. **Mobile swipe-to-close gesture**
   - What we know: CONTEXT.md lists as discretion item
   - What's unclear: Priority vs implementation complexity
   - Recommendation: Defer—requires touch gesture library, not in requirements, users can tap backdrop/close button

5. **Exact animation duration**
   - What we know: globals.css defines 0.3s for expand, 0.2s for collapse
   - What's unclear: Should accordion match these or use different timing?
   - Recommendation: Match globals.css (0.3s expand with ease-out-expo, 0.2s collapse with ease-in)

## Sources

### Primary (HIGH confidence)
- [Radix Accordion Documentation](https://www.radix-ui.com/primitives/docs/components/accordion) - Official API
- [Radix Dialog Documentation](https://www.radix-ui.com/primitives/docs/components/dialog) - Sheet foundation
- package.json - Confirmed installed versions (@radix-ui/react-dialog@1.1.14, need to install accordion)
- app/components/ui/Modal.js - Existing Radix Dialog wrapper pattern (namespace, CVA, Portal)
- app/components/ui/BottomSheet.js - Legacy custom implementation to replace
- app/globals.css - Design tokens, animations (animate-slide-in-from-bottom, etc.), prefers-reduced-motion
- .planning/phases/31-expandable-components/31-CONTEXT.md - User decisions and constraints

### Secondary (MEDIUM confidence)
- [Radix GitHub Issue #1074](https://github.com/radix-ui/primitives/issues/1074) - Accordion flicker in React 18 (official issue tracker)
- [Radix GitHub Issue #1317](https://github.com/radix-ui/primitives/issues/1317) - Z-index portal conflicts
- [Radix Discussion #1311](https://github.com/radix-ui/primitives/discussions/1311) - Responsive accordion animation
- [shadcn/ui Accordion](https://ui.shadcn.com/docs/components/accordion) - Community implementation reference
- [shadcn/ui Sheet](https://ui.shadcn.com/docs/components/sheet) - Sheet pattern reference
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) - W3C specification
- [Expo Safe Areas](https://docs.expo.dev/develop/user-interface/safe-areas/) - iOS safe area handling
- [React Navigation Safe Area](https://reactnavigation.org/docs/handling-safe-area/) - Mobile safe area patterns

### Tertiary (LOW confidence)
- [Medium: Create a Drawer with Radix UI](https://medium.com/@andrey.nadosha/react-practicum-create-a-drawer-with-radix-ui-91a27f74079a) - Community tutorial
- [NextJS Shop: Responsive Dialog/Drawer](https://www.nextjsshop.com/resources/blog/responsive-dialog-drawer-shadcn-ui) - Implementation patterns
- [Builder.io: Animated CSS Accordions](https://www.builder.io/blog/animated-css-accordions) - CSS animation techniques

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Radix packages verified, versions confirmed, patterns exist in codebase (Modal.js)
- Architecture: HIGH - Modal.js, Button.js, Card.js provide exact patterns to follow
- Pitfalls: MEDIUM - Issues verified in Radix repo, some from web search and community reports
- Code examples: HIGH - Adapted from Radix official docs + existing project components + CONTEXT.md decisions
- Animation approach: HIGH - globals.css provides animations, Radix CSS variables documented

**Research date:** 2026-02-04
**Valid until:** 30 days (Radix stable, minor versions unlikely to break API)
