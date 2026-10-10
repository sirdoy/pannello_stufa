import {
  describeStoveSchedule,
  formatStoveAge,
  formatStoveTime,
  formatStoveWhen,
  getStoveStateDisplay,
} from '../stoveDisplay';

// Local-time dates: the helpers format in the timezone of the device.
const NOW = new Date(2026, 9, 10, 20, 0, 0); // Saturday 10 October 2026, 20:00
const today = (h: number, m: number) => new Date(2026, 9, 10, h, m, 0);
const tomorrow = (h: number, m: number) => new Date(2026, 9, 11, h, m, 0);

describe('getStoveStateDisplay', () => {
  test.each([
    ['off', 'Spenta', 'Spenta', 'muted'],
    ['igniting', 'In accensione', 'Avvio', 'accent'],
    ['working', 'In funzione', 'Accesa', 'accent'],
    ['modulating', 'In modulazione', 'Accesa', 'accent'],
    ['standby', 'In attesa', 'Attesa', 'warn'],
    ['cleaning', 'Pulizia in corso', 'Pulizia', 'warn'],
    ['alarm', 'In allarme', 'Allarme', 'danger'],
    ['unknown', 'Stato non noto', '—', 'muted'],
  ] as const)('%s → %s / %s (%s)', (status, label, short, tone) => {
    expect(getStoveStateDisplay(status, false)).toEqual({ label, short, tone });
  });

  test('missing or unexpected status falls back on isAccesa', () => {
    expect(getStoveStateDisplay(undefined, true).short).toBe('Accesa');
    expect(getStoveStateDisplay(undefined, false).short).toBe('Spenta');
    expect(getStoveStateDisplay('WORK' as never, true).label).toBe('In funzione');
  });
});

describe('formatStoveTime / formatStoveWhen', () => {
  test('same day: time only', () => {
    expect(formatStoveTime(today(23, 0).getTime(), NOW)).toBe('23:00');
    expect(formatStoveWhen(today(23, 0).toISOString(), NOW)).toBe('alle 23:00');
  });

  test('another day: short weekday and time, no "alle"', () => {
    expect(formatStoveTime(tomorrow(6, 30).getTime(), NOW)).toBe('dom 06:30');
    expect(formatStoveWhen(tomorrow(6, 30).getTime(), NOW)).toBe('dom 06:30');
  });
});

describe('describeStoveSchedule', () => {
  const base = { schedulerEnabled: true, semiManualMode: false, returnToAutoAt: null, nextScheduledAction: null };

  test('manual: no next action, even if one is cached', () => {
    expect(
      describeStoveSchedule(
        { ...base, schedulerEnabled: false, nextScheduledAction: { timestamp: today(23, 0).toISOString(), action: 'shutdown' } },
        NOW,
      ),
    ).toEqual({ mode: 'Manuale', nextShort: null, nextLong: null });
  });

  test.each([
    ['ignite', 'Accende alle 23:00', 'Si accende alle 23:00'],
    ['shutdown', 'Spegne alle 23:00', 'Si spegne alle 23:00'],
    ['adjust', 'Regola alle 23:00', 'Cambia livelli alle 23:00'],
  ] as const)('automatic, next %s', (action, nextShort, nextLong) => {
    expect(
      describeStoveSchedule({ ...base, nextScheduledAction: { timestamp: today(23, 0).toISOString(), action } }, NOW),
    ).toEqual({ mode: 'Automatica', nextShort, nextLong });
  });

  test('automatic, next action tomorrow', () => {
    const result = describeStoveSchedule(
      { ...base, nextScheduledAction: { timestamp: tomorrow(6, 30).toISOString(), action: 'ignite' } },
      NOW,
    );
    expect(result.nextShort).toBe('Accende dom 06:30');
  });

  test('automatic without slots', () => {
    expect(describeStoveSchedule(base, NOW)).toEqual({ mode: 'Automatica', nextShort: null, nextLong: null });
  });

  test('semi-manual with and without the return time', () => {
    expect(describeStoveSchedule({ ...base, semiManualMode: true, returnToAutoAt: today(23, 0).getTime() }, NOW)).toEqual({
      mode: 'Semi-manuale',
      nextShort: 'Auto alle 23:00',
      nextLong: 'Torna automatica alle 23:00',
    });
    expect(describeStoveSchedule({ ...base, semiManualMode: true }, NOW)).toEqual({
      mode: 'Semi-manuale',
      nextShort: null,
      nextLong: null,
    });
  });
});

describe('formatStoveAge', () => {
  test.each([
    [0, 'meno di 1 min'],
    [59, 'meno di 1 min'],
    [60, '1 min'],
    [47 * 60 + 30, '47 min'],
    [3600, '1 h'],
    [5 * 3600 + 1200, '5 h'],
  ])('%i s → %s', (seconds, text) => {
    expect(formatStoveAge(seconds)).toBe(text);
  });
});
