import { render, screen } from '@testing-library/react';
import DectHandsetsTable from '../DectHandsetsTable';
import type { DectHandset } from '../../hooks/useFritzDectHandsets';

const sampleHandsets: DectHandset[] = [
  {
    id: '1',
    name: 'Cucina',
    model: 'C6',
    firmware_version: '113.01',
    battery_charge_level: 75,
    is_registered: true,
  },
  {
    id: '2',
    name: 'Camera',
    model: 'C5',
    firmware_version: '112.00',
    battery_charge_level: 15,
    is_registered: true,
  },
];

describe('DectHandsetsTable', () => {
  it('renders rows with battery badges, registration badges, and total count', () => {
    render(
      <DectHandsetsTable
        handsets={sampleHandsets}
        loading={false}
        total={2}
      />
    );

    expect(screen.getByText('Cornette DECT')).toBeInTheDocument();
    // Total Badge shows "2"
    expect(screen.getByText('2')).toBeInTheDocument();
    // Both handsets appear
    expect(screen.getByText('Cucina')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    // Battery percentages as badges
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    // Both are registered
    const registeredBadges = screen.getAllByText('Registrato');
    expect(registeredBadges.length).toBe(2);
  });

  it('renders empty state when handsets array is empty', () => {
    render(<DectHandsetsTable handsets={[]} loading={false} total={0} />);

    expect(
      screen.getByText('Nessuna cornetta DECT registrata')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Registra una cornetta dal pannello di controllo del Fritz!Box/
      )
    ).toBeInTheDocument();
  });

  it('renders error state with explicit message', () => {
    render(
      <DectHandsetsTable
        handsets={[]}
        loading={false}
        total={0}
        error={new Error('boom')}
      />
    );

    expect(
      screen.getByText('Impossibile caricare le cornette DECT')
    ).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('renders unregistered badge when handset is not registered', () => {
    render(
      <DectHandsetsTable
        handsets={[
          {
            ...sampleHandsets[0],
            is_registered: false,
          } as DectHandset,
        ]}
        loading={false}
        total={1}
      />
    );
    expect(screen.getByText('Non registrato')).toBeInTheDocument();
  });
});
