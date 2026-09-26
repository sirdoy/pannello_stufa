/**
 * HistorySection — execution log of a rule (GET /api/v1/automations/{id}/history).
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { HistorySection } from '../../sections/HistorySection';
import type { AutomationExecution } from '@/types/automations';

function execution(overrides: Partial<AutomationExecution>): AutomationExecution {
  return {
    id: 1,
    rule_id: 7,
    triggered_at: 1771113600,
    status: 'success',
    trigger_snapshot: null,
    error_message: null,
    trigger_source: 'auto',
    ...overrides,
  };
}

type Page = { items: AutomationExecution[]; total_count: number };

/** Responds by `offset` (StrictMode mounts effects twice); fails while `state.failing`. */
function mockHistory(pagesByOffset: Record<number, Page>, state = { failing: false }) {
  const fetchMock = jest.fn(async (url: string) => {
    if (state.failing) return { ok: false, json: async () => ({}) };
    const offset = Number(new URL(url, 'http://x').searchParams.get('offset'));
    return { ok: true, json: async () => ({ success: true, ...pagesByOffset[offset] }) };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('HistorySection', () => {
  it('fetches the first page of the rule history', async () => {
    const fetchMock = mockHistory({ 0: { items: [], total_count: 0 } });
    render(<HistorySection ruleId={7} />);
    await screen.findByText('Nessuna esecuzione registrata.');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/automations/7/history?limit=20&offset=0');
  });

  it('renders rows with Italian status, manual source and error message', async () => {
    mockHistory({ 0: {
      items: [
        execution({ id: 3, status: 'failure', error_message: 'Stufa non raggiungibile' }),
        execution({ id: 2, status: 'condition_not_met' }),
        execution({ id: 1, status: 'success', trigger_source: 'manual' }),
      ],
      total_count: 3,
    } });
    render(<HistorySection ruleId={7} />);

    expect(await screen.findAllByTestId('automation-history-row')).toHaveLength(3);
    expect(screen.getByText('3 esecuzioni, dalla più recente.')).toBeInTheDocument();
    expect(screen.getByText('Fallita')).toBeInTheDocument();
    expect(screen.getByText('Stufa non raggiungibile')).toBeInTheDocument();
    expect(screen.getByText('Condizione non soddisfatta')).toBeInTheDocument();
    expect(screen.getByText('Completata')).toBeInTheDocument();
    expect(screen.getByText('manuale')).toBeInTheDocument();
    expect(screen.queryByText('Carica altre')).toBeNull();
  });

  it('"Carica altre" appends the next page', async () => {
    const fetchMock = mockHistory({
      0: { items: [execution({ id: 2 })], total_count: 2 },
      1: { items: [execution({ id: 1, status: 'skipped' })], total_count: 2 },
    });
    render(<HistorySection ruleId={7} />);
    fireEvent.click(await screen.findByText('Carica altre'));

    await waitFor(() => expect(screen.getAllByTestId('automation-history-row')).toHaveLength(2));
    expect(fetchMock).toHaveBeenLastCalledWith('/api/v1/automations/7/history?limit=20&offset=1');
    expect(screen.getByText('Saltata')).toBeInTheDocument();
    expect(screen.queryByText('Carica altre')).toBeNull();
  });

  it('shows the error with a retry that refetches', async () => {
    const state = { failing: true };
    const fetchMock = mockHistory({ 0: { items: [execution({})], total_count: 1 } }, state);
    render(<HistorySection ruleId={7} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Errore nel caricamento dello storico');

    const callsBeforeRetry = fetchMock.mock.calls.length;
    state.failing = false;
    fireEvent.click(screen.getByText('Riprova'));
    expect(await screen.findAllByTestId('automation-history-row')).toHaveLength(1);
    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
  });
});
