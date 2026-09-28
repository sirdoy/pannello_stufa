jest.mock('@/lib/notifications/notificationTriggersServer', () => ({
  triggerMaintenanceAlertServer: jest.fn().mockResolvedValue({ success: true }),
  triggerSchedulerActionServer: jest.fn().mockResolvedValue({ success: true }),
  triggerStoveStatusWorkServer: jest.fn().mockResolvedValue({ success: true }),
  triggerStoveUnexpectedOffServer: jest.fn().mockResolvedValue({ success: true }),
}));

import {
  triggerMaintenanceAlertServer,
  triggerSchedulerActionServer,
  triggerStoveStatusWorkServer,
  triggerStoveUnexpectedOffServer,
} from '@/lib/notifications/notificationTriggersServer';
import { dispatchStoveEvent, stoveEventMessage } from '../stoveEvents';

// 2026-03-30 06:00 Europe/Rome (CEST, UTC+2) = 04:00 UTC
const TS = Date.UTC(2026, 2, 30, 4, 0) / 1000;
const SLOT = { start_minutes: 360, end_minutes: 390, power: 2, fan: 3 };

describe('stoveEventMessage', () => {
  it.each([
    [{ event: 'scheduler_ignition', data: { slot: SLOT } }, 'Stufa accesa automaticamente alle 06:00 (P2, V3)'],
    [{ event: 'scheduler_shutdown', data: {} }, 'Stufa spenta automaticamente alle 06:00'],
    [
      { event: 'scheduler_ignite_failed', data: { attempts: 2, slot: SLOT } },
      'Accensione automatica non riuscita dopo 2 tentativi (06:00-06:30)',
    ],
    [
      { event: 'stove_unexpected_off', data: { slot: SLOT } },
      "La stufa si è spenta durante l'orario programmato (06:00-06:30)",
    ],
    [
      { event: 'stove_alarm', data: { error_code: 4, error_description: 'Mancata accensione' } },
      'Allarme stufa: Mancata accensione (codice 4)',
    ],
    [{ event: 'stove_status_work', data: {} }, 'La stufa è ora in funzione'],
    [
      { event: 'maintenance_80', data: { current_hours: 40, target_hours: 50, percentage: 80 } },
      '10.0h rimanenti prima della manutenzione (80%)',
    ],
    [
      { event: 'maintenance_90', data: { current_hours: 45, target_hours: 50, percentage: 90 } },
      'Solo 5.0h rimanenti prima della pulizia richiesta',
    ],
    [
      { event: 'maintenance_100', data: { current_hours: 50, target_hours: 50, percentage: 100 } },
      "Manutenzione richiesta! L'accensione è bloccata fino alla pulizia.",
    ],
  ])('%o', (partial, expected) => {
    expect(stoveEventMessage({ ts: TS, ...partial } as never)).toBe(expected);
  });
});

describe('dispatchStoveEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('routes scheduler actions to the scheduler trigger', async () => {
    await dispatchStoveEvent('u1', { event: 'scheduler_shutdown', data: {}, ts: TS });
    expect(triggerSchedulerActionServer).toHaveBeenCalledWith('u1', 'shutdown', {
      message: 'Stufa spenta automaticamente alle 06:00',
    });
  });

  it.each(['scheduler_ignite_failed', 'stove_unexpected_off', 'stove_alarm'] as const)(
    '%s uses the unexpected-off (error) trigger',
    async (event) => {
      await dispatchStoveEvent('u1', { event, data: {}, ts: TS });
      expect(triggerStoveUnexpectedOffServer).toHaveBeenCalledTimes(1);
    }
  );

  it('stove_status_work uses the status trigger', async () => {
    await dispatchStoveEvent('u1', { event: 'stove_status_work', data: {}, ts: TS });
    expect(triggerStoveStatusWorkServer).toHaveBeenCalledTimes(1);
  });

  it('maintenance levels pass threshold and remaining hours', async () => {
    await dispatchStoveEvent('u1', {
      event: 'maintenance_90',
      data: { current_hours: 45, target_hours: 50, percentage: 90 },
      ts: TS,
    });
    expect(triggerMaintenanceAlertServer).toHaveBeenCalledWith('u1', 90, {
      message: 'Solo 5.0h rimanenti prima della pulizia richiesta',
      remainingHours: 5,
    });
  });
});
