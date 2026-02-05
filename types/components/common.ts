/**
 * Common component prop types
 *
 * These are shared prop patterns used across multiple components.
 * Individual component Props should be defined in the component file itself.
 */

import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';

/**
 * Base props for components that accept children
 */
export interface WithChildren {
  children?: ReactNode;
}

/**
 * Base props for components that can be disabled
 */
export interface WithDisabled {
  disabled?: boolean;
}

/**
 * Base props for components with loading state
 */
export interface WithLoading {
  loading?: boolean;
}

/**
 * Base props for form-related components
 */
export interface WithFormField {
  name?: string;
  label?: string;
  error?: string;
  required?: boolean;
}

/**
 * Common size variants used in design system
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Common color scheme variants (matches CVA variants)
 */
export type ColorScheme =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ember'    // Custom theme color
  | 'ghost';

/**
 * Common variant prop for styled components
 */
export type Variant = 'solid' | 'outline' | 'ghost' | 'link';

/**
 * Base button props (extends HTML button attributes)
 */
export interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  colorScheme?: ColorScheme;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/**
 * Base card props
 */
export interface CardBaseProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outline' | 'filled';
  padding?: Size;
}

/**
 * Props for components that can be polymorphic (render as different elements)
 */
export interface AsChildProps {
  asChild?: boolean;
}

/**
 * Common icon props
 */
export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
}

/**
 * Device card common props
 */
export interface DeviceCardBaseProps extends WithChildren {
  title: string;
  icon?: ReactNode;
  status?: 'online' | 'offline' | 'error' | 'loading';
  actions?: ReactNode;
  contextMenuItems?: ContextMenuItem[];
}

/**
 * Context menu item type
 */
export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  shortcut?: string;
}

/**
 * Slot pattern for compound components
 */
export interface SlotProps {
  slot?: string;
}
