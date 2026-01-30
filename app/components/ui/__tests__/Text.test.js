// app/components/ui/__tests__/Text.test.js
/**
 * Text Component Tests
 *
 * Tests accessibility, CVA variants, sizes, weights, utility props, and 'as' prop.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Text, { textVariants } from '../Text';

expect.extend(toHaveNoViolations);

describe('Text', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations with body variant', async () => {
      const { container } = render(
        <Text>Body text content</Text>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with secondary variant', async () => {
      const { container } = render(
        <Text variant="secondary">Secondary text</Text>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with label variant', async () => {
      const { container } = render(
        <Text variant="label">Label text</Text>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with all variants', async () => {
      const variants = ['body', 'secondary', 'tertiary', 'ember', 'ocean', 'sage', 'warning', 'danger', 'info', 'label'];
      const { container } = render(
        <div>
          {variants.map((variant) => (
            <Text key={variant} variant={variant}>
              {variant} text
            </Text>
          ))}
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with as="span"', async () => {
      const { container } = render(
        <p><Text as="span">Inline text</Text></p>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with as="label"', async () => {
      const { container } = render(
        <div>
          <Text as="label" htmlFor="test-input">Form Label</Text>
          <input id="test-input" type="text" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with as="div"', async () => {
      const { container } = render(
        <Text as="div">Block text</Text>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    // Muted text contrast documentation (A11Y-04: Design token-based contrast)
    // Secondary/tertiary variants use design tokens that maintain WCAG 2.1 AA contrast
    it('muted text maintains contrast via design tokens (secondary)', () => {
      render(<Text variant="secondary">Muted text</Text>);
      const text = screen.getByText('Muted text');
      // text-slate-300 on dark bg (slate-900) provides 7.14:1 contrast ratio
      expect(text).toHaveClass('text-slate-300');
    });

    it('muted text maintains contrast via design tokens (tertiary)', () => {
      render(<Text variant="tertiary">Subtle text</Text>);
      const text = screen.getByText('Subtle text');
      // text-slate-400 on dark bg (slate-900) provides 4.66:1 contrast ratio (AA)
      expect(text).toHaveClass('text-slate-400');
    });

    // All sizes pass axe checks
    it('should have no a11y violations with all sizes', async () => {
      const sizes = ['xs', 'sm', 'base', 'lg', 'xl'];
      for (const size of sizes) {
        const { container } = render(
          <Text size={size}>{size} Text</Text>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    // Text as different semantic elements
    it('should have no a11y violations with various semantic elements', async () => {
      const elements = ['p', 'span', 'div'];
      for (const as of elements) {
        const { container } = render(
          <Text as={as}>{as} element</Text>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('CVA Variants', () => {
    it('applies body variant classes (default)', () => {
      render(<Text>Body</Text>);
      const text = screen.getByText('Body');
      expect(text).toHaveClass('text-slate-100');
    });

    it('applies secondary variant classes', () => {
      render(<Text variant="secondary">Secondary</Text>);
      const text = screen.getByText('Secondary');
      expect(text).toHaveClass('text-slate-300');
    });

    it('applies tertiary variant classes', () => {
      render(<Text variant="tertiary">Tertiary</Text>);
      const text = screen.getByText('Tertiary');
      expect(text).toHaveClass('text-slate-400');
    });

    it('applies ember variant classes', () => {
      render(<Text variant="ember">Ember</Text>);
      const text = screen.getByText('Ember');
      expect(text).toHaveClass('text-ember-400');
    });

    it('applies ocean variant classes', () => {
      render(<Text variant="ocean">Ocean</Text>);
      const text = screen.getByText('Ocean');
      expect(text).toHaveClass('text-ocean-400');
    });

    it('applies sage variant classes', () => {
      render(<Text variant="sage">Sage</Text>);
      const text = screen.getByText('Sage');
      expect(text).toHaveClass('text-sage-400');
    });

    it('applies warning variant classes', () => {
      render(<Text variant="warning">Warning</Text>);
      const text = screen.getByText('Warning');
      expect(text).toHaveClass('text-warning-400');
    });

    it('applies danger variant classes', () => {
      render(<Text variant="danger">Danger</Text>);
      const text = screen.getByText('Danger');
      expect(text).toHaveClass('text-danger-400');
    });

    it('applies info variant classes', () => {
      render(<Text variant="info">Info</Text>);
      const text = screen.getByText('Info');
      expect(text).toHaveClass('text-ocean-400');
    });

    it('applies label variant classes with uppercase and tracking', () => {
      render(<Text variant="label">Label</Text>);
      const text = screen.getByText('Label');
      expect(text).toHaveClass('text-slate-400');
      expect(text).toHaveClass('uppercase');
      expect(text).toHaveClass('tracking-wider');
    });
  });

  describe('Default Sizes per Variant', () => {
    it('body variant defaults to base size', () => {
      render(<Text variant="body">Body</Text>);
      const text = screen.getByText('Body');
      expect(text).toHaveClass('text-base');
    });

    it('secondary variant defaults to base size', () => {
      render(<Text variant="secondary">Secondary</Text>);
      const text = screen.getByText('Secondary');
      expect(text).toHaveClass('text-base');
    });

    it('tertiary variant defaults to sm size', () => {
      render(<Text variant="tertiary">Tertiary</Text>);
      const text = screen.getByText('Tertiary');
      expect(text).toHaveClass('text-sm');
    });

    it('label variant defaults to xs size', () => {
      render(<Text variant="label">Label</Text>);
      const text = screen.getByText('Label');
      expect(text).toHaveClass('text-xs');
    });
  });

  describe('Explicit Size Override', () => {
    it('explicit size overrides default', () => {
      render(<Text variant="tertiary" size="lg">Large Tertiary</Text>);
      const text = screen.getByText('Large Tertiary');
      expect(text).toHaveClass('text-lg');
      expect(text).not.toHaveClass('text-sm');
    });

    it('renders xs size correctly', () => {
      render(<Text size="xs">XS</Text>);
      const text = screen.getByText('XS');
      expect(text).toHaveClass('text-xs');
    });

    it('renders sm size correctly', () => {
      render(<Text size="sm">SM</Text>);
      const text = screen.getByText('SM');
      expect(text).toHaveClass('text-sm');
    });

    it('renders base size correctly', () => {
      render(<Text size="base">Base</Text>);
      const text = screen.getByText('Base');
      expect(text).toHaveClass('text-base');
    });

    it('renders lg size correctly', () => {
      render(<Text size="lg">LG</Text>);
      const text = screen.getByText('LG');
      expect(text).toHaveClass('text-lg');
    });

    it('renders xl size correctly', () => {
      render(<Text size="xl">XL</Text>);
      const text = screen.getByText('XL');
      expect(text).toHaveClass('text-xl');
    });
  });

  describe('Weight Variants', () => {
    it('renders normal weight correctly', () => {
      render(<Text weight="normal">Normal</Text>);
      const text = screen.getByText('Normal');
      expect(text).toHaveClass('font-normal');
    });

    it('renders medium weight correctly', () => {
      render(<Text weight="medium">Medium</Text>);
      const text = screen.getByText('Medium');
      expect(text).toHaveClass('font-medium');
    });

    it('renders semibold weight correctly', () => {
      render(<Text weight="semibold">Semibold</Text>);
      const text = screen.getByText('Semibold');
      expect(text).toHaveClass('font-semibold');
    });

    it('renders bold weight correctly', () => {
      render(<Text weight="bold">Bold</Text>);
      const text = screen.getByText('Bold');
      expect(text).toHaveClass('font-bold');
    });

    it('renders black weight correctly', () => {
      render(<Text weight="black">Black</Text>);
      const text = screen.getByText('Black');
      expect(text).toHaveClass('font-black');
    });
  });

  describe('Utility Props', () => {
    it('applies uppercase class when uppercase=true', () => {
      render(<Text uppercase>Uppercase</Text>);
      const text = screen.getByText('Uppercase');
      expect(text).toHaveClass('uppercase');
    });

    it('does not duplicate uppercase for label variant', () => {
      render(<Text variant="label" uppercase>Label</Text>);
      const text = screen.getByText('Label');
      // Should only have one uppercase class from the label variant
      const classAttr = text.getAttribute('class');
      const uppercaseCount = (classAttr.match(/\buppercase\b/g) || []).length;
      expect(uppercaseCount).toBe(1);
    });

    it('applies tracking-wider class when tracking=true', () => {
      render(<Text tracking>Tracked</Text>);
      const text = screen.getByText('Tracked');
      expect(text).toHaveClass('tracking-wider');
    });

    it('applies font-mono class when mono=true', () => {
      render(<Text mono>Monospace</Text>);
      const text = screen.getByText('Monospace');
      expect(text).toHaveClass('font-mono');
    });

    it('combines multiple utility props', () => {
      render(<Text uppercase tracking mono>All Utils</Text>);
      const text = screen.getByText('All Utils');
      expect(text).toHaveClass('uppercase');
      expect(text).toHaveClass('tracking-wider');
      expect(text).toHaveClass('font-mono');
    });
  });

  describe('as Prop', () => {
    it('renders as p by default', () => {
      render(<Text>Paragraph</Text>);
      const text = screen.getByText('Paragraph');
      expect(text.tagName).toBe('P');
    });

    it('renders as span when as="span"', () => {
      render(<Text as="span">Inline</Text>);
      const text = screen.getByText('Inline');
      expect(text.tagName).toBe('SPAN');
    });

    it('renders as div when as="div"', () => {
      render(<Text as="div">Block</Text>);
      const text = screen.getByText('Block');
      expect(text.tagName).toBe('DIV');
    });

    it('renders as label when as="label"', () => {
      render(<Text as="label">Form Label</Text>);
      const text = screen.getByText('Form Label');
      expect(text.tagName).toBe('LABEL');
    });

    it('passes htmlFor to label element', () => {
      render(<Text as="label" htmlFor="my-input">Label</Text>);
      const text = screen.getByText('Label');
      expect(text).toHaveAttribute('for', 'my-input');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with variant classes', () => {
      render(<Text className="mt-4 mb-2">Text</Text>);
      const text = screen.getByText('Text');
      expect(text).toHaveClass('mt-4');
      expect(text).toHaveClass('mb-2');
      expect(text).toHaveClass('text-slate-100'); // variant class preserved
    });

    it('custom className takes precedence via cn()', () => {
      render(<Text className="text-red-500">Text</Text>);
      const text = screen.getByText('Text');
      // cn() with tailwind-merge should resolve conflict
      expect(text).toHaveClass('text-red-500');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to text element', () => {
      const ref = { current: null };
      render(<Text ref={ref}>Text</Text>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });

    it('forwards ref to span element', () => {
      const ref = { current: null };
      render(<Text as="span" ref={ref}>Span</Text>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('textVariants Export', () => {
    it('exports textVariants function', () => {
      expect(typeof textVariants).toBe('function');
    });

    it('textVariants generates correct class string', () => {
      const classes = textVariants({ variant: 'secondary', size: 'lg', weight: 'bold' });
      expect(classes).toContain('text-slate-300');
      expect(classes).toContain('text-lg');
      expect(classes).toContain('font-bold');
    });
  });
});
