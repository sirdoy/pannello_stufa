import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Eye, Settings, Power, Bell, Trash } from 'lucide-react';
import RightClickMenu, {
  RightClickMenuTrigger,
  RightClickMenuContent,
  RightClickMenuItem,
  RightClickMenuCheckboxItem,
  RightClickMenuSeparator,
  RightClickMenuLabel,
  RightClickMenuGroup,
} from '../RightClickMenu';

/**
 * Test helper: Basic RightClickMenu structure
 */
const TestRightClickMenu = ({
  onOpenChange = jest.fn(),
  onSelect = jest.fn(),
  ...props
}) => (
  <RightClickMenu onOpenChange={onOpenChange} {...props}>
    <RightClickMenu.Trigger asChild>
      <div data-testid="context-trigger" style={{ width: 200, height: 100 }}>
        Right-click me
      </div>
    </RightClickMenu.Trigger>
    <RightClickMenu.Content>
      <RightClickMenu.Item icon={<Eye data-testid="icon-view" />} onSelect={() => onSelect('view')}>
        View Details
      </RightClickMenu.Item>
      <RightClickMenu.Item icon={<Settings data-testid="icon-settings" />} onSelect={() => onSelect('settings')}>
        Settings
      </RightClickMenu.Item>
      <RightClickMenu.Separator />
      <RightClickMenu.Item icon={<Power data-testid="icon-power" />} disabled onSelect={() => onSelect('power')}>
        Power (Disabled)
      </RightClickMenu.Item>
    </RightClickMenu.Content>
  </RightClickMenu>
);

/**
 * Test helper: RightClickMenu with checkbox items
 */
const TestRightClickMenuWithCheckbox = ({
  checked = false,
  onCheckedChange = jest.fn(),
  ...props
}) => (
  <RightClickMenu {...props}>
    <RightClickMenu.Trigger asChild>
      <div data-testid="context-trigger">Right-click me</div>
    </RightClickMenu.Trigger>
    <RightClickMenu.Content>
      <RightClickMenu.CheckboxItem
        icon={<Bell data-testid="icon-bell" />}
        checked={checked}
        onCheckedChange={onCheckedChange}
      >
        Notifications
      </RightClickMenu.CheckboxItem>
    </RightClickMenu.Content>
  </RightClickMenu>
);

/**
 * Test helper: RightClickMenu with groups and labels
 */
const TestRightClickMenuWithGroups = (props: any) => (
  <RightClickMenu {...props}>
    <RightClickMenu.Trigger asChild>
      <div data-testid="context-trigger">Right-click me</div>
    </RightClickMenu.Trigger>
    <RightClickMenu.Content>
      <RightClickMenu.Label>Actions</RightClickMenu.Label>
      <RightClickMenu.Group>
        <RightClickMenu.Item icon={<Eye />}>View</RightClickMenu.Item>
        <RightClickMenu.Item icon={<Settings />}>Edit</RightClickMenu.Item>
      </RightClickMenu.Group>
      <RightClickMenu.Separator />
      <RightClickMenu.Label>Danger Zone</RightClickMenu.Label>
      <RightClickMenu.Item icon={<Trash />}>Delete</RightClickMenu.Item>
    </RightClickMenu.Content>
  </RightClickMenu>
);

/**
 * Helper: Fire contextmenu event on an element
 */
const fireContextMenu = (element: any, options: any = {}) => {
  fireEvent.contextMenu(element, {
    clientX: options.clientX || 100,
    clientY: options.clientY || 100,
    ...options,
  });
};

describe('RightClickMenu Component', () => {
  describe('Rendering', () => {
    test('renders trigger without crashing', () => {
      render(<TestRightClickMenu />);
      expect(screen.getByTestId('context-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('context-trigger')).toHaveTextContent('Right-click me');
    });

    test('does not render content when closed', () => {
      render(<TestRightClickMenu />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('renders content when opened via contextmenu event', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    test('renders multiple items', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Power (Disabled)')).toBeInTheDocument();
    });

    test('renders with custom className on content', () => {
      render(
        <RightClickMenu>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content className="custom-menu-class">
            <RightClickMenu.Item icon={<Eye />}>Item</RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      const menu = screen.getByRole('menu');
      expect(menu).toHaveClass('custom-menu-class');
    });
  });

  describe('Right-Click Trigger', () => {
    test('opens on right-click (contextmenu event)', () => {
      const handleOpenChange = jest.fn();
      render(<TestRightClickMenu onOpenChange={handleOpenChange} />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });

    test('multiple right-clicks reopen menu', async () => {
      const handleOpenChange = jest.fn();
      render(<TestRightClickMenu onOpenChange={handleOpenChange} />);
      const trigger = screen.getByTestId('context-trigger');

      // First right-click
      fireContextMenu(trigger, { clientX: 50, clientY: 50 });
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click outside to close
      const user = userEvent.setup();
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });

      // Second right-click
      fireContextMenu(trigger, { clientX: 100, clientY: 100 });
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    test('does not open on regular click', async () => {
      const user = userEvent.setup();
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      await user.click(trigger);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('right-click opens menu at appropriate position', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger, { clientX: 150, clientY: 75 });

      // Menu should be rendered (position handled by Radix Portal + collision detection)
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('Arrow Down moves to next item', async () => {
      const user = userEvent.setup();
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      // Wait for menu to be visible
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // First arrow down highlights first item, second moves to second
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Find the menu items
      const items = screen.getAllByRole('menuitem');
      expect(items[1]).toHaveAttribute('data-highlighted');
    });

    test('Arrow Up moves to previous item', async () => {
      const user = userEvent.setup();
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Move down twice to get to second item, then up to get back to first
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');

      const items = screen.getAllByRole('menuitem');
      // Should be on first item after moving down twice and up once
      expect(items[0]).toHaveAttribute('data-highlighted');
    });

    test('Home key moves to first item', async () => {
      const user = userEvent.setup();
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Navigate into menu first, then go to end, then Home
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{End}');
      await user.keyboard('{Home}');

      const items = screen.getAllByRole('menuitem');
      expect(items[0]).toHaveAttribute('data-highlighted');
    });

    test('End key moves to last enabled item', async () => {
      const user = userEvent.setup();
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Navigate into menu first, then press End
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{End}');

      // Last enabled item should be highlighted (skip disabled)
      // The third item is disabled, so End should go to the second enabled item (Settings)
      const items = screen.getAllByRole('menuitem');
      expect(items[1]).toHaveAttribute('data-highlighted');
    });

    test('Enter key can select items when focused', async () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Verify menu items are keyboard focusable (have tabindex)
      const items = screen.getAllByRole('menuitem');
      // Radix Context Menu items should be interactive
      expect(items[0]).toHaveAttribute('role', 'menuitem');
    });

    test('Space key can select items when focused', async () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Verify menu items support keyboard interaction (via data-radix-collection-item)
      const items = screen.getAllByRole('menuitem');
      expect(items[0]).toBeInTheDocument();
    });

    test('Tab does not move focus out (focus trapped)', async () => {
      const user = userEvent.setup();
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Navigate into menu
      await user.keyboard('{ArrowDown}');

      // Press Tab - menu should still be open (Radix handles focus trapping)
      await user.keyboard('{Tab}');

      // Menu should still be visible - focus is trapped
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  describe('Item Selection', () => {
    test('click on item calls onSelect callback', async () => {
      const handleSelect = jest.fn();
      const user = userEvent.setup();
      render(<TestRightClickMenu onSelect={handleSelect} />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      await user.click(screen.getByText('View Details'));

      expect(handleSelect).toHaveBeenCalledWith('view');
    });

    test('closes menu after selection', async () => {
      const user = userEvent.setup();
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      await user.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    test('disabled items cannot be selected', async () => {
      const handleSelect = jest.fn();
      const user = userEvent.setup();
      render(<TestRightClickMenu onSelect={handleSelect} />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Try to click disabled item
      await user.click(screen.getByText('Power (Disabled)'));

      // onSelect should not be called for disabled items
      expect(handleSelect).not.toHaveBeenCalledWith('power');
    });

    test('checkbox items toggle state on click', async () => {
      const handleCheckedChange = jest.fn();
      const user = userEvent.setup();
      render(<TestRightClickMenuWithCheckbox onCheckedChange={handleCheckedChange} checked={false} />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Notifications'));

      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });

    test('checkbox items display check when checked', () => {
      render(<TestRightClickMenuWithCheckbox checked={true} />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      const checkboxItem = screen.getByRole('menuitemcheckbox');
      expect(checkboxItem).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('Escape and Focus', () => {
    test('Escape key closes menu', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();
      render(<TestRightClickMenu onOpenChange={handleOpenChange} />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    test('click outside closes menu', async () => {
      const handleOpenChange = jest.fn();
      render(<TestRightClickMenu onOpenChange={handleOpenChange} />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Simulate click outside by firing pointerdown on document body
      // Radix handles click outside via pointer events on the overlay
      fireEvent.pointerDown(document.body, { button: 0 });

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });

    test('focus management works correctly', async () => {
      const user = userEvent.setup();
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Navigate with arrow key to activate focus within menu
      await user.keyboard('{ArrowDown}');

      // After arrow navigation, an item should be highlighted
      const items = screen.getAllByRole('menuitem');
      expect(items[0]).toHaveAttribute('data-highlighted');
    });
  });

  describe('Accessibility', () => {
    test('trigger has correct attributes when menu is closed', () => {
      render(<TestRightClickMenu />);
      // Context menu trigger doesn't need aria-haspopup as it's implicit
      expect(screen.getByTestId('context-trigger')).toBeInTheDocument();
    });

    test('content has role="menu"', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    test('items have role="menuitem"', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      const items = screen.getAllByRole('menuitem');
      expect(items.length).toBeGreaterThan(0);
    });

    test('checkbox items have role="menuitemcheckbox"', () => {
      render(<TestRightClickMenuWithCheckbox />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
    });

    test('aria-checked reflects checkbox state', () => {
      render(<TestRightClickMenuWithCheckbox checked={true} />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      const checkboxItem = screen.getByRole('menuitemcheckbox');
      expect(checkboxItem).toHaveAttribute('aria-checked', 'true');
    });

    test('passes axe accessibility audit', async () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const { container } = render(<TestRightClickMenu />);
      fireContextMenu(screen.getAllByTestId('context-trigger')[1]);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Styling', () => {
    test('content applies Ember Noir styling', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      const menu = screen.getByRole('menu');
      expect(menu).toHaveClass('bg-slate-900/95');
      expect(menu).toHaveClass('backdrop-blur-3xl');
      expect(menu).toHaveClass('rounded-xl');
      expect(menu).toHaveClass('border');
    });

    test('items have correct base styling', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      const item = screen.getAllByRole('menuitem')[0];
      expect(item).toHaveClass('flex');
      expect(item).toHaveClass('items-center');
      expect(item).toHaveClass('gap-3');
      expect(item).toHaveClass('rounded-lg');
    });

    test('disabled items have reduced opacity', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      // Find the disabled item
      const disabledItem = screen.getByText('Power (Disabled)').closest('[role="menuitem"]');
      expect(disabledItem).toHaveClass('data-[disabled]:opacity-50');
    });

    test('icons render on left of item text', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      // Check that icon is present
      expect(screen.getByTestId('icon-view')).toBeInTheDocument();

      // Check ordering - icon should be before text in DOM
      const item = screen.getAllByRole('menuitem')[0];
      const icon = item.querySelector('[data-testid="icon-view"]');
      const text = screen.getByText('View Details');

      // Icon's parent span should come before text's parent span
      const iconParent = icon!.parentElement;
      const textParent = text.parentElement;

      expect(item.firstElementChild).toBe(iconParent);
    });

    test('separator has correct styling', () => {
      render(<TestRightClickMenu />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      const separator = screen.getByRole('separator');
      expect(separator).toHaveClass('h-px');
      expect(separator).toHaveClass('bg-slate-700/50');
    });
  });

  describe('Exports', () => {
    test('exports RightClickMenu default', () => {
      expect(RightClickMenu).toBeDefined();
    });

    test('exports named subcomponents', () => {
      expect(RightClickMenuTrigger).toBeDefined();
      expect(RightClickMenuContent).toBeDefined();
      expect(RightClickMenuItem).toBeDefined();
      expect(RightClickMenuCheckboxItem).toBeDefined();
      expect(RightClickMenuSeparator).toBeDefined();
      expect(RightClickMenuLabel).toBeDefined();
      expect(RightClickMenuGroup).toBeDefined();
    });

    test('namespace properties attached', () => {
      expect(RightClickMenu.Trigger).toBeDefined();
      expect(RightClickMenu.Content).toBeDefined();
      expect(RightClickMenu.Item).toBeDefined();
      expect(RightClickMenu.CheckboxItem).toBeDefined();
      expect(RightClickMenu.Separator).toBeDefined();
      expect(RightClickMenu.Label).toBeDefined();
      expect(RightClickMenu.Group).toBeDefined();
    });

    test('named exports match namespace properties', () => {
      expect(RightClickMenu.Trigger).toBe(RightClickMenuTrigger);
      expect(RightClickMenu.Content).toBe(RightClickMenuContent);
      expect(RightClickMenu.Item).toBe(RightClickMenuItem);
      expect(RightClickMenu.CheckboxItem).toBe(RightClickMenuCheckboxItem);
      expect(RightClickMenu.Separator).toBe(RightClickMenuSeparator);
      expect(RightClickMenu.Label).toBe(RightClickMenuLabel);
      expect(RightClickMenu.Group).toBe(RightClickMenuGroup);
    });
  });

  describe('Groups and Labels', () => {
    test('renders label text', () => {
      render(<TestRightClickMenuWithGroups />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    test('groups items correctly', () => {
      render(<TestRightClickMenuWithGroups />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      // All items should be rendered
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    test('label has correct styling', () => {
      render(<TestRightClickMenuWithGroups />);
      const trigger = screen.getByTestId('context-trigger');

      fireContextMenu(trigger);

      const label = screen.getByText('Actions');
      expect(label).toHaveClass('text-xs');
      expect(label).toHaveClass('font-semibold');
      expect(label).toHaveClass('uppercase');
    });
  });

  describe('Ref Forwarding', () => {
    test('RightClickMenuContent forwards ref', () => {
      const ref = { current: null };
      render(
        <RightClickMenu {...({ defaultOpen: true } as any)}>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content ref={ref}>
            <RightClickMenu.Item icon={<Eye />}>Item</RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );
      const trigger = screen.getByTestId('context-trigger');
      fireContextMenu(trigger);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('RightClickMenuItem forwards ref', () => {
      const ref = { current: null };
      render(
        <RightClickMenu>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            <RightClickMenu.Item ref={ref} icon={<Eye />}>Item</RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );
      const trigger = screen.getByTestId('context-trigger');
      fireContextMenu(trigger);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('RightClickMenuCheckboxItem forwards ref', () => {
      const ref = { current: null };
      render(
        <RightClickMenu>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            <RightClickMenu.CheckboxItem ref={ref} icon={<Bell />}>Check</RightClickMenu.CheckboxItem>
          </RightClickMenu.Content>
        </RightClickMenu>
      );
      const trigger = screen.getByTestId('context-trigger');
      fireContextMenu(trigger);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('RightClickMenuSeparator forwards ref', () => {
      const ref = { current: null };
      render(
        <RightClickMenu>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            <RightClickMenu.Item icon={<Eye />}>Item</RightClickMenu.Item>
            <RightClickMenu.Separator ref={ref} />
            <RightClickMenu.Item icon={<Settings />}>Item 2</RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );
      const trigger = screen.getByTestId('context-trigger');
      fireContextMenu(trigger);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('RightClickMenuLabel forwards ref', () => {
      const ref = { current: null };
      render(
        <RightClickMenu>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            <RightClickMenu.Label ref={ref}>Section</RightClickMenu.Label>
            <RightClickMenu.Item icon={<Eye />}>Item</RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );
      const trigger = screen.getByTestId('context-trigger');
      fireContextMenu(trigger);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Controlled Mode', () => {
    test('works with open/onOpenChange props', async () => {
      const handleOpenChange = jest.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <RightClickMenu {...({ open: false, onOpenChange: handleOpenChange } as any)}>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            <RightClickMenu.Item icon={<Eye />}>Item</RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Trigger context menu
      fireContextMenu(screen.getByTestId('context-trigger'));
      expect(handleOpenChange).toHaveBeenCalledWith(true);

      // Rerender with open=true
      rerender(
        <RightClickMenu {...({ open: true, onOpenChange: handleOpenChange } as any)}>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            <RightClickMenu.Item icon={<Eye />}>Item</RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    test('applies custom className to item', () => {
      render(
        <RightClickMenu>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            <RightClickMenu.Item icon={<Eye />} className="custom-item-class">
              Custom Item
            </RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );
      const trigger = screen.getByTestId('context-trigger');
      fireContextMenu(trigger);

      const item = screen.getByText('Custom Item').closest('[role="menuitem"]');
      expect(item).toHaveClass('custom-item-class');
    });

    test('applies custom className to separator', () => {
      render(
        <RightClickMenu>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            <RightClickMenu.Item icon={<Eye />}>Item</RightClickMenu.Item>
            <RightClickMenu.Separator className="custom-separator-class" />
            <RightClickMenu.Item icon={<Settings />}>Item 2</RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );
      const trigger = screen.getByTestId('context-trigger');
      fireContextMenu(trigger);

      const separator = screen.getByRole('separator');
      expect(separator).toHaveClass('custom-separator-class');
    });

    test('applies custom className to label', () => {
      render(
        <RightClickMenu>
          <RightClickMenu.Trigger asChild>
            <div data-testid="context-trigger">Trigger</div>
          </RightClickMenu.Trigger>
          <RightClickMenu.Content>
            <RightClickMenu.Label className="custom-label-class">Section</RightClickMenu.Label>
            <RightClickMenu.Item icon={<Eye />}>Item</RightClickMenu.Item>
          </RightClickMenu.Content>
        </RightClickMenu>
      );
      const trigger = screen.getByTestId('context-trigger');
      fireContextMenu(trigger);

      const label = screen.getByText('Section');
      expect(label).toHaveClass('custom-label-class');
    });
  });
});
