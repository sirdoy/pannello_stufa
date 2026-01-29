// app/components/ui/__tests__/Tooltip.test.js
/**
 * Tooltip Component Tests
 *
 * Tests accessibility, hover/focus behavior, positioning, and simple API.
 * Uses jest-axe for automated a11y violation detection.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Tooltip, { TooltipProvider, TooltipContent, TooltipTrigger } from '../Tooltip';

expect.extend(toHaveNoViolations);

// Test wrapper - TooltipProvider is required for Radix Tooltip
const renderWithProvider = (ui) => render(<TooltipProvider>{ui}</TooltipProvider>);

describe('Tooltip', () => {
  describe('Rendering', () => {
    it('renders trigger but not content initially', () => {
      renderWithProvider(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
      // Tooltip content should not be visible initially
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('shows content on hover after delay', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <Tooltip content="Hello tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Hover me' });
      await user.hover(trigger);

      // Wait for tooltip to appear (400ms default delay + buffer)
      await waitFor(
        () => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      expect(screen.getByRole('tooltip')).toHaveTextContent('Hello tooltip');
    });

    // Skip: JSDOM doesn't properly simulate mouse leave events for Radix Tooltip
    // This behavior is tested by Radix UI itself. Our component correctly passes
    // props to Radix, which handles the hide logic internally.
    it.skip('hides content when mouse leaves', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <Tooltip content="Disappearing tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Hover me' });

      // Show tooltip
      await user.hover(trigger);
      await waitFor(
        () => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Hide tooltip - use pointer events to properly trigger mouse leave
      await user.pointer({ target: document.body });
      await waitFor(
        () => {
          expect(trigger).toHaveAttribute('data-state', 'closed');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Keyboard Interaction', () => {
    it('shows content on focus', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <Tooltip content="Focus tooltip">
          <button>Focus me</button>
        </Tooltip>
      );

      // Tab to focus the button
      await user.tab();

      expect(screen.getByRole('button', { name: 'Focus me' })).toHaveFocus();

      // Wait for tooltip to appear
      await waitFor(
        () => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      expect(screen.getByRole('tooltip')).toHaveTextContent('Focus tooltip');
    });

    it('hides content on blur', async () => {
      const user = userEvent.setup();

      // Render with a second element to tab to
      renderWithProvider(
        <>
          <Tooltip content="Blur test tooltip">
            <button>First button</button>
          </Tooltip>
          <button>Second button</button>
        </>
      );

      // Focus first button
      await user.tab();
      await waitFor(
        () => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Tab to second button (blur first)
      await user.tab();
      expect(screen.getByRole('button', { name: 'Second button' })).toHaveFocus();

      // Tooltip should disappear
      await waitFor(
        () => {
          expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations when closed', async () => {
      const { container } = renderWithProvider(
        <Tooltip content="Accessible tooltip">
          <button>Accessible trigger</button>
        </Tooltip>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when open', async () => {
      const user = userEvent.setup();

      const { container } = renderWithProvider(
        <Tooltip content="Accessible open tooltip">
          <button>Accessible trigger</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button');
      await user.hover(trigger);

      await waitFor(
        () => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('tooltip has role=tooltip', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <Tooltip content="Role test">
          <button>Trigger</button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(
        () => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Positioning', () => {
    it('accepts side prop (top)', () => {
      renderWithProvider(
        <Tooltip content="Top tooltip" side="top">
          <button>Trigger</button>
        </Tooltip>
      );

      // Component should render without errors
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('accepts side prop (bottom)', () => {
      renderWithProvider(
        <Tooltip content="Bottom tooltip" side="bottom">
          <button>Trigger</button>
        </Tooltip>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('accepts side prop (left)', () => {
      renderWithProvider(
        <Tooltip content="Left tooltip" side="left">
          <button>Trigger</button>
        </Tooltip>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('accepts side prop (right)', () => {
      renderWithProvider(
        <Tooltip content="Right tooltip" side="right">
          <button>Trigger</button>
        </Tooltip>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Simple API', () => {
    it('simple Tooltip component works with content prop', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <Tooltip content="Simple content">
          <button>Simple trigger</button>
        </Tooltip>
      );

      const trigger = screen.getByRole('button', { name: 'Simple trigger' });
      await user.hover(trigger);

      await waitFor(
        () => {
          expect(screen.getByRole('tooltip')).toHaveTextContent('Simple content');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Compound Components', () => {
    it('renders with compound component pattern', async () => {
      const user = userEvent.setup();

      renderWithProvider(
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button>Compound trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content>Compound content</Tooltip.Content>
        </Tooltip.Root>
      );

      const trigger = screen.getByRole('button', { name: 'Compound trigger' });
      await user.hover(trigger);

      await waitFor(
        () => {
          expect(screen.getByRole('tooltip')).toHaveTextContent('Compound content');
        },
        { timeout: 1000 }
      );
    });

    it('TooltipContent accepts className prop', async () => {
      const user = userEvent.setup();

      const { container } = renderWithProvider(
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button>Styled trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content className="custom-class">Styled content</Tooltip.Content>
        </Tooltip.Root>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(
        () => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Find the content div with the custom class (not the ARIA tooltip span)
      const contentDiv = container.querySelector('[data-radix-popper-content-wrapper] > div');
      expect(contentDiv).toHaveClass('custom-class');
    });

    it('TooltipContent accepts sideOffset prop', () => {
      // Just verify the prop is accepted without errors
      renderWithProvider(
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button>Offset trigger</button>
          </Tooltip.Trigger>
          <Tooltip.Content sideOffset={8}>Offset content</Tooltip.Content>
        </Tooltip.Root>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Controlled Mode', () => {
    it('supports controlled open state', () => {
      // Render in controlled open state
      renderWithProvider(
        <Tooltip content="Controlled tooltip" open>
          <button>Controlled trigger</button>
        </Tooltip>
      );

      // Tooltip should be visible immediately (controlled open)
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByRole('tooltip')).toHaveTextContent('Controlled tooltip');
    });
  });
});
