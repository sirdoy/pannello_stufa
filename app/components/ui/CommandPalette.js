'use client';

import { forwardRef, useCallback } from 'react';
import { Command } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHiddenPrimitive from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils/cn';
import Kbd from './Kbd';

/**
 * CommandPalette Component - Ember Noir Design System v4.0
 *
 * A command palette for power-user navigation with Cmd+K/Ctrl+K shortcut.
 * Built on cmdk library with fuzzy search and keyboard navigation.
 *
 * Features:
 * - Fuzzy search with automatic filtering
 * - Arrow key navigation with wrapping (loop)
 * - Enter to execute, Escape to close
 * - Full-screen on mobile (user decision)
 * - Grouped commands with section headers (user decision)
 * - Haptic feedback on selection
 * - Blur+dim backdrop (matches Sheet/Modal pattern)
 *
 * @example
 * // Basic usage with CommandPaletteProvider (recommended)
 * // The provider handles open state and global Cmd+K shortcut
 *
 * @example
 * // Direct usage
 * const commands = [
 *   {
 *     heading: 'Navigation',
 *     items: [
 *       { id: 'nav-home', label: 'Dashboard', icon: <Home />, shortcut: 'Cmd+D', onSelect: () => router.push('/') },
 *     ]
 *   }
 * ];
 * <CommandPalette open={open} onOpenChange={setOpen} commands={commands} />
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the palette is open
 * @param {Function} props.onOpenChange - Callback when open state should change
 * @param {Array} props.commands - Array of command groups with heading and items
 * @param {string} [props.placeholder] - Input placeholder text
 * @param {string} [props.className] - Additional CSS classes
 */
const CommandPalette = forwardRef(function CommandPalette(
  {
    open,
    onOpenChange,
    commands = [],
    placeholder = 'Type a command or search...',
    className,
    ...props
  },
  ref
) {
  /**
   * Handle command selection with haptic feedback
   */
  const handleSelect = useCallback((callback) => {
    // Execute the command
    if (typeof callback === 'function') {
      callback();
    }

    // Close the palette
    onOpenChange(false);

    // Haptic feedback on selection (user decision from CONTEXT.md)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10, 20, 10]); // Confirmation pattern
    }
  }, [onOpenChange]);

  return (
    <Command.Dialog
      ref={ref}
      open={open}
      onOpenChange={onOpenChange}
      loop // Enable arrow key wrapping
      label="Command Palette"
      className={cn('command-palette-dialog', className)}
      {...props}
    >
      {/* Accessibility: Visually hidden title and description for screen readers */}
      <VisuallyHiddenPrimitive.Root asChild>
        <DialogPrimitive.Title>Command Palette</DialogPrimitive.Title>
      </VisuallyHiddenPrimitive.Root>
      <VisuallyHiddenPrimitive.Root asChild>
        <DialogPrimitive.Description>Search for commands, navigate to pages, or execute actions</DialogPrimitive.Description>
      </VisuallyHiddenPrimitive.Root>

      {/* Overlay with blur+dim (match Sheet/Modal pattern) */}
      <div
        className={cn(
          'fixed inset-0 z-50',
          'bg-slate-950/70 [html:not(.dark)_&]:bg-slate-900/40',
          'backdrop-blur-md'
        )}
        aria-hidden="true"
      />

      {/* Content - Full screen on mobile (user decision) */}
      <div
        className={cn(
          'fixed z-50',
          // Mobile: full-screen with padding
          'inset-4',
          // Desktop: centered dialog
          'md:inset-auto',
          'md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'md:w-full md:max-w-2xl'
        )}
      >
        <Command
          className={cn(
            'flex flex-col',
            'rounded-3xl',
            'border border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
            'bg-slate-900/95 [html:not(.dark)_&]:bg-white/95',
            'backdrop-blur-3xl',
            'shadow-card-elevated',
            'overflow-hidden',
            // Mobile: fill available space
            'h-full md:h-auto'
          )}
        >
          {/* Search input */}
          <Command.Input
            placeholder={placeholder}
            autoFocus
            className={cn(
              'w-full px-4 py-4',
              'text-lg font-medium',
              'bg-transparent',
              'border-b border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
              'text-slate-100 [html:not(.dark)_&]:text-slate-900',
              'placeholder:text-slate-500 [html:not(.dark)_&]:placeholder:text-slate-400',
              'focus:outline-none'
            )}
          />

          {/* Command list */}
          <Command.List
            className={cn(
              'flex-1 overflow-y-auto',
              'max-h-[60vh] md:max-h-[400px]',
              'p-2'
            )}
          >
            {/* Empty state */}
            <Command.Empty
              className={cn(
                'py-8 text-center',
                'text-sm text-slate-500 [html:not(.dark)_&]:text-slate-400'
              )}
            >
              No results found.
            </Command.Empty>

            {/* Command groups */}
            {commands.map((group, groupIndex) => (
              <Command.Group
                key={group.heading || groupIndex}
                heading={group.heading}
                className={cn(
                  // Group heading styling
                  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2',
                  '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold',
                  '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider',
                  '[&_[cmdk-group-heading]]:text-slate-500 [html:not(.dark)_&]:[&_[cmdk-group-heading]]:text-slate-400'
                )}
              >
                {group.items?.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item.onSelect)}
                    className={cn(
                      'flex items-center justify-between gap-3',
                      'px-3 py-3 rounded-xl',
                      'text-sm font-medium',
                      'cursor-pointer',
                      'text-slate-300 [html:not(.dark)_&]:text-slate-700',
                      // Selection state (via data attribute from cmdk)
                      'data-[selected=true]:bg-slate-700/50 [html:not(.dark)_&]:data-[selected=true]:bg-slate-100',
                      // Hover state
                      'hover:bg-slate-700/30 [html:not(.dark)_&]:hover:bg-slate-50',
                      // Transition
                      'transition-colors duration-150',
                      // Disabled state
                      'data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon (user decision: all items have icons) */}
                      {item.icon && (
                        <span className="flex-shrink-0 text-slate-400 [html:not(.dark)_&]:text-slate-500">
                          {item.icon}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </div>
                    {/* Shortcut (user decision: show shortcuts aligned right) */}
                    {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </Command.Dialog>
  );
});

CommandPalette.displayName = 'CommandPalette';

export default CommandPalette;
