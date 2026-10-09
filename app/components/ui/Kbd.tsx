'use client';

import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Kbd Component Props
 */
export interface KbdProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

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
 * <Kbd>{'\u2318'}K</Kbd> // Command + K
 * <Kbd>{'\u21E7'}Enter</Kbd> // Shift + Enter
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
function Kbd({ children, className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-md px-2 py-1',
        'font-mono text-xs font-medium',
        'bg-white/8',
        'text-(--text-1)',
        'border-[0.5px] border-white/12',
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
