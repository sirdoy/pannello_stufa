import { sortZonesPlayingFirst } from '../sortZones';

describe('sortZonesPlayingFirst (ROADMAP M18)', () => {
  const zones = [{ group_id: 'a' }, { group_id: 'b' }, { group_id: 'c' }, { group_id: 'd' }];

  it('moves playing zones first and keeps the original order inside each block', () => {
    const playback = {
      b: { transport_state: 'PLAYING' },
      c: { transport_state: 'PAUSED_PLAYBACK' },
      d: { transport_state: 'PLAYING' },
    };
    expect(sortZonesPlayingFirst(zones, playback).map((z) => z.group_id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('keeps the order without playback data and does not mutate the input', () => {
    expect(sortZonesPlayingFirst(zones, undefined).map((z) => z.group_id)).toEqual(['a', 'b', 'c', 'd']);
    sortZonesPlayingFirst(zones, { d: { transport_state: 'PLAYING' } });
    expect(zones.map((z) => z.group_id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
