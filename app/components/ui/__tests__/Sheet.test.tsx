import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Sheet, {
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '../Sheet';
import type { SheetContentProps } from '../Sheet';

type SheetSide = 'top' | 'bottom' | 'left' | 'right';
type SheetSize = 'auto' | 'sm' | 'md' | 'lg';

interface TestSheetProps extends React.ComponentProps<'div'> {
  open?: boolean;
  onOpenChange?: jest.Mock<void, [boolean]>;
  side?: SheetSide;
  size?: SheetSize;
  showCloseButton?: boolean;
  children?: React.ReactNode;
}

/**
 * Test helper: Sheet with common structure
 */
const TestSheet = ({
  open = true,
  onOpenChange = jest.fn(),
  side = 'bottom',
  size = 'md',
  showCloseButton = true,
  children,
  ...props
}: TestSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <Sheet.Trigger asChild>
      <button data-testid="sheet-trigger">Open Sheet</button>
    </Sheet.Trigger>
    <Sheet.Content
      side={side}
      size={size}
      showCloseButton={showCloseButton}
      {...props}
    >
      <Sheet.Header>
        <Sheet.Title>Test Sheet</Sheet.Title>
        <Sheet.Description>This is a test description</Sheet.Description>
      </Sheet.Header>
      {children || <button data-testid="focus-target">Focus Me</button>}
      <Sheet.Footer>
        <button onClick={() => onOpenChange(false)} data-testid="sheet-footer-close">
          Dismiss
        </button>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet>
);

describe('Sheet Component', () => {
  describe('Rendering', () => {
    test('renders nothing when closed', () => {
      render(<TestSheet open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders content when open', () => {
      render(<TestSheet />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Sheet')).toBeInTheDocument();
    });

    test('renders trigger element', () => {
      render(<TestSheet open={false} />);
      expect(screen.getByTestId('sheet-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-trigger')).toHaveTextContent('Open Sheet');
    });

    test('renders Sheet.Header, Sheet.Title, Sheet.Description, Sheet.Footer', () => {
      render(<TestSheet />);
      expect(screen.getByText('Test Sheet')).toBeInTheDocument();
      expect(screen.getByText('This is a test description')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-footer-close')).toBeInTheDocument();
    });
  });

  describe('Open/Close Behavior', () => {
    test('opens when trigger clicked', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();

      render(<TestSheet open={false} onOpenChange={handleOpenChange} />);

      await user.click(screen.getByTestId('sheet-trigger'));

      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });

    test('closes when backdrop clicked', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();

      render(<TestSheet onOpenChange={handleOpenChange} />);

      // The overlay is the backdrop - find it by class
      const overlay = document.querySelector('.backdrop-blur-md');
      expect(overlay).toBeInTheDocument();

      await user.click(overlay);

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });

    test('closes when Escape pressed', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();

      render(<TestSheet onOpenChange={handleOpenChange} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    test('closes when close button clicked', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();

      render(<TestSheet onOpenChange={handleOpenChange} />);

      // Find close button by aria-label (the X button in top-right corner)
      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    test('calls onOpenChange with false when closing', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();

      render(<TestSheet onOpenChange={handleOpenChange} />);

      await user.keyboard('{Escape}');

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Side Variants', () => {
    test('renders with side="bottom" (default)', () => {
      render(<TestSheet />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bottom-0');
      expect(dialog).toHaveClass('inset-x-0');
      expect(dialog).toHaveClass('rounded-t-3xl');
    });

    test('renders with side="right"', () => {
      render(<TestSheet side="right" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('right-0');
      expect(dialog).toHaveClass('inset-y-0');
      expect(dialog).toHaveClass('rounded-l-3xl');
    });

    test('renders with side="left"', () => {
      render(<TestSheet side="left" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('left-0');
      expect(dialog).toHaveClass('inset-y-0');
      expect(dialog).toHaveClass('rounded-r-3xl');
    });

    test('renders with side="top"', () => {
      render(<TestSheet side="top" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('top-0');
      expect(dialog).toHaveClass('inset-x-0');
      expect(dialog).toHaveClass('rounded-b-3xl');
    });

    test('correct animation classes for bottom side', () => {
      render(<TestSheet side="bottom" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('data-[state=open]:animate-slide-in-from-bottom');
    });

    test('correct animation classes for right side', () => {
      render(<TestSheet side="right" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('data-[state=open]:animate-fade-in-up');
    });
  });

  describe('Size Variants', () => {
    test('applies correct max-width for left/right sm', () => {
      render(<TestSheet side="right" size="sm" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-sm');
    });

    test('applies correct max-width for left/right md', () => {
      render(<TestSheet side="left" size="md" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md');
    });

    test('applies correct max-width for left/right lg', () => {
      render(<TestSheet side="right" size="lg" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-lg');
    });

    test('applies correct max-height for top/bottom sm', () => {
      render(<TestSheet side="bottom" size="sm" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-h-[30vh]');
    });

    test('applies correct max-height for top/bottom md', () => {
      render(<TestSheet side="top" size="md" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-h-[50vh]');
    });

    test('applies correct max-height for top/bottom lg', () => {
      render(<TestSheet side="bottom" size="lg" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-h-[70vh]');
    });

    test('supports size="auto"', () => {
      render(<TestSheet side="right" size="auto" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('w-auto');
    });
  });

  describe('Focus Management', () => {
    test('focus moves to content when opened', async () => {
      render(<TestSheet />);

      await waitFor(() => {
        // Radix focuses first focusable element - the close button
        const closeButton = screen.getByLabelText('Close');
        expect(closeButton).toHaveFocus();
      });
    });

    test('focus trapped within sheet', async () => {
      const user = userEvent.setup();

      render(
        <Sheet open={true} onOpenChange={jest.fn()}>
          <Sheet.Content side="bottom" showCloseButton={false}>
            <Sheet.Title>Focus Test</Sheet.Title>
            <button data-testid="btn-first">First</button>
            <button data-testid="btn-second">Second</button>
            <button data-testid="btn-third">Third</button>
          </Sheet.Content>
        </Sheet>
      );

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

    test('focus returns to trigger on close', async () => {
      const user = userEvent.setup();
      let isOpen = true;

      const { rerender } = render(
        <Sheet open={isOpen} onOpenChange={(open) => { isOpen = open; }}>
          <Sheet.Trigger asChild>
            <button data-testid="trigger">Open</button>
          </Sheet.Trigger>
          <Sheet.Content side="bottom">
            <Sheet.Title>Close Test</Sheet.Title>
          </Sheet.Content>
        </Sheet>
      );

      // Verify sheet is open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press escape to close
      await user.keyboard('{Escape}');

      // Rerender with closed state
      rerender(
        <Sheet open={false} onOpenChange={() => {}}>
          <Sheet.Trigger asChild>
            <button data-testid="trigger">Open</button>
          </Sheet.Trigger>
          <Sheet.Content side="bottom">
            <Sheet.Title>Close Test</Sheet.Title>
          </Sheet.Content>
        </Sheet>
      );

      await waitFor(() => {
        expect(screen.getByTestId('trigger')).toHaveFocus();
      });
    });
  });

  describe('Accessibility', () => {
    test('has role="dialog"', () => {
      render(<TestSheet />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    test('has aria-modal="true"', () => {
      render(<TestSheet />);
      const dialog = screen.getByRole('dialog');
      // Radix implements modal behavior via focus trap
      expect(dialog).toHaveAttribute('tabindex', '-1');
    });

    test('title connected via aria-labelledby', () => {
      render(<TestSheet />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    test('description connected via aria-describedby', () => {
      render(<TestSheet />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    test('passes axe accessibility audit', async () => {
      const { container } = render(<TestSheet />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Close Button', () => {
    test('renders by default', () => {
      render(<TestSheet />);
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    test('can be hidden with showCloseButton={false}', () => {
      render(<TestSheet showCloseButton={false} />);
      const closeButton = screen.queryByLabelText('Close');
      // No close button with aria-label="Close" should exist
      expect(closeButton).not.toBeInTheDocument();
    });

    test('has accessible label (sr-only "Close")', () => {
      render(<TestSheet />);
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
      // Check for sr-only span
      const srOnlySpan = closeButton.querySelector('.sr-only');
      expect(srOnlySpan).toBeInTheDocument();
      expect(srOnlySpan).toHaveTextContent('Close');
    });

    test('renders X icon', () => {
      render(<TestSheet />);
      const closeButton = screen.getByLabelText('Close');
      const svg = closeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Compound Variants', () => {
    test('bottom + sm = max-h-[30vh]', () => {
      render(<TestSheet side="bottom" size="sm" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-h-[30vh]');
    });

    test('right + lg = max-w-lg', () => {
      render(<TestSheet side="right" size="lg" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-lg');
    });

    test('left + md = max-w-md', () => {
      render(<TestSheet side="left" size="md" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md');
    });

    test('top + lg = max-h-[70vh]', () => {
      render(<TestSheet side="top" size="lg" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-h-[70vh]');
    });
  });

  describe('iOS Safe Area', () => {
    test('bottom sheet has pb-safe class', () => {
      render(<TestSheet side="bottom" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('pb-safe');
    });

    test('other sides do not have pb-safe class', () => {
      render(<TestSheet side="right" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveClass('pb-safe');
    });
  });

  describe('Custom className', () => {
    test('applies custom className to content', () => {
      render(<TestSheet className="custom-sheet-class" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-sheet-class');
    });
  });

  describe('Animation Classes', () => {
    test('overlay has fade-in animation class', () => {
      render(<TestSheet />);
      const overlay = document.querySelector('.backdrop-blur-md');
      expect(overlay).toHaveClass('data-[state=open]:animate-fade-in');
    });

    test('content has slide animation for vertical sides', () => {
      render(<TestSheet side="bottom" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('data-[state=open]:animate-slide-in-from-bottom');
    });

    test('content has fade animation for horizontal sides', () => {
      render(<TestSheet side="left" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('data-[state=open]:animate-fade-in-up');
    });
  });

  describe('Namespace Components', () => {
    test('Sheet.Trigger is available', () => {
      expect(Sheet.Trigger).toBeDefined();
    });

    test('Sheet.Content is available', () => {
      expect(Sheet.Content).toBeDefined();
    });

    test('Sheet.Header is available', () => {
      expect(Sheet.Header).toBeDefined();
    });

    test('Sheet.Footer is available', () => {
      expect(Sheet.Footer).toBeDefined();
    });

    test('Sheet.Title is available', () => {
      expect(Sheet.Title).toBeDefined();
    });

    test('Sheet.Description is available', () => {
      expect(Sheet.Description).toBeDefined();
    });

    test('Sheet.Close is available', () => {
      expect(Sheet.Close).toBeDefined();
    });
  });

  describe('Named Exports', () => {
    test('SheetTrigger is exported', () => {
      expect(SheetTrigger).toBeDefined();
    });

    test('SheetContent is exported', () => {
      expect(SheetContent).toBeDefined();
    });

    test('SheetHeader is exported', () => {
      expect(SheetHeader).toBeDefined();
    });

    test('SheetFooter is exported', () => {
      expect(SheetFooter).toBeDefined();
    });

    test('SheetTitle is exported', () => {
      expect(SheetTitle).toBeDefined();
    });

    test('SheetDescription is exported', () => {
      expect(SheetDescription).toBeDefined();
    });

    test('SheetClose is exported', () => {
      expect(SheetClose).toBeDefined();
    });
  });

  describe('Ref Forwarding', () => {
    test('SheetContent forwards ref', () => {
      const ref = { current: null };
      render(
        <Sheet open={true} onOpenChange={jest.fn()}>
          <Sheet.Content ref={ref} side="bottom">
            <Sheet.Title>Title</Sheet.Title>
          </Sheet.Content>
        </Sheet>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('SheetHeader forwards ref', () => {
      const ref = { current: null };
      render(
        <Sheet open={true} onOpenChange={jest.fn()}>
          <Sheet.Content side="bottom">
            <Sheet.Title>Title</Sheet.Title>
            <Sheet.Header ref={ref}>Header</Sheet.Header>
          </Sheet.Content>
        </Sheet>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('SheetFooter forwards ref', () => {
      const ref = { current: null };
      render(
        <Sheet open={true} onOpenChange={jest.fn()}>
          <Sheet.Content side="bottom">
            <Sheet.Title>Title</Sheet.Title>
            <Sheet.Footer ref={ref}>Footer</Sheet.Footer>
          </Sheet.Content>
        </Sheet>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('SheetTitle forwards ref', () => {
      const ref = { current: null };
      render(
        <Sheet open={true} onOpenChange={jest.fn()}>
          <Sheet.Content side="bottom">
            <Sheet.Title ref={ref}>Title</Sheet.Title>
          </Sheet.Content>
        </Sheet>
      );
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    test('SheetDescription forwards ref', () => {
      const ref = { current: null };
      render(
        <Sheet open={true} onOpenChange={jest.fn()}>
          <Sheet.Content side="bottom">
            <Sheet.Title>Title</Sheet.Title>
            <Sheet.Description ref={ref}>Description</Sheet.Description>
          </Sheet.Content>
        </Sheet>
      );
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('Styling', () => {
    test('Sheet.Header has correct layout classes', () => {
      render(<TestSheet />);
      const header = document.querySelector('.space-y-2');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('mb-4');
    });

    test('Sheet.Title renders with correct typography', () => {
      render(<TestSheet />);
      expect(screen.getByText('Test Sheet')).toHaveClass('text-xl');
      expect(screen.getByText('Test Sheet')).toHaveClass('font-semibold');
    });

    test('Sheet.Description renders with muted styling', () => {
      render(<TestSheet />);
      expect(screen.getByText('This is a test description')).toHaveClass('text-sm');
      expect(screen.getByText('This is a test description')).toHaveClass('text-slate-400');
    });

    test('Sheet.Footer has correct layout classes', () => {
      render(<TestSheet />);
      const footer = document.querySelector('.justify-end');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('gap-3');
      expect(footer).toHaveClass('mt-6');
    });
  });
});
