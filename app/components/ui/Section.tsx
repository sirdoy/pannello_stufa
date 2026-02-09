import type { ReactNode, ElementType, HTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import Heading from './Heading';
import Text from './Text';

/**
 * Section Variants - CVA Configuration
 *
 * Spacing: none, sm, md, lg - consistent vertical padding across breakpoints
 */
export const sectionVariants = cva(
  '',
  {
    variants: {
      spacing: {
        none: '',
        sm: 'py-4 sm:py-6',
        md: 'py-6 sm:py-8 lg:py-10',
        lg: 'py-8 sm:py-12 lg:py-16',
      },
    },
    defaultVariants: {
      spacing: 'md',
    },
  }
);

/**
 * Header spacing relative to section spacing
 */
const headerSpacingMap: Record<string, string> = {
  none: 'mb-2',
  sm: 'mb-3 sm:mb-4',
  md: 'mb-4 sm:mb-6',
  lg: 'mb-6 sm:mb-8',
};

/**
 * Section Component Props
 */
export interface SectionProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {
  title?: string;
  subtitle?: string;
  description?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  action?: ReactNode;
  children?: ReactNode;
  as?: ElementType;
}

/**
 * Section Component - Ember Noir Design System
 *
 * Semantic wrapper for page sections with optional title, description, and action.
 *
 * @param {string} title - Section title (rendered as Heading)
 * @param {string} subtitle - Optional subtitle above title
 * @param {string} description - Optional description below title
 * @param {'none'|'sm'|'md'|'lg'} spacing - Vertical padding variant
 * @param {1|2|3|4|5|6} level - Heading level for accessibility (default: 2)
 * @param {ReactNode} action - Optional action slot (usually Button)
 * @param {string} as - Semantic element (default: 'section')
 *
 * @example
 * // Main page section with h1
 * <Section
 *   title="I tuoi dispositivi"
 *   description="Controlla e monitora tutti i dispositivi"
 *   spacing="lg"
 *   level={1}
 *   action={<Button>Azione</Button>}
 * >
 *   {children}
 * </Section>
 *
 * @example
 * // Sub-section with default h2
 * <Section title="Settings" spacing="md">
 *   {children}
 * </Section>
 */
export default function Section({
  title,
  subtitle,
  description,
  spacing = 'md',
  level = 2,
  action,
  children,
  as: Component = 'section',
  className = '',
  ...props
}: SectionProps) {
  const hasHeader = title || subtitle || description || action;

  return (
    <Component className={cn(sectionVariants({ spacing }), className)} {...props}>
      {/* Header with title, description, action */}
      {hasHeader && (
        <div className={headerSpacingMap[spacing ?? 'md'] || headerSpacingMap.md}>
          {/* Category indicator + subtitle */}
          {(subtitle || title) && (
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-12 bg-gradient-to-r from-ember-500 to-flame-600 rounded-full" />
              {subtitle && (
                <Text variant="tertiary" size="sm" uppercase tracking as="span">
                  {subtitle}
                </Text>
              )}
            </div>
          )}

          {/* Title + Actions row */}
          {(title || action) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2">
              {title && (
                <Heading level={level} size={level === 1 ? '3xl' : '2xl'}>
                  {title}
                </Heading>
              )}
              {action && <div className="flex-shrink-0">{action}</div>}
            </div>
          )}

          {/* Description */}
          {description && (
            <Text variant="secondary" className="max-w-2xl">
              {description}
            </Text>
          )}
        </div>
      )}

      {/* Content */}
      {children}
    </Component>
  );
}

export { Section };
