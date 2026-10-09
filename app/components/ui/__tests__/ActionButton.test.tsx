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
    test('renders ember variant by default', () => {
      render(<ActionButton icon="✓" ariaLabel="Test" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ember-500/15'); // Dark mode default
      expect(button).toHaveClass('text-ember-400');
    });

    test('renders ocean variant', () => {
      render(<ActionButton icon="✏️" variant="ocean" ariaLabel="Edit" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ocean-500/15');
      expect(button).toHaveClass('text-ocean-400');
    });

    test('renders danger variant', () => {
      render(<ActionButton icon="🗑️" variant="danger" ariaLabel="Delete" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-danger-500/15');
      expect(button).toHaveClass('text-danger-400');
    });

    test('renders ghost variant', () => {
      render(<ActionButton icon="✕" variant="ghost" ariaLabel="Close" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/6');
      expect(button).toHaveClass('text-(--text-2)');
    });

    test('renders warning variant', () => {
      render(<ActionButton icon="⚠️" variant="warning" ariaLabel="Warning" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-warning-500/15');
      expect(button).toHaveClass('text-warning-400');
    });

    test('renders sage variant', () => {
      render(<ActionButton icon="✓" variant="sage" ariaLabel="Success" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-sage-500/15');
      expect(button).toHaveClass('text-sage-400');
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
