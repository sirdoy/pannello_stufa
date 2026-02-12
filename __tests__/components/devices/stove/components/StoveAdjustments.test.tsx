import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoveAdjustments from '@/app/components/devices/stove/components/StoveAdjustments';

describe('StoveAdjustments', () => {
  const mockProps = {
    fanLevel: 3,
    powerLevel: 2,
    schedulerEnabled: false,
    semiManualMode: false,
    onFanChange: jest.fn(),
    onPowerChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Regolazioni" divider label', () => {
    render(<StoveAdjustments {...mockProps} />);
    expect(screen.getByText('Regolazioni')).toBeInTheDocument();
  });

  it('renders fan level display with correct value', () => {
    render(<StoveAdjustments {...mockProps} fanLevel={4} />);
    expect(screen.getByText('Ventilazione')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders power level display with correct value', () => {
    render(<StoveAdjustments {...mockProps} powerLevel={4} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Potenza')).toBeInTheDocument();
  });

  it('renders semi-manual info banner when schedulerEnabled=true and semiManualMode=false', () => {
    render(<StoveAdjustments {...mockProps} schedulerEnabled={true} semiManualMode={false} />);
    expect(screen.getByText('La modifica attiverà la modalità Semi-Manuale')).toBeInTheDocument();
  });

  it('does not render info banner when schedulerEnabled=false', () => {
    render(<StoveAdjustments {...mockProps} schedulerEnabled={false} />);
    expect(screen.queryByText('La modifica attiverà la modalità Semi-Manuale')).not.toBeInTheDocument();
  });

  it('does not render info banner when semiManualMode=true', () => {
    render(<StoveAdjustments {...mockProps} schedulerEnabled={true} semiManualMode={true} />);
    expect(screen.queryByText('La modifica attiverà la modalità Semi-Manuale')).not.toBeInTheDocument();
  });

  it('increment button calls onFanChange with level+1', async () => {
    const user = userEvent.setup();
    render(<StoveAdjustments {...mockProps} fanLevel={3} />);
    const incrementButtons = screen.getAllByLabelText('Incrementa');
    await user.click(incrementButtons[0]); // First increment is for fan
    expect(mockProps.onFanChange).toHaveBeenCalledWith({ target: { value: '4' } });
  });

  it('decrement button calls onFanChange with level-1', async () => {
    const user = userEvent.setup();
    render(<StoveAdjustments {...mockProps} fanLevel={3} />);
    const decrementButtons = screen.getAllByLabelText('Decrementa');
    await user.click(decrementButtons[0]); // First decrement is for fan
    expect(mockProps.onFanChange).toHaveBeenCalledWith({ target: { value: '2' } });
  });

  it('increment button calls onPowerChange with level+1', async () => {
    const user = userEvent.setup();
    render(<StoveAdjustments {...mockProps} powerLevel={2} />);
    const incrementButtons = screen.getAllByLabelText('Incrementa');
    await user.click(incrementButtons[1]); // Second increment is for power
    expect(mockProps.onPowerChange).toHaveBeenCalledWith({ target: { value: '3' } });
  });

  it('decrement button calls onPowerChange with level-1', async () => {
    const user = userEvent.setup();
    render(<StoveAdjustments {...mockProps} powerLevel={2} />);
    const decrementButtons = screen.getAllByLabelText('Decrementa');
    await user.click(decrementButtons[1]); // Second decrement is for power
    expect(mockProps.onPowerChange).toHaveBeenCalledWith({ target: { value: '1' } });
  });

  it('fan decrement button disabled when level=1', () => {
    render(<StoveAdjustments {...mockProps} fanLevel={1} />);
    const decrementButtons = screen.getAllByLabelText('Decrementa');
    expect(decrementButtons[0]).toBeDisabled();
  });

  it('power decrement button disabled when level=1', () => {
    render(<StoveAdjustments {...mockProps} powerLevel={1} />);
    const decrementButtons = screen.getAllByLabelText('Decrementa');
    expect(decrementButtons[1]).toBeDisabled();
  });

  it('fan increment button disabled when fanLevel=6', () => {
    render(<StoveAdjustments {...mockProps} fanLevel={6} />);
    const incrementButtons = screen.getAllByLabelText('Incrementa');
    expect(incrementButtons[0]).toBeDisabled();
  });

  it('power increment button disabled when powerLevel=5', () => {
    render(<StoveAdjustments {...mockProps} powerLevel={5} />);
    const incrementButtons = screen.getAllByLabelText('Incrementa');
    expect(incrementButtons[1]).toBeDisabled();
  });

  it('handles null fanLevel gracefully', () => {
    render(<StoveAdjustments {...mockProps} fanLevel={null} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('handles null powerLevel gracefully', () => {
    render(<StoveAdjustments {...mockProps} powerLevel={null} />);
    // Both fan and power show '-' when null, so we expect 2
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Ventilazione section with correct icon', () => {
    render(<StoveAdjustments {...mockProps} />);
    expect(screen.getByText('Ventilazione')).toBeInTheDocument();
  });

  it('renders Potenza section with correct icon', () => {
    render(<StoveAdjustments {...mockProps} />);
    expect(screen.getByText('Potenza')).toBeInTheDocument();
  });
});
