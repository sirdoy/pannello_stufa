import { fireEvent, render } from '@testing-library/react';
import { InlineToggle } from '../InlineToggle';

describe('InlineToggle (Phase 177 — DASH-04)', () => {
  test('role="switch" with aria-checked matching on prop', () => {
    const onChange = jest.fn();
    const { rerender, getByRole } = render(<InlineToggle on onChange={onChange} />);
    const sw = getByRole('switch');
    expect(sw.getAttribute('aria-checked')).toBe('true');

    rerender(<InlineToggle on={false} onChange={onChange} />);
    expect(getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });

  test('clicking calls onChange exactly once with the click event', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<InlineToggle on={false} onChange={onChange} />);
    const sw = getByTestId('inline-toggle');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledTimes(1);
    // First arg is a synthetic event with a target
    expect(onChange.mock.calls[0]?.[0]).toBeDefined();
  });

  test('thumb left style is 20px when on, 2px when off', () => {
    const onChange = jest.fn();
    const { container, rerender } = render(<InlineToggle on onChange={onChange} />);
    let thumb = container.querySelector('button > div') as HTMLElement;
    expect(thumb.style.left).toBe('20px');

    rerender(<InlineToggle on={false} onChange={onChange} />);
    thumb = container.querySelector('button > div') as HTMLElement;
    expect(thumb.style.left).toBe('2px');
  });

  test('uses Phase 175 cubic-bezier transition curve', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<InlineToggle on onChange={onChange} />);
    const sw = getByTestId('inline-toggle');
    expect(sw.style.transition).toContain('cubic-bezier(.34,1.56,.64,1)');
  });
});

describe('InlineToggle pending (ROADMAP M80)', () => {
  test('pending shows a spinner in the thumb and marks the switch busy', () => {
    const { getByRole, getByTestId, queryByTestId, rerender } = render(
      <InlineToggle on onChange={jest.fn()} pending />,
    );
    const sw = getByRole('switch');
    expect(sw).toHaveAttribute('aria-busy', 'true');
    expect(sw).toHaveAttribute('aria-disabled', 'true');
    expect(getByTestId('inline-toggle-spinner')).toBeInTheDocument();

    rerender(<InlineToggle on onChange={jest.fn()} />);
    expect(queryByTestId('inline-toggle-spinner')).toBeNull();
    expect(getByRole('switch')).not.toHaveAttribute('aria-busy');
  });

  test('a tap while pending is swallowed: no onChange, no click on the parent', () => {
    const onChange = jest.fn();
    const onParentClick = jest.fn();
    const { getByRole } = render(
      <div onClick={onParentClick}>
        <InlineToggle on onChange={onChange} pending />
      </div>,
    );
    fireEvent.click(getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  test('disabled dims the switch and blocks the tap', () => {
    const onChange = jest.fn();
    const { getByRole } = render(<InlineToggle on onChange={onChange} disabled />);
    const sw = getByRole('switch');
    expect(sw).toBeDisabled();
    expect(sw.style.opacity).toBe('0.45');
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });
});
