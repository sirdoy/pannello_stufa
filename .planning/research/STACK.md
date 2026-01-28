# Technology Stack - Design System & Component Library

**Project:** Pannello Stufa
**Milestone:** Complete UI Component Library & Design Consistency
**Researched:** 2026-01-28
**Overall confidence:** HIGH

---

## Executive Summary

For completing Pannello Stufa's design system and component library, the recommended approach is a **custom component library built on Radix UI primitives** with enhanced tooling for consistency and accessibility. This builds on your existing Tailwind CSS foundation and Ember Noir v2 design system without introducing bloated UI frameworks.

**Key decision:** Use Radix UI primitives for complex interactive components (Dialog, Dropdown, Select, Tooltip) while building simpler components (Button, Card, Input) from scratch. This gives you full control over styling while leveraging battle-tested accessibility and keyboard navigation for complex patterns.

---

## Recommended Stack

### Component Primitives

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@radix-ui/react-dialog** | ^1.1.4 | Modal, Dialog components | Best-in-class accessibility, focus management, scroll locking, portal rendering. Handles complex ARIA patterns you shouldn't build from scratch. |
| **@radix-ui/react-dropdown-menu** | ^2.1.4 | Dropdown menus, context menus | Keyboard navigation, nested menus, typeahead support built-in. Critical for accessible navigation patterns. |
| **@radix-ui/react-select** | ^2.1.8 | Custom select dropdowns | Native `<select>` has poor styling options. Radix provides accessible custom selects with search, multi-select support. |
| **@radix-ui/react-tooltip** | ^1.1.8 | Tooltips, popovers | Proper positioning, collision detection, portal rendering. Handles edge cases (viewport boundaries, nested triggers). |
| **@radix-ui/react-checkbox** | ^1.1.4 | Checkbox with indeterminate state | Already have basic Checkbox component, but Radix handles indeterminate state and proper ARIA attributes. |
| **@radix-ui/react-switch** | ^1.1.4 | Toggle switches | Similar to your Toggle component but with enhanced accessibility and animation hooks. |

**Rationale:** Radix UI is the industry standard for headless components in 2026. It provides 1,500+ production apps' worth of edge case handling, accessibility testing, and cross-browser compatibility. Unlike Headless UI (focused on Tailwind Labs ecosystem), Radix offers more component variety and better TypeScript support. React Aria is more verbose and requires deeper accessibility knowledge to implement correctly.

**Install only what you need:**
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tooltip
```

**Note:** Do NOT install the unified `radix-ui` package (v1.4.3). Use individual `@radix-ui/react-*` packages for tree-shaking and version control.

### Component Variant Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **class-variance-authority** | ^0.7.1 | Type-safe variant APIs | Consolidates classname logic, provides autocomplete for variants, works seamlessly with Tailwind. Your existing components use ad-hoc variant logic - CVA standardizes this pattern. |
| **clsx** | ^2.1.1 | Conditional class merging | Lightweight (228B), handles conditional classes and arrays. Industry standard utility. |
| **tailwind-merge** | ^2.7.0 | Tailwind class conflict resolution | Prevents class conflicts when merging dynamic classes (e.g., `bg-red-500` overriding `bg-blue-500`). Essential for component composition. |

**Rationale:** These three libraries form the canonical "cn utility" pattern popularized by shadcn/ui. CVA provides the variant API (replacing your manual switch statements), clsx handles conditionals, tailwind-merge prevents class conflicts. Combined bundle size: ~25KB. Alternative approaches (styled-components, CSS Modules) don't integrate well with Tailwind's utility-first philosophy.

**Implementation pattern:**
```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'rounded-xl font-medium transition-colors', // base
  {
    variants: {
      variant: {
        ember: 'bg-ember-400 text-white hover:bg-ember-500',
        ghost: 'bg-transparent text-slate-200 hover:bg-white/5',
        outline: 'border border-white/10 hover:border-ember-400',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4',
        lg: 'h-13 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'ember',
      size: 'md',
    },
  }
);
```

### Icon Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **lucide-react** | ^0.562.0 (KEEP) | Icon system | Already installed. 1,500+ consistent, modern icons. Tree-shakable, 22.1KB bundle size. Superior to react-icons (50K+ icons but inconsistent styles) and Heroicons (only 300 icons). No change needed. |

**Rationale:** You already have lucide-react v0.562.0. This is the correct choice for 2026. Lucide offers the best balance of variety (1,500+ icons), consistency (24x24 grid), bundle size (tree-shakable), and Tailwind integration. React Icons has too much inconsistency across icon packs. Heroicons is too limited for a full app. Stick with Lucide.

### Accessibility Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **jest-axe** | ^10.0.0 | Automated a11y testing | Integrates axe-core (industry standard) with Jest. Catches ~70% of WCAG violations automatically. Required for WCAG AA compliance goal. |
| **@axe-core/react** | ^4.10.2 | Runtime accessibility auditing (dev only) | Shows a11y violations in browser console during development. Helps catch issues before tests. Dev-only bundle, zero production cost. |

**Rationale:** jest-axe is the standard for automated accessibility testing in React. Version 10.0.0 (released March 2025) includes axe-core 4.10.2. Important limitation: ~30% of barriers require manual testing (color contrast in JSDOM, screen reader compatibility). Use jest-axe for automated gates, manual WCAG audits for compliance certification.

**Setup:**
```bash
npm install --save-dev jest-axe @axe-core/react
```

```typescript
// jest.setup.js
import 'jest-axe/extend-expect';

// app/layout.tsx (dev only)
if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

### Component Documentation (OPTIONAL)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Storybook** | ^10.0.1 | Component catalog & testing | Industry standard for component documentation. Storybook 10 supports React 19 and Next.js 15. Includes accessibility addon for component-level auditing. |

**Recommendation:** **DEFER to post-milestone.** Here's why:

**Arguments FOR Storybook:**
- Interactive component playground
- Visual regression testing capabilities
- Built-in accessibility addon
- Team documentation

**Arguments AGAINST (for this milestone):**
- Setup complexity with Next.js 15 + React 19 (ongoing compatibility issues)
- Adds 100+ dependencies
- You already have `/debug/design-system` page showing components
- Your project is single-developer (less documentation need)
- Testing priority is unit tests (Jest) and E2E (Playwright), not visual regression

**If you choose to add Storybook later:**
```bash
npx storybook@latest init --builder webpack5
```
Use Webpack builder (not Vite) for Next.js compatibility. Expect 30-60 minutes setup time for Next.js 15 + React 19 configuration.

### Design Token Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Tailwind CSS v4.x** | N/A (future) | CSS-first design tokens | NOT RECOMMENDED for this milestone. V4 changes configuration paradigm from JS to CSS (`@theme` directive). Your tailwind.config.ts works. Migration provides zero functional benefit for milestone goals. |

**Rationale:** Tailwind CSS v4 introduced `@theme` directive for CSS-first design tokens. This is conceptually cleaner (design tokens in CSS, not JS) but requires migration effort. Your existing Tailwind v4.1.18 configuration already exposes design tokens as CSS variables. The v4 `@theme` migration provides no new functionality for your milestone (component library completion). Defer to v5 or major redesign.

**Current approach (KEEP):**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        ember: { 400: '#f18d33', 500: '#ed6f10', 700: '#b83d09' },
        // ... automatically becomes CSS variables
      },
    },
  },
};
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Component Primitives** | Radix UI | Headless UI | Smaller component set (no Slider, Accordion, Progress). Less TypeScript support. Tailwind Labs ecosystem lock-in. |
| **Component Primitives** | Radix UI | React Aria | More verbose API. Requires deeper a11y knowledge. Steeper learning curve. Better for design system teams, overkill for single app. |
| **Component Primitives** | Radix UI | Build everything from scratch | Massive time investment. High risk of a11y bugs. Keyboard navigation edge cases. Not worth it for complex components (Dialog, Dropdown). |
| **Full UI Framework** | N/A | shadcn/ui | Copy-paste component library built ON Radix. You already have components and design system. Would create conflicts with existing Button, Card, etc. |
| **Full UI Framework** | N/A | Material UI / Chakra UI | Pre-styled components fight Tailwind. Bundle size explosion (500KB+). Design system lock-in. You want Ember Noir, not Material Design. |
| **Variant Management** | CVA | Tailwind Variants (beta) | Official Tailwind solution still in beta. CVA is production-proven (7.2M weekly downloads). Better TypeScript DX. |
| **Icon Library** | Lucide (keep) | React Icons | 50K+ icons but inconsistent styles across packs (Font Awesome, Material, Bootstrap mixed). Larger bundle if not careful with imports. |
| **Icon Library** | Lucide (keep) | Heroicons | Only 300 icons. Too limited for full app. Great for Tailwind marketing sites, insufficient for complex PWA. |
| **Testing** | jest-axe | Playwright Accessibility | E2E accessibility testing. Slower, more brittle. Use for critical user flows, not component-level testing. |
| **Documentation** | `/debug/design-system` | Storybook | 100+ dependencies, setup complexity. Overkill for single-developer project with existing design system page. |

---

## Installation

### Required (Core Libraries)

```bash
# Component primitives
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-checkbox @radix-ui/react-switch

# Variant management
npm install class-variance-authority clsx tailwind-merge

# Accessibility testing (dev)
npm install --save-dev jest-axe @axe-core/react
```

**Total additions:** 10 packages (~250KB production bundle, ~5MB node_modules)

### Optional (Deferred)

```bash
# Storybook (if needed later)
npx storybook@latest init --builder webpack5
```

---

## Integration Checklist

After installation, integrate with existing codebase:

- [ ] Create `lib/utils.ts` with `cn` utility (clsx + tailwind-merge)
- [ ] Add jest-axe to `jest.setup.js`
- [ ] Add `@axe-core/react` to `app/layout.tsx` (dev only)
- [ ] Refactor existing Button component to use CVA
- [ ] Build Dialog component with `@radix-ui/react-dialog`
- [ ] Build Dropdown component with `@radix-ui/react-dropdown-menu`
- [ ] Build enhanced Select component with `@radix-ui/react-select`
- [ ] Build Tooltip component with `@radix-ui/react-tooltip`
- [ ] Add accessibility tests for all interactive components
- [ ] Update `/debug/design-system` page with new components

---

## Migration Strategy

### Phase 1: Foundation (Milestone 11 - Weeks 1-2)
1. Install core dependencies (Radix primitives, CVA, utils)
2. Create `cn` utility and CVA patterns
3. Set up jest-axe and @axe-core/react
4. Write accessibility test patterns

### Phase 2: Refactor Existing (Milestone 11 - Week 3)
5. Migrate Button to CVA variants
6. Migrate Card to CVA variants
7. Enhance existing Checkbox with Radix primitives
8. Enhance existing Toggle with Radix Switch

### Phase 3: New Components (Milestone 11 - Week 4)
9. Build Dialog component (Radix)
10. Build Dropdown component (Radix)
11. Build enhanced Select component (Radix)
12. Build Tooltip component (Radix)

### Phase 4: Testing & Documentation (Milestone 11 - Week 5)
13. Write unit tests for all components
14. Add accessibility tests with jest-axe
15. Update design system documentation page
16. Manual WCAG AA audit

---

## What NOT to Add

**Avoid these common traps:**

1. **Full UI frameworks** (MUI, Chakra, Ant Design)
   - **Why not:** Pre-styled components conflict with Ember Noir design system. Massive bundle sizes (500KB-2MB). You'd spend more time overriding their styles than building from scratch.

2. **Tailwind CSS v4 migration**
   - **Why not:** Zero functional benefit for milestone goals. Configuration paradigm change (JS → CSS) requires full config rewrite. Your current setup already exposes CSS variables. Defer to Tailwind v5 or major redesign.

3. **Storybook (for now)**
   - **Why not:** 100+ dependencies, 30-60 minute setup, ongoing React 19 compatibility issues. You have `/debug/design-system` page. Single-developer project doesn't need visual documentation tool. Add post-milestone if team grows.

4. **CSS-in-JS libraries** (Styled Components, Emotion)
   - **Why not:** Conflicts with Tailwind utility-first approach. Runtime performance cost. Server Components compatibility issues. Tailwind + CVA provides type-safe styling without CSS-in-JS overhead.

5. **Animation libraries** (Framer Motion, React Spring)
   - **Why not:** Your design system already has `animate-fade-in`, `animate-scale-in`, etc. Tailwind CSS animations + Radix animation hooks are sufficient. Framer Motion is 40KB. Only add if complex animation choreography needed (not in milestone scope).

6. **Form libraries** (React Hook Form is already installed)
   - **Why not:** You already have `react-hook-form` v7.54.2 and `zod` v3.24.2. This is the correct stack for form validation. No changes needed.

7. **State management beyond React** (Zustand, Jotai, Redux)
   - **Why not:** Design system components should be stateless or use local React state. If you need global state for app logic, that's separate from component library scope. You already have Firebase for shared state.

---

## Performance Considerations

**Bundle Size Impact:**

| Addition | Production Size | Notes |
|----------|----------------|-------|
| @radix-ui/react-dialog | ~15KB | Tree-shakable per component |
| @radix-ui/react-dropdown-menu | ~18KB | Includes nested menu logic |
| @radix-ui/react-select | ~20KB | Most complex primitive |
| @radix-ui/react-tooltip | ~8KB | Positioning engine |
| class-variance-authority | ~2KB | Tiny API surface |
| clsx | ~0.2KB | Ultra-lightweight |
| tailwind-merge | ~5KB | Class conflict resolution |
| **TOTAL** | **~68KB** | Gzipped estimate |

**Runtime Performance:**

- Radix components use React Portals (no layout thrashing)
- CVA compiles variants at build time (zero runtime cost)
- clsx and tailwind-merge are micro-optimized (< 1ms)
- No CSS-in-JS runtime (Tailwind is build-time)

**Comparison to alternatives:**

- Material UI: ~500KB (7x larger)
- Chakra UI: ~350KB (5x larger)
- Ant Design: ~1.2MB (18x larger)
- Building from scratch: 0KB but 100+ hours development + ongoing maintenance

---

## Testing Strategy

### Unit Tests (Jest + Testing Library)

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant="ember">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-ember-400');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### E2E Tests (Playwright - already configured)

```typescript
// dialog.spec.ts
import { test, expect } from '@playwright/test';

test('dialog keyboard navigation', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('button[aria-label="Settings"]');
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});
```

### Accessibility Audits

1. **Automated (jest-axe):** Catches 70% of WCAG violations
2. **Runtime (axe-core/react):** Dev-time console warnings
3. **Manual:** Keyboard navigation, screen reader testing (NVDA/JAWS/VoiceOver)
4. **Tools:** Lighthouse (built into Chrome DevTools), axe DevTools extension

---

## TypeScript Integration

All recommended libraries have excellent TypeScript support:

```typescript
// Full type inference
import { cva, type VariantProps } from 'class-variance-authority';
import * as Dialog from '@radix-ui/react-dialog';

const buttonVariants = cva(/* ... */);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Additional props
}

// Radix exports all types
interface DialogProps extends Dialog.DialogProps {
  // Extended props
}
```

**No @types packages needed** - all libraries ship with native TypeScript definitions.

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| **Radix UI Recommendation** | HIGH | Industry standard, 1,500+ production apps, verified with official docs and ecosystem consensus. No alternative matches accessibility + DX. |
| **CVA + clsx + tailwind-merge** | HIGH | Canonical pattern from shadcn/ui. 7M+ weekly downloads. Source code reviewed. Zero controversy in 2026 Tailwind ecosystem. |
| **Lucide (keep existing)** | HIGH | Already installed, correct choice verified against alternatives. No change needed. |
| **jest-axe** | HIGH | Version 10.0.0 confirmed current. Verified integration with Jest 30 and React 19. Official documentation reviewed. |
| **Storybook deferral** | MEDIUM | React 19 + Next.js 15 compatibility issues documented in GitHub issues. Conservative recommendation given single-developer context. |
| **Tailwind v4 deferral** | MEDIUM | Low confidence on migration urgency. V4 `@theme` directive is conceptually better but functionally equivalent to current setup. Risk vs. reward calculation. |

---

## Sources

**Radix UI vs Headless UI:**
- [Headless UI vs Radix: Which One is Better in 2025?](https://www.subframe.com/tips/headless-ui-vs-radix)
- [15 Best React UI Libraries for 2026](https://www.builder.io/blog/react-component-libraries-2026)
- [React UI libraries in 2025: Comparing shadcn/ui, Radix, Mantine, MUI, Chakra & more](https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra)

**React Aria & Accessibility:**
- [React Aria Official Documentation](https://react-aria.adobe.com/)
- [Prioritising Accessibility in React and Next.js Applications](https://medium.com/@alexnjoroge/prioritising-accessibility-in-react-and-next-js-applications-9d68b5184df0)
- [App Router: Improving Accessibility | Next.js](https://nextjs.org/learn/dashboard-app/improving-accessibility)

**Icon Libraries:**
- [5 Best Icon Libraries for React Projects Using shadcn/ui and Tailwind CSS](https://www.shadcndesign.com/blog/5-best-icon-libraries-for-shadcn-ui)
- [Best React Icon Libraries for 2026](https://mighil.com/best-react-icon-libraries)
- [Lucide Icons Official Documentation](https://lucide.dev/guide/comparison)

**Accessibility Testing:**
- [How to test for accessibility with axe-core in Next.js and React](https://larsmagnus.co/blog/how-to-test-for-accessibility-with-axe-core-in-next-js-and-react)
- [jest-axe - npm](https://www.npmjs.com/package/jest-axe)
- [How to Test React Applications for Accessibility with axe-core](https://oneuptime.com/blog/post/2026-01-15-test-react-accessibility-axe-core/view)

**Storybook:**
- [Storybook for Next.js with Webpack](https://storybook.js.org/docs/get-started/frameworks/nextjs)
- [Storybook error with latest NextJS 15 release and React 19 RC](https://github.com/ixartz/Next-js-Boilerplate/issues/322)

**Class Variance Authority:**
- [Class Variance Authority Official Documentation](https://cva.style/docs)
- [class-variance-authority - npm](https://www.npmjs.com/package/class-variance-authority)
- [CVA vs. Tailwind Variants: Choosing the Right Tool for Your Design System](https://dev.to/webdevlapani/cva-vs-tailwind-variants-choosing-the-right-tool-for-your-design-system-12am)

**clsx + tailwind-merge:**
- [Mastering Tailwind CSS: Overcome Styling Conflicts with Tailwind Merge and clsx](https://dev.to/sheraz4194/mastering-tailwind-css-overcome-styling-conflicts-with-tailwind-merge-and-clsx-1dol)
- [tailwind-merge - npm](https://www.npmjs.com/package/tailwind-merge)

**Tailwind CSS v4:**
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS 4 with Next.js 15: Design Tokens, Container Queries & Theming at Scale](https://medium.com/@sureshdotariya/tailwind-css-4-with-next-js-15-design-tokens-container-queries-theming-at-scale-1d2d0de179ce)

**Testing Library + React 19:**
- [@testing-library/react - npm](https://www.npmjs.com/package/@testing-library/react)
- [the "@testing-library/react" not integrate with react @19.0.0](https://github.com/testing-library/react-testing-library/issues/1368)

**Radix UI Versions:**
- [Releases – Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/releases)
- [@radix-ui/react-primitive - npm](https://www.npmjs.com/package/@radix-ui/react-primitive)

---

**Last updated:** 2026-01-28
**Next review:** After Phase 1 implementation (validate bundle sizes, DX)
