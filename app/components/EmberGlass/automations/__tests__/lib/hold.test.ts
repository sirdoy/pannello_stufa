/** Hold rules helpers (workspace ROADMAP D13). */
import type { ActionItem } from '@/types/automations';
import { isHoldable, parseHoldEvent } from '../../lib/hold';

const action = (a: Record<string, unknown>) => a as unknown as ActionItem;

describe('isHoldable', () => {
  it.each([
    [{ type: 'netatmo_set_room_temp', home_id: 'h', room_id: 'r', mode: 'manual', temp: 7 }, true],
    [{ type: 'netatmo_set_room_temp', home_id: 'h', room_id: 'r', mode: 'home', temp: null }, false],
    [{ type: 'netatmo_set_room_temp', home_id: 'h', room_id: 'r', mode: 'manual', temp: null }, false],
    [{ type: 'thermorossi', command: 'set_power', power_level: 1 }, true],
    [{ type: 'thermorossi', command: 'set_fan', fan_level: 2 }, true],
    [{ type: 'thermorossi', command: 'set_power', power_level: null }, false],
    [{ type: 'thermorossi', command: 'ignite' }, false],
    [{ type: 'log_event', message: 'x' }, false],
  ])('%j → %s', (a, expected) => {
    expect(isHoldable(action(a))).toBe(expected);
  });
});

describe('parseHoldEvent', () => {
  it('returns null for rows that are not hold events', () => {
    expect(parseHoldEvent(null, 1)).toBeNull();
    expect(parseHoldEvent('{"changed":[],"result":true}', 1)).toBeNull();
    expect(parseHoldEvent('not json', 1)).toBeNull();
  });

  it('describes each target outcome', () => {
    const event = parseHoldEvent(
      JSON.stringify({
        hold: 'started',
        targets: {
          'netatmo_room:h:r': 'held_by:9',
          'stove:fan': 'unchanged',
          'netatmo_room:h:x': 'restored',
        },
      }),
      9
    );
    expect(event).toEqual({
      hold: 'started',
      targets: [
        'Valvola: impostata da questa regola',
        'Ventola stufa: già a posto',
        'Valvola: tornata al programma',
      ],
    });
  });
});
