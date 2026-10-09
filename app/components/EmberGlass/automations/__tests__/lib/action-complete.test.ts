import { incompleteActionMessage } from '../../lib/action-complete';
import { defaultAction, ACTION_TYPES } from '../../lib/automations-config';
import type { ActionItem } from '@/types/automations';

const action = (a: Record<string, unknown>) => a as unknown as ActionItem;

describe('incompleteActionMessage (ROADMAP D17)', () => {
  test.each([
    [{ type: 'netatmo_set_room_temp', home_id: 'h', room_id: 'r', mode: 'manual', temp: null }, /temperatura/],
    [{ type: 'netatmo_set_room_temp', home_id: '', room_id: '', mode: 'home' }, /casa e stanza/],
    [{ type: 'netatmo_switch_schedule', home_id: 'h', schedule_id: '' }, /programma/],
    [{ type: 'hue_light', light_id: '5', on: null, brightness: null, color_temp: null, hue: null, sat: null }, /Accendi o Spegni/],
    [{ type: 'hue_group', group_id: '1', on: null, brightness: null, color_temp: null }, /Accendi o Spegni/],
    [{ type: 'hue_scene', group_id: '1', scene_id: '' }, /scena/],
    [{ type: 'thermorossi', command: 'set_power', power_level: null }, /potenza/],
    [{ type: 'thermorossi', command: 'set_fan', fan_level: null }, /ventola/],
    [{ type: 'thermorossi', command: 'set_water_temp', water_temp: null }, /acqua/],
    [{ type: 'sonos', speaker_uid: 'u', command: 'set_volume', volume: null }, /volume/],
    [{ type: 'sonos', speaker_uid: 'u', command: 'switch_source', source: null }, /sorgente/],
    [{ type: 'tuya', device_id: 'd', command: 'set_status', on: null }, /Accendi o Spegni/],
    [{ type: 'tuya', device_id: 'd', command: 'set_timer', timer_seconds: null }, /timer/],
    [{ type: 'http_webhook', url: 'example.test/hook', method: 'POST', payload: null }, /http/],
    [{ type: 'log_event', message: ' ' }, /messaggio/],
  ])('%j is incomplete', (a, expected) => {
    expect(incompleteActionMessage(action(a))).toMatch(expected);
  });

  test.each([
    { type: 'netatmo_set_room_temp', home_id: 'h', room_id: 'r', mode: 'manual', temp: 7 },
    { type: 'netatmo_set_room_temp', home_id: 'h', room_id: 'r', mode: 'home', temp: null },
    { type: 'netatmo_set_home_mode', home_id: 'h', mode: 'away' },
    { type: 'hue_light', light_id: '5', on: false, brightness: null, color_temp: null, hue: null, sat: null },
    { type: 'hue_light', light_id: '5', on: null, brightness: 120, color_temp: null, hue: null, sat: null },
    { type: 'hue_group', group_id: '1', on: true, brightness: null, color_temp: null },
    { type: 'thermorossi', command: 'ignite', power_level: null, fan_level: null, water_temp: null },
    { type: 'thermorossi', command: 'set_power', power_level: 1 },
    { type: 'sonos', speaker_uid: 'u', command: 'pause', volume: null, source: null },
    { type: 'sonos', speaker_uid: 'u', command: 'set_volume', volume: 0 },
    { type: 'tuya', device_id: 'd', command: 'set_status', on: false },
    { type: 'tuya', device_id: 'd', command: 'set_timer', timer_seconds: 0 },
    { type: 'http_webhook', url: 'https://example.test/hook', method: 'GET', payload: null },
    { type: 'log_event', message: 'ciao' },
  ])('%j is complete', (a) => {
    expect(incompleteActionMessage(action(a))).toBeNull();
  });

  test('a new action only lacks what the user must choose (device, message, url)', () => {
    const messages = ACTION_TYPES.map((t) => [t.id, incompleteActionMessage(defaultAction(t.id))]);
    expect(Object.fromEntries(messages)).toEqual({
      netatmo_set_room_temp: expect.stringMatching(/casa e stanza/),
      netatmo_set_home_mode: expect.stringMatching(/casa/),
      netatmo_switch_schedule: expect.stringMatching(/programma/),
      thermorossi: null,
      hue_light: expect.stringMatching(/scegli la luce/),
      hue_group: expect.stringMatching(/scegli il gruppo/),
      hue_scene: expect.stringMatching(/scena/),
      tuya: expect.stringMatching(/dispositivo/),
      sonos: expect.stringMatching(/speaker/),
      http_webhook: expect.stringMatching(/http/),
      log_event: expect.stringMatching(/messaggio/),
    });
  });
});
