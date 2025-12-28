import Heading from './Heading';
import Text from './Text';

/**
 * EmptyState Component
 *
 * Consistent empty state display with icon, title, description, and optional action.
 *
 * @example
 * <EmptyState
 *   icon="🏠"
 *   title="Nessun dispositivo"
 *   description="Aggiungi dispositivi per iniziare"
 *   action={<Button>Aggiungi</Button>}
 * />
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}) {
  return (
    <div className={`text-center py-8 ${className}`.trim()}>
      {/* Icon */}
      {icon && (
        <div className="text-6xl mb-4">
          {typeof icon === 'string' ? icon : icon}
        </div>
      )}

      {/* Title */}
      {title && (
        <Heading level={3} size="lg" className="mb-2">
          {title}
        </Heading>
      )}

      {/* Description */}
      {description && (
        <Text variant="secondary" className="mb-6">
          {description}
        </Text>
      )}

      {/* Action */}
      {action && <div>{action}</div>}
    </div>
  );
}
