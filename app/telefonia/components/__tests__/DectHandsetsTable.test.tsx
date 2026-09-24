import { render, screen } from '@testing-library/react';
import DectHandsetsTable from '../DectHandsetsTable';
import type { DectHandset } from '../../hooks/useFritzDectHandsets';

// Real backend shape (DectHandsetModel): model is always null, status always "registered".
const sampleHandsets: DectHandset[] = [
  { dect_id: 2, name: 'Camera', phonebook_id: 0, model: null, registration_status: 'registered' },
  { dect_id: 1, name: 'Cucina', phonebook_id: 0, model: null, registration_status: 'registered' },
];

describe('DectHandsetsTable', () => {
  it('renders Nome/ID/Modello/Stato columns with real backend fields and total count', () => {
    render(<DectHandsetsTable handsets={sampleHandsets} loading={false} total={7} />);

    expect(screen.getByText('Cornette DECT')).toBeInTheDocument();
    // Total badge comes from handset_count (passed as total)
    expect(screen.getByText('7')).toBeInTheDocument();

    expect(screen.getByRole('columnheader', { name: /Nome/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^ID/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Modello/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Stato/ })).toBeInTheDocument();

    expect(screen.getByText('Cucina')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    // dect_id values
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    // model null → em-dash (one per row)
    expect(screen.getAllByText('—')).toHaveLength(2);
    // registration_status "registered" → "Registrato"
    expect(screen.getAllByText('Registrato')).toHaveLength(2);
  });

  it('does not render firmware or battery columns (not provided by the backend)', () => {
    render(<DectHandsetsTable handsets={sampleHandsets} loading={false} total={2} />);
    expect(screen.queryByText('Firmware')).not.toBeInTheDocument();
    expect(screen.queryByText('Batteria')).not.toBeInTheDocument();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it('sorts rows by dect_id', () => {
    render(<DectHandsetsTable handsets={sampleHandsets} loading={false} total={2} />);
    const rows = screen.getAllByRole('row').slice(1); // skip header
    expect(rows[0]).toHaveTextContent('Cucina');
    expect(rows[1]).toHaveTextContent('Camera');
  });

  it('renders model when present', () => {
    render(
      <DectHandsetsTable
        handsets={[{ ...sampleHandsets[0]!, model: 'FRITZ!Fon C6' }]}
        loading={false}
        total={1}
      />
    );
    expect(screen.getByText('FRITZ!Fon C6')).toBeInTheDocument();
  });

  it('renders "Non registrato" for a non-registered status', () => {
    render(
      <DectHandsetsTable
        handsets={[{ ...sampleHandsets[0]!, registration_status: 'unregistered' }]}
        loading={false}
        total={1}
      />
    );
    expect(screen.getByText('Non registrato')).toBeInTheDocument();
  });

  it('renders empty state when handsets array is empty', () => {
    render(<DectHandsetsTable handsets={[]} loading={false} total={0} />);

    expect(screen.getByText('Nessuna cornetta DECT registrata')).toBeInTheDocument();
    expect(
      screen.getByText(/Registra una cornetta dal pannello di controllo del Fritz!Box/)
    ).toBeInTheDocument();
  });

  it('renders error state with explicit message', () => {
    render(
      <DectHandsetsTable handsets={[]} loading={false} total={0} error={new Error('boom')} />
    );

    expect(screen.getByText('Impossibile caricare le cornette DECT')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
