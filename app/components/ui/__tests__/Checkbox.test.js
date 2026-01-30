// app/components/ui/__tests__/Checkbox.test.js
/**
 * Checkbox Component Tests
 *
 * Tests accessibility, keyboard interaction, and all states.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Checkbox from '../Checkbox';

expect.extend(toHaveNoViolations);

describe('Checkbox', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations in unchecked state', async () => {
      const { container } = render(
        <Checkbox aria-label="Accept terms" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations in checked state', async () => {
      const { container } = render(
        <Checkbox checked aria-label="Accept terms" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations in indeterminate state', async () => {
      const { container } = render(
        <Checkbox indeterminate aria-label="Select all" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations when disabled', async () => {
      const { container } = render(
        <Checkbox disabled aria-label="Disabled option" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations with label', async () => {
      const { container } = render(
        <Checkbox id="terms" label="I accept the terms" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('can be focused via Tab key', async () => {
      render(<Checkbox aria-label="Focusable" />);

      const checkbox = screen.getByRole('checkbox');

      await userEvent.tab();
      expect(checkbox).toHaveFocus();
    });

    it('toggles with Space key', async () => {
      const handleChange = jest.fn();
      render(
        <Checkbox aria-label="Toggle me" onCheckedChange={handleChange} />
      );

      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      expect(checkbox).toHaveFocus();

      await userEvent.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('toggles from checked to unchecked with Space key', async () => {
      const handleChange = jest.fn();
      render(
        <Checkbox
          aria-label="Checked toggle"
          checked
          onCheckedChange={handleChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();

      await userEvent.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it('Tab navigates between multiple checkboxes', async () => {
      render(
        <>
          <Checkbox aria-label="First" />
          <Checkbox aria-label="Second" />
          <Checkbox aria-label="Third" />
        </>
      );

      const checkboxes = screen.getAllByRole('checkbox');

      await userEvent.tab();
      expect(checkboxes[0]).toHaveFocus();

      await userEvent.tab();
      expect(checkboxes[1]).toHaveFocus();

      await userEvent.tab();
      expect(checkboxes[2]).toHaveFocus();
    });

    it('disabled checkbox is skipped in tab order', async () => {
      render(
        <>
          <Checkbox aria-label="First" />
          <Checkbox aria-label="Disabled" disabled />
          <Checkbox aria-label="Third" />
        </>
      );

      const checkboxes = screen.getAllByRole('checkbox');

      await userEvent.tab();
      expect(checkboxes[0]).toHaveFocus();

      await userEvent.tab();
      // Should skip disabled checkbox and go to third
      expect(checkboxes[2]).toHaveFocus();
    });

    it('does not toggle disabled checkbox with Space', async () => {
      const handleChange = jest.fn();
      render(
        <Checkbox
          aria-label="Disabled"
          disabled
          onCheckedChange={handleChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();

      await userEvent.keyboard(' ');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not toggle disabled checkbox with click', async () => {
      const handleChange = jest.fn();
      render(
        <Checkbox
          aria-label="Disabled"
          disabled
          onCheckedChange={handleChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('renders unchecked state correctly', () => {
      render(<Checkbox aria-label="Unchecked" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    it('renders checked state correctly', () => {
      render(<Checkbox checked aria-label="Checked" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('renders indeterminate state correctly', () => {
      render(<Checkbox indeterminate aria-label="Indeterminate" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
      expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });

    it('renders disabled state correctly', () => {
      render(<Checkbox disabled aria-label="Disabled" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('renders all size variants', () => {
      const { rerender } = render(
        <Checkbox size="sm" aria-label="Small" />
      );
      expect(screen.getByRole('checkbox')).toHaveClass('h-4', 'w-4');

      rerender(<Checkbox size="md" aria-label="Medium" />);
      expect(screen.getByRole('checkbox')).toHaveClass('h-5', 'w-5');

      rerender(<Checkbox size="lg" aria-label="Large" />);
      expect(screen.getByRole('checkbox')).toHaveClass('h-6', 'w-6');
    });

    it('renders all color variants without errors', () => {
      const variants = ['primary', 'ember', 'ocean', 'sage', 'flame'];
      variants.forEach((variant) => {
        const { unmount } = render(
          <Checkbox variant={variant} checked aria-label={variant} />
        );
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Backwards Compatibility', () => {
    it('supports legacy onChange handler', () => {
      const handleChange = jest.fn();
      render(
        <Checkbox
          aria-label="Legacy"
          onChange={handleChange}
          name="terms"
          value="accepted"
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            checked: true,
            indeterminate: false,
            name: 'terms',
            value: 'accepted',
          }),
        })
      );
    });

    it('supports both onCheckedChange and onChange', () => {
      const handleCheckedChange = jest.fn();
      const handleChange = jest.fn();

      render(
        <Checkbox
          aria-label="Both handlers"
          onCheckedChange={handleCheckedChange}
          onChange={handleChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(handleCheckedChange).toHaveBeenCalledWith(true);
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Label', () => {
    it('renders label when provided', () => {
      render(<Checkbox id="terms" label="Accept terms" />);
      expect(screen.getByText('Accept terms')).toBeInTheDocument();
    });

    it('associates label with checkbox via htmlFor', () => {
      render(<Checkbox id="my-checkbox" label="My Label" />);
      const label = screen.getByText('My Label');
      expect(label).toHaveAttribute('for', 'my-checkbox');
    });
  });

  describe('Focus Ring', () => {
    it('has ember glow focus ring classes', () => {
      render(<Checkbox aria-label="Focus test" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('focus-visible:ring-2');
      expect(checkbox).toHaveClass('focus-visible:ring-ember-500/50');
    });
  });
});
