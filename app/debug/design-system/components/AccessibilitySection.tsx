'use client';

import Card, { CardContent } from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Badge from '@/app/components/ui/Badge';

/**
 * AccessibilitySection Component - Design System Documentation
 *
 * Displays accessibility documentation for interactive components.
 * Includes keyboard navigation, ARIA attributes, and screen reader info.
 * Styled to match Ember Noir design system.
 *
 * @param {Object} props - Component props
 * @param {Array<{key: string, action: string}>} [props.keyboard] - Keyboard navigation shortcuts
 * @param {Array<{attr: string, description: string}>} [props.aria] - ARIA attributes used
 * @param {string} [props.screenReader] - Screen reader behavior description
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * <AccessibilitySection
 *   keyboard={[
 *     { key: 'Enter', action: 'Activate button' },
 *     { key: 'Space', action: 'Activate button' },
 *   ]}
 *   aria={[
 *     { attr: 'role="button"', description: 'Identifies element as button' },
 *   ]}
 *   screenReader="Button label is announced when focused"
 * />
 */
export default function AccessibilitySection({
  keyboard = [],
  aria = [],
  screenReader,
  className = '',
}) {
  const hasContent = keyboard.length > 0 || aria.length > 0 || screenReader;

  if (!hasContent) {
    return null;
  }

  return (
    <Card variant="subtle" className={className}>
      <CardContent>
        <Heading level={4} variant="ocean" className="mb-4">
          Accessibility
        </Heading>

        <div className="space-y-4">
          {/* Keyboard Navigation */}
          {keyboard.length > 0 && (
            <div>
              <Text variant="label" size="xs" className="mb-2">
                Keyboard Navigation
              </Text>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {keyboard.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-white/[0.03] last:border-0"
                      >
                        <td className="py-2 pr-4">
                          <Badge variant="neutral" size="sm">
                            {item.key}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Text variant="secondary" size="sm" as="span">
                            {item.action}
                          </Text>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ARIA Attributes */}
          {aria.length > 0 && (
            <div>
              <Text variant="label" size="xs" className="mb-2">
                ARIA Attributes
              </Text>
              <ul className="space-y-1">
                {aria.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <code className="font-mono text-ocean-400 text-xs">
                      {item.attr}
                    </code>
                    <Text variant="tertiary" size="xs" as="span">
                      - {item.description}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Screen Reader */}
          {screenReader && (
            <div>
              <Text variant="label" size="xs" className="mb-2">
                Screen Reader
              </Text>
              <Text variant="secondary" size="sm">
                {screenReader}
              </Text>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
