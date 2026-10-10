/**
 * /settings/notifications — Web Push sent by the Pi (workspace ROADMAP M48),
 * per-user event preferences (M61).
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';

jest.mock('@/lib/push/pushClient', () => ({
  disablePush: jest.fn().mockResolvedValue(undefined),
  enablePush: jest.fn(),
  getChoice: jest.fn(),
  getPermission: jest.fn(),
  getPushSupport: jest.fn(),
  getSubscriptionId: jest.fn(),
}));

import NotificationsSettingsPage from '../page';
import * as push from '@/lib/push/pushClient';

const mocked = jest.mocked(push);
const device = {
  id: 1, endpoint_host: 'fcm.googleapis.com', device_name: 'Pixel · Chrome', user_agent: null, user_id: 'user:1',
  created_at: 1790000000, updated_at: 1790000000, last_success_at: 1790600000, last_error: null, failure_count: 0,
};
const other = { ...device, id: 2, device_name: 'iPad', last_error: '500: boom', failure_count: 2 };
const pref = (event: string, title: string, group: string, group_title: string, enabled = true) => ({
  event, title, description: `Quando: ${title}`, group, group_title, priority: 'normal', enabled,
});
const preferences = {
  user_id: 'user:1',
  items: [
    pref('scheduler_ignition', 'Accensione automatica', 'scheduler', 'Programmazione stufa'),
    pref('scheduler_shutdown', 'Spegnimento automatico', 'scheduler', 'Programmazione stufa', false),
    pref('stove_alarm', 'Allarme stufa', 'stove', 'Stufa'),
  ],
};

function mockFetch(overrides: Record<string, { status: number; body?: unknown }> = {}) {
  global.fetch = jest.fn(async (url: string) => {
    const key = Object.keys(overrides).find((k) => url.includes(k));
    if (key) {
      const { status, body } = overrides[key]!;
      return { ok: status < 300, status, json: async () => body } as Response;
    }
    if (url.includes('/preferences')) {
      return { ok: true, status: 200, json: async () => preferences } as Response;
    }
    if (url.includes('/history')) {
      return {
        ok: true, status: 200,
        json: async () => ({ items: [{ id: 5, ts: 1790608800, event: 'test', title: 'Notifica di prova', body: 'ok', url: '/', sent: 1, failed: 0 }] }),
      } as Response;
    }
    return { ok: true, status: 200, json: async () => ({ items: [device, other] }) } as Response;
  }) as unknown as typeof fetch;
}

async function renderPage() {
  await act(async () => {
    render(<NotificationsSettingsPage />);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mocked.getPushSupport.mockReturnValue('supported');
  mocked.getPermission.mockReturnValue('granted');
  mocked.getChoice.mockReturnValue('enabled');
  mocked.getSubscriptionId.mockReturnValue(1);
  mockFetch();
});

it('shows this device on, the registered devices and the history', async () => {
  await renderPage();
  expect(screen.getByTestId('push-device-state')).toHaveTextContent('Notifiche attive');
  const devices = screen.getByTestId('push-devices-card');
  expect(within(devices).getByText('questo dispositivo')).toBeInTheDocument();
  expect(within(devices).getByText(/500: boom/)).toBeInTheDocument();
  expect(screen.getByTestId('push-history-card')).toHaveTextContent('Notifica di prova');
});

it('toggle off disables push on this device and updates the state', async () => {
  await renderPage();
  mocked.disablePush.mockImplementation(async () => {
    mocked.getChoice.mockReturnValue('disabled');
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('switch', { name: 'Disattiva notifiche' }));
  });
  expect(mocked.disablePush).toHaveBeenCalled();
  expect(screen.getByTestId('push-device-state')).toHaveTextContent('Notifiche disattivate');
  expect(screen.getByRole('switch', { name: 'Attiva notifiche' })).toBeInTheDocument();
});

it('toggle on enables push', async () => {
  mocked.getChoice.mockReturnValue('disabled');
  mocked.enablePush.mockResolvedValue({ ok: true, subscriptionId: 1 });
  await renderPage();
  await act(async () => {
    fireEvent.click(screen.getByRole('switch', { name: 'Attiva notifiche' }));
  });
  expect(mocked.enablePush).toHaveBeenCalled();
});

it('test push targets this device', async () => {
  mockFetch({ '/test': { status: 200, body: { sent: 1, failed: 0, removed: 0 } } });
  await renderPage();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Invia notifica di prova' }));
  });
  const call = (global.fetch as jest.Mock).mock.calls.find(([u]) => String(u).endsWith('/test'));
  expect(JSON.parse(call[1].body)).toEqual({ subscription_id: 1 });
  expect(screen.getByRole('status')).toHaveTextContent('Notifica di prova inviata');
});

it('explains a blocked permission and hides the toggle', async () => {
  mocked.getPermission.mockReturnValue('denied');
  await renderPage();
  expect(screen.getByTestId('push-help')).toHaveTextContent('bloccate');
  expect(within(screen.getByTestId('push-device-card')).queryByRole('switch')).toBeNull();
});

describe('what to receive (M61)', () => {
  it('lists the events by group with the choice of this user', async () => {
    await renderPage();
    const card = screen.getByTestId('push-preferences-card');
    const scheduler = within(card).getByRole('region', { name: 'Programmazione stufa' });
    expect(within(scheduler).getAllByRole('switch')).toHaveLength(2);
    expect(within(card).getByRole('region', { name: 'Stufa' })).toHaveTextContent('Quando: Allarme stufa');
    expect(within(card).getByRole('switch', { name: 'Disattiva notifica: Accensione automatica' })).toBeChecked();
    expect(within(card).getByRole('switch', { name: 'Attiva notifica: Spegnimento automatico' })).not.toBeChecked();
  });

  it('a switch saves only that event and shows the answer of the Pi', async () => {
    await renderPage();
    const saved = {
      ...preferences,
      items: preferences.items.map((i) => (i.event === 'stove_alarm' ? { ...i, enabled: false } : i)),
    };
    (global.fetch as jest.Mock).mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => saved }));
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: 'Disattiva notifica: Allarme stufa' }));
    });
    const [url, init] = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
    expect(url).toBe('/api/v1/notifications/preferences');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ events: { stove_alarm: false } });
    expect(screen.getByRole('switch', { name: 'Attiva notifica: Allarme stufa' })).not.toBeChecked();
  });

  it('a failed save keeps the old choice and says so', async () => {
    await renderPage();
    (global.fetch as jest.Mock).mockImplementationOnce(async () => ({ ok: false, status: 502, json: async () => ({}) }));
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: 'Disattiva notifica: Allarme stufa' }));
    });
    expect(within(screen.getByTestId('push-preferences-card')).getByRole('alert')).toHaveTextContent('Salvataggio non riuscito');
    expect(screen.getByRole('switch', { name: 'Disattiva notifica: Allarme stufa' })).toBeChecked();
  });

  it('says when the preferences cannot be loaded', async () => {
    mockFetch({ '/preferences': { status: 503 } });
    await renderPage();
    expect(within(screen.getByTestId('push-preferences-card')).getByRole('alert')).toHaveTextContent('Impossibile caricare le preferenze');
  });
});

it('explains the iPhone install step', async () => {
  mocked.getPushSupport.mockReturnValue('ios-install');
  await renderPage();
  expect(screen.getByTestId('push-help')).toHaveTextContent('schermata Home');
});

it('removing another device calls DELETE, removing this one disables push', async () => {
  await renderPage();
  const rows = within(screen.getByTestId('push-devices-card')).getAllByRole('button', { name: 'Rimuovi' });
  await act(async () => {
    fireEvent.click(rows[1]!);
  });
  expect((global.fetch as jest.Mock).mock.calls.some(([u, i]) => u === '/api/v1/notifications/subscriptions/2' && i?.method === 'DELETE')).toBe(true);
  await act(async () => {
    fireEvent.click(rows[0]!);
  });
  expect(mocked.disablePush).toHaveBeenCalled();
});
