/**
 * PlugBody tests — Phase 179 Plan 05
 *
 * Read-only: 2 StatChips (Ora + Oggi) with kW/W boundary formatting.
 * Covers TDD behaviors 7-10 from plan.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { PlugBody } from '@/app/components/EmberGlass/rooms/bodies/PlugBody';
import type { RoomDevice } from '@/app/components/EmberGlass/rooms/types';

function makeDevice(power: number, today_kwh: number): RoomDevice {
  return {
    kind: 'plug',
    name: 'Presa',
    on: true,
    value: `${power}W`,
    tone: '#f5c84a',
    extra: { power, today_kwh },
  };
}

describe('PlugBody', () => {
  test('Test 7: renders 2 StatChips with labels Ora and Oggi', () => {
    render(<PlugBody device={makeDevice(450, 2.4)} />);
    expect(screen.getByText('Ora')).toBeInTheDocument();
    expect(screen.getByText('Oggi')).toBeInTheDocument();
  });

  test('Test 8: power < 1000W renders NW format (no space) — "450W"', () => {
    render(<PlugBody device={makeDevice(450, 1.0)} />);
    expect(screen.getByText('450W')).toBeInTheDocument();
  });

  test('Test 8b: power=999W renders "999W"', () => {
    render(<PlugBody device={makeDevice(999, 0)} />);
    expect(screen.getByText('999W')).toBeInTheDocument();
  });

  test('Test 9: power >= 1000W renders X.YkW format — "1.5kW"', () => {
    render(<PlugBody device={makeDevice(1500, 3.0)} />);
    expect(screen.getByText('1.5kW')).toBeInTheDocument();
  });

  test('Test 9b: power=1000W renders "1.0kW"', () => {
    render(<PlugBody device={makeDevice(1000, 0)} />);
    expect(screen.getByText('1.0kW')).toBeInTheDocument();
  });

  test('Test 10: today_kwh renders as N.N kWh (with space — D-55)', () => {
    render(<PlugBody device={makeDevice(450, 2.4)} />);
    expect(screen.getByText('2.4 kWh')).toBeInTheDocument();
  });

  test('Test 10b: today_kwh=0 renders "0.0 kWh"', () => {
    render(<PlugBody device={makeDevice(0, 0)} />);
    expect(screen.getByText('0.0 kWh')).toBeInTheDocument();
  });
});
