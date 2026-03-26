import { render, screen } from '@testing-library/react';
import BudgetStatsCard from '../BudgetStatsCard';
import type { BudgetStats } from '../../hooks/useFritzBudgetStats';

const mockBudgetStats: BudgetStats = {
  window_seconds: 3600,
  current_window_requests: 42,
  soft_limit: 100,
  hard_limit: 200,
  total_lifetime_requests: 5000,
  warning_count: 3,
  utilization_percent: 45.5,
  status: 'ok',
  message: 'Budget OK — 42 richieste nella finestra corrente',
};

describe('BudgetStatsCard', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(
      <BudgetStatsCard data={null} loading={true} error={false} />,
    );
    expect(container.querySelector('[class*="animate"]')).toBeInTheDocument();
  });

  it('returns null when data is null and not loading', () => {
    const { container } = render(
      <BudgetStatsCard data={null} loading={false} error={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when error is true', () => {
    const { container } = render(
      <BudgetStatsCard data={null} loading={false} error={true} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders utilization percentage', () => {
    render(<BudgetStatsCard data={mockBudgetStats} loading={false} error={false} />);
    expect(screen.getByText('45.5%')).toBeInTheDocument();
  });

  it('renders "OK" badge for status ok', () => {
    render(<BudgetStatsCard data={mockBudgetStats} loading={false} error={false} />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders "Attenzione" badge for status warning', () => {
    const warningStats = { ...mockBudgetStats, status: 'warning' as const, utilization_percent: 75.0 };
    render(<BudgetStatsCard data={warningStats} loading={false} error={false} />);
    expect(screen.getByText('Attenzione')).toBeInTheDocument();
  });

  it('renders "Critico" badge for status danger', () => {
    const dangerStats = { ...mockBudgetStats, status: 'danger' as const, utilization_percent: 95.0 };
    render(<BudgetStatsCard data={dangerStats} loading={false} error={false} />);
    expect(screen.getByText('Critico')).toBeInTheDocument();
  });

  it('renders progress bar div with correct width style', () => {
    const { container } = render(
      <BudgetStatsCard data={mockBudgetStats} loading={false} error={false} />,
    );
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '45.5%' });
  });

  it('caps progress bar width at 100% for over-limit values', () => {
    const overLimitStats = { ...mockBudgetStats, utilization_percent: 150.0 };
    const { container } = render(
      <BudgetStatsCard data={overLimitStats} loading={false} error={false} />,
    );
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('renders status message', () => {
    render(<BudgetStatsCard data={mockBudgetStats} loading={false} error={false} />);
    expect(screen.getByText(mockBudgetStats.message)).toBeInTheDocument();
  });

  it('renders "Budget API" label', () => {
    render(<BudgetStatsCard data={mockBudgetStats} loading={false} error={false} />);
    expect(screen.getByText('Budget API')).toBeInTheDocument();
  });
});
