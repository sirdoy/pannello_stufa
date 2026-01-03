import Card from './Card';

/**
 * Panel Component
 *
 * Standardized container for settings panels and content sections.
 * Extends Card component with consistent padding and layout.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Panel content
 * @param {string} props.title - Optional panel title
 * @param {string} props.description - Optional description below title
 * @param {ReactNode} props.headerAction - Optional action button/content in header
 * @param {boolean} props.liquid - Use liquid glass style (default: true)
 * @param {boolean} props.glassmorphism - Use glassmorphism style
 * @param {boolean} props.solid - Use solid style
 * @param {string} props.className - Additional classes
 * @param {string} props.contentClassName - Classes for content wrapper
 */
export default function Panel({
  children,
  title,
  description,
  headerAction,
  liquid = true,
  glassmorphism = false,
  solid = false,
  className = '',
  contentClassName = '',
  ...props
}) {
  return (
    <Card
      liquid={liquid}
      glassmorphism={glassmorphism}
      solid={solid}
      className={`overflow-hidden ${className}`}
      {...props}
    >
      {/* Header (se presente title o headerAction) */}
      {(title || headerAction) && (
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
          {/* Title & Description */}
          {title && (
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {description}
                </p>
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
