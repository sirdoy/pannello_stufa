// app/components/ui/__tests__/Label.test.tsx
/**
 * Label Component Tests
 *
 * Tests accessibility, CVA variants, and Radix integration.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Label from '../Label';

expect.extend(toHaveNoViolations);

describe('Label', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations in default variant', async () => {
      const { container } = render(
        <Label>Default Label</Label>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations in muted variant', async () => {
      const { container } = render(
        <Label variant="muted">Muted Label</Label>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations in required variant', async () => {
      const { container } = render(
        <Label variant="required">Required Label</Label>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations when associated with input', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="email">Email Address</Label>
          <input type="email" id="email" aria-label="Email Address" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    // Label-input association tests (A11Y-03: Semantic HTML)
    it('associates correctly with input via htmlFor', () => {
      render(
        <div>
          <Label htmlFor="test-email">Email</Label>
          <input id="test-email" type="email" />
        </div>
      );
      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', 'test-email');
    });

    it('required label shows asterisk via CSS pseudo-element', () => {
      render(<Label variant="required">Required Field</Label>);
      const label = screen.getByText('Required Field');
      // Required variant uses ::after pseudo-element for asterisk
      expect(label).toHaveClass("after:content-['*']");
      expect(label).toHaveClass('after:text-ember-500');
      expect(label).toHaveClass('after:ml-0.5');
    });

    it('should have no a11y violations with all sizes', async () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      for (const size of sizes) {
        const { container } = render(
          <Label size={size}>{size} Label</Label>
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('CVA Variants', () => {
    it('applies size sm classes', () => {
      render(<Label size="sm">Small</Label>);
      const label = screen.getByText('Small');
      expect(label).toHaveClass('text-xs');
    });

    it('applies size md classes (default)', () => {
      render(<Label>Medium</Label>);
      const label = screen.getByText('Medium');
      expect(label).toHaveClass('text-sm');
    });

    it('applies size lg classes', () => {
      render(<Label size="lg">Large</Label>);
      const label = screen.getByText('Large');
      expect(label).toHaveClass('text-base');
    });

    it('applies default variant classes', () => {
      render(<Label variant="default">Default</Label>);
      const label = screen.getByText('Default');
      expect(label).toHaveClass('text-slate-300');
    });

    it('applies muted variant classes', () => {
      render(<Label variant="muted">Muted</Label>);
      const label = screen.getByText('Muted');
      expect(label).toHaveClass('text-slate-400');
    });

    it('applies required variant classes with asterisk', () => {
      render(<Label variant="required">Required</Label>);
      const label = screen.getByText('Required');
      expect(label).toHaveClass('text-slate-300');
      expect(label).toHaveClass("after:content-['*']");
      expect(label).toHaveClass('after:text-ember-500');
    });

    it('applies base classes', () => {
      render(<Label>Base</Label>);
      const label = screen.getByText('Base');
      expect(label).toHaveClass('font-medium', 'font-display', 'select-none');
    });
  });

  describe('Radix Integration', () => {
    it('renders as label element', () => {
      render(<Label>Test</Label>);
      const label = screen.getByText('Test');
      expect(label.tagName).toBe('LABEL');
    });

    it('accepts htmlFor prop', () => {
      render(<Label htmlFor="my-input">Input Label</Label>);
      const label = screen.getByText('Input Label');
      expect(label).toHaveAttribute('for', 'my-input');
    });

    it('clicking label focuses associated input', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Label htmlFor="test-input">Click Me</Label>
          <input id="test-input" type="text" />
        </div>
      );

      const label = screen.getByText('Click Me');
      const input = screen.getByRole('textbox');

      await user.click(label);
      expect(input).toHaveFocus();
    });
  });

  describe('Custom className', () => {
    it('merges custom className with variant classes', () => {
      render(<Label className="custom-class">Custom</Label>);
      const label = screen.getByText('Custom');
      expect(label).toHaveClass('custom-class');
      expect(label).toHaveClass('font-medium'); // Base class still applies
    });
  });

  describe('forwardRef', () => {
    it('forwards ref to label element', () => {
      const ref = { current: null };
      render(<Label ref={ref}>Ref Test</Label>);
      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    });
  });
});
