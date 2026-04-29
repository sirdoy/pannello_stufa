/**
 * ShadeBody tests — Phase 179 Plan 05
 *
 * No-op interactive: SliderRow (Posizione) + Su/Stop/Giù buttons (no commands).
 * Covers TDD behaviors 4-6 from plan.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { ShadeBody } from '@/app/components/EmberGlass/rooms/bodies/ShadeBody';
import type { RoomDevice } from '@/app/components/EmberGlass/rooms/types';

function makeDevice(position = 70): RoomDevice {
  return {
    kind: 'shade',
    name: 'Tapparella',
    on: false,
    value: `${position}%`,
    tone: 'var(--accent)',
    extra: { position },
  };
}

describe('ShadeBody', () => {
  test('Test 4: renders SliderRow with label Posizione (D-58)', () => {
    render(<ShadeBody device={makeDevice()} />);
    expect(screen.getByText('Posizione')).toBeInTheDocument();
  });

  test('Test 4b: SliderRow shows % unit with position value', () => {
    render(<ShadeBody device={makeDevice(70)} />);
    // SliderRow shows value + unit
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  test('Test 5: ControlRow renders Su, Stop, Giù buttons (D-58)', () => {
    render(<ShadeBody device={makeDevice()} />);
    expect(screen.getByTestId('mini-button-su')).toBeInTheDocument();
    expect(screen.getByTestId('mini-button-stop')).toBeInTheDocument();
    expect(screen.getByTestId('mini-button-gi')).toBeInTheDocument();
  });

  test('Test 5b: Su and Giù buttons have Italian labels', () => {
    render(<ShadeBody device={makeDevice()} />);
    expect(screen.getByText('Su')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
    expect(screen.getByText('Giù')).toBeInTheDocument();
  });

  test('Test 6: clicking Su button is no-op (does not throw)', () => {
    render(<ShadeBody device={makeDevice()} />);
    expect(() => {
      fireEvent.click(screen.getByTestId('mini-button-su'));
    }).not.toThrow();
  });

  test('Test 6b: clicking Stop button is no-op (does not throw)', () => {
    render(<ShadeBody device={makeDevice()} />);
    expect(() => {
      fireEvent.click(screen.getByTestId('mini-button-stop'));
    }).not.toThrow();
  });

  test('Test 6c: clicking Giù button is no-op (does not throw)', () => {
    render(<ShadeBody device={makeDevice()} />);
    expect(() => {
      fireEvent.click(screen.getByTestId('mini-button-gi'));
    }).not.toThrow();
  });
});
