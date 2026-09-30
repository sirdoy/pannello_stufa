/**
 * @jest-environment jsdom
 */

import { useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { useDepsChanged } from '../useDepsChanged';

describe('useDepsChanged', () => {
  it('is false when deps are unchanged', () => {
    const obj = {};
    const { result, rerender } = renderHook(({ d }) => useDepsChanged(d), {
      initialProps: { d: [1, obj] as unknown[] },
    });
    rerender({ d: [1, obj] });
    expect(result.current).toBe(false);
  });

  it('lets a component reset its state when a dep changes', () => {
    function useResetOnOpen(isOpen: boolean) {
      const [value, setValue] = useState('initial');
      const changed = useDepsChanged([isOpen]);
      if (changed && isOpen) setValue('reset');
      return { value, setValue };
    }

    const { result, rerender } = renderHook(({ open }) => useResetOnOpen(open), {
      initialProps: { open: false },
    });
    expect(result.current.value).toBe('initial');

    act(() => result.current.setValue('edited'));
    rerender({ open: false });
    expect(result.current.value).toBe('edited');

    rerender({ open: true });
    expect(result.current.value).toBe('reset');

    act(() => result.current.setValue('edited again'));
    rerender({ open: true });
    expect(result.current.value).toBe('edited again');
  });

  it('applies the reset on the first render too (mounted already open)', () => {
    function useResetOnOpen(isOpen: boolean) {
      const [value, setValue] = useState('initial');
      if (useDepsChanged([isOpen]) && isOpen) setValue('reset');
      return value;
    }

    const { result } = renderHook(() => useResetOnOpen(true));
    expect(result.current).toBe('reset');
  });
});
