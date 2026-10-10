/**
 * RoomCard spec: chip-grid card of a Pi room (ROADMAP M84).
 *
 * GlassCard + CardHead + 3-col grid of six cells (with more devices the last one is "+N"), empty state, count
 * badge tinted with the room tone, onOpen on tap.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import type { DeviceKind, RoomConfig, RoomDevice } from '../types';
import { RoomCard } from '../RoomCard';

const room: RoomConfig = { id: 7, name: 'Sala', tone: '#f5c84a', icon: 'sofa' };

function makeDevice(id: number, on = false, kind: DeviceKind = 'light'): RoomDevice {
  return { id, kind, name: `Device ${id}`, on, value: '', tone: '#f5c84a', extra: {} };
}

const devices = (n: number): RoomDevice[] => Array.from({ length: n }, (_, i) => makeDevice(i + 1, i % 2 === 0));

describe('RoomCard', () => {
  it('is identified by the id of the Pi room and shows its name', () => {
    render(<RoomCard room={room} devices={devices(2)} onOpen={jest.fn()} />);
    const card = screen.getByTestId('room-card-7');
    expect(within(card).getByText('Sala')).toBeInTheDocument();
  });

  it('two rooms with the same name keep distinct cards', () => {
    render(
      <>
        <RoomCard room={room} devices={[]} onOpen={jest.fn()} />
        <RoomCard room={{ ...room, id: 8 }} devices={[]} onOpen={jest.fn()} />
      </>,
    );
    expect(screen.getByTestId('room-card-7')).toBeInTheDocument();
    expect(screen.getByTestId('room-card-8')).toBeInTheDocument();
  });

  it('badge shows "active/total" in the room tone when something is on', () => {
    render(<RoomCard room={room} devices={[makeDevice(1, true), makeDevice(2, false), makeDevice(3, true)]} onOpen={jest.fn()} />);
    const badge = screen.getByText('2/3');
    expect(badge.style.fontVariantNumeric).toBe('tabular-nums');
    expect(badge).toHaveStyle({ color: '#f5c84a' });
  });

  it('badge is dimmed when nothing is on', () => {
    render(<RoomCard room={room} devices={[makeDevice(1), makeDevice(2)]} onOpen={jest.fn()} />);
    expect(screen.getByText('0/2').style.color).toBe('var(--text-2)');
  });

  it('a device that does not answer is counted in the total, not as active', () => {
    const silent: RoomDevice = { ...makeDevice(2), statusLabel: 'Non risponde', unreachable: true };
    render(<RoomCard room={room} devices={[makeDevice(1, true), silent]} onOpen={jest.fn()} />);
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('renders one chip per device, by kind', () => {
    const mixed = [makeDevice(1, true, 'stove'), makeDevice(2, false, 'valve'), makeDevice(3, true, 'host')];
    render(<RoomCard room={room} devices={mixed} onOpen={jest.fn()} />);
    const card = screen.getByTestId('room-card-7');
    expect(within(card).getByTestId('device-chip-stove')).toHaveAttribute('data-on', 'true');
    expect(within(card).getByTestId('device-chip-valve')).toHaveAttribute('data-on', 'false');
    expect(within(card).getByTestId('device-chip-host')).toBeInTheDocument();
    expect(screen.queryByTestId('room-card-7-overflow')).not.toBeInTheDocument();
  });

  it('6 devices fill the grid without an overflow chip', () => {
    render(<RoomCard room={room} devices={devices(6)} onOpen={jest.fn()} />);
    expect(screen.getAllByTestId(/^device-chip-/)).toHaveLength(6);
    expect(screen.queryByTestId('room-card-7-overflow')).not.toBeInTheDocument();
  });

  it('more than 6 devices: 5 chips and a "+N" cell, six cells in all', () => {
    render(<RoomCard room={room} devices={devices(9)} onOpen={jest.fn()} />);
    expect(screen.getAllByTestId(/^device-chip-/)).toHaveLength(5);
    const overflow = screen.getByTestId('room-card-7-overflow');
    expect(overflow).toHaveTextContent('+4');
    expect(overflow).toHaveAttribute('aria-label', '4 altri dispositivi');
    expect(overflow.parentElement?.children).toHaveLength(6);
    // The badge still counts every device, hidden ones included
    expect(screen.getByText('5/9')).toBeInTheDocument();
  });

  it('7 devices: the "+N" cell counts the two devices without a chip', () => {
    render(<RoomCard room={room} devices={devices(7)} onOpen={jest.fn()} />);
    expect(screen.getAllByTestId(/^device-chip-/)).toHaveLength(5);
    expect(screen.getByTestId('room-card-7-overflow')).toHaveTextContent('+2');
  });

  it('a room without devices says so and shows "0/0"', () => {
    render(<RoomCard room={room} devices={[]} onOpen={jest.fn()} />);
    expect(screen.getByText('Nessun dispositivo')).toBeInTheDocument();
    expect(screen.getByText('0/0')).toBeInTheDocument();
    expect(screen.queryByTestId(/^device-chip-/)).not.toBeInTheDocument();
  });

  it('a tap on the card calls onOpen', () => {
    const onOpen = jest.fn();
    render(<RoomCard room={room} devices={devices(2)} onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId('room-card-7'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('a tap on a chip opens the room too (chips are not controls)', () => {
    const onOpen = jest.fn();
    render(<RoomCard room={room} devices={devices(2)} onOpen={onOpen} />);
    fireEvent.click(screen.getAllByTestId('device-chip-light')[0]!);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
