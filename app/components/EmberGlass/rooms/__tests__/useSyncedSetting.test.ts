/**
 * useSyncedSetting (ROADMAP M84): local value that follows the device and is sent after the taps stop.
 */

import { act, renderHook } from '@testing-library/react';
import { useSyncedSetting } from '../useSyncedSetting';

interface Props {
  serverValue: number;
  enabled?: boolean;
  busy?: boolean;
}

function setup(initial: Props) {
  const send = jest.fn();
  const hook = renderHook(
    ({ serverValue, enabled = true, busy = false }: Props) =>
      useSyncedSetting({ serverValue, delayMs: 500, enabled, busy, send }),
    { initialProps: initial },
  );
  return { send, ...hook };
}

const wait = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });

describe('useSyncedSetting', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('sends nothing for the value read from the device', () => {
    const { send, result } = setup({ serverValue: 21 });
    wait(600);
    expect(result.current[0]).toBe(21);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends the last value once, after the delay', () => {
    const { send, result } = setup({ serverValue: 21 });
    act(() => result.current[1](21.5));
    wait(300);
    act(() => result.current[1](22));
    wait(499);
    expect(send).not.toHaveBeenCalled();
    wait(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(22);
  });

  it('adopts a new reading from the device and starts the next edit from it', () => {
    const { send, result, rerender } = setup({ serverValue: 21 });
    rerender({ serverValue: 19 });
    expect(result.current[0]).toBe(19);
    wait(600);
    expect(send).not.toHaveBeenCalled();

    act(() => result.current[1]((v) => v + 0.5));
    wait(500);
    expect(send).toHaveBeenCalledWith(19.5);
  });

  it('sends the old value again when the user goes back before the device reading changes', () => {
    const { send, result } = setup({ serverValue: 21 });
    act(() => result.current[1](21.5));
    wait(500);
    act(() => result.current[1](21));
    wait(500);
    expect(send.mock.calls).toEqual([[21.5], [21]]);
  });

  it('keeps the edit when a reading arrives while the user is still tapping', () => {
    const { send, result, rerender } = setup({ serverValue: 21 });
    act(() => result.current[1](22));
    rerender({ serverValue: 19 });
    expect(result.current[0]).toBe(22);
    wait(500);
    expect(send).toHaveBeenCalledWith(22);
  });

  it('does not apply a reading over a command in progress', () => {
    const { result, rerender } = setup({ serverValue: 21, busy: true });
    rerender({ serverValue: 19, busy: true });
    expect(result.current[0]).toBe(21);
    rerender({ serverValue: 19, busy: false });
    expect(result.current[0]).toBe(19);
  });

  it('sends nothing while disabled', () => {
    const { send, result } = setup({ serverValue: 50, enabled: false });
    act(() => result.current[1](80));
    wait(600);
    expect(send).not.toHaveBeenCalled();
  });
});
