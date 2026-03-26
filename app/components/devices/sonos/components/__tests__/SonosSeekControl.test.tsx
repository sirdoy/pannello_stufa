import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SonosSeekControl from '@/app/components/devices/sonos/components/SonosSeekControl';
import type { SonosPlaybackResponse } from '@/types/sonosProxy';

const basePlayback: SonosPlaybackResponse = {
  group_id: 'RINCON_GROUP_1',
  transport_state: 'PLAYING',
  title: 'Test Track',
  artist: 'Test Artist',
  album: null,
  album_art_url: null,
  position: '0:01:23',
  duration: '0:03:45',
  source_type: 'streaming',
};

const mockOnSeek = jest.fn().mockResolvedValue(undefined);

describe('SonosSeekControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders position and duration text when playback provided', () => {
    render(
      <SonosSeekControl
        playback={basePlayback}
        groupId="RINCON_GROUP_1"
        onSeek={mockOnSeek}
      />
    );
    // 1:23 = 83 seconds, 3:45 = 225 seconds
    expect(screen.getByText('1:23')).toBeInTheDocument();
    expect(screen.getByText('3:45')).toBeInTheDocument();
  });

  it('range input is disabled when transport_state is STOPPED', () => {
    render(
      <SonosSeekControl
        playback={{ ...basePlayback, transport_state: 'STOPPED' }}
        groupId="RINCON_GROUP_1"
        onSeek={mockOnSeek}
      />
    );
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('range input is disabled when duration is null (live stream)', () => {
    render(
      <SonosSeekControl
        playback={{ ...basePlayback, duration: null, transport_state: 'PLAYING' }}
        groupId="RINCON_GROUP_1"
        onSeek={mockOnSeek}
      />
    );
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('range input is disabled when playback is undefined', () => {
    render(
      <SonosSeekControl
        playback={undefined}
        groupId="RINCON_GROUP_1"
        onSeek={mockOnSeek}
      />
    );
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('range input max equals duration in seconds', () => {
    // duration: '0:03:45' = 0*3600 + 3*60 + 45 = 225 seconds
    render(
      <SonosSeekControl
        playback={{ ...basePlayback, duration: '0:03:45' }}
        groupId="RINCON_GROUP_1"
        onSeek={mockOnSeek}
      />
    );
    expect(screen.getByRole('slider').getAttribute('max')).toBe('225');
  });

  it('shows placeholder text when playback undefined', () => {
    render(
      <SonosSeekControl
        playback={undefined}
        groupId="RINCON_GROUP_1"
        onSeek={mockOnSeek}
      />
    );
    const placeholders = screen.getAllByText('--:--');
    expect(placeholders.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onSeek with HH:MM:SS formatted string on mouse up', () => {
    render(
      <SonosSeekControl
        playback={basePlayback}
        groupId="RINCON_GROUP_1"
        onSeek={mockOnSeek}
      />
    );
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '90' } });
    fireEvent.mouseUp(slider);
    expect(mockOnSeek).toHaveBeenCalledWith('RINCON_GROUP_1', '00:01:30');
  });
});
