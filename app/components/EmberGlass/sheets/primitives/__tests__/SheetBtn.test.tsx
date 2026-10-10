import { fireEvent, render, screen } from '@testing-library/react';
import { Calendar } from 'lucide-react';
import { SheetBtn } from '../SheetBtn';

describe('SheetBtn (CONTEXT D-14)', () => {
  test('renders button with data-component=sheet-btn AND slugged data-testid', () => {
    render(<SheetBtn Icon={Calendar} label="Orari" />);
    const btn = screen.getByTestId('sheet-btn-orari');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('data-component', 'sheet-btn');
  });

  test('renders given Icon component AND label text', () => {
    const { container } = render(<SheetBtn Icon={Calendar} label="Manutenzione" />);
    expect(screen.getByTestId('sheet-btn-manutenzione')).toHaveTextContent('Manutenzione');
    // Lucide icon renders as <svg>
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('clicking fires onClick callback', () => {
    const onClick = jest.fn();
    render(<SheetBtn Icon={Calendar} label="Orari" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('sheet-btn-orari'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('button carries data-sheet-focusable=true', () => {
    render(<SheetBtn Icon={Calendar} label="Orari" />);
    expect(screen.getByTestId('sheet-btn-orari')).toHaveAttribute('data-sheet-focusable', 'true');
  });
});

describe('SheetBtn pending (ROADMAP M80)', () => {
  test('pending swaps the icon for a spinner and blocks the tap', () => {
    const onClick = jest.fn();
    render(<SheetBtn Icon={Calendar} label="Aggiorna" onClick={onClick} pending />);
    const btn = screen.getByTestId('sheet-btn-aggiorna');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('sheet-btn-spinner')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('disabled dims the button without a spinner', () => {
    render(<SheetBtn Icon={Calendar} label="Aggiorna" disabled />);
    const btn = screen.getByTestId('sheet-btn-aggiorna');
    expect(btn).toBeDisabled();
    expect(btn.style.opacity).toBe('0.55');
    expect(screen.queryByTestId('sheet-btn-spinner')).toBeNull();
  });
});
