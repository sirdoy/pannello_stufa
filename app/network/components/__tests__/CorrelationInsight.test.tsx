import { render, screen } from '@testing-library/react';
import CorrelationInsight from '../CorrelationInsight';
import type { CorrelationInsight as CorrelationInsightType } from '@/app/components/devices/network/types';

describe('CorrelationInsight', () => {
  const mockInsight: CorrelationInsightType = {
    coefficient: 0.85,
    level: 'strong-positive',
    description: 'Correlazione forte positiva: la banda aumenta con la potenza della stufa',
    dataPointCount: 120,
    activeHours: 1.0,
  };

  it('returns null when insight is null', () => {
    const { container } = render(
      <CorrelationInsight insight={null} status="ready" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when status is not ready', () => {
    const { container } = render(
      <CorrelationInsight insight={mockInsight} status="collecting" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows insight description text', () => {
    render(
      <CorrelationInsight insight={mockInsight} status="ready" />
    );

    expect(screen.getByText(mockInsight.description)).toBeInTheDocument();
  });

  it('shows Pearson coefficient formatted to 2 decimal places', () => {
    render(
      <CorrelationInsight insight={mockInsight} status="ready" />
    );

    expect(screen.getByText('Coefficiente di Pearson: 0.85')).toBeInTheDocument();
  });

  it('shows data point count and active hours', () => {
    render(
      <CorrelationInsight insight={mockInsight} status="ready" />
    );

    expect(screen.getByText('Calcolato su 120 misurazioni (1.0h di stufa attiva)')).toBeInTheDocument();
  });

  it('formats active hours to 1 decimal place', () => {
    const insightWithDecimalHours: CorrelationInsightType = {
      ...mockInsight,
      activeHours: 2.567,
    };

    render(
      <CorrelationInsight insight={insightWithDecimalHours} status="ready" />
    );

    expect(screen.getByText('Calcolato su 120 misurazioni (2.6h di stufa attiva)')).toBeInTheDocument();
  });

  it('applies emerald color for positive correlations', () => {
    render(
      <CorrelationInsight insight={mockInsight} status="ready" />
    );

    const descriptionElement = screen.getByText(mockInsight.description);
    expect(descriptionElement).toHaveClass('text-emerald-400');
  });

  it('applies ember color for negative correlations', () => {
    const negativeInsight: CorrelationInsightType = {
      coefficient: -0.75,
      level: 'strong-negative',
      description: "Correlazione forte negativa: la banda diminuisce con l'aumento della potenza",
      dataPointCount: 100,
      activeHours: 0.8,
    };

    render(
      <CorrelationInsight insight={negativeInsight} status="ready" />
    );

    const descriptionElement = screen.getByText(negativeInsight.description);
    expect(descriptionElement).toHaveClass('text-ember-500');
  });

  it('applies slate color for no correlation', () => {
    const noCorrelationInsight: CorrelationInsightType = {
      coefficient: 0.1,
      level: 'none',
      description: 'Nessuna correlazione significativa tra banda e riscaldamento',
      dataPointCount: 90,
      activeHours: 0.75,
    };

    render(
      <CorrelationInsight insight={noCorrelationInsight} status="ready" />
    );

    const descriptionElement = screen.getByText(noCorrelationInsight.description);
    expect(descriptionElement).toHaveClass('text-slate-400');
  });
});
