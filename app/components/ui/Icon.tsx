import type { LucideIcon } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * Icon Component Props
 */
export interface IconProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'size'> {
  icon: LucideIcon;
  size?: number;
  label?: string;
}

/**
 * Icon Component
 *
 * Wrapper for lucide-react icons with ARIA support.
 *
 * @example
 * import { Flame } from 'lucide-react';
 *
 * <Icon icon={Flame} size={24} label="Stufa accesa" />
 */
export default function Icon({
  icon: IconComponent,
  size = 16,
  label,
  className = '',
  ...props
}: IconProps) {
  return (
    <IconComponent
      size={size}
      aria-label={label}
      className={className}
      {...props}
    />
  );
}
