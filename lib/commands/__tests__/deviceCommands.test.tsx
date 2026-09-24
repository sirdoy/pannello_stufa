/**
 * Command palette device commands — request bodies must match the backend contract:
 * - Hue: PUT /api/v1/hue/groups/{group_id}/action with { on: boolean } (Bridge v1 flat)
 * - Netatmo: POST /api/v1/netatmo/setthermmode with { home_id, mode } (home_id required)
 */

import { getDeviceCommands } from '../deviceCommands';

function findCommand(id: string) {
  for (const group of getDeviceCommands()) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item;
  }
  throw new Error(`command ${id} not found`);
}

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
}

describe('deviceCommands', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['lights-all-on', true],
    ['lights-all-off', false],
  ])('%s sends { on: %s } to every group by group_id', async (id, on) => {
    fetchMock.mockImplementation((url: string) =>
      url === '/api/v1/hue/groups'
        ? jsonResponse({ success: true, groups: [{ group_id: '1' }, { group_id: '4' }] })
        : jsonResponse({ success: true }),
    );

    await findCommand(id).onSelect();

    const actionCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/action'));
    expect(actionCalls.map(([url]) => url).sort()).toEqual([
      '/api/v1/hue/groups/1/action',
      '/api/v1/hue/groups/4/action',
    ]);
    for (const [, init] of actionCalls) {
      expect(init.method).toBe('PUT');
      expect(JSON.parse(init.body)).toEqual({ on });
    }
  });

  it.each([
    ['thermo-mode-schedule', 'schedule'],
    ['thermo-mode-away', 'away'],
    ['thermo-mode-hg', 'hg'],
  ])('%s posts setthermmode with home_id and mode=%s', async (id, mode) => {
    fetchMock.mockImplementation((url: string) =>
      url === '/api/v1/netatmo/homesdata'
        ? jsonResponse({ success: true, body: { homes: [{ id: 'home-123', name: 'Casa' }] } })
        : jsonResponse({ success: true }),
    );

    await findCommand(id).onSelect();

    const call = fetchMock.mock.calls.find(([url]) => url === '/api/v1/netatmo/setthermmode');
    expect(call).toBeDefined();
    expect(JSON.parse(call![1].body)).toEqual({ home_id: 'home-123', mode });
  });

  it('does not post setthermmode when home_id cannot be resolved', async () => {
    fetchMock.mockImplementation(() => jsonResponse({ success: true, body: { homes: [] } }));

    await findCommand('thermo-mode-away').onSelect();

    expect(fetchMock.mock.calls.some(([url]) => url === '/api/v1/netatmo/setthermmode')).toBe(false);
  });
});
