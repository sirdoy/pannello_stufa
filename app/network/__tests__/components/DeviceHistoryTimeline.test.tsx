/**
 * Tests for DeviceHistoryTimeline component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeviceHistoryTimeline from '../../components/DeviceHistoryTimeline';
import type { DeviceEvent, DeviceData } from '@/app/components/devices/network/types';

// Mock TimeRangeSelector component
jest.mock('../../components/TimeRangeSelector', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (range: string) => void }) => (
    <div data-testid="time-range-selector">
      <button onClick={() => onChange('1h')}>1h</button>
      <button onClick={() => onChange('24h')}>24h</button>
      <button onClick={() => onChange('7d')}>7d</button>
      <span>Current: {value}</span>
    </div>
  ),
}));

const mockDevices: DeviceData[] = [
  {
    id: '1',
    name: 'Device 1',
    ip: '192.168.1.100',
    mac: 'AA:BB:CC:DD:EE:FF',
    active: true,
  },
  {
    id: '2',
    name: 'Device 2',
    ip: '192.168.1.101',
    mac: 'BB:CC:DD:EE:FF:00',
    active: false,
  },
];

const mockEvents: DeviceEvent[] = [
  {
    deviceMac: 'AA:BB:CC:DD:EE:FF',
    deviceName: 'Device 1',
    deviceIp: '192.168.1.100',
    eventType: 'connected',
    timestamp: new Date('2024-02-15T10:00:00Z').getTime(),
  },
  {
    deviceMac: 'AA:BB:CC:DD:EE:FF',
    deviceName: 'Device 1',
    deviceIp: '192.168.1.100',
    eventType: 'disconnected',
    timestamp: new Date('2024-02-15T09:00:00Z').getTime(),
  },
  {
    deviceMac: 'BB:CC:DD:EE:FF:00',
    deviceName: 'Device 2',
    deviceIp: '192.168.1.101',
    eventType: 'connected',
    timestamp: new Date('2024-02-14T15:00:00Z').getTime(),
  },
];

describe('DeviceHistoryTimeline', () => {
  const defaultProps = {
    events: [],
    isLoading: false,
    isEmpty: true,
    timeRange: '24h' as const,
    onTimeRangeChange: jest.fn(),
    deviceFilter: null,
    onDeviceFilterChange: jest.fn(),
    devices: mockDevices,
  };

  it('should render loading state when isLoading is true', () => {
    render(<DeviceHistoryTimeline {...defaultProps} isLoading={true} isEmpty={false} />);

    expect(screen.getByText('Caricamento cronologia...')).toBeInTheDocument();
  });

  it('should render empty state when isEmpty is true', () => {
    render(<DeviceHistoryTimeline {...defaultProps} />);

    expect(screen.getByText('Nessun evento nel periodo selezionato')).toBeInTheDocument();
  });

  it('should render events grouped by date', () => {
    render(
      <DeviceHistoryTimeline
        {...defaultProps}
        events={mockEvents}
        isEmpty={false}
      />
    );

    // Should show date headers (Italian locale)
    expect(screen.getByText(/giovedì, 15 febbraio 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/mercoledì, 14 febbraio 2024/i)).toBeInTheDocument();

    // Should show device names (may appear multiple times due to Radix Select rendering)
    const device1Elements = screen.getAllByText('Device 1');
    expect(device1Elements.length).toBeGreaterThanOrEqual(2);
    const device2Elements = screen.getAllByText('Device 2');
    expect(device2Elements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render device filter dropdown with device names', () => {
    render(<DeviceHistoryTimeline {...defaultProps} />);

    // Should have "Tutti i dispositivi" option
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Note: Radix Select doesn't show options in DOM until opened
    // We can't easily test option presence without user interaction
  });

  it('should show "Connesso" badge for connected events', () => {
    const connectedEvent: DeviceEvent[] = [
      {
        deviceMac: 'AA:BB:CC:DD:EE:FF',
        deviceName: 'Test Device',
        deviceIp: '192.168.1.100',
        eventType: 'connected',
        timestamp: Date.now(),
      },
    ];

    render(
      <DeviceHistoryTimeline
        {...defaultProps}
        events={connectedEvent}
        isEmpty={false}
      />
    );

    expect(screen.getByText('Connesso')).toBeInTheDocument();
  });

  it('should show "Disconnesso" badge for disconnected events', () => {
    const disconnectedEvent: DeviceEvent[] = [
      {
        deviceMac: 'AA:BB:CC:DD:EE:FF',
        deviceName: 'Test Device',
        deviceIp: '192.168.1.100',
        eventType: 'disconnected',
        timestamp: Date.now(),
      },
    ];

    render(
      <DeviceHistoryTimeline
        {...defaultProps}
        events={disconnectedEvent}
        isEmpty={false}
      />
    );

    expect(screen.getByText('Disconnesso')).toBeInTheDocument();
  });

  it('should call onTimeRangeChange when time range changes', async () => {
    const user = userEvent.setup();
    const onTimeRangeChange = jest.fn();

    render(
      <DeviceHistoryTimeline
        {...defaultProps}
        onTimeRangeChange={onTimeRangeChange}
      />
    );

    const timeRangeSelector = screen.getByTestId('time-range-selector');
    const button7d = timeRangeSelector.querySelector('button:nth-child(3)');

    if (button7d) {
      await user.click(button7d);
      expect(onTimeRangeChange).toHaveBeenCalledWith('7d');
    }
  });

  it('should call onDeviceFilterChange when device filter changes', async () => {
    const user = userEvent.setup();
    const onDeviceFilterChange = jest.fn();

    render(
      <DeviceHistoryTimeline
        {...defaultProps}
        onDeviceFilterChange={onDeviceFilterChange}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    // Find and click the first device option
    const option = await screen.findByText('Device 1');
    await user.click(option);

    expect(onDeviceFilterChange).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF');
  });

  it('should set filter to null when "Tutti i dispositivi" is selected', async () => {
    const user = userEvent.setup();
    const onDeviceFilterChange = jest.fn();

    render(
      <DeviceHistoryTimeline
        {...defaultProps}
        deviceFilter="AA:BB:CC:DD:EE:FF"
        onDeviceFilterChange={onDeviceFilterChange}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    // Find and click "Tutti i dispositivi"
    const allOption = await screen.findByText('Tutti i dispositivi');
    await user.click(allOption);

    expect(onDeviceFilterChange).toHaveBeenCalledWith(null);
  });
});
