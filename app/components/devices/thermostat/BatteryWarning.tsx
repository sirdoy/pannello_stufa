'use client';

import { BatteryFull, BatteryLow, BatteryMedium, BatteryWarning as BatteryWarningIcon, Thermometer, Wrench } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { Badge, Banner, Card, Text } from '../../ui';

export type BatteryState = 'full' | 'high' | 'medium' | 'low' | 'very_low';
type ModuleType = 'NRV' | 'NATherm1' | 'NAPlug' | 'OTH' | 'OTM' | string;

export interface Module {
  id: string;
  name?: string;
  type: ModuleType;
  battery_state?: BatteryState;
  reachable?: boolean;
}

interface BatteryWarningProps {
  lowBatteryModules?: Module[];
  hasCriticalBattery?: boolean;
  onDismiss?: (() => void) | null;
}

interface BatteryBadgeProps {
  batteryState: BatteryState;
  showLabel?: boolean;
}

interface ModuleBatteryListProps {
  modules?: Module[];
}

/**
 * BatteryWarning - Displays battery status warnings for Netatmo modules
 *
 * Battery states from Netatmo API:
 * - "full" - Battery fully charged (no warning)
 * - "high" - Battery good (no warning)
 * - "medium" - Battery adequate (no warning)
 * - "low" - Battery low (warning variant)
 * - "very_low" - Battery critical (error variant)
 */

/**
 * Get battery icon based on state
 */
function BatteryStateIcon({ state, ...props }: { state: BatteryState } & LucideProps) {
  switch (state) {
    case 'very_low':
      return <BatteryWarningIcon {...props} />;
    case 'low':
      return <BatteryLow {...props} />;
    case 'medium':
      return <BatteryMedium {...props} />;
    case 'high':
    case 'full':
    default:
      return <BatteryFull {...props} />;
  }
}

/**
 * Get display label for battery state in Italian
 */
function getBatteryLabel(state: BatteryState): string {
  switch (state) {
    case 'very_low':
      return 'Critica';
    case 'low':
      return 'Bassa';
    case 'medium':
      return 'Media';
    case 'high':
      return 'Alta';
    case 'full':
      return 'Piena';
    default:
      return state;
  }
}

/**
 * Get module type display name in Italian
 */
function getModuleTypeName(type: ModuleType): string {
  switch (type) {
    case 'NRV':
      return 'Valvola';
    case 'NATherm1':
      return 'Termostato';
    case 'NAPlug':
      return 'Relay';
    case 'OTH':
      return 'Termostato OpenTherm';
    case 'OTM':
      return 'Modulo OpenTherm';
    default:
      return type;
  }
}

/**
 * BatteryWarning component
 * Displays a banner warning for modules with low/critical battery
 */
export default function BatteryWarning({
  lowBatteryModules = [],
  hasCriticalBattery = false,
  onDismiss = null,
}: BatteryWarningProps) {
  if (!lowBatteryModules || lowBatteryModules.length === 0) {
    return null;
  }

  // Determine banner variant based on severity
  const variant = hasCriticalBattery ? 'error' : 'warning';
  const icon = hasCriticalBattery ? <BatteryWarningIcon size={24} /> : <BatteryLow size={24} />;

  // Build title based on count
  const count = lowBatteryModules.length;
  const title = hasCriticalBattery
    ? `Batteria Critica - ${count} dispositiv${count > 1 ? 'i' : 'o'}`
    : `Batteria Bassa - ${count} dispositiv${count > 1 ? 'i' : 'o'}`;

  // Build description with device list
  const deviceList = lowBatteryModules.map(module => {
    const typeName = getModuleTypeName(module.type);
    const name = module.name || module.id?.substring(0, 8) || 'Sconosciuto';
    const stateLabel = module.battery_state ? getBatteryLabel(module.battery_state) : 'Sconosciuto';
    return `${typeName} "${name}" (${stateLabel})`;
  }).join(',');

  const description = hasCriticalBattery
    ? `Sostituire le batterie immediatamente: ${deviceList}`
    : `Sostituire presto le batterie: ${deviceList}`;

  return (
    <Banner
      variant={variant}
      icon={icon}
      title={title}
      description={description}
      dismissible={!!onDismiss}
      onDismiss={onDismiss || undefined}
    />
  );
}

/**
 * BatteryBadge - Small badge to show battery status on a card
 * Used for compact battery indication in device cards
 */
export function BatteryBadge({ batteryState, showLabel = false }: BatteryBadgeProps) {
  if (!batteryState) return null;

  // Only show badge for concerning states
  if (batteryState !== 'low' && batteryState !== 'very_low') {
    return null;
  }

  const isCritical = batteryState === 'very_low';
  const label = getBatteryLabel(batteryState);

  return (
    <Badge
      variant={isCritical ? 'danger' : 'warning'}
      size="sm"
      icon={
        <BatteryStateIcon
          state={batteryState}
          size={14}
          className="block"
          aria-label={showLabel ? undefined : `Batteria ${label}`}
        />
      }
    >
      {showLabel && <span>{label}</span>}
    </Badge>
  );
}

/**
 * ModuleBatteryList - Displays all modules with their battery status
 * Used in expanded device details view
 */
export function ModuleBatteryList({ modules = [] }: ModuleBatteryListProps) {
  if (!modules || modules.length === 0) {
    return null;
  }

  // Filter to only show battery-powered modules (NRV, NATherm1)
  const batteryModules = modules.filter(m =>
    m.type === 'NRV' || m.type === 'NATherm1'
  );

  if (batteryModules.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Text variant="label" size="xs" className="font-display">
        Stato Batterie
      </Text>
      <div className="space-y-1">
        {batteryModules.map(module => {
          const ModuleIcon = module.type === 'NRV' ? Wrench : Thermometer;
          return (
            <Card
              key={module.id}
              variant="subtle"
              padding={false}
              className="flex items-center justify-between px-3 py-1.5"
            >
              <div className="flex items-center gap-2">
                <ModuleIcon size={16} className="text-(--text-2)" aria-hidden="true" />
                <Text size="sm">
                  {module.name || getModuleTypeName(module.type)}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                {module.battery_state && (
                  <BatteryBadge batteryState={module.battery_state} showLabel />
                )}
                {!module.reachable && (
                  <Badge variant="neutral" size="sm">
                    Offline
                  </Badge>
                )}
                {module.battery_state && !['low', 'very_low'].includes(module.battery_state) && (
                  <Text as="span" variant="tertiary" size="xs" className="inline-flex items-center gap-1">
                    <BatteryStateIcon state={module.battery_state} size={14} aria-hidden="true" /> {getBatteryLabel(module.battery_state)}
                  </Text>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
