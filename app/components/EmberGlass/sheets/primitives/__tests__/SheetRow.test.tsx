import { render, screen } from '@testing-library/react';
import { SheetRow } from '../SheetRow';

describe('SheetRow (CONTEXT D-10)', () => {
  test('renders sheet-row + sheet-row-label with given label', () => {
    render(<SheetRow label="Livello fiamma" />);
    expect(screen.getByTestId('sheet-row')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-row-label')).toHaveTextContent('Livello fiamma');
  });

  test('renders sheet-row-value when value prop is set', () => {
    render(<SheetRow label="Tipo" value="Riscaldamento" />);
    expect(screen.getByTestId('sheet-row-value')).toHaveTextContent('Riscaldamento');
  });

  test('does NOT render sheet-row-value when value prop is undefined', () => {
    render(<SheetRow label="Ventola" />);
    expect(screen.queryByTestId('sheet-row-value')).not.toBeInTheDocument();
  });

  test('renders children prop as right-slot child', () => {
    render(
      <SheetRow label="Stato">
        <span data-testid="custom-right-slot">SLOT</span>
      </SheetRow>,
    );
    expect(screen.getByTestId('custom-right-slot')).toHaveTextContent('SLOT');
  });
});
