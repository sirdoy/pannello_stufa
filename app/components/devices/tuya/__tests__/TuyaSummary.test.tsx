import { render, screen } from '@testing-library/react';
import { TuyaSummary } from '../components/TuyaSummary';
import type { TuyaPlug } from '@/types/tuyaProxy';

const makePlug = (overrides: Partial<TuyaPlug> = {}): TuyaPlug => ({
  device_id: 'plug-001',
  switch_on: true,
  power_w: 100,
  voltage_v: 230,
  current_ma: 435,
  energy_kwh: 1.2,
  countdown_s: 0,
  data_freshness: 'LIVE',
  last_polled_at: Date.now() / 1000,
  custom_name: 'Test Plug',
  device_type: 'smart_plug',
  ...overrides,
});

describe('TuyaSummary', () => {
  it('shows active and inactive counts', () => {
    const plugs: TuyaPlug[] = [
      makePlug({ device_id: 'p1', switch_on: true }),
      makePlug({ device_id: 'p2', switch_on: true }),
      makePlug({ device_id: 'p3', switch_on: false }),
    ];
    render(<TuyaSummary plugs={plugs} />);
    expect(screen.getByText(/2 attive/)).toBeInTheDocument();
    expect(screen.getByText(/1 spente/)).toBeInTheDocument();
  });

  it('shows total power in watts', () => {
    const plugs: TuyaPlug[] = [
      makePlug({ device_id: 'p1', power_w: 200 }),
      makePlug({ device_id: 'p2', power_w: 350 }),
    ];
    render(<TuyaSummary plugs={plugs} />);
    expect(screen.getByText('550 W')).toBeInTheDocument();
  });

  it('shows 0 W when all plugs are unreachable', () => {
    const plugs: TuyaPlug[] = [
      makePlug({ device_id: 'p1', power_w: null, data_freshness: 'UNREACHABLE' }),
      makePlug({ device_id: 'p2', power_w: null, data_freshness: 'UNREACHABLE' }),
    ];
    render(<TuyaSummary plugs={plugs} />);
    expect(screen.getByText('0 W')).toBeInTheDocument();
  });

  it('renders power gauge bar', () => {
    const plugs: TuyaPlug[] = [
      makePlug({ device_id: 'p1', power_w: 1750 }),
    ];
    render(<TuyaSummary plugs={plugs} />);
    // Gauge at 50% (1750/3500)
    const gaugeBar = document.querySelector('[style*="width"]');
    expect(gaugeBar).toBeTruthy();
  });

  it('shows highest consumer name and wattage', () => {
    const plugs: TuyaPlug[] = [
      makePlug({ device_id: 'p1', custom_name: 'Lavatrice', power_w: 1200 }),
      makePlug({ device_id: 'p2', custom_name: 'Forno', power_w: 800 }),
    ];
    render(<TuyaSummary plugs={plugs} />);
    expect(screen.getByText(/Lavatrice/)).toBeInTheDocument();
    expect(screen.getByText(/1200/)).toBeInTheDocument();
  });

  it('shows device_id as fallback when custom_name is null', () => {
    const plugs: TuyaPlug[] = [
      makePlug({ device_id: 'device-abc', custom_name: null, power_w: 500 }),
    ];
    render(<TuyaSummary plugs={plugs} />);
    expect(screen.getByText(/device-abc/)).toBeInTheDocument();
  });

  it('does not show highest consumer section when all power_w is 0', () => {
    const plugs: TuyaPlug[] = [
      makePlug({ device_id: 'p1', power_w: 0, switch_on: false }),
    ];
    render(<TuyaSummary plugs={plugs} />);
    expect(screen.queryByText(/Consumo max/)).not.toBeInTheDocument();
  });
});
