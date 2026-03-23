/**
 * TypeScript types for Sonos Proxy API responses.
 *
 * The proxy handles Sonos device communication and caching server-side.
 * These types represent the proxy's response shapes.
 *
 * See docs/api/sonos.md for the authoritative spec.
 */

// =============================================================================
// DATA FRESHNESS
// =============================================================================

/**
 * Indicates how fresh the data returned by the Sonos proxy is.
 * - LIVE: fetched directly from the Sonos network right now
 * - STALE: served from proxy cache (Sonos may be temporarily unavailable)
 * @note UNREACHABLE triggers HTTP 503 — never appears in response body
 */
export type SonosDataFreshness = 'LIVE' | 'STALE';

// =============================================================================
// DISCOVERY TYPES (Phase 126)
// =============================================================================

// Source: docs/api/sonos.md — SonosHealthResponse
export interface SonosHealthResponse {
  connected: boolean;
  data_freshness: SonosDataFreshness;
  device_count: number;
  last_poll_at: string | null;       // ISO 8601
  last_success_at: string | null;    // ISO 8601
}

// Source: docs/api/sonos.md — SonosDeviceResponse
export interface SonosDeviceResponse {
  uid: string;              // RINCON_... device UID
  name: string;             // Human-readable player name
  ip: string;               // Speaker IP on local network
  model: string | null;     // e.g. "Sonos Beam (Gen 2)"
  firmware: string | null;
  serial: string | null;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  is_visible: boolean;      // false for surrounds, Sub
  is_coordinator: boolean;
}

// Source: docs/api/sonos.md — SonosDeviceDetailResponse
export interface SonosDeviceDetailResponse extends SonosDeviceResponse {
  volume: number | null;    // 0-100
  mute: boolean | null;
  bass: number | null;      // -10 to +10
  treble: number | null;    // -10 to +10
  loudness: boolean | null;
}

// Source: docs/api/sonos.md — SonosZoneMemberResponse
export interface SonosZoneMemberResponse {
  uid: string;
  name: string;
  ip: string;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
}

// Source: docs/api/sonos.md — SonosZoneResponse
export interface SonosZoneResponse {
  group_id: string;           // coordinator UID (use as group_id for zone commands)
  label: string;              // human-readable zone label from SoCo
  coordinator_uid: string;    // UID of the zone coordinator
  coordinator_name: string;   // player name of the coordinator
  member_count: number;
  members: SonosZoneMemberResponse[];
}

// =============================================================================
// MONITORING TYPES (Phase 127 prep)
// =============================================================================

// Source: docs/api/sonos.md — SonosPlaybackResponse
export interface SonosPlaybackResponse {
  group_id: string;
  transport_state: 'PLAYING' | 'PAUSED_PLAYBACK' | 'STOPPED' | 'TRANSITIONING' | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  album_art_url: string | null;
  position: string | null;     // "HH:MM:SS" format
  duration: string | null;     // "HH:MM:SS" format
  source_type: 'tv' | 'streaming' | 'radio' | 'line_in' | 'airplay' | 'unknown' | null;
}

// Source: docs/api/sonos.md — SonosVolumeResponse
export interface SonosVolumeResponse {
  uid: string;
  volume: number | null;  // 0-100
  mute: boolean | null;
}

// =============================================================================
// EXTENDED TYPES (Phase 128 prep)
// =============================================================================

// Source: docs/api/sonos.md — SonosEqResponse
export interface SonosEqResponse {
  uid: string;
  bass: number | null;      // -10 to +10
  treble: number | null;    // -10 to +10
  loudness: boolean | null;
}

// Source: docs/api/sonos.md — SonosPlayMode
export type SonosPlayMode =
  | 'NORMAL' | 'REPEAT_ALL' | 'SHUFFLE'
  | 'SHUFFLE_NOREPEAT' | 'SHUFFLE_REPEAT_ONE' | 'REPEAT_ONE';

// Source: docs/api/sonos.md — SonosPlayModeResponse
export interface SonosPlayModeResponse {
  group_id: string;
  play_mode: SonosPlayMode | null;
}

// Source: docs/api/sonos.md — SonosQueueItemResponse
export interface SonosQueueItemResponse {
  position: number;
  title: string | null;
  artist: string | null;
  album: string | null;
  album_art_url: string | null;
}

// Source: docs/api/sonos.md — SonosQueueResponse
export interface SonosQueueResponse {
  group_id: string;
  items: SonosQueueItemResponse[];
  total: number;
  limit: number;
  offset: number;
}

// Source: docs/api/sonos.md — SonosHomeTheaterResponse
export interface SonosHomeTheaterResponse {
  uid: string;
  night_mode: boolean | null;
  dialog_mode: boolean | null;
  sub_enabled: boolean | null;
  sub_gain: number | null;               // -15 to +15
  surround_enabled: boolean | null;
  surround_volume_tv: number | null;     // -15 to +15
  surround_volume_music: number | null;  // -15 to +15
}

// Source: docs/api/sonos.md — SonosSleepTimerResponse
export interface SonosSleepTimerResponse {
  group_id: string;
  remaining_seconds: number | null;  // null when no timer active
}

// Source: docs/api/sonos.md — SonosVolumeHistoryItem
export interface SonosVolumeHistoryItem {
  timestamp: number;         // Unix epoch int
  speaker_uid: string;
  granularity: 'raw' | 'hourly' | 'daily';
  volume: number | null;     // 0-100 (raw only)
  mute: number | null;       // 0 or 1 integer (NOT boolean) — raw only
  avg_volume: number | null;
  min_volume: number | null;
  max_volume: number | null;
  muted_minutes: number | null;
  sample_count: number | null;
}

// Source: docs/api/sonos.md — SonosPlaybackHistoryItem
export interface SonosPlaybackHistoryItem {
  timestamp: number;          // Unix epoch int
  group_id: string;
  transport_state: string;
  title: string;
  artist: string;
  album: string;
  source_type: string;
  duration_seconds: number | null;
}

// Source: docs/api/sonos.md — SonosHistoryResponse
export interface SonosHistoryResponse {
  items: SonosVolumeHistoryItem[] | SonosPlaybackHistoryItem[];
  total: number;
  granularity: 'raw' | 'hourly' | 'daily';
  limit: number;
  offset: number;
}

// =============================================================================
// COMMAND REQUEST TYPES (Phase 127-128 prep)
// =============================================================================

// Source: docs/api/sonos.md — various SetXxxRequest interfaces
export interface SetVolumeRequest { volume: number; }        // 0-100
export interface SetMuteRequest { mute: boolean; }
export interface SetSeekRequest { position: string; }        // "HH:MM:SS"
export interface SetEqRequest { bass?: number; treble?: number; loudness?: boolean; }
export interface SetPlayModeRequest { mode: SonosPlayMode; }
export interface SetHomeTheaterRequest {
  night_mode?: boolean;
  dialog_mode?: boolean;
  sub_enabled?: boolean;
  sub_gain?: number;            // -15 to +15
  surround_enabled?: boolean;
  surround_volume_tv?: number;  // -15 to +15
  surround_volume_music?: number;
}
export interface SetSleepTimerRequest { duration: number; }  // 0-86399 (0 = cancel)
export interface SwitchSourceRequest { source: 'tv' | 'line_in'; }
export interface JoinRequest { target_uid: string; }

// Generic command acknowledgment (used for play/pause/stop/next/previous/unjoin)
export interface SonosCommandOkResponse {
  status: 'ok';
  group_id?: string;
  uid?: string;
}
