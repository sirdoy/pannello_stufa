'use client';
/**
 * ControlRow — Phase 179 rooms primitive
 * Bundle source: rooms.jsx:587-589
 * Flex row container for MiniButtons.
 * D-02: inline-style only. D-37: no useMemo/useCallback.
 */
import type { ReactNode } from 'react';

export function ControlRow({ children }: { children: ReactNode }){
  return (
    <div
      data-testid="control-row"
      style={{
        display: 'flex',
        gap: 6,
      }}
    >
      {children}
    </div>
  );
}
