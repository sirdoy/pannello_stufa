import { withKey, stripKeys, type KeyedAction } from '../../lib/with-key';
import type { ActionItem } from '@/types/automations';

const sampleAction: ActionItem = { type: 'log_event', message: 'hello' };
const sampleAction2: ActionItem = { type: 'log_event', message: 'world' };
const sampleAction3: ActionItem = { type: 'log_event', message: 'foo' };

describe('withKey', () => {
  test('returns action augmented with __key matching ^act_\\d+_\\d+$', () => {
    const keyed = withKey(sampleAction);
    expect(keyed.__key).toMatch(/^act_\d+_\d+$/);
    expect(keyed.type).toBe('log_event');
    expect(keyed.message).toBe('hello');
  });

  test('two consecutive calls produce DIFFERENT __keys (counter increments)', () => {
    const a = withKey(sampleAction);
    const b = withKey(sampleAction);
    expect(a.__key).not.toBe(b.__key);
  });

  test('three consecutive calls all produce unique __keys', () => {
    const a = withKey(sampleAction);
    const b = withKey(sampleAction2);
    const c = withKey(sampleAction3);
    const keys = new Set([a.__key, b.__key, c.__key]);
    expect(keys.size).toBe(3);
  });

  test('preserves all original action fields verbatim', () => {
    const action: ActionItem = {
      type: 'http_webhook',
      url: 'https://example.com',
      method: 'POST',
      payload: { x: 1 },
    };
    const { __key, ...rest } = withKey(action);
    void __key;
    expect(rest).toEqual(action);
  });
});

describe('stripKeys', () => {
  test('removes __key from each entry', () => {
    const keyed: KeyedAction[] = [
      { ...sampleAction, __key: 'act_1_1' },
      { ...sampleAction2, __key: 'act_1_2' },
    ];
    const stripped = stripKeys(keyed);
    expect(stripped).toHaveLength(2);
    stripped.forEach((a) => {
      expect(a).not.toHaveProperty('__key');
    });
  });

  test('preserves the order of entries', () => {
    const keyed: KeyedAction[] = [
      { ...sampleAction, __key: 'k_a' },
      { ...sampleAction2, __key: 'k_b' },
      { ...sampleAction3, __key: 'k_c' },
    ];
    const stripped = stripKeys(keyed);
    expect(stripped.map((a) => (a.type === 'log_event' ? a.message : null))).toEqual([
      'hello', 'world', 'foo',
    ]);
  });

  test('returns empty array when given empty array', () => {
    expect(stripKeys([])).toEqual([]);
  });
});

describe('round-trip identity', () => {
  test('stripKeys(actions.map(withKey)) deep-equals original actions', () => {
    const actions: ActionItem[] = [sampleAction, sampleAction2, sampleAction3];
    const roundTripped = stripKeys(actions.map(withKey));
    expect(roundTripped).toEqual(actions);
  });

  test('round-trip preserves heterogeneous action types', () => {
    const actions: ActionItem[] = [
      { type: 'log_event', message: 'a' },
      { type: 'http_webhook', url: 'https://x', method: 'GET', payload: null },
      { type: 'thermorossi', command: 'ignite', power_level: null, fan_level: null, water_temp: null },
    ];
    const roundTripped = stripKeys(actions.map(withKey));
    expect(roundTripped).toEqual(actions);
  });
});
