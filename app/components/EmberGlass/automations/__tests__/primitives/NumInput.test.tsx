import { render, screen, fireEvent } from '@testing-library/react';
import { NumInput } from '../../primitives/NumInput';

describe('NumInput', () => {
  test('renders an input with the given numeric value', () => {
    render(<NumInput value={42} onChange={jest.fn()} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(42);
  });

  test('renders empty string when value is null', () => {
    render(<NumInput value={null} onChange={jest.fn()} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(null);
  });

  test('empty input + allowNull=true fires onChange(null)', () => {
    const handleChange = jest.fn();
    render(<NumInput value={5} onChange={handleChange} allowNull />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  test('empty input + allowNull=false (default) fires onChange(0)', () => {
    const handleChange = jest.fn();
    render(<NumInput value={5} onChange={handleChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(handleChange).toHaveBeenCalledWith(0);
  });

  test('valid numeric input fires onChange with parsed number', () => {
    const handleChange = jest.fn();
    render(<NumInput value={0} onChange={handleChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '30' } });
    expect(handleChange).toHaveBeenCalledWith(30);
  });

  test('unit prop renders unit label text', () => {
    render(<NumInput value={22} onChange={jest.fn()} unit="°C" />);
    expect(screen.getByText('°C')).toBeInTheDocument();
  });

  test('without unit prop, no unit label is rendered', () => {
    const { container } = render(<NumInput value={10} onChange={jest.fn()} />);
    // Only the input wrapper div + input itself; no span with unit text
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(0);
  });

  test('min attribute is applied to input', () => {
    render(<NumInput value={5} onChange={jest.fn()} min={1} />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '1');
  });

  test('max attribute is applied to input', () => {
    render(<NumInput value={5} onChange={jest.fn()} max={10} />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('max', '10');
  });

  test('aria-label is forwarded to the input', () => {
    render(<NumInput value={5} onChange={jest.fn()} aria-label="Intervallo" />);
    expect(screen.getByRole('spinbutton', { name: 'Intervallo' })).toBeInTheDocument();
  });

  test('applies tabular-nums font-variant-numeric', () => {
    render(<NumInput value={0} onChange={jest.fn()} />);
    expect(screen.getByRole('spinbutton')).toHaveStyle({
      fontVariantNumeric: 'tabular-nums',
    });
  });

  test('height is 38px (spacing contract)', () => {
    render(<NumInput value={0} onChange={jest.fn()} />);
    expect(screen.getByRole('spinbutton')).toHaveStyle({ height: '38px' });
  });
});
