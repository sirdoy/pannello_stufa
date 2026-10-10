/**
 * DeviceChip spec: 1:1 chip of a device inside RoomCard.
 *
 * Tone tint and glow dot when the device is on, dim when off; the icon comes from the kind;
 * the chip has no click handler (taps reach the card).
 */

import { render, screen } from '@testing-library/react';
import { Flame, Lightbulb, Music, Plug, Radar, Server, Thermometer, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DeviceKind, RoomDevice } from '../types';
import { CATEGORY_ORDER, ICON_FOR } from '../lib/rooms-config';
import { DeviceChip } from '../DeviceChip';

function makeDevice(over: Partial<RoomDevice> = {}): RoomDevice {
  return { id: 1, kind: 'light', name: 'Lampada', on: true, value: '80%', tone: '#f5c84a', extra: {}, ...over };
}

const TONE = /#f5c84a|rgb\(245, 200, 74\)/;

const offSensor = makeDevice({ kind: 'sensor', name: 'Finestra', on: false, value: '', tone: '#5ec8d8' });

describe('DeviceChip', () => {
  it('is identified by the kind and exposes the on state', () => {
    render(<DeviceChip device={makeDevice()} />);
    expect(screen.getByTestId('device-chip-light')).toHaveAttribute('data-on', 'true');
  });

  it('renders the 14px icon of the kind', () => {
    const { container } = render(<DeviceChip device={makeDevice()} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('14');
    expect(svg?.classList.contains('lucide-lightbulb')).toBe(true);
  });

  it('every kind the Pi can send has an icon', () => {
    const expected: Record<DeviceKind, LucideIcon> = {
      stove: Flame,
      thermo: Thermometer,
      valve: Thermometer,
      light: Lightbulb,
      plug: Plug,
      sonos: Music,
      camera: Video,
      sensor: Radar,
      host: Server,
    };
    for (const kind of CATEGORY_ORDER) {
      expect(ICON_FOR[kind]).toBe(expected[kind]);
      const { container, unmount } = render(<DeviceChip device={makeDevice({ kind })} />);
      expect(screen.getByTestId(`device-chip-${kind}`).querySelector('svg')).not.toBeNull();
      expect(container.querySelectorAll('svg')).toHaveLength(1);
      unmount();
    }
  });

  it('on: background, border and icon colour use the device tone', () => {
    render(<DeviceChip device={makeDevice()} />);
    const chip = screen.getByTestId('device-chip-light');
    expect(chip.style.background).toContain('color-mix');
    // jsdom rewrites the hex inside color-mix() as rgb()
    expect(chip.style.background).toMatch(TONE);
    expect(chip.style.border).toMatch(TONE);
    expect(chip).toHaveStyle({ color: '#f5c84a' });
  });

  it('off: dim background and border, no tone', () => {
    render(<DeviceChip device={offSensor} />);
    const chip = screen.getByTestId('device-chip-sensor');
    expect(chip).toHaveAttribute('data-on', 'false');
    expect(chip.style.background).toBe('rgba(255, 255, 255, 0.04)');
    expect(chip.style.border).toContain('rgba(255, 255, 255, 0.06)');
    expect(chip.style.color).toBe('var(--text-2)');
  });

  it('on: a 5x5 glow dot is pinned to the top right', () => {
    const { container } = render(<DeviceChip device={makeDevice()} />);
    const dot = container.querySelector('span[aria-hidden="true"]') as HTMLElement | null;
    expect(dot).not.toBeNull();
    expect(dot?.style.position).toBe('absolute');
    expect(dot?.style.top).toBe('3px');
    expect(dot?.style.right).toBe('3px');
    expect(dot?.style.width).toBe('5px');
    expect(dot?.style.height).toBe('5px');
    expect(dot?.style.boxShadow).toMatch(TONE);
  });

  it('off: no dot', () => {
    const { container } = render(<DeviceChip device={offSensor} />);
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('a device that does not answer looks off', () => {
    const silent = makeDevice({ on: false, statusLabel: 'Non risponde', unreachable: true });
    const { container } = render(<DeviceChip device={silent} />);
    expect(screen.getByTestId('device-chip-light')).toHaveAttribute('data-on', 'false');
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('is a square without a click handler', () => {
    render(<DeviceChip device={makeDevice()} />);
    const chip = screen.getByTestId('device-chip-light');
    expect(chip.style.aspectRatio).toBe('1 / 1');
    expect(chip.onclick).toBeNull();
    expect(chip.tagName).toBe('DIV');
  });
});
