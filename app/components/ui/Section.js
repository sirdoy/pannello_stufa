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
 * Semantic wrapper for page sections with optional title, subtitle, description, and action.
 * Features ember accent bar styling for visual hierarchy.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Section title (optional)
 * @param {string} props.subtitle - Category/subtitle text above title (optional)
 * @param {string} props.description - Section description (optional)
 * @param {ReactNode} props.action - Action button/element (optional)
 * @param {'none'|'sm'|'md'|'lg'} props.spacing - Vertical spacing size
 * @param {ReactNode} props.children - Section content
 * @param {string} props.className - Additional Tailwind classes
 *
 * @example
 * <Section
 *   title="I tuoi dispositivi"
 *   subtitle="Dashboard"
 *   description="Controlla e monitora tutti i dispositivi"
 *   spacing="md"
 *   action={<Button>Azione</Button>}
 * >
 *   {children}
 * </Section>
 */
export default function Section({
  title,
  subtitle = 'Dashboard',
  description,
  spacing = 'md',
  action,
  children,
  className,
}) {
  return (
    <section
      className={cn(
        sectionVariants({ spacing }),
        className
      )}
    >
      {/* Header with title, description, action */}
      {(title || description || action) && (
        <div className={headerSpacingMap[spacing]}>
          {/* Ember accent bar + subtitle */}
          {title && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="h-1 w-12 bg-gradient-to-r from-ember-500 to-flame-600 rounded-full"
                  aria-hidden="true"
                />
                {subtitle && (
                  <Text variant="tertiary" size="sm" weight="medium" uppercase tracking as="span">
                    {subtitle}
                  </Text>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <Heading level={1} size="3xl">{title}</Heading>
                {action && <div>{action}</div>}
              </div>
            </>
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
    </section>
  );
}

// Named export for tree-shaking
export { Section };
