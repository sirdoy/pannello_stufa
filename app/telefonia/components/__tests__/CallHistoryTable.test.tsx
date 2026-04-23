import { render, screen, fireEvent } from '@testing-library/react';
import CallHistoryTable from '../CallHistoryTable';
import type { CallRecord } from '../../hooks/useFritzCallHistory';

const sampleCalls: CallRecord[] = [
  {
    id: 'c1',
    call_type: 'incoming',
    number: '+393331112233',
    name: 'Mario',
    duration_seconds: 125,
    timestamp: 1713700000, // 2024-04-21 (Unix seconds — *1000 applied by component)
    port: 'DECT-1',
  },
  {
    id: 'c2',
    call_type: 'outgoing',
    number: '+393332223344',
    name: null,
    duration_seconds: 3725, // 1:02:05
    timestamp: 1713600000,
    port: 'DECT-1',
  },
  {
    id: 'c3',
    call_type: 'missed',
    number: '+393339999999',
    name: 'Ignoto',
    duration_seconds: 0,
    timestamp: 1713500000,
    port: null,
  },
];

describe('CallHistoryTable', () => {
  const noop = () => {};

  it('renders rows with call-type badges "In entrata", "In uscita", "Persa"', () => {
    render(
      <CallHistoryTable
        calls={sampleCalls}
        loading={false}
        totalCount={sampleCalls.length}
        page={0}
        onPageChange={noop}
      />
    );

    expect(screen.getByText('Cronologia chiamate')).toBeInTheDocument();
    expect(screen.getByText('In entrata')).toBeInTheDocument();
    expect(screen.getByText('In uscita')).toBeInTheDocument();
    expect(screen.getByText('Persa')).toBeInTheDocument();
  });

  it('renders "Sconosciuto" badge for unknown call_type without throwing (Pitfall 5)', () => {
    const weird: CallRecord = {
      id: 'cx',
      call_type: 'XYZ',
      number: '+39000',
      name: null,
      duration_seconds: 10,
      timestamp: 1713500000,
      port: null,
    };
    render(
      <CallHistoryTable
        calls={[weird]}
        loading={false}
        totalCount={1}
        page={0}
        onPageChange={noop}
      />
    );
    expect(screen.getByText('Sconosciuto')).toBeInTheDocument();
  });

  it('formats durations: hh:mm:ss, mm:ss, and em-dash for zero', () => {
    render(
      <CallHistoryTable
        calls={sampleCalls}
        loading={false}
        totalCount={sampleCalls.length}
        page={0}
        onPageChange={noop}
      />
    );
    // 125s → "02:05"
    expect(screen.getByText('02:05')).toBeInTheDocument();
    // 3725s → "1:02:05"
    expect(screen.getByText('1:02:05')).toBeInTheDocument();
    // 0s → em-dash (unique across the table body since other em-dashes would only appear for missing name/port strings, but our sample has explicit null→'—'.)
    const dashes = screen.getAllByText('—');
    // At least one dash for duration_seconds=0 plus nulls for name (c2 has name=null → '—')
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders timestamp with 2024 substring (Pitfall 6 — seconds→ms)', () => {
    render(
      <CallHistoryTable
        calls={sampleCalls}
        loading={false}
        totalCount={sampleCalls.length}
        page={0}
        onPageChange={noop}
      />
    );
    // Any cell containing "2024" proves the *1000 conversion worked.
    expect(screen.getAllByText(/2024/).length).toBeGreaterThan(0);
  });

  it('disables Prev on page 0 and enables Next when more pages exist', () => {
    const handle = jest.fn();
    render(
      <CallHistoryTable
        calls={sampleCalls}
        loading={false}
        totalCount={200}
        page={0}
        onPageChange={handle}
      />
    );

    const prev = screen.getByRole('button', { name: 'Pagina precedente' });
    const next = screen.getByRole('button', { name: 'Pagina successiva' });

    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(handle).toHaveBeenCalledWith(1);
  });

  it('disables Next on the last page', () => {
    render(
      <CallHistoryTable
        calls={sampleCalls}
        loading={false}
        totalCount={10}
        page={0}
        onPageChange={noop}
      />
    );
    // With totalCount=10 and PAGE_SIZE=50, (0+1)*50 >= 10 → Next disabled.
    const next = screen.getByRole('button', { name: 'Pagina successiva' });
    expect(next).toBeDisabled();
  });

  it('renders empty state when totalCount is 0', () => {
    render(
      <CallHistoryTable
        calls={[]}
        loading={false}
        totalCount={0}
        page={0}
        onPageChange={noop}
      />
    );
    expect(screen.getByText('Nessuna chiamata registrata')).toBeInTheDocument();
  });
});
