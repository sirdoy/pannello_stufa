/**
 * DeviceIdField tests — Phase 180.1
 *
 * Verifies the loading/error/empty fallback contract: the component renders a
 * disabled select while loading, falls back to TextInput on fetch error, on
 * empty option lists, and when the current value isn't in the list (so users
 * editing a rule whose target was removed can still see/change the raw ID).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceIdField } from '../../primitives/DeviceIdField';

describe('DeviceIdField', () => {
  const opts = [
    { value: '1', label: 'Soggiorno' },
    { value: '2', label: 'Cucina' },
  ];

  it('renders a disabled select while loading', () => {
    render(
      <DeviceIdField
        value=""
        onChange={() => {}}
        options={[]}
        loading
        error={null}
        aria-label="Luce"
      />,
    );
    const select = screen.getByLabelText('Luce');
    expect(select).toBeDisabled();
    expect(select).toHaveValue('');
  });

  it('renders a select with options when data is loaded and value matches', () => {
    render(
      <DeviceIdField
        value="1"
        onChange={() => {}}
        options={opts}
        loading={false}
        error={null}
        aria-label="Luce"
      />,
    );
    const select = screen.getByLabelText('Luce') as HTMLSelectElement;
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveValue('1');
  });

  it('falls back to TextInput when fetch errored', () => {
    render(
      <DeviceIdField
        value="abc"
        onChange={() => {}}
        options={[]}
        loading={false}
        error="boom"
        aria-label="Luce"
      />,
    );
    const input = screen.getByLabelText('Luce');
    expect(input.tagName).toBe('INPUT');
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it('falls back to TextInput when option list is empty', () => {
    render(
      <DeviceIdField
        value=""
        onChange={() => {}}
        options={[]}
        loading={false}
        error={null}
        aria-label="Luce"
      />,
    );
    const input = screen.getByLabelText('Luce');
    expect(input.tagName).toBe('INPUT');
    expect(screen.getByText(/Nessun dispositivo/)).toBeInTheDocument();
  });

  it('falls back to TextInput when current value is not in the option list', () => {
    render(
      <DeviceIdField
        value="orphan-id"
        onChange={() => {}}
        options={opts}
        loading={false}
        error={null}
        aria-label="Luce"
      />,
    );
    const input = screen.getByLabelText('Luce') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveValue('orphan-id');
    expect(screen.getByText(/ID non trovato/)).toBeInTheDocument();
  });

  it('forwards select changes to onChange', () => {
    const onChange = jest.fn();
    render(
      <DeviceIdField
        value="1"
        onChange={onChange}
        options={opts}
        loading={false}
        error={null}
        aria-label="Luce"
      />,
    );
    fireEvent.change(screen.getByLabelText('Luce'), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith('2');
  });
});
