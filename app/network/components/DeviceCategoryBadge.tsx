'use client';

import { Badge } from '@/app/components/ui';
import type { DeviceCategory } from '@/types/firebase/network';

interface CategoryConfig {
  label: string;
  variant: 'ocean' | 'sage' | 'warning' | 'ember' | 'neutral';
}

const CATEGORY_CONFIG: Record<DeviceCategory, CategoryConfig> = {
  'iot': { label: 'IoT', variant: 'ocean' },
  'mobile': { label: 'Mobile', variant: 'sage' },
  'pc': { label: 'PC', variant: 'warning' },
  'smart-home': { label: 'Smart Home', variant: 'ember' },
  'unknown': { label: 'Sconosciuto', variant: 'neutral' },
};

interface DeviceCategoryBadgeProps {
  category: DeviceCategory;
  onClick?: () => void;
}

/**
 * DeviceCategoryBadge Component
 *
 * Displays a color-coded badge for device categories with optional click interaction.
 * Used in device lists for visual categorization (IoT, Mobile, PC, Smart Home, Unknown).
 *
 * @param {Object} props - Component props
 * @param {DeviceCategory} props.category - Device category to display
 * @param {() => void} [props.onClick] - Optional click handler for inline editing
 *
 * @example
 * // Read-only badge
 * <DeviceCategoryBadge category="mobile" />
 *
 * @example
 * // Interactive badge (click to edit)
 * <DeviceCategoryBadge category="iot" onClick={() => setEditingMac(mac)} />
 */
export function DeviceCategoryBadge({ category, onClick }: DeviceCategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG['unknown'];

  return (
    <Badge
      variant={config.variant}
      size="sm"
      className={onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {config.label}
    </Badge>
  );
}

export default DeviceCategoryBadge;
