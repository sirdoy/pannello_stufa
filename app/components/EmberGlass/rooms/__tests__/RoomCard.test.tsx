/**
 * RoomCard jest spec — Plan 179-03 (ROOMS-02 / CONTEXT D-18..D-19).
 *
 * Tests chip-grid card composition: GlassCard + CardHead + 3-col chip grid,
 * +N overflow chip, empty state, tone-tinted count badge, and onOpen callback.
 *
 * GlassCard auto-wraps in Pressable when onOpen is set (Phase 177 D-19 +
 * GlassCard.tsx:83-92). No manual Pressable wrap needed in RoomCard.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import type { RoomConfig, RoomDevice } from '../types';

// RoomCard is not created yet — these tests will fail (RED phase)
import { RoomCard } from '../RoomCard';

// Fixture: room with tone
const room: RoomConfig = {
  name: 'Soggiorno',
  tone: '#f5c84a',
  icon: 'home',
};

// Fixtures: 7 devices (to test overflow + 6-chip slice)
const makeDevice = (i: number, on = false): RoomDevice => ({
  kind: 'light',
  name: `Luce ${i}`,
  on,
  value: '80%',
  tone: '#f5c84a',
  extra: {},
});

const sixDevices: RoomDevice[] = Array.from({ length: 6 }, (_, i) => makeDevice(i, i % 2 === 0));
const sevenDevices: RoomDevice[] = Array.from({ length: 7 }, (_, i) => makeDevice(i, i % 2 === 0));
const activeDevices: RoomDevice[] = [
  { kind: 'light', name: 'Luce 1', on: true, value: '80%', tone: '#f5c84a', extra: {} },
  { kind: 'light', name: 'Luce 2', on: false, value: '20%', tone: '#f5c84a', extra: {} },
];
const allOffDevices: RoomDevice[] = [
  { kind: 'light', name: 'Luce 1', on: false, value: '0%', tone: '#f5c84a', extra: {} },
];

describe('RoomCard', () => {
  test('Test 1: renders the room name in CardHead label slot', () => {
    render(<RoomCard room={room} devices={activeDevices} onOpen={jest.fn()} />);
    expect(screen.getByText('Soggiorno')).toBeTruthy();
  });

  test('Test 2: active count badge shows "{activeCount}/{total}" with tabular-nums font', () => {
    render(<RoomCard room={room} devices={activeDevices} onOpen={jest.fn()} />);
    // 1 on, 1 off → "1/2"
    const badge = screen.getByText('1/2');
    expect(badge).toBeTruthy();
    expect(badge.style.fontVariantNumeric).toBe('tabular-nums');
  });

  test('Test 3: when activeCount > 0, badge text color is room.tone; when activeCount === 0, color is var(--text-2)', () => {
    const { rerender } = render(
      <RoomCard room={room} devices={activeDevices} onOpen={jest.fn()} />,
    );
    // 1 active → tone color
    const activeBadge = screen.getByText('1/2') as HTMLElement;
    expect(activeBadge.style.color).not.toBe('var(--text-2)');

    rerender(<RoomCard room={room} devices={allOffDevices} onOpen={jest.fn()} />);
    // 0 active → var(--text-2)
    const zeroBadge = screen.getByText('0/1') as HTMLElement;
    expect(zeroBadge.style.color).toBe('var(--text-2)');
  });

  test('Test 4: renders 6 DeviceChips when given 6+ devices (slice(0, 6))', () => {
    const { container } = render(<RoomCard room={room} devices={sixDevices} onOpen={jest.fn()} />);
    // DeviceChip renders with data-testid="device-chip-{kind}"
    const chips = container.querySelectorAll('[data-testid^="device-chip-"]');
    expect(chips.length).toBe(6);
  });

  test('Test 5: renders "+N" overflow chip when devices.length > 6 (7 devices → 6 chips + "+1")', () => {
    const { container } = render(<RoomCard room={room} devices={sevenDevices} onOpen={jest.fn()} />);
    const chips = container.querySelectorAll('[data-testid^="device-chip-"]');
    expect(chips.length).toBe(6);
    // Overflow chip shows "+1"
    expect(screen.getByText('+1')).toBeTruthy();
  });

  test('Test 6: renders "Nessun dispositivo" text when devices.length === 0', () => {
    render(<RoomCard room={room} devices={[]} onOpen={jest.fn()} />);
    expect(screen.getByText('Nessun dispositivo')).toBeTruthy();
    // No chip grid
    const { container } = render(<RoomCard room={room} devices={[]} onOpen={jest.fn()} />);
    const chips = container.querySelectorAll('[data-testid^="device-chip-"]');
    expect(chips.length).toBe(0);
  });

  test('Test 7: clicking the rendered card invokes the onOpen callback', () => {
    const onOpen = jest.fn();
    const { container } = render(<RoomCard room={room} devices={activeDevices} onOpen={onOpen} />);
    // GlassCard with onOpen auto-wraps in Pressable which adds onClick to root
    const card = container.firstElementChild as HTMLElement;
    fireEvent.click(card);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
