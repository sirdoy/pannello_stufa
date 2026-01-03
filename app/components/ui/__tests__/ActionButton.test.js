import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionButton from '../ActionButton';

describe('ActionButton Component', () => {
  describe('Rendering', () => {
    test('renders button with icon', () => {
      render(<ActionButton icon="🔥" ariaLabel="Fire" />);
      const button = screen.getByRole('button', { name: /fire/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('🔥');
    });

    test('renders with title attribute', () => {
      render(<ActionButton icon="✓" title="Confirm action" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Confirm action');
    });

    test('applies custom className', () => {
      render(<ActionButton icon="✓" className="custom-class" ariaLabel="Test" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    test('renders primary variant by default', () => {
      render(<ActionButton icon="✓" ariaLabel="Test" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500/10');
    });

    test('renders edit variant', () => {
      render(<ActionButton icon="✏️" variant="edit" ariaLabel="Edit" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-500/10');
      expect(button).toHaveClass('text-blue-600');
    });

    test('renders delete variant', () => {
      render(<ActionButton icon="🗑️" variant="delete" ariaLabel="Delete" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500/10');
      expect(button).toHaveClass('text-red-600');
    });

    test('renders close variant', () => {
      render(<ActionButton icon="✕" variant="close" ariaLabel="Close" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-neutral-200/50');
    });

    test('renders info variant', () => {
      render(<ActionButton icon="ℹ️" variant="info" ariaLabel="Info" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-cyan-500/10');
    });

    test('renders warning variant', () => {
      render(<ActionButton icon="⚠️" variant="warning" ariaLabel="Warning" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-warning-500/10');
    });

    test('renders success variant', () => {
      render(<ActionButton icon="✓" variant="success" ariaLabel="Success" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-success-500/10');
    });
  });

  describe('Sizes', () => {
    test('renders medium size by default', () => {
      render(<ActionButton icon="✓" ariaLabel="Test" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-3');
    });

    test('renders small size', () => {
      render(<ActionButton icon="✓" size="sm" ariaLabel="Test" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-2');
    });

    test('renders large size', () => {
      render(<ActionButton icon="✓" size="lg" ariaLabel="Test" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-4');
    });
  });

  describe('States', () => {
    test('is enabled by default', () => {
      render(<ActionButton icon="✓" ariaLabel="Test" />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    test('can be disabled', () => {
      render(<ActionButton icon="✓" disabled ariaLabel="Test" />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
      expect(button).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Interactions', () => {
    test('handles click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<ActionButton icon="✓" onClick={handleClick} ariaLabel="Test" />);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<ActionButton icon="✓" onClick={handleClick} disabled ariaLabel="Test" />);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('uses ariaLabel when provided', () => {
      render(<ActionButton icon="✓" ariaLabel="Confirm action" />);
      const button = screen.getByRole('button', { name: /confirm action/i });
      expect(button).toBeInTheDocument();
    });

    test('falls back to title for accessibility', () => {
      render(<ActionButton icon="✓" title="Edit item" />);
      const button = screen.getByRole('button', { name: /edit item/i });
      expect(button).toBeInTheDocument();
    });

    test('has button role', () => {
      render(<ActionButton icon="✓" ariaLabel="Test" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
