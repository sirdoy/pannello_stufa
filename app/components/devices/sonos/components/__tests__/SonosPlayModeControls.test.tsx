import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SonosPlayModeControls from '../SonosPlayModeControls';
import type { SonosPlayMode } from '@/types/sonosProxy';

describe('SonosPlayModeControls', () => {
  const onSetPlayMode = jest.fn();

  beforeEach(() => {
    onSetPlayMode.mockClear();
  });

  it('renders shuffle and repeat buttons', () => {
    render(<SonosPlayModeControls playMode={null} onSetPlayMode={onSetPlayMode} />);
    expect(screen.getByLabelText('Shuffle')).toBeInTheDocument();
    expect(screen.getByLabelText('Ripeti')).toBeInTheDocument();
  });

  it('shuffle button has active style when play_mode is SHUFFLE', () => {
    render(<SonosPlayModeControls playMode="SHUFFLE" onSetPlayMode={onSetPlayMode} />);
    const shuffleBtn = screen.getByLabelText('Shuffle');
    expect(shuffleBtn.className).toContain('bg-ember-500/20');
  });

  it('repeat button has active style when play_mode is REPEAT_ALL', () => {
    render(<SonosPlayModeControls playMode="REPEAT_ALL" onSetPlayMode={onSetPlayMode} />);
    const repeatBtn = screen.getByLabelText('Ripeti');
    expect(repeatBtn.className).toContain('bg-ember-500/20');
  });

  it('clicking shuffle toggles mode from NORMAL to SHUFFLE_NOREPEAT', () => {
    render(<SonosPlayModeControls playMode="NORMAL" onSetPlayMode={onSetPlayMode} />);
    fireEvent.click(screen.getByLabelText('Shuffle'));
    expect(onSetPlayMode).toHaveBeenCalledWith('SHUFFLE_NOREPEAT');
  });

  it('clicking repeat toggles mode from NORMAL to REPEAT_ALL', () => {
    render(<SonosPlayModeControls playMode="NORMAL" onSetPlayMode={onSetPlayMode} />);
    fireEvent.click(screen.getByLabelText('Ripeti'));
    expect(onSetPlayMode).toHaveBeenCalledWith('REPEAT_ALL');
  });

  it('handles null play_mode gracefully — both buttons render as inactive', () => {
    render(<SonosPlayModeControls playMode={null} onSetPlayMode={onSetPlayMode} />);
    const shuffleBtn = screen.getByLabelText('Shuffle');
    const repeatBtn = screen.getByLabelText('Ripeti');
    expect(shuffleBtn.className).not.toContain('bg-ember-500/20');
    expect(repeatBtn.className).not.toContain('bg-ember-500/20');
  });

  it('shuffle button is inactive for REPEAT_ALL', () => {
    render(<SonosPlayModeControls playMode={'REPEAT_ALL' as SonosPlayMode} onSetPlayMode={onSetPlayMode} />);
    const shuffleBtn = screen.getByLabelText('Shuffle');
    expect(shuffleBtn.className).not.toContain('bg-ember-500/20');
  });

  it('repeat button is inactive for SHUFFLE_NOREPEAT', () => {
    render(<SonosPlayModeControls playMode={'SHUFFLE_NOREPEAT' as SonosPlayMode} onSetPlayMode={onSetPlayMode} />);
    const repeatBtn = screen.getByLabelText('Ripeti');
    expect(repeatBtn.className).not.toContain('bg-ember-500/20');
  });
});
