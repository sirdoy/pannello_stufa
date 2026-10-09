/**
 * Sensor catalog helpers (workspace ROADMAP M70).
 */
import type { AutomationSensor } from '@/types/automations';
import {
  booleanWord,
  buildSensorCondition,
  defaultConditionForSensor,
  findSensor,
  formatSensorValue,
  groupSensorsByDevice,
  incompleteConditionMessage,
  readComparison,
} from '../../lib/sensor-catalog';

const sensor = (sensor_id: string, over: Partial<AutomationSensor> = {}): AutomationSensor => {
  const [provider = '', device_id = '', metric = ''] = sensor_id.split(':');
  return {
    sensor_id,
    provider,
    device_id,
    metric,
    device_name: null,
    room: null,
    value: null,
    value_type: 'number',
    unit: null,
    options: null,
    ...over,
  };
};

describe('groupSensorsByDevice', () => {
  it('groups by device, sorts devices by label and puts the main metric first', () => {
    const devices = groupSensorsByDevice([
      sensor('tuya:p1:voltage_v'),
      sensor('tuya:p1:switch_on', { value_type: 'boolean' }),
      sensor('dirigera:w1:battery_percentage', { device_name: 'Finestra', room: 'Cucina' }),
      sensor('dirigera:w1:is_open', { device_name: 'Finestra', room: 'Cucina', value_type: 'boolean' }),
      sensor('thermorossi:default:power_level'),
    ]);
    expect(devices.map((d) => d.label)).toEqual(['Finestra · Cucina (Sensore IKEA)', 'p1 (Presa)', 'Stufa']);
    expect(devices[0]!.sensors.map((s) => s.metric)).toEqual(['is_open', 'battery_percentage']);
    expect(devices[1]!.sensors.map((s) => s.metric)).toEqual(['switch_on', 'voltage_v']);
  });

  it('does not repeat a room that is already in the name', () => {
    const [device] = groupSensorsByDevice([sensor('dirigera:w1:is_open', { device_name: 'Finestra cucina', room: 'Cucina' })]);
    expect(device!.label).toBe('Finestra cucina (Sensore IKEA)');
  });
});

describe('formatSensorValue', () => {
  it.each([
    [sensor('netatmo:r:temperature', { value: 19.5, unit: '°C' }), '19.5 °C'],
    [sensor('hue:1:bri', { value: 120 }), '120'],
    [sensor('dirigera:w:is_open', { value: true, value_type: 'boolean' }), 'aperta'],
    [sensor('tuya:p:switch_on', { value: false, value_type: 'boolean' }), 'spenta'],
    [sensor('thermorossi:default:stove_state', { value: 'working', value_type: 'string' }), 'accesa'],
    [sensor('sonos:s:source_type', { value: 'custom', value_type: 'string' }), 'custom'],
    [sensor('netatmo:r:setpoint'), 'nessun valore'],
  ])('%j → %s', (s, text) => {
    expect(formatSensorValue(s)).toBe(text);
  });
});

describe('findSensor', () => {
  const list = [sensor('thermorossi:default:stove_state'), sensor('hue:5:on')];

  it('finds a sensor by id', () => {
    expect(findSensor(list, 'hue:5:on')?.sensor_id).toBe('hue:5:on');
    expect(findSensor(list, 'hue:6:on')).toBeNull();
    expect(findSensor(list, '')).toBeNull();
  });

  it('treats every entity slot of the stove as the same sensor', () => {
    expect(findSensor(list, 'thermorossi:_:stove_state')?.sensor_id).toBe('thermorossi:default:stove_state');
  });
});

describe('condition leaves', () => {
  it('equality is device_state, the other operators a threshold with the metric of the id', () => {
    expect(buildSensorCondition('hue:5:on', 'eq', 'true')).toEqual({
      type: 'device_state',
      sensor_id: 'hue:5:on',
      expected_state: 'true',
    });
    expect(buildSensorCondition('tuya:p1:power_w', 'gte', '12.5')).toEqual({
      type: 'sensor_threshold',
      sensor_id: 'tuya:p1:power_w',
      metric: 'power_w',
      operator: 'gte',
      threshold: 12.5,
    });
    expect(buildSensorCondition('tuya:p1:power_w', 'lt', 'on')).toMatchObject({ threshold: 0 });
  });

  it('reads the comparison back from both leaf types', () => {
    expect(readComparison(buildSensorCondition('a:b:c', 'lte', '3'))).toEqual({ operator: 'lte', value: '3' });
    expect(readComparison(buildSensorCondition('a:b:c', 'eq', 'on'))).toEqual({ operator: 'eq', value: 'on' });
  });

  it('starts from the current value of the picked sensor', () => {
    expect(defaultConditionForSensor(sensor('netatmo:r:temperature', { value: 19.5 }))).toMatchObject({
      type: 'sensor_threshold',
      operator: 'lt',
      threshold: 19.5,
    });
    expect(defaultConditionForSensor(sensor('hue:5:on', { value: false, value_type: 'boolean' }))).toMatchObject({
      type: 'device_state',
      expected_state: 'true',
    });
    expect(
      defaultConditionForSensor(
        sensor('thermorossi:default:stove_state', { value: null, value_type: 'string', options: ['off', 'working'] }),
      ),
    ).toMatchObject({ type: 'device_state', expected_state: 'off' });
  });

  it('maps the boolean words the backend accepts', () => {
    expect(booleanWord('True')).toBe('true');
    expect(booleanWord(' open ')).toBe('true');
    expect(booleanWord('OFF')).toBe('false');
    expect(booleanWord('working')).toBeNull();
  });
});

describe('incompleteConditionMessage', () => {
  const group = (...items: unknown[]) => ({ kind: 'group', op: 'AND', items });

  it('accepts complete sensor leaves and the other types', () => {
    expect(
      incompleteConditionMessage(
        group(
          { kind: 'cond', type: 'time_window', start_time: '08:00', end_time: '20:00' },
          { kind: 'cond', type: 'device_state', sensor_id: 'hue:5:on', expected_state: 'on' },
          group({ kind: 'cond', type: 'sensor_threshold', sensor_id: 'a:b:c', metric: 'c', operator: 'lt', threshold: 0 }),
        ),
      ),
    ).toBeNull();
  });

  it.each([
    [{ kind: 'cond', type: 'device_state', sensor_id: '', expected_state: '' }, /scegli il dispositivo/],
    [{ kind: 'cond', type: 'sensor_threshold', sensor_id: 'hue:5', metric: '', operator: 'lt', threshold: 1 }, /scegli il dispositivo/],
    [{ kind: 'cond', type: 'device_state', sensor_id: 'hue:5:on', expected_state: ' ' }, /indica il valore/],
  ])('reports %j, also inside a nested group', (leaf, message) => {
    expect(incompleteConditionMessage(group(group(leaf)))).toMatch(message);
  });
});
