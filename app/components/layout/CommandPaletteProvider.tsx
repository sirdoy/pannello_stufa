'use client';

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import CommandPalette from '@/app/components/ui/CommandPalette';
import { getDeviceCommands } from '@/lib/commands/deviceCommands';
import {
  Home,
  Settings,
  Thermometer,
  Flame,
  Lightbulb,
  Camera,
  Bug,
  RefreshCw,
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
   * Build complete command set
   * - Navigation commands
   * - Device commands (from deviceCommands.js)
   * - Global actions
   */
  const defaultCommands = useMemo(() => [
    // Navigation
    {
      heading: 'Navigazione',
      items: [
        {
          id: 'nav-home',
          label: 'Dashboard',
          icon: <Home className="w-4 h-4" />,
          shortcut: '⌘D',
          onSelect: () => router.push('/'),
        },
        {
          id: 'nav-stove',
          label: 'Stufa',
          icon: <Flame className="w-4 h-4" />,
          onSelect: () => router.push('/stove'),
        },
        {
          id: 'nav-thermostat',
          label: 'Termostato',
          icon: <Thermometer className="w-4 h-4" />,
          onSelect: () => router.push('/thermostat'),
        },
        {
          id: 'nav-lights',
          label: 'Luci',
          icon: <Lightbulb className="w-4 h-4" />,
          onSelect: () => router.push('/lights'),
        },
        {
          id: 'nav-camera',
          label: 'Videocamera',
          icon: <Camera className="w-4 h-4" />,
          onSelect: () => router.push('/camera'),
        },
        {
          id: 'nav-settings',
          label: 'Impostazioni',
          icon: <Settings className="w-4 h-4" />,
          shortcut: '⌘,',
          onSelect: () => router.push('/settings'),
        },
        {
          id: 'nav-debug',
          label: 'Debug',
          icon: <Bug className="w-4 h-4" />,
          onSelect: () => router.push('/debug'),
        },
      ],
    },
    // Device commands from module
    ...getDeviceCommands(),
    // Global actions
    {
      heading: 'Azioni',
      items: [
        {
          id: 'action-refresh',
          label: 'Aggiorna Pagina',
          icon: <RefreshCw className="w-4 h-4" />,
          shortcut: '⌘R',
          onSelect: () => window.location.reload(),
        },
      ],
    },
  ], [router]);

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
