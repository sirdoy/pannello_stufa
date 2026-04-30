import { countConditions } from '../../lib/countConditions';
import type { ConditionNode } from '@/types/automations';

describe('countConditions', () => {
  test('null returns 0', () => {
    expect(countConditions(null)).toBe(0);
  });
  test('always_true returns 0', () => {
    expect(countConditions({ type: 'always_true' })).toBe(0);
  });
  test('time_window leaf returns 1', () => {
    expect(countConditions({ type: 'time_window', start_time: '08:00', end_time: '20:00' })).toBe(1);
  });
  test('AND of 2 leaves returns 2', () => {
    const node: ConditionNode = {
      type: 'and',
      conditions: [
        { type: 'time_window', start_time: '08:00', end_time: '20:00' },
        { type: 'device_state', sensor_id: 's', expected_state: 'on' },
      ],
    };
    expect(countConditions(node)).toBe(2);
  });
  test('OR of leaf + nested AND of 2 leaves + always_true returns 3', () => {
    const node: ConditionNode = {
      type: 'or',
      conditions: [
        { type: 'always_true' }, // counts 0
        { type: 'and', conditions: [
          { type: 'time_window', start_time: '08:00', end_time: '20:00' },
          { type: 'device_state', sensor_id: 's', expected_state: 'on' },
        ] },
        { type: 'temperature_range', min_temp: null, max_temp: 22 }, // counts 1
      ],
    };
    expect(countConditions(node)).toBe(3);
  });
  test('depth-2 nested AND > AND > OR with 2 leaves returns 2', () => {
    const node: ConditionNode = {
      type: 'and', conditions: [
        { type: 'and', conditions: [
          { type: 'or', conditions: [
            { type: 'time_window', start_time: '08:00', end_time: '20:00' },
            { type: 'device_state', sensor_id: 's', expected_state: 'on' },
          ] },
        ] },
      ],
    };
    expect(countConditions(node)).toBe(2);
  });
});
