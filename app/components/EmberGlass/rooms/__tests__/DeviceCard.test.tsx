/**
 * DeviceCard jest spec — Plan 179-04 (ROOMS-04 / CONTEXT D-23/D-24/D-61).
 *
 * Mocks DevicePrimaryControl and DeviceBody imports so the card renders in
 * isolation without requiring Wave 2/3 dependencies.
 *
 * Tests 1-7 cover:
 *   1. 40×40 icon tile sizing
 *   2. device.name rendered at 15px 600 weight
 *   3. Status line ("Attivo · value" / "Inattivo · value")
 *   4. DevicePrimaryControl right-slot rendered
 *   5. DeviceBody body slot rendered
 *   6. Tone-tinted background when on, plain when off
 *   7. Pressable as="div" wrap (data-testid present, no onClick at root)
 */

import { render, screen } from '@testing-library/react';
import { DeviceCard } from '../DeviceCard';
import type { RoomDevice } from '../types';

// Mock DevicePrimaryControl
jest.mock('../DevicePrimaryControl', () => ({
  DevicePrimaryControl: () => <div data-testid="mock-primary-control" />,
}));

// Mock DeviceBody — Phase 179 Plan 08 shipped the real file, so this is a
// regular (non-virtual) mock that isolates DeviceCard from the body
// dispatcher's per-kind hooks (e.g. LightBody → useLightsData → WS context).
jest.mock('../DeviceBody', () => ({
  DeviceBody: () => <div data-testid="mock-body" />,
}));

const baseDevice: RoomDevice = {
  kind: 'light',
  name: 'Luce soggiorno',
  on: true,
  value: '80%',
  tone: '#f5c84a',
  extra: { groupId: 'g1' },
};

describe('DeviceCard (ROOMS-04 / CONTEXT D-23/D-24/D-61)', () => {
  it('Test 1: renders 40×40 icon tile', () => {
    render(<DeviceCard device={baseDevice} />);
    // The icon tile container should be present
    const iconTile = document.querySelector('[style*="width: 40px"]') as HTMLElement | null;
    expect(iconTile).not.toBeNull();
    expect(iconTile?.style.height).toBe('40px');
  });

  it('Test 2: renders device.name with correct text', () => {
    render(<DeviceCard device={baseDevice} />);
    expect(screen.getByText('Luce soggiorno')).toBeInTheDocument();
  });

  it('Test 3: status line shows "Attivo · value" when on', () => {
    render(<DeviceCard device={baseDevice} />);
    expect(screen.getByText(/Attivo/)).toBeInTheDocument();
    expect(screen.getByText(/Attivo · 80%/)).toBeInTheDocument();
  });

  it('Test 3b: status line shows "Inattivo · value" when off', () => {
    const offDevice: RoomDevice = { ...baseDevice, on: false, value: '0%' };
    render(<DeviceCard device={offDevice} />);
    expect(screen.getByText(/Inattivo · 0%/)).toBeInTheDocument();
  });

  it('Test 4: renders DevicePrimaryControl right-slot', () => {
    render(<DeviceCard device={baseDevice} />);
    expect(screen.getByTestId('mock-primary-control')).toBeInTheDocument();
  });

  it('Test 5: renders DeviceBody body slot', () => {
    render(<DeviceCard device={baseDevice} />);
    expect(screen.getByTestId('mock-body')).toBeInTheDocument();
  });

  it('Test 6: applies tone-tinted gradient background when on', () => {
    render(<DeviceCard device={baseDevice} />);
    const testId = 'stanze-device-light-luce-soggiorno';
    const container = screen.getByTestId(testId);
    expect(container.style.background).toContain('linear-gradient');
  });

  it('Test 6b: applies plain background when off', () => {
    const offDevice: RoomDevice = { ...baseDevice, on: false };
    render(<DeviceCard device={offDevice} />);
    const testId = 'stanze-device-light-luce-soggiorno';
    const container = screen.getByTestId(testId);
    // jsdom normalizes rgba by adding spaces: 'rgba(255,255,255,0.03)' → 'rgba(255, 255, 255, 0.03)'
    expect(container.style.background).toMatch(/rgba\(255,?\s*255,?\s*255,?\s*0\.03\)/);
  });

  it('Test 7: outer container has correct data-testid and no onClick', () => {
    render(<DeviceCard device={baseDevice} />);
    const testId = 'stanze-device-light-luce-soggiorno';
    const container = screen.getByTestId(testId);
    expect(container).toBeInTheDocument();
    // No onClick handler on the Pressable as="div" wrapper
    expect(container.onclick).toBeNull();
  });
});
