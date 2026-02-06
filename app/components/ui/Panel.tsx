import type { ReactNode, ComponentPropsWithoutRef } from 'react';
import Card from './Card';
import Heading from './Heading';
import Text from './Text';

/**
 * Panel Component Props
 */
export interface PanelProps {
  children: ReactNode;
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'glass';
  className?: string;
  contentClassName?: string;
  // Legacy props - ignored
  liquid?: boolean;
  glassmorphism?: boolean;
  solid?: boolean;
}

/**
 * Panel Component - Ember Noir Design System
 *
 * Standardized container for settings panels and content sections.
 * Extends Card component with consistent padding and layout.
 * Handles dark/light mode internally.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Panel content
 * @param {string} props.title - Optional panel title
 * @param {string} props.description - Optional description below title
 * @param {ReactNode} props.headerAction - Optional action button/content in header
 * @param {'default'|'elevated'|'subtle'|'glass'} props.variant - Card variant
 * @param {string} props.className - Additional layout classes
 * @param {string} props.contentClassName - Classes for content wrapper
 */
export default function Panel({
  children,
  title,
  description,
  headerAction,
  variant = 'default',
  className = '',
  contentClassName = '',
  // Legacy props - ignored
  liquid = false,
  glassmorphism = false,
  solid = false,
  ...props
}: PanelProps) {
  // Map legacy props to variant
  let resolvedVariant = variant;
  if (liquid || glassmorphism) resolvedVariant = 'glass';

  return (
    <Card
      variant={resolvedVariant}
      className={`overflow-hidden ${className}`}
      {...({} as any)}
    >
      {/* Header (se presente title o headerAction) */}
      {(title || headerAction) && (
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
          {/* Title & Description */}
          {title && (
            <div>
              <Heading level={3} size="lg">{title}</Heading>
              {description && (
                <Text variant="secondary" size="sm" className="mt-1">{description}</Text>
              )}
            </div>
          )}

          {/* Header Action */}
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}

      {/* Content */}
      <div className={`${title || headerAction ? 'pt-4' : ''} ${contentClassName}`}>
        {children}
      </div>
    </Card>
  );
}
