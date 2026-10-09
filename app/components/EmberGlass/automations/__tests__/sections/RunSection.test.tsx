/**
 * RunSection — "Prova" (POST /evaluate) and "Esegui ora" (POST /trigger) of a saved rule.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RunSection } from '../../sections/RunSection';

function mockPost(body: unknown, ok = true) {
  const fetchMock = jest.fn(async () => ({ ok, json: async () => body }));
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const evaluateBody = {
  success: true,
  rule_id: 7,
  matched: false,
  trace: {
    type: 'and',
    matched: false,
    detail: null,
    children: [
      { type: 'time_window', matched: true, detail: '22:00 <= 22:30 < 06:00', children: [] },
      { type: 'sensor_threshold', matched: false, detail: 'salon 19.2 >= 20.0', children: [] },
      { type: 'device_state', matched: false, detail: 'not evaluated (short-circuit)', children: [] },
    ],
  },
};

const triggerBody = {
  success: true,
  execution_id: 128,
  rule_id: 7,
  trigger_source: 'manual',
  status: 'partial_failure',
  triggered_at: 1771200000,
  triggered_by: 'nextjs-frontend',
  action_results: [
    { index: 0, action_type: 'hue_light', success: true, error: null },
    { index: 1, action_type: 'http_webhook', success: false, error: 'HTTPError: 500' },
  ],
};

function renderSection(props: Partial<Parameters<typeof RunSection>[0]> = {}) {
  return render(<RunSection ruleId={7} ruleName="Buongiorno" isDirty={false} {...props} />);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RunSection', () => {
  it('dry-runs the conditions and shows the trace', async () => {
    const fetchMock = mockPost(evaluateBody);
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Prova' }));

    expect(await screen.findByText('Condizioni non soddisfatte adesso')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/automations/7/evaluate', { method: 'POST' });
    const rows = screen.getAllByTestId('automation-trace-row');
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent('Tutte (AND) · falsa');
    expect(rows[1]).toHaveTextContent('Fascia oraria · vera');
    expect(rows[1]).toHaveTextContent('22:00 <= 22:30 < 06:00');
    expect(rows[2]).toHaveTextContent('Soglia sensore · falsa');
    expect(rows[3]).toHaveTextContent('Sensore o dispositivo · non valutata');
    expect(rows[3]).not.toHaveTextContent('short-circuit');
  });

  it('reports satisfied conditions', async () => {
    mockPost({ ...evaluateBody, matched: true, trace: { type: 'always_true', matched: true, children: [] } });
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Prova' }));
    expect(await screen.findByText('Condizioni soddisfatte adesso')).toBeInTheDocument();
  });

  it('asks before running the actions and does nothing on cancel', async () => {
    const fetchMock = mockPost(triggerBody);
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Esegui ora' }));
    expect(await screen.findByText('Eseguire ora "Buongiorno"?')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('confirmation-cancel'));

    await waitFor(() => expect(screen.queryByTestId('confirmation-confirm')).not.toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('runs the actions after the confirmation and lists each outcome', async () => {
    const fetchMock = mockPost(triggerBody);
    const onTriggered = jest.fn();
    renderSection({ onTriggered });

    fireEvent.click(screen.getByRole('button', { name: 'Esegui ora' }));
    fireEvent.click(await screen.findByTestId('confirmation-confirm'));

    expect(await screen.findByText('Eseguita in parte')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/automations/7/trigger', { method: 'POST' });
    const rows = screen.getAllByTestId('automation-action-result');
    expect(rows[0]).toHaveTextContent('Luce singola · riuscita');
    expect(rows[1]).toHaveTextContent('Webhook HTTP · fallita');
    expect(rows[1]).toHaveTextContent('HTTPError: 500');
    expect(onTriggered).toHaveBeenCalledTimes(1);
  });

  it('shows an error when the request fails', async () => {
    mockPost({}, false);
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Prova' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Errore nella prova delle condizioni');
  });

  it('is disabled while the editor has unsaved changes', () => {
    const fetchMock = mockPost(evaluateBody);
    renderSection({ isDirty: true });

    expect(screen.getByRole('button', { name: 'Prova' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Esegui ora' })).toBeDisabled();
    expect(screen.getByText(/Salva le modifiche/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
