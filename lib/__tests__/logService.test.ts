import {
  logUserAction,
  logStoveAction,
  logSchedulerAction,
  logNetatmoAction,
} from '../logService';
import { createMockFetchResponse } from '@/__tests__/__utils__/mockFactories';

// Mock routes
jest.mock('../routes', () => ({
  LOG_ROUTES: {
    add: '/api/log/add',
  },
}));

describe('logService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock global fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  describe('logUserAction', () => {
    test('logs action with correct API call', async () => {
      // ARRANGE
      global.fetch = jest.fn().mockResolvedValue(
        createMockFetchResponse({ success: true })
      ) as jest.MockedFunction<typeof fetch>;

      // ACT
      await logUserAction('Test action', 'Test value', { key: 'metadata' } as any, {});

      // ASSERT
      expect(global.fetch).toHaveBeenCalledWith('/api/log/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'Test action',
          device: 'Test value',
          value: { key: 'metadata' },
        }),
      });
    });

    test('logs action without value when value is null', async () => {
      // ARRANGE
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action', 'test-device');

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Test action');
      expect(callBody).toHaveProperty('device', 'test-device');
      expect(callBody).not.toHaveProperty('value');
    });

    test('logs action without metadata when metadata is empty', async () => {
      // ARRANGE
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action', 'test-device', 'value');

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Test action');
      expect(callBody).toHaveProperty('device', 'test-device');
      expect(callBody).toHaveProperty('value', 'value');
    });

    test('includes metadata in log when provided', async () => {
      // ARRANGE
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action', 'test-device', null, { source: 'manual', deviceId: '123' });

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Test action');
      expect(callBody).toHaveProperty('device', 'test-device');
      expect(callBody).toHaveProperty('source', 'manual');
      expect(callBody).toHaveProperty('deviceId', '123');
      expect(callBody).not.toHaveProperty('value');
    });

    test('logs error when API call fails', async () => {
      // ARRANGE
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // ACT
      await logUserAction('Test action', 'test-device');

      // ASSERT
      expect(console.error).toHaveBeenCalledWith(
        'Failed to log action:',
        'Test action'
      );
    });

    test('logs error when fetch throws exception', async () => {
      // ARRANGE
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // ACT
      await logUserAction('Test action', 'test-device');

      // ASSERT
      expect(console.error).toHaveBeenCalledWith(
        'Error logging action:',
        expect.any(Error)
      );
    });

    test('handles value 0 correctly (falsy but valid)', async () => {
      // ARRANGE
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action', 'test-device', 0);

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('device', 'test-device');
      expect(callBody).toHaveProperty('value', 0);
    });

    test('handles empty string value correctly', async () => {
      // ARRANGE
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action', 'test-device', '');

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('device', 'test-device');
      expect(callBody).toHaveProperty('value', '');
    });
  });

  describe('logStoveAction', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    });

    test('ignite logs correct action', async () => {
      // ACT
      await logStoveAction.ignite();

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Accensione stufa');
    });

    test('shutdown logs correct action', async () => {
      // ACT
      await logStoveAction.shutdown();

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Spegnimento stufa');
    });

    test('setFan logs correct action with level', async () => {
      // ACT
      await logStoveAction.setFan(3);

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Modifica ventilazione');
      expect(callBody).toHaveProperty('value', 3);
    });

    test('setPower logs correct action with level', async () => {
      // ACT
      await logStoveAction.setPower(4);

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Modifica potenza');
      expect(callBody).toHaveProperty('value', 4);
    });
  });

  describe('logSchedulerAction', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    });

    test('toggleMode logs correct action when enabled', async () => {
      // ACT
      await logSchedulerAction.toggleMode(true);

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Attivazione modalità automatica');
    });

    test('toggleMode logs correct action when disabled', async () => {
      // ACT
      await logSchedulerAction.toggleMode(false);

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Attivazione modalità manuale');
    });

    test('updateSchedule logs correct action with day metadata', async () => {
      // ACT
      await logSchedulerAction.updateSchedule('Lunedì');

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Modifica scheduler');
      expect(callBody).toHaveProperty('day', 'Lunedì');
      expect(callBody).not.toHaveProperty('value');
    });

    test('addInterval logs correct action with day metadata', async () => {
      // ACT
      await logSchedulerAction.addInterval('Martedì');

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Aggiunto intervallo scheduler');
      expect(callBody).toHaveProperty('day', 'Martedì');
    });

    test('removeInterval logs correct action with day and index metadata', async () => {
      // ACT
      await logSchedulerAction.removeInterval('Mercoledì', 2);

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Rimosso intervallo scheduler');
      expect(callBody).toHaveProperty('day', 'Mercoledì');
      expect(callBody).toHaveProperty('intervalIndex', 2);
    });

    test('clearSemiManual logs correct action', async () => {
      // ACT
      await logSchedulerAction.clearSemiManual();

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Disattivazione modalità semi-manuale');
    });
  });

  describe('logNetatmoAction', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    });

    test('connect logs correct action', async () => {
      // ACT
      await logNetatmoAction.connect();

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Connessione Netatmo');
    });

    test('disconnect logs correct action', async () => {
      // ACT
      await logNetatmoAction.disconnect();

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Disconnessione Netatmo');
    });

    test('setRoomTemperature logs correct action with temperature and room', async () => {
      // ACT
      await logNetatmoAction.setRoomTemperature('Living Room', 21.5);

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Modifica temperatura stanza');
      expect(callBody).toHaveProperty('value', 21.5);
      expect(callBody).toHaveProperty('roomName', 'Living Room');
    });

    test('setMode logs correct action with mode', async () => {
      // ACT
      await logNetatmoAction.setMode('schedule');

      // ASSERT
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Cambio modalità termostato');
      expect(callBody).toHaveProperty('value', 'schedule');
    });
  });

  describe('Default export', () => {
    test('default export has all expected properties', async () => {
      // ARRANGE
      const logService = (await import('../logService')).default;

      // ASSERT
      expect(logService).toHaveProperty('logUserAction');
      expect(logService).toHaveProperty('stove');
      expect(logService).toHaveProperty('scheduler');
      expect(logService).toHaveProperty('netatmo');
    });

    test('default export stove actions work correctly', async () => {
      // ARRANGE
      const logService = (await import('../logService')).default;
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // ACT
      await logService.stove.ignite();

      // ASSERT
      expect(global.fetch).toHaveBeenCalled();
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Accensione stufa');
    });
  });
});
