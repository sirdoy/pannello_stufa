import { cronError, isCronRun } from '../../lib/cron';

describe('cronError (ROADMAP M69)', () => {
  test.each([
    '0 8 * * *',
    '*/15 * * * *',
    '0,30 6-22 * * mon-fri',
    '0 22 1 jan,JUL *',
    '5/10 0 * * 7',
    '  0   8  *  *  *  ',
    '0 8 1-31/2 * 0',
  ])('%s is valid', (expr) => {
    expect(cronError(expr)).toBeNull();
  });

  test.each([
    ['', /5 campi/],
    ['0 8 * *', /5 campi/],
    ['0 8 * * * *', /5 campi/],
    ['60 8 * * *', /Minuto: 60 è fuori da 0–59/],
    ['0 24 * * *', /Ora: 24 è fuori da 0–23/],
    ['0 8 0 * *', /Giorno del mese: 0 è fuori da 1–31/],
    ['0 8 * 13 *', /Mese: 13 è fuori da 1–12/],
    ['0 8 * * 8', /Giorno della settimana: 8 è fuori da 0–7/],
    ['0 8 * * lun', /Giorno della settimana: «lun» non è un valore valido/],
    ['a 8 * * *', /Minuto: «a» non è un valore valido/],
    ['*/0 8 * * *', /Minuto: passo non valido/],
    ['*/x 8 * * *', /Minuto: passo non valido/],
    ['0 20-8 * * *', /Ora: l'intervallo «20-8» va all'indietro/],
    ['0 8, * * *', /Ora: «» non è un valore valido/],
    ['0 -5 * * *', /Ora/],
  ])('%s is refused', (expr, expected) => {
    expect(cronError(expr)).toMatch(expected);
  });
});

describe('isCronRun', () => {
  it('reads the kind of the trigger snapshot', () => {
    expect(isCronRun('{"changed":[],"result":true,"kind":"cron","cron":"0 22 * * *"}')).toBe(true);
    expect(isCronRun('{"changed":["hue:1:on"],"result":true}')).toBe(false);
    expect(isCronRun('not json')).toBe(false);
    expect(isCronRun(null)).toBe(false);
  });
});
