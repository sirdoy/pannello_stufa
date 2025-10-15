import {
  logUserAction,
  logStoveAction,
  logSchedulerAction,
  logNetatmoAction,
} from '../logService';

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
    delete global.fetch;
  });

  describe('logUserAction', () => {
    test('logs action with correct API call', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // ACT
      await logUserAction('Test action', 'Test value', { key: 'metadata' });

      // ASSERT
      expect(global.fetch).toHaveBeenCalledWith('/api/log/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'Test action',
          value: 'Test value',
          key: 'metadata',
        }),
      });
    });

    test('logs action without value when value is null', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action');

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Test action');
      expect(callBody).not.toHaveProperty('value');
    });

    test('logs action without metadata when metadata is empty', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action', 'value');

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Test action');
      expect(callBody).toHaveProperty('value', 'value');
    });

    test('includes metadata in log when provided', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action', null, { source: 'manual', deviceId: '123' });

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Test action');
      expect(callBody).toHaveProperty('source', 'manual');
      expect(callBody).toHaveProperty('deviceId', '123');
      expect(callBody).not.toHaveProperty('value');
    });

    test('logs error when API call fails', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      // ACT
      await logUserAction('Test action');

      // ASSERT
      expect(console.error).toHaveBeenCalledWith(
        'Failed to log action:',
        'Test action'
      );
    });

    test('logs error when fetch throws exception', async () => {
      // ARRANGE
      global.fetch.mockRejectedValue(new Error('Network error'));

      // ACT
      await logUserAction('Test action');

      // ASSERT
      expect(console.error).toHaveBeenCalledWith(
        'Error logging action:',
        expect.any(Error)
      );
    });

    test('handles value 0 correctly (falsy but valid)', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action', 0);

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('value', 0);
    });

    test('handles empty string value correctly', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({ ok: true });

      // ACT
      await logUserAction('Test action', '');

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('value', '');
    });
  });

  describe('logStoveAction', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({ ok: true });
    });

    test('ignite logs correct action', async () => {
      // ACT
      await logStoveAction.ignite();

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Accensione stufa');
    });

    test('shutdown logs correct action', async () => {
      // ACT
      await logStoveAction.shutdown();

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Spegnimento stufa');
    });

    test('setFan logs correct action with level', async () => {
      // ACT
      await logStoveAction.setFan(3);

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Modifica ventilazione');
      expect(callBody).toHaveProperty('value', 3);
    });

    test('setPower logs correct action with level', async () => {
      // ACT
      await logStoveAction.setPower(4);

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Modifica potenza');
      expect(callBody).toHaveProperty('value', 4);
    });
  });

  describe('logSchedulerAction', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({ ok: true });
    });

    test('toggleMode logs correct action when enabled', async () => {
      // ACT
      await logSchedulerAction.toggleMode(true);

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Attivazione modalità automatica');
    });

    test('toggleMode logs correct action when disabled', async () => {
      // ACT
      await logSchedulerAction.toggleMode(false);

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Attivazione modalità manuale');
    });

    test('updateSchedule logs correct action with day metadata', async () => {
      // ACT
      await logSchedulerAction.updateSchedule('Lunedì');

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Modifica scheduler');
      expect(callBody).toHaveProperty('day', 'Lunedì');
      expect(callBody).not.toHaveProperty('value');
    });

    test('addInterval logs correct action with day metadata', async () => {
      // ACT
      await logSchedulerAction.addInterval('Martedì');

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Aggiunto intervallo scheduler');
      expect(callBody).toHaveProperty('day', 'Martedì');
    });

    test('removeInterval logs correct action with day and index metadata', async () => {
      // ACT
      await logSchedulerAction.removeInterval('Mercoledì', 2);

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Rimosso intervallo scheduler');
      expect(callBody).toHaveProperty('day', 'Mercoledì');
      expect(callBody).toHaveProperty('intervalIndex', 2);
    });

    test('clearSemiManual logs correct action', async () => {
      // ACT
      await logSchedulerAction.clearSemiManual();

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Disattivazione modalità semi-manuale');
    });
  });

  describe('logNetatmoAction', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({ ok: true });
    });

    test('connect logs correct action', async () => {
      // ACT
      await logNetatmoAction.connect();

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Connessione Netatmo');
    });

    test('disconnect logs correct action', async () => {
      // ACT
      await logNetatmoAction.disconnect();

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Disconnessione Netatmo');
    });

    test('selectDevice logs correct action with deviceId metadata', async () => {
      // ACT
      await logNetatmoAction.selectDevice('device-123');

      // ASSERT
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Selezione dispositivo Netatmo');
      expect(callBody).toHaveProperty('deviceId', 'device-123');
      expect(callBody).not.toHaveProperty('value');
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
      global.fetch.mockResolvedValue({ ok: true });

      // ACT
      await logService.stove.ignite();

      // ASSERT
      expect(global.fetch).toHaveBeenCalled();
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody).toHaveProperty('action', 'Accensione stufa');
    });
  });
});
