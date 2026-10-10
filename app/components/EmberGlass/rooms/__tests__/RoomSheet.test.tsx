/**
 * RoomSheet spec: sheet of a Pi room (ROADMAP M84).
 *
 * Sheet and DeviceCard are stubs. Covers the closed sheet, the summary header, the sections by
 * kind in CATEGORY_ORDER and the empty state of a room without devices.
 */

import { render, screen, within } from '@testing-library/react';
import type { DeviceKind, RoomConfig, RoomDevice } from '../types';
import { CATEGORY_LABEL, CATEGORY_ORDER } from '../lib/rooms-config';

const mockSheetOnClose = jest.fn();
jest.mock('../../Sheet', () => ({
  Sheet: ({
    children,
    open,
    title,
    onClose,
  }: {
    children?: React.ReactNode;
    open: boolean;
    title?: string;
    onClose: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <button type="button" onClick={onClose}>close</button>
        {children}
      </div>
    ) : null,
}));

jest.mock('../DeviceCard', () => ({
  DeviceCard: ({ device }: { device: RoomDevice }) => (
    <div data-testid={`mock-device-${device.id}`} data-kind={device.kind}>
      {device.name}
    </div>
  ),
}));

import { RoomSheet } from '../RoomSheet';

const room: RoomConfig = { id: 7, name: 'Sala', tone: 'var(--accent)', icon: 'sofa' };

let nextId = 1;
function makeDevice(kind: DeviceKind, on: boolean, name = `${kind} ${nextId}`): RoomDevice {
  return { id: nextId++, kind, name, on, value: '', tone: '#fff', extra: {} };
}

function renderSheet(devices: RoomDevice[], open = true) {
  return render(<RoomSheet open={open} onClose={mockSheetOnClose} room={room} devices={devices} />);
}

beforeEach(() => {
  nextId = 1;
  mockSheetOnClose.mockClear();
});

describe('RoomSheet', () => {
  it('without a room the sheet is closed', () => {
    render(<RoomSheet open onClose={jest.fn()} room={null} devices={[makeDevice('light', true)]} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^mock-device-/)).not.toBeInTheDocument();
  });

  it('with a room and open=false nothing is shown', () => {
    renderSheet([makeDevice('light', true)], false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens with the room name as title and the room id as test id', () => {
    renderSheet([]);
    const dialog = screen.getByRole('dialog', { name: 'Sala' });
    expect(within(dialog).getByTestId('stanze-sheet-7')).toBeInTheDocument();
  });

  it('passes onClose to the sheet', () => {
    renderSheet([]);
    screen.getByRole('button', { name: 'close' }).click();
    expect(mockSheetOnClose).toHaveBeenCalledTimes(1);
  });

  it('summary counts the devices that are on', () => {
    renderSheet([makeDevice('light', true), makeDevice('light', true), makeDevice('plug', false)]);
    expect(screen.getByText('2 di 3 attivi')).toBeInTheDocument();
    expect(screen.getByText('2 categorie di dispositivi')).toBeInTheDocument();
  });

  it('summary is singular with one kind of device', () => {
    renderSheet([makeDevice('light', true), makeDevice('light', false)]);
    expect(screen.getByText('1 di 2 attivi')).toBeInTheDocument();
    expect(screen.getByText('1 categoria di dispositivi')).toBeInTheDocument();
  });

  it('renders one section per kind present, with its label and its devices', () => {
    const lamp = makeDevice('light', true, 'Lampada');
    const strip = makeDevice('light', false, 'Striscia');
    const plug = makeDevice('plug', false, 'Presa');
    renderSheet([lamp, strip, plug]);

    const sections = screen.getByTestId('stanze-sheet-7').querySelectorAll('section');
    expect(sections).toHaveLength(2);

    const lights = within(sections[0] as HTMLElement);
    expect(lights.getByText('Luci')).toBeInTheDocument();
    expect(lights.getAllByTestId(/^mock-device-/).map((el) => el.textContent)).toEqual(['Lampada', 'Striscia']);

    const plugs = within(sections[1] as HTMLElement);
    expect(plugs.getByText('Prese')).toBeInTheDocument();
    expect(plugs.getAllByTestId(/^mock-device-/).map((el) => el.textContent)).toEqual(['Presa']);

    expect(screen.queryByText('Stufa')).not.toBeInTheDocument();
    expect(screen.queryByText('Audio')).not.toBeInTheDocument();
  });

  it('orders the sections by CATEGORY_ORDER, whatever the order of the devices', () => {
    const reversed = [...CATEGORY_ORDER].reverse().map((kind) => makeDevice(kind, false));
    renderSheet(reversed);

    const sections = Array.from(screen.getByTestId('stanze-sheet-7').querySelectorAll('section'));
    expect(sections.map((s) => s.firstElementChild?.textContent)).toEqual(
      CATEGORY_ORDER.map((kind) => CATEGORY_LABEL[kind]),
    );
    expect(sections.map((s) => s.querySelector('[data-kind]')?.getAttribute('data-kind'))).toEqual(CATEGORY_ORDER);
    expect(screen.getByText(`${CATEGORY_ORDER.length} categorie di dispositivi`)).toBeInTheDocument();
  });

  it('valves and the Pi have their own sections ("Termovalvole", "Sistema")', () => {
    renderSheet([makeDevice('host', false), makeDevice('valve', true), makeDevice('thermo', true)]);
    const labels = Array.from(screen.getByTestId('stanze-sheet-7').querySelectorAll('section')).map(
      (s) => s.firstElementChild?.textContent,
    );
    expect(labels).toEqual(['Termostato', 'Termovalvole', 'Sistema']);
  });

  it('a room without devices shows the empty state and no section', () => {
    renderSheet([]);
    expect(screen.getByText('0 di 0 attivi')).toBeInTheDocument();
    expect(screen.getByText('0 categorie di dispositivi')).toBeInTheDocument();
    expect(screen.getByText('Nessun dispositivo')).toBeInTheDocument();
    expect(screen.getByText('Assegna i dispositivi a questa stanza da Gestisci stanze.')).toBeInTheDocument();
    expect(screen.getByTestId('stanze-sheet-7').querySelectorAll('section')).toHaveLength(0);
  });

  it('a room with devices has no empty state', () => {
    renderSheet([makeDevice('light', false)]);
    expect(screen.queryByText('Nessun dispositivo')).not.toBeInTheDocument();
  });
});
