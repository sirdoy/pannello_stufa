import { act, renderHook } from '@testing-library/react';
import { usePendingActions } from '../usePendingActions';

function deferred() {
  let resolve!: () => void;
  let reject!: (err: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('usePendingActions (ROADMAP M80)', () => {
  test('a key is pending from run() until the action settles', async () => {
    const d = deferred();
    const { result } = renderHook(() => usePendingActions());
    expect(result.current.anyPending).toBe(false);

    let done!: Promise<void>;
    act(() => {
      done = result.current.run('a', () => d.promise);
    });
    expect(result.current.isPending('a')).toBe(true);
    expect(result.current.isPending('b')).toBe(false);
    expect(result.current.anyPending).toBe(true);

    await act(async () => {
      d.resolve();
      await done;
    });
    expect(result.current.isPending('a')).toBe(false);
    expect(result.current.anyPending).toBe(false);
  });

  test('a second run with a key still pending is ignored', async () => {
    const d = deferred();
    const action = jest.fn(() => d.promise);
    const { result } = renderHook(() => usePendingActions());

    let done!: Promise<void>;
    act(() => {
      done = result.current.run('a', action);
      void result.current.run('a', action);
    });
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      d.resolve();
      await done;
    });
  });

  test('different keys run side by side', async () => {
    const a = deferred();
    const b = deferred();
    const { result } = renderHook(() => usePendingActions());

    let doneA!: Promise<void>;
    let doneB!: Promise<void>;
    act(() => {
      doneA = result.current.run('a', () => a.promise);
      doneB = result.current.run('b', () => b.promise);
    });
    await act(async () => {
      a.resolve();
      await doneA;
    });
    expect(result.current.isPending('a')).toBe(false);
    expect(result.current.isPending('b')).toBe(true);

    await act(async () => {
      b.resolve();
      await doneB;
    });
    expect(result.current.anyPending).toBe(false);
  });

  test('a failed action clears the key and rethrows', async () => {
    const d = deferred();
    const { result } = renderHook(() => usePendingActions());

    let done!: Promise<void>;
    act(() => {
      done = result.current.run('a', () => d.promise);
    });
    await act(async () => {
      d.reject(new Error('boom'));
      await expect(done).rejects.toThrow('boom');
    });
    expect(result.current.isPending('a')).toBe(false);
  });
});
