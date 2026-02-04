'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Kbd Component - Ember Noir Design System v4.0
 *
 * Displays keyboard shortcuts with monospace styling.
 * Used in Command Palette to show shortcut hints aligned right of each command.
 *
 * @example
 * // Basic usage
 * <Kbd>Cmd+K</Kbd>
 *
 * @example
 * // With symbols (Mac-style)
 * <Kbd>{'\u2318'}K</Kbd>  // Command + K
 * <Kbd>{'\u21E7'}Enter</Kbd>  // Shift + Enter
 *
 * @example
 * // Multiple keys
 * <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>P</Kbd>
 *
 * @example
 * // Custom styling
 * <Kbd className="text-ember-400">Enter</Kbd>
 *
 * @param {Object} props
 * @param {ReactNode} props.children - The shortcut text to display
 * @param {string} [props.className] - Additional CSS classes to apply
 */
function Kbd({ children, className, ...props }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center',
        'px-2 py-1 rounded-md',
        'text-xs font-mono font-medium',
        'bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200',
        'text-slate-300 [html:not(.dark)_&]:text-slate-700',
        'border border-slate-600/50 [html:not(.dark)_&]:border-slate-300',
        'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export default Kbd;
