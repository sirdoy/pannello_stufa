# Sonos Provider API

**Base path:** `/api/v1/sonos`

Sonos speaker API covering health, device discovery, zone topology, playback monitoring, transport controls, volume controls, EQ, play mode, queue, home theater audio, source switching, grouping, sleep timer, and history -- 28 endpoints. Read endpoints serve from local cache populated by 30-second background polling via SoCo (UPnP). Control endpoints proxy directly to speakers.

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/sonos/health` | Speaker connectivity, data freshness, and device count |
| `GET` | `/api/v1/sonos/devices` | List all speakers with identity and topology snapshot |
| `GET` | `/api/v1/sonos/devices/{uid}` | Get single speaker detail with on-demand audio state |
| `GET` | `/api/v1/sonos/zones` | List zone groups with coordinator and member info |
| `GET` | `/api/v1/sonos/zones/{group_id}/playback` | Current playback state for a zone (cache-only) |
| `GET` | `/api/v1/sonos/speakers/{uid}/volume` | Speaker volume and mute state (cache-only) |
| `POST` | `/api/v1/sonos/zones/{group_id}/play` | Play on zone coordinator |
| `POST` | `/api/v1/sonos/zones/{group_id}/pause` | Pause zone coordinator |
| `POST` | `/api/v1/sonos/zones/{group_id}/stop` | Stop zone coordinator |
| `POST` | `/api/v1/sonos/zones/{group_id}/next` | Skip to next track on zone coordinator |
| `POST` | `/api/v1/sonos/zones/{group_id}/previous` | Skip to previous track on zone coordinator |
| `PUT` | `/api/v1/sonos/speakers/{uid}/volume` | Set speaker volume (0-100) |
| `PUT` | `/api/v1/sonos/speakers/{uid}/mute` | Set speaker mute state |
| `PUT` | `/api/v1/sonos/zones/{group_id}/volume` | Set volume for all speakers in a zone |
| `PUT` | `/api/v1/sonos/zones/{group_id}/seek` | Seek to position in current track (HH:MM:SS) |
| `GET` | `/api/v1/sonos/speakers/{uid}/eq` | Get speaker EQ settings (bass, treble, loudness) |
| `PUT` | `/api/v1/sonos/speakers/{uid}/eq` | Set speaker EQ settings (partial update) |
| `GET` | `/api/v1/sonos/zones/{group_id}/play-mode` | Get zone play mode |
| `PUT` | `/api/v1/sonos/zones/{group_id}/play-mode` | Set zone play mode |
| `GET` | `/api/v1/sonos/zones/{group_id}/queue` | Get zone playback queue (paginated) |
| `GET` | `/api/v1/sonos/speakers/{uid}/home-theater` | Get soundbar home theater settings |
| `PUT` | `/api/v1/sonos/speakers/{uid}/home-theater` | Set soundbar home theater settings (partial update) |
| `POST` | `/api/v1/sonos/speakers/{uid}/source` | Switch soundbar audio source (tv or line_in) |
| `POST` | `/api/v1/sonos/speakers/{uid}/join` | Join a speaker to another speaker's group |
| `POST` | `/api/v1/sonos/speakers/{uid}/unjoin` | Remove a speaker from its current group |
| `GET` | `/api/v1/sonos/zones/{group_id}/sleep-timer` | Get zone sleep timer remaining seconds |
| `PUT` | `/api/v1/sonos/zones/{group_id}/sleep-timer` | Set or cancel zone sleep timer |
| `GET` | `/api/v1/sonos/history` | Volume or playback history with auto-granularity |

---

## Table of Contents

- [Health](#health)
  - [GET /health](#get-health)
- [Discovery](#discovery)
  - [GET /devices](#get-devices)
  - [GET /devices/{uid}](#get-devicesuid)
  - [GET /zones](#get-zones)
- [Monitoring](#monitoring)
  - [GET /zones/{group_id}/playback](#get-zonesgroup_idplayback)
  - [GET /speakers/{uid}/volume](#get-speakersuidvolume)
- [Transport Controls](#transport-controls)
  - [POST /zones/{group_id}/play](#post-zonesgroup_idplay)
  - [POST /zones/{group_id}/pause](#post-zonesgroup_idpause)
  - [POST /zones/{group_id}/stop](#post-zonesgroup_idstop)
  - [POST /zones/{group_id}/next](#post-zonesgroup_idnext)
  - [POST /zones/{group_id}/previous](#post-zonesgroup_idprevious)
- [Volume Controls](#volume-controls)
  - [PUT /speakers/{uid}/volume](#put-speakersuidvolume)
  - [PUT /speakers/{uid}/mute](#put-speakersuidmute)
  - [PUT /zones/{group_id}/volume](#put-zonesgroup_idvolume)
- [Seek](#seek)
  - [PUT /zones/{group_id}/seek](#put-zonesgroup_idseek)
- [Extended Controls](#extended-controls)
  - [GET /speakers/{uid}/eq](#get-speakersuidkq)
  - [PUT /speakers/{uid}/eq](#put-speakersuidkq)
  - [GET /zones/{group_id}/play-mode](#get-zonesgroup_idplay-mode)
  - [PUT /zones/{group_id}/play-mode](#put-zonesgroup_idplay-mode)
  - [GET /zones/{group_id}/queue](#get-zonesgroup_idqueue)
  - [GET /speakers/{uid}/home-theater](#get-speakersuidhome-theater)
  - [PUT /speakers/{uid}/home-theater](#put-speakersuidhome-theater)
  - [POST /speakers/{uid}/source](#post-speakersuidource)
  - [POST /speakers/{uid}/join](#post-speakersuidjoin)
  - [POST /speakers/{uid}/unjoin](#post-speakersuidunjoin)
  - [GET /zones/{group_id}/sleep-timer](#get-zonesgroup_idsleep-timer)
  - [PUT /zones/{group_id}/sleep-timer](#put-zonesgroup_idsleep-timer)
- [History](#history)
  - [GET /history](#get-history)
- [Next.js Fetch Snippets](#nextjs-fetch-snippets)
- [Field Verification Status](#field-verification-status)
- [Common Patterns](#common-patterns)

---

## Health

### GET /health

Returns Sonos speaker connectivity status, data freshness, and device count. Reads from in-memory cache only -- never calls SoCo.

**Authentication:** Required (JWT Bearer or API Key)

**`data_freshness` values:**

| Value | Meaning |
|-------|---------|
| `LIVE` | Last successful poll within 90 seconds (3x the 30s polling interval) |
| `STALE` | Data older than 90 seconds -- available but may not reflect current state |
| `UNREACHABLE` | Speakers persistently unreachable -- triggers HTTP 503, never appears in JSON response body |

**Response (200):**

```json
{
  "connected": true,
  "data_freshness": "LIVE",
  "device_count": 5,
  "last_poll_at": "2026-03-20T09:45:30+00:00",
  "last_success_at": "2026-03-20T09:45:30+00:00"
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosHealthResponse
interface SonosHealthResponse {
  connected: boolean;
  data_freshness: "LIVE" | "STALE"; // UNREACHABLE triggers 503 — never in response body
  device_count: number;
  last_poll_at: string | null;       // ISO 8601
  last_success_at: string | null;    // ISO 8601
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/health \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Speakers are UNREACHABLE (3+ consecutive poll failures) |

---

## Discovery

All discovery endpoints serve from in-memory cache populated by 30-second background polling. `STALE` freshness returns HTTP **200** (not 503) -- only `UNREACHABLE` (3+ consecutive failures) returns 503.

---

### GET /devices

Returns all Sonos speakers with identity and topology snapshot. Includes invisible speakers (surrounds, Sub) that are not shown in the Sonos app.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
[
  {
    "uid": "RINCON_B8E9378A123401400",
    "name": "Soggiorno",
    "ip": "192.168.178.71",
    "model": "Sonos Beam (Gen 2)",
    "firmware": "77.4-52092",
    "serial": "B8:E9:37:8A:12:34:01",
    "role": "soundbar",
    "is_visible": true,
    "is_coordinator": true
  },
  {
    "uid": "RINCON_C4A81B3D567801400",
    "name": "Camera da letto",
    "ip": "192.168.178.72",
    "model": "Sonos One (Gen 2)",
    "firmware": "77.4-52092",
    "serial": "C4:A8:1B:3D:56:78:01",
    "role": "speaker",
    "is_visible": true,
    "is_coordinator": true
  },
  {
    "uid": "RINCON_D2F93C5E890A01400",
    "name": "Studio",
    "ip": "192.168.178.73",
    "model": "Era 100",
    "firmware": "77.4-52092",
    "serial": "D2:F9:3C:5E:89:0A:01",
    "role": "speaker",
    "is_visible": true,
    "is_coordinator": false
  },
  {
    "uid": "RINCON_E5A24D6F123B01400",
    "name": "Sub (Soggiorno)",
    "ip": "192.168.178.74",
    "model": "Sub (Gen 3)",
    "firmware": "77.4-52092",
    "serial": "E5:A2:4D:6F:12:3B:01",
    "role": "sub",
    "is_visible": false,
    "is_coordinator": false
  },
  {
    "uid": "RINCON_F7B35E7A456C01400",
    "name": "Surround Right (Soggiorno)",
    "ip": "192.168.178.75",
    "model": "Sonos One (Gen 2)",
    "firmware": "77.4-52092",
    "serial": "F7:B3:5E:7A:45:6C:01",
    "role": "surround",
    "is_visible": false,
    "is_coordinator": false
  }
]
```

```typescript
// Source: api/providers/sonos/routes.py — SonosDeviceResponse
interface SonosDeviceResponse {
  uid: string;           // RINCON_... device UID
  name: string;          // Human-readable player name
  ip: string;            // Speaker IP on local network
  model: string | null;  // e.g. "Sonos Beam (Gen 2)", "Sonos One (Gen 2)"
  firmware: string | null;
  serial: string | null;
  role: "soundbar" | "sub" | "surround" | "speaker";
  is_visible: boolean;   // false for surrounds, Sub
  is_coordinator: boolean;
  custom_name: string | null;  // Custom name from device registry, or null if not registered
  device_type: string | null;  // Device type slug from registry, or null if not registered
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/devices \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Speakers UNREACHABLE or speaker data not yet available |

---

### GET /devices/{uid}

Returns a single Sonos speaker detail including audio state (volume, mute, bass, treble, loudness) fetched on-demand from the speaker via SoCo.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID (RINCON_... string) |

**Response (200):**

```json
{
  "uid": "RINCON_B8E9378A123401400",
  "name": "Soggiorno",
  "ip": "192.168.178.71",
  "model": "Sonos Beam (Gen 2)",
  "firmware": "77.4-52092",
  "serial": "B8:E9:37:8A:12:34:01",
  "role": "soundbar",
  "is_visible": true,
  "is_coordinator": true,
  "volume": 35,
  "mute": false,
  "bass": 0,
  "treble": 0,
  "loudness": false
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosDeviceDetailResponse
interface SonosDeviceDetailResponse extends SonosDeviceResponse {
  volume: number | null;   // 0-100
  mute: boolean | null;
  bass: number | null;     // -10 to +10
  treble: number | null;   // -10 to +10
  loudness: boolean | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/devices/RINCON_B8E9378A123401400 \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found in cache |
| `503 Service Unavailable` | Speakers UNREACHABLE or speaker data not yet available |

---

### GET /zones

Returns all Sonos zone groups with coordinator and member info. A zone is a group of speakers playing together; the coordinator is the master speaker that controls playback.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
[
  {
    "group_id": "RINCON_B8E9378A123401400:1",
    "label": "Soggiorno",
    "coordinator_uid": "RINCON_B8E9378A123401400",
    "coordinator_name": "Soggiorno",
    "member_count": 3,
    "members": [
      {
        "uid": "RINCON_B8E9378A123401400",
        "name": "Soggiorno",
        "ip": "192.168.178.71",
        "role": "soundbar"
      },
      {
        "uid": "RINCON_E5A24D6F123B01400",
        "name": "Sub (Soggiorno)",
        "ip": "192.168.178.74",
        "role": "sub"
      },
      {
        "uid": "RINCON_F7B35E7A456C01400",
        "name": "Surround Right (Soggiorno)",
        "ip": "192.168.178.75",
        "role": "surround"
      }
    ]
  },
  {
    "group_id": "RINCON_C4A81B3D567801400:1",
    "label": "Camera da letto + Studio",
    "coordinator_uid": "RINCON_C4A81B3D567801400",
    "coordinator_name": "Camera da letto",
    "member_count": 2,
    "members": [
      {
        "uid": "RINCON_C4A81B3D567801400",
        "name": "Camera da letto",
        "ip": "192.168.178.72",
        "role": "speaker"
      },
      {
        "uid": "RINCON_D2F93C5E890A01400",
        "name": "Studio",
        "ip": "192.168.178.73",
        "role": "speaker"
      }
    ]
  }
]
```

```typescript
// Source: api/providers/sonos/routes.py — SonosZoneResponse
interface SonosZoneMemberResponse {
  uid: string;
  name: string;
  ip: string;
  role: "soundbar" | "sub" | "surround" | "speaker";
}

interface SonosZoneResponse {
  group_id: string;           // coordinator UID (use this as group_id for zone commands)
  label: string;              // human-readable zone label from SoCo
  coordinator_uid: string;    // UID of the zone coordinator
  coordinator_name: string;   // player name of the coordinator
  member_count: number;
  members: SonosZoneMemberResponse[];
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/zones \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

## Monitoring

### GET /zones/{group_id}/playback

Returns current playback state for a zone. Reads from in-memory cache only -- never calls SoCo during request handling.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID (from `GET /zones` → `coordinator_uid`) |

**`transport_state` values:**

| Value | Meaning |
|-------|---------|
| `PLAYING` | Zone is actively playing |
| `PAUSED_PLAYBACK` | Zone is paused |
| `STOPPED` | Zone is stopped or idle |
| `TRANSITIONING` | Zone is transitioning between tracks |

**`source_type` values:**

| Value | Meaning |
|-------|---------|
| `streaming` | Sonos app, Spotify Connect, streaming services |
| `radio` | Internet radio (TuneIn, etc.) |
| `tv` | TV audio input (soundbar only) |
| `line_in` | Line-in audio input |
| `airplay` | AirPlay source |
| `unknown` | Unclassified source |

**Response (200):**

```json
{
  "group_id": "RINCON_C4A81B3D567801400:1",
  "transport_state": "PLAYING",
  "title": "Nuvole Bianche",
  "artist": "Ludovico Einaudi",
  "album": "Islands",
  "album_art_url": "http://192.168.178.72:1400/getaa?s=1&u=x-sonos-spotify%3aspotify%3atrack%3a4W7KCz6fbHQx7v4rUyF3Gp",
  "position": "0:02:14",
  "duration": "0:05:55",
  "source_type": "streaming"
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosPlaybackResponse
interface SonosPlaybackResponse {
  group_id: string;
  transport_state: "PLAYING" | "PAUSED_PLAYBACK" | "STOPPED" | "TRANSITIONING" | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  album_art_url: string | null;
  position: string | null;    // "HH:MM:SS" format
  duration: string | null;    // "HH:MM:SS" format
  source_type: "tv" | "streaming" | "radio" | "line_in" | "airplay" | "unknown" | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/playback \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | `group_id` is not a known zone coordinator |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

> **Note:** If `group_id` is a slave/member UID, 404 is returned (not 422). The 422 coordinator check applies only to control endpoints. Use `GET /zones` to find the correct `coordinator_uid`.

---

### GET /speakers/{uid}/volume

Returns volume and mute state for a speaker. Reads from in-memory cache only -- never calls SoCo during request handling.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID (RINCON_... string) |

**Response (200):**

```json
{
  "uid": "RINCON_C4A81B3D567801400",
  "volume": 42,
  "mute": false
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosVolumeResponse
interface SonosVolumeResponse {
  uid: string;
  volume: number | null;  // 0-100
  mute: boolean | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_C4A81B3D567801400/volume \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found in cache |
| `503 Service Unavailable` | Speakers UNREACHABLE or speaker data not yet available |

---

## Transport Controls

Transport commands require the zone **coordinator** UID as `group_id`. If a member/slave UID is supplied, the API returns 422 with the correct coordinator UID. See [Coordinator Routing](#coordinator-routing) for details.

---

### POST /zones/{group_id}/play

Resumes playback on a zone coordinator.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Request body:** None

**Response (200):**

```json
{
  "status": "ok",
  "group_id": "RINCON_C4A81B3D567801400:1"
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/play \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `group_id` is a slave/member UID (see 422 body below) |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

**422 not_coordinator response body:**

```json
{
  "detail": {
    "error": "not_coordinator",
    "group_id": "RINCON_D2F93C5E890A01400",
    "coordinator_uid": "RINCON_C4A81B3D567801400:1",
    "message": "UID 'RINCON_D2F93C5E890A01400' is a zone member, not a coordinator. Use coordinator_uid 'RINCON_C4A81B3D567801400:1'"
  }
}
```

---

### POST /zones/{group_id}/pause

Pauses playback on a zone coordinator.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Request body:** None

**Response (200):**

```json
{
  "status": "ok",
  "group_id": "RINCON_C4A81B3D567801400:1"
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/pause \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `group_id` is a slave/member UID |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

### POST /zones/{group_id}/stop

Stops playback on a zone coordinator.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Request body:** None

**Response (200):**

```json
{
  "status": "ok",
  "group_id": "RINCON_C4A81B3D567801400:1"
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/stop \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `group_id` is a slave/member UID |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

### POST /zones/{group_id}/next

Skips to the next track on a zone coordinator.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Request body:** None

**Response (200):**

```json
{
  "status": "ok",
  "group_id": "RINCON_C4A81B3D567801400:1"
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/next \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `group_id` is a slave/member UID |
| `502 Bad Gateway` | SoCo command failed (e.g. no next track in queue) |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

### POST /zones/{group_id}/previous

Skips to the previous track on a zone coordinator.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Request body:** None

**Response (200):**

```json
{
  "status": "ok",
  "group_id": "RINCON_C4A81B3D567801400:1"
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/previous \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `group_id` is a slave/member UID |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

## Volume Controls

### PUT /speakers/{uid}/volume

Sets the volume on a single speaker (0-100). Proxies directly to the speaker via SoCo.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID (RINCON_... string) |

**Request body:**

```json
{
  "volume": 35
}
```

```typescript
// Source: api/providers/sonos/routes.py — SetVolumeRequest
interface SetVolumeRequest {
  volume: number; // 0-100 (required)
}
```

**Response (200):**

```json
{
  "status": "ok",
  "uid": "RINCON_C4A81B3D567801400",
  "volume": 35
}
```

**curl:**

```bash
curl -X PUT YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_C4A81B3D567801400/volume \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"volume": 35}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found |
| `422 Unprocessable Entity` | `volume` is outside 0-100 range or missing |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

---

### PUT /speakers/{uid}/mute

Sets the mute state on a single speaker. Proxies directly to the speaker via SoCo.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID (RINCON_... string) |

**Request body:**

```json
{
  "mute": true
}
```

```typescript
// Source: api/providers/sonos/routes.py — SetMuteRequest
interface SetMuteRequest {
  mute: boolean; // required
}
```

**Response (200):**

```json
{
  "status": "ok",
  "uid": "RINCON_C4A81B3D567801400",
  "mute": true
}
```

**curl:**

```bash
# Mute
curl -X PUT YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_C4A81B3D567801400/mute \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mute": true}'

# Unmute
curl -X PUT YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_C4A81B3D567801400/mute \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mute": false}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found |
| `422 Unprocessable Entity` | `mute` is missing or not a boolean |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

---

### PUT /zones/{group_id}/volume

Sets volume on all speakers in a zone simultaneously. Iterates per member -- partial failure returns 502 with details on which speakers failed.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Request body:**

```json
{
  "volume": 30
}
```

**Response (200):**

```json
{
  "status": "ok",
  "group_id": "RINCON_B8E9378A123401400:1",
  "volume": 30,
  "speakers_updated": 3
}
```

**curl:**

```bash
curl -X PUT YOUR_BASE_URL/api/v1/sonos/zones/RINCON_B8E9378A123401400%3A1/volume \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"volume": 30}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Zone `group_id` not found |
| `422 Unprocessable Entity` | `volume` outside 0-100 range |
| `502 Bad Gateway` | One or more speakers failed (see partial_failure body below) |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

**502 partial_failure response body:**

```json
{
  "detail": {
    "error": "partial_failure",
    "failed_speakers": [
      {
        "uid": "RINCON_E5A24D6F123B01400",
        "error": "UPnP Error [802]: ..."
      }
    ]
  }
}
```

> **Note:** Zone volume does NOT gate on coordinator routing. Any `group_id` matching a zone's `group_id` field in `GET /zones` works -- there is no 422 for slave UIDs on this endpoint.

---

## Seek

### PUT /zones/{group_id}/seek

Seeks to an absolute position in the currently playing track. Requires the zone coordinator UID. Returns 422 for invalid format or for content that does not support seek (internet radio, TV audio).

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Request body:**

```json
{
  "position": "0:01:30"
}
```

```typescript
// Source: api/providers/sonos/routes.py — SetSeekRequest
interface SetSeekRequest {
  position: string; // "HH:MM:SS" format (required)
}
```

**Response (200):**

```json
{
  "status": "ok",
  "group_id": "RINCON_C4A81B3D567801400:1",
  "position": "0:01:30"
}
```

**curl:**

```bash
curl -X PUT YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/seek \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"position": "0:01:30"}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | Invalid position format (not HH:MM:SS) |
| `422 Unprocessable Entity` | Content does not support seek (radio, TV audio) |
| `422 Unprocessable Entity` | `group_id` is a slave/member UID |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

**422 invalid format response body:**

```json
{
  "detail": "Invalid position format: '1:30'. Expected HH:MM:SS"
}
```

**422 seek on non-seekable content:**

```json
{
  "detail": "Seek not supported for current content: UPnP Error [711]: Illegal seek target"
}
```

---

## Extended Controls

### GET /speakers/{uid}/eq

Returns EQ settings (bass, treble, loudness) for a speaker. Fetched on-demand from the speaker via SoCo.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID (RINCON_... string) |

**Response (200):**

```json
{
  "uid": "RINCON_C4A81B3D567801400",
  "bass": 2,
  "treble": -1,
  "loudness": true
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosEqResponse
interface SonosEqResponse {
  uid: string;
  bass: number | null;    // -10 to +10
  treble: number | null;  // -10 to +10
  loudness: boolean | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_C4A81B3D567801400/eq \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

---

### PUT /speakers/{uid}/eq

Sets EQ settings on a speaker. All fields are optional -- only non-None fields are written to the speaker (partial update semantics).

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID (RINCON_... string) |

**Request body:** At least one field expected (all fields optional).

```json
{
  "bass": 3,
  "treble": -1,
  "loudness": false
}
```

```typescript
// Source: api/providers/sonos/routes.py — SetEqRequest
interface SetEqRequest {
  bass?: number;     // -10 to +10 (optional)
  treble?: number;   // -10 to +10 (optional)
  loudness?: boolean; // (optional)
}
```

**Examples of partial updates:**

```json
// Set only bass, leave treble and loudness unchanged
{ "bass": 3 }

// Set only loudness
{ "loudness": true }

// Set all three
{ "bass": 2, "treble": -1, "loudness": false }
```

**Response (200):**

```json
{
  "status": "ok",
  "uid": "RINCON_C4A81B3D567801400"
}
```

**curl:**

```bash
curl -X PUT YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_C4A81B3D567801400/eq \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"bass": 3}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found |
| `422 Unprocessable Entity` | `bass` or `treble` outside -10..+10 range |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

---

### GET /zones/{group_id}/play-mode

Returns the current play mode for a zone. Fetched on-demand from the zone coordinator via SoCo.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Response (200):**

```json
{
  "group_id": "RINCON_C4A81B3D567801400:1",
  "play_mode": "SHUFFLE"
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosPlayModeResponse
interface SonosPlayModeResponse {
  group_id: string;
  play_mode: "NORMAL" | "REPEAT_ALL" | "SHUFFLE" | "SHUFFLE_NOREPEAT" | "SHUFFLE_REPEAT_ONE" | "REPEAT_ONE" | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/play-mode \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Zone `group_id` not a known coordinator |
| `422 Unprocessable Entity` | `group_id` is a slave/member UID |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

### PUT /zones/{group_id}/play-mode

Sets the play mode for a zone coordinator.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Request body:**

```json
{
  "mode": "SHUFFLE"
}
```

```typescript
// Source: api/providers/sonos/routes.py — SetPlayModeRequest
interface SetPlayModeRequest {
  mode: "NORMAL" | "REPEAT_ALL" | "SHUFFLE" | "SHUFFLE_NOREPEAT" | "SHUFFLE_REPEAT_ONE" | "REPEAT_ONE";
}
```

**Play mode values:**

| Value | Behavior |
|-------|----------|
| `NORMAL` | Sequential playback, no repeat |
| `REPEAT_ALL` | Repeat the entire queue |
| `SHUFFLE` | Shuffle and repeat |
| `SHUFFLE_NOREPEAT` | Shuffle without repeat |
| `SHUFFLE_REPEAT_ONE` | Shuffle and repeat current track |
| `REPEAT_ONE` | Repeat current track |

**Response (200):**

```json
{
  "status": "ok",
  "group_id": "RINCON_C4A81B3D567801400:1",
  "mode": "SHUFFLE"
}
```

**curl:**

```bash
curl -X PUT YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/play-mode \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "SHUFFLE"}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Zone `group_id` not a known coordinator |
| `422 Unprocessable Entity` | Invalid `mode` value or `group_id` is a slave UID |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

### GET /zones/{group_id}/queue

Returns the playback queue for a zone with limit/offset pagination. Fetched on-demand from the zone coordinator via SoCo.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | integer | `100` | Max items per page (1-1000) |
| `offset` | integer | `0` | Items to skip |

**Response (200):**

```json
{
  "group_id": "RINCON_C4A81B3D567801400:1",
  "items": [
    {
      "position": 1,
      "title": "Nuvole Bianche",
      "artist": "Ludovico Einaudi",
      "album": "Islands",
      "album_art_url": "http://192.168.178.72:1400/getaa?..."
    },
    {
      "position": 2,
      "title": "Experience",
      "artist": "Ludovico Einaudi",
      "album": "In A Time Lapse",
      "album_art_url": "http://192.168.178.72:1400/getaa?..."
    }
  ],
  "total": 24,
  "limit": 100,
  "offset": 0
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosQueueItemResponse
interface SonosQueueItemResponse {
  position: number;
  title: string | null;
  artist: string | null;
  album: string | null;
  album_art_url: string | null;
}

// Source: api/providers/sonos/routes.py — SonosQueueResponse
interface SonosQueueResponse {
  group_id: string;
  items: SonosQueueItemResponse[];
  total: number;
  limit: number;
  offset: number;
}
```

**curl:**

```bash
# First 100 items
curl YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/queue \
  -H "X-API-Key: YOUR_API_KEY"

# Page 2: items 101-200
curl "YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/queue?limit=100&offset=100" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Zone `group_id` not a known coordinator |
| `422 Unprocessable Entity` | `group_id` is a slave/member UID |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

### GET /speakers/{uid}/home-theater

Returns home theater audio settings for a soundbar speaker. Only available for speakers with `role: "soundbar"` -- returns 404 for non-soundbar speakers.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID -- must be a soundbar |

**Response (200):**

```json
{
  "uid": "RINCON_B8E9378A123401400",
  "night_mode": false,
  "dialog_mode": true,
  "sub_enabled": true,
  "sub_gain": 0,
  "surround_enabled": true,
  "surround_volume_tv": 0,
  "surround_volume_music": -3
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosHomeTheaterResponse
interface SonosHomeTheaterResponse {
  uid: string;
  night_mode: boolean | null;
  dialog_mode: boolean | null;
  sub_enabled: boolean | null;
  sub_gain: number | null;              // -15 to +15
  surround_enabled: boolean | null;
  surround_volume_tv: number | null;    // -15 to +15
  surround_volume_music: number | null; // -15 to +15
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_B8E9378A123401400/home-theater \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found (body: `{"detail": "Speaker RINCON_xxx not found"}`) |
| `404 Not Found` | Speaker exists but is not a soundbar (body: `{"detail": "Not a soundbar speaker"}`) |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

---

### PUT /speakers/{uid}/home-theater

Sets home theater audio settings on a soundbar. All fields are optional (partial update). Only non-None fields are written to the speaker.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID -- must be a soundbar |

**Request body:** All fields optional.

```json
{
  "night_mode": false,
  "dialog_mode": true,
  "sub_enabled": true,
  "sub_gain": 0,
  "surround_enabled": true,
  "surround_volume_tv": 0,
  "surround_volume_music": -3
}
```

```typescript
// Source: api/providers/sonos/routes.py — SetHomeTheaterRequest
interface SetHomeTheaterRequest {
  night_mode?: boolean;
  dialog_mode?: boolean;
  sub_enabled?: boolean;
  sub_gain?: number;              // -15 to +15 (optional)
  surround_enabled?: boolean;
  surround_volume_tv?: number;    // -15 to +15 (optional)
  surround_volume_music?: number; // -15 to +15 (optional)
}
```

**Response (200):**

```json
{
  "status": "ok",
  "uid": "RINCON_B8E9378A123401400"
}
```

**curl:**

```bash
# Enable night mode only
curl -X PUT YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_B8E9378A123401400/home-theater \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"night_mode": true}'

# Adjust sub gain and surround levels
curl -X PUT YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_B8E9378A123401400/home-theater \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sub_gain": 3, "surround_volume_tv": 2}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found or not a soundbar (see [GET /home-theater](#get-speakersuidhome-theater) for body shapes) |
| `422 Unprocessable Entity` | `sub_gain`, `surround_volume_tv`, or `surround_volume_music` outside -15..+15 range |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

---

### POST /speakers/{uid}/source

Switches the audio source on a soundbar speaker (TV HDMI arc or line-in). Only available for speakers with `role: "soundbar"`.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID -- must be a soundbar |

**Request body:**

```json
{
  "source": "tv"
}
```

```typescript
// Source: api/providers/sonos/routes.py — SwitchSourceRequest
interface SwitchSourceRequest {
  source: "tv" | "line_in"; // required
}
```

**Response (200):**

```json
{
  "status": "ok",
  "uid": "RINCON_B8E9378A123401400",
  "source": "tv"
}
```

**curl:**

```bash
# Switch to TV audio
curl -X POST YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_B8E9378A123401400/source \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "tv"}'

# Switch to line-in
curl -X POST YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_B8E9378A123401400/source \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "line_in"}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found or not a soundbar |
| `422 Unprocessable Entity` | `source` is not `"tv"` or `"line_in"` |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

---

### POST /speakers/{uid}/join

Joins a speaker to another speaker's group (creates a stereo pair or multi-room group). Both speakers must exist.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID to join (the follower) |

**Request body:**

```json
{
  "target_uid": "RINCON_C4A81B3D567801400"
}
```

```typescript
// Source: api/providers/sonos/routes.py — JoinRequest
interface JoinRequest {
  target_uid: string; // UID of the group to join (required)
}
```

**Response (200):**

```json
{
  "status": "ok",
  "uid": "RINCON_D2F93C5E890A01400"
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_D2F93C5E890A01400/join \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"target_uid": "RINCON_C4A81B3D567801400"}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | `uid` not found |
| `404 Not Found` | `target_uid` not found |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

---

### POST /speakers/{uid}/unjoin

Removes a speaker from its current group, making it an independent player.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `uid` | string | Speaker UID to unjoin |

**Request body:** None

**Response (200):**

```json
{
  "status": "ok",
  "uid": "RINCON_D2F93C5E890A01400"
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/sonos/speakers/RINCON_D2F93C5E890A01400/unjoin \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Speaker UID not found |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or data not yet available |

---

### GET /zones/{group_id}/sleep-timer

Returns the remaining sleep timer for a zone in seconds. Fetched on-demand from the zone coordinator via SoCo. Returns `remaining_seconds: null` when no timer is active.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Response (200 -- timer active):**

```json
{
  "group_id": "RINCON_C4A81B3D567801400:1",
  "remaining_seconds": 1800
}
```

**Response (200 -- no timer set):**

```json
{
  "group_id": "RINCON_C4A81B3D567801400:1",
  "remaining_seconds": null
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosSleepTimerResponse
interface SonosSleepTimerResponse {
  group_id: string;
  remaining_seconds: number | null; // null when no timer is active
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/sleep-timer \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Zone `group_id` not a known coordinator |
| `422 Unprocessable Entity` | `group_id` is a slave/member UID |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

### PUT /zones/{group_id}/sleep-timer

Sets or cancels the sleep timer for a zone coordinator. `duration=0` cancels an active timer.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Zone coordinator UID |

**Request body:**

```json
{
  "duration": 3600
}
```

```typescript
// Source: api/providers/sonos/routes.py — SetSleepTimerRequest
interface SetSleepTimerRequest {
  duration: number; // 0 to 86399 seconds (0 = cancel timer)
}
```

**Response (200):**

```json
{
  "status": "ok",
  "group_id": "RINCON_C4A81B3D567801400:1"
}
```

**curl:**

```bash
# Set 60-minute sleep timer
curl -X PUT YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/sleep-timer \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"duration": 3600}'

# Cancel sleep timer
curl -X PUT YOUR_BASE_URL/api/v1/sonos/zones/RINCON_C4A81B3D567801400%3A1/sleep-timer \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"duration": 0}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Zone `group_id` not a known coordinator |
| `422 Unprocessable Entity` | `duration` outside 0-86399 range or `group_id` is a slave UID |
| `502 Bad Gateway` | SoCo command failed |
| `503 Service Unavailable` | Speakers UNREACHABLE or zone data not yet available |

---

## History

### GET /history

Returns volume or playback history with automatic granularity selection for volume data. The `type` parameter is required -- it selects between two distinct data shapes.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | **required** | Data type: `"volume"` or `"playback"` |
| `speaker_uid` | string | none | Filter volume history to a single speaker UID |
| `group_id` | string | none | Filter playback history to a single zone group ID |
| `start` | integer | none | Unix epoch start timestamp (inclusive) |
| `end` | integer | none | Unix epoch end timestamp (exclusive) |
| `limit` | integer | `100` | Max items per page (1-1000) |
| `offset` | integer | `0` | Items to skip |

> **Important:** Timestamp params are `start` and `end` (not `from`/`to`). Pagination uses `limit`/`offset` (not `page`/`page_size`). Both differ from the Hue history endpoint.

#### Auto-Granularity (volume type only)

| Time Window | Granularity | Data Source |
|-------------|-------------|-------------|
| <= 48 hours | `raw` | Per-poll per-speaker readings (~30s interval) |
| <= 30 days | `hourly` | Hourly aggregations per speaker |
| > 30 days | `daily` | Daily aggregations per speaker |
| No `start`/`end` (unbounded) | `daily` | Window = now - 0 = very large |

Playback history is always `raw` (one event per track change -- not time-series).

**Response (200 -- volume, raw granularity):**

```json
{
  "items": [
    {
      "timestamp": 1774000000,
      "speaker_uid": "RINCON_C4A81B3D567801400",
      "granularity": "raw",
      "volume": 42,
      "mute": 0,
      "avg_volume": null,
      "min_volume": null,
      "max_volume": null,
      "muted_minutes": null,
      "sample_count": null
    }
  ],
  "total": 2880,
  "granularity": "raw",
  "limit": 100,
  "offset": 0
}
```

**Response (200 -- volume, hourly granularity):**

```json
{
  "items": [
    {
      "timestamp": 1773997200,
      "speaker_uid": "RINCON_C4A81B3D567801400",
      "granularity": "hourly",
      "volume": null,
      "mute": null,
      "avg_volume": 38.5,
      "min_volume": 25,
      "max_volume": 55,
      "muted_minutes": 12.0,
      "sample_count": 120
    }
  ],
  "total": 672,
  "granularity": "hourly",
  "limit": 100,
  "offset": 0
}
```

**Response (200 -- playback type):**

```json
{
  "items": [
    {
      "timestamp": 1774000000,
      "group_id": "RINCON_C4A81B3D567801400:1",
      "transport_state": "PLAYING",
      "title": "Nuvole Bianche",
      "artist": "Ludovico Einaudi",
      "album": "Islands",
      "source_type": "streaming",
      "duration_seconds": 355
    },
    {
      "timestamp": 1773999645,
      "group_id": "RINCON_C4A81B3D567801400:1",
      "transport_state": "PAUSED_PLAYBACK",
      "title": "Nuvole Bianche",
      "artist": "Ludovico Einaudi",
      "album": "Islands",
      "source_type": "streaming",
      "duration_seconds": null
    }
  ],
  "total": 48,
  "granularity": "raw",
  "limit": 100,
  "offset": 0
}
```

```typescript
// Source: api/providers/sonos/routes.py — SonosVolumeHistoryItem
interface SonosVolumeHistoryItem {
  timestamp: number;        // Unix epoch int
  speaker_uid: string;
  granularity: "raw" | "hourly" | "daily";

  // Raw tier only (null for hourly/daily)
  volume: number | null;    // 0-100
  mute: number | null;      // 0 or 1 (integer, NOT boolean)

  // Aggregated tiers only (null for raw)
  avg_volume: number | null;
  min_volume: number | null;
  max_volume: number | null;
  muted_minutes: number | null;
  sample_count: number | null;
}

// Source: api/providers/sonos/routes.py — SonosPlaybackHistoryItem
interface SonosPlaybackHistoryItem {
  timestamp: number;      // Unix epoch int
  group_id: string;
  transport_state: string; // e.g. "PLAYING", "PAUSED_PLAYBACK"
  title: string;
  artist: string;
  album: string;
  source_type: string;
  duration_seconds: number | null;
}

// Source: api/providers/sonos/routes.py — SonosHistoryResponse
interface SonosHistoryResponse {
  items: SonosVolumeHistoryItem[] | SonosPlaybackHistoryItem[];
  total: number;
  granularity: "raw" | "hourly" | "daily";
  limit: number;
  offset: number;
}
```

**Field availability by granularity (volume type):**

| Field | raw | hourly | daily |
|-------|-----|--------|-------|
| `timestamp` | epoch int (poll time) | epoch int (hour start) | epoch int (day start) |
| `speaker_uid` | populated | populated | populated |
| `granularity` | `"raw"` | `"hourly"` | `"daily"` |
| `volume` | 0-100 or null | null | null |
| `mute` | 0 or 1 (integer) | null | null |
| `avg_volume` | null | float or null | float or null |
| `min_volume` | null | int or null | int or null |
| `max_volume` | null | int or null | int or null |
| `muted_minutes` | null | float or null | float or null |
| `sample_count` | null | int or null | int or null |

> **Note:** `mute` is an integer (0 or 1), not a boolean. SQLite stores it as integer; the Pydantic model declares `Optional[int]`.

**curl examples:**

```bash
# Volume history, last 24h (auto-selects raw tier)
NOW=$(date +%s) && START=$((NOW - 86400))
curl "YOUR_BASE_URL/api/v1/sonos/history?type=volume&start=${START}&end=${NOW}" \
  -H "X-API-Key: YOUR_API_KEY"

# Volume history for one speaker, last 7 days (auto-selects hourly tier)
curl "YOUR_BASE_URL/api/v1/sonos/history?type=volume&speaker_uid=RINCON_C4A81B3D567801400&start=$((NOW - 604800))" \
  -H "X-API-Key: YOUR_API_KEY"

# Playback history for one zone
curl "YOUR_BASE_URL/api/v1/sonos/history?type=playback&group_id=RINCON_C4A81B3D567801400%3A1&limit=50" \
  -H "X-API-Key: YOUR_API_KEY"

# Paginate: next page
curl "YOUR_BASE_URL/api/v1/sonos/history?type=volume&limit=100&offset=100" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

History has no error conditions beyond authentication.

---

## Frontend Component Suggestions

| Endpoint Group | Component | Data Mapping | Usage Hint |
|----------------|-----------|--------------|------------|
| Health | StatusBadge + StatCards | `status` -> badge color; `speaker_count`, `group_count`, `last_poll_at` -> stat cards | Green if all speakers reachable; show last_poll_at as relative time |
| Discovery: Speakers | Table | `speakers[]` -> rows; columns: name, model, ip, zone, is_coordinator (Badge), state (StatusBadge) | Sortable by zone; highlight coordinator with distinct badge |
| Discovery: Groups and Playback | CardGrid + DataCard | Groups: one card per zone showing name, speaker_count, coordinator. Playback: now-playing card with track, artist, album, album_art image, position/duration | Show album art prominently in playback card; use ProgressBar for track position |
| Volume Controls | Slider + Toggle | volume -> Slider (0-100) per speaker and per zone. Mute -> Toggle per speaker | Show speaker name next to each slider; group zone sliders together |
| Transport Controls | Button group | play, pause, stop, previous, next -> icon buttons in a horizontal group | Disable buttons based on current transport state (e.g., disable pause when stopped) |
| Seek | Slider | position -> Slider (0 to duration). Display current position / total duration as formatted time (mm:ss) | Update slider position in real-time during playback |
| Extended Controls (EQ, Play Mode, Queue, Home Theater, Sleep Timer) | Slider + Select + List + DataCard + CountdownTimer | EQ: bass/treble/loudness -> Sliders (-10 to +10). Play mode: shuffle (Toggle), repeat (Select: off/one/all). Queue: `tracks[]` -> List. Home theater: DataCard with surround config. Sleep timer: CountdownTimer with remaining | Group EQ sliders in a panel; queue list should support drag-to-reorder |
| Grouping | Select | Add/remove speakers from zone -> multi-Select with available speakers | Show current zone members; allow add/remove with immediate feedback |
| Historical Data | LineChart + Select | `data_points[]` -> time series. Type selector: volume, playback | API returns auto-granularity data -- chart must handle variable time intervals (raw within 48h, hourly within 30d, daily beyond 30d). Add type filter Select |

---

## Next.js Fetch Snippets

All snippets use the `X-API-Key` header for server-to-server authentication from a Next.js backend.

### Discovery: Fetch All Devices

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/sonos/devices`, {
  headers: { "X-API-Key": process.env.API_KEY! },
});
if (!res.ok) throw new Error(`Sonos devices error: ${res.status}`);
const devices = await res.json() as SonosDeviceResponse[];

// Filter to visible speakers only
const visible = devices.filter(d => d.is_visible);
// Find the soundbar
const soundbar = devices.find(d => d.role === "soundbar");
```

### Playback Monitoring: Fetch Zone State

```typescript
// Get zones to find coordinator UID
const zonesRes = await fetch(`${process.env.API_BASE_URL}/api/v1/sonos/zones`, {
  headers: { "X-API-Key": process.env.API_KEY! },
});
if (!zonesRes.ok) throw new Error(`Sonos zones error: ${zonesRes.status}`);
const zones = await zonesRes.json() as SonosZoneResponse[];

// Use coordinator_uid as group_id for playback query
const zone = zones[0];
const playbackRes = await fetch(
  `${process.env.API_BASE_URL}/api/v1/sonos/zones/${encodeURIComponent(zone.group_id)}/playback`,
  { headers: { "X-API-Key": process.env.API_KEY! } }
);
if (!playbackRes.ok) throw new Error(`Sonos playback error: ${playbackRes.status}`);
const playback = await playbackRes.json() as SonosPlaybackResponse;

// Fetch volume for the coordinator
const volumeRes = await fetch(
  `${process.env.API_BASE_URL}/api/v1/sonos/speakers/${zone.coordinator_uid}/volume`,
  { headers: { "X-API-Key": process.env.API_KEY! } }
);
const volume = await volumeRes.json() as SonosVolumeResponse;
```

### Transport Control: Play/Pause Toggle

```typescript
async function togglePlayPause(groupId: string, isPlaying: boolean): Promise<void> {
  const action = isPlaying ? "pause" : "play";
  const res = await fetch(
    `${process.env.API_BASE_URL}/api/v1/sonos/zones/${encodeURIComponent(groupId)}/${action}`,
    {
      method: "POST",
      headers: { "X-API-Key": process.env.API_KEY! },
    }
  );

  if (res.status === 422) {
    const err = await res.json();
    if (err.detail?.error === "not_coordinator") {
      // Retry with the correct coordinator UID
      throw new Error(`Use coordinator_uid: ${err.detail.coordinator_uid}`);
    }
  }

  if (!res.ok) throw new Error(`Transport command failed: ${res.status}`);
}
```

### Volume Control: Set Speaker Volume

```typescript
async function setSpeakerVolume(uid: string, volume: number): Promise<void> {
  const res = await fetch(
    `${process.env.API_BASE_URL}/api/v1/sonos/speakers/${uid}/volume`,
    {
      method: "PUT",
      headers: {
        "X-API-Key": process.env.API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ volume }),
    }
  );
  if (!res.ok) throw new Error(`Set volume failed: ${res.status}`);
  const result = await res.json();
  // result.volume echoes back the set value
}
```

### History: Fetch Volume History with Auto-Granularity

```typescript
const now = Math.floor(Date.now() / 1000);
const oneDayAgo = now - 86400;

const res = await fetch(
  `${process.env.API_BASE_URL}/api/v1/sonos/history?type=volume&start=${oneDayAgo}&end=${now}&limit=100`,
  { headers: { "X-API-Key": process.env.API_KEY! } }
);
if (!res.ok) throw new Error(`Sonos history error: ${res.status}`);
const history = await res.json() as SonosHistoryResponse;

// history.granularity will be "raw" for a 24h window
// Paginate using limit/offset (not page/page_size)
if (history.total > 100) {
  const nextRes = await fetch(
    `${process.env.API_BASE_URL}/api/v1/sonos/history?type=volume&start=${oneDayAgo}&end=${now}&limit=100&offset=100`,
    { headers: { "X-API-Key": process.env.API_KEY! } }
  );
}
```

---

## Field Verification Status

> Last checked: 2026-03-20 (phases 78-82)

| Field Group | Confidence | Source | Notes |
|-------------|------------|--------|-------|
| `SonosHealthResponse` fields (`connected`, `data_freshness`, `device_count`, `last_poll_at`, `last_success_at`) | HIGH | `SonosHealthResponse` Pydantic model in `routes.py` | VERIFIED phases 78-82 — all 5 fields confirmed live |
| `SonosDeviceResponse` fields (`uid`, `name`, `ip`, `model`, `firmware`, `serial`, `role`, `is_visible`, `is_coordinator`) | HIGH | `SonosDeviceResponse` Pydantic model in `routes.py` | VERIFIED phases 78-82 — 5 speakers (Beam, Sonos One x2, Sub, surround) |
| `SonosDeviceDetailResponse` audio fields (`volume`, `mute`, `bass`, `treble`, `loudness`) | HIGH | `SonosDeviceDetailResponse` extends `SonosDeviceResponse` | VERIFIED phase 78 — on-demand SoCo fetch |
| `SonosZoneResponse` fields (`group_id`, `label`, `coordinator_uid`, `coordinator_name`, `member_count`, `members`) | HIGH | `SonosZoneResponse` Pydantic model in `routes.py` | VERIFIED phases 78-82 — zone topology confirmed |
| `SonosPlaybackResponse` fields (`group_id`, `transport_state`, `title`, `artist`, `album`, `album_art_url`, `position`, `duration`, `source_type`) | HIGH | `SonosPlaybackResponse` Pydantic model in `routes.py` | VERIFIED phase 79 — coordinator-only playback routing confirmed |
| `SonosVolumeResponse` fields (`uid`, `volume`, `mute`) | HIGH | `SonosVolumeResponse` Pydantic model in `routes.py` | VERIFIED phase 79 — all 5 speakers incl. sub and surrounds |
| Transport control responses (`{"status":"ok","group_id":"..."}`) | HIGH | Route handler return dicts in `routes.py` | VERIFIED phase 80 — play/pause/stop/next/previous |
| Volume control responses (speaker volume, mute, zone volume with `speakers_updated`) | HIGH | Route handler return dicts in `routes.py` | VERIFIED phase 80 — partial failure with `failed_speakers` documented |
| Seek 422 responses (format validation and UPnPException) | HIGH | `_POSITION_RE` and `SoCoUPnPException` catch in `routes.py` | VERIFIED phase 80 — two distinct 422 paths |
| `SonosEqResponse` fields (`uid`, `bass`, `treble`, `loudness`) | HIGH | `SonosEqResponse` Pydantic model in `routes.py` | VERIFIED phase 82 |
| `SonosPlayModeResponse` fields (`group_id`, `play_mode`) | HIGH | `SonosPlayModeResponse` Pydantic model in `routes.py` | VERIFIED phase 82 |
| `SonosQueueResponse` and `SonosQueueItemResponse` fields | HIGH | Pydantic models in `routes.py` | VERIFIED phase 82 — limit/offset pagination |
| `SonosHomeTheaterResponse` fields (7 audio properties) | HIGH | `SonosHomeTheaterResponse` Pydantic model in `routes.py` | VERIFIED phase 82 — soundbar gating via `_resolve_soundbar_or_404` |
| `SonosSleepTimerResponse` fields (`group_id`, `remaining_seconds`) | HIGH | `SonosSleepTimerResponse` Pydantic model in `routes.py` | VERIFIED phase 82 — `duration=0` cancels timer |
| `SonosVolumeHistoryItem` fields and `SonosPlaybackHistoryItem` fields | HIGH | Pydantic models in `routes.py` | VERIFIED phase 81 — `mute` is integer 0/1 (not boolean); `start`/`end` query params (not `from`/`to`) |
| Auto-granularity thresholds (48h raw, 30d hourly, >30d daily) | HIGH | `_resolve_sonos_volume_granularity()` in `routes.py` | VERIFIED phase 81 |
| 422 not_coordinator error shape (`error`, `group_id`, `coordinator_uid`, `message`) | HIGH | `_resolve_coordinator_or_422()` in `routes.py` | VERIFIED phase 80 — all zone control endpoints |
| 404 not_soundbar error (`"Not a soundbar speaker"`) | HIGH | `_resolve_soundbar_or_404()` in `routes.py` | VERIFIED phase 82 |

**Live verification status:** VERIFIED 2026-03-20 -- All 25 endpoints implemented and tested in phases 78-82. 5 speakers confirmed (Sonos Beam Gen 2, Sonos One Gen 2 x2, Sub Gen 3, one surround).

---

## Common Patterns

### Coordinator Routing

Zone commands (play, pause, stop, next, previous, seek, zone volume, play-mode, queue GET, sleep-timer GET/PUT) require the zone **coordinator** UID as `group_id`. The coordinator UID equals the `group_id` field returned by `GET /zones`.

**The problem:** Sonos zones have multiple members (e.g., a Beam soundbar with a Sub and a surround). If you send a play command using a member/slave UID (like the Sub's UID), the API returns 422.

**The fix:** Always use `coordinator_uid` from `GET /zones` as the `group_id` for zone commands.

```json
// 422 response when slave UID is used as group_id
{
  "detail": {
    "error": "not_coordinator",
    "group_id": "RINCON_E5A24D6F123B01400",
    "coordinator_uid": "RINCON_B8E9378A123401400:1",
    "message": "UID 'RINCON_E5A24D6F123B01400' is a zone member, not a coordinator. Use coordinator_uid 'RINCON_B8E9378A123401400:1'"
  }
}
```

**Recommended flow:**

```typescript
// Step 1: Get zones to find coordinator UID
const zones = await fetchZones();
const zone = zones.find(z => z.coordinator_name === "Camera da letto");

// Step 2: Use coordinator_uid for all zone commands
await fetch(`${BASE_URL}/api/v1/sonos/zones/${encodeURIComponent(zone.group_id)}/play`, {
  method: "POST",
  headers: { "X-API-Key": API_KEY },
});
```

**Endpoints gated on coordinator routing:**

- POST /zones/{group_id}/play
- POST /zones/{group_id}/pause
- POST /zones/{group_id}/stop
- POST /zones/{group_id}/next
- POST /zones/{group_id}/previous
- PUT /zones/{group_id}/seek
- GET /zones/{group_id}/play-mode
- PUT /zones/{group_id}/play-mode
- GET /zones/{group_id}/queue
- GET /zones/{group_id}/sleep-timer
- PUT /zones/{group_id}/sleep-timer

> **Exception:** `PUT /zones/{group_id}/volume` does NOT return 422 for slave UIDs -- it looks up the zone by its `group_id` field directly.

---

### Soundbar Gating

Home theater and source endpoints are only available for speakers with `role: "soundbar"`. Calling them on any other speaker (Sonos One, Sub, surround, Era 100) returns 404.

There are two distinct 404 responses:

```json
// 404: speaker UID is not in the system at all
{ "detail": "Speaker RINCON_xxx not found" }

// 404: speaker exists but is not a soundbar
{ "detail": "Not a soundbar speaker" }
```

**Endpoints gated on soundbar role:**

- GET /speakers/{uid}/home-theater
- PUT /speakers/{uid}/home-theater
- POST /speakers/{uid}/source

**Check before calling:**

```typescript
const devices = await fetchDevices();
const soundbar = devices.find(d => d.role === "soundbar");
if (!soundbar) {
  throw new Error("No soundbar in this Sonos system");
}
// Now use soundbar.uid for home-theater and source endpoints
```

---

### Data Freshness

Read endpoints (health, devices, zones, playback, volume) serve from a 30-second polling cache. `STALE` data returns HTTP **200** (not 503) -- consumers should degrade gracefully.

```typescript
const health = await fetchHealth();
if (health.data_freshness === "STALE") {
  // Show "data may be outdated" indicator
  // Data is still available -- do not block the UI
}
// "UNREACHABLE" is never in the response body -- it produces a 503 HTTP status
```

Use `GET /health` to check freshness before running a dashboard refresh:

- `LIVE` -- data is current (within 90 seconds)
- `STALE` -- speakers were reachable at least once but polling has lapsed
- HTTP 503 -- speakers have been consistently unreachable (3+ poll failures)
