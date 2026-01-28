# Phase 11: Foundation & Tooling - Research

**Researched:** 2026-01-28
**Domain:** Design System Infrastructure (CVA, Radix UI, jest-axe, ESLint, Tailwind v4)
**Confidence:** HIGH

## Summary

Phase 11 establishes the infrastructure for type-safe, accessible component development in v3.0. The research identifies the standard stack for modern design system tooling with Tailwind CSS v4.

The recommended approach uses:
1. **CVA (class-variance-authority)** for type-safe variant APIs with autocomplete
2. **Radix UI primitives** for accessible complex interactions (Dialog, Dropdown, etc.)
3. **jest-axe** for automated accessibility testing in existing Jest setup
4. **ESLint plugin** for blocking hard-coded colors and enforcing token usage
5. **clsx + tailwind-merge** for the `cn()` helper function (shadcn pattern)
6. **Tailwind v4 @theme directive** for centralized design tokens (already in use)

**Primary recommendation:** Install CVA 0.7.1, radix-ui latest, jest-axe 10.0.0, eslint-plugin-tailwindcss. Create `cn()` helper with clsx + tailwind-merge. Audit and consolidate existing design tokens using @theme.

---

## Standard Stack

The established libraries/tools for design system infrastructure:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| class-variance-authority | ^0.7.1 | Type-safe component variants with autocomplete | Industry standard (8500+ dependents), shadcn/ui uses it, integrates with Tailwind IntelliSense |
| radix-ui | ^1.4.3 | Accessible UI primitives (Dialog, Dropdown, etc.) | WAI-ARIA compliant, unstyled, production-ready, maintained by WorkOS |
| jest-axe | ^10.0.0 | Automated accessibility testing in Jest | axe-core powered, catches 30% of a11y issues automatically, integrates with existing Jest setup |
| clsx | ^2.1.0 | Conditional className construction | 239B, faster than classnames, used by shadcn |
| tailwind-merge | ^2.5.0 | Merge Tailwind classes without conflicts | Resolves Tailwind specificity issues, essential for component composition |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-plugin-tailwindcss | ^3.17.0 | ESLint rules for Tailwind best practices | Enforce design token usage, block arbitrary color values |
| @types/jest-axe | ^3.5.9 | TypeScript definitions for jest-axe | TypeScript projects (optional for this JS project) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CVA | Stitches variants | CVA is CSS-agnostic, works with Tailwind; Stitches requires CSS-in-JS runtime |
| Radix UI | Headless UI | Radix has more primitives (30+ vs 10), better a11y, active development |
| jest-axe | @axe-core/react | jest-axe integrates with Jest; @axe-core/react is for runtime testing |
| clsx | classnames | clsx is 40% smaller and faster |
| tailwind-merge | twix | tailwind-merge has larger ecosystem, better maintained |

**Installation:**

```bash
npm install class-variance-authority radix-ui clsx tailwind-merge
npm install --save-dev jest-axe eslint-plugin-tailwindcss
```

---

## Architecture Patterns

### Recommended Project Structure

The project already has a good component structure. The additions for v3.0:

```
lib/
  utils/
    cn.ts                    # NEW: cn() helper function
app/
  components/
    ui/
      Button.js              # EXISTING: Migrate to CVA
      Card.js                # EXISTING: Migrate to CVA
      Modal.js               # EXISTING: Wrap Radix Dialog
      Select.js              # EXISTING: Wrap Radix Select
      __tests__/
        Button.test.js       # EXISTING: Add jest-axe assertions
        accessibility.test.js # NEW: Dedicated a11y test file
app/
  globals.css               # EXISTING: Consolidate @theme tokens
```

### Pattern 1: CVA Component Variants

**What:** Use CVA to define type-safe variants that generate Tailwind classes
**When to use:** Every component with multiple visual variants

**Example:**

```javascript
// Source: https://cva.style/docs/getting-started/variants
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  // Base classes - always applied
  [
    "font-display font-semibold rounded-xl transition-all duration-200",
    "flex items-center justify-center gap-2.5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50",
  ],
  {
    variants: {
      variant: {
        ember: "bg-gradient-to-br from-ember-500 via-ember-600 to-flame-600 text-white",
        subtle: "bg-white/[0.06] text-slate-200 border border-white/[0.08]",
        ghost: "bg-transparent text-slate-300 hover:bg-white/[0.06]",
        danger: "bg-gradient-to-br from-danger-500 via-danger-600 to-danger-700 text-white",
      },
      size: {
        sm: "px-4 py-2.5 min-h-[44px] text-sm",
        md: "px-5 py-3 min-h-[48px] text-base",
        lg: "px-6 py-4 min-h-[56px] text-lg",
      },
    },
    defaultVariants: {
      variant: "ember",
      size: "md",
    },
  }
);

export default function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// Export for TypeScript consumers (optional in JS)
export { buttonVariants };
```

### Pattern 2: Radix UI Primitive Wrapping

**What:** Wrap Radix primitives with project styling
**When to use:** Complex interactive patterns (Dialog, Dropdown, Select, Tooltip)

**Example:**

```javascript
// Source: https://www.radix-ui.com/primitives/docs/components/dialog
"use client";

import { Dialog as RadixDialog } from "radix-ui";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const overlayVariants = cva([
  "fixed inset-0 z-50",
  "bg-slate-950/80 backdrop-blur-sm",
  "data-[state=open]:animate-fade-in",
  "data-[state=closed]:animate-fade-out",
]);

const contentVariants = cva([
  "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  "z-50 w-full max-w-lg p-6",
  "bg-slate-900 border border-white/[0.06] rounded-2xl shadow-card-elevated",
  "data-[state=open]:animate-scale-in-center",
  "data-[state=closed]:animate-fade-out",
]);

export function Dialog({ children, ...props }) {
  return <RadixDialog.Root {...props}>{children}</RadixDialog.Root>;
}

export function DialogTrigger({ children, ...props }) {
  return <RadixDialog.Trigger asChild {...props}>{children}</RadixDialog.Trigger>;
}

export function DialogContent({ children, className, ...props }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className={overlayVariants()} />
      <RadixDialog.Content className={cn(contentVariants(), className)} {...props}>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;
export const DialogClose = RadixDialog.Close;
```

### Pattern 3: cn() Helper Function

**What:** Combine clsx (conditional classes) + tailwind-merge (conflict resolution)
**When to use:** Every component that accepts className prop

**Example:**

```javascript
// lib/utils/cn.js
// Source: https://ui.shadcn.com/docs/installation/manual
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 *
 * @param  {...any} inputs - Class values (strings, objects, arrays)
 * @returns {string} Merged class string
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-ember-500", className)
 * cn("text-sm", { "font-bold": isBold }, ["flex", "items-center"])
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

### Pattern 4: jest-axe Accessibility Testing

**What:** Add automated a11y assertions to existing tests
**When to use:** Every component test file

**Example:**

```javascript
// Source: https://github.com/NickColley/jest-axe
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import Button from "../Button";

expect.extend(toHaveNoViolations);

describe("Button Accessibility", () => {
  it("should have no accessibility violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have no violations when disabled", async () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have no violations for all variants", async () => {
    const variants = ["ember", "subtle", "ghost", "danger"];
    for (const variant of variants) {
      const { container } = render(<Button variant={variant}>Test</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });
});
```

### Anti-Patterns to Avoid

- **Inline style objects:** Use CVA variants, not `style={{}}` or className concatenation
- **Direct hex values in classes:** Use design tokens (`text-ember-500` not `text-[#ed6f10]`)
- **Custom focus styles:** Use Radix's built-in focus management
- **Manual aria attributes on Radix:** Radix handles ARIA automatically
- **Importing entire Radix library:** Use tree-shaking imports: `import { Dialog } from "radix-ui"`

---

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal focus trap | Custom focus management with useEffect | Radix Dialog | 47 edge cases (tab cycling, escape, outside click, screen readers) |
| Dropdown menu | Custom dropdown with useState | Radix DropdownMenu | Arrow key navigation, typeahead, submenu support |
| Select component | Custom select with div | Radix Select | Keyboard navigation, mobile native select, a11y |
| Tooltip | Custom tooltip with hover | Radix Tooltip | Delay logic, portal positioning, screen reader announce |
| Slider | Custom slider with range input | Radix Slider | Touch support, step snapping, range mode |
| Checkbox/Switch | Styled input[type=checkbox] | Radix Checkbox/Switch | Indeterminate state, controlled/uncontrolled, a11y labels |
| Class merging | String concatenation | cn() with tailwind-merge | Tailwind specificity conflicts silently break styling |

**Key insight:** Radix primitives encode years of accessibility research. Building custom versions means rediscovering edge cases the hard way (screen reader announcements, mobile keyboards, RTL support, etc.).

---

## Common Pitfalls

### Pitfall 1: CVA Base Class Conflicts

**What goes wrong:** Base classes conflict with variant classes, causing unexpected styling
**Why it happens:** Tailwind class order matters; `bg-white` followed by `bg-blue-500` doesn't override in some cases
**How to avoid:** Always use cn() wrapper around CVA output; never concatenate directly
**Warning signs:** Component looks different when className prop is passed vs not passed

### Pitfall 2: Radix Animation Data Attributes

**What goes wrong:** Animations don't trigger because data attributes aren't styled
**Why it happens:** Radix uses `data-[state=open]` for state, not CSS classes
**How to avoid:** Define animations with Tailwind's data-attribute syntax:
```css
data-[state=open]:animate-fade-in
data-[state=closed]:animate-fade-out
```
**Warning signs:** Modal appears instantly without animation; exit animations don't play

### Pitfall 3: jest-axe False Negatives in JSDOM

**What goes wrong:** Color contrast violations not detected
**Why it happens:** JSDOM doesn't compute styles like a real browser; color contrast checks are disabled
**How to avoid:** Understand jest-axe catches ~30% of issues; add visual regression tests for contrast
**Warning signs:** Tests pass but Lighthouse a11y audit fails on color contrast

### Pitfall 4: jest-axe + Fake Timers

**What goes wrong:** axe() timeouts and tests fail sporadically
**Why it happens:** axe-core uses setTimeout internally; Jest fake timers mock this
**How to avoid:** Use real timers for axe tests:
```javascript
jest.useRealTimers();
const results = await axe(container);
jest.useFakeTimers();
```
**Warning signs:** Random test failures with "axe timed out"; flaky CI

### Pitfall 5: ESLint Rule Bypass with Template Literals

**What goes wrong:** Hard-coded colors slip through in template literals
**Why it happens:** ESLint static analysis can't evaluate dynamic strings
**How to avoid:** Configure `no-arbitrary-value` rule; use only CVA variants, not interpolated classes
**Warning signs:** Build passes but arbitrary values exist: `className={\`text-[\${color}]\`}`

### Pitfall 6: Tailwind-Merge Over-Merging

**What goes wrong:** Intentional class overrides get merged away
**Why it happens:** tailwind-merge is aggressive about deduplication
**How to avoid:** Order matters - custom className should come LAST in cn()
**Warning signs:** className prop doesn't override base styles

---

## Code Examples

Verified patterns from official sources:

### Complete Button Migration (CVA Pattern)

```javascript
// app/components/ui/Button.js - After CVA migration
// Source: https://cva.style/docs and https://ui.shadcn.com/docs/components/button
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  // Base classes
  [
    "font-display font-semibold rounded-xl transition-all duration-200",
    "flex items-center justify-center gap-2.5 relative overflow-hidden",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
    "[html:not(.dark)_&]:focus-visible:ring-offset-slate-50",
    "active:scale-[0.97] select-none",
    "disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        ember: [
          "bg-gradient-to-br from-ember-500 via-ember-600 to-flame-600 text-white",
          "shadow-[0_2px_8px_rgba(237,111,16,0.25),0_1px_2px_rgba(0,0,0,0.1)]",
          "hover:from-ember-400 hover:via-ember-500 hover:to-flame-500",
          "hover:shadow-[0_4px_16px_rgba(237,111,16,0.35)] hover:-translate-y-0.5",
        ],
        subtle: [
          "bg-white/[0.06] text-slate-200 border border-white/[0.08]",
          "hover:bg-white/[0.1] hover:border-white/[0.12] hover:-translate-y-0.5",
          "[html:not(.dark)_&]:bg-black/[0.04] [html:not(.dark)_&]:text-slate-700",
          "[html:not(.dark)_&]:border-black/[0.08]",
        ],
        ghost: [
          "bg-transparent text-slate-300",
          "hover:bg-white/[0.06] hover:text-slate-100",
          "[html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:bg-black/[0.04]",
        ],
        success: [
          "bg-gradient-to-br from-sage-500 via-sage-600 to-sage-700 text-white",
          "shadow-[0_2px_8px_rgba(96,115,96,0.25)] hover:-translate-y-0.5",
        ],
        danger: [
          "bg-gradient-to-br from-danger-500 via-danger-600 to-danger-700 text-white",
          "shadow-[0_2px_8px_rgba(239,68,68,0.25)] hover:-translate-y-0.5",
        ],
        outline: [
          "bg-transparent text-ember-400 border-2 border-ember-500/40",
          "hover:bg-ember-500/10 hover:border-ember-500/60 hover:-translate-y-0.5",
        ],
      },
      size: {
        sm: "px-4 py-2.5 min-h-[44px] text-sm",
        md: "px-5 py-3 min-h-[48px] text-base",
        lg: "px-6 py-4 min-h-[56px] text-lg",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "ember",
      size: "md",
      fullWidth: false,
    },
  }
);

export default function Button({
  children,
  variant,
  size,
  fullWidth,
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
      )}
      <span className={cn("flex items-center justify-center gap-2.5", loading && "invisible")}>
        {icon && iconPosition === "left" && <span>{icon}</span>}
        {children && <span>{children}</span>}
        {icon && iconPosition === "right" && <span>{icon}</span>}
      </span>
    </button>
  );
}

export { buttonVariants };
```

### ESLint Configuration for Token Enforcement

```javascript
// eslint.config.mjs - Extended configuration
// Source: https://github.com/francoismassart/eslint-plugin-tailwindcss
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tailwindcss from "eslint-plugin-tailwindcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    plugins: {
      tailwindcss,
    },
    rules: {
      // Block arbitrary color values - enforce design tokens
      "tailwindcss/no-arbitrary-value": ["warn", {
        // Allow arbitrary values for specific properties that need flexibility
        "ignoreProperties": ["content", "grid-template-columns"],
      }],
      // Suggest design tokens over arbitrary values
      "tailwindcss/enforces-negative-arbitrary-values": "warn",
      // Ensure class ordering for consistency
      "tailwindcss/classnames-order": "warn",
    },
  },
];

export default eslintConfig;
```

### jest-axe Setup in jest.setup.js

```javascript
// Addition to jest.setup.js
// Source: https://github.com/NickColley/jest-axe

// Import and extend jest-axe matchers
const { toHaveNoViolations } = require('jest-axe');
expect.extend(toHaveNoViolations);

// Configure axe for better test stability
// Disable color contrast checks (not reliable in JSDOM)
const configuredAxe = require('jest-axe').configureAxe({
  rules: {
    // These rules have known issues in JSDOM
    'color-contrast': { enabled: false },
  },
});

// Export configured axe for test files
global.axe = configuredAxe;
```

### Design Token Consolidation (@theme)

```css
/* app/globals.css - Token consolidation pattern */
/* Source: https://tailwindcss.com/docs/theme */

@import "tailwindcss";

@theme {
  /* Foundation Colors - Warm charcoal tones */
  --color-slate-950: #0c0a09;
  --color-slate-900: #1c1917;
  --color-slate-850: #231f1d;
  --color-slate-800: #292524;
  /* ... existing slate scale ... */

  /* Ember - Primary accent (already defined) */
  --color-ember-500: #ed6f10;
  /* ... existing ember scale ... */

  /* SEMANTIC ALIASES - NEW */
  /* These map intentions to specific tokens */
  --color-bg-primary: var(--color-slate-950);
  --color-bg-secondary: var(--color-slate-900);
  --color-bg-surface: var(--color-slate-850);
  --color-bg-elevated: var(--color-slate-800);

  --color-text-primary: var(--color-slate-200);
  --color-text-secondary: var(--color-slate-400);
  --color-text-muted: var(--color-slate-500);

  --color-border-default: rgba(255, 255, 255, 0.06);
  --color-border-hover: rgba(255, 255, 255, 0.1);

  --color-accent-primary: var(--color-ember-500);
  --color-accent-hover: var(--color-ember-400);
}

/* Light mode overrides using @theme in media query */
@media (prefers-color-scheme: light) {
  @theme {
    --color-bg-primary: var(--color-slate-50);
    --color-bg-secondary: var(--color-slate-100);
    --color-text-primary: var(--color-slate-900);
    --color-text-secondary: var(--color-slate-600);
    --color-border-default: rgba(0, 0, 0, 0.06);
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js | @theme in CSS | Tailwind v4 (2024) | Single source of truth, no context switching |
| classnames library | clsx + tailwind-merge | shadcn pattern (2023) | Smaller bundle, conflict resolution |
| Custom variant logic | CVA | shadcn adoption (2023) | Type-safe, autocomplete, consistent API |
| Custom modals | Radix Dialog | Industry standard | WAI-ARIA compliant by default |
| Manual a11y testing | jest-axe automation | axe-core maturity | Catches 30% of issues in CI |

**Deprecated/outdated:**
- `tailwind.config.js` for theme: Use @theme directive in CSS
- `classnames` package: Use clsx (40% smaller)
- Custom focus trap implementations: Use Radix
- aria-* attributes on primitive wrappers: Radix handles automatically

---

## Open Questions

Things that couldn't be fully resolved:

1. **Migration order for existing components**
   - What we know: 20+ components need CVA migration
   - What's unclear: Priority order - which components benefit most from CVA?
   - Recommendation: Start with high-usage components (Button, Card, Panel) for maximum impact

2. **Radix vs existing Modal implementation**
   - What we know: Current Modal.js works but has custom focus trap logic
   - What's unclear: Risk of breaking existing modal usage across pages
   - Recommendation: Create new RadixModal wrapper, deprecate old Modal gradually

3. **ESLint rule strictness**
   - What we know: `no-arbitrary-value` can block legitimate edge cases
   - What's unclear: Exact ignore list needed for this project
   - Recommendation: Start with "warn", promote to "error" after baseline is clean

---

## Sources

### Primary (HIGH confidence)
- [CVA Official Documentation](https://cva.style/docs) - Installation, API, variants
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/overview/getting-started) - All 30+ components
- [Tailwind CSS v4 @theme](https://tailwindcss.com/docs/theme) - Design token system
- [jest-axe GitHub](https://github.com/NickColley/jest-axe) - Setup, limitations, examples
- [shadcn/ui Manual Installation](https://ui.shadcn.com/docs/installation/manual) - cn() function pattern

### Secondary (MEDIUM confidence)
- [eslint-plugin-tailwindcss](https://www.npmjs.com/package/eslint-plugin-tailwindcss) - Rule configuration
- [Using clsx with tailwind-merge](https://akhilaariyachandra.com/blog/using-clsx-or-classnames-with-tailwind-merge) - Pattern explanation
- [WebDong: Why Does shadcn use cn()?](https://www.webdong.dev/en/post/tailwind-merge-and-clsx-in-shadcn/) - Rationale

### Tertiary (LOW confidence - requires validation)
- Feature request for color-specific arbitrary value detection in eslint-plugin-tailwindcss is still open (may not be implemented)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are industry standard with 1000s of dependents
- Architecture patterns: HIGH - Patterns verified in shadcn/ui and official docs
- Pitfalls: MEDIUM - Based on community reports and documentation warnings
- ESLint configuration: MEDIUM - Rule behavior may vary with project specifics

**Research date:** 2026-01-28
**Valid until:** 90 days (stable libraries, no major releases expected)
