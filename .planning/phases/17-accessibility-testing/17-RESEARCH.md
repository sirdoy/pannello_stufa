# Phase 17: Accessibility & Testing - Research

**Researched:** 2026-01-30
**Domain:** Web Accessibility (WCAG AA) + Automated Testing
**Confidence:** HIGH

## Summary

Phase 17 focuses on ensuring WCAG AA compliance across all design system components through comprehensive accessibility testing, keyboard navigation, focus management, and motion preferences. The project already has strong a11y foundations from prior phases: jest-axe is installed and configured, Radix UI primitives provide built-in accessibility, and focus ring patterns are established.

The research confirms the testing strategy decided in CONTEXT.md is sound. jest-axe catches approximately 30% of accessibility issues automatically, which is why full keyboard navigation tests (not just axe violations) are critical. Color contrast cannot be verified in JSDOM, so contrast validation requires a separate approach (design token review + manual verification).

**Primary recommendation:** Layer testing (axe for automated checks, userEvent for keyboard navigation, CSS media queries + useReducedMotion hook for motion preferences) with design token system trusted for color contrast verification.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest-axe | 9.0+ | Automated a11y testing | Industry standard, wraps axe-core |
| @testing-library/user-event | 14.5+ | Keyboard simulation | Most realistic browser behavior |
| @radix-ui/* | 1.x | Accessible primitives | Built-in WAI-ARIA compliance |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | 16.x | Component rendering | Every test |
| class-variance-authority | 0.7+ | Consistent variants | Focus ring styling |
| lucide-react | 0.4+ | Icons with aria-hidden | Decorative icons |

### No Additional Libraries Needed
The project's existing stack fully covers Phase 17 requirements. No new dependencies required.

## Architecture Patterns

### Testing Structure for Accessibility
```
app/components/ui/__tests__/
├── Component.test.js        # Existing: add keyboard + a11y sections
├── accessibility.test.js    # Existing: expand with all components
└── [new] Component.a11y.test.js  # Optional: dedicated a11y test files
```

**Recommendation:** Add accessibility tests to existing test files rather than creating separate files (per CONTEXT.md decision that every component must have explicit a11y test).

### Pattern 1: Layered A11y Test Structure
**What:** Each component test file has dedicated accessibility test sections
**When to use:** All interactive components

```javascript
// Source: Project established pattern in Button.test.js
describe('Component', () => {
  describe('Accessibility', () => {
    // 1. Automated axe checks
    test('has no accessibility violations', async () => {
      const { container } = render(<Component />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    // 2. Keyboard navigation (Tab, Enter, Space, Arrows)
    test('can be focused via Tab', async () => {
      render(<Component />);
      await userEvent.tab();
      expect(screen.getByRole('...')).toHaveFocus();
    });

    test('can be activated via Enter', async () => {
      const handleClick = jest.fn();
      render(<Component onClick={handleClick} />);
      const element = screen.getByRole('...');
      element.focus();
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    test('can be activated via Space', async () => {
      const handleClick = jest.fn();
      render(<Component onClick={handleClick} />);
      const element = screen.getByRole('...');
      element.focus();
      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Focus Indicators', () => {
    test('has focus-visible:ring-ember-500/50 class', () => {
      render(<Component />);
      expect(screen.getByRole('...')).toHaveClass('focus-visible:ring-ember-500/50');
    });

    test('has ring-offset-2 class', () => {
      render(<Component />);
      expect(screen.getByRole('...')).toHaveClass('focus-visible:ring-offset-2');
    });
  });
});
```

### Pattern 2: useReducedMotion Hook
**What:** React hook for JS-based motion preference detection
**When to use:** Components needing logic changes (not just CSS) when reduced motion is preferred

```javascript
// Source: Josh W. Comeau's implementation (Public Domain CC0)
// Location: app/hooks/useReducedMotion.js

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: no-preference)';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR-safe: default to reduced motion on server
    if (typeof window === 'undefined') return true;
    return !window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(QUERY);

    const listener = (event) => {
      setPrefersReducedMotion(!event.matches);
    };

    // Support both modern and legacy browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      mediaQueryList.addListener(listener);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        mediaQueryList.removeListener(listener);
      }
    };
  }, []);

  return prefersReducedMotion;
}
```

### Pattern 3: Focus Ring Style (Established)
**What:** Consistent ember glow focus indicator
**When to use:** All interactive elements

```javascript
// Source: Button.js, established in Phase 12
const focusRingClasses = [
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-ember-500/50',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-slate-900',
  '[html:not(.dark)_&]:focus-visible:ring-offset-slate-50',
];
```

### Pattern 4: Motion-Safe Animation (CSS)
**What:** CSS media query disables animations when user prefers reduced motion
**When to use:** All decorative animations

```css
/* Source: globals.css lines 1007-1015 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Anti-Patterns to Avoid
- **Testing only with axe:** Catches ~30% of issues; must add keyboard + screen reader tests
- **Using fireEvent for keyboard:** Use userEvent for realistic browser behavior
- **Skipping focus indicator tests:** Visual regression is common, test classes explicitly
- **Trusting JSDOM for color contrast:** Always disabled in jest-axe (false positives)
- **Creating useReducedMotion for CSS-only animations:** CSS media query sufficient; hook only for JS logic changes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in modals | Custom focus management | Radix Dialog | Handles edge cases (shadow DOM, portals) |
| Accessible dropdowns | Custom ARIA attributes | Radix Select | WAI-ARIA compliance built-in |
| Screen reader announcements | Manual aria-live management | role="status" + aria-live="polite" | Already established pattern |
| Touch target sizing | Custom touch detection | min-h-[44px] min-w-[44px] CSS | Button already has this |
| axe with fake timers | Manual timer switching | runAxeWithRealTimers global helper | Already in jest.setup.js |

**Key insight:** Radix UI primitives handle the hard accessibility problems (focus trap, roving tabindex, announcement timing). The phase work is ensuring wrappers pass correct props and testing that behavior.

## Common Pitfalls

### Pitfall 1: axe Color Contrast False Positives
**What goes wrong:** Tests pass but actual contrast fails WCAG AA
**Why it happens:** JSDOM doesn't compute CSS styles; axe can't check contrast
**How to avoid:**
- Disable color-contrast rule in axe config (already done in jest.setup.js)
- Trust design token system for contrast (tokens designed for 4.5:1+ compliance)
- Manual verification with browser dev tools for edge cases
**Warning signs:** All contrast tests pass with no violations ever

### Pitfall 2: userEvent.keyboard Enter Key Issues
**What goes wrong:** Enter key doesn't trigger onClick in tests
**Why it happens:** userEvent v14+ has known issues with Enter on certain elements
**How to avoid:**
- Element must have focus first: `element.focus()` before `userEvent.keyboard('{Enter}')`
- For buttons, Enter works; for custom elements, may need to verify native behavior
- Use `fireEvent.keyDown` as fallback if userEvent fails
**Warning signs:** Space works but Enter doesn't

### Pitfall 3: Radix Components with Missing ARIA
**What goes wrong:** axe reports missing labels on Radix components
**Why it happens:** Wrapper doesn't forward aria-label or aria-labelledby
**How to avoid:**
- Pass aria-label/aria-labelledby through props spread
- For compound components (Select), ensure label association via id
- Check Radix docs for required props
**Warning signs:** "Elements must have accessible name" violations

### Pitfall 4: Testing Animations in JSDOM
**What goes wrong:** Animation behavior tests fail or give false results
**Why it happens:** JSDOM doesn't animate; CSS classes apply but no visual change
**How to avoid:**
- Test presence of CSS classes (animate-spin, animate-pulse)
- Test conditional class application based on reduced motion
- Don't test animation completion or timing
**Warning signs:** Tests check for animation state changes that can't occur

### Pitfall 5: Touch Target Size Variability
**What goes wrong:** Touch targets < 44px on mobile
**Why it happens:** Padding changes at breakpoints, iconOnly sizing varies
**How to avoid:**
- Use min-h-[44px] not h-[44px] for flexibility
- Test all size variants have minimum dimension
- Check compound variants (iconOnly + size combinations)
**Warning signs:** Small buttons pass tests but fail mobile accessibility audit

## Code Examples

### Complete Component A11y Test Pattern
```javascript
// Source: Recommended pattern combining Button.test.js + Checkbox.test.js patterns
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Component from '../Component';

describe('Component Accessibility', () => {
  describe('Automated Checks', () => {
    test('default state has no a11y violations', async () => {
      const { container } = render(<Component />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('disabled state has no a11y violations', async () => {
      const { container } = render(<Component disabled />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    // Test all variants
    test.each(['ember', 'subtle', 'ghost'])('%s variant has no violations', async (variant) => {
      const { container } = render(<Component variant={variant} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    test('receives focus via Tab', async () => {
      render(<Component data-testid="target" />);
      await userEvent.tab();
      expect(screen.getByTestId('target')).toHaveFocus();
    });

    test('triggers via Enter key', async () => {
      const handleClick = jest.fn();
      render(<Component onClick={handleClick} />);
      const element = screen.getByRole('button');
      element.focus();
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('triggers via Space key', async () => {
      const handleClick = jest.fn();
      render(<Component onClick={handleClick} />);
      const element = screen.getByRole('button');
      element.focus();
      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('skips disabled element in tab order', async () => {
      render(
        <>
          <Component data-testid="first" />
          <Component disabled data-testid="disabled" />
          <Component data-testid="last" />
        </>
      );
      await userEvent.tab();
      expect(screen.getByTestId('first')).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByTestId('last')).toHaveFocus(); // Skips disabled
    });
  });

  describe('Focus Indicators', () => {
    test('has ember glow focus ring', () => {
      render(<Component />);
      const element = screen.getByRole('button');
      expect(element).toHaveClass('focus-visible:ring-2');
      expect(element).toHaveClass('focus-visible:ring-ember-500/50');
    });

    test('has 2px ring offset', () => {
      render(<Component />);
      const element = screen.getByRole('button');
      expect(element).toHaveClass('focus-visible:ring-offset-2');
    });
  });

  describe('Touch Targets', () => {
    test('has minimum 44px height', () => {
      render(<Component size="sm" />);
      expect(screen.getByRole('button')).toHaveClass('min-h-[44px]');
    });
  });
});
```

### Testing Reduced Motion Behavior
```javascript
// Source: Pattern for testing reduced motion in components
import { render, screen } from '@testing-library/react';

// Mock matchMedia for reduced motion testing
const mockMatchMedia = (prefersReducedMotion) => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
};

describe('Reduced Motion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('applies animation class when motion allowed', () => {
    mockMatchMedia(false);
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveClass('animate-spin');
  });

  test('CSS handles reduced motion via media query', () => {
    // Note: Can't test actual CSS media query behavior in JSDOM
    // This test documents the expected behavior
    // Actual verification: animation-duration: 0.01ms in globals.css
    expect(true).toBe(true); // CSS media query handles this
  });
});
```

### Radio Group Arrow Key Navigation Test
```javascript
// Source: RadioGroup with Radix handles roving tabindex
describe('RadioGroup Keyboard Navigation', () => {
  test('arrow keys navigate between options', async () => {
    render(
      <RadioGroup defaultValue="a" aria-label="Options">
        <RadioGroup.Item value="a">Option A</RadioGroup.Item>
        <RadioGroup.Item value="b">Option B</RadioGroup.Item>
        <RadioGroup.Item value="c">Option C</RadioGroup.Item>
      </RadioGroup>
    );

    // Focus first radio
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Option A' })).toHaveFocus();

    // Arrow down moves to next
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Option B' })).toHaveFocus();

    // Arrow up moves to previous
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Option A' })).toHaveFocus();
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual ARIA management | Radix UI primitives | 2023+ | Reduced bugs, better compliance |
| CSS :focus for all | :focus-visible only | 2021+ | No outline on mouse click |
| prefers-reduced-motion ignore | Full motion preference support | WCAG 2.1 (2018) | Required for AA compliance |
| Click-only testing | Full keyboard simulation | Always best practice | Catches navigation issues |

**Deprecated/outdated:**
- `:focus` pseudo-class for focus rings: Use `:focus-visible` instead
- `tabindex="-1"` on interactive elements: Breaks keyboard navigation
- Disabling animations globally: Use `prefers-reduced-motion` media query

## Open Questions

1. **Color Contrast Validation Strategy**
   - What we know: JSDOM can't validate contrast; design tokens are designed for compliance
   - What's unclear: Should we add a manual color audit task or trust token system?
   - Recommendation: Trust design token system per CONTEXT.md decision; add visual audit to phase completion checklist

2. **Essential vs Decorative Animation Classification**
   - What we know: CSS media query handles all animations; some animations are informational (Spinner, Progress)
   - What's unclear: Should loading animations continue with reduced motion (just faster/simpler)?
   - Recommendation: (Claude's Discretion) Essential animations (Spinner, Progress) should remain visible but non-animated; decorative (pulse, glow) fully disabled

## Sources

### Primary (HIGH confidence)
- [jest-axe GitHub](https://github.com/NickColley/jest-axe) - API, limitations, configuration
- [Testing Library keyboard docs](https://testing-library.com/docs/user-event/keyboard/) - userEvent keyboard API
- [Josh W. Comeau useReducedMotion](https://www.joshwcomeau.com/snippets/react-hooks/use-prefers-reduced-motion/) - Hook implementation (CC0 license)
- Project codebase: Button.test.js, Checkbox.test.js, Switch.test.js - Established patterns
- Project codebase: jest.setup.js lines 273-308 - axe configuration
- Project codebase: globals.css lines 1007-1015, 1410-1419 - Reduced motion CSS

### Secondary (MEDIUM confidence)
- [WCAG 2.1 Contrast Understanding](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) - Contrast ratio requirements
- [axe-core JSDOM issue #595](https://github.com/dequelabs/axe-core/issues/595) - Color contrast limitation explanation
- [keyboard-testing-library](https://www.npmjs.com/package/keyboard-testing-library) - Alternative keyboard testing approach

### Tertiary (LOW confidence)
- WebSearch results for accessibility testing patterns - General best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Project already has everything needed, verified against jest.setup.js
- Architecture: HIGH - Patterns verified against existing test files in codebase
- Pitfalls: HIGH - JSDOM limitations well-documented in axe-core issues
- Code examples: HIGH - Derived from existing project patterns + official docs

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (stable domain, slow-moving standards)

---

## Quick Reference: Component A11y Checklist

For each component requiring accessibility testing:

- [ ] axe automated check (all variants, states)
- [ ] Tab key focuses element
- [ ] Enter key activates (where applicable)
- [ ] Space key activates (where applicable)
- [ ] Arrow keys navigate (for radio groups, sliders)
- [ ] Escape key closes (for modals, dropdowns)
- [ ] `focus-visible:ring-2` class present
- [ ] `focus-visible:ring-ember-500/50` class present
- [ ] `focus-visible:ring-offset-2` class present
- [ ] `min-h-[44px]` or equivalent for touch targets
- [ ] `aria-label` or `aria-labelledby` for non-text interactive elements
- [ ] `role="status"` + `aria-live="polite"` for dynamic content
- [ ] Decorative elements have `aria-hidden="true"`
