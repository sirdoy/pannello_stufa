import { render, screen, fireEvent } from '@testing-library/react';
import InlineSelect from '../InlineSelect';

describe('InlineSelect', () => {
  it('renders options from data with a placeholder', () => {
    render(
      <InlineSelect
        aria-label="Zona"
        defaultValue=""
        placeholder="Scegli…"
        options={[{ value: 'a', label: 'Sala' }, { value: 'b', label: 'Cucina', disabled: true }]}
      />
    );
    const select = screen.getByRole('combobox', { name: 'Zona' });
    expect(select).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Scegli…' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Sala' })).toBeEnabled();
    expect(screen.getByRole('option', { name: 'Cucina' })).toBeDisabled();
  });

  it('renders children options and reports the change', () => {
    const onChange = jest.fn();
    render(
      <InlineSelect aria-label="Ruolo" value="user" onChange={onChange}>
        <option value="user">Utente</option>
        <option value="admin">Admin</option>
      </InlineSelect>
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Ruolo' }), { target: { value: 'admin' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('applies the size and merges className', () => {
    render(<InlineSelect aria-label="x" size="xs" className="w-full" options={[]} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('h-7', 'w-full');
  });

  it('forwards disabled', () => {
    render(<InlineSelect aria-label="x" disabled options={[]} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
