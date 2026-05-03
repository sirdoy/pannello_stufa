import { fireEvent, render, screen } from '@testing-library/react';
import { BigSlider } from '../BigSlider';

describe('BigSlider (D-09)', () => {
  test('renders input[type=range] with min=0, max=100, value=60', () => {
    render(<BigSlider value={60} onChange={() => undefined} />);
    const input = screen.getByTestId('big-slider-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('range');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
    expect(input.value).toBe('60');
  });

  test('changing range input fires onChange(Number)', () => {
    const onChange = jest.fn();
    render(<BigSlider value={60} onChange={onChange} />);
    const input = screen.getByTestId('big-slider-input');
    fireEvent.change(input, { target: { value: '75' } });
    expect(onChange).toHaveBeenCalledWith(75);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('percentage label displays value%', () => {
    render(<BigSlider value={42} onChange={() => undefined} />);
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  test('default color uses var(--accent) in gradient', () => {
    render(<BigSlider value={60} onChange={() => undefined} />);
    const container = screen.getByTestId('big-slider');
    const fillDiv = container.firstElementChild as HTMLElement;
    const style = fillDiv?.getAttribute('style') ?? '';
    expect(style).toContain('var(--accent)');
  });

  test('custom color appears in gradient', () => {
    render(<BigSlider value={60} onChange={() => undefined} color="#b080ff" />);
    const container = screen.getByTestId('big-slider');
    const fillDiv = container.firstElementChild as HTMLElement;
    const style = fillDiv?.getAttribute('style') ?? '';
    expect(style).toContain('#b080ff');
  });
});
