/**
 * Phase 180 — Automations tab catalogs + default factories.
 *
 * Exports:
 *   - TRIGGER_TYPES (2 entries, D-08)
 *   - CONDITION_TYPES (4 picker entries, D-18)
 *   - ACTION_TYPES (11 entries in locked order, D-09)
 *   - defaultTrigger(type) factory
 *   - defaultCondition(type) factory
 *   - defaultAction(type) factory
 *
 * Pattern mirrors app/components/EmberGlass/rooms/lib/rooms-config.ts (Phase 179).
 */
import {
  Clock,
  Power,
  Thermometer,
  Home,
  Calendar,
  Flame,
  Lightbulb,
  Plug,
  Music,
  AlertCircle,
  Zap,
  Sparkles,
  Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TriggerType, ConditionNode, ActionItem } from '@/types/automations';
import { assertNever } from '@/lib/utils/assertNever';

// ─── TRIGGER_TYPES (D-08 — 2 entries) ──────────────────────────────────────
export const TRIGGER_TYPES = [
  {
    id: 'schedule_cron' as const,
    label: 'Pianificazione',
    Icon: Clock,
    tone: '#5eafff',
    desc: 'Ora o cron schedule',
  },
  {
    id: 'manual_api_call' as const,
    label: 'Manuale',
    Icon: Power,
    tone: 'var(--text-2)',
    desc: 'Attivata solo via app o API',
  },
] as const satisfies ReadonlyArray<{
  id: TriggerType['type'];
  label: string;
  Icon: LucideIcon;
  tone: string;
  desc: string;
}>;

// ─── CONDITION_TYPES (D-18 — 4 picker entries) ─────────────────────────────
type ConditionPickerType = 'time_window' | 'device_state' | 'temperature_range' | 'always_true';

export const CONDITION_TYPES = [
  { id: 'time_window' as const, label: 'Fascia oraria', Icon: Clock, tone: '#5eafff' },
  { id: 'device_state' as const, label: 'Stato dispositivo', Icon: Home, tone: '#ffb84a' },
  { id: 'temperature_range' as const, label: 'Intervallo temperatura', Icon: Thermometer, tone: '#b080ff' },
  { id: 'always_true' as const, label: 'Sempre vero', Icon: Check, tone: 'var(--text-2)' },
] as const satisfies ReadonlyArray<{
  id: ConditionPickerType;
  label: string;
  Icon: LucideIcon;
  tone: string;
}>;

// ─── ACTION_TYPES (D-09 — 11 entries, exact order locked) ──────────────────
export const ACTION_TYPES = [
  { id: 'netatmo_set_room_temp' as const, label: 'Imposta temp. stanza', Icon: Thermometer, tone: '#5eafff' },
  { id: 'netatmo_set_home_mode' as const, label: 'Modalità casa', Icon: Home, tone: '#ffb84a' },
  { id: 'netatmo_switch_schedule' as const, label: 'Cambia programma', Icon: Calendar, tone: '#b080ff' },
  { id: 'thermorossi' as const, label: 'Comando stufa', Icon: Flame, tone: 'var(--accent)' },
  { id: 'hue_light' as const, label: 'Luce singola', Icon: Lightbulb, tone: '#f5c84a' },
  { id: 'hue_group' as const, label: 'Gruppo luci', Icon: Lightbulb, tone: '#f5c84a' },
  { id: 'hue_scene' as const, label: 'Scena Hue', Icon: Sparkles, tone: '#f5c84a' },
  { id: 'tuya' as const, label: 'Presa', Icon: Plug, tone: '#ffb84a' },
  { id: 'sonos' as const, label: 'Comando Sonos', Icon: Music, tone: '#b080ff' },
  { id: 'http_webhook' as const, label: 'Webhook HTTP', Icon: Zap, tone: '#5eafff' },
  { id: 'log_event' as const, label: 'Scrivi log', Icon: AlertCircle, tone: 'var(--text-2)' },
] as const satisfies ReadonlyArray<{
  id: ActionItem['type'];
  label: string;
  Icon: LucideIcon;
  tone: string;
}>;

// ─── ITALIAN_LABELS helper (Italian display strings for catalog) ────────────
export const ITALIAN_LABELS = {
  trigger: Object.fromEntries(TRIGGER_TYPES.map(t => [t.id, t.label])) as Record<TriggerType['type'], string>,
  condition: Object.fromEntries(CONDITION_TYPES.map(c => [c.id, c.label])) as Record<ConditionPickerType, string>,
  action: Object.fromEntries(ACTION_TYPES.map(a => [a.id, a.label])) as Record<ActionItem['type'], string>,
};

// ─── Factories ──────────────────────────────────────────────────────────────

/**
 * Returns a default TriggerType value for the given type literal.
 * All factories use exhaustive switch with assertNever in the default branch.
 */
export function defaultTrigger(type: TriggerType['type']): TriggerType {
  switch (type) {
    case 'schedule_cron':
      return { type: 'schedule_cron', cron_expression: '0 8 * * *' };
    case 'manual_api_call':
      return { type: 'manual_api_call' };
    default:
      return assertNever(type);
  }
}

/**
 * Returns a default ConditionNode for the 4 picker types.
 * Sensor leaves (sensor_state_change, sensor_threshold, netatmo_temperature_threshold)
 * are NOT supported in the picker per D-08 — they are preserved on round-trip only.
 */
export function defaultCondition(type: ConditionPickerType): ConditionNode {
  switch (type) {
    case 'time_window':
      return { type: 'time_window', start_time: '08:00', end_time: '20:00' };
    case 'device_state':
      return { type: 'device_state', sensor_id: '', expected_state: '' };
    case 'temperature_range':
      return { type: 'temperature_range', min_temp: null, max_temp: null };
    case 'always_true':
      return { type: 'always_true' };
    default:
      return assertNever(type);
  }
}

/**
 * Returns a default ActionItem for the given type literal.
 * All 11 API action types are covered; assertNever guards the default branch.
 */
export function defaultAction(type: ActionItem['type']): ActionItem {
  switch (type) {
    case 'netatmo_set_room_temp':
      return { type: 'netatmo_set_room_temp', home_id: '', room_id: '', mode: 'manual', temp: 21 };
    case 'netatmo_set_home_mode':
      return { type: 'netatmo_set_home_mode', home_id: '', mode: 'schedule' };
    case 'netatmo_switch_schedule':
      return { type: 'netatmo_switch_schedule', home_id: '', schedule_id: '' };
    case 'http_webhook':
      return { type: 'http_webhook', url: '', method: 'POST', payload: null };
    case 'log_event':
      return { type: 'log_event', message: '' };
    case 'hue_light':
      return {
        type: 'hue_light',
        light_id: '',
        on: null,
        brightness: null,
        color_temp: null,
        hue: null,
        sat: null,
      };
    case 'hue_group':
      return { type: 'hue_group', group_id: '', on: null, brightness: null, color_temp: null };
    case 'hue_scene':
      return { type: 'hue_scene', group_id: '', scene_id: '' };
    case 'thermorossi':
      return { type: 'thermorossi', command: 'ignite', power_level: null, fan_level: null, water_temp: null };
    case 'sonos':
      return { type: 'sonos', speaker_uid: '', command: 'play', volume: null, source: null };
    case 'tuya':
      return { type: 'tuya', device_id: '', command: 'set_status', on: null, timer_seconds: null };
    default:
      return assertNever(type);
  }
}
