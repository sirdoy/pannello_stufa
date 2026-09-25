import { safeReturnTo } from '../returnTo';

describe('safeReturnTo', () => {
  it.each([
    ['/stove', '/stove'],
    ['/network?tab=wifi', '/network?tab=wifi'],
    [null, '/'],
    ['', '/'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
    ['/auth/login', '/'],
    ['/auth/logout', '/'],
  ])('%p -> %p', (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });
});
