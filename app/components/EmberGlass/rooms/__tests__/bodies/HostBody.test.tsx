/**
 * HostBody — readings of the Raspberry Pi (ROADMAP M84): CPU, temperature, memory.
 */

import { render, screen, within } from '@testing-library/react';
import { HostBody } from '../../bodies/HostBody';
import type { RoomDevice } from '../../types';

function makeDevice(extra: Record<string, unknown>): RoomDevice {
  return {
    id: 41,
    kind: 'host',
    name: 'Raspberry Pi',
    on: false,
    statusLabel: 'In linea',
    value: 'CPU 12% · 49°',
    tone: '#9a9a9a',
    extra,
  };
}

/** Chips in the order they are rendered, as [label, value] */
function chips(): Array<[string | null, string | null]> {
  return screen.getAllByTestId('stat-chip').map((chip) => [
    chip.firstElementChild!.textContent,
    within(chip).getByTestId('stat-chip-value').textContent,
  ]);
}

describe('HostBody', () => {
  it('shows CPU, temperature and RAM, rounded', () => {
    render(<HostBody device={makeDevice({ cpu: 12.4, temperature: 48.6, memory: 37.5 })} />);

    expect(chips()).toEqual([
      ['CPU', '12%'],
      ['Temp.', '49°'],
      ['RAM', '38%'],
    ]);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a zero reading, it is not "missing"', () => {
    render(<HostBody device={makeDevice({ cpu: 0, temperature: 0, memory: 0 })} />);

    expect(chips()).toEqual([
      ['CPU', '0%'],
      ['Temp.', '0°'],
      ['RAM', '0%'],
    ]);
  });

  it('shows a dash for each reading the Pi did not send', () => {
    render(<HostBody device={makeDevice({ cpu: 55, temperature: null, memory: null })} />);

    expect(chips()).toEqual([
      ['CPU', '55%'],
      ['Temp.', '—'],
      ['RAM', '—'],
    ]);
  });

  it('shows three dashes without any reading', () => {
    render(<HostBody device={makeDevice({})} />);

    expect(chips()).toEqual([
      ['CPU', '—'],
      ['Temp.', '—'],
      ['RAM', '—'],
    ]);
  });
});
