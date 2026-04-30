import { describeTrigger } from '../../lib/describeTrigger';

describe('describeTrigger', () => {
  test('null trigger returns "Manuale"', () => {
    expect(describeTrigger(null)).toBe('Manuale');
  });
  test('undefined trigger returns "Manuale"', () => {
    expect(describeTrigger(undefined)).toBe('Manuale');
  });
  test('manual_api_call returns "Manuale"', () => {
    expect(describeTrigger({ type: 'manual_api_call' })).toBe('Manuale');
  });
  test('schedule_cron returns "⏰ {cron}"', () => {
    expect(describeTrigger({ type: 'schedule_cron', cron_expression: '0 22 * * *' })).toBe('⏰ 0 22 * * *');
  });
  test('schedule_cron preserves cron whitespace verbatim', () => {
    expect(describeTrigger({ type: 'schedule_cron', cron_expression: '*/5 * * * *' })).toBe('⏰ */5 * * * *');
  });
});
