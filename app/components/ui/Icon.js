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
  className = ''
}) {
  return (
    <IconComponent
      size={size}
      aria-label={label}
      className={className}
    />
  );
}
