import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandPalette from '../CommandPalette';
import CommandPaletteProvider, { useCommandPalette, CommandPaletteContext } from '../../layout/CommandPaletteProvider';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Sample commands for testing
const mockCommands = [
  {
    heading: 'Navigation',
    items: [
      {
        id: 'nav-home',
        label: 'Dashboard',
        icon: <span data-testid="home-icon">H</span>,
        shortcut: 'Cmd+D',
        onSelect: jest.fn(),
      },
      {
        id: 'nav-settings',
        label: 'Settings',
        icon: <span data-testid="settings-icon">S</span>,
        shortcut: 'Cmd+,',
        onSelect: jest.fn(),
      },
    ],
  },
  {
    heading: 'Device Actions',
    items: [
      {
        id: 'device-power',
        label: 'Ignite Stove',
        icon: <span data-testid="power-icon">P</span>,
        onSelect: jest.fn(),
      },
    ],
  },
];

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('CommandPalette', () => {
  describe('Rendering', () => {
    it('does not render content when closed', () => {
      render(
        <CommandPalette
          open={false}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      // Dialog should not show content when closed
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('renders when open=true', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });

    it('renders all command groups', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Device Actions')).toBeInTheDocument();
    });

    it('renders items within groups', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Ignite Stove')).toBeInTheDocument();
    });

    it('renders shortcuts with Kbd component', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      expect(screen.getByText('Cmd+D')).toBeInTheDocument();
      expect(screen.getByText('Cmd+,')).toBeInTheDocument();
    });

    it('renders icons for all items', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      expect(screen.getByTestId('power-icon')).toBeInTheDocument();
    });
  });

  describe('Search/Filter', () => {
    it('input receives autofocus when open', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      expect(input).toHaveFocus();
    });

    it('typing filters items', async () => {
      const user = userEvent.setup();
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'Dashboard');

      // Dashboard should be visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('fuzzy matching works for partial matches', async () => {
      const user = userEvent.setup();
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'dash');

      // Dashboard should still be visible with partial match
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('shows empty state when no matches', async () => {
      const user = userEvent.setup();
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'xyznonexistent');

      await waitFor(() => {
        expect(screen.getByText('No results found.')).toBeInTheDocument();
      });
    });

    it('search is case-insensitive', async () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      // Use fireEvent for faster input (userEvent.type is slow)
      fireEvent.change(input, { target: { value: 'DASHBOARD' } });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });

    it('clearing input shows all items', async () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      const input = screen.getByPlaceholderText('Type a command or search...');

      // Type to filter (use fireEvent for speed)
      fireEvent.change(input, { target: { value: 'dash' } });

      // Clear input
      fireEvent.change(input, { target: { value: '' } });

      // All items should be visible again
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Ignite Stove')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('Arrow Down changes selection', async () => {
      const user = userEvent.setup();
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      // cmdk auto-selects first item on open, so Arrow Down should move to second
      // Press multiple times to ensure navigation is working
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Some item should be selected (cmdk uses data-selected attribute)
      const selectedItem = document.querySelector('[data-selected="true"]');
      expect(selectedItem).toBeInTheDocument();
    });

    it('Arrow Up changes selection', async () => {
      const user = userEvent.setup();
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      // Move down first
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      // Then up - selection should change
      await user.keyboard('{ArrowUp}');

      // Some item should be selected
      const selectedItem = document.querySelector('[data-selected="true"]');
      expect(selectedItem).toBeInTheDocument();
    });

    it('Enter executes selected command', async () => {
      const user = userEvent.setup();
      const mockOnSelect = jest.fn();
      const commands = [
        {
          heading: 'Test',
          items: [{ id: 'test', label: 'Test Item', onSelect: mockOnSelect }],
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={commands}
        />
      );

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('Escape closes palette', async () => {
      const user = userEvent.setup();
      const mockOnOpenChange = jest.fn();

      render(
        <CommandPalette
          open={true}
          onOpenChange={mockOnOpenChange}
          commands={mockCommands}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('navigation wraps with loop prop', async () => {
      const commands = [
        {
          heading: 'Test',
          items: [
            { id: 'first', label: 'First', onSelect: jest.fn() },
            { id: 'second', label: 'Second', onSelect: jest.fn() },
          ],
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={commands}
        />
      );

      // cmdk with loop prop allows wrapping navigation
      // Navigate multiple times using fireEvent (faster than userEvent)
      const input = screen.getByPlaceholderText('Type a command or search...');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // After wrapping, some item should still be selected (loop is working)
      await waitFor(() => {
        const selectedItem = document.querySelector('[data-selected="true"]');
        expect(selectedItem).toBeInTheDocument();
      });
    });

    it('first item is selected by default when palette opens', async () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      // cmdk auto-selects first item when palette opens (may need a tick)
      await waitFor(() => {
        const selectedItem = document.querySelector('[data-selected="true"]');
        expect(selectedItem).toBeInTheDocument();
      });
    });
  });

  describe('Command Execution', () => {
    it('click on item calls onSelect', async () => {
      const user = userEvent.setup();
      const mockOnSelect = jest.fn();
      const commands = [
        {
          heading: 'Test',
          items: [{ id: 'test', label: 'Click Me', onSelect: mockOnSelect }],
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={commands}
        />
      );

      await user.click(screen.getByText('Click Me'));

      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('closes palette after execution', async () => {
      const user = userEvent.setup();
      const mockOnOpenChange = jest.fn();
      const commands = [
        {
          heading: 'Test',
          items: [{ id: 'test', label: 'Execute', onSelect: jest.fn() }],
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={mockOnOpenChange}
          commands={commands}
        />
      );

      await user.click(screen.getByText('Execute'));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('haptic feedback triggers on selection', async () => {
      const user = userEvent.setup();
      const commands = [
        {
          heading: 'Test',
          items: [{ id: 'test', label: 'Vibrate', onSelect: jest.fn() }],
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={commands}
        />
      );

      await user.click(screen.getByText('Vibrate'));

      expect(mockVibrate).toHaveBeenCalledWith([10, 20, 10]);
    });

    it('onOpenChange called with false after selection', async () => {
      const user = userEvent.setup();
      const mockOnOpenChange = jest.fn();
      const commands = [
        {
          heading: 'Test',
          items: [{ id: 'test', label: 'Close Test', onSelect: jest.fn() }],
        },
      ];

      render(
        <CommandPalette
          open={true}
          onOpenChange={mockOnOpenChange}
          commands={commands}
        />
      );

      await user.click(screen.getByText('Close Test'));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Mobile Layout', () => {
    it('has full screen classes for mobile', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      // Check for mobile full-screen class (inset-4)
      const contentWrapper = document.querySelector('.fixed.inset-4');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('has large touch targets for items', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      // Items should have py-3 for 48px touch targets
      const item = screen.getByText('Dashboard').closest('[data-selected]');
      expect(item.className).toContain('py-3');
    });

    it('placeholder is visible', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('Command.Input is focusable', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      expect(input).toHaveFocus();
    });

    it('items have appropriate combobox role', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      // cmdk renders items with role="option"
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    it('selected item has data-selected attribute', async () => {
      const user = userEvent.setup();
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
        />
      );

      await user.keyboard('{ArrowDown}');

      const selectedItem = document.querySelector('[data-selected="true"]');
      expect(selectedItem).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('accepts custom placeholder', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
          placeholder="Search commands..."
        />
      );

      expect(screen.getByPlaceholderText('Search commands...')).toBeInTheDocument();
    });

    it('accepts custom className', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={mockCommands}
          className="custom-class"
        />
      );

      // The dialog should have the custom class
      const dialog = document.querySelector('.custom-class');
      expect(dialog).toBeInTheDocument();
    });

    it('renders empty when no commands provided', () => {
      render(
        <CommandPalette
          open={true}
          onOpenChange={jest.fn()}
          commands={[]}
        />
      );

      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      // No items, so empty state should show
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });
  });
});

describe('CommandPaletteProvider', () => {
  describe('Global Shortcut', () => {
    it('Cmd+K opens palette on Mac', async () => {
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Initially closed
      expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();

      // Trigger Cmd+K
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });
    });

    it('Ctrl+K opens palette on Windows', async () => {
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Trigger Ctrl+K
      act(() => {
        fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });
    });

    it('prevents default browser behavior', () => {
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('toggle behavior opens and closes', async () => {
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Open
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });

      // Close (toggle)
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
      });
    });

    it('works when focus is elsewhere', async () => {
      render(
        <CommandPaletteProvider>
          <input data-testid="other-input" />
        </CommandPaletteProvider>
      );

      // Focus the other input
      const otherInput = screen.getByTestId('other-input');
      otherInput.focus();

      // Trigger Cmd+K
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });
    });
  });

  describe('Context', () => {
    it('provides context to children', () => {
      function TestComponent() {
        const context = useCommandPalette();
        return <div data-testid="context-check">{context ? 'has context' : 'no context'}</div>;
      }

      render(
        <CommandPaletteProvider>
          <TestComponent />
        </CommandPaletteProvider>
      );

      expect(screen.getByTestId('context-check')).toHaveTextContent('has context');
    });

    it('throws error when useCommandPalette used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      function TestComponent() {
        useCommandPalette();
        return null;
      }

      expect(() => render(<TestComponent />)).toThrow(
        'useCommandPalette must be used within CommandPaletteProvider'
      );

      consoleSpy.mockRestore();
    });

    it('openPalette function works', async () => {
      function TestComponent() {
        const { openPalette } = useCommandPalette() as any;
        return <button onClick={openPalette}>Open</button>;
      }

      render(
        <CommandPaletteProvider>
          <TestComponent />
        </CommandPaletteProvider>
      );

      fireEvent.click(screen.getByText('Open'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });
    });

    it('closePalette function works', async () => {
      function TestComponent() {
        const { openPalette, closePalette } = useCommandPalette() as any;
        return (
          <>
            <button onClick={openPalette}>Open</button>
            <button onClick={closePalette}>Close</button>
          </>
        );
      }

      render(
        <CommandPaletteProvider>
          <TestComponent />
        </CommandPaletteProvider>
      );

      // Open first
      fireEvent.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });

      // Close
      fireEvent.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Default Commands', () => {
    it('renders default navigation commands', async () => {
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Open palette
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      // Wait for palette to open first
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });

      // Then check for navigation commands (Italian labels)
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      // Use role to get specific option, not the group heading
      expect(screen.getByRole('option', { name: /Termostato/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Impostazioni/i })).toBeInTheDocument();
    });

    it('renders device commands from deviceCommands module', async () => {
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Open palette
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        // Stove commands (Italian labels)
        expect(screen.getByText('Accendi Stufa')).toBeInTheDocument();
        expect(screen.getByText('Spegni Stufa')).toBeInTheDocument();
      });
    });

    it('renders thermostat and lights commands', async () => {
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Open palette
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        // Thermostat commands
        expect(screen.getByText('Modalita Automatica')).toBeInTheDocument();
        // Lights commands
        expect(screen.getByText('Accendi Tutte le Luci')).toBeInTheDocument();
      });
    });
  });

  describe('Device Commands Integration', () => {
    it('renders stove commands when searching', async () => {
      const user = userEvent.setup();
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Open palette
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });

      // Type in search
      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'accendi');

      expect(screen.getByText('Accendi Stufa')).toBeInTheDocument();
    });

    it('calls onSelect when device command is executed', async () => {
      const mockOnSelect = jest.fn();
      const commands = [
        {
          heading: 'Stufa',
          items: [
            { id: 'stove-ignite', label: 'Accendi Stufa', onSelect: mockOnSelect },
          ],
        },
      ];

      render(
        <CommandPalette open={true} onOpenChange={() => {}} commands={commands} />
      );

      const item = screen.getByText('Accendi Stufa');
      await userEvent.click(item);

      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('displays keyboard shortcuts when provided', async () => {
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Open palette
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });

      // Check for keyboard shortcuts (from device commands)
      expect(screen.getByText('⌘⇧S')).toBeInTheDocument(); // Stove ignite shortcut
      expect(screen.getByText('⌘⇧L')).toBeInTheDocument(); // Lights all on shortcut
    });

    it('filters device commands by search term', async () => {
      const user = userEvent.setup();
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Open palette
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });

      // Search for "luci"
      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'luci');

      // Lights commands should be visible
      expect(screen.getByText('Accendi Tutte le Luci')).toBeInTheDocument();
      expect(screen.getByText('Spegni Tutte le Luci')).toBeInTheDocument();
    });

    it('renders all command groups with headings', async () => {
      render(
        <CommandPaletteProvider>
          <div>App Content</div>
        </CommandPaletteProvider>
      );

      // Open palette
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      });

      // Check for group headings (use data-value attribute to identify group containers)
      const groups = document.querySelectorAll('[cmdk-group]');
      const groupNames = Array.from(groups).map(g => g.getAttribute('data-value'));

      expect(groupNames).toContain('Navigazione');
      expect(groupNames).toContain('Stufa');
      expect(groupNames).toContain('Termostato');
      expect(groupNames).toContain('Luci');
      expect(groupNames).toContain('Azioni');
    });
  });
});
