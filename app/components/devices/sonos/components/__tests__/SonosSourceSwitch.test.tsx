import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SonosSourceSwitch from '../SonosSourceSwitch';

describe('SonosSourceSwitch', () => {
  const onSwitchSource = jest.fn();

  beforeEach(() => {
    onSwitchSource.mockClear();
  });

  it('renders nothing when role is not soundbar', () => {
    const { container } = render(
      <SonosSourceSwitch uid="RINCON_A" role="speaker" onSwitchSource={onSwitchSource} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when role is sub', () => {
    const { container } = render(
      <SonosSourceSwitch uid="RINCON_A" role="sub" onSwitchSource={onSwitchSource} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders TV and Line-in buttons for soundbar role', () => {
    render(<SonosSourceSwitch uid="RINCON_A" role="soundbar" onSwitchSource={onSwitchSource} />);
    expect(screen.getByLabelText('Sorgente TV')).toBeInTheDocument();
    expect(screen.getByLabelText('Sorgente Line-in')).toBeInTheDocument();
  });

  it('renders TV button with text TV', () => {
    render(<SonosSourceSwitch uid="RINCON_A" role="soundbar" onSwitchSource={onSwitchSource} />);
    expect(screen.getByText('TV')).toBeInTheDocument();
    expect(screen.getByText('Line-in')).toBeInTheDocument();
  });

  it('TV button has amber accent when currentSource is tv', () => {
    render(
      <SonosSourceSwitch uid="RINCON_A" role="soundbar" onSwitchSource={onSwitchSource} currentSource="tv" />
    );
    const tvButton = screen.getByLabelText('Sorgente TV');
    expect(tvButton.className).toContain('bg-amber-500');
  });

  it('Line-in button has amber accent when currentSource is line_in', () => {
    render(
      <SonosSourceSwitch uid="RINCON_A" role="soundbar" onSwitchSource={onSwitchSource} currentSource="line_in" />
    );
    const lineInButton = screen.getByLabelText('Sorgente Line-in');
    expect(lineInButton.className).toContain('bg-amber-500');
  });

  it('no button is highlighted when currentSource is streaming', () => {
    render(
      <SonosSourceSwitch uid="RINCON_A" role="soundbar" onSwitchSource={onSwitchSource} currentSource="streaming" />
    );
    const tvButton = screen.getByLabelText('Sorgente TV');
    const lineInButton = screen.getByLabelText('Sorgente Line-in');
    expect(tvButton.className).not.toContain('bg-amber-500');
    expect(lineInButton.className).not.toContain('bg-amber-500');
  });

  it('calls onSwitchSource with tv when TV button is clicked', () => {
    render(<SonosSourceSwitch uid="RINCON_A" role="soundbar" onSwitchSource={onSwitchSource} />);
    fireEvent.click(screen.getByLabelText('Sorgente TV'));
    expect(onSwitchSource).toHaveBeenCalledWith('RINCON_A', 'tv');
  });

  it('calls onSwitchSource with line_in when Line-in button is clicked', () => {
    render(<SonosSourceSwitch uid="RINCON_A" role="soundbar" onSwitchSource={onSwitchSource} />);
    fireEvent.click(screen.getByLabelText('Sorgente Line-in'));
    expect(onSwitchSource).toHaveBeenCalledWith('RINCON_A', 'line_in');
  });
});
