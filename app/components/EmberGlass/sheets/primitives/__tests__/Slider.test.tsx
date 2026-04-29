import { fireEvent, render, screen } from '@testing-library/react';
import { Slider } from '../Slider';

describe('Slider (CONTEXT D-12)', () => {
  test('renders <input type=range> with min/max/value matching props', () => {
    render(<Slider value={40} min={0} max={100} onChange={() => undefined} />);
    const input = screen.getByTestId('slider') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('range');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
    expect(input.value).toBe('40');
  });

  test('changing input value fires onChange(Number(e.target.value))', () => {
    const onChange = jest.fn();
    render(<Slider value={40} min={0} max={100} onChange={onChange} />);
    const input = screen.getByTestId('slider');
    fireEvent.change(input, { target: { value: '50' } });
    expect(onChange).toHaveBeenCalledWith(50);
  });

  test('default color uses var(--accent) in inline background', () => {
    render(<Slider value={40} min={0} max={100} onChange={() => undefined} />);
    const styleAttr = screen.getByTestId('slider').getAttribute('style') ?? '';
    expect(styleAttr).toContain('var(--accent)');
  });

  test('custom color="#b080ff" appears twice in linear-gradient (both filled stops)', () => {
    render(<Slider value={40} min={0} max={100} color="#b080ff" onChange={() => undefined} />);
    const styleAttr = screen.getByTestId('slider').getAttribute('style') ?? '';
    const matches = styleAttr.toLowerCase().match(/#b080ff/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
