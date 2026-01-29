# Phase 13: Foundation Refactoring - Research

**Researched:** 2026-01-29
**Domain:** CVA Migration for Foundation Components (Button, Card, Heading, Text, Divider, Label)
**Confidence:** HIGH

## Summary

Phase 13 refactors existing foundation components to use CVA (class-variance-authority) patterns established in Phase 11-12. The research confirms all required tooling is already installed and battle-tested: CVA 0.7.1, clsx 2.1.1, tailwind-merge 3.4.0, jest-axe 10.0.0.

The existing components (Button, Card, Heading, Text, Divider) already have well-defined variant systems using string concatenation and object lookups. The migration involves:
1. Converting variant objects to CVA definitions
2. Replacing string concatenation with `cn()` helper
3. Implementing namespace pattern for compound components (`Card.Header`, `Button.Icon`)
4. Adding ember glow focus states consistently
5. Removing deprecated props while updating usages across the codebase
6. Creating new Label component with accessible form association

**Primary recommendation:** Follow the CVA structure established in Phase 12 components (Checkbox, Switch, Slider). Use compound variants for iconOnly sizing. Create comprehensive tests with jest-axe for all variant combinations. Clean break from legacy props - update all usages rather than maintaining backwards compatibility.

---

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| class-variance-authority | ^0.7.1 | Type-safe component variants | Installed, used in Phase 12 |
| clsx | ^2.1.1 | Conditional className construction | Installed, used in cn() |
| tailwind-merge | ^3.4.0 | Tailwind class conflict resolution | Installed, used in cn() |
| jest-axe | ^10.0.0 | Automated accessibility testing | Installed, configured |

### Supporting (Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-label | ^2.1.4 | Accessible form label primitive | COMP-09 Label component |
| lucide-react | ^0.562.0 | Icons (if needed for variants) | Loading spinner in Button |

### No Installation Required

All dependencies are already available from Phase 11-12. No `npm install` needed.

---

## Architecture Patterns

### Recommended File Structure

Components remain in existing location with updated structure:

```
app/components/ui/
  Button.js              # REFACTOR: CVA + namespace pattern (Button.Icon, Button.Group)
  Card.js                # REFACTOR: CVA + namespace pattern (Card.Header, Card.Title, etc.)
  Heading.js             # REFACTOR: CVA with all variants
  Text.js                # REFACTOR: CVA with all variants
  Divider.js             # REFACTOR: CVA with solid/dashed/gradient
  Label.js               # NEW: Radix Label wrapper for form association
  __tests__/
    Button.test.js       # UPDATE: CVA variants + jest-axe
    Card.test.js         # UPDATE: CVA variants + jest-axe
    Heading.test.js      # NEW: jest-axe tests
    Text.test.js         # NEW: jest-axe tests
    Divider.test.js      # NEW: jest-axe tests
    Label.test.js        # NEW: jest-axe tests
```

### Pattern 1: CVA Component with Compound Variants

**What:** Use CVA compoundVariants for complex variant interactions (size + iconOnly)
**When to use:** Button component where iconOnly affects padding differently per size
**Source:** Observed in Phase 12 components, documented in CVA docs

```javascript
// Button.js - CVA with compound variants
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  // Base classes
  [
    'font-display font-semibold rounded-xl transition-all duration-200',
    'flex items-center justify-center gap-2.5 relative overflow-hidden',
    // Ember glow focus ring (consistent with Phase 12)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
    '[html:not(.dark)_&]:focus-visible:ring-offset-slate-50',
    'active:scale-[0.97] select-none',
    // Disabled
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        ember: [...],
        subtle: [...],
        ghost: [...],
        success: [...],
        danger: [...],
        outline: [...],
      },
      size: {
        sm: 'px-4 py-2.5 min-h-[44px] text-sm',
        md: 'px-5 py-3 min-h-[48px] text-base',
        lg: 'px-6 py-4 min-h-[56px] text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
      iconOnly: {
        true: 'rounded-full',
      },
    },
    compoundVariants: [
      // iconOnly affects padding differently per size
      { size: 'sm', iconOnly: true, class: 'p-2.5 min-w-[44px]' },
      { size: 'md', iconOnly: true, class: 'p-3 min-w-[48px]' },
      { size: 'lg', iconOnly: true, class: 'p-4 min-w-[56px]' },
    ],
    defaultVariants: {
      variant: 'ember',
      size: 'md',
      fullWidth: false,
      iconOnly: false,
    },
  }
);

export { buttonVariants };
```

### Pattern 2: Namespace Compound Components

**What:** Export compound components as properties on main export (Radix-style)
**When to use:** Card (with Header, Title, Content, Footer, Divider), Button (with Icon, Group)
**Source:** Radix UI pattern, established in CONTEXT.md decision

```javascript
// Card.js - Namespace pattern
const Card = forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
));
Card.displayName = 'Card';

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center justify-between mb-4', className)} {...props} />
));
CardHeader.displayName = 'Card.Header';

// ... other sub-components

// Attach as namespace properties
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Divider = CardDivider;

// Named exports for tree-shaking
export { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDivider };

// Default export with namespace
export default Card;
```

### Pattern 3: CVA Typography Components

**What:** CVA for Heading/Text with variant + size combinations
**When to use:** Heading and Text components with color/size variants
**Source:** Current implementation adapted to CVA

```javascript
// Heading.js - CVA typography pattern
const headingVariants = cva(
  'font-bold font-display',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl sm:text-2xl',
        '2xl': 'text-2xl sm:text-3xl',
        '3xl': 'text-3xl sm:text-4xl',
      },
      variant: {
        default: 'text-slate-100 [html:not(.dark)_&]:text-slate-900',
        gradient: 'bg-gradient-to-r from-ember-500 to-flame-600 bg-clip-text text-transparent',
        subtle: 'text-slate-400 [html:not(.dark)_&]:text-slate-600',
        ember: 'text-ember-400 [html:not(.dark)_&]:text-ember-700',
      },
    },
    defaultVariants: {
      size: '2xl',
      variant: 'default',
    },
  }
);
```

### Pattern 4: Radix Label for Form Association

**What:** Wrap Radix Label primitive for accessible form control association
**When to use:** COMP-09 - creating Label component that auto-associates with form controls
**Source:** Radix UI primitives, already installed

```javascript
// Label.js - Radix Label wrapper
'use client';

import { forwardRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const labelVariants = cva(
  'font-medium font-display select-none',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      variant: {
        default: 'text-slate-300 [html:not(.dark)_&]:text-slate-700',
        muted: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
        required: 'text-slate-300 [html:not(.dark)_&]:text-slate-700 after:content-["*"] after:ml-0.5 after:text-ember-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const Label = forwardRef(({ className, size, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ size, variant }), className)}
    {...props}
  />
));
Label.displayName = 'Label';

export default Label;
export { labelVariants };
```

### Anti-Patterns to Avoid

- **String concatenation for classes:** Always use `cn()` helper, never template literals
- **Deprecated prop support in new code:** Remove legacy props (`liquid`, `glass`, `primary`, `secondary`, `elevation`), update usages
- **Direct style object manipulation:** Use CVA variants, not conditional style objects
- **Mixing className patterns:** Either CVA variants OR className override, not both for same property
- **Forgetting light mode:** Every dark mode class needs `[html:not(.dark)_&]:` counterpart

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form label association | Custom htmlFor + useId | Radix Label | Auto-association, accessibility built-in |
| Class merging | String concat / template literals | `cn()` from lib/utils/cn.js | Tailwind conflict resolution |
| Variant type safety | String enums / propTypes | CVA VariantProps | TypeScript-ready autocomplete |
| Focus ring consistency | Per-component focus styles | Shared CVA base classes | Ember glow consistent across all components |
| Theme handling | Multiple conditional classes | `[html:not(.dark)_&]:` selector | Established pattern in Phase 12 |

**Key insight:** CVA + cn() pattern is already proven in Phase 12 components (Checkbox, Switch, RadioGroup, Select, Slider). Copy the exact structure - no need to innovate on the pattern itself.

---

## Common Pitfalls

### Pitfall 1: className Order in cn()

**What goes wrong:** Custom className doesn't override CVA variants
**Why it happens:** Wrong order in cn() call - base classes last
**How to avoid:** `cn(cvaVariants({ variant, size }), className)` - className LAST
**Warning signs:** Passed className has no effect on styling

### Pitfall 2: Compound Variant vs Boolean Variant Confusion

**What goes wrong:** iconOnly styling doesn't interact with size correctly
**Why it happens:** Using boolean variant instead of compoundVariants for size-dependent styling
**How to avoid:** Use compoundVariants when one variant affects another's output
```javascript
compoundVariants: [
  { size: 'sm', iconOnly: true, class: 'p-2.5' },
  { size: 'md', iconOnly: true, class: 'p-3' },
]
```
**Warning signs:** iconOnly buttons have inconsistent padding across sizes

### Pitfall 3: Light Mode Selector Specificity

**What goes wrong:** Light mode styles don't apply or conflict
**Why it happens:** Using `[html:not(.dark)_&]` inconsistently
**How to avoid:** Every dark-mode-specific class needs a light mode counterpart on same element
**Warning signs:** Light mode looks broken or uses wrong colors

### Pitfall 4: Missing forwardRef for Compound Components

**What goes wrong:** Refs don't work on Card.Header, Button.Icon, etc.
**Why it happens:** Forgetting to wrap sub-components with forwardRef
**How to avoid:** Every exported component should use forwardRef pattern
**Warning signs:** Console warnings about invalid refs

### Pitfall 5: Namespace Pattern Import Confusion

**What goes wrong:** Tree-shaking doesn't work, bundle size increases
**Why it happens:** Only using default export with namespace, not named exports
**How to avoid:** Export both named exports AND namespace pattern
```javascript
// Both work:
import Card, { CardHeader } from './Card';  // Named
import Card from './Card'; <Card.Header />   // Namespace
```
**Warning signs:** Unused components still in bundle

### Pitfall 6: Breaking Existing Tests

**What goes wrong:** Existing tests fail after CVA migration
**Why it happens:** Tests check for specific class names that change with CVA
**How to avoid:** Replace old tests entirely following Phase 12 test patterns
**Warning signs:** Tests checking `toHaveClass('bg-ember-500')` fail when CVA changes output

---

## Code Examples

### Button CVA Migration (Complete Example)

```javascript
// app/components/ui/Button.js
'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Button Variants - CVA Configuration
 */
const buttonVariants = cva(
  // Base classes
  [
    'font-display font-semibold rounded-xl transition-all duration-200',
    'flex items-center justify-center gap-2.5 relative overflow-hidden',
    // Ember glow focus ring
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
    '[html:not(.dark)_&]:focus-visible:ring-offset-slate-50',
    'active:scale-[0.97] select-none',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        ember: [
          'bg-gradient-to-br from-ember-500 via-ember-600 to-flame-600 text-white',
          'shadow-[0_2px_8px_rgba(237,111,16,0.25)]',
          'hover:from-ember-400 hover:via-ember-500 hover:to-flame-500',
          'hover:shadow-[0_4px_16px_rgba(237,111,16,0.35)] hover:-translate-y-0.5',
        ],
        subtle: [
          'bg-white/[0.06] text-slate-200 border border-white/[0.08]',
          'hover:bg-white/[0.1] hover:border-white/[0.12] hover:-translate-y-0.5',
          '[html:not(.dark)_&]:bg-black/[0.04] [html:not(.dark)_&]:text-slate-700',
          '[html:not(.dark)_&]:border-black/[0.08]',
        ],
        ghost: [
          'bg-transparent text-slate-300',
          'hover:bg-white/[0.06] hover:text-slate-100',
          '[html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:bg-black/[0.04]',
        ],
        success: [
          'bg-gradient-to-br from-sage-500 via-sage-600 to-sage-700 text-white',
          'shadow-[0_2px_8px_rgba(96,115,96,0.25)] hover:-translate-y-0.5',
        ],
        danger: [
          'bg-gradient-to-br from-danger-500 via-danger-600 to-danger-700 text-white',
          'shadow-[0_2px_8px_rgba(239,68,68,0.25)] hover:-translate-y-0.5',
        ],
        outline: [
          'bg-transparent text-ember-400 border-2 border-ember-500/40',
          'hover:bg-ember-500/10 hover:border-ember-500/60 hover:-translate-y-0.5',
          '[html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:border-ember-500/50',
        ],
      },
      size: {
        sm: 'px-4 py-2.5 min-h-[44px] text-sm',
        md: 'px-5 py-3 min-h-[48px] text-base',
        lg: 'px-6 py-4 min-h-[56px] text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
      iconOnly: {
        true: 'rounded-full',
      },
    },
    compoundVariants: [
      { size: 'sm', iconOnly: true, class: 'p-2.5 min-w-[44px] px-2.5' },
      { size: 'md', iconOnly: true, class: 'p-3 min-w-[48px] px-3' },
      { size: 'lg', iconOnly: true, class: 'p-4 min-w-[56px] px-4' },
    ],
    defaultVariants: {
      variant: 'ember',
      size: 'md',
      fullWidth: false,
      iconOnly: false,
    },
  }
);

// ... rest of component implementation

export { buttonVariants };
```

### Card Namespace Pattern (Complete Example)

```javascript
// app/components/ui/Card.js
'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import Heading from './Heading';

const cardVariants = cva(
  [
    'rounded-2xl transition-all duration-300 ease-out relative overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-slate-900/80 border border-white/[0.06] shadow-card backdrop-blur-xl',
          '[html:not(.dark)_&]:bg-white/90 [html:not(.dark)_&]:border-black/[0.06]',
        ],
        elevated: [
          'bg-slate-850/90 border border-white/[0.08] shadow-card-elevated backdrop-blur-xl',
          '[html:not(.dark)_&]:bg-white/95 [html:not(.dark)_&]:border-black/[0.08]',
        ],
        subtle: [
          'bg-white/[0.03] border border-white/[0.04]',
          '[html:not(.dark)_&]:bg-black/[0.02] [html:not(.dark)_&]:border-black/[0.04]',
        ],
        outlined: [
          'bg-transparent border border-white/[0.12]',
          '[html:not(.dark)_&]:border-black/[0.12]',
        ],
        glass: [
          'bg-slate-900/70 border border-white/[0.08] shadow-card backdrop-blur-2xl backdrop-saturate-150',
          '[html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-black/[0.06]',
        ],
      },
      hover: {
        true: [
          'hover:shadow-card-hover hover:border-white/[0.1] hover:-translate-y-0.5 cursor-pointer',
          '[html:not(.dark)_&]:hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]',
        ],
      },
      glow: {
        true: [
          'shadow-ember-glow border-ember-500/20',
          '[html:not(.dark)_&]:shadow-[0_0_20px_rgba(237,111,16,0.12)]',
        ],
      },
      padding: {
        true: 'p-5 sm:p-6',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: false,
      glow: false,
      padding: true,
    },
  }
);

const Card = forwardRef(({
  className,
  variant,
  hover,
  glow,
  padding = true,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, hover, glow, padding }), className)}
    {...props}
  />
));
Card.displayName = 'Card';

// Sub-components
const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center justify-between mb-4', className)} {...props} />
));
CardHeader.displayName = 'Card.Header';

const CardTitle = forwardRef(({ children, icon, className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center gap-3', className)} {...props}>
    {icon && <span className="text-2xl sm:text-3xl">{icon}</span>}
    <Heading level={2} size="lg">{children}</Heading>
  </div>
));
CardTitle.displayName = 'Card.Title';

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-4', className)} {...props} />
));
CardContent.displayName = 'Card.Content';

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mt-5 pt-4 border-t border-white/[0.06]',
      '[html:not(.dark)_&]:border-black/[0.06]',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'Card.Footer';

const CardDivider = forwardRef(({ className }, ref) => (
  <div
    ref={ref}
    className={cn(
      'h-px my-4 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent',
      '[html:not(.dark)_&]:via-black/[0.08]',
      className
    )}
  />
));
CardDivider.displayName = 'Card.Divider';

// Attach namespace
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Divider = CardDivider;

// Named exports for tree-shaking
export { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDivider, cardVariants };

export default Card;
```

### Test Pattern (jest-axe + CVA Variants)

```javascript
// app/components/ui/__tests__/Button.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button, { IconButton, ButtonGroup } from '../Button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations for each variant', async () => {
      const variants = ['ember', 'subtle', 'ghost', 'success', 'danger', 'outline'];
      for (const variant of variants) {
        const { container } = render(<Button variant={variant}>Test</Button>);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('should have no a11y violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations when loading', async () => {
      const { container } = render(<Button loading>Loading</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CVA Variants', () => {
    it('applies ember variant classes by default', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-ember-500');
    });

    it('applies size variants correctly', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('min-h-[44px]');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('min-h-[56px]');
    });

    it('applies compound variants for iconOnly', () => {
      render(<Button iconOnly size="md" icon="X" aria-label="Close" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-full');
      expect(button).toHaveClass('min-w-[48px]');
    });
  });

  describe('Focus Ring', () => {
    it('has ember glow focus ring classes', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-ember-500/50');
    });
  });
});
```

---

## State of the Art

| Old Approach (Current) | New Approach (Phase 13) | Impact |
|------------------------|-------------------------|--------|
| Object-based variant lookup | CVA variants | Type-safe, autocomplete, consistent API |
| String template concatenation | `cn()` helper | Proper Tailwind conflict resolution |
| Separate exports (IconButton, CardHeader) | Namespace pattern (Button.Icon, Card.Header) | Radix-style consistency, better DX |
| Legacy prop mapping (`liquid`, `primary`) | Clean break - remove legacy props | Simpler API, no maintenance burden |
| Manual focus styles per component | Shared ember glow CVA base | Consistent brand identity |
| Sparse a11y testing | jest-axe for all variant combinations | 30% automated coverage |

**Deprecated (remove in Phase 13):**
- `liquid` prop on Button/Card: Use `variant` instead
- `glass` prop on Card: Use `variant="glass"` instead
- `primary`/`secondary` variant names on Button: Use `ember`/`subtle`
- `elevation` prop on Card: Use `variant="elevated"`
- Separate `IconButton` export: Use `Button.Icon`
- Separate `CardHeader` export: Use `Card.Header`

---

## Open Questions

### 1. Button Variant Consolidation

**What we know:** Current Button has 7 variants (ember, subtle, ghost, success, danger, ocean, outline)
**What's unclear:** Whether `ocean` variant is actually used in production
**Recommendation:** Keep all 6 main variants (ember, subtle, ghost, success, danger, outline). Search codebase for `variant="ocean"` usage - if none, remove. If used, keep.

### 2. Card hover/glow as CVA Booleans vs Props

**What we know:** CONTEXT.md left this to Claude's discretion
**What's unclear:** Whether CVA boolean variants work well for these interactive states
**Recommendation:** Use CVA boolean variants (`hover: { true: [...] }`) - cleaner API, consistent with Phase 12 patterns. Proven to work in RadioGroup, Select components.

### 3. Heading Level-to-Size Auto-Calculation

**What we know:** Current Heading maps `level` to `size` automatically (h1 → 3xl, h2 → 2xl, etc.)
**What's unclear:** Whether this should be preserved or made explicit
**Recommendation:** Keep auto-calculation as default behavior, but allow explicit `size` override. This maintains backwards compatibility while adding flexibility.

### 4. Test File Location

**What we know:** Existing tests are in `__tests__/` subdirectory
**What's unclear:** Whether this is the preferred pattern vs co-located tests
**Recommendation:** Follow existing convention - tests in `__tests__/` subdirectory. Consistent with Phase 12.

---

## Codebase Usage Analysis

### Button Variants Currently Used

From grep analysis of codebase:

| Variant | Usage Count | Status |
|---------|-------------|--------|
| `ember` | ~15+ | KEEP - Primary action |
| `subtle` | ~8+ | KEEP - Secondary action |
| `ghost` | ~6+ | KEEP - Tertiary/nav |
| `outline` | ~12+ | KEEP - Alternative CTA |
| `danger` | ~4+ | KEEP - Destructive actions |
| `success` | ~2 | KEEP - Confirmation actions |
| `ocean` | 1 | EVALUATE - May remove |
| `secondary` (legacy) | 1 | MIGRATE → `subtle` |
| `primary` (legacy) | 1 | MIGRATE → `ember` |

### Card Variants Currently Used

| Variant | Usage Count | Status |
|---------|-------------|--------|
| `default` | ~3 | KEEP |
| `elevated` | ~10+ | KEEP - Most common |
| `subtle` | ~3 | KEEP |
| `glass` | ~3 | KEEP |
| `outlined` | ~1 | KEEP |

### Files Requiring Updates (Legacy Props)

- `app/not-found.js` - `liquid variant="primary"` → `variant="ember"`
- Existing tests - Complete rewrite following Phase 12 patterns

---

## Sources

### Primary (HIGH confidence)

- Phase 12 components (Checkbox.js, Switch.js, Slider.js, Select.js, RadioGroup.js) - Proven CVA patterns
- CVA documentation (https://cva.style/docs) - compoundVariants, defaultVariants
- lib/utils/cn.js - Existing cn() implementation
- Phase 11 research (11-RESEARCH.md) - Tool stack decisions

### Secondary (MEDIUM confidence)

- globals.css - Design token definitions
- Radix UI Label documentation - @radix-ui/react-label API

### Tertiary (LOW confidence)

- Button/Card variant consolidation recommendations - Based on grep analysis, needs validation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already installed and proven in Phase 12
- Architecture patterns: HIGH - Directly copied from working Phase 12 components
- Pitfalls: HIGH - Observed in Phase 12 implementation
- Usage analysis: MEDIUM - Based on grep, may miss dynamic usage

**Research date:** 2026-01-29
**Valid until:** 60 days (stable patterns, internal refactoring)
