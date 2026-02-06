'use client';

import type { ReactNode, HTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import Heading from './Heading';
import Text from './Text';

/**
 * EmptyState Variants - CVA Configuration
 *
 * Size: sm, md, lg
 */
export const emptyStateVariants = cva(
  // Base classes
  'text-center flex flex-col items-center',
  {
    variants: {
      size: {
        sm: 'py-4 gap-2',
        md: 'py-8 gap-3',
        lg: 'py-12 gap-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/**
 * Icon size mapping relative to container size
 */
const iconSizeMap: Record<string, string> = {
  sm: 'text-4xl',
  md: 'text-6xl',
  lg: 'text-7xl',
};

/**
 * Heading size mapping relative to container size
 */
const headingSizeMap: Record<string, 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

/**
 * EmptyState Component Props
 */
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof emptyStateVariants> {
  icon?: string | ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

/**
 * EmptyState Component - Ember Noir Design System
 *
 * Consistent empty state display with icon, title, description, and optional action.
 * Uses CVA for size variants (sm, md, lg).
 *
 * @param {Object} props - Component props
 * @param {string|ReactNode} props.icon - Emoji or icon component
 * @param {string} props.title - Empty state title
 * @param {string} props.description - Explanatory description
 * @param {ReactNode} props.action - Action button(s)
 * @param {'sm'|'md'|'lg'} props.size - Size variant
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <EmptyState
 *   icon="🏠"
 *   title="Nessun dispositivo"
 *   description="Aggiungi dispositivi per iniziare"
 *   action={<Button>Aggiungi</Button>}
 * />
 *
 * @example
 * // Compact size for inline usage
 * <EmptyState
 *   size="sm"
 *   icon="📭"
 *   title="Nessun messaggio"
 * />
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
  ...props
}: EmptyStateProps) {
  return (
    <div className={cn(emptyStateVariants({ size }), className)} {...props}>
      {/* Icon */}
      {icon && (
        <div className={iconSizeMap[size || 'md']} aria-hidden="true">
          {typeof icon === 'string' ? icon : icon}
        </div>
      )}

      {/* Title */}
      {title && (
        <Heading level={3} size={headingSizeMap[size || 'md']}>
          {title}
        </Heading>
      )}

      {/* Description */}
      {description && (
        <Text variant="secondary" size={size === 'sm' ? 'sm' : 'base'} className="max-w-sm">
          {description}
        </Text>
      )}

      {/* Action */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
