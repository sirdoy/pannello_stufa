/**
 * Scheduler editor while stove climate control is on (workspace ROADMAP D25):
 * a slot only says when the stove is on, power and fan are not shown or asked.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import AddIntervalModal from '../AddIntervalModal';
import ScheduleInterval from '../ScheduleInterval';
import WeeklySummaryCard from '../WeeklySummaryCard';
import WeeklyTimeline from '../WeeklyTimeline';

const SLOT = { start: '06:30', end: '23:00', power: 4, fan: 5 };

describe('AddIntervalModal', () => {
  const onConfirm = jest.fn();
  const base = { isOpen: true, day: 'Sabato', onConfirm, onCancel: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('asks for power and fan when climate control is off', () => {
    render(<AddIntervalModal {...base} />);

    expect(screen.getByText('Potenza')).toBeInTheDocument();
    expect(screen.getByText('Ventola')).toBeInTheDocument();
    expect(screen.queryByText(/le decide il clima/)).not.toBeInTheDocument();
  });

  it('asks only for the time range and saves a new slot with the fallback levels', () => {
    render(<AddIntervalModal {...base} suggestedStart="08:00" climateLevels={{ power: 2, fan: 3 }} />);

    expect(screen.queryByText('Potenza')).not.toBeInTheDocument();
    expect(screen.queryByText('Ventola')).not.toBeInTheDocument();
    expect(screen.getByText(/le decide il clima/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi Intervallo' }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ start: '08:00', power: 2, fan: 3 }));
  });

  it('keeps the levels of an edited slot', () => {
    render(<AddIntervalModal {...base} mode="edit" initialInterval={SLOT} climateLevels={{ power: 2, fan: 3 }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salva Modifiche' }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ start: '06:30', end: '23:00', power: 4, fan: 5 }));
  });
});

describe('slot views', () => {
  it('ScheduleInterval shows the levels only when climate control is off', () => {
    const { rerender } = render(<ScheduleInterval range={SLOT} onRemove={jest.fn()} />);
    expect(screen.getByText('P4')).toBeInTheDocument();
    expect(screen.getByText('V5')).toBeInTheDocument();

    rerender(<ScheduleInterval range={SLOT} onRemove={jest.fn()} hideLevels />);
    expect(screen.getByText('06:30 - 23:00')).toBeInTheDocument();
    expect(screen.queryByText('P4')).not.toBeInTheDocument();
    expect(screen.queryByText('V5')).not.toBeInTheDocument();
  });

  it('WeeklySummaryCard drops the power distribution', () => {
    const schedule = { Sabato: [SLOT] };
    const { rerender } = render(<WeeklySummaryCard schedule={schedule} />);
    expect(screen.getByText('Distribuzione Potenza')).toBeInTheDocument();

    rerender(<WeeklySummaryCard schedule={schedule} hideLevels />);
    expect(screen.queryByText('Distribuzione Potenza')).not.toBeInTheDocument();
    expect(screen.getByText('Ore totali')).toBeInTheDocument();
  });

  it('WeeklyTimeline names a slot by its time range only', () => {
    const schedule = { Sabato: [SLOT] };
    const { rerender } = render(<WeeklyTimeline schedule={schedule} selectedDay="Sabato" onSelectDay={jest.fn()} />);
    expect(screen.getByLabelText('Intervallo 06:30 - 23:00, potenza 4, ventola 5')).toBeInTheDocument();

    rerender(<WeeklyTimeline schedule={schedule} selectedDay="Sabato" onSelectDay={jest.fn()} hideLevels />);
    expect(screen.getByLabelText('Intervallo 06:30 - 23:00')).toBeInTheDocument();
  });
});
