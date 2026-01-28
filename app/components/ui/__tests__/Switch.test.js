// app/components/ui/__tests__/Switch.test.js
/**
 * Switch Component Tests
 *
 * Tests accessibility, keyboard interaction, animation, and all states.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Switch from '../Switch';

expect.extend(toHaveNoViolations);

describe('Switch', () => {
  describe('Accessibility', () => {
    it('should have no a11y violations in unchecked state', async () => {
      const { container } = render(
        <Switch label="Enable notifications" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations in checked state', async () => {
      const { container } = render(
        <Switch checked label="Enable notifications" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no a11y violations when disabled', async () => {
      const { container } = render(
        <Switch disabled label="Disabled switch" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper role and aria-checked', () => {
      render(<Switch checked label="Test switch" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Keyboard Interaction', () => {
    it('should toggle with Space key', async () => {
      const handleChange = jest.fn();
      render(
        <Switch label="Toggle me" onCheckedChange={handleChange} />
      );

      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      expect(switchElement).toHaveFocus();

      // Press Space to toggle
      await userEvent.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should be focusable for keyboard navigation', async () => {
      render(<Switch label="Focusable" />);

      const switchElement = screen.getByRole('switch');

      // Tab to focus
      await userEvent.tab();
      expect(switchElement).toHaveFocus();
    });

    it('should not toggle when disabled', async () => {
      const handleChange = jest.fn();
      render(
        <Switch label="Disabled" disabled onCheckedChange={handleChange} />
      );

      const switchElement = screen.getByRole('switch');

      // Try to click
      fireEvent.click(switchElement);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('renders unchecked state correctly', () => {
      render(<Switch label="Unchecked" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('renders checked state correctly', () => {
      render(<Switch checked label="Checked" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('renders disabled state correctly', () => {
      render(<Switch disabled label="Disabled" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });
  });

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      render(<Switch size="sm" label="Small" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('h-6', 'w-11');
    });

    it('renders medium size correctly', () => {
      render(<Switch size="md" label="Medium" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('h-8', 'w-14');
    });

    it('renders large size correctly', () => {
      render(<Switch size="lg" label="Large" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('h-10');
    });
  });

  describe('Color Variants', () => {
    it('renders all color variants without errors', () => {
      const variants = ['ember', 'ocean', 'sage'];
      variants.forEach((variant) => {
        const { unmount } = render(
          <Switch variant={variant} checked label={variant} />
        );
        expect(screen.getByRole('switch')).toBeInTheDocument();
        unmount();
      });
    });

    it('applies ember gradient when checked', () => {
      render(<Switch variant="ember" checked label="Ember" />);
      const switchElement = screen.getByRole('switch');
      // Verify gradient classes are present
      expect(switchElement).toHaveClass('data-[state=checked]:bg-gradient-to-r');
    });
  });

  describe('Animation', () => {
    it('has 250ms transition duration class on track', () => {
      render(<Switch label="Animated" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('duration-250');
    });

    it('has 250ms transition duration class on thumb', () => {
      const { container } = render(<Switch label="Animated" />);
      // The thumb is the span inside the switch
      const thumb = container.querySelector('[data-state]')?.querySelector('span');
      expect(thumb).toHaveClass('duration-250');
    });
  });

  describe('Backwards Compatibility', () => {
    it('supports legacy onChange handler', () => {
      const handleChange = jest.fn();
      render(<Switch label="Legacy" onChange={handleChange} />);

      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('supports both onCheckedChange and onChange', () => {
      const handleCheckedChange = jest.fn();
      const handleChange = jest.fn();

      render(
        <Switch
          label="Both handlers"
          onCheckedChange={handleCheckedChange}
          onChange={handleChange}
        />
      );

      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      expect(handleCheckedChange).toHaveBeenCalledWith(true);
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Focus Ring', () => {
    it('has ember glow focus ring classes', () => {
      render(<Switch label="Focus test" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('focus-visible:ring-2');
      expect(switchElement).toHaveClass('focus-visible:ring-ember-500/50');
    });
  });

  describe('Label', () => {
    it('applies aria-label from label prop', () => {
      render(<Switch label="My Switch" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-label', 'My Switch');
    });
  });
});
