# Phase 23: Thermostat Page Compliance - Research

**Researched:** 2026-02-02
**Domain:** Design system compliance, CVA variants, React component patterns
**Confidence:** HIGH

## Summary

This phase completes design system v3.0 compliance for the thermostat page by replacing raw HTML elements with design system components. The page currently uses Button, Card, Heading, Text, Grid extensively from the v3.0 migration. Three specific gaps remain: (1) raw div stat boxes for topology info, (2) manual page wrapper instead of PageLayout, and (3) custom activeClassName overrides instead of CVA-based colorScheme.

The project already uses class-variance-authority (CVA) 0.7.1 for type-safe component variants. InfoBox component exists but needs variant prop support. PageLayout component exists and is production-ready. Button component needs colorScheme prop via CVA compound variants pattern.

The standard approach is CVA compound variants where colorScheme combines with existing variant (subtle, ghost, etc.) to produce tinted versions (subtle-sage, ghost-ocean). This maintains the separation of concerns: variant controls style (solid, subtle, ghost), colorScheme controls color tinting.

**Primary recommendation:** Add colorScheme prop to Button using CVA compound variants, update InfoBox to use variant prop matching design system palette, wrap thermostat page in PageLayout, remove custom activeClassName overrides in favor of declarative colorScheme API.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| class-variance-authority | 0.7.1 | Type-safe component variants | Industry standard for variant composition (used by shadcn/ui, CVA + Tailwind pattern) |
| React | 18.x | Component framework | Project foundation |
| Next.js | 15.5 | Framework | Project foundation |
| Tailwind CSS | 3.x | Styling | Project foundation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | Current | Component testing | All new component features |
| jest-axe | 10.0.0 | Accessibility testing | All interactive components |
| @testing-library/user-event | Current | User interaction simulation | Button interaction tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CVA compound variants | Separate component per color | Less composable, more code duplication |
| CVA colorScheme | CSS-in-JS theming | Breaks Tailwind-first pattern, adds runtime overhead |
| InfoBox variants | Multiple InfoBox components | Violates DRY, harder to maintain consistency |

**Installation:**
```bash
# All dependencies already installed
# No new packages required
```

## Architecture Patterns

### Recommended Component Structure
```
app/components/ui/
├── Button.js           # Add colorScheme compound variants
├── InfoBox.js          # Add variant prop (already exists, needs update)
├── PageLayout.js       # Already complete, use as-is
└── index.js            # InfoBox already exported
```

### Pattern 1: CVA Compound Variants for colorScheme
**What:** Compound variants apply classes when multiple variant conditions are met simultaneously
**When to use:** Button colorScheme that tints existing variants (subtle-sage, ghost-ocean)
**Example:**
```typescript
// Source: https://cva.style/docs/getting-started/variants
export const buttonVariants = cva(
  // Base classes...
  {
    variants: {
      variant: { subtle: [...], ghost: [...] },
      colorScheme: {
        sage: [],    // No classes here - applied in compoundVariants
        ocean: [],
        warning: [],
        slate: []
      }
    },
    compoundVariants: [
      // subtle + sage
      {
        variant: 'subtle',
        colorScheme: 'sage',
        class: 'bg-sage-500/20 text-sage-300 border-sage-500/40'
      },
      // ghost + ocean
      {
        variant: 'ghost',
        colorScheme: 'ocean',
        class: 'text-ocean-300 hover:bg-ocean-500/10'
      }
      // ... other combinations
    ]
  }
);
```

### Pattern 2: InfoBox Variant Prop
**What:** Single component with variant prop for color tinting (matching Badge pattern)
**When to use:** Stat boxes, info displays that need semantic color coding
**Example:**
```jsx
// Current codebase pattern (Badge.js)
<InfoBox
  label="Casa"
  value={topology.home_name}
  variant="neutral"  // ember, sage, ocean, warning, danger, neutral
/>
```

### Pattern 3: PageLayout Wrapper
**What:** PageLayout.Header for title/subtitle, PageLayout wraps page content
**When to use:** All full pages (already used in design system docs)
**Example:**
```jsx
// Source: PageLayout.js lines 175-203
<PageLayout maxWidth="7xl">
  <PageLayout.Header
    title="Controllo Netatmo"
    description="Gestisci temperature e riscaldamento di tutte le stanze"
  />
  {/* Page content */}
</PageLayout>
```

### Anti-Patterns to Avoid
- **Custom className overrides for active state:** Use colorScheme prop instead of `className={isActive ? config.activeClassName : undefined}`
- **Multiple InfoBox components per color:** Use single component with variant prop
- **Manual page wrappers:** Use PageLayout instead of `<div className="max-w-7xl mx-auto...">`
- **Separate colorScheme CVA objects:** Use compound variants in single CVA definition

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Button color tinting | Custom className per color | CVA colorScheme compound variants | Type-safe, composable, maintainable |
| Stat box component | Multiple components per color | InfoBox with variant prop | Consistent with Badge pattern, single source of truth |
| Page layout structure | Manual div wrappers | PageLayout component | Consistent spacing, responsive, accessible |
| Active button styling | Inline className ternaries | colorScheme + variant props | Declarative API, testable, no magic strings |

**Key insight:** CVA compound variants prevent the explosion of variant combinations. Without compoundVariants, you'd need `subtle-sage`, `subtle-ocean`, `ghost-sage`, `ghost-ocean` as separate variant keys. With compoundVariants, you have 2 variant dimensions (variant × colorScheme) that compose cleanly.

## Common Pitfalls

### Pitfall 1: Empty colorScheme Variant Classes
**What goes wrong:** Developers put color classes in colorScheme variant keys instead of compoundVariants
**Why it happens:** CVA documentation emphasizes single variants, compound variants feel "advanced"
**How to avoid:** colorScheme variants should have empty class arrays `[]`. All styling goes in compoundVariants.
**Warning signs:** Button with colorScheme="sage" but variant not set gets unwanted styling

### Pitfall 2: Breaking Existing Button Usage
**What goes wrong:** Adding colorScheme changes default Button appearance
**Why it happens:** Not setting proper defaultVariants or making colorScheme required
**How to avoid:** Make colorScheme optional with no default. Only applies when explicitly set.
**Warning signs:** Test failures on existing Button tests, visual regressions

### Pitfall 3: Inconsistent Color Palette
**What goes wrong:** InfoBox variants don't match Button colorScheme options
**Why it happens:** Components developed separately without shared palette definition
**How to avoid:** Both Button.colorScheme and InfoBox.variant use same color names: ember, sage, ocean, warning, danger, neutral
**Warning signs:** InfoBox has "success" but Button has "sage", inconsistent naming

### Pitfall 4: Light Mode Forgotten
**What goes wrong:** colorScheme compound variants only define dark mode colors
**Why it happens:** Dark-first design makes light mode an afterthought
**How to avoid:** Every compound variant must include `[html:not(.dark)_&]:...` overrides
**Warning signs:** Light mode shows dark mode colors, no contrast inversion

### Pitfall 5: Over-Testing Implementation Details
**What goes wrong:** Tests check for specific Tailwind classes instead of behavior
**Why it happens:** CVA makes class testing easy, seems like good coverage
**How to avoid:** Test that colorScheme prop is accepted and renders without errors. Don't test exact class strings (Tailwind may change). Use visual regression tests.
**Warning signs:** Test breaks when Tailwind config changes opacity values

## Code Examples

Verified patterns from official sources and existing codebase:

### Adding colorScheme to Button Component
```javascript
// Source: Button.js + https://cva.style/docs/getting-started/variants
export const buttonVariants = cva(
  // Base classes (unchanged)
  [...],
  {
    variants: {
      variant: {
        subtle: [...],  // Existing
        ghost: [...],   // Existing
        // ... other variants unchanged
      },
      colorScheme: {
        // Empty arrays - styling happens in compoundVariants
        sage: [],
        ocean: [],
        warning: [],
        slate: [],
      },
      size: { sm: [...], md: [...], lg: [...] },  // Existing
      // ... other variants unchanged
    },
    compoundVariants: [
      // Existing compound variants (iconOnly + size)
      { iconOnly: true, size: 'sm', className: '...' },

      // NEW: subtle + colorScheme combinations
      {
        variant: 'subtle',
        colorScheme: 'sage',
        class: [
          'bg-sage-500/20 text-sage-300',
          'border border-sage-500/40 shadow-sm',
          '[html:not(.dark)_&]:bg-sage-500/20',
          '[html:not(.dark)_&]:text-sage-700',
          '[html:not(.dark)_&]:border-sage-500/30',
        ]
      },
      {
        variant: 'subtle',
        colorScheme: 'ocean',
        class: [
          'bg-ocean-500/20 text-ocean-300',
          'border border-ocean-500/40 shadow-sm',
          '[html:not(.dark)_&]:bg-ocean-500/20',
          '[html:not(.dark)_&]:text-ocean-700',
          '[html:not(.dark)_&]:border-ocean-500/30',
        ]
      },
      // ... similar for warning, slate

      // NEW: ghost + colorScheme combinations
      {
        variant: 'ghost',
        colorScheme: 'sage',
        class: [
          'text-sage-300 hover:bg-sage-500/10',
          '[html:not(.dark)_&]:text-sage-700',
          '[html:not(.dark)_&]:hover:bg-sage-500/10',
        ]
      },
      // ... similar for ocean, warning, slate
    ],
    defaultVariants: {
      variant: 'ember',
      size: 'md',
      colorScheme: undefined,  // NEW: optional, no default
      // ... other defaults unchanged
    }
  }
);

// Component signature update
const Button = forwardRef(function Button(
  {
    children,
    variant = 'ember',
    colorScheme,  // NEW: optional prop
    size = 'md',
    // ... other props unchanged
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, colorScheme, size, fullWidth, iconOnly }),
        className
      )}
      {...props}
    >
      {/* ... children unchanged */}
    </button>
  );
});
```

### InfoBox Variant Prop Pattern
```javascript
// Source: InfoBox.js (lines 18-76) + Badge.js pattern
export default function InfoBox({
  label,
  value,
  variant = 'neutral',  // NEW: replaces valueColor
  className = '',
}) {
  // Define variant colors matching Badge and Button colorScheme
  const variantClasses = {
    neutral: 'text-slate-100 [html:not(.dark)_&]:text-slate-900',
    ember: 'text-ember-400 [html:not(.dark)_&]:text-ember-600',
    sage: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
    ocean: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600',
    warning: 'text-warning-400 [html:not(.dark)_&]:text-warning-600',
    danger: 'text-danger-400 [html:not(.dark)_&]:text-danger-600',
  };

  return (
    <div className={`
      relative overflow-hidden rounded-xl
      bg-slate-800/50 backdrop-blur-xl
      border border-slate-700/40
      transition-all duration-200
      hover:bg-slate-800/70 hover:border-slate-600/50
      [html:not(.dark)_&]:bg-white/70
      [html:not(.dark)_&]:border-slate-200
      ${className}
    `}>
      <div className="relative z-10 p-3 sm:p-4">
        <Text variant="label" size="xs" className="mb-1">
          {label}
        </Text>
        <Text
          size="lg"
          weight="bold"
          className={variantClasses[variant]}
        >
          {value}
        </Text>
      </div>
    </div>
  );
}
```

### Thermostat Page Refactor Pattern
```javascript
// Source: thermostat/page.js lines 350-470
// BEFORE: Custom wrapper + raw divs
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className="mb-8">
    <Heading level={1} size="3xl" className="mb-2">
      Controllo Netatmo
    </Heading>
    <Text variant="secondary">
      Gestisci temperature e riscaldamento di tutte le stanze
    </Text>
  </div>

  {/* Mode buttons with custom activeClassName */}
  <Button
    variant={isActive ? 'subtle' : 'ghost'}
    className={isActive ? config.activeClassName : undefined}
  >
    {config.label}
  </Button>

  {/* Raw div stat boxes */}
  <div className="p-3 rounded-xl bg-slate-800/40 backdrop-blur-sm">
    <Text variant="label" size="xs">Casa</Text>
    <Text variant="body" size="lg" weight="bold">
      {topology.home_name}
    </Text>
  </div>
</div>

// AFTER: PageLayout + InfoBox + colorScheme
<PageLayout maxWidth="7xl">
  <PageLayout.Header
    title="Controllo Netatmo"
    description="Gestisci temperature e riscaldamento di tutte le stanze"
  />

  {/* Mode buttons with declarative colorScheme */}
  <Button
    variant={isActive ? 'subtle' : 'ghost'}
    colorScheme={isActive ? modeColorScheme : undefined}
    size="sm"
  >
    {config.label}
  </Button>

  {/* InfoBox with variant */}
  <InfoBox
    label="Casa"
    value={topology.home_name}
    variant="neutral"
  />
</PageLayout>
```

### Testing colorScheme Compound Variants
```javascript
// Source: Button.test.js pattern (lines 156-177)
describe('colorScheme Compound Variants', () => {
  test('subtle + sage applies tinted background', () => {
    render(<Button variant="subtle" colorScheme="sage">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-sage-500/20');
    expect(button).toHaveClass('text-sage-300');
  });

  test('ghost + ocean applies tinted text', () => {
    render(<Button variant="ghost" colorScheme="ocean">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-ocean-300');
  });

  test('colorScheme without variant uses default variant', () => {
    render(<Button colorScheme="sage">Test</Button>);
    const button = screen.getByRole('button');
    // Should be ember variant (default) - colorScheme doesn't apply to ember
    expect(button).toHaveClass('bg-gradient-to-br');
  });

  test('colorScheme has no effect on ember variant', () => {
    render(<Button variant="ember" colorScheme="sage">Test</Button>);
    const button = screen.getByRole('button');
    // Ember variant ignores colorScheme
    expect(button).toHaveClass('from-ember-500');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom className overrides | CVA compound variants | CVA 0.7+ | Type-safe, composable color schemes |
| Multiple component files per color | Single component with variant prop | Design system v3.0 | Easier maintenance, consistent API |
| Inline color classes | Design system semantic colors | v3.0 | WCAG compliance, theme support |
| Manual page wrappers | PageLayout component | v3.0 | Consistent spacing, responsive |

**Deprecated/outdated:**
- `valueColor` prop on InfoBox: Use `variant` prop instead (matches Badge pattern)
- Custom `activeClassName` overrides: Use `colorScheme` prop with CVA
- Direct Tailwind color classes in JSX: Use design system components and variants

## Open Questions

1. **Should colorScheme apply to ember variant?**
   - What we know: Ember is primary brand color (gradient), other variants are single colors
   - What's unclear: Does "ember + sage" make semantic sense?
   - Recommendation: Exclude ember from colorScheme compound variants. It's the brand color and shouldn't be tinted.

2. **Should InfoBox support all Badge variants or subset?**
   - What we know: InfoBox currently shows neutral info (topology stats)
   - What's unclear: Will InfoBox be used for status/alerts requiring danger/warning?
   - Recommendation: Support full palette (neutral, ember, sage, ocean, warning, danger) for future flexibility

3. **Should we add accessibility tests for InfoBox variant?**
   - What we know: Badge has a11y tests, InfoBox is similar component
   - What's unclear: InfoBox is informational (not interactive), does jest-axe add value?
   - Recommendation: Add basic a11y tests for each variant to verify WCAG contrast ratios

## Sources

### Primary (HIGH confidence)
- [CVA Variants Documentation](https://cva.style/docs/getting-started/variants) - Compound variants pattern and implementation
- Button.js (lines 1-289) - Existing CVA implementation and compound variants pattern
- Badge.js (lines 1-146) - Variant prop pattern for color tinting
- InfoBox.js (lines 1-77) - Current implementation, needs variant prop
- PageLayout.js (lines 1-212) - Complete PageLayout component ready to use
- Button.test.js (lines 1-481) - Testing patterns for CVA variants and compound variants

### Secondary (MEDIUM confidence)
- [Chakra UI Button colorScheme](https://chakra-ui.com/docs/components/button) - Industry pattern for button color schemes
- [CVA GitHub Discussion #240](https://github.com/joe-bell/cva/discussions/240) - Multi-color variant patterns
- [CVA and Tailwind Article](https://fveracoechea.com/blog/cva-and-tailwind/) - CVA best practices with Tailwind

### Tertiary (LOW confidence)
- [Smashing Magazine - Color Mechanics](https://www.smashingmagazine.com/2023/04/color-mechanics-ui-kits/) - Design system color architecture
- [React Component Libraries 2026](https://technostacks.com/blog/react-component-libraries/) - General React patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies installed, CVA 0.7.1 confirmed
- Architecture: HIGH - Existing patterns in codebase (Badge, Button CVA), official CVA docs verify compound variants
- Pitfalls: HIGH - Derived from existing Button.test.js patterns and CVA limitations

**Research date:** 2026-02-02
**Valid until:** 30 days (CVA and design system patterns are stable)
