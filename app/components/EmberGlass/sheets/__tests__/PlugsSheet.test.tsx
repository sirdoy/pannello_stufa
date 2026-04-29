/**
 * PlugsSheet jest spec — Plan 178-08 (SHEET-06 / CONTEXT D-09).
 *
 * Mocks `useTuyaData` + `useTuyaCommands` so the sheet renders in isolation.
 * `dataOverride` lets each test reshape the hook return to drive on/off/empty/
 * loading/error branches without re-mocking the module per test.
 *
 * Pitfall 8 enforcement: subtitle has NO room segment — TuyaPlug exposes no
 * `room` field. Tests assert that "750W" / "1.5kW" appears alone (without a
 * leading room name). The deferred deviation is logged in
 * 178-CONTEXT.md `<deferred>` "PlugsSheet per-row room subtitle".
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { PlugsSheet } from '../PlugsSheet';

// --- Tuya command mock -------------------------------------------------------
const mockTogglePlug = jest.fn().mockResolvedValue(null);

jest.mock('@/app/components/devices/tuya/hooks/useTuyaCommands', () => ({
  useTuyaCommands: () => ({
    togglePlug: mockTogglePlug,
    setTimer: jest.fn(),
    cancelTimer: jest.fn(),
  }),
}));

// --- Tuya data mock with mutable override ------------------------------------
type Plug = {
  device_id: string;
  custom_name: string | null;
  switch_on: boolean | null;
  power_w: number | null;
};

interface DataShape {
  plugs: Plug[] | null;
  loading: boolean;
  error: string | null;
}

const baseData: DataShape = {
  plugs: [
    { device_id: 'd-frigo', custom_name: 'Frigo', switch_on: true, power_w: 750 },
    { device_id: 'd-tv', custom_name: 'TV', switch_on: true, power_w: 0 },
    { device_id: 'd-lava', custom_name: 'Lavatrice', switch_on: false, power_w: 0 },
    { device_id: 'd-forno', custom_name: 'Forno', switch_on: false, power_w: 0 },
  ],
  loading: false,
  error: null,
};

let dataOverride: Partial<DataShape> = {};

jest.mock('@/app/components/devices/tuya/hooks/useTuyaData', () => ({
  useTuyaData: () => ({ ...baseData, ...dataOverride }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  dataOverride = {};
});

describe('PlugsSheet (SHEET-06 / CONTEXT D-09)', () => {
  it('renders summary cards + 4 plug rows', () => {
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('plugs-sheet-count')).toHaveTextContent('2');
    expect(screen.getByTestId('plugs-sheet-count')).toHaveTextContent('/ 4');
    expect(screen.getByTestId('plugs-sheet-plug-frigo')).toBeInTheDocument();
    expect(screen.getByTestId('plugs-sheet-plug-tv')).toBeInTheDocument();
    expect(screen.getByTestId('plugs-sheet-plug-lavatrice')).toBeInTheDocument();
    expect(screen.getByTestId('plugs-sheet-plug-forno')).toBeInTheDocument();
  });

  it('total power below 1000 renders W suffix without conversion', () => {
    render(<PlugsSheet />);
    const consumption = screen.getByTestId('plugs-sheet-consumption');
    expect(consumption).toHaveTextContent('750');
    expect(consumption).toHaveTextContent('W');
    expect(consumption).not.toHaveTextContent('kW');
  });

  it('total power 1000W renders 1.00kW (boundary)', () => {
    dataOverride = {
      plugs: [
        { device_id: 'd1', custom_name: 'X', switch_on: true, power_w: 1000 },
      ],
    };
    render(<PlugsSheet />);
    const consumption = screen.getByTestId('plugs-sheet-consumption');
    expect(consumption).toHaveTextContent('1.00');
    expect(consumption).toHaveTextContent('kW');
  });

  it('total power 1500W renders 1.50kW', () => {
    dataOverride = {
      plugs: [
        { device_id: 'd1', custom_name: 'X', switch_on: true, power_w: 1500 },
      ],
    };
    render(<PlugsSheet />);
    const consumption = screen.getByTestId('plugs-sheet-consumption');
    expect(consumption).toHaveTextContent('1.50');
    expect(consumption).toHaveTextContent('kW');
  });

  it('per-plug subtitle when on with power = 750 reads 750W (no room prefix)', () => {
    render(<PlugsSheet />);
    const frigoRow = screen.getByTestId('plugs-sheet-plug-frigo');
    expect(frigoRow).toHaveTextContent('Frigo');
    expect(frigoRow).toHaveTextContent('750W');
  });

  it('per-plug subtitle when on with power 1500 reads 1.5kW', () => {
    dataOverride = {
      plugs: [
        { device_id: 'd1', custom_name: 'Forno', switch_on: true, power_w: 1500 },
      ],
    };
    render(<PlugsSheet />);
    const row = screen.getByTestId('plugs-sheet-plug-forno');
    expect(row).toHaveTextContent('1.5kW');
  });

  it('per-plug subtitle empty when off (no W/kW text)', () => {
    render(<PlugsSheet />);
    const lavaRow = screen.getByTestId('plugs-sheet-plug-lavatrice');
    expect(lavaRow).toHaveTextContent('Lavatrice');
    expect(lavaRow).not.toHaveTextContent('W');
    expect(lavaRow).not.toHaveTextContent('kW');
  });

  it('per-plug subtitle empty when on but power is 0', () => {
    render(<PlugsSheet />);
    const tvRow = screen.getByTestId('plugs-sheet-plug-tv');
    expect(tvRow).toHaveTextContent('TV');
    expect(tvRow).not.toHaveTextContent('W');
    expect(tvRow).not.toHaveTextContent('kW');
  });

  it('clicking InlineToggle on Frigo (currently on) invokes togglePlug("d-frigo", true)', () => {
    render(<PlugsSheet />);
    const toggleWrap = screen.getByTestId('plugs-sheet-plug-frigo-toggle');
    const toggle = toggleWrap.querySelector('[role="switch"]') as HTMLElement;
    expect(toggle).toBeTruthy();
    fireEvent.click(toggle);
    expect(mockTogglePlug).toHaveBeenCalledTimes(1);
    expect(mockTogglePlug).toHaveBeenCalledWith('d-frigo', true);
  });

  it('clicking InlineToggle on Lavatrice (currently off) invokes togglePlug("d-lava", false)', () => {
    render(<PlugsSheet />);
    const toggleWrap = screen.getByTestId('plugs-sheet-plug-lavatrice-toggle');
    const toggle = toggleWrap.querySelector('[role="switch"]') as HTMLElement;
    fireEvent.click(toggle);
    expect(mockTogglePlug).toHaveBeenCalledWith('d-lava', false);
  });

  it('uses device_id as label when custom_name is null', () => {
    dataOverride = {
      plugs: [
        { device_id: 'd-anon', custom_name: null, switch_on: false, power_w: 0 },
      ],
    };
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-plug-d-anon')).toHaveTextContent('d-anon');
  });

  it('renders skeleton when loading and plugs is null', () => {
    dataOverride = { plugs: null, loading: true };
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('plugs-sheet')).not.toBeInTheDocument();
  });

  it('renders empty state with 0/0 counts when plugs array is empty', () => {
    dataOverride = { plugs: [] };
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-count')).toHaveTextContent('0');
    expect(screen.getByTestId('plugs-sheet-count')).toHaveTextContent('/ 0');
    expect(screen.getByTestId('plugs-sheet-consumption')).toHaveTextContent('0W');
  });

  it('renders error state when error string set and plugs is null', () => {
    dataOverride = { plugs: null, error: 'auth expired' };
    render(<PlugsSheet />);
    expect(screen.getByTestId('plugs-sheet-error')).toBeInTheDocument();
    expect(
      screen.getByText('Non raggiungibile. Riprova più tardi.'),
    ).toBeInTheDocument();
    expect(screen.getByText('auth expired')).toBeInTheDocument();
  });

  it('handles power_w === null defensively (treats as 0)', () => {
    dataOverride = {
      plugs: [
        { device_id: 'd-unreach', custom_name: 'Unreach', switch_on: true, power_w: null },
      ],
    };
    render(<PlugsSheet />);
    const row = screen.getByTestId('plugs-sheet-plug-unreach');
    expect(row).toHaveTextContent('Unreach');
    // Treated as 0 → on but power=0 → empty subtitle (no "W"/"kW")
    expect(row).not.toHaveTextContent('W');
    expect(row).not.toHaveTextContent('kW');
  });

  it('displays Italian copy "Accese" and "Consumo" eyebrows', () => {
    render(<PlugsSheet />);
    expect(screen.getByText('Accese')).toBeInTheDocument();
    expect(screen.getByText('Consumo')).toBeInTheDocument();
  });
});
