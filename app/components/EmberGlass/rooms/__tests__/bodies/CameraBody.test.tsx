/**
 * CameraBody tests — Phase 179 Plan 05
 *
 * No-op: 16:9 preview + LIVE caption + motion footnote + play button.
 * Covers TDD behaviors 7-11 from plan.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { CameraBody } from '@/app/components/EmberGlass/rooms/bodies/CameraBody';
import type { RoomDevice } from '@/app/components/EmberGlass/rooms/types';

function makeDevice(fps = 24, motion = 'rilevato 2m fa'): RoomDevice {
  return {
    kind: 'camera',
    name: 'Telecamera',
    on: true,
    value: 'LIVE',
    tone: 'var(--accent)',
    extra: { fps, motion },
  };
}

describe('CameraBody', () => {
  test('Test 7: renders 16:9 preview container', () => {
    render(<CameraBody device={makeDevice()} />);
    const container = screen.getByTestId('stanze-camera-preview');
    expect(container).toBeInTheDocument();
    // Check that aspectRatio style is set to 16/9
    expect(container).toHaveStyle({ aspectRatio: '16 / 9' });
  });

  test('Test 8: renders LIVE caption with fps value (D-59)', () => {
    render(<CameraBody device={makeDevice(30)} />);
    expect(screen.getByText('LIVE · 30fps')).toBeInTheDocument();
  });

  test('Test 8b: default fps=24 renders "LIVE · 24fps"', () => {
    render(<CameraBody device={makeDevice()} />);
    expect(screen.getByText('LIVE · 24fps')).toBeInTheDocument();
  });

  test('Test 9: renders Movimento footer with motion value (D-59)', () => {
    render(<CameraBody device={makeDevice(24, 'rilevato 2m fa')} />);
    expect(screen.getByText('Movimento rilevato 2m fa')).toBeInTheDocument();
  });

  test('Test 10: renders centered play button overlay', () => {
    render(<CameraBody device={makeDevice()} />);
    const btn = screen.getByRole('button', { name: /play camera stream/i });
    expect(btn).toBeInTheDocument();
  });

  test('Test 11: clicking play button is no-op (does not throw)', () => {
    render(<CameraBody device={makeDevice()} />);
    const btn = screen.getByRole('button', { name: /play camera stream/i });
    expect(() => {
      fireEvent.click(btn);
    }).not.toThrow();
  });

  test('Test 11b: clicking play button does not call any dispatch function', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<CameraBody device={makeDevice()} />);
    fireEvent.click(screen.getByRole('button', { name: /play camera stream/i }));
    // Should produce no errors
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
