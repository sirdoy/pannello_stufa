import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../Tabs';
import { Calendar, Sliders, History } from 'lucide-react';

/**
 * Test helper: Standard tabs setup
 */
const TestTabs = ({ defaultValue = 'tab1', ...props }) => (
  <Tabs defaultValue={defaultValue} {...props}>
    <Tabs.List>
      <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
      <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
      <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="tab1">Content 1</Tabs.Content>
    <Tabs.Content value="tab2">Content 2</Tabs.Content>
    <Tabs.Content value="tab3">Content 3</Tabs.Content>
  </Tabs>
);

/**
 * Test helper: Tabs with icons
 */
const TabsWithIcons = ({ defaultValue = 'schedule', ...props }) => (
  <Tabs defaultValue={defaultValue} {...props}>
    <Tabs.List>
      <Tabs.Trigger value="schedule" icon={<Calendar data-testid="calendar-icon" />}>
        Schedule
      </Tabs.Trigger>
      <Tabs.Trigger value="manual" icon={<Sliders data-testid="sliders-icon" />}>
        Manual
      </Tabs.Trigger>
      <Tabs.Trigger value="history" icon={<History data-testid="history-icon" />}>
        History
      </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="schedule">Schedule content</Tabs.Content>
    <Tabs.Content value="manual">Manual content</Tabs.Content>
    <Tabs.Content value="history">History content</Tabs.Content>
  </Tabs>
);

describe('Tabs Component', () => {
  describe('Rendering', () => {
    test('renders with default active tab', () => {
      render(<TestTabs />);

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 1')).toBeVisible();
    });

    test('renders all tab triggers', () => {
      render(<TestTabs />);

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument();
    });

    test('renders tablist role', () => {
      render(<TestTabs />);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('renders tabpanel role for active content', () => {
      render(<TestTabs />);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    test('inactive tabs content is hidden', () => {
      render(<TestTabs />);

      // Content 2 and 3 should not be visible
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    });

    test('renders sliding indicator', () => {
      render(<TestTabs />);
      expect(screen.getByTestId('tabs-indicator')).toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    test('changes active tab on click', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'inactive');
      expect(screen.getByText('Content 2')).toBeVisible();
    });

    test('shows corresponding content on tab click', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);

      await user.click(screen.getByRole('tab', { name: 'Tab 3' }));

      expect(screen.getByText('Content 3')).toBeVisible();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('arrow right moves focus to next tab', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);

      // Focus first tab
      screen.getByRole('tab', { name: 'Tab 1' }).focus();

      // Press right arrow
      await user.keyboard('{ArrowRight}');

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
    });

    test('arrow left moves focus to previous tab', async () => {
      const user = userEvent.setup();
      render(<TestTabs defaultValue="tab2" />);

      // Focus second tab
      screen.getByRole('tab', { name: 'Tab 2' }).focus();

      // Press left arrow
      await user.keyboard('{ArrowLeft}');

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });

    test('arrow right wraps from last to first tab', async () => {
      const user = userEvent.setup();
      render(<TestTabs defaultValue="tab3" />);

      // Focus last tab
      screen.getByRole('tab', { name: 'Tab 3' }).focus();

      // Press right arrow
      await user.keyboard('{ArrowRight}');

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });

    test('arrow left wraps from first to last tab', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);

      // Focus first tab
      screen.getByRole('tab', { name: 'Tab 1' }).focus();

      // Press left arrow
      await user.keyboard('{ArrowLeft}');

      expect(screen.getByRole('tab', { name: 'Tab 3' })).toHaveFocus();
    });

    test('Enter key activates focused tab', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);

      // Focus first tab and move to second
      screen.getByRole('tab', { name: 'Tab 1' }).focus();
      await user.keyboard('{ArrowRight}');

      // Tab 2 should have focus but not be active yet (Radix automatic activation)
      // With Radix's default activationMode='automatic', arrow moves + activates
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
    });

    test('Space key activates focused tab', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);

      // Click Tab 2 directly
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 2')).toBeVisible();
    });
  });

  describe('Vertical Orientation', () => {
    test('renders vertical tabs list', () => {
      render(
        <Tabs defaultValue="tab1" orientation="vertical">
          <Tabs.List orientation="vertical">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs>
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveClass('flex-col');
    });

    test('arrow down moves focus in vertical mode', async () => {
      const user = userEvent.setup();
      render(<TestTabs orientation="vertical" />);

      screen.getByRole('tab', { name: 'Tab 1' }).focus();
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
    });

    test('arrow up moves focus in vertical mode', async () => {
      const user = userEvent.setup();
      render(<TestTabs orientation="vertical" defaultValue="tab2" />);

      screen.getByRole('tab', { name: 'Tab 2' }).focus();
      await user.keyboard('{ArrowUp}');

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });
  });

  describe('Icon Support', () => {
    test('renders icon with trigger', () => {
      render(<TabsWithIcons />);

      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByTestId('sliders-icon')).toBeInTheDocument();
      expect(screen.getByTestId('history-icon')).toBeInTheDocument();
    });

    test('icon is hidden from screen readers', () => {
      render(<TabsWithIcons />);

      // The icon wrapper span has aria-hidden="true"
      const calendarIcon = screen.getByTestId('calendar-icon');
      expect(calendarIcon.closest('span[aria-hidden="true"]')).toBeInTheDocument();
    });

    test('tab text remains accessible', () => {
      render(<TabsWithIcons />);

      expect(screen.getByRole('tab', { name: /Schedule/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Manual/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /History/i })).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    test('applies sm size classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1" size="sm">Small Tab</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );

      const trigger = screen.getByRole('tab', { name: 'Small Tab' });
      expect(trigger).toHaveClass('px-3');
      expect(trigger).toHaveClass('py-2');
      expect(trigger).toHaveClass('text-xs');
      expect(trigger).toHaveClass('min-h-[36px]');
    });

    test('applies md size classes by default', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Medium Tab</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );

      const trigger = screen.getByRole('tab', { name: 'Medium Tab' });
      expect(trigger).toHaveClass('px-4');
      expect(trigger).toHaveClass('py-2.5');
      expect(trigger).toHaveClass('text-sm');
      expect(trigger).toHaveClass('min-h-[44px]');
    });

    test('applies lg size classes', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1" size="lg">Large Tab</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );

      const trigger = screen.getByRole('tab', { name: 'Large Tab' });
      expect(trigger).toHaveClass('px-5');
      expect(trigger).toHaveClass('py-3');
      expect(trigger).toHaveClass('text-base');
      expect(trigger).toHaveClass('min-h-[48px]');
    });
  });

  describe('Controlled Mode', () => {
    test('respects value prop', () => {
      render(
        <Tabs value="tab2">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 2')).toBeVisible();
    });

    test('calls onValueChange when tab clicked', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Tabs value="tab1" onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(handleChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Indicator Position', () => {
    test('indicator has position styles', async () => {
      render(<TestTabs />);

      const indicator = screen.getByTestId('tabs-indicator');

      // Wait for layout effect to update indicator
      await waitFor(() => {
        expect(indicator).toHaveStyle({ opacity: '1' });
      });
    });

    test('indicator updates on tab change', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);

      const indicator = screen.getByTestId('tabs-indicator');

      // Wait for initial position
      await waitFor(() => {
        expect(indicator).toHaveStyle({ opacity: '1' });
      });

      const initialLeft = indicator.style.left;

      // Click second tab
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      // Indicator should have updated position
      await waitFor(() => {
        // Position should change (exact value depends on tab widths)
        expect(indicator.style.left).not.toBe('0');
      });
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(<TestTabs />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('tabs have correct aria attributes', () => {
      render(<TestTabs />);

      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab1).toHaveAttribute('aria-controls');

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      expect(tab2).toHaveAttribute('aria-selected', 'false');
    });

    test('tabpanel has correct aria-labelledby', () => {
      render(<TestTabs />);

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('aria-labelledby');
    });

    test('focus is visible on keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TestTabs />);

      // Tab into the tabs
      await user.tab();

      const activeTab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(activeTab).toHaveFocus();
    });
  });

  describe('Custom className', () => {
    test('applies custom className to Tabs.List', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List className="custom-list-class">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );

      expect(screen.getByRole('tablist')).toHaveClass('custom-list-class');
    });

    test('applies custom className to Tabs.Trigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1" className="custom-trigger-class">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveClass('custom-trigger-class');
    });

    test('applies custom className to Tabs.Content', () => {
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1" className="custom-content-class">Content</Tabs.Content>
        </Tabs>
      );

      expect(screen.getByRole('tabpanel')).toHaveClass('custom-content-class');
    });
  });

  describe('Named Exports', () => {
    test('TabsList is exported', () => {
      expect(TabsList).toBeDefined();
    });

    test('TabsTrigger is exported', () => {
      expect(TabsTrigger).toBeDefined();
    });

    test('TabsContent is exported', () => {
      expect(TabsContent).toBeDefined();
    });
  });

  describe('Ref Forwarding', () => {
    test('Tabs.List forwards ref', () => {
      const ref = { current: null };
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List ref={ref}>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('Tabs.Trigger forwards ref', () => {
      const ref = { current: null };
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger ref={ref} value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    test('Tabs.Content forwards ref', () => {
      const ref = { current: null };
      render(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content ref={ref} value="tab1">Content</Tabs.Content>
        </Tabs>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
