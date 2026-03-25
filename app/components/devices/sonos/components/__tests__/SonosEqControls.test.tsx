import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SonosEqControls from '../SonosEqControls';
import type { SonosEqResponse } from '@/types/sonosProxy';

const mockEqData: SonosEqResponse = {
  uid: 'RINCON_A',
  bass: 3,
  treble: -2,
  loudness: false,
};

describe('SonosEqControls', () => {
  const onSetEq = jest.fn();

  beforeEach(() => {
    onSetEq.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when eqData is undefined', () => {
    const { container } = render(
      <SonosEqControls uid="RINCON_A" eqData={undefined} onSetEq={onSetEq} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all eqData fields are null', () => {
    const nullData: SonosEqResponse = { uid: 'RINCON_A', bass: null, treble: null, loudness: null };
    const { container } = render(
      <SonosEqControls uid="RINCON_A" eqData={nullData} onSetEq={onSetEq} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders EQ toggle button when eqData has values', () => {
    render(<SonosEqControls uid="RINCON_A" eqData={mockEqData} onSetEq={onSetEq} />);
    expect(screen.getByLabelText('EQ')).toBeInTheDocument();
  });

  it('expands to show bass and treble sliders when toggle is clicked', () => {
    render(<SonosEqControls uid="RINCON_A" eqData={mockEqData} onSetEq={onSetEq} />);
    fireEvent.click(screen.getByLabelText('EQ'));
    expect(screen.getByLabelText('Bass')).toBeInTheDocument();
    expect(screen.getByLabelText('Treble')).toBeInTheDocument();
  });

  it('renders bass slider with min -10 and max 10', () => {
    render(<SonosEqControls uid="RINCON_A" eqData={mockEqData} onSetEq={onSetEq} />);
    fireEvent.click(screen.getByLabelText('EQ'));
    const bassSlider = screen.getByLabelText('Bass');
    expect(bassSlider).toHaveAttribute('min', '-10');
    expect(bassSlider).toHaveAttribute('max', '10');
  });

  it('renders treble slider with min -10 and max 10', () => {
    render(<SonosEqControls uid="RINCON_A" eqData={mockEqData} onSetEq={onSetEq} />);
    fireEvent.click(screen.getByLabelText('EQ'));
    const trebleSlider = screen.getByLabelText('Treble');
    expect(trebleSlider).toHaveAttribute('min', '-10');
    expect(trebleSlider).toHaveAttribute('max', '10');
  });

  it('renders Loudness button when expanded', () => {
    render(<SonosEqControls uid="RINCON_A" eqData={mockEqData} onSetEq={onSetEq} />);
    fireEvent.click(screen.getByLabelText('EQ'));
    expect(screen.getByText('Loudness')).toBeInTheDocument();
  });

  it('calls onSetEq immediately on Loudness toggle click', () => {
    render(<SonosEqControls uid="RINCON_A" eqData={mockEqData} onSetEq={onSetEq} />);
    fireEvent.click(screen.getByLabelText('EQ'));
    fireEvent.click(screen.getByText('Loudness'));
    expect(onSetEq).toHaveBeenCalledWith('RINCON_A', { loudness: true });
  });
});
