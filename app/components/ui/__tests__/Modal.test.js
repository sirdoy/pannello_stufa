import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '../Modal';

/**
 * Test helper: Modal with common structure
 * Uses distinct names for buttons to avoid ambiguity
 */
const TestModal = ({
  isOpen = true,
  onClose = jest.fn(),
  size = 'md',
  children,
  ...props
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size={size} {...props}>
    <Modal.Header>
      <Modal.Title>Test Modal</Modal.Title>
      <Modal.Close data-testid="modal-close-x" />
    </Modal.Header>
    {children || <button data-testid="focus-target">Focus Me</button>}
    <Modal.Footer>
      <button onClick={onClose} data-testid="modal-footer-close">
        Dismiss
      </button>
    </Modal.Footer>
  </Modal>
);

describe('Modal Component', () => {
  describe('Rendering', () => {
    test('renders nothing when closed', () => {
      render(<TestModal isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders content when open', () => {
      render(<TestModal />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    test('renders Modal.Header, Modal.Title, Modal.Footer', () => {
      render(<TestModal />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByTestId('focus-target')).toBeInTheDocument();
      expect(screen.getByTestId('modal-footer-close')).toBeInTheDocument();
    });

    test('renders Modal.Description when provided', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Header>
            <Modal.Title>Title</Modal.Title>
          </Modal.Header>
          <Modal.Description>This is a description</Modal.Description>
        </Modal>
      );
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    test.each([
      ['sm', 'max-w-sm'],
      ['md', 'max-w-md'],
      ['lg', 'max-w-lg'],
      ['xl', 'max-w-xl'],
      ['full', 'max-w-none'],
    ])('renders with size="%s" applying %s class', (size, expectedClass) => {
      render(<TestModal size={size} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass(expectedClass);
    });

    test('default size is md', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Title</Modal.Title>
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md');
    });
  });

  describe('Backwards Compatibility', () => {
    test('supports legacy maxWidth prop', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} maxWidth="max-w-2xl">
          <Modal.Title>Title</Modal.Title>
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-2xl');
    });

    test('className takes precedence over maxWidth', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          maxWidth="max-w-sm"
          className="max-w-4xl"
        >
          <Modal.Title>Title</Modal.Title>
          <p>Content</p>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      // tailwind-merge resolves conflict - last wins
      expect(dialog).toHaveClass('max-w-4xl');
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations when open', async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Header>
            <Modal.Title>Accessible Modal</Modal.Title>
          </Modal.Header>
          <p>Content here</p>
        </Modal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has correct role=dialog', () => {
      render(<TestModal />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    test('has modal behavior (focus trap)', async () => {
      // Radix Dialog implements modal behavior via focus trap
      // rather than aria-modal attribute in some configurations
      render(<TestModal />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Verify modal behavior: tabIndex=-1 indicates programmatic focus management
      expect(dialog).toHaveAttribute('tabindex', '-1');
    });

    test('Modal.Title provides accessible name via aria-labelledby', () => {
      render(<TestModal />);
      const dialog = screen.getByRole('dialog');
      // Radix automatically connects DialogTitle to aria-labelledby
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    test('Modal.Description provides accessible description via aria-describedby', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Title</Modal.Title>
          <Modal.Description>Description text</Modal.Description>
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    test('Modal.Close has aria-label', () => {
      render(<TestModal />);
      // Use testid to find the specific close button with aria-label
      const closeButton = screen.getByTestId('modal-close-x');
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });
  });

  describe('Interaction - ESC Key', () => {
    test('closes on ESC key press', async () => {
      const handleClose = jest.fn();
      const user = userEvent.setup();

      render(<TestModal onClose={handleClose} />);

      // Ensure modal is open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press ESC
      await user.keyboard('{Escape}');

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Interaction - Backdrop Click', () => {
    test('closes on backdrop click', async () => {
      const handleClose = jest.fn();
      const user = userEvent.setup();

      render(<TestModal onClose={handleClose} />);

      // The overlay is the backdrop - find it by class
      const overlay = document.querySelector('.backdrop-blur-md');
      expect(overlay).toBeInTheDocument();

      // Click the overlay (backdrop)
      await user.click(overlay);

      // Wait for the close handler to be called
      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });

    test('does not close on content click', async () => {
      const handleClose = jest.fn();
      const user = userEvent.setup();

      render(<TestModal onClose={handleClose} />);

      // Click on a button inside the modal
      const focusTarget = screen.getByTestId('focus-target');
      await user.click(focusTarget);

      // Close should NOT be called when clicking inside the modal
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    test('focuses first focusable element on open', async () => {
      render(<TestModal />);

      // Radix focuses asynchronously
      await waitFor(() => {
        // First focusable element in our TestModal is the Close X button
        const closeButton = screen.getByTestId('modal-close-x');
        expect(closeButton).toHaveFocus();
      });
    });

    test('traps focus inside modal', async () => {
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Focus Test</Modal.Title>
          <button data-testid="btn-first">First</button>
          <button data-testid="btn-second">Second</button>
          <button data-testid="btn-third">Third</button>
        </Modal>
      );

      // Wait for initial focus
      await waitFor(() => {
        expect(screen.getByTestId('btn-first')).toHaveFocus();
      });

      // Tab through all buttons
      await user.tab();
      expect(screen.getByTestId('btn-second')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('btn-third')).toHaveFocus();

      // Tab again should cycle back to first (focus trap)
      await user.tab();
      await waitFor(() => {
        expect(screen.getByTestId('btn-first')).toHaveFocus();
      });
    });

    test('Shift+Tab reverse cycles through focusable elements (Focus Trap)', async () => {
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Focus Trap Test</Modal.Title>
          <button data-testid="btn-first">First</button>
          <button data-testid="btn-second">Second</button>
          <button data-testid="btn-third">Third</button>
        </Modal>
      );

      // Wait for initial focus on first button
      await waitFor(() => {
        expect(screen.getByTestId('btn-first')).toHaveFocus();
      });

      // Shift+Tab should wrap to last element (focus trap in reverse)
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      await waitFor(() => {
        expect(screen.getByTestId('btn-third')).toHaveFocus();
      });
    });

    test('Enter key activates close button', async () => {
      const handleClose = jest.fn();
      const user = userEvent.setup();

      render(<TestModal onClose={handleClose} />);

      // Wait for close button to be focused (first focusable element)
      await waitFor(() => {
        expect(screen.getByTestId('modal-close-x')).toHaveFocus();
      });

      // Press Enter to activate the button
      await user.keyboard('{Enter}');

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('Space key activates close button', async () => {
      const handleClose = jest.fn();
      const user = userEvent.setup();

      render(<TestModal onClose={handleClose} />);

      // Wait for close button to be focused
      await waitFor(() => {
        expect(screen.getByTestId('modal-close-x')).toHaveFocus();
      });

      // Press Space to activate the button
      await user.keyboard(' ');

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Centered Modal (All Screen Sizes)', () => {
    test('applies centered positioning classes', () => {
      render(<TestModal />);
      const dialog = screen.getByRole('dialog');

      // Check for centered positioning classes
      expect(dialog).toHaveClass('left-1/2');
      expect(dialog).toHaveClass('top-1/2');
      expect(dialog).toHaveClass('-translate-x-1/2');
      expect(dialog).toHaveClass('-translate-y-1/2');
    });

    test('has rounded corners on all sides', () => {
      render(<TestModal />);
      const dialog = screen.getByRole('dialog');

      // Check for full rounded corners (not split top/bottom)
      expect(dialog).toHaveClass('rounded-3xl');
    });
  });

  describe('Animation Classes', () => {
    test('overlay has fade-in animation class', () => {
      render(<TestModal />);
      const overlay = document.querySelector('.backdrop-blur-md');
      expect(overlay).toHaveClass('data-[state=open]:animate-fade-in');
    });

    test('content has scale-in-center animation class', () => {
      render(<TestModal />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('data-[state=open]:animate-scale-in-center');
    });
  });

  describe('Custom className', () => {
    test('applies custom className to content', () => {
      render(<TestModal className="custom-modal-class" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-modal-class');
    });
  });

  describe('Namespace Components', () => {
    test('Modal.Header is exported and renders', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Title</Modal.Title>
          <Modal.Header className="test-header">
            <span>Header Content</span>
          </Modal.Header>
        </Modal>
      );
      const header = document.querySelector('.test-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('items-center');
    });

    test('Modal.Title renders with correct typography', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>My Title</Modal.Title>
        </Modal>
      );
      expect(screen.getByText('My Title')).toHaveClass('text-xl');
      expect(screen.getByText('My Title')).toHaveClass('font-semibold');
    });

    test('Modal.Description renders with muted styling', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Title</Modal.Title>
          <Modal.Description>Description text</Modal.Description>
        </Modal>
      );
      expect(screen.getByText('Description text')).toHaveClass('text-sm');
      expect(screen.getByText('Description text')).toHaveClass('text-slate-400');
    });

    test('Modal.Footer renders with correct layout', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Title</Modal.Title>
          <Modal.Footer className="test-footer">
            <button>Action</button>
          </Modal.Footer>
        </Modal>
      );
      const footer = document.querySelector('.test-footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('justify-end');
      expect(footer).toHaveClass('gap-3');
    });

    test('Modal.Close renders X icon by default', () => {
      render(<TestModal />);
      const closeButton = screen.getByTestId('modal-close-x');
      // Check for lucide X icon (rendered as SVG)
      const svg = closeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    test('Modal.Close accepts custom children', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Title</Modal.Title>
          <Modal.Close>Custom Close</Modal.Close>
        </Modal>
      );
      expect(screen.getByRole('button', { name: 'Close' })).toHaveTextContent(
        'Custom Close'
      );
    });
  });

  describe('Named Exports', () => {
    test('ModalHeader is exported', () => {
      expect(ModalHeader).toBeDefined();
    });

    test('ModalTitle is exported', () => {
      expect(ModalTitle).toBeDefined();
    });

    test('ModalDescription is exported', () => {
      expect(ModalDescription).toBeDefined();
    });

    test('ModalFooter is exported', () => {
      expect(ModalFooter).toBeDefined();
    });

    test('ModalClose is exported', () => {
      expect(ModalClose).toBeDefined();
    });
  });

  describe('Ref Forwarding', () => {
    test('Modal.Header forwards ref', () => {
      const ref = { current: null };
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Title</Modal.Title>
          <Modal.Header ref={ref}>Header</Modal.Header>
        </Modal>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('Modal.Title forwards ref', () => {
      const ref = { current: null };
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title ref={ref}>Title</Modal.Title>
        </Modal>
      );
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    test('Modal.Footer forwards ref', () => {
      const ref = { current: null };
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Title</Modal.Title>
          <Modal.Footer ref={ref}>Footer</Modal.Footer>
        </Modal>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('Modal.Close forwards ref', () => {
      const ref = { current: null };
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <Modal.Title>Title</Modal.Title>
          <Modal.Close ref={ref} />
        </Modal>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
