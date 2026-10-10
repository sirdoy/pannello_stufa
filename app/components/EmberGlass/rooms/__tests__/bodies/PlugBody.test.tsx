/**
 * PlugBody — readings of a smart plug (ROADMAP M84): power now ("Ora") and energy counter
 * ("Energia"). The switch is in the card header, not here.
 */

import { render, screen, within } from '@testing-library/react';
import { PlugBody } from '../../bodies/PlugBody';
import type { RoomDevice } from '../../types';

function makeDevice(extra: Record<string, unknown>): RoomDevice {
  return {
    id: 22,
    kind: 'plug',
    name: 'Presa bollitore',
    on: true,
    statusLabel: 'Accesa',
    value: '450W',
    tone: '#ffb84a',
    extra: { id: 'plug-1', ...extra },
  };
}

function chipValue(label: string): string | null {
  const chip = screen.getByText(label).parentElement!;
  return within(chip).getByTestId('stat-chip-value').textContent;
}

describe('PlugBody', () => {
  it('shows the two readings "Ora" and "Energia" and no control', () => {
    render(<PlugBody device={makeDevice({ power: 450, today_kwh: 2.44 })} />);

    expect(screen.getAllByTestId('stat-chip')).toHaveLength(2);
    expect(chipValue('Ora')).toBe('450W');
    expect(chipValue('Energia')).toBe('2.4 kWh');
    expect(screen.queryByText('Oggi')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it.each([
    [0, '0W'],
    [12.6, '13W'],
    [999, '999W'],
    [1000, '1.0kW'],
    [1500, '1.5kW'],
    [2300, '2.3kW'],
  ])('formats %s watts as %s', (power, expected) => {
    render(<PlugBody device={makeDevice({ power, today_kwh: 0 })} />);
    expect(chipValue('Ora')).toBe(expected);
  });

  it.each([
    [0, '0.0 kWh'],
    [0.84, '0.8 kWh'],
    [12, '12.0 kWh'],
    [128.36, '128.4 kWh'],
  ])('formats %s kWh as %s', (today_kwh, expected) => {
    render(<PlugBody device={makeDevice({ power: 0, today_kwh })} />);
    expect(chipValue('Energia')).toBe(expected);
  });

  it('shows zero when the plug sent no reading', () => {
    render(<PlugBody device={makeDevice({})} />);

    expect(chipValue('Ora')).toBe('0W');
    expect(chipValue('Energia')).toBe('0.0 kWh');
  });
});
