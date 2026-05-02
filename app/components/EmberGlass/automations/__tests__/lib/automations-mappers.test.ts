import { apiToDraft, draftToApi, computePatchDelta } from '../../lib/automations-mappers';
import type { AutomationRule, ConditionNode, AutomationRulePatch } from '@/types/automations';

// ─── Canonical mock rule factory ─────────────────────────────────────────────

function mockRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: 1,
    name: 'Test Rule',
    description: null,
    enabled: true,
    trigger: { type: 'manual_api_call' },
    condition: { type: 'always_true' },
    actions: [{ type: 'log_event', message: 'test' }],
    min_interval_seconds: 0,
    max_triggers_per_hour: 0,
    active_hours_start: null,
    active_hours_end: null,
    last_triggered_at: null,
    created_at: 1700000000,
    updated_at: 1700000000,
    ...overrides,
  };
}

// ─── C1..C11 condition fixtures ───────────────────────────────────────────────

const C1_always_true: ConditionNode = { type: 'always_true' };
const C2_time_window: ConditionNode = { type: 'time_window', start_time: '08:00', end_time: '20:00' };
const C3_device_state: ConditionNode = { type: 'device_state', sensor_id: 'stove', expected_state: 'on' };
const C4_temperature_range: ConditionNode = { type: 'temperature_range', min_temp: null, max_temp: 22 };
const C5_and_of_two: ConditionNode = {
  type: 'and',
  conditions: [
    { type: 'time_window', start_time: '08:00', end_time: '20:00' },
    { type: 'temperature_range', min_temp: 10, max_temp: null },
  ],
};
const C6_or_of_two: ConditionNode = {
  type: 'or',
  conditions: [
    { type: 'device_state', sensor_id: 'dev1', expected_state: 'on' },
    { type: 'time_window', start_time: '09:00', end_time: '18:00' },
  ],
};
const C7_and_of_or: ConditionNode = {
  type: 'and',
  conditions: [
    { type: 'always_true' },
    { type: 'or', conditions: [
      { type: 'time_window', start_time: '08:00', end_time: '12:00' },
      { type: 'time_window', start_time: '14:00', end_time: '20:00' },
    ] },
  ],
};
const C8_or_of_and: ConditionNode = {
  type: 'or',
  conditions: [
    { type: 'device_state', sensor_id: 'd', expected_state: 'off' },
    { type: 'and', conditions: [
      { type: 'time_window', start_time: '08:00', end_time: '20:00' },
      { type: 'temperature_range', min_temp: null, max_temp: 25 },
    ] },
  ],
};
const C9_depth2: ConditionNode = {
  type: 'and',
  conditions: [
    { type: 'and', conditions: [
      { type: 'or', conditions: [
        { type: 'time_window', start_time: '08:00', end_time: '20:00' },
        { type: 'device_state', sensor_id: 's', expected_state: 'on' },
      ] },
    ] },
  ],
};
const C10_legacy_sensor: ConditionNode = {
  type: 'sensor_state_change',
  sensor_id: 'p1',
  from_state: 'home',
  to_state: 'away',
} as unknown as ConditionNode; // legacy type preserved verbatim
const C11_mixed_legacy: ConditionNode = {
  type: 'and',
  conditions: [
    { type: 'sensor_threshold', sensor_id: 's', metric: 'temp', operator: 'gt', threshold: 25 } as unknown as ConditionNode,
    { type: 'time_window', start_time: '08:00', end_time: '20:00' },
  ],
};

// ─── apiToDraft + draftToApi round-trip tests ────────────────────────────────

describe('automations-mappers round-trip (C1..C11)', () => {
  test.each([
    ['C1 always_true_root', C1_always_true],
    ['C2 single_leaf_time_window', C2_time_window],
    ['C3 single_leaf_device_state', C3_device_state],
    ['C4 single_leaf_temperature_range', C4_temperature_range],
    ['C5 and_of_two_leaves', C5_and_of_two],
    ['C6 or_of_two_leaves', C6_or_of_two],
    ['C7 and_of_or (depth 1)', C7_and_of_or],
    ['C8 or_of_and (depth 1)', C8_or_of_and],
    ['C9 and_of_and_of_or (depth 2)', C9_depth2],
    ['C10 legacy_sensor_leaf (fail-open)', C10_legacy_sensor],
    ['C11 mixed_with_legacy_extras', C11_mixed_legacy],
  ] as const)('%s: draftToApi(apiToDraft(rule)).condition deep-equals rule.condition', (_name, condition) => {
    const rule = mockRule({ condition: condition as ConditionNode });
    const draft = apiToDraft(rule);
    const roundtripped = draftToApi(draft);
    expect(roundtripped.condition).toEqual(rule.condition);
  });
});

// ─── apiToDraft correctness ───────────────────────────────────────────────────

describe('apiToDraft correctness', () => {
  test('maps all required fields verbatim', () => {
    const rule = mockRule({
      name: 'My Rule',
      description: 'A description',
      enabled: false,
      trigger: { type: 'schedule_cron', cron_expression: '0 8 * * *' },
      actions: [{ type: 'log_event', message: 'hello' }],
      min_interval_seconds: 60,
      max_triggers_per_hour: 10,
      active_hours_start: '08:00',
      active_hours_end: '20:00',
    });
    const draft = apiToDraft(rule);
    expect(draft.name).toBe('My Rule');
    expect(draft.description).toBe('A description');
    expect(draft.enabled).toBe(false);
    expect(draft.trigger).toEqual({ type: 'schedule_cron', cron_expression: '0 8 * * *' });
    expect(draft.actions).toEqual([{ type: 'log_event', message: 'hello' }]);
    expect(draft.min_interval_seconds).toBe(60);
    expect(draft.max_triggers_per_hour).toBe(10);
    expect(draft.active_hours_start).toBe('08:00');
    expect(draft.active_hours_end).toBe('20:00');
  });

  test('always_true condition maps to empty AND group', () => {
    const draft = apiToDraft(mockRule({ condition: { type: 'always_true' } }));
    expect(draft.conditions).toEqual({ kind: 'group', op: 'AND', items: [] });
  });

  test('bare leaf maps to AND group with single cond item', () => {
    const draft = apiToDraft(mockRule({ condition: C2_time_window }));
    expect(draft.conditions.kind).toBe('group');
    expect(draft.conditions.op).toBe('AND');
    expect(draft.conditions.items).toHaveLength(1);
    expect(draft.conditions.items[0]).toMatchObject({ kind: 'cond', type: 'time_window' });
  });

  test('AND composite maps to AND group with items', () => {
    const draft = apiToDraft(mockRule({ condition: C5_and_of_two }));
    expect(draft.conditions.op).toBe('AND');
    expect(draft.conditions.items).toHaveLength(2);
    draft.conditions.items.forEach(item => {
      expect(item.kind).toBe('cond');
    });
  });

  test('OR composite maps to OR group', () => {
    const draft = apiToDraft(mockRule({ condition: C6_or_of_two }));
    expect(draft.conditions.op).toBe('OR');
    expect(draft.conditions.items).toHaveLength(2);
  });

  test('null trigger maps to null in draft', () => {
    const draft = apiToDraft(mockRule({ trigger: null }));
    expect(draft.trigger).toBeNull();
  });
});

// ─── computePatchDelta tests ─────────────────────────────────────────────────

describe('computePatchDelta', () => {
  test('identical original and draft returns empty object {}', () => {
    const original = mockRule();
    const draft = mockRule();
    expect(computePatchDelta(original, draft)).toEqual({});
  });

  test('only name changed returns { name: new_name }', () => {
    const original = mockRule({ name: 'Old' });
    const changed = mockRule({ name: 'New' });
    const patch = computePatchDelta(original, changed);
    expect(patch).toEqual({ name: 'New' });
    expect(Object.keys(patch)).toHaveLength(1);
  });

  test('only enabled toggled returns { enabled: false }', () => {
    const original = mockRule({ enabled: true });
    const changed = mockRule({ enabled: false });
    const patch = computePatchDelta(original, changed);
    expect(patch).toEqual({ enabled: false });
    expect(Object.keys(patch)).toHaveLength(1);
  });

  test('actions array changed returns full new actions array', () => {
    const original = mockRule({ actions: [{ type: 'log_event', message: 'a' }] });
    const changed = mockRule({
      actions: [
        { type: 'log_event', message: 'a' },
        { type: 'log_event', message: 'b' },
      ],
    });
    const patch = computePatchDelta(original, changed);
    expect(patch).toHaveProperty('actions');
    expect((patch as { actions: unknown }).actions).toHaveLength(2);
  });

  test('condition swapped from always_true to single leaf returns { condition: leaf }', () => {
    const original = mockRule({ condition: { type: 'always_true' } });
    const changed = mockRule({
      condition: { type: 'time_window', start_time: '08:00', end_time: '20:00' },
    });
    const patch = computePatchDelta(original, changed);
    expect(patch).toHaveProperty('condition');
    expect((patch as { condition: unknown }).condition).toEqual(
      { type: 'time_window', start_time: '08:00', end_time: '20:00' }
    );
  });

  test('description changed from null to string returns { description: new_val }', () => {
    const original = mockRule({ description: null });
    const changed = mockRule({ description: 'New description' });
    const patch = computePatchDelta(original, changed);
    expect(patch).toEqual({ description: 'New description' });
  });

  test('min_interval_seconds change is detected', () => {
    const original = mockRule({ min_interval_seconds: 0 });
    const changed = mockRule({ min_interval_seconds: 300 });
    const patch = computePatchDelta(original, changed);
    expect(patch).toHaveProperty('min_interval_seconds', 300);
  });

  test('object key order does NOT cause spurious diffs (canonicalize fix)', () => {
    // Two actions with the same data but different object key insertion order
    const action1 = { type: 'log_event' as const, message: 'hello' };
    const action2: { message: string; type: 'log_event' } = { message: 'hello', type: 'log_event' };

    const original = mockRule({ actions: [action1] });
    const changed = mockRule({ actions: [action2] });
    // canonicalize should sort keys before comparing — result should be {}
    expect(computePatchDelta(original, changed)).toEqual({});
  });

  // WR-02 (REVIEW iteration 2): JSON.stringify(undefined) is undefined,
  // not the string "null". When the API serializer omits a nullable field
  // (origVal === undefined) and apiToDraft normalizes it to null
  // (draftVal === null), the comparison was reporting a spurious diff.
  // computePatchDelta now coerces undefined to null on both sides.
  test('null draft vs undefined original (description) does NOT produce spurious diff', () => {
    // Simulate the API-omits-null-fields case: original.description is undefined;
    // draft (post apiToDraft) normalizes to null.
    const original = { ...mockRule({ description: null }) };
    delete (original as { description?: string | null }).description;
    const changed = mockRule({ description: null });

    const patch = computePatchDelta(original as AutomationRule, changed);
    expect(patch).not.toHaveProperty('description');
  });

  test('null draft vs undefined original (active_hours_start) does NOT produce spurious diff', () => {
    const original = { ...mockRule({ active_hours_start: null }) };
    delete (original as { active_hours_start?: string | null }).active_hours_start;
    const changed = mockRule({ active_hours_start: null });

    const patch = computePatchDelta(original as AutomationRule, changed);
    expect(patch).not.toHaveProperty('active_hours_start');
  });

  test('null draft vs undefined original (active_hours_end) does NOT produce spurious diff', () => {
    const original = { ...mockRule({ active_hours_end: null }) };
    delete (original as { active_hours_end?: string | null }).active_hours_end;
    const changed = mockRule({ active_hours_end: null });

    const patch = computePatchDelta(original as AutomationRule, changed);
    expect(patch).not.toHaveProperty('active_hours_end');
  });

  test('patch.trigger is structurally absent from AutomationRulePatch type', () => {
    const original = mockRule();
    const changed = mockRule();
    const patch: AutomationRulePatch = computePatchDelta(original, changed);

    // Compile-time type check: the following should be a TS error
    // @ts-expect-error trigger does not exist on AutomationRulePatch (by API design D-12)
    const _ = patch.trigger;
    void _; // suppress unused variable warning

    // Runtime: trigger must not appear in the patch object
    expect(patch).not.toHaveProperty('trigger');
  });
});
