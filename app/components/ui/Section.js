import Heading from './Heading';
import Text from './Text';
import Container from './Container';

/**
 * Section Component - Ember Noir Design System
 *
 * Semantic wrapper for page sections with optional title, description, and action.
 * Handles dark/light mode internally.
 *
 * @example
 * <Section
 *   title="I tuoi dispositivi"
 *   description="Controlla e monitora tutti i dispositivi"
 *   spacing="section"
 *   action={<Button>Azione</Button>}
 * >
 *   {children}
 * </Section>
 */
export default function Section({
  title,
  description,
  spacing = 'card',
  action,
  children,
  className = ''
}) {
  return (
    <section className={className}>
      {/* Header with title, description, action */}
      {(title || description || action) && (
        <div className="mb-4 sm:mb-8">
          {/* Category indicator + title */}
          {title && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1 w-12 bg-gradient-to-r from-ember-500 to-flame-600 rounded-full" />
                <Text variant="tertiary" size="sm" weight="medium" uppercase tracking as="span">
                  Dashboard
                </Text>
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
      <Container spacing={spacing}>
        {children}
      </Container>
    </section>
  );
}
