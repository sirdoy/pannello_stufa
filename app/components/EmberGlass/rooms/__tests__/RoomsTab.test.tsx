/**
 * RoomsTab spec (ROADMAP M84).
 *
 * Rooms and members come from the Pi (`useHouseStatus`, mocked); the provider hooks (mocked) give
 * the live state. `roomConfig` and `buildRoomDevices` are the real ones, so the tests check what
 * the cards and the sheet actually receive. RoomCard and RoomSheet are stubs that expose their props.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { DeviceStatus, RoomStatusResponse } from '@/types/rooms';
import type { RoomConfig, RoomDevice } from '../types';

// --- Router / user ------------------------------------------------------
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/auth/useUser', () => ({
  useUser: () => ({ user: { sub: 'user:1' } }),
}));

// --- House status -------------------------------------------------------
const mockRefetch = jest.fn();
const mockUseHouseStatus = jest.fn();
jest.mock('../useHouseStatus', () => ({
  useHouseStatus: () => mockUseHouseStatus(),
}));

// --- Provider hooks -----------------------------------------------------
const mockUseStoveData = jest.fn();
jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: (...args: unknown[]) => mockUseStoveData(...args),
}));

const mockUseThermostatData = jest.fn();
jest.mock('@/app/components/devices/thermostat/hooks/useThermostatData', () => ({
  useThermostatData: () => mockUseThermostatData(),
}));

const mockUseLightsData = jest.fn();
jest.mock('@/app/components/devices/lights/hooks/useLightsData', () => ({
  useLightsData: () => mockUseLightsData(),
}));

const mockUseTuyaData = jest.fn();
jest.mock('@/app/components/devices/tuya/hooks/useTuyaData', () => ({
  useTuyaData: () => mockUseTuyaData(),
}));

const mockUseSonosFullData = jest.fn();
jest.mock('@/app/components/devices/sonos/hooks/useSonosFullData', () => ({
  useSonosFullData: () => mockUseSonosFullData(),
}));

const mockUseDirigeraFullData = jest.fn();
jest.mock('@/app/components/devices/dirigera/hooks/useDirigeraFullData', () => ({
  useDirigeraFullData: (...args: unknown[]) => mockUseDirigeraFullData(...args),
}));

const mockUseCameraData = jest.fn();
jest.mock('@/app/components/devices/camera/hooks/useCameraData', () => ({
  useCameraData: () => mockUseCameraData(),
}));

// --- RoomCard / RoomSheet stubs ----------------------------------------
const cardProps: Record<number, { room: RoomConfig; devices: RoomDevice[] }> = {};
jest.mock('../RoomCard', () => ({
  RoomCard: ({ room, devices, onOpen }: { room: RoomConfig; devices: RoomDevice[]; onOpen: () => void }) => {
    cardProps[room.id] = { room, devices };
    return (
      <button type="button" data-testid={`mock-room-card-${room.id}`} onClick={onOpen}>
        {room.name}
      </button>
    );
  },
}));

let sheetProps: { open: boolean; room: RoomConfig | null; devices: RoomDevice[]; onClose: () => void } | null = null;
let sheetMounts = 0;
jest.mock('../RoomSheet', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    RoomSheet: (props: { open: boolean; room: RoomConfig | null; devices: RoomDevice[]; onClose: () => void }) => {
      sheetProps = props;
      useEffect(() => {
        sheetMounts += 1;
      }, []);
      return props.open ? <div data-testid="mock-room-sheet">{props.room?.name}</div> : null;
    },
  };
});

import { RoomsTab } from '../RoomsTab';

// --- Fixtures -----------------------------------------------------------

function member(over: Partial<DeviceStatus> & Pick<DeviceStatus, 'provider_name' | 'device_registry_id'>): DeviceStatus {
  return {
    device_id: `dev-${over.device_registry_id}`,
    custom_name: `Device ${over.device_registry_id}`,
    device_type: '',
    status: 'available',
    data: null,
    ...over,
  };
}

function room(id: number, name: string, devices: DeviceStatus[] = []): RoomStatusResponse {
  return {
    room_id: id,
    room_name: name,
    devices,
    device_count: devices.length,
    available_count: devices.length,
    unavailable_count: 0,
  };
}

const SALA = room(7, 'Sala', [
  member({
    device_registry_id: 11,
    provider_name: 'hue',
    device_id: '5',
    custom_name: 'Lampada',
    data: { status: 'available', on: false, brightness: 25, reachable: true },
  }),
  member({
    device_registry_id: 12,
    provider_name: 'thermorossi',
    custom_name: 'Stufa',
    data: { status: 'available', active: true, temperature: 21, power_level: 2 },
  }),
]);
const STUDIO = room(9, 'Studio', [
  member({ device_registry_id: 21, provider_name: 'tuya', device_id: 'plug-1', custom_name: 'Presa' }),
]);

function houseStatus(over: Partial<ReturnType<typeof defaultHouse>> = {}) {
  return { ...defaultHouse(), ...over };
}
function defaultHouse() {
  return {
    rooms: [SALA, STUDIO] as RoomStatusResponse[] | null,
    loading: false,
    error: null as string | null,
    refetch: mockRefetch,
  };
}

const hueLight = (over: Record<string, unknown>) => ({ light_id: '5', on: true, brightness: 254, reachable: true, ...over });

beforeEach(() => {
  jest.clearAllMocks();
  sheetProps = null;
  sheetMounts = 0;
  for (const k of Object.keys(cardProps)) delete cardProps[Number(k)];

  mockUseHouseStatus.mockReturnValue(houseStatus());
  mockUseStoveData.mockReturnValue({
    initialLoading: false,
    unreachable: false,
    isAccesa: true,
    powerLevel: 4,
    fanLevel: 3,
  });
  mockUseThermostatData.mockReturnValue({ topology: null, status: null });
  mockUseLightsData.mockReturnValue({ loading: false, lights: [hueLight({})] });
  mockUseTuyaData.mockReturnValue({ plugs: [{ device_id: 'plug-1', switch_on: true, power_w: 80, energy_kwh: 1 }] });
  mockUseSonosFullData.mockReturnValue({ data: null });
  mockUseDirigeraFullData.mockReturnValue({ data: null });
  mockUseCameraData.mockReturnValue({ loading: false, cameras: [] });
});

function device(roomId: number, id: number): RoomDevice {
  const found = cardProps[roomId]?.devices.find((d) => d.id === id);
  if (!found) throw new Error(`device ${id} not passed to the card of room ${roomId}`);
  return found;
}

// --- States of the page -------------------------------------------------

describe('RoomsTab: page states', () => {
  it('shows the skeleton while the first read is running, with no eyebrow and no card', () => {
    mockUseHouseStatus.mockReturnValue(houseStatus({ rooms: null, loading: true }));
    render(<RoomsTab />);

    expect(screen.getByRole('heading', { level: 1, name: 'Stanze' })).toBeInTheDocument();
    expect(screen.getByTestId('stanze-loading').children).toHaveLength(4);
    expect(screen.queryByText(/stanz[ae]$/)).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^mock-room-card-/)).not.toBeInTheDocument();
    expect(screen.queryByText('Nessuna stanza')).not.toBeInTheDocument();
  });

  it('shows the error banner when nothing was read, and "Riprova" reads again', () => {
    mockUseHouseStatus.mockReturnValue(houseStatus({ rooms: null, error: 'Stanze non disponibili' }));
    render(<RoomsTab />);

    expect(screen.getByText('Stanze non disponibili')).toBeInTheDocument();
    expect(screen.getByText('Il Pi non ha risposto. Riprova tra poco.')).toBeInTheDocument();
    expect(screen.queryByTestId('stanze-loading')).not.toBeInTheDocument();
    expect(screen.queryByText('Nessuna stanza')).not.toBeInTheDocument();

    expect(mockRefetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the cards and hides the skeleton during a refresh', () => {
    mockUseHouseStatus.mockReturnValue(houseStatus({ loading: true }));
    render(<RoomsTab />);
    expect(screen.queryByTestId('stanze-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-room-card-7')).toBeInTheDocument();
  });

  it('shows the empty state when the Pi has no rooms; its button opens the rooms manager', () => {
    mockUseHouseStatus.mockReturnValue(houseStatus({ rooms: [] }));
    render(<RoomsTab />);

    expect(screen.getByText('Nessuna stanza')).toBeInTheDocument();
    expect(screen.getByText('Crea le stanze della casa e assegna i dispositivi.')).toBeInTheDocument();
    expect(screen.getByText('0 stanze')).toBeInTheDocument();
    expect(screen.queryByTestId(/^mock-room-card-/)).not.toBeInTheDocument();

    const emptyState = screen.getByText('Nessuna stanza').parentElement!;
    fireEvent.click(within(emptyState).getByRole('button', { name: 'Gestisci stanze' }));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/rooms');
  });
});

// --- Rooms from the Pi --------------------------------------------------

describe('RoomsTab: rooms from the Pi', () => {
  it('renders one RoomCard per room, in the order of the Pi', () => {
    render(<RoomsTab />);
    const cards = screen.getAllByTestId(/^mock-room-card-/);
    expect(cards.map((c) => c.textContent)).toEqual(['Sala', 'Studio']);
    expect(screen.queryByText('Nessuna stanza')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stanze-loading')).not.toBeInTheDocument();
  });

  it('eyebrow counts the rooms: "2 stanze"', () => {
    render(<RoomsTab />);
    expect(screen.getByText('2 stanze')).toBeInTheDocument();
  });

  it('eyebrow is singular with one room: "1 stanza"', () => {
    mockUseHouseStatus.mockReturnValue(houseStatus({ rooms: [SALA] }));
    render(<RoomsTab />);
    expect(screen.getByText('1 stanza')).toBeInTheDocument();
  });

  it('gives each card the id and name of the Pi room, with the look derived from the name', () => {
    render(<RoomsTab />);
    expect(cardProps[7]!.room).toEqual({ id: 7, name: 'Sala', icon: 'sofa', tone: 'var(--accent)' });
    // "Studio" is not a known room: default icon, palette colour of its position
    expect(cardProps[9]!.room).toEqual({ id: 9, name: 'Studio', icon: 'home', tone: '#b080ff' });
  });

  it('the header button opens the rooms manager', () => {
    render(<RoomsTab />);
    const manage = screen.getByTestId('stanze-manage');
    expect(manage).toHaveAccessibleName('Gestisci stanze');
    fireEvent.click(manage);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/rooms');
  });
});

// --- Live state joined with the members ---------------------------------

describe('RoomsTab: live state of the devices', () => {
  it('joins each member with the live data of its provider', () => {
    render(<RoomsTab />);
    expect(mockUseStoveData).toHaveBeenCalledWith({ userId: 'user:1' });
    expect(mockUseDirigeraFullData).toHaveBeenCalledWith('all');

    // Sorted by kind: the stove comes before the light
    expect(cardProps[7]!.devices.map((d) => d.id)).toEqual([12, 11]);
    expect(device(7, 12)).toMatchObject({ kind: 'stove', on: true, value: 'Potenza 4' });
    expect(device(7, 11)).toMatchObject({ kind: 'light', name: 'Lampada', on: true, value: '100%' });
    expect(device(9, 21)).toMatchObject({ kind: 'plug', on: true, value: '80W' });
  });

  it('before the first stove reading the summary of the Pi is used, not "off"', () => {
    mockUseStoveData.mockReturnValue({
      initialLoading: true,
      unreachable: false,
      isAccesa: false,
      powerLevel: null,
      fanLevel: null,
    });
    render(<RoomsTab />);
    expect(device(7, 12)).toMatchObject({ on: true, statusLabel: 'Accesa', value: 'Potenza 2' });
  });

  it('a stove that does not answer is "Non risponde", also while still loading', () => {
    mockUseStoveData.mockReturnValue({
      initialLoading: true,
      unreachable: true,
      isAccesa: false,
      powerLevel: null,
      fanLevel: null,
    });
    render(<RoomsTab />);
    expect(device(7, 12)).toMatchObject({ on: false, statusLabel: 'Non risponde', unreachable: true });
  });

  it('while the lights are loading the summary of the Pi is used', () => {
    mockUseLightsData.mockReturnValue({ loading: true, lights: [] });
    render(<RoomsTab />);
    expect(device(7, 11)).toMatchObject({ on: false, statusLabel: 'Spenta' });
    expect(device(7, 11).unreachable).toBeUndefined();
  });

  it('reads the sensors from the Dirigera snapshot and waits for the cameras', () => {
    const sensors = [{ id: 's-1', is_reachable: true, is_open: true, battery_percentage: 90 }];
    mockUseDirigeraFullData.mockReturnValue({ data: { sensors } });
    mockUseCameraData.mockReturnValue({ loading: true, cameras: [] });
    mockUseHouseStatus.mockReturnValue(
      houseStatus({
        rooms: [
          room(3, 'Ingresso', [
            member({ device_registry_id: 31, provider_name: 'dirigera', device_id: 's-1' }),
            member({ device_registry_id: 32, provider_name: 'netatmo', device_type: 'camera', device_id: 'cam-1' }),
          ]),
        ],
      }),
    );
    render(<RoomsTab />);
    expect(device(3, 31)).toMatchObject({ kind: 'sensor', on: true, statusLabel: 'Aperta' });
    // Cameras still loading: "In attesa", not "Non risponde"
    expect(device(3, 32)).toMatchObject({ kind: 'camera', statusLabel: 'In attesa' });
    expect(device(3, 32).unreachable).toBeUndefined();
  });
});

// --- Shared sheet -------------------------------------------------------

describe('RoomsTab: room sheet', () => {
  it('is closed at first, with no room and no devices', () => {
    render(<RoomsTab />);
    expect(screen.queryByTestId('mock-room-sheet')).not.toBeInTheDocument();
    expect(sheetProps).toMatchObject({ open: false, room: null, devices: [] });
  });

  it('opening a room feeds the sheet with that room and its devices', () => {
    render(<RoomsTab />);
    fireEvent.click(screen.getByTestId('mock-room-card-7'));

    expect(screen.getByTestId('mock-room-sheet')).toHaveTextContent('Sala');
    expect(sheetProps!.open).toBe(true);
    expect(sheetProps!.room).toEqual(cardProps[7]!.room);
    expect(sheetProps!.devices.map((d) => d.id)).toEqual([12, 11]);
    expect(sheetProps!.devices).toEqual(cardProps[7]!.devices);
  });

  it('the open sheet follows the live state', () => {
    const { rerender } = render(<RoomsTab />);
    fireEvent.click(screen.getByTestId('mock-room-card-7'));
    expect(sheetProps!.devices.find((d) => d.id === 11)).toMatchObject({ on: true });

    mockUseLightsData.mockReturnValue({ loading: false, lights: [hueLight({ on: false })] });
    rerender(<RoomsTab />);
    expect(sheetProps!.devices.find((d) => d.id === 11)).toMatchObject({ on: false, statusLabel: 'Spenta' });
  });

  it('onClose closes the sheet', () => {
    render(<RoomsTab />);
    fireEvent.click(screen.getByTestId('mock-room-card-7'));
    act(() => sheetProps!.onClose());
    expect(screen.queryByTestId('mock-room-sheet')).not.toBeInTheDocument();
    expect(sheetProps).toMatchObject({ open: false, room: null, devices: [] });
  });

  it('remounts the sheet when another room is opened', () => {
    const { rerender } = render(<RoomsTab />);
    fireEvent.click(screen.getByTestId('mock-room-card-7'));
    const mountsAfterFirst = sheetMounts;

    // Same room, new live data: the sheet stays mounted
    mockUseLightsData.mockReturnValue({ loading: false, lights: [hueLight({ on: false })] });
    rerender(<RoomsTab />);
    expect(sheetMounts).toBe(mountsAfterFirst);

    fireEvent.click(screen.getByTestId('mock-room-card-9'));
    expect(sheetMounts).toBeGreaterThan(mountsAfterFirst);
    expect(sheetProps!.room).toMatchObject({ id: 9, name: 'Studio' });
    expect(sheetProps!.devices.map((d) => d.id)).toEqual([21]);
  });

  it('closes the sheet when the open room disappears from the Pi', () => {
    const { rerender } = render(<RoomsTab />);
    fireEvent.click(screen.getByTestId('mock-room-card-9'));
    expect(sheetProps!.open).toBe(true);

    mockUseHouseStatus.mockReturnValue(houseStatus({ rooms: [SALA] }));
    rerender(<RoomsTab />);
    expect(sheetProps).toMatchObject({ open: false, room: null });
  });
});
