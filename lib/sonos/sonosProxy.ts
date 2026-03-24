/**
 * Sonos Proxy Client
 *
 * Convenience wrappers around the shared HA proxy client (haGet).
 * All endpoints delegate to haGet which handles auth, timeouts, and error
 * mapping via HA_API_URL and HA_API_KEY env vars.
 *
 * The proxy handles:
 *   - Sonos device discovery and zone topology
 *   - Device status caching and data freshness tracking
 *   - Error mapping to RFC 9457 problem details
 *
 * Error handling:
 *   - RFC 9457 error responses are parsed and mapped to ApiError instances
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE) — also triggered by UNREACHABLE state
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { haGet, haPost, haPut } from '@/lib/haClient';
import type {
  SonosHealthResponse,
  SonosDeviceResponse,
  SonosDeviceDetailResponse,
  SonosZoneResponse,
  SonosPlaybackResponse,
  SonosVolumeResponse,
  SonosCommandOkResponse,
  SonosEqResponse,
  SonosPlayModeResponse,
  SonosQueueResponse,
  SonosHomeTheaterResponse,
  SonosSleepTimerResponse,
  SonosHistoryResponse,
  SetEqRequest,
  SetPlayModeRequest,
  SetHomeTheaterRequest,
  SetSleepTimerRequest,
} from '@/types/sonosProxy';

// =============================================================================
// READ WRAPPERS
// =============================================================================

/**
 * Get the Sonos proxy health status and data freshness.
 * Calls GET /api/v1/sonos/health on the HA proxy.
 */
export async function getHealth(): Promise<SonosHealthResponse> {
  return haGet<SonosHealthResponse>('/api/v1/sonos/health');
}

/**
 * Get the list of all discovered Sonos devices.
 * Calls GET /api/v1/sonos/devices on the HA proxy.
 */
export async function getDevices(): Promise<SonosDeviceResponse[]> {
  return haGet<SonosDeviceResponse[]>('/api/v1/sonos/devices');
}

/**
 * Get detailed information for a specific Sonos device including volume/EQ state.
 * Calls GET /api/v1/sonos/devices/{uid} on the HA proxy.
 * @param uid - RINCON_... device UID
 */
export async function getDevice(uid: string): Promise<SonosDeviceDetailResponse> {
  return haGet<SonosDeviceDetailResponse>(`/api/v1/sonos/devices/${uid}`);
}

/**
 * Get the current zone topology (groupings of Sonos players).
 * Calls GET /api/v1/sonos/zones on the HA proxy.
 */
export async function getZones(): Promise<SonosZoneResponse[]> {
  return haGet<SonosZoneResponse[]>('/api/v1/sonos/zones');
}

// =============================================================================
// MONITORING WRAPPERS (Phase 127)
// =============================================================================

/**
 * Get the current playback state for a zone.
 * Calls GET /api/v1/sonos/zones/{groupId}/playback on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 */
export async function getPlayback(groupId: string): Promise<SonosPlaybackResponse> {
  return haGet<SonosPlaybackResponse>(`/api/v1/sonos/zones/${groupId}/playback`);
}

/**
 * Get the volume and mute state for a specific speaker.
 * Calls GET /api/v1/sonos/speakers/{uid}/volume on the HA proxy.
 * @param uid - Speaker RINCON_... UID
 */
export async function getSpeakerVolume(uid: string): Promise<SonosVolumeResponse> {
  return haGet<SonosVolumeResponse>(`/api/v1/sonos/speakers/${uid}/volume`);
}

// =============================================================================
// TRANSPORT COMMAND WRAPPERS (Phase 127 — haPost with empty body)
// =============================================================================

/**
 * Resume playback for a zone.
 * Calls POST /api/v1/sonos/zones/{groupId}/play on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 */
export async function play(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/play`, {});
}

/**
 * Pause playback for a zone.
 * Calls POST /api/v1/sonos/zones/{groupId}/pause on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 */
export async function pause(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/pause`, {});
}

/**
 * Stop playback for a zone.
 * Calls POST /api/v1/sonos/zones/{groupId}/stop on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 */
export async function stop(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/stop`, {});
}

/**
 * Skip to the next track in the queue for a zone.
 * Calls POST /api/v1/sonos/zones/{groupId}/next on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 */
export async function next(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/next`, {});
}

/**
 * Go back to the previous track in the queue for a zone.
 * Calls POST /api/v1/sonos/zones/{groupId}/previous on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 */
export async function previous(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/previous`, {});
}

// =============================================================================
// VOLUME/MUTE/SEEK COMMAND WRAPPERS (Phase 127 — haPut with typed body)
// =============================================================================

/**
 * Set the volume for a specific speaker.
 * Calls PUT /api/v1/sonos/speakers/{uid}/volume on the HA proxy.
 * @param uid    - Speaker RINCON_... UID
 * @param volume - Volume level 0-100
 */
export async function setSpeakerVolume(uid: string, volume: number): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/volume`, { volume });
}

/**
 * Set the mute state for a specific speaker.
 * Calls PUT /api/v1/sonos/speakers/{uid}/mute on the HA proxy.
 * @param uid  - Speaker RINCON_... UID
 * @param mute - true to mute, false to unmute
 */
export async function setSpeakerMute(uid: string, mute: boolean): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/mute`, { mute });
}

/**
 * Set the volume for an entire zone (all speakers in the group).
 * Calls PUT /api/v1/sonos/zones/{groupId}/volume on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 * @param volume  - Volume level 0-100
 */
export async function setZoneVolume(groupId: string, volume: number): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/volume`, { volume });
}

/**
 * Seek to a position in the current track for a zone.
 * Calls PUT /api/v1/sonos/zones/{groupId}/seek on the HA proxy.
 * @param groupId  - Zone coordinator UID (RINCON_...)
 * @param position - Position in "HH:MM:SS" format
 */
export async function seek(groupId: string, position: string): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/seek`, { position });
}

// =============================================================================
// EXTENDED CONTROL READ WRAPPERS (Phase 128 — haGet)
// =============================================================================

/**
 * Get the EQ settings (bass, treble, loudness) for a specific speaker.
 * Calls GET /api/v1/sonos/speakers/{uid}/eq on the HA proxy.
 * @param uid - Speaker RINCON_... UID
 */
export async function getEq(uid: string): Promise<SonosEqResponse> {
  return haGet<SonosEqResponse>(`/api/v1/sonos/speakers/${uid}/eq`);
}

/**
 * Get the current play mode (shuffle, repeat) for a zone.
 * Calls GET /api/v1/sonos/zones/{groupId}/play-mode on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 */
export async function getPlayMode(groupId: string): Promise<SonosPlayModeResponse> {
  return haGet<SonosPlayModeResponse>(`/api/v1/sonos/zones/${groupId}/play-mode`);
}

/**
 * Get the playback queue for a zone with optional pagination.
 * Calls GET /api/v1/sonos/zones/{groupId}/queue on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 * @param limit   - Optional max items to return
 * @param offset  - Optional item offset for pagination
 */
export async function getQueue(groupId: string, limit?: string, offset?: string): Promise<SonosQueueResponse> {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', limit);
  if (offset != null) params.set('offset', offset);
  const qs = params.toString();
  return haGet<SonosQueueResponse>(`/api/v1/sonos/zones/${groupId}/queue${qs ? '?' + qs : ''}`);
}

/**
 * Get home theater settings (night mode, dialog mode, sub/surround) for a soundbar.
 * Calls GET /api/v1/sonos/speakers/{uid}/home-theater on the HA proxy.
 * @param uid - Speaker RINCON_... UID
 */
export async function getHomeTheater(uid: string): Promise<SonosHomeTheaterResponse> {
  return haGet<SonosHomeTheaterResponse>(`/api/v1/sonos/speakers/${uid}/home-theater`);
}

/**
 * Get the current sleep timer state for a zone.
 * Calls GET /api/v1/sonos/zones/{groupId}/sleep-timer on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 */
export async function getSleepTimer(groupId: string): Promise<SonosSleepTimerResponse> {
  return haGet<SonosSleepTimerResponse>(`/api/v1/sonos/zones/${groupId}/sleep-timer`);
}

/**
 * Get the playback or volume history with optional filters.
 * Calls GET /api/v1/sonos/history on the HA proxy.
 * @param params - Optional filters: type, speaker_uid, group_id, start, end, limit, offset
 */
export async function getHistory(params: {
  type?: string;
  speaker_uid?: string;
  group_id?: string;
  start?: string;
  end?: string;
  limit?: string;
  offset?: string;
}): Promise<SonosHistoryResponse> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null) searchParams.set(key, value);
  }
  const qs = searchParams.toString();
  return haGet<SonosHistoryResponse>(`/api/v1/sonos/history${qs ? '?' + qs : ''}`);
}

// =============================================================================
// EXTENDED CONTROL MUTATION WRAPPERS (Phase 128 — haPut / haPost)
// =============================================================================

/**
 * Set EQ settings (bass, treble, loudness) for a specific speaker.
 * Calls PUT /api/v1/sonos/speakers/{uid}/eq on the HA proxy.
 * @param uid  - Speaker RINCON_... UID
 * @param body - Partial EQ settings to update
 */
export async function setEq(uid: string, body: SetEqRequest): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/eq`, body);
}

/**
 * Set the play mode (shuffle, repeat) for a zone.
 * Calls PUT /api/v1/sonos/zones/{groupId}/play-mode on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 * @param body    - Play mode to set
 */
export async function setPlayMode(groupId: string, body: SetPlayModeRequest): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/play-mode`, body);
}

/**
 * Set home theater settings for a soundbar.
 * Calls PUT /api/v1/sonos/speakers/{uid}/home-theater on the HA proxy.
 * @param uid  - Speaker RINCON_... UID
 * @param body - Home theater settings to update
 */
export async function setHomeTheater(uid: string, body: SetHomeTheaterRequest): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/home-theater`, body);
}

/**
 * Set or cancel the sleep timer for a zone.
 * Calls PUT /api/v1/sonos/zones/{groupId}/sleep-timer on the HA proxy.
 * @param groupId - Zone coordinator UID (RINCON_...)
 * @param body    - Duration in seconds (0 = cancel)
 */
export async function setSleepTimer(groupId: string, body: SetSleepTimerRequest): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/sleep-timer`, body);
}

/**
 * Switch the audio source for a speaker (TV or line-in).
 * Calls POST /api/v1/sonos/speakers/{uid}/source on the HA proxy.
 * @param uid    - Speaker RINCON_... UID
 * @param source - Audio source: 'tv' or 'line_in'
 */
export async function switchSource(uid: string, source: 'tv' | 'line_in'): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/source`, { source });
}

/**
 * Join a speaker to another speaker's zone group.
 * Calls POST /api/v1/sonos/speakers/{uid}/join on the HA proxy.
 * @param uid       - Speaker RINCON_... UID to move
 * @param targetUid - Target zone coordinator UID to join
 */
export async function join(uid: string, targetUid: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/join`, { target_uid: targetUid });
}

/**
 * Remove a speaker from its current zone group (become standalone).
 * Calls POST /api/v1/sonos/speakers/{uid}/unjoin on the HA proxy.
 * @param uid - Speaker RINCON_... UID to remove from group
 */
export async function unjoin(uid: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/unjoin`, {});
}
