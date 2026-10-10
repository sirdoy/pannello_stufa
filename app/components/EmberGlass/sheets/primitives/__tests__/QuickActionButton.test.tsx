import { fireEvent, render, screen } from '@testing-library/react';
import { QuickActionButton } from '../QuickActionButton';

describe('QuickActionButton (CONTEXT D-15)', () => {
  test('renders quick-action-button (via data-component) + slugged data-testid', () => {
    render(<QuickActionButton active={false} onClick={() => undefined} label="Tutte on" />);
    const btn = screen.getByTestId('quick-action-tutte-on');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('data-component', 'quick-action-button');
  });

  test('active=true uses yellow tint background + #f5c84a color', () => {
    render(<QuickActionButton active onClick={() => undefined} label="Tutte on" />);
    const btn = screen.getByTestId('quick-action-tutte-on');
    // jsdom inserts spaces after commas in inline-style serialization; normalize before assert.
    const styleAttr = (btn.getAttribute('style') ?? '').replace(/,\s+/g, ',');
    expect(styleAttr).toContain('rgba(245,200,74,0.18)');
    // jsdom converts hex colors to rgb() form. #f5c84a -> rgb(245,200,74).
    expect(styleAttr).toContain('rgb(245,200,74)');
  });

  test('active=false uses neutral white-04 background + white color', () => {
    render(<QuickActionButton active={false} onClick={() => undefined} label="Tutte off" />);
    const btn = screen.getByTestId('quick-action-tutte-off');
    const styleAttr = (btn.getAttribute('style') ?? '').replace(/,\s+/g, ',');
    expect(styleAttr).toContain('rgba(255,255,255,0.05)');
    expect(styleAttr).toContain('rgb(255,255,255)');
  });

  test('clicking fires onClick', () => {
    const onClick = jest.fn();
    render(<QuickActionButton active={false} onClick={onClick} label="Tutte on" />);
    fireEvent.click(screen.getByTestId('quick-action-tutte-on'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('button carries data-sheet-focusable=true', () => {
    render(<QuickActionButton active={false} onClick={() => undefined} label="Tutte on" />);
    expect(screen.getByTestId('quick-action-tutte-on')).toHaveAttribute(
      'data-sheet-focusable',
      'true',
    );
  });
});

describe('QuickActionButton pending (ROADMAP M80)', () => {
  test('pending shows a spinner, keeps the label in the layout and blocks the tap', () => {
    const onClick = jest.fn();
    render(<QuickActionButton active={false} label="Tutte on" onClick={onClick} pending />);
    const btn = screen.getByTestId('quick-action-tutte-on');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('quick-action-spinner')).toBeInTheDocument();
    expect(screen.getByText('Tutte on').style.opacity).toBe('0');
    expect(btn).toHaveAccessibleName('Tutte on');
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('disabled dims the pill without a spinner', () => {
    render(<QuickActionButton active={false} label="Tutte on" onClick={jest.fn()} disabled />);
    const btn = screen.getByTestId('quick-action-tutte-on');
    expect(btn).toBeDisabled();
    expect(btn.style.opacity).toBe('0.55');
    expect(screen.queryByTestId('quick-action-spinner')).toBeNull();
  });
});
