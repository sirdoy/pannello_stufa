import { render, screen } from '@testing-library/react';
import TamStatusCard from '../TamStatusCard';
import type { TamStatus } from '../../hooks/useFritzTamStatus';

const baseStatus: TamStatus = {
  enabled: true,
  new_messages: 3,
  total_messages: 12,
  is_stale: false,
  fetched_at: '2026-04-22T10:00:00Z',
};

describe('TamStatusCard', () => {
  it('renders enabled state with "Attiva", new messages, and totals', () => {
    render(<TamStatusCard status={baseStatus} loading={false} stale={false} />);

    expect(screen.getByText('Segreteria')).toBeInTheDocument();
    expect(screen.getByText('Attiva')).toBeInTheDocument();
    expect(screen.getByText('Nuovi messaggi')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Totale')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders disabled state with "Disattiva" label', () => {
    render(
      <TamStatusCard
        status={{ ...baseStatus, enabled: false }}
        loading={false}
        stale={false}
      />
    );
    expect(screen.getByText('Disattiva')).toBeInTheDocument();
  });

  it('renders "Dati non aggiornati" banner when is_stale=true', () => {
    render(
      <TamStatusCard
        status={{ ...baseStatus, is_stale: true }}
        loading={false}
        stale={false}
      />
    );
    expect(screen.getByText('Dati non aggiornati')).toBeInTheDocument();
  });

  it('renders error state with "Impossibile caricare la segreteria"', () => {
    render(
      <TamStatusCard
        status={null}
        loading={false}
        stale={false}
        error={new Error('network')}
      />
    );
    expect(screen.getByText('Impossibile caricare la segreteria')).toBeInTheDocument();
  });

  it('renders Skeleton on initial load when no status is present', () => {
    const { container } = render(
      <TamStatusCard status={null} loading={true} stale={false} />
    );
    // Skeleton primitive renders a div with skeleton-related classes.
    const skeleton = container.querySelector('[class*="h-[160px]"]');
    expect(skeleton).not.toBeNull();
  });
});
