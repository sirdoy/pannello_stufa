/**
 * DirigeraCard — Jest unit tests
 *
 * The card summarises DIRIGERA contact + occupancy sensors from
 * useDirigeraFullData('all') (the Phase 177 empty-plug placeholder is gone).
 */
import { fireEvent, render } from '@testing-library/react';

import DirigeraCard from '../DirigeraCard';
import type { DirigeraSensor } from '@/types/dirigeraProxy';

const useDirigeraFullDataMock = jest.fn();
jest.mock('@/app/components/devices/dirigera/hooks/useDirigeraFullData', () => ({
  useDirigeraFullData: (filter: string) => useDirigeraFullDataMock(filter),
}));

function sensor(overrides: Partial<DirigeraSensor>): DirigeraSensor {
  return {
    id: 's1',
    type: 'openCloseSensor',
    custom_name: null,
    room: null,
    firmware_version: null,
    battery_percentage: 80,
    is_reachable: true,
    last_seen: '2026-09-25T10:00:00Z',
    ...overrides,
  };
}

function mockSensors(sensors: DirigeraSensor[] | null) {
  useDirigeraFullDataMock.mockReturnValue({
    data: sensors === null ? null : { sensors },
    loading: sensors === null,
    error: null,
    stale: false,
  });
}

const SENSORS: DirigeraSensor[] = [
  sensor({ id: 'door', custom_name: 'Porta ingresso', is_open: true }),
  sensor({ id: 'window', custom_name: 'Finestra bagno', is_open: false }),
  sensor({ id: 'motion', type: 'occupancySensor', custom_name: 'Corridoio', is_detected: false }),
];

describe('DirigeraCard', () => {
  beforeEach(() => {
    useDirigeraFullDataMock.mockReset();
    mockSensors(SENSORS);
  });

  test('reads all sensors from useDirigeraFullData', () => {
    render(<DirigeraCard />);
    expect(useDirigeraFullDataMock).toHaveBeenCalledWith('all');
  });

  test('lists sensors with their state', () => {
    const { getByText } = render(<DirigeraCard />);
    expect(getByText('Porta ingresso')).toBeInTheDocument();
    expect(getByText('Aperto')).toBeInTheDocument();
    expect(getByText('Chiuso')).toBeInTheDocument();
    expect(getByText('Fermo')).toBeInTheDocument();
  });

  test('right slot and footer count active sensors', () => {
    const { getByText } = render(<DirigeraCard />);
    expect(getByText('1 aperti')).toBeInTheDocument();
    expect(getByText('1 attivi di 3 sensori')).toBeInTheDocument();
  });

  test('detected motion counts as active', () => {
    mockSensors([sensor({ id: 'm', type: 'occupancySensor', custom_name: 'Sala', is_detected: true })]);
    const { getByText } = render(<DirigeraCard />);
    expect(getByText('Movimento')).toBeInTheDocument();
    expect(getByText('1 attivi di 1 sensori')).toBeInTheDocument();
  });

  test('all closed shows OK', () => {
    mockSensors([sensor({ is_open: false })]);
    const { getByText } = render(<DirigeraCard />);
    expect(getByText('OK')).toBeInTheDocument();
  });

  test('loading and empty states', () => {
    mockSensors(null);
    const { getByText, rerender } = render(<DirigeraCard />);
    expect(getByText('Caricamento…')).toBeInTheDocument();
    mockSensors([]);
    rerender(<DirigeraCard />);
    expect(getByText('Nessun sensore')).toBeInTheDocument();
    expect(getByText('—')).toBeInTheDocument();
  });

  test('clicking the card opens a sheet titled "IKEA"', () => {
    const { getByTestId, queryByRole } = render(<DirigeraCard />);
    fireEvent.click(getByTestId('dirigera-card'));
    const dialog = queryByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute('style') ?? '').toContain('translateY(0)');
    expect(dialog!.textContent ?? '').toContain('IKEA');
  });

  test('NO inline toggle in card body (DASH-10)', () => {
    const { getByTestId } = render(<DirigeraCard />);
    expect(getByTestId('dirigera-card').querySelectorAll('[role="switch"]').length).toBe(0);
  });
});
