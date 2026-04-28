/**
 * SonosCard tests — Phase 177 (DASH-05).
 *
 * Verifies:
 *  - up to 4 group rows from `useSonosFullData().data.zones[]`
 *  - PlayingBars on rows with transport_state === 'PLAYING'; dim dot otherwise
 *  - Right slot: `{N} in riprod.` when ≥1 playing, else `In pausa`
 *  - Card body click opens placeholder Sheet
 *
 * Real shapes (per types/sonosProxy.ts — diverges from PATTERNS.md placeholder):
 *  - SonosZoneResponse uses `coordinator_name` (NOT nested `coordinator: { name }`)
 *  - SonosPlaybackResponse uses `transport_state` (NOT `state`) and `title`
 *    (NOT `current_track.title`).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import SonosCard from '../SonosCard';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';

jest.mock('@/app/components/devices/sonos/hooks/useSonosFullData');

const mockUseSonosFullData = jest.mocked(useSonosFullData);

type AnyData = ReturnType<typeof useSonosFullData>;

function makeReturn(zones: Array<{ group_id: string; coordinator_name: string }>, playback: Record<string, { transport_state: string | null; title: string | null }>): AnyData {
  return {
    data: {
      zones,
      playback,
    },
    loading: false,
    error: null,
    stale: false,
    fetchData: jest.fn(),
  } as unknown as AnyData;
}

describe('SonosCard (Phase 177 — DASH-05)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('(a) renders Salotto and Cucina group names', () => {
    mockUseSonosFullData.mockReturnValue(
      makeReturn(
        [
          { group_id: 'g1', coordinator_name: 'Salotto' },
          { group_id: 'g2', coordinator_name: 'Cucina' },
        ],
        {
          g1: { transport_state: 'PLAYING', title: 'Imagine' },
          g2: { transport_state: 'PAUSED_PLAYBACK', title: null },
        },
      ),
    );

    render(<SonosCard />);

    expect(screen.getByText('Salotto')).toBeInTheDocument();
    expect(screen.getByText('Cucina')).toBeInTheDocument();
  });

  test('(b) when one group is playing, right slot reads "1 in riprod."', () => {
    mockUseSonosFullData.mockReturnValue(
      makeReturn(
        [
          { group_id: 'g1', coordinator_name: 'Salotto' },
          { group_id: 'g2', coordinator_name: 'Cucina' },
        ],
        {
          g1: { transport_state: 'PLAYING', title: 'Imagine' },
          g2: { transport_state: 'PAUSED_PLAYBACK', title: null },
        },
      ),
    );

    render(<SonosCard />);

    expect(screen.getByText('1 in riprod.')).toBeInTheDocument();
  });

  test('(c) when no group is playing, right slot reads "In pausa"', () => {
    mockUseSonosFullData.mockReturnValue(
      makeReturn(
        [
          { group_id: 'g1', coordinator_name: 'Salotto' },
          { group_id: 'g2', coordinator_name: 'Cucina' },
        ],
        {
          g1: { transport_state: 'PAUSED_PLAYBACK', title: null },
          g2: { transport_state: 'STOPPED', title: null },
        },
      ),
    );

    render(<SonosCard />);

    expect(screen.getByText('In pausa')).toBeInTheDocument();
  });

  test('(d) playing row renders <PlayingBars /> + track title; paused row does NOT render PlayingBars', () => {
    mockUseSonosFullData.mockReturnValue(
      makeReturn(
        [
          { group_id: 'g1', coordinator_name: 'Salotto' },
          { group_id: 'g2', coordinator_name: 'Cucina' },
        ],
        {
          g1: { transport_state: 'PLAYING', title: 'Imagine' },
          g2: { transport_state: 'PAUSED_PLAYBACK', title: null },
        },
      ),
    );

    render(<SonosCard />);

    // Exactly one PlayingBars (paused row must not render one)
    const bars = screen.getAllByTestId('playing-bars');
    expect(bars).toHaveLength(1);
    expect(screen.getByText('Imagine')).toBeInTheDocument();
  });

  test('(e) clicking the card body opens the sheet with the placeholder body', () => {
    mockUseSonosFullData.mockReturnValue(
      makeReturn(
        [{ group_id: 'g1', coordinator_name: 'Salotto' }],
        { g1: { transport_state: 'PLAYING', title: 'Imagine' } },
      ),
    );

    render(<SonosCard />);

    const dialogBefore = document.querySelector('[role="dialog"]');
    expect(dialogBefore?.getAttribute('data-state')).toBe('closed');

    fireEvent.click(screen.getByTestId('sonos-card'));

    const dialogAfter = document.querySelector('[role="dialog"]');
    expect(dialogAfter?.getAttribute('data-state')).toBe('open');
    expect(screen.getByText(/Controlli in arrivo nella Phase 178/)).toBeInTheDocument();
  });
});
