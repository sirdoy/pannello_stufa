/**
 * Stove maintenance client on the Pi backend (workspace ROADMAP D2.5).
 */
import {
  canIgnite,
  confirmCleaning,
  getMaintenanceData,
  getMaintenanceStatus,
  updateTargetHours,
} from '../maintenanceService';

const STATE = {
  current_hours: 45,
  target_hours: 50,
  percentage: 90,
  needs_cleaning: false,
  last_cleaned_at: 1_790_000_000,
  last_notification_level: 90,
  updated_at: 1_790_001_000,
};

const fetchMock = jest.fn();

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body });
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

it('getMaintenanceData maps the backend state to the UI shape', async () => {
  respond({ success: true, ...STATE });

  expect(await getMaintenanceData()).toEqual({
    currentHours: 45,
    targetHours: 50,
    lastCleanedAt: new Date(1_790_000_000_000).toISOString(),
    needsCleaning: false,
    lastUpdatedAt: new Date(1_790_001_000_000).toISOString(),
    lastNotificationLevel: 90,
  });
  expect(fetchMock).toHaveBeenCalledWith('/api/v1/thermorossi/maintenance', expect.any(Object));
});

it('getMaintenanceStatus adds percentage, remaining hours and near-limit flag', async () => {
  respond({ success: true, ...STATE });

  const status = await getMaintenanceStatus();

  expect(status.percentage).toBe(90);
  expect(status.remainingHours).toBe(5);
  expect(status.isNearLimit).toBe(true);
});

it('canIgnite follows needs_cleaning and fails open on errors', async () => {
  respond({ success: true, ...STATE, needs_cleaning: true });
  expect(await canIgnite()).toBe(false);

  jest.spyOn(console, 'error').mockImplementation(() => {});
  respond({ error: 'down' }, 503);
  expect(await canIgnite()).toBe(true);
});

it('updateTargetHours PATCHes the target', async () => {
  respond({ success: true, ...STATE, target_hours: 100 });

  await updateTargetHours('100');

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/v1/thermorossi/maintenance');
  expect(init.method).toBe('PATCH');
  expect(JSON.parse(init.body)).toEqual({ target_hours: 100 });
});

it('confirmCleaning goes through the logging route and surfaces errors', async () => {
  respond({ success: true, previousHours: 45 });
  await expect(confirmCleaning()).resolves.toBe(true);
  expect(fetchMock.mock.calls[0][0]).toBe('/api/maintenance/confirm-cleaning');

  respond({ success: false, error: 'Pi offline' }, 503);
  await expect(confirmCleaning()).rejects.toThrow('Pi offline');
});
