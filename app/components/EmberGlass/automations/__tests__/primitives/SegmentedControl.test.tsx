import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from '../../primitives/SegmentedControl';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
] as const;

describe('SegmentedControl', () => {
  test('renders all options as buttons', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Gamma' })).toBeInTheDocument();
  });

  test('click fires onChange with the clicked option value', () => {
    const handleChange = jest.fn();
    render(<SegmentedControl options={OPTIONS} value="a" onChange={handleChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Beta' }));
    expect(handleChange).toHaveBeenCalledWith('b');
  });

  test('aria-checked is true for the active option', () => {
    render(<SegmentedControl options={OPTIONS} value="b" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute('aria-checked', 'true');
  });

  test('aria-checked is false for inactive options', () => {
    render(<SegmentedControl options={OPTIONS} value="b" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Gamma' })).toHaveAttribute('aria-checked', 'false');
  });

  test('active segment has white color (#fff)', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveStyle({ color: '#fff' });
  });

  test('inactive segments have var(--text-2) color', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveStyle({ color: 'var(--text-2)' });
  });

  test('active segment has highlighted background', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveStyle({
      background: 'rgba(255,255,255,0.12)',
    });
  });

  test('inactive segment has transparent background', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveStyle({
      background: 'transparent',
    });
  });

  test('container has radiogroup role and optional aria-label', () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="a"
        onChange={jest.fn()}
        aria-label="Modalità"
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Modalità' })).toBeInTheDocument();
  });
});
