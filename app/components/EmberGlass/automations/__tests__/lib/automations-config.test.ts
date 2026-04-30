import {
  TRIGGER_TYPES, CONDITION_TYPES, ACTION_TYPES,
  defaultTrigger, defaultCondition, defaultAction,
} from '../../lib/automations-config';

describe('automations-config catalogs', () => {
  test('TRIGGER_TYPES has exactly 2 entries (D-08)', () => {
    expect(TRIGGER_TYPES).toHaveLength(2);
    expect(TRIGGER_TYPES.map(t => t.id)).toEqual(['schedule_cron', 'manual_api_call']);
  });
  test('CONDITION_TYPES has exactly 4 picker entries (D-18)', () => {
    expect(CONDITION_TYPES).toHaveLength(4);
    expect(CONDITION_TYPES.map(c => c.id)).toEqual([
      'time_window', 'device_state', 'temperature_range', 'always_true',
    ]);
  });
  test('ACTION_TYPES has exactly 11 entries in locked order (D-09)', () => {
    expect(ACTION_TYPES).toHaveLength(11);
    expect(ACTION_TYPES.map(a => a.id)).toEqual([
      'netatmo_set_room_temp', 'netatmo_set_home_mode', 'netatmo_switch_schedule',
      'thermorossi', 'hue_light', 'hue_group', 'hue_scene',
      'tuya', 'sonos', 'http_webhook', 'log_event',
    ]);
  });
  test('thermorossi tone uses var(--accent)', () => {
    expect(ACTION_TYPES.find(a => a.id === 'thermorossi')?.tone).toBe('var(--accent)');
  });
  test('log_event tone uses var(--text-2)', () => {
    expect(ACTION_TYPES.find(a => a.id === 'log_event')?.tone).toBe('var(--text-2)');
  });
  test('manual_api_call trigger tone uses var(--text-2)', () => {
    expect(TRIGGER_TYPES.find(t => t.id === 'manual_api_call')?.tone).toBe('var(--text-2)');
  });
  test('schedule_cron trigger tone uses #5eafff', () => {
    expect(TRIGGER_TYPES.find(t => t.id === 'schedule_cron')?.tone).toBe('#5eafff');
  });
});

describe('defaultTrigger factories', () => {
  test('schedule_cron has cron_expression "0 8 * * *"', () => {
    expect(defaultTrigger('schedule_cron')).toEqual({ type: 'schedule_cron', cron_expression: '0 8 * * *' });
  });
  test('manual_api_call has no extra fields', () => {
    expect(defaultTrigger('manual_api_call')).toEqual({ type: 'manual_api_call' });
  });
});

describe('defaultCondition factories', () => {
  test.each([
    ['time_window', { type: 'time_window', start_time: '08:00', end_time: '20:00' }],
    ['device_state', { type: 'device_state', sensor_id: '', expected_state: '' }],
    ['temperature_range', { type: 'temperature_range', min_temp: null, max_temp: null }],
    ['always_true', { type: 'always_true' }],
  ] as const)('defaultCondition(%s) returns expected shape', (id, expected) => {
    expect(defaultCondition(id)).toEqual(expected);
  });
});

describe('defaultAction factories', () => {
  test.each(ACTION_TYPES.map(t => t.id))('defaultAction(%s) discriminator matches type literal', (id) => {
    expect(defaultAction(id).type).toBe(id);
  });
  test('defaultAction(http_webhook) defaults method=POST + payload=null', () => {
    expect(defaultAction('http_webhook')).toMatchObject({ type: 'http_webhook', url: '', method: 'POST', payload: null });
  });
  test('defaultAction(thermorossi) defaults command=ignite + all conditional fields null', () => {
    expect(defaultAction('thermorossi')).toEqual({
      type: 'thermorossi', command: 'ignite', power_level: null, fan_level: null, water_temp: null,
    });
  });
  test('defaultAction(hue_group) does NOT include hue or sat fields', () => {
    const a = defaultAction('hue_group');
    expect(a).not.toHaveProperty('hue');
    expect(a).not.toHaveProperty('sat');
    expect(a).toMatchObject({ type: 'hue_group', group_id: '', on: null, brightness: null, color_temp: null });
  });
  test('defaultAction(hue_light) includes all 6 nullable fields', () => {
    expect(defaultAction('hue_light')).toEqual({
      type: 'hue_light', light_id: '', on: null, brightness: null, color_temp: null, hue: null, sat: null,
    });
  });
  test('defaultAction(netatmo_set_room_temp) defaults mode=manual + temp=21', () => {
    expect(defaultAction('netatmo_set_room_temp')).toEqual({
      type: 'netatmo_set_room_temp', home_id: '', room_id: '', mode: 'manual', temp: 21,
    });
  });
  test('defaultAction(netatmo_set_home_mode) defaults mode=schedule', () => {
    expect(defaultAction('netatmo_set_home_mode')).toEqual({
      type: 'netatmo_set_home_mode', home_id: '', mode: 'schedule',
    });
  });
  test('defaultAction(netatmo_switch_schedule) has empty home_id and schedule_id', () => {
    expect(defaultAction('netatmo_switch_schedule')).toEqual({
      type: 'netatmo_switch_schedule', home_id: '', schedule_id: '',
    });
  });
  test('defaultAction(hue_scene) has empty group_id and scene_id', () => {
    expect(defaultAction('hue_scene')).toEqual({
      type: 'hue_scene', group_id: '', scene_id: '',
    });
  });
  test('defaultAction(log_event) has empty message', () => {
    expect(defaultAction('log_event')).toEqual({
      type: 'log_event', message: '',
    });
  });
  test('defaultAction(sonos) has correct defaults', () => {
    expect(defaultAction('sonos')).toEqual({
      type: 'sonos', speaker_uid: '', command: 'play', volume: null, source: null,
    });
  });
  test('defaultAction(tuya) has correct defaults', () => {
    expect(defaultAction('tuya')).toEqual({
      type: 'tuya', device_id: '', command: 'set_status', on: null, timer_seconds: null,
    });
  });
});
