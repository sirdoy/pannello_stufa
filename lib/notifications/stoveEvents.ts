/**
 * Stove events sent by the Pi scheduler (workspace ROADMAP D2.4) → push notifications.
 * The same webhook also carries `dirigera_sensors_unreachable` (ROADMAP D9).
 *
 * The Pi reports what happened (`POST /api/internal/stove-events`); this module
 * turns each event into the existing server-side trigger + Italian message.
 * Contract: ../docs/api/scheduler.md#notifications-webhook.
 */
import {
  triggerHealthMonitoringAlertServer,
  triggerMaintenanceAlertServer,
  triggerSchedulerActionServer,
  triggerStoveStatusWorkServer,
  triggerStoveUnexpectedOffServer,
} from '@/lib/notifications/notificationTriggersServer';

export const STOVE_EVENTS = [
  'scheduler_ignition',
  'scheduler_shutdown',
  'scheduler_ignite_failed',
  'stove_unexpected_off',
  'stove_alarm',
  'stove_status_work',
  'maintenance_80',
  'maintenance_90',
  'maintenance_100',
  'dirigera_sensors_unreachable',
] as const;

export type StoveEvent = (typeof STOVE_EVENTS)[number];

export interface StoveEventBody {
  event: StoveEvent;
  data: Record<string, unknown>;
  ts: number; // Unix seconds
}

interface Slot {
  start_minutes: number;
  end_minutes: number;
  power: number;
  fan: number;
}

const hhmm = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const slotRange = (slot: Slot | undefined): string =>
  slot ? `${hhmm(slot.start_minutes)}-${hhmm(slot.end_minutes)}` : '';

interface UnreachableSensor {
  name?: string | null;
  room?: string | null;
}

const sensorLabel = (s: UnreachableSensor): string =>
  s.room ? `${s.name || 'Sensore'} (${s.room})` : s.name || 'Sensore';

const romeTime = (ts: number): string =>
  new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  }).format(new Date(ts * 1000));

/** Italian message for an event (pure: exported for tests). */
export function stoveEventMessage({ event, data, ts }: StoveEventBody): string {
  const slot = data.slot as Slot | undefined;
  switch (event) {
    case 'scheduler_ignition':
      return slot
        ? `Stufa accesa automaticamente alle ${romeTime(ts)} (P${slot.power}, V${slot.fan})`
        : `Stufa accesa automaticamente alle ${romeTime(ts)}`;
    case 'scheduler_shutdown':
      return `Stufa spenta automaticamente alle ${romeTime(ts)}`;
    case 'scheduler_ignite_failed':
      return `Accensione automatica non riuscita dopo ${String(data.attempts ?? 2)} tentativi (${slotRange(slot)})`;
    case 'stove_unexpected_off':
      return `La stufa si è spenta durante l'orario programmato (${slotRange(slot)})`;
    case 'stove_alarm':
      return `Allarme stufa: ${String(data.error_description || 'errore sconosciuto')} (codice ${String(data.error_code ?? '?')})`;
    case 'stove_status_work':
      return 'La stufa è ora in funzione';
    case 'maintenance_80':
    case 'maintenance_90':
    case 'maintenance_100': {
      const remaining = Math.max(0, Number(data.target_hours) - Number(data.current_hours));
      if (event === 'maintenance_100') {
        return "Manutenzione richiesta! L'accensione è bloccata fino alla pulizia.";
      }
      if (event === 'maintenance_90') {
        return `Solo ${remaining.toFixed(1)}h rimanenti prima della pulizia richiesta`;
      }
      return `${remaining.toFixed(1)}h rimanenti prima della manutenzione (${Number(data.percentage).toFixed(0)}%)`;
    }
    case 'dirigera_sensors_unreachable': {
      const sensors = Array.isArray(data.sensors) ? (data.sensors as UnreachableSensor[]) : [];
      const hours = String(data.threshold_hours ?? '?');
      const who = sensors.map(sensorLabel).join(', ') || 'Sensori IKEA';
      const verb = sensors.length > 1 ? 'non rispondono' : 'non risponde';
      return `${who} ${verb} da oltre ${hours} h: ricollega all'hub o cambia la batteria`;
    }
  }
}

/** Sends the push notification for an event to the admin user. */
export async function dispatchStoveEvent(userId: string, body: StoveEventBody) {
  const message = stoveEventMessage(body);
  switch (body.event) {
    case 'scheduler_ignition':
      return triggerSchedulerActionServer(userId, 'ignition', { message });
    case 'scheduler_shutdown':
      return triggerSchedulerActionServer(userId, 'shutdown', { message });
    case 'scheduler_ignite_failed':
    case 'stove_unexpected_off':
    case 'stove_alarm':
      return triggerStoveUnexpectedOffServer(userId, { message });
    case 'stove_status_work':
      return triggerStoveStatusWorkServer(userId, { message });
    case 'maintenance_80':
    case 'maintenance_90':
    case 'maintenance_100': {
      const threshold = Number(body.event.split('_')[1]);
      const remainingHours = Math.max(
        0,
        Number(body.data.target_hours) - Number(body.data.current_hours)
      );
      return triggerMaintenanceAlertServer(userId, threshold, { message, remainingHours });
    }
    case 'dirigera_sensors_unreachable':
      return triggerHealthMonitoringAlertServer(userId, 'dirigera_unreachable', { message });
  }
}
