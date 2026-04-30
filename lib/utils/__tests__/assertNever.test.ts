import { assertNever } from '../assertNever';

describe('assertNever', () => {
  test('throws with the stringified payload', () => {
    expect(() => assertNever('unexpected' as never)).toThrow('Unhandled variant: "unexpected"');
  });

  test('throws when invoked with an object', () => {
    expect(() => assertNever({ type: 'mystery' } as never)).toThrow(
      'Unhandled variant: {"type":"mystery"}'
    );
  });

  test('return type is never (compile-time)', () => {
    // @ts-expect-error — assertNever cannot be called with a non-never value at compile time.
    // At runtime it throws; we assert that to confirm the function never returns normally.
    expect(() => assertNever('hello')).toThrow('Unhandled variant: "hello"');
  });
});
