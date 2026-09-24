import { render, screen } from '@testing-library/react';
import TamStatusCard from '../TamStatusCard';
import type { TamStatus } from '../../hooks/useFritzTamStatus';

// Real backend shape (TamStatusResponse, backend/api/models.py).
const baseStatus: TamStatus = {
  tam: {
    total_messages: 12,
    new_messages: 3,
    tam_enabled: true,
    tam_name: 'Anrufbeantworter',
  },
  is_stale: false,
  fetched_at: '2026-04-22T10:00:00Z',
};

describe('TamStatusCard', () => {
  it('renders enabled state with "Attiva", tam_name, new messages, and totals', () => {
    render(<TamStatusCard status={baseStatus} loading={false} stale={false} />);

    expect(screen.getByText('Segreteria')).toBeInTheDocument();
    expect(screen.getByText('Attiva')).toBeInTheDocument();
    expect(screen.getByText('Anrufbeantworter')).toBeInTheDocument();
    expect(screen.getByText('Nuovi messaggi')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Totale')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/Aggiornato:/)).toBeInTheDocument();
  });

  it('renders disabled state with "Disattiva" when tam_enabled=false', () => {
    render(
      <TamStatusCard
        status={{ ...baseStatus, tam: { ...baseStatus.tam, tam_enabled: false } }}
        loading={false}
        stale={false}
      />
    );
    expect(screen.getByText('Disattiva')).toBeInTheDocument();
  });

  it('omits the TAM name when tam_name is null', () => {
    render(
      <TamStatusCard
        status={{ ...baseStatus, tam: { ...baseStatus.tam, tam_name: null } }}
        loading={false}
        stale={false}
      />
    );
    expect(screen.queryByText('Anrufbeantworter')).not.toBeInTheDocument();
    expect(screen.getByText('Attiva')).toBeInTheDocument();
  });

  it('renders "Dati non aggiornati" banner when is_stale=true', () => {
    render(
      <TamStatusCard status={{ ...baseStatus, is_stale: true }} loading={false} stale={false} />
    );
    expect(screen.getByText('Dati non aggiornati')).toBeInTheDocument();
  });

  it('does not throw on an invalid fetched_at and hides the "Aggiornato" line', () => {
    expect(() =>
      render(
        <TamStatusCard
          status={{ ...baseStatus, fetched_at: 'not-a-date' }}
          loading={false}
          stale={false}
        />
      )
    ).not.toThrow();
    expect(screen.queryByText(/Aggiornato:/)).not.toBeInTheDocument();
    expect(screen.getByText('Attiva')).toBeInTheDocument();
  });

  it('accepts the legacy "+00:00Z" fetched_at format', () => {
    render(
      <TamStatusCard
        status={{ ...baseStatus, fetched_at: '2026-04-22T10:00:00.123456+00:00Z' }}
        loading={false}
        stale={false}
      />
    );
    expect(screen.getByText(/Aggiornato:/)).toBeInTheDocument();
  });

  it('hides the "Aggiornato" line when fetched_at is null', () => {
    render(
      <TamStatusCard status={{ ...baseStatus, fetched_at: null }} loading={false} stale={false} />
    );
    expect(screen.queryByText(/Aggiornato:/)).not.toBeInTheDocument();
  });

  it('renders error state with "Impossibile caricare la segreteria"', () => {
    render(
      <TamStatusCard status={null} loading={false} stale={false} error={new Error('network')} />
    );
    expect(screen.getByText('Impossibile caricare la segreteria')).toBeInTheDocument();
  });

  it('renders Skeleton on initial load when no status is present', () => {
    const { container } = render(<TamStatusCard status={null} loading={true} stale={false} />);
    const skeleton = container.querySelector('[class*="h-[160px]"]');
    expect(skeleton).not.toBeNull();
  });
});
