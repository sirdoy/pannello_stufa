/**
 * ClimateCard — Phase 177 (DASH-03) — Jest unit tests
 *
 * Coverage:
 *   Fixture A — name-on-RoomStatus path (z.name present)
 *   Fixture B — name-via-topology path (z.name absent, topology.rooms has it) (D-16)
 *   Fixture C — fallback-to-room_id path (no name anywhere) (D-16)
 *   Footer "{N} di {M} attive", uppercase mode (A-05), tap → sheet open
 *
 * D-16 (canonical room-name resolution):
 *   z.name → topology.rooms.find(r => r.id === z.room_id)?.name → z.room_id
 *   The hook (useThermostatData) maps RoomStatus from the v1 /homestatus payload
 *   which does NOT include `room_name` consistently — the topology lookup is the
 *   canonical fallback. Final fallback to `room_id` is non-fatal.
 */
import { fireEvent, render } from '@testing-library/react';

jest.mock('@/app/components/devices/thermostat/hooks/useThermostatData', () => ({
  useThermostatData: jest.fn(),
}));
// 260506-d45: useThermostatCommands is now called from ClimateCard (hook
// lifted from ClimateSheet body); stub it to avoid pulling in ToastProvider /
// retryable command machinery.
jest.mock('@/app/components/devices/thermostat/hooks/useThermostatCommands', () => ({
  useThermostatCommands: () => ({
    setRoomSetpoint: jest.fn(),
    setHomeMode: jest.fn(),
    setRoomMode: jest.fn(),
    netatmoTempCmd: { execute: jest.fn(), isRetrying: false, lastError: null },
    netatmoModeCmd: { execute: jest.fn(), isRetrying: false, lastError: null },
  }),
}));
// Mock the real ClimateSheet body (Phase 178-09 swap; 260506-d45 props lifted)
// so the card-level test does not run ClimateSheet's hooks (debounce,
// useThermostatCommands, etc.). The stub ignores all props.
jest.mock('../../sheets/ClimateSheet', () => ({
  ClimateSheet: () => <div data-testid="climate-sheet" />,
}));

import ClimateCard from '../ClimateCard';
import { useThermostatData } from '@/app/components/devices/thermostat/hooks/useThermostatData';

const useThermostatDataMock = useThermostatData as jest.Mock;
const originalScrollTo = window.scrollTo;

describe('ClimateCard (Phase 177 — DASH-03)', () => {
  beforeEach(() => {
    useThermostatDataMock.mockReset();
    window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
  });

  afterEach(() => {
    document.body.removeAttribute('style');
    window.scrollTo = originalScrollTo;
  });

  test('Fixture A: renders zone names from RoomStatus.name + temps + footer + uppercase mode', () => {
    useThermostatDataMock.mockReturnValue({
      status: {
        rooms: [
          { room_id: 'r1', name: 'Salotto', temperature: 21.3, heating: true },
          { room_id: 'r2', name: 'Cucina', temperature: 19.8, heating: false },
        ],
        mode: 'auto',
      },
      topology: { rooms: [] },
    });
    const { getByText, getByTestId } = render(<ClimateCard />);
    expect(getByText('Salotto')).toBeInTheDocument();
    expect(getByText('Cucina')).toBeInTheDocument();
    expect(getByText('21.3°')).toBeInTheDocument();
    expect(getByText('19.8°')).toBeInTheDocument();
    expect(getByText('1 di 2 attive')).toBeInTheDocument();
    // A-05: mode uppercase via .toUpperCase()
    expect(getByText('AUTO')).toBeInTheDocument();
    // sanity: card root testid present
    expect(getByTestId('climate-card')).toBeInTheDocument();
  });

  test('Fixture B (D-16): name absent on RoomStatus → resolved via topology.rooms lookup', () => {
    useThermostatDataMock.mockReturnValue({
      status: {
        rooms: [
          // no `name` on the room — hook surfaces v1 raw rows
          { room_id: 'r1', temperature: 22.0, heating: true },
        ],
        mode: 'manuale',
      },
      topology: {
        rooms: [{ id: 'r1', name: 'Camera' }],
      },
    });
    const { getByText, queryByText } = render(<ClimateCard />);
    // Resolved via topology lookup, NOT raw room_id
    expect(getByText('Camera')).toBeInTheDocument();
    expect(queryByText('r1')).toBeNull();
    // A-05: mode uppercase via .toUpperCase()
    expect(getByText('MANUALE')).toBeInTheDocument();
    expect(getByText('1 di 1 attive')).toBeInTheDocument();
  });

  test('Fixture C (D-16 fallback): no name anywhere → falls back to room_id (non-fatal)', () => {
    useThermostatDataMock.mockReturnValue({
      status: {
        rooms: [{ room_id: 'r1', temperature: 22.0, heating: false }],
        mode: 'off',
      },
      topology: { rooms: [] },
    });
    const { getByText } = render(<ClimateCard />);
    expect(getByText('r1')).toBeInTheDocument();
    expect(getByText('OFF')).toBeInTheDocument();
    expect(getByText('0 di 1 attive')).toBeInTheDocument();
  });

  test('Empty rooms: footer shows 0 di 0 attive', () => {
    useThermostatDataMock.mockReturnValue({
      status: { rooms: [], mode: 'auto' },
      topology: { rooms: [] },
    });
    const { getByText } = render(<ClimateCard />);
    expect(getByText('0 di 0 attive')).toBeInTheDocument();
  });

  test('Caps zones at 4 (slice(0, 4)) but counts all in footer', () => {
    useThermostatDataMock.mockReturnValue({
      status: {
        rooms: [
          { room_id: 'r1', name: 'A', temperature: 20, heating: true },
          { room_id: 'r2', name: 'B', temperature: 20, heating: true },
          { room_id: 'r3', name: 'C', temperature: 20, heating: true },
          { room_id: 'r4', name: 'D', temperature: 20, heating: true },
          { room_id: 'r5', name: 'E', temperature: 20, heating: true },
          { room_id: 'r6', name: 'F', temperature: 20, heating: false },
        ],
        mode: 'auto',
      },
      topology: { rooms: [] },
    });
    const { getByText, queryByText } = render(<ClimateCard />);
    // Only the first 4 names rendered
    expect(getByText('A')).toBeInTheDocument();
    expect(getByText('D')).toBeInTheDocument();
    expect(queryByText('E')).toBeNull();
    expect(queryByText('F')).toBeNull();
    // Footer counts ALL rooms (5 active out of 6 total)
    expect(getByText('5 di 6 attive')).toBeInTheDocument();
  });

  test('Tap → sheet opens (transform translateY(0))', () => {
    useThermostatDataMock.mockReturnValue({
      status: {
        rooms: [{ room_id: 'r1', name: 'Salotto', temperature: 21, heating: false }],
        mode: 'auto',
      },
      topology: { rooms: [] },
    });
    const { getByTestId, container } = render(<ClimateCard />);
    const dialogClosed = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialogClosed?.getAttribute('style') ?? '').toContain('translateY(110%)');
    fireEvent.click(getByTestId('climate-card'));
    const dialogOpen = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialogOpen?.getAttribute('style') ?? '').toContain('translateY(0)');
    // Real ClimateSheet body is mounted (mocked here) on open (Phase 178-09).
    expect(getByTestId('climate-sheet')).toBeInTheDocument();
  });

  test('Handles status=null gracefully (no crash, footer 0 di 0 attive)', () => {
    useThermostatDataMock.mockReturnValue({
      status: null,
      topology: null,
    });
    const { getByText } = render(<ClimateCard />);
    expect(getByText('0 di 0 attive')).toBeInTheDocument();
  });
});
