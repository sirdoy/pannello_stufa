/**
 * /stove/errors — alarm episodes read from the Pi (ROADMAP D22).
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ErrorsPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/stove/errors',
}));

// 2026-10-10 11:14 Europe/Rome: the stove stops for lack of pellets.
const ACTIVE = {
  id: 2,
  error_code: 1,
  error_description: 'Pellet esaurito o braciere da pulire',
  started_at: 1791623672,
  last_seen_at: 1791625472,
  ended_at: null,
  active: true,
};
const ENDED = {
  id: 1,
  error_code: 2,
  error_description: null,
  started_at: 1791500000,
  last_seen_at: 1791503000,
  ended_at: 1791503600,
  active: false,
};

function mockErrors(items: unknown[], ok = true): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 503,
    json: async () => ({ items, total_count: items.length, limit: 200, offset: 0 }),
  });
}

describe('ErrorsPage', () => {
  it('lists the episodes of the backend with state and duration', async () => {
    mockErrors([ACTIVE, ENDED]);
    render(<ErrorsPage />);

    await waitFor(() => expect(screen.getAllByTestId('stove-error-event')).toHaveLength(2));
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/thermorossi/errors?limit=200');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Storico allarmi');

    const [active, ended] = screen.getAllByTestId('stove-error-event');
    expect(active).toHaveTextContent('Pellet esaurito o braciere da pulire');
    expect(active).toHaveTextContent('Attivo');
    expect(active).toHaveTextContent('Ancora attivo');
    expect(active).toHaveTextContent('30 min');
    expect(ended).toHaveTextContent('Allarme con codice 2');
    expect(ended).toHaveTextContent('Rientrato');
    expect(ended).toHaveTextContent('1 h 0 min');
  });

  it('filters active and ended episodes', async () => {
    mockErrors([ACTIVE, ENDED]);
    render(<ErrorsPage />);
    await waitFor(() => expect(screen.getAllByTestId('stove-error-event')).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: 'Attivi (1)' }));
    expect(screen.getAllByTestId('stove-error-event')).toHaveLength(1);
    expect(screen.getByTestId('stove-error-event')).toHaveTextContent('Pellet esaurito');

    fireEvent.click(screen.getByRole('button', { name: 'Rientrati (1)' }));
    expect(screen.getByTestId('stove-error-event')).toHaveTextContent('Allarme con codice 2');
  });

  it('shows the empty state when the stove never reported an alarm', async () => {
    mockErrors([]);
    render(<ErrorsPage />);

    expect(await screen.findByText('Nessun allarme')).toBeInTheDocument();
    expect(screen.getByText('La stufa non ha mai segnalato allarmi.')).toBeInTheDocument();
  });

  it('says so when the history cannot be read', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockErrors([], false);
    render(<ErrorsPage />);

    expect(await screen.findByText('Storico non disponibile')).toBeInTheDocument();
    expect(screen.queryByText('Nessun allarme')).toBeNull();
  });
});
