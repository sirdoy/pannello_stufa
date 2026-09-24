import { render, screen, fireEvent, within } from '@testing-library/react';
import CallHistoryTable, { formatCallDate, getCounterpartNumber } from '../CallHistoryTable';
import type { CallRecord } from '../../hooks/useFritzCallHistory';

// Real backend shape (CallRecordModel, backend/api/models.py): no id/number/timestamp,
// `date` is ISO 8601 local time without timezone.
function makeCall(overrides: Partial<CallRecord> = {}): CallRecord {
  return {
    call_type: 'received',
    call_type_code: 1,
    name: 'Mario',
    caller: '+393331112233',
    called: '0301234567',
    caller_number: '+393331112233',
    called_number: '0301234567',
    date: '2026-02-17T10:30:00',
    duration_seconds: 125,
    device: 'Cucina',
    port: 'FON1',
    ...overrides,
  };
}

const sampleCalls: CallRecord[] = [
  makeCall(),
  makeCall({
    call_type: 'outgoing',
    call_type_code: 3,
    name: null,
    caller: '0301234567',
    called: '+393332223344',
    caller_number: '0301234567',
    called_number: '+393332223344',
    date: '2026-02-16T09:05:00',
    duration_seconds: 3725, // 1:02:05
  }),
  makeCall({
    call_type: 'missed',
    call_type_code: 2,
    name: 'Ignoto',
    caller: '+393339999999',
    caller_number: '+393339999999',
    date: '2026-02-15T20:00:00',
    duration_seconds: null,
  }),
];

function renderTable(calls: CallRecord[], extra: Partial<Parameters<typeof CallHistoryTable>[0]> = {}) {
  return render(
    <CallHistoryTable
      calls={calls}
      loading={false}
      totalCount={calls.length}
      page={0}
      onPageChange={() => {}}
      {...extra}
    />
  );
}

describe('CallHistoryTable', () => {
  it('renders Italian badges for every backend call_type', () => {
    const all: CallRecord[] = [
      makeCall({ call_type: 'received', call_type_code: 1 }),
      makeCall({ call_type: 'missed', call_type_code: 2 }),
      makeCall({ call_type: 'outgoing', call_type_code: 3 }),
      makeCall({ call_type: 'active_received', call_type_code: 9 }),
      makeCall({ call_type: 'rejected', call_type_code: 10 }),
      makeCall({ call_type: 'active_outgoing', call_type_code: 11 }),
    ];
    renderTable(all);

    expect(screen.getByText('Cronologia chiamate')).toBeInTheDocument();
    expect(screen.getByText('Ricevuta')).toBeInTheDocument();
    expect(screen.getByText('Persa')).toBeInTheDocument();
    expect(screen.getByText('In uscita')).toBeInTheDocument();
    expect(screen.getByText('Rifiutata')).toBeInTheDocument();
    expect(screen.getAllByText('In corso')).toHaveLength(2);
    expect(screen.queryByText('Sconosciuto')).not.toBeInTheDocument();
  });

  it('renders "Sconosciuto" badge for unknown call_type without throwing', () => {
    renderTable([makeCall({ call_type: 'XYZ', call_type_code: 99 })]);
    expect(screen.getByText('Sconosciuto')).toBeInTheDocument();
  });

  it('shows caller_number for incoming calls and called_number for outgoing calls', () => {
    renderTable(sampleCalls);
    const rows = screen.getAllByRole('row').slice(1);
    // received → caller_number
    expect(within(rows[0]!).getByText('+393331112233')).toBeInTheDocument();
    // outgoing → called_number (not our own line)
    expect(within(rows[1]!).getByText('+393332223344')).toBeInTheDocument();
    expect(within(rows[1]!).queryByText('0301234567')).not.toBeInTheDocument();
    // missed → caller_number
    expect(within(rows[2]!).getByText('+393339999999')).toBeInTheDocument();
  });

  it('getCounterpartNumber falls back to caller/called, then null', () => {
    expect(
      getCounterpartNumber(makeCall({ caller_number: null, caller: '111' }))
    ).toBe('111');
    expect(
      getCounterpartNumber(
        makeCall({ call_type: 'active_outgoing', called_number: null, called: '222' })
      )
    ).toBe('222');
    expect(
      getCounterpartNumber(makeCall({ call_type: 'rejected', caller_number: null, caller: null }))
    ).toBeNull();
  });

  it('formats durations: hh:mm:ss, mm:ss, and em-dash for null', () => {
    renderTable(sampleCalls);
    expect(screen.getByText('02:05')).toBeInTheDocument();
    expect(screen.getByText('1:02:05')).toBeInTheDocument();
    const rows = screen.getAllByRole('row').slice(1);
    // missed call has duration_seconds=null → em-dash
    expect(within(rows[2]!).getAllByText('—').length).toBeGreaterThanOrEqual(1);
    // outgoing call has name=null → em-dash
    expect(within(rows[1]!).getByText('—')).toBeInTheDocument();
  });

  it('renders the ISO local date (no timezone) as dd MMM yyyy HH:mm', () => {
    renderTable(sampleCalls);
    expect(screen.getByText('17 feb 2026 10:30')).toBeInTheDocument();
    expect(screen.getByText('16 feb 2026 09:05')).toBeInTheDocument();
  });

  it('renders em-dash for null/invalid date without throwing RangeError', () => {
    expect(() =>
      renderTable([
        makeCall({ date: null, name: 'A', duration_seconds: 10 }),
        makeCall({ date: 'garbage', name: 'B', duration_seconds: 10 }),
      ])
    ).not.toThrow();
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]!).getByText('—')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('—')).toBeInTheDocument();
  });

  it('formatCallDate returns null for missing/invalid input', () => {
    expect(formatCallDate(null)).toBeNull();
    expect(formatCallDate(undefined)).toBeNull();
    expect(formatCallDate('not-a-date')).toBeNull();
    expect(formatCallDate('2026-02-17T10:30:00')).toBe('17 feb 2026 10:30');
  });

  it('renders duplicate records (same date/caller) as separate rows', () => {
    renderTable([makeCall(), makeCall()]);
    expect(screen.getAllByRole('row').slice(1)).toHaveLength(2);
  });

  it('disables Prev on page 0 and enables Next when more pages exist', () => {
    const handle = jest.fn();
    renderTable(sampleCalls, { totalCount: 200, onPageChange: handle });

    const prev = screen.getByRole('button', { name: 'Pagina precedente' });
    const next = screen.getByRole('button', { name: 'Pagina successiva' });

    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(handle).toHaveBeenCalledWith(1);
  });

  it('disables Next on the last page', () => {
    renderTable(sampleCalls, { totalCount: 10 });
    expect(screen.getByRole('button', { name: 'Pagina successiva' })).toBeDisabled();
  });

  it('renders empty state when totalCount is 0', () => {
    renderTable([], { totalCount: 0 });
    expect(screen.getByText('Nessuna chiamata registrata')).toBeInTheDocument();
  });
});
