// app/components/ui/__tests__/Heading.test.js
/**
 * Heading Component Tests
 *
 * Tests accessibility, CVA variants, sizes, and semantic HTML.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Heading, { headingVariants } from '../Heading';

expect.extend(toHaveNoViolations);

describe('Heading', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations for h1', async () => {
      const { container } = render(
        <Heading level={1}>Main Title</Heading>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations for h2', async () => {
      const { container } = render(
        <Heading level={2}>Section Title</Heading>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations for h3', async () => {
      const { container } = render(
        <Heading level={3}>Subsection Title</Heading>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations for h4-h6', async () => {
      const { container } = render(
        <div>
          <Heading level={4}>H4 Title</Heading>
          <Heading level={5}>H5 Title</Heading>
          <Heading level={6}>H6 Title</Heading>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with gradient variant', async () => {
      const { container } = render(
        <Heading level={1} variant="gradient">Gradient Title</Heading>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with all variants', async () => {
      const variants = ['default', 'gradient', 'subtle', 'ember', 'ocean', 'sage', 'warning', 'danger', 'info'] as const;
      const { container } = render(
        <div>
          {variants.map((variant, index) => (
            <Heading key={variant} level={2} variant={variant}>
              {variant} heading
            </Heading>
          ))}
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    // Semantic heading levels (A11Y-03: Semantic HTML)
    // Headings must render correct semantic level for document structure
    it('renders with heading role at correct level', () => {
      const { rerender } = render(<Heading level={1}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      rerender(<Heading level={2}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

      rerender(<Heading level={3}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();

      rerender(<Heading level={4}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();

      rerender(<Heading level={5}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 5 })).toBeInTheDocument();

      rerender(<Heading level={6}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 6 })).toBeInTheDocument();
    });

    // Design token contrast (A11Y-04)
    // Heading uses design tokens that ensure WCAG 2.1 AA contrast
    it('uses design token colors ensuring readable contrast', () => {
      render(<Heading variant="default">Default</Heading>);
      const heading = screen.getByRole('heading');
      // text-slate-100 on dark bg provides sufficient contrast
      expect(heading).toHaveClass('text-slate-100');
    });

    it('should have no a11y violations with all sizes', async () => {
      const sizes = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
      for (const size of sizes) {
        const { container } = render(
          <Heading size={size}>{size} Heading</Heading>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('Semantic HTML', () => {
    it('renders h1 when level=1', () => {
      render(<Heading level={1}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders h2 when level=2 (default)', () => {
      render(<Heading>Title</Heading>);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('renders h3 when level=3', () => {
      render(<Heading level={3}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('renders h4 when level=4', () => {
      render(<Heading level={4}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    });

    it('renders h5 when level=5', () => {
      render(<Heading level={5}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 5 })).toBeInTheDocument();
    });

    it('renders h6 when level=6', () => {
      render(<Heading level={6}>Title</Heading>);
      expect(screen.getByRole('heading', { level: 6 })).toBeInTheDocument();
    });
  });

  describe('CVA Variants', () => {
    it('applies default variant classes', () => {
      render(<Heading>Default</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-slate-100');
    });

    it('applies gradient variant classes', () => {
      render(<Heading variant="gradient">Gradient</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('bg-gradient-to-r');
      expect(heading).toHaveClass('from-ember-500');
      expect(heading).toHaveClass('to-flame-600');
      expect(heading).toHaveClass('bg-clip-text');
      expect(heading).toHaveClass('text-transparent');
    });

    it('applies subtle variant classes', () => {
      render(<Heading variant="subtle">Subtle</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-slate-400');
    });

    it('applies ember variant classes', () => {
      render(<Heading variant="ember">Ember</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-ember-400');
    });

    it('applies ocean variant classes', () => {
      render(<Heading variant="ocean">Ocean</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-ocean-300');
    });

    it('applies sage variant classes', () => {
      render(<Heading variant="sage">Sage</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-sage-400');
    });

    it('applies warning variant classes', () => {
      render(<Heading variant="warning">Warning</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-warning-400');
    });

    it('applies danger variant classes', () => {
      render(<Heading variant="danger">Danger</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-danger-400');
    });

    it('applies info variant classes', () => {
      render(<Heading variant="info">Info</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-ocean-300');
    });

    it('applies base classes to all variants', () => {
      render(<Heading>Title</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('font-bold');
      expect(heading).toHaveClass('font-display');
    });
  });

  describe('Size Auto-Calculation', () => {
    it('auto-calculates 3xl size for level 1', () => {
      render(<Heading level={1}>Title</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-3xl');
    });

    it('auto-calculates 2xl size for level 2', () => {
      render(<Heading level={2}>Title</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-2xl');
    });

    it('auto-calculates xl size for level 3', () => {
      render(<Heading level={3}>Title</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-xl');
    });

    it('auto-calculates lg size for level 4', () => {
      render(<Heading level={4}>Title</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-lg');
    });

    it('auto-calculates md (text-base) size for level 5', () => {
      render(<Heading level={5}>Title</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-base');
    });

    it('auto-calculates sm size for level 6', () => {
      render(<Heading level={6}>Title</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-sm');
    });
  });

  describe('Explicit Size Override', () => {
    it('explicit size overrides auto-calculation', () => {
      render(<Heading level={1} size="sm">Small H1</Heading>);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-sm');
      expect(heading).not.toHaveClass('text-3xl');
    });

    it('renders sm size correctly', () => {
      render(<Heading size="sm">Small</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-sm');
    });

    it('renders md size correctly', () => {
      render(<Heading size="md">Medium</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-base');
    });

    it('renders lg size correctly', () => {
      render(<Heading size="lg">Large</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-lg');
    });

    it('renders xl size correctly with responsive class', () => {
      render(<Heading size="xl">XL</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-xl');
      expect(heading).toHaveClass('sm:text-2xl');
    });

    it('renders 2xl size correctly with responsive class', () => {
      render(<Heading size="2xl">2XL</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-2xl');
      expect(heading).toHaveClass('sm:text-3xl');
    });

    it('renders 3xl size correctly with responsive class', () => {
      render(<Heading size="3xl">3XL</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-3xl');
      expect(heading).toHaveClass('sm:text-4xl');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with variant classes', () => {
      render(<Heading className="mt-4 mb-2">Title</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('mt-4');
      expect(heading).toHaveClass('mb-2');
      expect(heading).toHaveClass('font-bold'); // base class preserved
    });

    it('custom className takes precedence via cn()', () => {
      render(<Heading className="text-red-500">Title</Heading>);
      const heading = screen.getByRole('heading');
      // cn() with tailwind-merge should resolve conflict
      expect(heading).toHaveClass('text-red-500');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to heading element', () => {
      const ref = { current: null };
      render(<Heading ref={ref}>Title</Heading>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
      expect(ref.current.tagName).toBe('H2');
    });
  });

  describe('headingVariants Export', () => {
    it('exports headingVariants function', () => {
      expect(typeof headingVariants).toBe('function');
    });

    it('headingVariants generates correct class string', () => {
      const classes = headingVariants({ size: 'lg', variant: 'ember' });
      expect(classes).toContain('text-lg');
      expect(classes).toContain('text-ember-400');
      expect(classes).toContain('font-bold');
    });
  });
});
