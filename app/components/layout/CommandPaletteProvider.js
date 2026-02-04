'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import CommandPalette from '@/app/components/ui/CommandPalette';
import {
  Home,
  Settings,
  Thermometer,
  Power,
  PowerOff,
  Moon,
  Sun,
  Flame,
  Lightbulb,
} from 'lucide-react';

/**
 * CommandPaletteContext
 * Provides access to command palette state and controls
 */
export const CommandPaletteContext = createContext(null);

/**
 * useCommandPalette hook
 * Access command palette state and controls from any component
 *
 * @example
 * const { open, setOpen, commands } = useCommandPalette();
 */
export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}

/**
 * CommandPaletteProvider Component
 *
 * Provides global Cmd+K/Ctrl+K shortcut handler and renders CommandPalette.
 * Centralizes command definitions (user decision: not dynamic per-component).
 *
 * Features:
 * - Global keyboard shortcut detection (Cmd+K on Mac, Ctrl+K on Windows)
 * - Prevents default browser behavior (address bar focus)
 * - Toggle behavior (open/close)
 * - Default commands for Navigation, Device Actions, Settings
 *
 * @example
 * // In layout.js (Phase 36)
 * <CommandPaletteProvider>
 *   {children}
 * </CommandPaletteProvider>
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - App content
 * @param {Array} [props.commands] - Custom commands (merged with defaults)
 */
export default function CommandPaletteProvider({ children, commands: customCommands }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  /**
   * Default commands organized by group (user decision from CONTEXT.md)
   * - Navigation: Dashboard, Settings, Thermostat
   * - Device Actions: Stove ignite/off (placeholders)
   * - Settings: Toggle dark mode (placeholder)
   */
  const defaultCommands = [
    {
      heading: 'Navigation',
      items: [
        {
          id: 'nav-home',
          label: 'Dashboard',
          icon: <Home className="w-4 h-4" />,
          shortcut: 'Cmd+D',
          onSelect: () => router.push('/'),
        },
        {
          id: 'nav-settings',
          label: 'Settings',
          icon: <Settings className="w-4 h-4" />,
          shortcut: 'Cmd+,',
          onSelect: () => router.push('/settings'),
        },
        {
          id: 'nav-thermostat',
          label: 'Thermostat',
          icon: <Thermometer className="w-4 h-4" />,
          onSelect: () => router.push('/thermostat'),
        },
        {
          id: 'nav-stove',
          label: 'Stove Control',
          icon: <Flame className="w-4 h-4" />,
          onSelect: () => router.push('/stove'),
        },
        {
          id: 'nav-lights',
          label: 'Lights',
          icon: <Lightbulb className="w-4 h-4" />,
          onSelect: () => router.push('/lights'),
        },
      ],
    },
    {
      heading: 'Device Actions',
      items: [
        {
          id: 'stove-ignite',
          label: 'Ignite Stove',
          icon: <Power className="w-4 h-4" />,
          // Placeholder - actual implementation in Phase 36
          onSelect: () => {
            console.log('[CommandPalette] Ignite stove action - implement in Phase 36');
          },
        },
        {
          id: 'stove-off',
          label: 'Turn Off Stove',
          icon: <PowerOff className="w-4 h-4" />,
          // Placeholder - actual implementation in Phase 36
          onSelect: () => {
            console.log('[CommandPalette] Turn off stove action - implement in Phase 36');
          },
        },
      ],
    },
    {
      heading: 'Settings',
      items: [
        {
          id: 'toggle-theme',
          label: 'Toggle Dark Mode',
          icon: <Moon className="w-4 h-4" />,
          // Placeholder - actual implementation depends on theme provider
          onSelect: () => {
            console.log('[CommandPalette] Toggle dark mode - implement based on theme system');
          },
        },
      ],
    },
  ];

  // Merge custom commands with defaults if provided
  const commands = customCommands || defaultCommands;

  /**
   * Global keyboard shortcut handler
   * Detects Cmd+K (Mac) or Ctrl+K (Windows/Linux)
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // CRITICAL: Prevent browser default (focus address bar, search bar)
        e.preventDefault();

        // Toggle open state
        setOpen((prev) => !prev);
      }
    };

    // Add listener to document for global capture
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /**
   * Open the command palette programmatically
   */
  const openPalette = useCallback(() => {
    setOpen(true);
  }, []);

  /**
   * Close the command palette programmatically
   */
  const closePalette = useCallback(() => {
    setOpen(false);
  }, []);

  // Context value
  const contextValue = {
    open,
    setOpen,
    openPalette,
    closePalette,
    commands,
  };

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={commands}
      />
    </CommandPaletteContext.Provider>
  );
}
