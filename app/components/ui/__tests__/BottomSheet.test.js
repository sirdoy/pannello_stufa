import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BottomSheet from '../BottomSheet';

describe('BottomSheet Component', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    onCloseMock.mockClear();
  });

  describe('Rendering', () => {
    test('does not render when isOpen is false', () => {
      render(
        <BottomSheet isOpen={false} onClose={onCloseMock}>
          Content
        </BottomSheet>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders when isOpen is true', () => {
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock}>
          Content
        </BottomSheet>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('renders children content', () => {
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock}>
          <div>Test content</div>
        </BottomSheet>
      );
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    test('renders with title', () => {
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock} title="Test Title">
          Content
        </BottomSheet>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    test('renders with icon', () => {
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock} title="Title" icon="🔥">
          Content
        </BottomSheet>
      );
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    test('shows close button by default', () => {
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock} title="Title">
          Content
        </BottomSheet>
      );
      const closeButton = screen.getByRole('button', { name: /chiudi/i });
      expect(closeButton).toBeInTheDocument();
    });

    test('hides close button when showCloseButton is false', () => {
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock} title="Title" showCloseButton={false}>
          Content
        </BottomSheet>
      );
      expect(screen.queryByRole('button', { name: /chiudi/i })).not.toBeInTheDocument();
    });

    test('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock} title="Title">
          Content
        </BottomSheet>
      );
      const closeButton = screen.getByRole('button', { name: /chiudi/i });
      await user.click(closeButton);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Drag Handle', () => {
    test('shows drag handle by default', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={onCloseMock}>
          Content
        </BottomSheet>
      );
      // Use a more robust selector for the handle (rounded-full is unique to the handle)
      const handle = container.querySelector('.rounded-full.mx-auto.mb-6');
      expect(handle).toBeInTheDocument();
      expect(handle).toHaveClass('w-12');
    });

    test('hides drag handle when showHandle is false', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={onCloseMock} showHandle={false}>
          Content
        </BottomSheet>
      );
      const handle = container.querySelector('.rounded-full.mx-auto.mb-6');
      expect(handle).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has dialog role', () => {
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock}>
          Content
        </BottomSheet>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('has aria-modal attribute', () => {
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock}>
          Content
        </BottomSheet>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    test('has aria-labelledby when title is provided', () => {
      render(
        <BottomSheet isOpen={true} onClose={onCloseMock} title="Test Title">
          Content
        </BottomSheet>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'bottom-sheet-title');
    });
  });
});
