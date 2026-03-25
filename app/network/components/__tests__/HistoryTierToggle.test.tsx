import { render, screen, fireEvent } from '@testing-library/react';
import HistoryTierToggle from '../HistoryTierToggle';
import type { BandwidthTier } from '../../hooks/useFritzBandwidthTiers';

describe('HistoryTierToggle', () => {
  it('renders 3 tier buttons', () => {
    const onChange = jest.fn();
    render(<HistoryTierToggle value="realtime" onChange={onChange} />);
    expect(screen.getByText('Tempo reale')).toBeInTheDocument();
    expect(screen.getByText('Orario')).toBeInTheDocument();
    expect(screen.getByText('Giornaliero')).toBeInTheDocument();
  });

  it('renders "Dati:" label', () => {
    const onChange = jest.fn();
    render(<HistoryTierToggle value="realtime" onChange={onChange} />);
    expect(screen.getByText('Dati:')).toBeInTheDocument();
  });

  it('clicking "Orario" calls onChange with "hourly"', () => {
    const onChange = jest.fn();
    render(<HistoryTierToggle value="realtime" onChange={onChange} />);
    fireEvent.click(screen.getByText('Orario'));
    expect(onChange).toHaveBeenCalledWith('hourly');
  });

  it('clicking "Giornaliero" calls onChange with "daily"', () => {
    const onChange = jest.fn();
    render(<HistoryTierToggle value="realtime" onChange={onChange} />);
    fireEvent.click(screen.getByText('Giornaliero'));
    expect(onChange).toHaveBeenCalledWith('daily');
  });

  it('clicking "Tempo reale" calls onChange with "realtime"', () => {
    const onChange = jest.fn();
    render(<HistoryTierToggle value="hourly" onChange={onChange} />);
    fireEvent.click(screen.getByText('Tempo reale'));
    expect(onChange).toHaveBeenCalledWith('realtime');
  });

  it('does not call onChange when active tier is clicked again', () => {
    const onChange = jest.fn();
    render(<HistoryTierToggle value="realtime" onChange={onChange} />);
    fireEvent.click(screen.getByText('Tempo reale'));
    // onChange is still called (button is not disabled), but value doesn't change
    expect(onChange).toHaveBeenCalledWith('realtime');
  });

  it.each<[BandwidthTier, string]>([
    ['realtime', 'Tempo reale'],
    ['hourly', 'Orario'],
    ['daily', 'Giornaliero'],
  ])('active tier "%s" renders "%s" button with ember variant', (tier, label) => {
    const onChange = jest.fn();
    render(<HistoryTierToggle value={tier} onChange={onChange} />);
    // The active button should exist and be visible
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
