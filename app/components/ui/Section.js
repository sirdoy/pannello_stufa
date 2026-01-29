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
const headerSpacingMap = {
  none: 'mb-2',
  sm: 'mb-3 sm:mb-4',
  md: 'mb-4 sm:mb-6',
  lg: 'mb-6 sm:mb-8',
};

/**
 * Section Component - Ember Noir Design System
 *
 * Semantic wrapper for page sections with optional title, description, and action.
 *
 * @example
 * <Section
 *   title="I tuoi dispositivi"
 *   description="Controlla e monitora tutti i dispositivi"
 *   spacing="lg"
 *   action={<Button>Azione</Button>}
 * >
 *   {children}
 * </Section>
 */
export default function Section({
  title,
  subtitle,
  description,
  spacing = 'md',
  action,
  children,
  as: Component = 'section',
  className = '',
  ...props
}) {
  const hasHeader = title || subtitle || description || action;

  return (
    <Component className={cn(sectionVariants({ spacing }), className)} {...props}>
      {/* Header with title, description, action */}
      {hasHeader && (
        <div className={headerSpacingMap[spacing]}>
          {/* Category indicator + subtitle */}
          {(subtitle || title) && (
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-12 bg-gradient-to-r from-ember-500 to-flame-600 rounded-full" />
              {subtitle && (
                <Text variant="tertiary" size="sm" weight="medium" uppercase tracking as="span">
                  {subtitle}
                </Text>
              )}
            </div>
          )}

          {/* Title + Actions row */}
          {(title || action) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2">
              {title && (
                <Heading level={2} size="2xl">
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
