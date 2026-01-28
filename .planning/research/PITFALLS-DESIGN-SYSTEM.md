# Design System Implementation Pitfalls

**Domain:** Design System Refactoring for Existing Application
**Researched:** 2026-01-28
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Partial Component Adoption - Inconsistent Design System Usage

**What goes wrong:**
Some pages use the new component library, others still use inline styles or old components. Design system components exist but developers create one-off variants instead of using them. Half the app looks consistent (new design system), half looks old. New features revert to old patterns because developers don't know components exist. After 6 months, only 40% of UI uses the design system.

**Why it happens:**
- No enforcement mechanism - developers can bypass component library
- Components not discoverable - hidden in folders, no documentation
- Component API too rigid - developers find it easier to write custom HTML
- Missing edge cases - component doesn't support needed variant, so developers fork it
- Lack of training - team doesn't know what components exist or how to use them
- Storybook not integrated or outdated - developers don't see available components
- No code review process checking for design system violations
- Old components not deprecated/removed - easy to accidentally import old code

**How to avoid:**
1. **Create component catalog**: Storybook with all components documented (MUST have before refactoring)
2. **Deprecation strategy**: Add ESLint rules blocking imports from old component paths
3. **Migration tracker**: Track which pages use design system vs old code (spreadsheet or dashboard)
4. **Team training**: Dedicate 1-2 sessions showing component library usage
5. **Code review checklist**: Require design system usage for all UI changes
6. **Component coverage metric**: Measure % of pages using design system, set 80%+ goal
7. **Make it easy**: Components should be EASIER to use than writing custom CSS

**Warning signs:**
- New PRs contain CSS-in-JS or inline styles instead of component imports
- Multiple similar-looking but different button implementations across codebase
- Developers asking "how do I..." for patterns that components already solve
- Design inconsistencies between pages refactored at different times
- Storybook shows 30 components but `grep -r "import.*from.*components"` shows only 10 used
- Components exist but pages still have 500+ lines of custom CSS

**Prevention strategy:**
```javascript
// .eslintrc.js - Block old patterns
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [
        {
          "name": "styled-components",
          "message": "Use design system components from @/components instead"
        }
      ],
      "patterns": [
        {
          "group": ["**/old-components/**"],
          "message": "Old components deprecated. Use @/components/ui instead"
        }
      ]
    }],
    "no-restricted-syntax": ["error", {
      "selector": "JSXAttribute[name.name='style']",
      "message": "Inline styles prohibited. Use design system components with variant props"
    }]
  }
}

// Track adoption in each page
// lib/design-system/adoption-tracker.ts
export function trackComponentUsage() {
  return {
    totalPages: 73,
    pagesUsingDesignSystem: 28,
    adoptionRate: "38%",
    missingComponents: ["DataTable", "FileUpload", "Timeline"]
  };
}
```

**Phase to address:**
**Phase 1: Component Library Foundation** - Build Storybook, document all components
**Phase 3: Page Refactoring (Incremental)** - Track adoption, enforce via ESLint
**Phase 4: Cleanup & Deprecation** - Remove old components, ensure 80%+ adoption

---

### Pitfall 2: Component API Over-Engineering - The 847-Line Button Component

**What goes wrong:**
Simple Button component grows to 847 lines across 4 files with 35 props. Developers spend 30 minutes reading documentation to understand how to render a button. Component tries to handle every edge case: loading state, icons left/right/both, tooltips, badges, dropdown menus, confirmation dialogs. TypeScript autocomplete shows 50 prop options, overwhelming developers. Component becomes "framework" instead of building block.

**Why it happens:**
- "Future-proofing" - adding features "we might need"
- Each team requests customization → props added without removing anything
- Conflating multiple component responsibilities (Button + Dropdown + Tooltip)
- No abstraction limit - every variation becomes a new prop
- "Reusability" obsession - trying to make one component solve all button needs
- Premature optimization - abstracting before usage patterns emerge

**How to avoid:**
1. **Start minimal**: Build component for ONE actual use case, not hypothetical ones
2. **Composition over configuration**: Separate Button, IconButton, ButtonWithIcon components
3. **Prop limit rule**: Max 10 props per component (forces decomposition)
4. **YAGNI principle**: Only add features when 3+ real use cases exist
5. **Usage-driven design**: Build components AFTER seeing patterns, not before
6. **Regular refactoring**: If component >200 lines, split into smaller components
7. **Escape hatch**: Provide `className` prop for one-off customizations

**Warning signs:**
- Component file >200 lines or >15 props
- Developers saying "I don't know which props to use"
- Props with names like `enableAdvancedMode` or `legacyBehavior`
- Conditional logic nested 4+ levels deep
- Component used in only 2 places but supports 20 variations
- Documentation longer than implementation code

**Prevention strategy:**
```typescript
// WRONG - Over-engineered Button
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'success' | 'warning' | 'info';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  loadingText?: string;
  tooltip?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  badge?: string;
  badgeColor?: string;
  asChild?: boolean;
  fullWidth?: boolean;
  // ...30 more props
}

// RIGHT - Minimal, composable
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: ReactNode;
  className?: string; // Escape hatch
  onClick?: () => void;
}

// Separate concern into composition
<Button variant="primary">
  <Icon name="plus" />
  Add Item
</Button>

// Not configuration hell
<Button
  leftIcon={<PlusIcon />}
  variant="primary"
  size="md"
  tooltip="Add new item"
  tooltipPlacement="bottom"
>
  Add Item
</Button>
```

**Phase to address:**
**Phase 1: Component Library Foundation** - Establish prop limit and composition patterns
**Phase 2: Component Design Review** - Review each component for over-engineering before building

---

### Pitfall 3: Accessibility Regressions - Missing ARIA, Keyboard Nav, Focus Management

**What goes wrong:**
Old code had proper semantic HTML (`<button>`), new design system uses `<div onClick>`. Keyboard users can't navigate modal dialogs (no focus trap). Screen readers announce "button button" (double-announcement). Color contrast fails WCAG AA (3.2:1 instead of 4.5:1). Focus indicators removed "for aesthetics". Tab order broken in complex forms.

**Why it happens:**
- Accessibility treated as "polish" phase (never happens)
- Copying visual design without semantic HTML underneath
- Using `div` + `onClick` instead of `button` for custom styling
- No accessibility testing during component development
- Automated tools only catch 30% of issues - manual testing skipped
- Dark mode color tokens not contrast-tested
- Developers don't use keyboard or screen readers during testing

**How to avoid:**
1. **Semantic HTML first**: Use `<button>`, `<input>`, `<select>` - don't recreate with divs
2. **WCAG AA checklist**: Every component must pass before merging
3. **Keyboard testing**: Tab through every component, verify all interactions work
4. **Focus management**: Modals trap focus, dropdown menus have arrow key nav
5. **ARIA attributes**: Proper `aria-label`, `aria-describedby`, `role` attributes
6. **Contrast checking**: All text/background combos ≥4.5:1 (AA) or ≥7:1 (AAA)
7. **Automated + manual**: Run axe-core AND test with screen reader (NVDA/VoiceOver)

**Warning signs:**
- Lighthouse accessibility score <90
- Can't tab to interactive elements
- Screen reader announces component incorrectly
- Color picker shows contrast ratio <4.5:1
- Focus indicator invisible in dark mode
- Modal backdrop clickable but doesn't close modal (focus trap broken)
- Users with disabilities reporting issues

**Prevention strategy:**
```typescript
// WRONG - Not accessible
function Button({ children, onClick }) {
  return (
    <div className="button" onClick={onClick}>
      {children}
    </div>
  );
}

// RIGHT - Accessible by default
function Button({ children, onClick, disabled, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="button"
    >
      {children}
    </button>
  );
}

// Focus trap for modals
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    }

    firstElement?.focus();
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  );
}
```

**Phase to address:**
**Phase 1: Component Library Foundation** - Build accessibility testing into component creation
**Phase 2: Accessibility Audit** - Review all components with axe-core + manual testing
**Phase 3: Page Refactoring** - Ensure accessibility maintained during migration

---

### Pitfall 4: Dark Mode Token Mistakes - Hard-Coded Colors Breaking Theme Switching

**What goes wrong:**
Components look perfect in light mode, broken in dark mode (white text on white background). Dark mode implemented via `.dark` class but components use hard-coded hex values. Theme switching causes flash of unstyled content (FOUC). Some components respect theme, others don't (inconsistent). `#1a1a1a` hard-coded in 47 files - impossible to update design system colors.

**Why it happens:**
- Using hard-coded hex values (`#ffffff`) instead of CSS variables (`var(--color-bg)`)
- Adding dark mode as afterthought instead of designing with semantic tokens
- Not respecting `prefers-color-scheme` system preference
- Partial migration - some components use tokens, others use hex
- Legacy code mixed with new design system code
- Tailwind arbitrary values (`bg-[#1a1a1a]`) bypass design token system

**How to avoid:**
1. **Semantic design tokens**: Define colors as purpose, not value (`--color-bg-surface` not `--color-gray-100`)
2. **CSS variables for theming**: All colors from CSS custom properties, NEVER hard-coded
3. **Design tokens first**: Define complete token system BEFORE building components
4. **Respect system preference**: Use `prefers-color-scheme` + manual override
5. **Token coverage**: ESLint rule blocking hex values in components
6. **Contrast testing both themes**: Verify WCAG AA in light AND dark mode
7. **Document token usage**: Show which token for which purpose (bg, text, border)

**Warning signs:**
- `grep -r "#[0-9a-f]{6}" src/components` returns >20 results
- Components have `className="bg-white dark:bg-gray-900"` instead of semantic tokens
- Dark mode toggle doesn't affect all components
- Flash of light background when loading in dark mode
- Color contrast fails in dark mode but passes in light mode
- Design team changes brand color, requires updating 50+ files

**Prevention strategy:**
```css
/* WRONG - Hard-coded colors */
.button-primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.dark .button-primary {
  background-color: #2563eb;
  color: #f3f4f6;
}

/* RIGHT - Semantic tokens */
:root {
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --color-bg-surface: #ffffff;
  --color-text-primary: #1f2937;
}

[data-theme="dark"] {
  --color-primary: #2563eb;
  --color-primary-foreground: #f3f4f6;
  --color-bg-surface: #1a1a1a;
  --color-text-primary: #f3f4f6;
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}

/* Token definition in code */
// lib/design-tokens.ts
export const tokens = {
  color: {
    primary: 'hsl(var(--color-primary))',
    surface: 'hsl(var(--color-bg-surface))',
    text: {
      primary: 'hsl(var(--color-text-primary))',
      secondary: 'hsl(var(--color-text-secondary))',
    }
  }
};
```

**Phase to address:**
**Phase 1: Component Library Foundation** - Define complete token system, enforce usage
**Phase 2: Token Migration** - Replace all hard-coded colors with tokens
**Phase 3: Theme Testing** - Verify all components in light + dark mode

---

### Pitfall 5: Breaking Changes During Refactor - Functionality Regressions

**What goes wrong:**
Page refactored to use design system, but form submission breaks. Button click handler not wired correctly. Conditional rendering logic lost during migration. Accessibility features (ARIA labels) removed because not in new component. User settings page refactored, now can't save preferences. Critical functionality works in old code, broken in new design system version.

**Why it happens:**
- Focus on visual appearance, ignore behavioral logic
- Copy-paste component without understanding existing event handlers
- Removing "extra" code that was actually critical (defensive coding removed)
- No tests for existing functionality before refactoring
- Refactoring too many things at once - can't isolate breaking change
- Not preserving data attributes, IDs used for testing/analytics
- Assuming old code was "wrong" and rewriting from scratch

**How to avoid:**
1. **Test coverage FIRST**: Write tests for existing behavior BEFORE refactoring
2. **Visual regression testing**: Screenshot old page, compare with new (Chromatic/Percy)
3. **Incremental migration**: Refactor one component at a time, test between changes
4. **Feature parity checklist**: Document ALL features on old page, verify on new
5. **Preserve behavior**: Keep same event handlers, validation, error handling
6. **User testing**: Have users test refactored pages before deploying
7. **Rollback plan**: Feature flag to switch between old/new implementation

**Warning signs:**
- Users reporting "X stopped working after update"
- Test coverage decreases during refactor (old tests deleted, new ones not written)
- QA finds critical bugs in refactored pages
- Analytics show drop in conversion/engagement on refactored pages
- Error monitoring shows new exceptions after deployment
- Form submissions failing silently (no error shown to user)

**Prevention strategy:**
```typescript
// BEFORE refactoring - Document existing behavior
/**
 * Settings Page - Feature Inventory
 *
 * Features to preserve:
 * - [ ] Save notification preferences (push, email, SMS)
 * - [ ] Temperature unit toggle (C/F)
 * - [ ] Theme selection (light/dark/auto)
 * - [ ] Language selector
 * - [ ] Export data button (downloads JSON)
 * - [ ] Delete account (confirmation modal)
 * - [ ] Form validation (email format, required fields)
 * - [ ] Unsaved changes warning
 * - [ ] Success toast after save
 * - [ ] Error handling for network failures
 *
 * Data attributes for analytics:
 * - data-testid="settings-save-button"
 * - data-analytics="user-preferences-updated"
 */

// Write tests BEFORE refactoring
describe('Settings Page - Pre-refactor behavior', () => {
  it('saves notification preferences', async () => {
    const { getByLabelText, getByText } = render(<SettingsPage />);

    const pushToggle = getByLabelText('Push Notifications');
    fireEvent.click(pushToggle);

    const saveButton = getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockFirebase.update).toHaveBeenCalledWith(
        'users/123/preferences',
        { pushNotifications: true }
      );
    });
  });

  // 10+ more tests covering all features
});

// AFTER refactoring - Same tests should pass
describe('Settings Page - Post-refactor behavior', () => {
  // Same test suite - verifies no regressions
});
```

**Phase to address:**
**Phase 2: Test Coverage Baseline** - Write tests for all pages BEFORE refactoring
**Phase 3: Page Refactoring** - Incremental migration with regression testing
**Phase 4: User Acceptance Testing** - Validate no functionality lost

---

### Pitfall 6: Performance Regressions - Bundle Bloat and Render Thrashing

**What goes wrong:**
Old page: 150KB bundle, new design system page: 450KB (3x larger). First Contentful Paint increases from 1.2s to 3.8s. Design system imports entire icon library (500 icons) when page uses 3. Component re-renders on every state change (no memoization). CSS-in-JS runtime adds 80KB to bundle. Lighthouse performance score drops from 95 to 62.

**Why it happens:**
- Importing entire component library instead of specific components
- No tree-shaking - bundler includes unused code
- CSS-in-JS runtime overhead (styled-components adds weight)
- Icon library not optimized - imports all icons instead of used ones
- No code splitting - design system loaded on every page
- Component library dependencies bloat (moment.js, lodash, etc.)
- Unnecessary re-renders due to inline object/function creation

**How to avoid:**
1. **Tree-shakeable exports**: Use named exports, not default export of everything
2. **Icon optimization**: Only import icons actually used (`import { CheckIcon } from 'icons/check'`)
3. **Code splitting**: Lazy load heavy components (modals, charts)
4. **Bundle analysis**: Run `next bundle-analyzer` before/after refactor
5. **Zero-runtime CSS**: Use Tailwind or CSS modules instead of CSS-in-JS
6. **Memoization**: Use `React.memo`, `useMemo`, `useCallback` for expensive components
7. **Performance budget**: Set max bundle size (e.g., 200KB), fail CI if exceeded

**Warning signs:**
- Webpack bundle size warnings during build
- Lighthouse performance score decreases
- Time to Interactive (TTI) increases
- Bundle analyzer shows duplicate dependencies
- `npm ls` shows multiple versions of same library
- Component renders 50 times per second (React DevTools Profiler)
- Mobile users report "app feels slow"

**Prevention strategy:**
```typescript
// WRONG - Imports entire library
import { Button, Input, Select, Modal, Dropdown, ... } from '@/components';
import * as Icons from 'lucide-react'; // 500 icons = 300KB

// RIGHT - Tree-shakeable imports
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CheckIcon, XIcon } from 'lucide-react'; // Only 2 icons = 2KB

// Lazy load heavy components
const DataTable = lazy(() => import('@/components/DataTable'));
const ChartWidget = lazy(() => import('@/components/ChartWidget'));

// Prevent unnecessary re-renders
const MemoizedCard = React.memo(Card, (prev, next) => {
  return prev.id === next.id && prev.data === next.data;
});

// Bundle size monitoring
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          designSystem: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'design-system',
            priority: 10,
          },
        },
      };
    }
    return config;
  },
};

// Performance budget in CI
// package.json
{
  "scripts": {
    "build": "next build",
    "analyze": "ANALYZE=true next build",
    "check-bundle": "bundlesize"
  },
  "bundlesize": [
    {
      "path": ".next/static/chunks/pages/*.js",
      "maxSize": "200 KB"
    }
  ]
}
```

**Phase to address:**
**Phase 1: Component Library Foundation** - Design for tree-shaking, measure baseline
**Phase 3: Page Refactoring** - Monitor bundle size, lazy load heavy components
**Phase 4: Performance Audit** - Verify no regressions, optimize where needed

---

### Pitfall 7: Documentation Debt - Components Exist But Nobody Knows How to Use Them

**What goes wrong:**
Design system has 30 components but no documentation. Developers ask in Slack "how do I make a modal?" (Modal component exists). Storybook exists but outdated - props don't match actual implementation. Component has 10 variants but no examples showing when to use each. New team member spends 2 days figuring out design system instead of building features. Knowledge locked in original developer's head.

**Why it happens:**
- "Code is self-documenting" mindset (it's not)
- Storybook created at start, never updated
- Component API changes but docs don't
- No time allocated for documentation (treated as optional)
- Examples show only happy path, not edge cases
- Missing accessibility guidance, usage patterns
- Documentation scattered (some in Storybook, some in Notion, some in Slack)

**How to avoid:**
1. **Storybook as single source of truth**: All components documented with live examples
2. **Props documentation**: Use JSDoc comments, auto-generate prop tables
3. **Multiple examples per component**: Show all variants, states, edge cases
4. **Accessibility notes**: Document ARIA usage, keyboard navigation
5. **Do's and Don'ts**: Show correct and incorrect usage
6. **Update docs in same PR**: Component changes MUST include doc updates
7. **Onboarding guide**: Step-by-step guide for new developers

**Warning signs:**
- Developers asking "does X component exist?" when it does
- Storybook shows 20 components but some don't render (broken examples)
- Props table in Storybook empty or incorrect
- No usage examples - just component in isolation
- Documentation last updated 6 months ago
- Multiple similar components built because developers didn't find existing one
- Code comments say "TODO: document this"

**Prevention strategy:**
```typescript
// Document components with JSDoc
/**
 * Button component for user actions
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * ```
 *
 * @param variant - Visual style: 'primary' (main actions), 'secondary' (less important), 'ghost' (subtle)
 * @param size - Size: 'sm' (compact), 'md' (default), 'lg' (prominent)
 * @param disabled - Disables interaction and shows disabled state
 *
 * Accessibility:
 * - Uses semantic <button> element
 * - Keyboard accessible (Enter/Space to activate)
 * - Focus indicator visible in all themes
 * - Disabled state announced to screen readers
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: ReactNode;
}

// Storybook stories showing all variants
// Button.stories.tsx
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Button component for user actions. Use primary for main CTAs, secondary for less important actions.',
      },
    },
  },
} as Meta;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Button variant="primary">
      <PlusIcon className="w-4 h-4 mr-2" />
      Add Item
    </Button>
  ),
};

export const DisabledState: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

// Usage guidelines in MDX
// Button.mdx
## When to use

- **Primary**: Main call-to-action (1 per page max)
- **Secondary**: Supporting actions
- **Ghost**: Tertiary actions, toolbar buttons

## Do's and Don'ts

✅ Use descriptive labels ("Save Changes" not "OK")
✅ Place primary button on right in forms
❌ Don't use multiple primary buttons on same page
❌ Don't use red for primary actions (reserved for destructive)
```

**Phase to address:**
**Phase 1: Component Library Foundation** - Create Storybook with comprehensive docs
**Phase 2: Documentation Review** - Verify all components documented before refactor starts
**Phase 4: Onboarding Guide** - Write guide for new developers

---

## Moderate Pitfalls

### Pitfall 8: Design-Developer Handoff Gaps - Missing Token Definitions

**What goes wrong:**
Designer creates beautiful mockups in Figma with specific colors/spacing. Developer implements with different values (8px instead of 12px padding). No single source of truth for design tokens. Figma shows 16px spacing, Tailwind uses `space-4` (16px), but component uses `gap-3` (12px). Colors slightly off (designer: `#3B82F6`, code: `#3B81F6`).

**Prevention:**
- Design tokens defined in code, synced to Figma via plugin
- Use Figma Variables for colors/spacing/typography
- Export design tokens to JSON, import into Tailwind config
- Automated checks: Compare Figma tokens vs code tokens in CI

**Phase to address:**
**Phase 1: Design Token Foundation** - Define tokens, sync Figma ↔ code

---

### Pitfall 9: Responsive Design Inconsistencies - Mobile Breakpoints Broken

**What goes wrong:**
Components look perfect on desktop (1920px), broken on mobile (375px). Responsive breakpoints not tested during component development. Some components use `sm:` breakpoint at 640px, others at 768px. Modal doesn't fit on small screens. Table doesn't scroll horizontally, cuts off columns.

**Prevention:**
- Test all components at 375px, 768px, 1024px, 1920px
- Consistent breakpoint system (Tailwind defaults or custom)
- Storybook viewport addon showing all breakpoints
- Mobile-first CSS (base = mobile, then scale up)

**Phase to address:**
**Phase 1: Component Library Foundation** - Define breakpoints, test responsiveness
**Phase 3: Page Refactoring** - Test refactored pages on mobile devices

---

### Pitfall 10: State Management Complexity - Props Drilling and Context Hell

**What goes wrong:**
Theme context, user context, notification context, 5 more contexts wrap every component. Component needs theme → import 3 contexts, destructure, merge. Props drilling 6 levels deep. Re-renders entire tree on theme change. Context consumers re-render unnecessarily.

**Prevention:**
- Limit contexts to 2-3 max (theme, user, notifications)
- Use composition instead of context where possible
- Memoize context values to prevent unnecessary re-renders
- Consider Zustand/Jotai for complex state instead of nested contexts

**Phase to address:**
**Phase 1: Component Library Foundation** - Design state management strategy upfront

---

## "Looks Done But Isn't" Checklist

- [ ] **Storybook exists**: Often incomplete or outdated - verify all components documented
- [ ] **Accessibility tested**: Often only automated - verify manual keyboard/screen reader testing
- [ ] **Dark mode working**: Often only tested in light mode - verify all components in dark theme
- [ ] **Performance measured**: Often assumed "good enough" - verify bundle size, render performance
- [ ] **ESLint rules enforcing**: Often configured but not failing builds - verify CI fails on violations
- [ ] **Tests written**: Often only unit tests - verify visual regression + integration tests
- [ ] **Migration complete**: Often 80% done - verify ALL pages using design system
- [ ] **Documentation current**: Often written at start, never updated - verify docs match code
- [ ] **Responsive tested**: Often only desktop - verify mobile/tablet breakpoints
- [ ] **Old code removed**: Often deprecated but not deleted - verify no dead code remaining

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip Storybook documentation | Save 2 hours per component | Knowledge loss, duplicated components | Never - docs are critical |
| Hard-code colors instead of tokens | Faster initial development | Can't change theme, dark mode broken | Never - tokens are foundational |
| Inline styles for "one-off" case | Quick fix for edge case | Design inconsistency, no maintainability | Prototypes only, never production |
| Skip accessibility testing | Ship feature faster | Legal risk, poor UX for disabled users | Never - a11y is requirement |
| Copy-paste component instead of fixing | Avoid breaking existing usage | Duplicate code, divergence | Temporary during migration only |
| Use CSS-in-JS for simplicity | Easier component scoping | Bundle size bloat, runtime cost | Never - use Tailwind/CSS modules |
| Skip visual regression tests | Faster test suite | Silent UI breakage | Early prototypes only |
| Partial design system adoption | Incremental progress | Inconsistent UI forever | Acceptable if tracked + time-boxed |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Importing entire icon library | 300KB+ bundle for 5 icons | Named imports only, tree-shaking | First production deploy |
| CSS-in-JS runtime overhead | 80KB styled-components bundle | Use Tailwind/CSS modules | Any scale |
| No code splitting | 500KB first load | Lazy load heavy components | Mobile users |
| Inline object/function props | Component re-renders 50x/sec | Memoize with useMemo/useCallback | Complex pages (10+ components) |
| Importing entire component library | All components in bundle | Named imports, barrel file optimization | First refactored page |
| No memoization in lists | List re-renders all items | React.memo, key optimization | Lists >20 items |
| Unoptimized images in components | Slow LCP, large bundles | Next.js Image component | Any page with images |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Unsanitized user content in components | XSS injection | Use DOMPurify, React escapes by default |
| Exposing sensitive data in Storybook | Leaked API keys, tokens | Use mock data in stories, not real credentials |
| No CSP for inline styles | XSS via style injection | Use CSS modules/Tailwind, strict CSP |
| Client-side only theme storage | FOUC, layout shift | Server-side theme detection, cookies |
| Overly permissive className prop | CSS injection attacks | Validate/sanitize className values |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| FOUC on theme load | Flash of wrong theme, jarring | Server-side theme detection, blocking script |
| Loading state missing | User clicks, nothing happens | Show loading indicator immediately |
| No error boundaries | White screen on component error | Wrap pages in error boundary with fallback UI |
| Inaccessible focus indicators | Keyboard users lost | Visible focus ring in all themes |
| Generic error messages | User doesn't know what to do | Specific, actionable error messages |
| No skeleton loaders | Empty screen during data fetch | Skeleton UI matching final layout |
| Inconsistent spacing | UI feels chaotic | Consistent spacing scale (4px, 8px, 16px) |

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Partial component adoption | HIGH | Create migration tracker, allocate 2-4 weeks cleanup sprint |
| Over-engineered components | MEDIUM | Refactor into smaller components, reduce prop count |
| Accessibility regressions | HIGH | Accessibility audit, manual testing, may need redesign |
| Dark mode broken | MEDIUM | Define token system, replace hard-coded colors (2-3 weeks) |
| Breaking changes deployed | HIGH | Rollback deployment, fix in dev, comprehensive testing |
| Performance regression | MEDIUM | Bundle analysis, lazy loading, code splitting |
| Documentation debt | MEDIUM | Allocate 1 week to document all components |
| Design-dev handoff gaps | LOW | Define tokens, sync Figma ↔ code (1-2 days) |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Partial component adoption | Phase 1: Foundation + Phase 4: Cleanup | Adoption tracker shows 80%+ usage |
| Component over-engineering | Phase 1: Foundation | All components <200 lines, <10 props |
| Accessibility regressions | Phase 1: Foundation + Phase 2: Audit | Lighthouse a11y score 100, manual testing passed |
| Dark mode token mistakes | Phase 1: Foundation | Zero hard-coded colors in components |
| Breaking changes during refactor | Phase 2: Test Coverage + Phase 3: Migration | All tests pass, visual regression clean |
| Performance regressions | Phase 1: Foundation + Phase 4: Audit | Bundle size within budget, Lighthouse >90 |
| Documentation debt | Phase 1: Foundation | All components in Storybook with examples |
| Design-dev handoff gaps | Phase 1: Foundation | Figma tokens === code tokens |
| Responsive inconsistencies | Phase 1: Foundation + Phase 3: Migration | All breakpoints tested in Storybook |
| State management complexity | Phase 1: Foundation | Max 3 contexts, no props drilling >3 levels |

## Sources

### Design System Adoption Failures (HIGH Confidence)
- [Increasing Design System Adoption: Part 1 - The Real Reasons Design Systems Fail to Get Adopted](https://figr.design/blog/why-design-systems-fail-to-get-adopted)
- [Design System Adoption Pitfalls](https://www.netguru.com/blog/design-system-adoption-pitfalls)
- [Design Systems in 2026: Predictions, Pitfalls, and Power Moves](https://rydarashid.medium.com/design-systems-in-2026-predictions-pitfalls-and-power-moves-f401317f7563)
- [Why Design Systems Fail | Knapsack](https://www.knapsack.cloud/blog/why-design-systems-fail)

### Component Library Best Practices (MEDIUM-HIGH Confidence)
- [Best Practices for Scalable Component Libraries | UXPin](https://www.uxpin.com/studio/blog/best-practices-for-scalable-component-libraries/)
- [Component API Design Guidelines](https://alanbsmith.medium.com/component-api-design-3ff378458511)
- [Component library ups and downs](https://medium.com/@simon_p_kerr/component-library-ups-and-downs-e12fb5dd8d9b)
- [Why Your Component Library Isn't Solving the Problems You Think It Is](https://medium.com/@owoseniabdulhamid/why-your-component-library-isnt-solving-the-problems-you-think-it-is-546491d43daa)

### Accessibility Standards (HIGH Confidence)
- [Hidden Web Accessibility Issues Most Designers Miss in 2026](https://www.netguru.com/blog/web-design-accessibility-mistakes)
- [Five Most Common Accessibility Errors in Software Design](https://www.wcag.com/blog/five-most-common-accessibility-errors-in-software-design-and-development/)
- [2026 WCAG & ADA Website Compliance Requirements](https://www.accessibility.works/blog/wcag-ada-website-compliance-standards-requirements/)
- [Accessibility in Design Systems: A Comprehensive Approach](https://www.supernova.io/blog/accessibility-in-design-systems-a-comprehensive-approach-through-documentation-and-assets)

### Dark Mode & Theming (MEDIUM-HIGH Confidence)
- [Dark Mode with Design Tokens in Tailwind CSS](https://www.richinfante.com/2024/10/21/tailwind-dark-mode-design-tokens-themes-css)
- [Why Dark Mode is Mandatory in 2026](https://www.sivadesigner.in/blog/dark-mode-evolution-modern-web-design/)
- [You don't know CSS: Dark Mode Theming with Design Tokens](https://medium.com/@brcsndr/you-dont-know-css-dark-mode-theming-and-swapping-with-css-and-design-tokens-ac1273936940)
- [Tailwind CSS Best Practices 2025-2026: Design Tokens](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)

### Performance Optimization (MEDIUM-HIGH Confidence)
- [Building the Ultimate Design System: Architecture Guide for 2026](https://medium.com/@padmacnu/building-the-ultimate-design-system-a-complete-architecture-guide-for-2026-6dfcab0e9999)
- [Angular vs. React vs. Vue.js: Performance guide for 2026](https://blog.logrocket.com/angular-vs-react-vs-vue-js-performance/)
- [Nuxt 4 Performance Optimization: Complete Guide 2026](https://masteringnuxt.com/blog/nuxt-4-performance-optimization-complete-guide-to-faster-apps-in-2026)

### Visual Regression Testing (MEDIUM Confidence)
- [Visual Regression Testing in Design Systems](https://sparkbox.com/foundry/design_system_visual_regression_testing)
- [Build trust in your design system with Visual Regression Testing](https://engineering.spendesk.com/posts/build-trust-with-visual-regression-testing/)
- [How to Implement Visual Regression Testing for React with Chromatic](https://oneuptime.com/blog/post/2026-01-15-visual-regression-testing-react-chromatic/view)
- [Visual testing and review for design systems - Chromatic](https://www.chromatic.com/solutions/design-systems)

### Documentation & Developer Experience (MEDIUM Confidence)
- [Common Design System Documentation Mistakes | UXPin](https://www.uxpin.com/studio/blog/common-design-system-documentation-mistakes/)
- [Should you document your design system in Storybook?](https://zeroheight.com/help/guides/should-you-document-your-design-system-in-storybook/)
- [4 ways to document your design system with Storybook](https://storybook.js.org/blog/4-ways-to-document-your-design-system-with-storybook/)
- [Top Storybook Documentation Examples](https://www.supernova.io/blog/top-storybook-documentation-examples-and-the-lessons-you-can-learn)

### Incremental Migration Strategies (MEDIUM Confidence)
- [Brownfield Approach: Incrementally Upgrading Existing Systems](https://www.momentslog.com/development/design-pattern/brownfield-approach-incrementally-upgrading-existing-systems)
- [Microservices: Strategies for Migration in a Brownfield Environment](https://medium.com/@rhettblanch_48135/microservices-strategies-for-migration-in-a-brownfield-environment-6c14335a8069)

### Refactoring Best Practices (MEDIUM Confidence)
- [7 Pitfalls to Avoid in Application Refactoring Projects](https://vfunction.com/blog/7-pitfalls-to-avoid-in-application-refactoring-projects/)
- [Good Refactoring vs Bad Refactoring](https://www.builder.io/blog/good-vs-bad-refactoring)
- [Main Challenges and Mistakes in Creating Your Design System](https://habr.com/en/companies/innotech/articles/704576/)

---

**Pitfalls research for:** Design System Implementation & Application Refactoring
**Researched:** 2026-01-28
**Confidence:** MEDIUM-HIGH (Design system patterns well-documented in recent 2025-2026 sources, accessibility standards verified with WCAG 2.2 requirements, performance optimization validated with framework-specific 2026 guides, some areas like specific component API design rely on general best practices rather than project-specific verification)
**Next step:** Use these pitfalls to inform design system roadmap phase structure, validation criteria, quality gates, and success metrics
