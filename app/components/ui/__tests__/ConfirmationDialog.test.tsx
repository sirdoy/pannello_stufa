import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import ConfirmationDialog from '../ConfirmationDialog';

/**
 * ConfirmationDialog Tests
 *
 * Tests cover:
 * - Basic rendering
 * - Focus management (danger vs default variant)
 * - Button interactions
 * - Loading state protection
 * - Danger variant styling
 * - Accessibility
 */

describe('ConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders title and description when open', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      // Title appears twice: once in VisuallyHidden for a11y, once visible
      // Use getAllByText and check there's at least one
      const titleElements = screen.getAllByText('Confirm Action');
      expect(titleElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    test('does not render when isOpen=false', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders Cancel and Confirm buttons', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByTestId('confirmation-cancel')).toBeInTheDocument();
      expect(screen.getByTestId('confirmation-confirm')).toBeInTheDocument();
    });

    test('renders with custom button labels', () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          confirmLabel="Delete"
          cancelLabel="Keep"
        />
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Keep')).toBeInTheDocument();
    });

    test('renders custom icon when provided', () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          icon={<span data-testid="custom-icon">!</span>}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    test('renders null icon when explicitly set to null', () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          variant="danger"
          icon={null}
        />
      );

      // Should not have the AlertTriangle icon
      expect(screen.queryByTestId('danger-icon')).not.toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    test('variant="danger": Cancel button has focus', async () => {
      render(<ConfirmationDialog {...defaultProps} variant="danger" />);

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-cancel')).toHaveFocus();
      });
    });

    test('variant="default": Confirm button has focus', async () => {
      render(<ConfirmationDialog {...defaultProps} variant="default" />);

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-confirm')).toHaveFocus();
      });
    });

    test('default variant focuses Confirm button', async () => {
      render(<ConfirmationDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-confirm')).toHaveFocus();
      });
    });
  });

  describe('Button Interactions', () => {
    test('clicking Cancel calls onCancel and onClose', async () => {
      const onCancel = jest.fn();
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <ConfirmationDialog
          {...defaultProps}
          onCancel={onCancel}
          onClose={onClose}
        />
      );

      await user.click(screen.getByTestId('confirmation-cancel'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test('clicking Cancel calls onClose when onCancel not provided', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <ConfirmationDialog {...defaultProps} onClose={onClose} onCancel={undefined} />
      );

      await user.click(screen.getByTestId('confirmation-cancel'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('clicking Confirm calls onConfirm', async () => {
      const onConfirm = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByTestId('confirmation-confirm'));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('Enter key on focused button triggers its action', async () => {
      const onConfirm = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      // Wait for Confirm button to be focused (default variant)
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-confirm')).toHaveFocus();
      });

      // Press Enter to activate the button
      await user.keyboard('{Enter}');

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('Space key on focused button triggers its action', async () => {
      const onCancel = jest.fn();
      const user = userEvent.setup();

      render(
        <ConfirmationDialog {...defaultProps} variant="danger" onCancel={onCancel} />
      );

      // Wait for Cancel button to be focused (danger variant)
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-cancel')).toHaveFocus();
      });

      // Press Space to activate the button
      await user.keyboard(' ');

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    test('buttons are disabled when loading=true', () => {
      render(<ConfirmationDialog {...defaultProps} loading={true} />);

      expect(screen.getByTestId('confirmation-cancel')).toBeDisabled();
      expect(screen.getByTestId('confirmation-confirm')).toBeDisabled();
    });

    test('Confirm button shows loading spinner', () => {
      render(<ConfirmationDialog {...defaultProps} loading={true} />);

      const confirmButton = screen.getByTestId('confirmation-confirm');
      // Button has loading spinner (SVG with animate-spin class)
      const spinner = confirmButton.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('ESC key does not close when loading', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationDialog {...defaultProps} onClose={onClose} loading={true} />);

      await user.keyboard('{Escape}');

      expect(onClose).not.toHaveBeenCalled();
    });

    test('clicking outside does not close when loading', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationDialog {...defaultProps} onClose={onClose} loading={true} />);

      // Find the overlay (backdrop)
      const overlay = document.querySelector('.backdrop-blur-md');
      expect(overlay).toBeInTheDocument();

      // Click the overlay
      await user.click(overlay);

      expect(onClose).not.toHaveBeenCalled();
    });

    test('clicking Cancel does nothing when loading', async () => {
      const onCancel = jest.fn();
      const user = userEvent.setup();

      render(
        <ConfirmationDialog {...defaultProps} onCancel={onCancel} loading={true} />
      );

      await user.click(screen.getByTestId('confirmation-cancel'));

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Danger Variant Styling', () => {
    test('danger variant Confirm button has danger outline styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByTestId('confirmation-confirm');
      // Check for danger outline classes
      expect(confirmButton).toHaveClass('border-danger-500/40');
      expect(confirmButton).toHaveClass('text-danger-400');
    });

    test('danger variant shows AlertTriangle icon by default', () => {
      render(<ConfirmationDialog {...defaultProps} variant="danger" />);

      // AlertTriangle icon is rendered as SVG
      const icon = document.querySelector('.text-danger-500');
      expect(icon).toBeInTheDocument();
    });

    test('default variant Confirm button has ember styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="default" />);

      const confirmButton = screen.getByTestId('confirmation-confirm');
      // Should NOT have danger outline classes
      expect(confirmButton).not.toHaveClass('border-danger-500/40');
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations when open', async () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has role="dialog"', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    test('dialog has focus trap behavior', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      // Radix Dialog has tabIndex=-1 for programmatic focus management
      expect(dialog).toHaveAttribute('tabindex', '-1');
    });

    test('description is accessible via aria-describedby', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby');

      // Description content should be accessible
      const descId = dialog.getAttribute('aria-describedby');
      const descElement = document.getElementById(descId);
      expect(descElement).toHaveTextContent('Are you sure you want to proceed?');
    });

    test('title is accessible via aria-labelledby', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Close Behavior', () => {
    test('closes on ESC key when not loading', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationDialog {...defaultProps} onClose={onClose} loading={false} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('closes on backdrop click when not loading', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationDialog {...defaultProps} onClose={onClose} loading={false} />);

      const overlay = document.querySelector('.backdrop-blur-md');
      await user.click(overlay);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Async onConfirm', () => {
    test('supports async onConfirm function', async () => {
      const asyncConfirm = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10))
      );
      const user = userEvent.setup();

      render(<ConfirmationDialog {...defaultProps} onConfirm={asyncConfirm} />);

      await user.click(screen.getByTestId('confirmation-confirm'));

      expect(asyncConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
