// app/components/ui/__tests__/Badge.test.js
/**
 * Badge Component Tests
 *
 * Tests CVA variants, pulse animation, icon rendering, and accessibility.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createRef } from 'react';
import Badge, { badgeVariants } from '../Badge';

expect.extend(toHaveNoViolations);

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders children text', () => {
      render(<Badge>Online</Badge>);
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <Badge icon={<span data-testid="test-icon">*</span>}>
          Status
        </Badge>
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('does not render icon wrapper when no icon provided', () => {
      const { container } = render(<Badge>No Icon</Badge>);
      // Should only have one span (the Badge itself)
      const spans = container.querySelectorAll('span');
      expect(spans).toHaveLength(1);
    });
  });

  describe('CVA Variants - Colors', () => {
    it('applies ember variant classes', () => {
      const { container } = render(<Badge variant="ember">Ember</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-ember-500/15');
      expect(badge).toHaveClass('border-ember-400/25');
      expect(badge).toHaveClass('text-ember-300');
    });

    it('applies sage variant classes', () => {
      const { container } = render(<Badge variant="sage">Sage</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-sage-500/15');
      expect(badge).toHaveClass('border-sage-400/25');
      expect(badge).toHaveClass('text-sage-300');
    });

    it('applies ocean variant classes', () => {
      const { container } = render(<Badge variant="ocean">Ocean</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-ocean-500/15');
      expect(badge).toHaveClass('border-ocean-400/25');
      expect(badge).toHaveClass('text-ocean-300');
    });

    it('applies warning variant classes', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-warning-500/15');
      expect(badge).toHaveClass('border-warning-400/25');
      expect(badge).toHaveClass('text-warning-300');
    });

    it('applies danger variant classes', () => {
      const { container } = render(<Badge variant="danger">Danger</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-danger-500/15');
      expect(badge).toHaveClass('border-danger-400/25');
      expect(badge).toHaveClass('text-danger-300');
    });

    it('applies neutral variant by default', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-slate-500/10');
      expect(badge).toHaveClass('border-slate-400/20');
      expect(badge).toHaveClass('text-slate-400');
    });
  });

  describe('CVA Variants - Sizes', () => {
    it('applies sm size variant', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('applies md size variant by default', () => {
      const { container } = render(<Badge>Medium</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });

    it('applies lg size variant', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('Pulse Animation', () => {
    it('applies animate-glow-pulse when pulse is true', () => {
      const { container } = render(<Badge pulse>Pulsing</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('animate-glow-pulse');
    });

    it('does not apply pulse class when pulse is false', () => {
      const { container } = render(<Badge pulse={false}>Not Pulsing</Badge>);
      const badge = container.firstChild;
      expect(badge).not.toHaveClass('animate-glow-pulse');
    });

    it('does not apply pulse class by default', () => {
      const { container } = render(<Badge>No Pulse</Badge>);
      const badge = container.firstChild;
      expect(badge).not.toHaveClass('animate-glow-pulse');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Badge className="custom-badge">Custom</Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveClass('custom-badge');
    });

    it('merges className with CVA classes', () => {
      const { container } = render(
        <Badge variant="ember" className="mt-4">Merged</Badge>
      );
      const badge = container.firstChild;
      // CVA classes
      expect(badge).toHaveClass('bg-ember-500/15');
      // Custom class
      expect(badge).toHaveClass('mt-4');
    });

    it('passes additional props to span element', () => {
      render(<Badge data-testid="badge-element">Props</Badge>);
      expect(screen.getByTestId('badge-element')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = createRef();
      render(<Badge ref={ref}>Ref Test</Badge>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('ref points to the span element', () => {
      const ref = createRef();
      render(<Badge ref={ref}>Ref Test</Badge>);
      expect(ref.current.tagName).toBe('SPAN');
      expect(ref.current).toHaveTextContent('Ref Test');
    });
  });

  describe('Base Classes', () => {
    it('always has base styling classes', () => {
      const { container } = render(<Badge>Base</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('gap-1.5');
      expect(badge).toHaveClass('font-display');
      expect(badge).toHaveClass('font-semibold');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('border');
      expect(badge).toHaveClass('transition-all');
      expect(badge).toHaveClass('duration-[var(--duration-fast)]');
    });
  });

  describe('Exports', () => {
    it('exports badgeVariants function', () => {
      expect(typeof badgeVariants).toBe('function');
    });

    it('badgeVariants returns string of classes', () => {
      const classes = badgeVariants({ variant: 'ember', size: 'sm' });
      expect(typeof classes).toBe('string');
      expect(classes).toContain('bg-ember-500/15');
      expect(classes).toContain('px-2');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with default props', async () => {
      const { container } = render(<Badge>Status</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with icon', async () => {
      const { container } = render(
        <Badge icon={<span aria-hidden="true">*</span>}>With Icon</Badge>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all variants', async () => {
      const variants = ['ember', 'sage', 'ocean', 'warning', 'danger', 'neutral'];

      for (const variant of variants) {
        const { container } = render(
          <Badge variant={variant}>{variant} Badge</Badge>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('has no accessibility violations with pulse animation', async () => {
      const { container } = render(
        <Badge variant="ember" pulse>Active Status</Badge>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    // Design token-based contrast documentation (A11Y-04)
    // Badge uses design tokens that ensure WCAG 2.1 AA contrast:
    // - ember: bg-ember-500/15 + text-ember-300 (contrast via semantic tokens)
    // - sage: bg-sage-500/15 + text-sage-300
    // - ocean: bg-ocean-500/15 + text-ocean-300
    // - warning: bg-warning-500/15 + text-warning-300
    // - danger: bg-danger-500/15 + text-danger-300
    // - neutral: bg-slate-500/10 + text-slate-400
    it('uses design token colors for contrast (ember variant)', () => {
      const { container } = render(<Badge variant="ember">Ember</Badge>);
      const badge = container.firstChild;
      // Design tokens ensure contrast via curated color combinations
      expect(badge).toHaveClass('bg-ember-500/15');
      expect(badge).toHaveClass('text-ember-300');
    });

    it('uses design token colors for contrast (neutral variant)', () => {
      const { container } = render(<Badge variant="neutral">Neutral</Badge>);
      const badge = container.firstChild;
      // Neutral uses slate tokens for consistent contrast
      expect(badge).toHaveClass('bg-slate-500/10');
      expect(badge).toHaveClass('text-slate-400');
    });

    // Decorative icons should have aria-hidden (A11Y-07)
    it('decorative icons should be marked aria-hidden', async () => {
      // When icons are purely decorative, they should have aria-hidden="true"
      // The icon is wrapped in a span, consumer should pass aria-hidden on icon
      const { container } = render(
        <Badge icon={<span aria-hidden="true" data-testid="icon">*</span>}>
          Status
        </Badge>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all sizes', async () => {
      const sizes = ['sm', 'md', 'lg'];
      for (const size of sizes) {
        const { container } = render(
          <Badge size={size}>{size} Badge</Badge>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('Icon Styling', () => {
    it('applies text-sm class to icon wrapper', () => {
      const { container } = render(
        <Badge icon={<span>I</span>}>Icon</Badge>
      );
      // Icon wrapper should have text-sm
      const iconWrapper = container.querySelector('span > span');
      expect(iconWrapper).toHaveClass('text-sm');
    });
  });
});
