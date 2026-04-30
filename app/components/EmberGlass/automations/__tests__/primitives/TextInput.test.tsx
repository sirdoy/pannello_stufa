import { render, screen, fireEvent } from '@testing-library/react';
import { TextInput } from '../../primitives/TextInput';

describe('TextInput', () => {
  test('renders an input element with the given value', () => {
    render(<TextInput value="hello" onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  test('onChange fires with the new string value', () => {
    const handleChange = jest.fn();
    render(<TextInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'world' } });
    expect(handleChange).toHaveBeenCalledWith('world');
  });

  test('placeholder is rendered', () => {
    render(<TextInput value="" onChange={jest.fn()} placeholder="Es. Buongiorno" />);
    expect(screen.getByPlaceholderText('Es. Buongiorno')).toBeInTheDocument();
  });

  test('mono prop swaps font family to ui-monospace', () => {
    render(<TextInput value="code" onChange={jest.fn()} mono />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveStyle({ fontFamily: 'ui-monospace, SF Mono, monospace' });
  });

  test('default (non-mono) font family is inherit', () => {
    render(<TextInput value="text" onChange={jest.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveStyle({ fontFamily: 'inherit' });
  });

  test('readOnly prop sets readOnly attribute on input', () => {
    render(<TextInput value="readonly" onChange={jest.fn()} readOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  test('aria-label is applied to the input', () => {
    render(<TextInput value="" onChange={jest.fn()} aria-label="Nome automazione" />);
    expect(screen.getByRole('textbox', { name: 'Nome automazione' })).toBeInTheDocument();
  });

  test('height is 38px (spacing contract)', () => {
    render(<TextInput value="" onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveStyle({ height: '38px' });
  });

  test('border-radius is 9px (spacing contract)', () => {
    render(<TextInput value="" onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveStyle({ borderRadius: '9px' });
  });

  test('background matches spacing contract rgba value', () => {
    render(<TextInput value="" onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveStyle({
      background: 'rgba(255,255,255,0.05)',
    });
  });
});
