import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SonosHomeTheater from '../SonosHomeTheater';
import type { SonosHomeTheaterResponse } from '@/types/sonosProxy';

const mockHtData: SonosHomeTheaterResponse = {
  uid: 'RINCON_A',
  night_mode: false,
  dialog_mode: true,
  sub_enabled: true,
  sub_gain: 5,
  surround_enabled: false,
  surround_volume_tv: 0,
  surround_volume_music: 0,
};

describe('SonosHomeTheater', () => {
  const onSetHomeTheater = jest.fn();

  beforeEach(() => {
    onSetHomeTheater.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when role is not soundbar', () => {
    const { container } = render(
      <SonosHomeTheater uid="RINCON_A" role="speaker" htData={mockHtData} onSetHomeTheater={onSetHomeTheater} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when role is sub', () => {
    const { container } = render(
      <SonosHomeTheater uid="RINCON_A" role="sub" htData={mockHtData} onSetHomeTheater={onSetHomeTheater} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when htData is undefined', () => {
    const { container } = render(
      <SonosHomeTheater uid="RINCON_A" role="soundbar" htData={undefined} onSetHomeTheater={onSetHomeTheater} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Home Theater toggle button for soundbar role', () => {
    render(
      <SonosHomeTheater uid="RINCON_A" role="soundbar" htData={mockHtData} onSetHomeTheater={onSetHomeTheater} />
    );
    expect(screen.getByLabelText('Home Theater')).toBeInTheDocument();
  });

  it('expands to show toggle buttons when clicked', () => {
    render(
      <SonosHomeTheater uid="RINCON_A" role="soundbar" htData={mockHtData} onSetHomeTheater={onSetHomeTheater} />
    );
    fireEvent.click(screen.getByLabelText('Home Theater'));
    expect(screen.getByText('Modalita notte')).toBeInTheDocument();
    expect(screen.getByText('Dialogo')).toBeInTheDocument();
    expect(screen.getByText('Subwoofer')).toBeInTheDocument();
    expect(screen.getByText('Surround')).toBeInTheDocument();
  });

  it('shows sub gain slider only when sub_enabled is true', () => {
    render(
      <SonosHomeTheater uid="RINCON_A" role="soundbar" htData={mockHtData} onSetHomeTheater={onSetHomeTheater} />
    );
    fireEvent.click(screen.getByLabelText('Home Theater'));
    const subGainSlider = screen.getByLabelText('Guadagno Sub');
    expect(subGainSlider).toBeInTheDocument();
    expect(subGainSlider).toHaveAttribute('min', '-15');
    expect(subGainSlider).toHaveAttribute('max', '15');
  });

  it('does not show sub gain slider when sub_enabled is false', () => {
    const htDataSubOff = { ...mockHtData, sub_enabled: false };
    render(
      <SonosHomeTheater uid="RINCON_A" role="soundbar" htData={htDataSubOff} onSetHomeTheater={onSetHomeTheater} />
    );
    fireEvent.click(screen.getByLabelText('Home Theater'));
    expect(screen.queryByLabelText('Guadagno Sub')).not.toBeInTheDocument();
  });

  it('calls onSetHomeTheater immediately on night_mode toggle', () => {
    render(
      <SonosHomeTheater uid="RINCON_A" role="soundbar" htData={mockHtData} onSetHomeTheater={onSetHomeTheater} />
    );
    fireEvent.click(screen.getByLabelText('Home Theater'));
    fireEvent.click(screen.getByText('Modalita notte'));
    expect(onSetHomeTheater).toHaveBeenCalledWith('RINCON_A', { night_mode: true });
  });
});
