/**
 * RoomSheet jest spec — Plan 179-08 (ROOMS-03 / CONTEXT D-21..D-22 / D-49).
 *
 * Mocks Sheet primitive (open → dialog role) and DeviceCard.
 * Covers all 7 behaviors:
 *   1. room===null → Sheet rendered with open=false (no dialog)
 *   2. room + open=true → Sheet with title={room.name}
 *   3. Summary header: 42×42 icon tile + "{activeCount} di {total} attivi"
 *   4. Active count derived from devices.filter(d => d.on).length
 *   5. Per-category sections rendered for categories present (CATEGORY_ORDER)
 *   6. Empty categories not rendered
 *   7. 0 devices → "0 di 0 attivi" + "0 categorie" + no sections
 */

import { render, screen } from '@testing-library/react';
import type { RoomConfig, RoomDevice } from '../types';

// Mock the Sheet primitive
jest.mock('../../Sheet', () => ({
  Sheet: ({
    children,
    open,
    title,
    onClose: _onClose,
  }: {
    children?: React.ReactNode;
    open: boolean;
    title?: string;
    onClose: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

// Mock DeviceCard
jest.mock('../DeviceCard', () => ({
  DeviceCard: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-device-${device.kind}-${device.name}`} />
  ),
}));

import { RoomSheet } from '../RoomSheet';

const room: RoomConfig = {
  name: 'Soggiorno',
  tone: 'var(--accent)',
  icon: 'home',
};

const makeDevice = (
  kind: RoomDevice['kind'],
  on: boolean,
  name: string
): RoomDevice => ({
  kind,
  name,
  on,
  value: '',
  tone: '#fff',
  extra: {},
});

describe('RoomSheet (ROOMS-03 / CONTEXT D-21..D-22)', () => {
  it('Test 1: room===null renders Sheet closed (no dialog)', () => {
    render(
      <RoomSheet
        open={false}
        onClose={() => {}}
        room={null}
        devices={[]}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Test 2: room provided + open=true → dialog with title=room.name', () => {
    render(
      <RoomSheet
        open={true}
        onClose={() => {}}
        room={room}
        devices={[]}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Soggiorno' })).toBeInTheDocument();
  });

  it('Test 3: summary header shows icon tile + "N di M attivi"', () => {
    const devices = [
      makeDevice('light', true, 'Luce 1'),
      makeDevice('light', false, 'Luce 2'),
    ];
    render(
      <RoomSheet open={true} onClose={() => {}} room={room} devices={devices} />
    );
    expect(screen.getByText('1 di 2 attivi')).toBeInTheDocument();
  });

  it('Test 4: active count = devices.filter(d => d.on).length', () => {
    const devices = [
      makeDevice('light', true, 'L1'),
      makeDevice('light', true, 'L2'),
      makeDevice('plug', false, 'P1'),
    ];
    render(
      <RoomSheet open={true} onClose={() => {}} room={room} devices={devices} />
    );
    // 2 active of 3 total
    expect(screen.getByText('2 di 3 attivi')).toBeInTheDocument();
  });

  it('Test 5: per-category sections rendered for categories with devices', () => {
    const devices = [
      makeDevice('light', true, 'Luce A'),
      makeDevice('plug', false, 'Presa B'),
    ];
    render(
      <RoomSheet open={true} onClose={() => {}} room={room} devices={devices} />
    );
    // CATEGORY_LABEL for light = 'Luci', plug = 'Prese'
    expect(screen.getByText('Luci')).toBeInTheDocument();
    expect(screen.getByText('Prese')).toBeInTheDocument();
    // DeviceCards rendered
    expect(screen.getByTestId('mock-device-light-Luce A')).toBeInTheDocument();
    expect(screen.getByTestId('mock-device-plug-Presa B')).toBeInTheDocument();
  });

  it('Test 6: categories with zero devices are not rendered', () => {
    const devices = [makeDevice('light', true, 'Luce')];
    render(
      <RoomSheet open={true} onClose={() => {}} room={room} devices={devices} />
    );
    // No 'Prese' section since no plug devices
    expect(screen.queryByText('Prese')).not.toBeInTheDocument();
    // No 'Stufa' section
    expect(screen.queryByText('Stufa')).not.toBeInTheDocument();
  });

  it('Test 7: 0 devices → "0 di 0 attivi" + "0 categorie di dispositivi" + no sections', () => {
    render(
      <RoomSheet open={true} onClose={() => {}} room={room} devices={[]} />
    );
    expect(screen.getByText('0 di 0 attivi')).toBeInTheDocument();
    expect(screen.getByText('0 categorie di dispositivi')).toBeInTheDocument();
    // No CATEGORY_LABEL labels present (no sections)
    expect(screen.queryByText('Luci')).not.toBeInTheDocument();
    expect(screen.queryByText('Stufa')).not.toBeInTheDocument();
  });
});
