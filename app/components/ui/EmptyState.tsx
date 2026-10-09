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
  'flex flex-col items-center text-center',
  {
    variants: {
      size: {
        sm: 'gap-2 py-4',
        md: 'gap-3 py-8',
        lg: 'gap-4 py-12',
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
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
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
 * @param {1|2|3|4|5|6} props.level - Heading level for accessibility (default: 2)
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
  level = 2,
  size = 'md',
  className = '',
  ...props
}: EmptyStateProps) {
  return (
    <div className={cn(emptyStateVariants({ size }), className)} {...props}>
      {/* Icon */}
      {icon && (
        <div
          className={
            typeof icon === 'string'
              ? iconSizeMap[size || 'md']
              : 'flex items-center justify-center text-(--text-2)'
          }
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      {/* Title */}
      {title && (
        <Heading level={level} size={headingSizeMap[size || 'md']}>
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
