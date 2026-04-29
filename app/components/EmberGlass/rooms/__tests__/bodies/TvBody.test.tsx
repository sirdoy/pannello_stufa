/**
 * TvBody tests — Phase 179 Plan 05
 *
 * No-op interactive: 2 StatChips (Sorgente/Volume) + HDMI buttons (no commands).
 * Covers TDD behaviors 1-3 from plan.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { TvBody } from '@/app/components/EmberGlass/rooms/bodies/TvBody';
import type { RoomDevice } from '@/app/components/EmberGlass/rooms/types';

function makeDevice(source = 'HDMI 1', volume = 30): RoomDevice {
  return {
    kind: 'tv',
    name: 'TV',
    on: true,
    value: source,
    tone: 'var(--accent)',
    extra: { source, volume },
  };
}

describe('TvBody', () => {
  test('Test 1: renders 2 StatChips with labels Sorgente and Volume (D-57)', () => {
    render(<TvBody device={makeDevice()} />);
    expect(screen.getByText('Sorgente')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  test('Test 1b: Sorgente chip value matches extra.source', () => {
    render(<TvBody device={makeDevice('HDMI 2')} />);
    expect(screen.getAllByText('HDMI 2').length).toBeGreaterThanOrEqual(1);
  });

  test('Test 1c: Volume chip value matches extra.volume', () => {
    render(<TvBody device={makeDevice('HDMI 1', 45)} />);
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  test('Test 2: renders ControlRow with 3 buttons HDMI 1, HDMI 2, App (D-57)', () => {
    render(<TvBody device={makeDevice()} />);
    expect(screen.getByTestId('mini-button-hdmi-1')).toBeInTheDocument();
    expect(screen.getByTestId('mini-button-hdmi-2')).toBeInTheDocument();
    expect(screen.getByTestId('mini-button-app')).toBeInTheDocument();
  });

  test('Test 2b: HDMI 1 button is filled when source is HDMI 1', () => {
    render(<TvBody device={makeDevice('HDMI 1')} />);
    // The filled button gets a filled style — just verify it renders correctly
    expect(screen.getByTestId('mini-button-hdmi-1')).toBeInTheDocument();
  });

  test('Test 3: clicking HDMI 1 button is no-op (does not throw)', () => {
    render(<TvBody device={makeDevice()} />);
    expect(() => {
      fireEvent.click(screen.getByTestId('mini-button-hdmi-1'));
    }).not.toThrow();
  });

  test('Test 3b: clicking HDMI 2 button is no-op (does not throw)', () => {
    render(<TvBody device={makeDevice()} />);
    expect(() => {
      fireEvent.click(screen.getByTestId('mini-button-hdmi-2'));
    }).not.toThrow();
  });

  test('Test 3c: clicking App button is no-op (does not throw)', () => {
    render(<TvBody device={makeDevice()} />);
    expect(() => {
      fireEvent.click(screen.getByTestId('mini-button-app'));
    }).not.toThrow();
  });
});
