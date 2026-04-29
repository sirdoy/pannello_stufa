import { fireEvent, render, screen } from '@testing-library/react';
import { Stepper } from '../Stepper';

describe('Stepper (CONTEXT D-11)', () => {
  test('renders ± buttons + value display with required testids', () => {
    render(<Stepper value={3} min={1} max={5} onChange={() => undefined} />);
    expect(screen.getByTestId('stepper')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-minus')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-value')).toHaveTextContent('3');
    expect(screen.getByTestId('stepper-plus')).toBeInTheDocument();
  });

  test('clicking minus emits value - 1', () => {
    const onChange = jest.fn();
    render(<Stepper value={3} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('stepper-minus'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  test('clicking minus at min clamps to min', () => {
    const onChange = jest.fn();
    render(<Stepper value={1} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('stepper-minus'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  test('clicking plus emits value + 1', () => {
    const onChange = jest.fn();
    render(<Stepper value={3} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('stepper-plus'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  test('clicking plus at max clamps to max', () => {
    const onChange = jest.fn();
    render(<Stepper value={5} min={1} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('stepper-plus'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  test('buttons carry aria-label + data-sheet-focusable', () => {
    render(<Stepper value={3} min={1} max={5} onChange={() => undefined} />);
    expect(screen.getByTestId('stepper-minus')).toHaveAttribute('aria-label', 'Diminuisci');
    expect(screen.getByTestId('stepper-plus')).toHaveAttribute('aria-label', 'Aumenta');
    expect(screen.getByTestId('stepper-minus')).toHaveAttribute('data-sheet-focusable', 'true');
    expect(screen.getByTestId('stepper-plus')).toHaveAttribute('data-sheet-focusable', 'true');
  });
});
