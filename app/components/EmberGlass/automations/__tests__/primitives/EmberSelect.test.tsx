/**
 * EmberSelect tests — Phase 180.1
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmberSelect } from '../../primitives/EmberSelect';

describe('EmberSelect', () => {
  const opts = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];

  it('renders one option per entry plus optional placeholder', () => {
    render(
      <EmberSelect value="" onChange={() => {}} options={opts} placeholder="Scegli" aria-label="Test" />,
    );
    const select = screen.getByLabelText('Test');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Scegli');
    expect(options[0]).toBeDisabled();
    expect(options[1]).toHaveTextContent('Alpha');
    expect(options[2]).toHaveTextContent('Beta');
  });

  it('forwards selected value to onChange', () => {
    const onChange = jest.fn();
    render(<EmberSelect value="a" onChange={onChange} options={opts} aria-label="Test" />);
    fireEvent.change(screen.getByLabelText('Test'), { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders disabled when disabled=true', () => {
    render(<EmberSelect value="" onChange={() => {}} options={opts} disabled aria-label="Test" />);
    expect(screen.getByLabelText('Test')).toBeDisabled();
  });
});
