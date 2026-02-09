'use client';

import { Banner, Text } from '../../ui';

type BatteryState = 'full' | 'high' | 'medium' | 'low' | 'very_low';
type ModuleType = 'NRV' | 'NATherm1' | 'NAPlug' | 'OTH' | 'OTM' | string;

interface Module {
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
function getBatteryIcon(state: BatteryState): string {
  switch (state) {
    case 'very_low':
      return '🪫'; // Empty battery
    case 'low':
      return '🔋'; // Low battery
    case 'medium':
      return '🔋';
    case 'high':
    case 'full':
    default:
      return '🔋';
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
  const icon = hasCriticalBattery ? '🪫' : '🔋';

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
  }).join(', ');

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
  const icon = getBatteryIcon(batteryState);
  const label = getBatteryLabel(batteryState);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isCritical
          ? 'bg-danger-900/40 text-danger-300 border border-danger-500/40 [html:not(.dark)_&]:bg-danger-50 [html:not(.dark)_&]:text-danger-700 [html:not(.dark)_&]:border-danger-200'
          : 'bg-warning-900/40 text-warning-300 border border-warning-500/40 [html:not(.dark)_&]:bg-warning-50 [html:not(.dark)_&]:text-warning-700 [html:not(.dark)_&]:border-warning-200'
      }`}
    >
      <span>{icon}</span>
      {showLabel && <span>{label}</span>}
    </span>
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
        {batteryModules.map(module => (
          <div
            key={module.id}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-800/30 [html:not(.dark)_&]:bg-slate-100/50"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {module.type === 'NRV' ? '🔧' : '🌡️'}
              </span>
              <Text size="sm">
                {module.name || getModuleTypeName(module.type)}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              {module.battery_state && (
                <BatteryBadge batteryState={module.battery_state} showLabel />
              )}
              {!module.reachable && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/40 text-slate-400 border border-slate-600/40 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:border-slate-300"
                >
                  Offline
                </span>
              )}
              {module.battery_state && !['low', 'very_low'].includes(module.battery_state) && (
                <span className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500">
                  {getBatteryIcon(module.battery_state)} {getBatteryLabel(module.battery_state)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
