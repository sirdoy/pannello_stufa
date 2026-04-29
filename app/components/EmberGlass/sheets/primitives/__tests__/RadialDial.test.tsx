import { fireEvent, render, screen } from '@testing-library/react';
import { RadialDial } from '../RadialDial';

describe('RadialDial (CONTEXT D-13)', () => {
  test('renders required testids', () => {
    render(
      <RadialDial
        value={20}
        min={5}
        max={30}
        color="#ff7a00"
        label="Comfort"
        onChange={() => undefined}
      />,
    );
    expect(screen.getByTestId('radial-dial')).toBeInTheDocument();
    expect(screen.getByTestId('radial-dial-value')).toBeInTheDocument();
    expect(screen.getByTestId('radial-dial-label')).toBeInTheDocument();
    expect(screen.getByTestId('radial-dial-minus')).toBeInTheDocument();
    expect(screen.getByTestId('radial-dial-plus')).toBeInTheDocument();
  });

  test('value display matches value prop', () => {
    render(
      <RadialDial
        value={22}
        min={5}
        max={30}
        color="#ff7a00"
        label="Comfort"
        onChange={() => undefined}
      />,
    );
    expect(screen.getByTestId('radial-dial-value')).toHaveTextContent('22');
  });

  test('label matches label prop', () => {
    render(
      <RadialDial
        value={22}
        min={5}
        max={30}
        color="#ff7a00"
        label="Comfort"
        onChange={() => undefined}
      />,
    );
    expect(screen.getByTestId('radial-dial-label')).toHaveTextContent('Comfort');
  });

  test('clicking minus emits value - 1; clamps at min', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <RadialDial
        value={20}
        min={5}
        max={30}
        color="#ff7a00"
        label="Comfort"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByTestId('radial-dial-minus'));
    expect(onChange).toHaveBeenCalledWith(19);

    onChange.mockClear();
    rerender(
      <RadialDial
        value={5}
        min={5}
        max={30}
        color="#ff7a00"
        label="Comfort"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByTestId('radial-dial-minus'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  test('clicking plus emits value + 1; clamps at max', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <RadialDial
        value={20}
        min={5}
        max={30}
        color="#ff7a00"
        label="Comfort"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByTestId('radial-dial-plus'));
    expect(onChange).toHaveBeenCalledWith(21);

    onChange.mockClear();
    rerender(
      <RadialDial
        value={30}
        min={5}
        max={30}
        color="#ff7a00"
        label="Comfort"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByTestId('radial-dial-plus'));
    expect(onChange).toHaveBeenCalledWith(30);
  });

  test('SVG contains 2 circles; filled arc stroke matches color prop', () => {
    const { container } = render(
      <RadialDial
        value={22}
        min={5}
        max={30}
        color="#ff7a00"
        label="Comfort"
        onChange={() => undefined}
      />,
    );
    const circles = container.querySelectorAll('svg circle');
    expect(circles.length).toBe(2);
    // Second circle is the foreground filled arc, stroke = color prop.
    expect(circles[1]?.getAttribute('stroke')).toBe('#ff7a00');
  });

  test('± buttons carry aria-label + data-sheet-focusable', () => {
    render(
      <RadialDial
        value={22}
        min={5}
        max={30}
        color="#ff7a00"
        label="Comfort"
        onChange={() => undefined}
      />,
    );
    expect(screen.getByTestId('radial-dial-minus')).toHaveAttribute(
      'aria-label',
      'Diminuisci temperatura',
    );
    expect(screen.getByTestId('radial-dial-plus')).toHaveAttribute(
      'aria-label',
      'Aumenta temperatura',
    );
    expect(screen.getByTestId('radial-dial-minus')).toHaveAttribute(
      'data-sheet-focusable',
      'true',
    );
    expect(screen.getByTestId('radial-dial-plus')).toHaveAttribute(
      'data-sheet-focusable',
      'true',
    );
  });
});
