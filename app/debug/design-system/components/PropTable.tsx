'use client';

import Text from '@/app/components/ui/Text';

interface PropDefinition {
  name: string;
  type: string;
  default?: string;
  description: string;
  required?: boolean;
}

interface PropTableProps {
  props?: PropDefinition[];
  className?: string;
}

/**
 * PropTable Component - Design System Documentation
 *
 * Renders a formatted table of component prop documentation.
 * Styled to match Ember Noir design system.
 *
 * @example
 * <PropTable props={[
 *   { name: 'variant', type: "'ember' | 'subtle'", default: "'ember'", description: 'Button style variant', required: false },
 *   { name: 'onClick', type: '() => void', description: 'Click handler', required: true },
 * ]} />
 */
export default function PropTable({ props = [], className = '' }: PropTableProps) {
  if (!props.length) {
    return null;
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left">
            <th className="py-3 pr-4">
              <Text variant="label" size="xs" as="span">
                Prop
              </Text>
            </th>
            <th className="py-3 pr-4">
              <Text variant="label" size="xs" as="span">
                Type
              </Text>
            </th>
            <th className="py-3 pr-4">
              <Text variant="label" size="xs" as="span">
                Default
              </Text>
            </th>
            <th className="py-3">
              <Text variant="label" size="xs" as="span">
                Description
              </Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr
              key={prop.name}
              className="border-b border-white/[0.03] last:border-0"
            >
              <td className="py-3 pr-4">
                <code className="font-mono text-ember-400">
                  {prop.name}
                  {prop.required && (
                    <span className="text-danger-400 ml-0.5" aria-label="required">
                      *
                    </span>
                  )}
                </code>
              </td>
              <td className="py-3 pr-4">
                <code className="font-mono text-ocean-400 text-xs">
                  {prop.type}
                </code>
              </td>
              <td className="py-3 pr-4">
                <code className="font-mono text-slate-400 text-xs">
                  {prop.default !== undefined ? prop.default : '-'}
                </code>
              </td>
              <td className="py-3">
                <Text variant="secondary" size="sm" as="span">
                  {prop.description}
                </Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
