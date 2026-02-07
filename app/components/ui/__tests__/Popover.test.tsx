// app/components/ui/__tests__/Popover.test.tsx
/**
 * Popover Component Tests
 *
 * Tests accessibility, click/hover behavior, positioning, size variants, and arrow.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Popover, {
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverArrow,
} from '../Popover';

expect.extend(toHaveNoViolations);

/**
 * Test helper: Basic Popover structure using asChild pattern
 */
const TestPopover = ({
  triggerMode = 'click',
  size = 'md',
  arrow = false,
  children,
  ...props
}) => (
  <Popover triggerMode={triggerMode} {...props}>
    <Popover.Trigger asChild>
      <button type="button" data-testid="popover-trigger">Open Popover</button>
    </Popover.Trigger>
    <Popover.Content size={size} arrow={arrow} data-testid="popover-content">
      {children || <p>Popover content</p>}
    </Popover.Content>
  </Popover>
);

describe('Popover Component', () => {
  describe('Rendering', () => {
    it('renders trigger without content when closed', () => {
      render(<TestPopover />);

      expect(screen.getByRole('button', { name: 'Open Popover' })).toBeInTheDocument();
      expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
    });

    it('renders content when open (controlled)', () => {
      render(<TestPopover open={true} />);

      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
  });

  describe('Click Trigger Mode', () => {
    it('opens on trigger click', async () => {
      const user = userEvent.setup();

      render(<TestPopover />);

      expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      });
    });

    it('closes on trigger click when open', async () => {
      const user = userEvent.setup();

      render(<TestPopover />);

      // Open
      await user.click(screen.getByRole('button', { name: 'Open Popover' }));
      await waitFor(() => {
        expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      });

      // Close
      await user.click(screen.getByRole('button', { name: 'Open Popover' }));
      await waitFor(() => {
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
      });
    });

    it('calls onOpenChange when state changes', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();

      render(<TestPopover onOpenChange={handleOpenChange} />);

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes on Escape key', async () => {
      const user = userEvent.setup();

      render(<TestPopover />);

      // Open popover
      await user.click(screen.getByRole('button', { name: 'Open Popover' }));
      await waitFor(() => {
        expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
      });
    });

    it('trigger is focusable via keyboard', async () => {
      const user = userEvent.setup();

      render(
        <>
          <button>Before</button>
          <TestPopover />
          <button>After</button>
        </>
      );

      // Tab to first button
      await user.tab();
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();

      // Tab to popover trigger
      await user.tab();
      expect(screen.getByRole('button', { name: 'Open Popover' })).toHaveFocus();

      // Tab to next button
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });
  });

  describe('Click Outside', () => {
    it('closes on click outside', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <TestPopover />
          <button data-testid="outside-button">Outside</button>
        </div>
      );

      // Open popover
      await user.click(screen.getByRole('button', { name: 'Open Popover' }));
      await waitFor(() => {
        expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      });

      // Click outside
      await user.click(screen.getByTestId('outside-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
      });
    });

    it('does not close on content click', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <Popover.Trigger asChild>
            <button>Open</button>
          </Popover.Trigger>
          <Popover.Content>
            <button data-testid="inside-button">Inside Button</button>
          </Popover.Content>
        </Popover>
      );

      // Open popover
      await user.click(screen.getByRole('button', { name: 'Open' }));
      await waitFor(() => {
        expect(screen.getByTestId('inside-button')).toBeInTheDocument();
      });

      // Click inside content
      await user.click(screen.getByTestId('inside-button'));

      // Should still be open
      expect(screen.getByTestId('inside-button')).toBeInTheDocument();
    });
  });

  describe('Hover Trigger Mode', () => {
    it('supports hover trigger mode via controlled state', () => {
      // Test that hover mode renders with controlled open state
      render(<TestPopover triggerMode="hover" open={true} />);

      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    });

    it('wraps children in div for hover mode', () => {
      render(<TestPopover triggerMode="hover" />);

      const trigger = screen.getByTestId('popover-trigger');
      // In hover mode, trigger is wrapped in a div with inline-block style
      expect(trigger.parentElement).toHaveStyle('display: inline-block');
    });

    it('does not wrap children in click mode', () => {
      render(<TestPopover triggerMode="click" />);

      const trigger = screen.getByTestId('popover-trigger');
      // In click mode, no wrapper div
      expect(trigger.parentElement).not.toHaveStyle('display: inline-block');
    });
  });

  describe('Size Variants', () => {
    it.each([
      ['sm', 'max-w-xs'],
      ['md', 'max-w-sm'],
      ['lg', 'max-w-md'],
    ])('applies %s size variant with %s class', async (size, expectedClass) => {
      const user = userEvent.setup();

      render(<TestPopover size={size} />);

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        const content = screen.getByTestId('popover-content');
        expect(content).toHaveClass(expectedClass);
      });
    });

    it('defaults to md size', async () => {
      const user = userEvent.setup();

      render(<TestPopover />);

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        const content = screen.getByTestId('popover-content');
        expect(content).toHaveClass('max-w-sm');
      });
    });
  });

  describe('Arrow', () => {
    it('renders arrow when arrow={true}', async () => {
      const user = userEvent.setup();

      render(<TestPopover arrow={true} />);

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      });

      // Arrow is an SVG rendered by Radix
      const content = screen.getByTestId('popover-content');
      const arrow = content.querySelector('svg');
      expect(arrow).toBeInTheDocument();
    });

    it('does not render arrow when arrow={false}', async () => {
      const user = userEvent.setup();

      render(<TestPopover arrow={false} />);

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      });

      const content = screen.getByTestId('popover-content');
      const arrow = content.querySelector('svg');
      expect(arrow).not.toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('accepts side prop', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <Popover.Trigger asChild>
            <button>Open</button>
          </Popover.Trigger>
          <Popover.Content side="top">Content</Popover.Content>
        </Popover>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('accepts align prop', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <Popover.Trigger asChild>
            <button>Open</button>
          </Popover.Trigger>
          <Popover.Content align="start">Content</Popover.Content>
        </Popover>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('accepts sideOffset prop', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <Popover.Trigger asChild>
            <button>Open</button>
          </Popover.Trigger>
          <Popover.Content sideOffset={8}>Content</Popover.Content>
        </Popover>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });
  });

  describe('PopoverClose', () => {
    it('closes popover when clicked', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <Popover.Trigger asChild>
            <button>Open</button>
          </Popover.Trigger>
          <Popover.Content>
            <p>Content</p>
            <Popover.Close data-testid="close-button">Close</Popover.Close>
          </Popover.Content>
        </Popover>
      );

      // Open
      await user.click(screen.getByRole('button', { name: 'Open' }));
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      // Click close button
      await user.click(screen.getByTestId('close-button'));

      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('has focus-visible ring styling', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <Popover.Trigger asChild>
            <button>Open</button>
          </Popover.Trigger>
          <Popover.Content>
            <Popover.Close data-testid="close-button">Close</Popover.Close>
          </Popover.Content>
        </Popover>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      await waitFor(() => {
        const closeButton = screen.getByTestId('close-button');
        expect(closeButton).toHaveClass('focus-visible:ring-2');
        expect(closeButton).toHaveClass('focus-visible:ring-ember-500/50');
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations when closed', async () => {
      const { container } = render(<TestPopover />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when open with aria-label', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <Popover>
          <Popover.Trigger asChild>
            <button>Open</button>
          </Popover.Trigger>
          <Popover.Content aria-label="Popover content">
            <p>Content</p>
          </Popover.Content>
        </Popover>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('trigger has aria-expanded attribute', async () => {
      const user = userEvent.setup();

      render(<TestPopover />);

      const trigger = screen.getByTestId('popover-trigger');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Named Exports', () => {
    it('exports PopoverTrigger', () => {
      expect(PopoverTrigger).toBeDefined();
    });

    it('exports PopoverContent', () => {
      expect(PopoverContent).toBeDefined();
    });

    it('exports PopoverClose', () => {
      expect(PopoverClose).toBeDefined();
    });

    it('exports PopoverArrow', () => {
      expect(PopoverArrow).toBeDefined();
    });
  });

  describe('Namespace Components', () => {
    it('Popover.Trigger is attached', () => {
      expect(Popover.Trigger).toBeDefined();
    });

    it('Popover.Content is attached', () => {
      expect(Popover.Content).toBeDefined();
    });

    it('Popover.Close is attached', () => {
      expect(Popover.Close).toBeDefined();
    });

    it('Popover.Arrow is attached', () => {
      expect(Popover.Arrow).toBeDefined();
    });
  });

  describe('Styling', () => {
    it('content has Ember Noir styling classes', async () => {
      const user = userEvent.setup();

      render(<TestPopover />);

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        const content = screen.getByTestId('popover-content');
        expect(content).toHaveClass('bg-slate-900/95');
        expect(content).toHaveClass('backdrop-blur-xl');
        expect(content).toHaveClass('rounded-2xl');
        expect(content).toHaveClass('border');
      });
    });

    it('content has animation classes', async () => {
      const user = userEvent.setup();

      render(<TestPopover />);

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        const content = screen.getByTestId('popover-content');
        expect(content).toHaveClass('data-[state=open]:animate-scale-in');
        expect(content).toHaveClass('data-[state=closed]:animate-fade-out');
      });
    });

    it('content has reduced motion support', async () => {
      const user = userEvent.setup();

      render(<TestPopover />);

      await user.click(screen.getByRole('button', { name: 'Open Popover' }));

      await waitFor(() => {
        const content = screen.getByTestId('popover-content');
        expect(content).toHaveClass('motion-reduce:animate-none');
      });
    });
  });

  describe('Custom className', () => {
    it('applies custom className to content', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <Popover.Trigger asChild>
            <button>Open</button>
          </Popover.Trigger>
          <Popover.Content className="custom-popover-class" data-testid="custom-content">
            <span>Content</span>
          </Popover.Content>
        </Popover>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      await waitFor(() => {
        const content = screen.getByTestId('custom-content');
        expect(content).toHaveClass('custom-popover-class');
      });
    });
  });
});
