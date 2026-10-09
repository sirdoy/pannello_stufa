import { render, screen, fireEvent } from '@testing-library/react';
import RangeSlider from '../RangeSlider';

describe('RangeSlider', () => {
  it('renders a range input with bounds and value', () => {
    render(<RangeSlider aria-label="Volume" min={0} max={100} value={40} onChange={() => {}} />);
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveValue('40');
  });

  it('reports the change and the release', () => {
    const onChange = jest.fn();
    const onMouseUp = jest.fn();
    render(<RangeSlider aria-label="Seek" min={0} max={10} value={1} onChange={onChange} onMouseUp={onMouseUp} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '7' } });
    fireEvent.mouseUp(slider);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onMouseUp).toHaveBeenCalledTimes(1);
  });

  it('uses the accent by default and a custom colour on request', () => {
    const { rerender } = render(<RangeSlider aria-label="x" value={1} onChange={() => {}} />);
    expect(screen.getByRole('slider').style.getPropertyValue('--range-color')).toBe('var(--accent)');
    rerender(<RangeSlider aria-label="x" value={1} onChange={() => {}} color="#b080ff" className="flex-1" />);
    const slider = screen.getByRole('slider');
    expect(slider.style.getPropertyValue('--range-color')).toBe('#b080ff');
    expect(slider).toHaveClass('flex-1');
  });

  it('forwards disabled', () => {
    render(<RangeSlider aria-label="x" value={1} onChange={() => {}} disabled />);
    expect(screen.getByRole('slider')).toBeDisabled();
  });
});
