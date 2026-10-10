import { fireEvent, render, screen } from '@testing-library/react';
import { LevelPicker } from '../LevelPicker';

describe('LevelPicker (ROADMAP M77)', () => {
  test('renders one radio per level, the current one checked, and "value di max"', () => {
    render(<LevelPicker label="Ventola" value={3} min={1} max={6} onChange={() => undefined} />);
    expect(screen.getByRole('radiogroup', { name: 'Ventola' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(6);
    expect(screen.getByRole('radio', { name: 'Ventola 3' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Ventola 4' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('level-picker-value')).toHaveTextContent('3 di 6');
  });

  test('tapping a level emits it', () => {
    const onChange = jest.fn();
    render(<LevelPicker label="Potenza" value={2} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('level-picker-option-5'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  test('tapping the current level emits nothing', () => {
    const onChange = jest.fn();
    render(<LevelPicker label="Potenza" value={2} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('level-picker-option-2'));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('pending shows the requested level, pulses it and locks the row', () => {
    const onChange = jest.fn();
    render(<LevelPicker label="Potenza" value={2} min={1} max={5} pending={4} onChange={onChange} />);
    expect(screen.getByTestId('level-picker-value')).toHaveTextContent('4 di 5');
    const requested = screen.getByTestId('level-picker-option-4');
    expect(requested).toHaveAttribute('aria-checked', 'true');
    expect(requested).toHaveClass('animate-pulse');
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
    fireEvent.click(screen.getByTestId('level-picker-option-1'));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('disabled locks every level', () => {
    render(<LevelPicker label="Potenza" value={2} min={1} max={5} disabled onChange={() => undefined} />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });

  test('no reported level: dash, nothing checked, levels still selectable', () => {
    const onChange = jest.fn();
    render(<LevelPicker label="Potenza" value={null} min={1} max={5} onChange={onChange} />);
    expect(screen.getByTestId('level-picker-value')).toHaveTextContent('—');
    expect(screen.queryByRole('radio', { checked: true })).toBeNull();
    fireEvent.click(screen.getByTestId('level-picker-option-1'));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
