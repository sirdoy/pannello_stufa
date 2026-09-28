/**
 * Tests for mergeSonosMutation — pure merge of Sonos mutation responses
 * (docs/api/sonos.md "Mutation responses") into the useSonosFullData snapshot.
 */

import { mergeSonosMutation, type SonosFullData } from '../useSonosFullData';
import type { SonosZoneResponse, SonosDeviceResponse } from '@/types/sonosProxy';

function snapshot(): SonosFullData {
  return {
    devices: [],
    zones: [],
    playback: {},
    volumes: { RINCON_B: { uid: 'RINCON_B', volume: 10, mute: false } },
    playModes: {},
    sleepTimers: {},
    eqData: {},
    homeTheaterData: {
      RINCON_SB: {
        uid: 'RINCON_SB', night_mode: false, dialog_mode: false, sub_enabled: true,
        sub_gain: 0, surround_enabled: true,
      } as SonosFullData['homeTheaterData'][string],
    },
  };
}

describe('mergeSonosMutation', () => {
  it('returns null when data_confirmed is false', () => {
    expect(mergeSonosMutation(snapshot(), {
      data_confirmed: false,
      volume: { uid: 'RINCON_B', volume: 50, mute: false },
    })).toBeNull();
  });

  it('returns null when the body has no known resource (e.g. empty placeholder)', () => {
    expect(mergeSonosMutation(snapshot(), { data_confirmed: true, playback: {} })).toBeNull();
  });

  it('merges transport playback by group_id', () => {
    const playback = { group_id: 'RINCON_A', transport_state: 'PLAYING', title: 'Song' };
    const next = mergeSonosMutation(snapshot(), { data_confirmed: true, playback });
    expect(next?.playback['RINCON_A']).toEqual(playback);
  });

  it('merges a single speaker volume and a zone volume list', () => {
    const one = mergeSonosMutation(snapshot(), {
      data_confirmed: true,
      volume: { uid: 'RINCON_B', volume: 42, mute: true },
    });
    expect(one?.volumes['RINCON_B']).toEqual({ uid: 'RINCON_B', volume: 42, mute: true });

    const zone = mergeSonosMutation(snapshot(), {
      data_confirmed: true,
      volumes: [
        { uid: 'RINCON_B', volume: 20, mute: false },
        { uid: 'RINCON_C', volume: 25, mute: false },
      ],
    });
    expect(zone?.volumes['RINCON_B']?.volume).toBe(20);
    expect(zone?.volumes['RINCON_C']?.volume).toBe(25);
  });

  it('merges eq, play mode and sleep timer', () => {
    const base = snapshot();
    const eq = mergeSonosMutation(base, {
      data_confirmed: true,
      eq_settings: { uid: 'RINCON_B', bass: 3, treble: -1, loudness: true },
    });
    expect(eq?.eqData['RINCON_B']?.bass).toBe(3);

    const pm = mergeSonosMutation(base, {
      data_confirmed: true,
      play_mode: { group_id: 'RINCON_A', play_mode: 'SHUFFLE' },
    });
    expect(pm?.playModes['RINCON_A']?.play_mode).toBe('SHUFFLE');

    const st = mergeSonosMutation(base, {
      data_confirmed: true,
      sleep_timer: { group_id: 'RINCON_A', remaining_seconds: 900 },
    });
    expect(st?.sleepTimers['RINCON_A']?.remaining_seconds).toBe(900);
  });

  it('merges a partial home_theater over the known soundbar settings', () => {
    const next = mergeSonosMutation(snapshot(), {
      data_confirmed: true,
      home_theater: { uid: 'RINCON_SB', night_mode: true },
    });
    expect(next?.homeTheaterData['RINCON_SB']).toMatchObject({ night_mode: true, sub_enabled: true, surround_enabled: true });
  });

  it('replaces devices and zones on topology mutations', () => {
    const speakers = [{ uid: 'RINCON_B' }] as unknown as SonosDeviceResponse[];
    const groups = [{ group_id: 'RINCON_B', members: [] }] as unknown as SonosZoneResponse[];
    const next = mergeSonosMutation(snapshot(), { data_confirmed: true, speakers, groups });
    expect(next?.devices).toBe(speakers);
    expect(next?.zones).toBe(groups);
  });

  it('does not mutate the previous snapshot', () => {
    const base = snapshot();
    mergeSonosMutation(base, { data_confirmed: true, volume: { uid: 'RINCON_B', volume: 99, mute: false } });
    expect(base.volumes['RINCON_B']?.volume).toBe(10);
  });
});
