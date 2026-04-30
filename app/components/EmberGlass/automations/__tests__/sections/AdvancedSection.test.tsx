/**
 * AdvancedSection test suite — AUTO-06
 *
 * TDD RED phase: tests written before implementation.
 * Covers: Italian copy, both numeric fields, hint text, onChange callbacks.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedSection } from '../../sections/AdvancedSection';

describe('AdvancedSection (AUTO-06)', () => {
  const defaultProps = {
    minInterval: 0,
    maxPerHour: 0,
    onMinIntervalChange: jest.fn(),
    onMaxPerHourChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders intro copy verbatim', () => {
    render(<AdvancedSection {...defaultProps} />);
    expect(
      screen.getByText(
        'Limita la frequenza di esecuzione per evitare cicli o eccessi di eventi.'
      )
    ).toBeInTheDocument();
  });

  it('renders label "Intervallo minimo fra attivazioni"', () => {
    render(<AdvancedSection {...defaultProps} />);
    expect(screen.getByText('Intervallo minimo fra attivazioni')).toBeInTheDocument();
  });

  it('renders label "Massimo attivazioni/ora"', () => {
    render(<AdvancedSection {...defaultProps} />);
    expect(screen.getByText('Massimo attivazioni/ora')).toBeInTheDocument();
  });

  it('renders hint "0 = nessun limite" for min interval field', () => {
    render(<AdvancedSection {...defaultProps} />);
    expect(screen.getByText('0 = nessun limite')).toBeInTheDocument();
  });

  it('renders hint "0 = illimitato" for max per hour field', () => {
    render(<AdvancedSection {...defaultProps} />);
    expect(screen.getByText('0 = illimitato')).toBeInTheDocument();
  });

  it('calls onMinIntervalChange with new number when min interval input changes', () => {
    const onMinIntervalChange = jest.fn();
    render(
      <AdvancedSection
        {...defaultProps}
        onMinIntervalChange={onMinIntervalChange}
      />
    );
    const input = screen.getByLabelText('Intervallo minimo fra attivazioni');
    fireEvent.change(input, { target: { value: '30' } });
    expect(onMinIntervalChange).toHaveBeenCalledWith(30);
  });

  it('calls onMaxPerHourChange with new number when max per hour input changes', () => {
    const onMaxPerHourChange = jest.fn();
    render(
      <AdvancedSection
        {...defaultProps}
        onMaxPerHourChange={onMaxPerHourChange}
      />
    );
    const input = screen.getByLabelText('Massimo attivazioni per ora');
    fireEvent.change(input, { target: { value: '10' } });
    expect(onMaxPerHourChange).toHaveBeenCalledWith(10);
  });

  it('emits 0 (not null) when min interval input cleared (allowNull=false)', () => {
    const onMinIntervalChange = jest.fn();
    render(
      <AdvancedSection
        {...defaultProps}
        minInterval={30}
        onMinIntervalChange={onMinIntervalChange}
      />
    );
    const input = screen.getByLabelText('Intervallo minimo fra attivazioni');
    fireEvent.change(input, { target: { value: '' } });
    expect(onMinIntervalChange).toHaveBeenCalledWith(0);
  });

  it('renders current values in both inputs', () => {
    render(<AdvancedSection {...defaultProps} minInterval={60} maxPerHour={5} />);
    expect(screen.getByLabelText('Intervallo minimo fra attivazioni')).toHaveValue(60);
    expect(screen.getByLabelText('Massimo attivazioni per ora')).toHaveValue(5);
  });
});
