/**
 * DeviceChip jest spec — Plan 179-03 (ROOMS-02 / CONTEXT D-20).
 *
 * Tests 1:1 aspect-ratio chip with color-mix tone tinting on/off,
 * 5x5 dot pinned top:3 right:3 when on, and no click handler.
 */

import { render } from '@testing-library/react';
import type { RoomDevice } from '../types';

// DeviceChip is not created yet — these tests will fail (RED phase)
import { DeviceChip } from '../DeviceChip';

const onLight: RoomDevice = {
  kind: 'light',
  name: 'Lampada salotto',
  on: true,
  value: '80%',
  tone: '#f5c84a',
  extra: {},
};

const offShade: RoomDevice = {
  kind: 'shade',
  name: 'Tapparella',
  on: false,
  value: '60%',
  tone: '#b0b0b0',
  extra: {},
};

describe('DeviceChip', () => {
  test('Test 1: renders an icon sized 14px when given a device.kind mapped through ICON_FOR', () => {
    const { container } = render(<DeviceChip device={onLight} />);
    // lucide renders an svg
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // icon size 14 is passed as width/height on the svg
    expect(svg?.getAttribute('width')).toBe('14');
  });

  test('Test 2: when device.on === true, background and border use color-mix with tone', () => {
    const { container } = render(<DeviceChip device={onLight} />);
    const chip = container.firstElementChild as HTMLElement;
    const bg = chip.style.background;
    const border = chip.style.border;
    // JSDOM converts #f5c84a to rgb(245, 200, 74) in computed style
    expect(bg).toContain('color-mix');
    expect(border).toContain('color-mix');
    // Verify tinting (color-mix uses either hex or rgb form)
    const bgContainsTone = bg.includes('#f5c84a') || bg.includes('245, 200, 74') || bg.includes('rgb(245');
    const borderContainsTone = border.includes('#f5c84a') || border.includes('245, 200, 74') || border.includes('rgb(245');
    expect(bgContainsTone).toBe(true);
    expect(borderContainsTone).toBe(true);
  });

  test('Test 3: when device.on === false, background is rgba(255,255,255,0.04) and border is rgba(255,255,255,0.06)', () => {
    const { container } = render(<DeviceChip device={offShade} />);
    const chip = container.firstElementChild as HTMLElement;
    const bg = chip.style.background;
    const border = chip.style.border;
    expect(bg).toBe('rgba(255, 255, 255, 0.04)');
    expect(border).toContain('rgba(255, 255, 255, 0.06)');
  });

  test('Test 4: when device.on === true, a 5x5 dot is rendered with position:absolute top:3 right:3 and boxShadow', () => {
    const { container } = render(<DeviceChip device={onLight} />);
    // Use span[aria-hidden] to distinguish the dot from the lucide SVG (which also has aria-hidden="true")
    const dot = container.querySelector('span[aria-hidden="true"]') as HTMLElement | null;
    expect(dot).toBeTruthy();
    expect(dot?.style.position).toBe('absolute');
    expect(dot?.style.top).toBe('3px');
    expect(dot?.style.right).toBe('3px');
    expect(dot?.style.width).toBe('5px');
    expect(dot?.style.height).toBe('5px');
    expect(dot?.style.boxShadow).toContain('#f5c84a');
  });

  test('Test 5: when device.on === false, NO dot is rendered', () => {
    const { container } = render(<DeviceChip device={offShade} />);
    // Use span[aria-hidden] to distinguish the dot from the lucide SVG
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeNull();
  });

  test('Test 6: aspect ratio is 1 / 1', () => {
    const { container } = render(<DeviceChip device={onLight} />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.style.aspectRatio).toBe('1 / 1');
  });

  test('Test 7: component renders no click handler (onclick is null)', () => {
    const { container } = render(<DeviceChip device={onLight} />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.onclick).toBeNull();
  });
});
