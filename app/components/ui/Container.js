/**
 * Container Component
 *
 * Semantic wrapper for consistent spacing between elements.
 *
 * @example
 * <Container spacing="section">
 *   {children}
 * </Container>
 */
export default function Container({
  spacing = 'card',
  children,
  className = ''
}) {
  // Spacing variants
  const spacingClasses = {
    card: 'space-y-4',       // 16px - Compact content in cards
    inline: 'space-y-2',     // 8px - Inline tightly coupled elements
    section: 'space-y-8',    // 32px - Major page sections
  };

  return (
    <div className={`${spacingClasses[spacing]} ${className}`.trim()}>
      {children}
    </div>
  );
}
