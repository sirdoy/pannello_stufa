/**
 * SensorBody tests — Phase 179 Plan 05
 *
 * Read-only: 2 StatChips (Valore + Trend).
 * Covers TDD behavior 11 from plan.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { SensorBody } from '@/app/components/EmberGlass/rooms/bodies/SensorBody';
import type { RoomDevice } from '@/app/components/EmberGlass/rooms/types';

function makeDevice(humidity: number, trend: string): RoomDevice {
  return {
    kind: 'sensor',
    name: 'Sensore',
    on: true,
    value: `${humidity}%`,
    tone: '#6aa86a',
    extra: { humidity, trend },
  };
}

describe('SensorBody', () => {
  test('Test 11: renders 2 StatChips with labels Valore and Trend (D-60)', () => {
    render(<SensorBody device={makeDevice(58, 'stabile')} />);
    expect(screen.getByText('Valore')).toBeInTheDocument();
    expect(screen.getByText('Trend')).toBeInTheDocument();
  });

  test('Test 11b: Valore chip shows humidity% value', () => {
    render(<SensorBody device={makeDevice(58, 'stabile')} />);
    expect(screen.getByText('58%')).toBeInTheDocument();
  });

  test('Test 11c: Trend chip shows trend string', () => {
    render(<SensorBody device={makeDevice(65, 'in salita')} />);
    expect(screen.getByText('in salita')).toBeInTheDocument();
  });

  test('Test 11d: defaults when extra fields are absent', () => {
    const device: RoomDevice = {
      kind: 'sensor',
      name: 'S',
      on: false,
      value: '',
      tone: '#fff',
      extra: {},
    };
    render(<SensorBody device={device} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('stabile')).toBeInTheDocument();
  });
});
