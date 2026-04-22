# Netatmo Provider API

**Base path:** `/api/v1/netatmo`

Netatmo API covering three domains: Energy (thermostat control, room temperature monitoring, and schedule management), Valve Calibration (NRV valve status and calibration commands), and Security Camera (status, streams, snapshots, monitoring, and events). Read endpoints serve from local SQLite cache or background poll cache. Control endpoints proxy to the Netatmo Cloud API.

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/netatmo/health` | OAuth2 token health and provider status | Required |
| `GET` | `/api/v1/netatmo/homesdata` | Home configuration data (rooms, modules, schedules) | Required |
| `GET` | `/api/v1/netatmo/homestatus` | Live home status (temperatures, battery, reachability) | Required |
| `GET` | `/api/v1/netatmo/getthermstate` | Current thermostat state and active schedule | Required |
| `GET` | `/api/v1/netatmo/getroommeasure` | Historical temperature/setpoint measures for a room | Required |
| `GET` | `/api/v1/netatmo/gethomedata` | Full home snapshot (deprecated alias for homesdata+homestatus) | Required |
| `POST` | `/api/v1/netatmo/setroomthermpoint` | Set manual temperature setpoint for a room | Required |
| `POST` | `/api/v1/netatmo/setthermmode` | Set home thermostat mode (schedule/away/hg/manual) | Required |
| `POST` | `/api/v1/netatmo/switchhomeschedule` | Switch active heating schedule | Required |
| `POST` | `/api/v1/netatmo/synchomeschedule` | Sync a schedule definition to the Netatmo cloud | Required |
| `POST` | `/api/v1/netatmo/createnewhomeschedule` | Create a new heating schedule | Required |
| `GET` | `/api/v1/netatmo/valves` | NRV valve status and calibration state | Required |
| `POST` | `/api/v1/netatmo/valves/calibrate` | Trigger calibration for all valves in a home | Required |
| `POST` | `/api/v1/netatmo/valves/{module_id}/calibrate` | Trigger calibration for a single valve | Required |
| `GET` | `/api/v1/netatmo/camera/events` | Paginated security camera event log | Required |
| `GET` | `/api/v1/netatmo/camera/events/{event_id}/snapshot` | Snapshot image URL for a specific event | Required |
| `GET` | `/api/v1/netatmo/camera/status` | Camera connection status and capabilities | Required |
| `GET` | `/api/v1/netatmo/camera/{camera_id}/stream` | Live RTSP stream URL for a camera | Required |
| `GET` | `/api/v1/netatmo/camera/{camera_id}/snapshot` | Latest snapshot URL for a camera | Required |
| `POST` | `/api/v1/netatmo/camera/{camera_id}/monitoring` | Enable or disable camera monitoring | Required |
| `POST` | `/api/v1/netatmo/renamehome` | Rename a home | Required |

---

## Table of Contents

- [Health & Status](#health--status)
- [Read Endpoints](#read-endpoints)
  - [GET /homesdata](#get-homesdata)
  - [GET /homestatus](#get-homestatus)
  - [GET /getthermstate](#get-getthermstate)
  - [GET /getroommeasure](#get-getroommeasure)
  - [GET /gethomedata](#get-gethomedata)
- [Control Endpoints](#control-endpoints)
  - [POST /setroomthermpoint](#post-setroomthermpoint)
  - [POST /setthermmode](#post-setthermmode)
  - [POST /switchhomeschedule](#post-switchhomeschedule)
  - [POST /synchomeschedule](#post-synchomeschedule)
  - [POST /createnewhomeschedule](#post-createnewhomeschedule)
  - [POST /renamehome](#post-renamehome)
- [Valve Calibration](#valve-calibration)
  - [GET /valves](#get-valves)
  - [POST /valves/calibrate](#post-valvescalibrate)
  - [POST /valves/{module_id}/calibrate](#post-valvesmodule_idcalibrate)
- [Security Camera](#security-camera)
  - [GET /camera/status](#get-camerastatus)
  - [GET /camera/{camera_id}/stream](#get-cameracamera_idstream)
  - [GET /camera/{camera_id}/snapshot](#get-cameracamera_idsnapshot)
  - [POST /camera/{camera_id}/monitoring](#post-cameracamera_idmonitoring)
  - [GET /camera/events](#get-cameraevents)
  - [GET /camera/events/{event_id}/snapshot](#get-cameraeventsevents_idsnapshot)

---

## Health & Status

### GET /health

Return Netatmo OAuth2 token health and provider status. Reports token validity, expiry, polling freshness, and rate limit usage.

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "token_status": "valid",
  "expires_at": 1773333857,
  "last_refresh_at": 1773330257,
  "consecutive_failures": 0,
  "last_error": null,
  "provider_status": "ok",
  "data_freshness": "LIVE",
  "token_source": "sqlite",
  "requests_this_hour": 12,
  "rate_limit_ceiling": 400,
  "last_poll_at": 1773330200
}
```

**TypeScript type:**

```typescript
interface NetatmoHealthResponse {
  token_status: "valid" | "expiring" | "expired";
  expires_at: number;           // Unix timestamp
  last_refresh_at: number | null;
  consecutive_failures: number;
  last_error: string | null;
  provider_status: "ok" | "degraded" | "down";
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
  token_source: "sqlite" | "secrets_toml";
  requests_this_hour: number;
  rate_limit_ceiling: number;
  last_poll_at: number | null;  // Present when cache is initialized
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 503 | Netatmo provider not yet initialized | `{"detail": "Netatmo provider not initialized"}` |

---

## Read Endpoints

### GET /homesdata

Return the cached Netatmo homes topology. Served from the background poll cache (TTL: 1 hour) — no live Netatmo API call is made per request.

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "body": {
    "homes": [
      {
        "id": "5a1234567890abcdef012345",
        "name": "Casa Mia",
        "altitude": 200,
        "coordinates": [45.4642, 9.1900],
        "country": "IT",
        "timezone": "Europe/Rome",
        "rooms": [
          {
            "id": "3456789",
            "name": "Soggiorno",
            "type": "livingroom",
            "module_ids": ["09:00:00:aa:bb:cc"]
          },
          {
            "id": "3456790",
            "name": "Camera da letto",
            "type": "bedroom",
            "module_ids": ["09:00:00:aa:bb:dd"]
          }
        ],
        "modules": [
          {
            "id": "09:00:00:aa:bb:cc",
            "type": "NATherm1",
            "name": "Termostato Soggiorno",
            "room_id": "3456789",
            "setup_date": 1645000000,
            "firmware_revision": 65,
            "battery_level": "high"
          }
        ],
        "schedules": [
          {
            "id": "5b9876543210fedcba098765",
            "name": "Giornaliero",
            "selected": true,
            "type": "therm",
            "timetable": []
          }
        ]
      }
    ],
    "user": {
      "email": "user@example.com",
      "language": "it-IT",
      "locale": "it-IT",
      "feel_like_algorithm": 0,
      "unit_pressure": 0,
      "unit_system": 0,
      "unit_wind": 0
    }
  },
  "status": "ok",
  "time_exec": 0.043,
  "time_server": 1773330200
}
```

**TypeScript type:**

```typescript
interface NetatmoRoom {
  id: string;
  name: string;
  type: string;
  module_ids: string[];
}

interface NetatmoModule {
  id: string;
  type: string;           // "NATherm1" | "NRV" | etc.
  name: string;
  room_id: string;
  setup_date: number;
  firmware_revision: number;
  battery_level: string;
}

interface NetatmoSchedule {
  id: string;
  name: string;
  selected: boolean;
  type: string;
  timetable: object[];
}

interface NetatmoHome {
  id: string;
  name: string;
  rooms: NetatmoRoom[];
  modules: NetatmoModule[];
  schedules: NetatmoSchedule[];
}

interface NetatmoHomesdataResponse {
  body: { homes: NetatmoHome[] };
  status: string;
  time_exec: number;
  time_server: number;
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/homesdata \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 503 | Provider not initialized, DOWN, or topology not yet loaded | `{"detail": "Topology not yet available — waiting for first poll"}` |

---

### GET /homestatus

Return the latest room temperature state from the local SQLite database. Served entirely from SQLite — no live Netatmo API call per request. Returns an empty rooms list (HTTP 200) when no measurements have been recorded yet.

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "rooms": [
    {
      "home_id": "5a1234567890abcdef012345",
      "room_id": "3456789",
      "room_name": "Soggiorno",
      "temperature": 21.4,
      "therm_setpoint_temperature": 20.0,
      "heating_power_request": 0,
      "timestamp": 1773330000
    },
    {
      "home_id": "5a1234567890abcdef012345",
      "room_id": "3456790",
      "room_name": "Camera da letto",
      "temperature": 19.2,
      "therm_setpoint_temperature": 18.0,
      "heating_power_request": 0,
      "timestamp": 1773330000
    }
  ],
  "data_freshness": "LIVE"
}
```

> Field names are raw SQLite column names from `netatmo_measurements`. `therm_setpoint_temperature` is the DB column name (not aliased to `setpoint`). `timestamp` is the Unix epoch of the poll cycle.

**TypeScript type:**

```typescript
interface NetatmoRoomMeasurement {
  home_id: string;
  room_id: string;
  room_name: string | null;
  temperature: number | null;
  therm_setpoint_temperature: number | null;
  heating_power_request: number | null;
  timestamp: number;           // Unix timestamp of the measurement
  custom_name: string | null;  // Custom name from device registry (keyed by module_id)
  device_type: string | null;  // Device type slug from registry
}

interface NetatmoHomestatusResponse {
  rooms: NetatmoRoomMeasurement[];
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/homestatus \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 503 | Provider not initialized or DOWN | `{"detail": "Netatmo provider is currently unavailable"}` |

---

### GET /getthermstate

Proxy a `getthermstate` call to the Netatmo Energy API. Returns the current thermostat setpoint and program for the given device. Makes a live API call to Netatmo.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `device_id` | string | Yes | Netatmo module device ID (NATherm1 or NRV), from `/homesdata` modules list |

**Response JSON:**

```json
{
  "body": {
    "status": "ok",
    "setpoint": {
      "setpoint_mode": "manual",
      "setpoint_temp": 21.0,
      "setpoint_endtime": 1773333857
    },
    "therm_program_list": [
      {
        "program_id": "5b9876543210fedcba098765",
        "name": "Giornaliero",
        "selected": 1,
        "timetable": []
      }
    ],
    "device_id": "09:00:00:aa:bb:cc"
  },
  "status": "ok",
  "time_exec": 0.062,
  "time_server": 1773330200
}
```

**TypeScript type:**

```typescript
interface NetatmoSetpoint {
  setpoint_mode: string;
  setpoint_temp: number | null;
  setpoint_endtime: number | null;
}

interface NetatmoThermProgram {
  program_id: string;
  name: string;
  selected: number;
  timetable: object[];
}

interface NetatmoThermstateResponse {
  body: {
    status: string;
    setpoint: NetatmoSetpoint;
    therm_program_list: NetatmoThermProgram[];
    device_id: string;
  };
  status: string;
  time_exec: number;
  time_server: number;
}
```

**curl:**

```bash
curl -s "YOUR_BASE_URL/api/v1/netatmo/getthermstate?device_id=YOUR_DEVICE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 503 | Provider not initialized, DOWN, or Netatmo API unreachable | `{"detail": "Netatmo API unavailable: ..."}` |

---

### GET /getroommeasure

Return paginated temperature history for a room from local SQLite. No live API call — served entirely from the local measurement database.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `room_id` | string | — | **Required.** Netatmo room ID |
| `scale` | string | `1hour` | Aggregation scale: `max`, `30min`, `1hour`, `1day` |
| `start` | integer | null | Start Unix timestamp (inclusive) |
| `end` | integer | null | End Unix timestamp (inclusive) |
| `limit` | integer | `100` | Max rows to return (1–1000) |
| `offset` | integer | `0` | Row offset for pagination |

**Response JSON (scale=max or scale=30min — raw measurements table):**

```json
{
  "items": [
    {
      "home_id": "5a1234567890abcdef012345",
      "room_id": "3456789",
      "room_name": "Soggiorno",
      "temperature": 21.4,
      "therm_setpoint_temperature": 20.0,
      "heating_power_request": 0,
      "timestamp": 1773330000
    },
    {
      "home_id": "5a1234567890abcdef012345",
      "room_id": "3456789",
      "room_name": "Soggiorno",
      "temperature": 21.1,
      "therm_setpoint_temperature": 20.0,
      "heating_power_request": 0,
      "timestamp": 1773329700
    }
  ],
  "total": 8640,
  "limit": 100,
  "offset": 0
}
```

**Response JSON (scale=1hour — hourly aggregation table):**

```json
{
  "items": [
    {
      "home_id": "5a1234567890abcdef012345",
      "room_id": "3456789",
      "room_name": "Soggiorno",
      "avg_temperature": 21.3,
      "min_temperature": 20.8,
      "max_temperature": 21.7,
      "avg_heating_power": 5.2,
      "sample_count": 12,
      "hour_timestamp": 1773326400
    }
  ],
  "total": 168,
  "limit": 100,
  "offset": 0
}
```

**Response JSON (scale=1day — daily aggregation table):**

```json
{
  "items": [
    {
      "home_id": "5a1234567890abcdef012345",
      "room_id": "3456789",
      "room_name": "Soggiorno",
      "avg_temperature": 20.5,
      "min_temperature": 18.2,
      "max_temperature": 22.1,
      "avg_heating_power": 12.4,
      "sample_count": 288,
      "day_timestamp": 1773244800
    }
  ],
  "total": 30,
  "limit": 100,
  "offset": 0
}
```

> The timestamp field name and available columns vary by `scale`. Raw tiers (`max`, `30min`) return individual measurement columns with `timestamp`. Aggregation tiers (`1hour`, `1day`) return statistical summaries with `hour_timestamp` / `day_timestamp` respectively. All tiers include `home_id`, `room_id`, and `room_name`.

**TypeScript types:**

```typescript
// Raw measurement item (scale=max or scale=30min)
interface NetatmoRawMeasurement {
  home_id: string;
  room_id: string;
  room_name: string | null;
  temperature: number | null;
  therm_setpoint_temperature: number | null;
  heating_power_request: number | null;
  timestamp: number;           // Unix timestamp of the measurement
}

// Hourly aggregation item (scale=1hour)
interface NetatmoHourlyMeasurement {
  home_id: string;
  room_id: string;
  room_name: string | null;
  avg_temperature: number | null;
  min_temperature: number | null;
  max_temperature: number | null;
  avg_heating_power: number | null;
  sample_count: number;
  hour_timestamp: number;      // Unix timestamp of the hour start
}

// Daily aggregation item (scale=1day)
interface NetatmoDailyMeasurement {
  home_id: string;
  room_id: string;
  room_name: string | null;
  avg_temperature: number | null;
  min_temperature: number | null;
  max_temperature: number | null;
  avg_heating_power: number | null;
  sample_count: number;
  day_timestamp: number;       // Unix timestamp of the day start
}

type NetatmoMeasurement = NetatmoRawMeasurement | NetatmoHourlyMeasurement | NetatmoDailyMeasurement;

interface RoomMeasureResponse {
  items: NetatmoMeasurement[];
  total: number;
  limit: number;
  offset: number;
}
```

**curl:**

```bash
curl -s "YOUR_BASE_URL/api/v1/netatmo/getroommeasure?room_id=YOUR_ROOM_ID&scale=1hour&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 400 | Invalid scale value (must be one of: 1day, 1hour, 30min, max) | `{"detail": "Invalid scale '5min'. Must be one of: 1day, 1hour, 30min, max"}` |
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 503 | Provider not initialized or DOWN | `{"detail": "Netatmo provider is currently unavailable"}` |

---

### GET /gethomedata

Proxy a `gethomedata` call to the Netatmo Security API. Returns home security data including cameras, persons, and smoke detectors. Makes a live API call to Netatmo.

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "body": {
    "homes": [
      {
        "id": "5a1234567890abcdef012345",
        "cameras": [],
        "smokedetectors": [],
        "persons": []
      }
    ],
    "global_info": {
      "show_tags": false
    }
  },
  "status": "ok",
  "time_exec": 0.051,
  "time_server": 1773330200
}
```

**TypeScript type:**

```typescript
interface NetatmoHomedataResponse {
  body: {
    homes: Array<{
      id: string;
      cameras: object[];
      smokedetectors: object[];
      persons: object[];
    }>;
    global_info: object;
  };
  status: string;
  time_exec: number;
  time_server: number;
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/gethomedata \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 503 | Provider not initialized, DOWN, or Netatmo API unreachable | `{"detail": "Netatmo API unavailable: ..."}` |

---

## Control Endpoints

### POST /setroomthermpoint

Set the thermostat setpoint for a specific room. Validates `temp` in [5.0, 30.0] and `mode` in `["manual", "home"]` before any Netatmo API call.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

```json
{
  "home_id": "5a1234567890abcdef012345",
  "room_id": "3456789",
  "mode": "manual",
  "temp": 21.5,
  "endtime": 1773333857
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `home_id` | string | Yes | Netatmo home ID (from `/homesdata`) |
| `room_id` | string | Yes | Netatmo room ID (from `/homesdata`) |
| `mode` | string | Yes | `"manual"` or `"home"` |
| `temp` | number | No | Target temperature in °C (5.0–30.0). Required when mode is `"manual"` |
| `endtime` | integer | No | Unix timestamp when manual mode expires |

**TypeScript type:**

```typescript
interface SetRoomThermpointRequest {
  home_id: string;
  room_id: string;
  mode: "manual" | "home";
  temp?: number;       // 5.0–30.0
  endtime?: number;    // Unix timestamp
}
```

**Response JSON:**

```json
{
  "status": "ok",
  "time_exec": 0.074,
  "time_server": 1773330257
}
```

**curl:**

```bash
curl -s -X POST YOUR_BASE_URL/api/v1/netatmo/setroomthermpoint \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "home_id": "YOUR_HOME_ID",
    "room_id": "YOUR_ROOM_ID",
    "mode": "manual",
    "temp": 21.5,
    "endtime": 1773333857
  }'
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 422 | Validation failed (e.g. temp out of range, invalid mode) | `{"detail": [{"msg": "..."}]}` |
| 503 | Provider not initialized, DOWN, or Netatmo API unreachable | `{"detail": "Netatmo API unavailable: ..."}` |

---

### POST /setthermmode

Set the global thermostat mode for a home. After setting the mode, performs a confirmation read-back via `homestatus` to verify the change was applied.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

```json
{
  "home_id": "5a1234567890abcdef012345",
  "mode": "schedule"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `home_id` | string | Yes | Netatmo home ID |
| `mode` | string | Yes | `"schedule"`, `"away"`, or `"hg"` (frost guard) |
| `endtime` | integer | No | Unix timestamp when mode expires |

**TypeScript type:**

```typescript
interface SetThermmodeRequest {
  home_id: string;
  mode: "schedule" | "away" | "hg";
  endtime?: number;    // Unix timestamp
}
```

**Response JSON:**

```json
{
  "status": "ok",
  "confirmed_mode": "schedule",
  "netatmo_response": {
    "status": "ok",
    "time_exec": 0.082,
    "time_server": 1773330257
  }
}
```

> Note: `confirmed_mode` is `null` if the read-back confirmation call fails. This is non-fatal; the set operation still succeeded.

**TypeScript type (response):**

```typescript
interface SetThermmodeResponse {
  status: string;
  confirmed_mode: string | null;  // null if read-back failed
  netatmo_response: object;
}
```

**curl:**

```bash
curl -s -X POST YOUR_BASE_URL/api/v1/netatmo/setthermmode \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "home_id": "YOUR_HOME_ID",
    "mode": "schedule"
  }'
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 422 | Validation failed (invalid mode) | `{"detail": [{"msg": "..."}]}` |
| 503 | Provider not initialized or DOWN | `{"detail": "Netatmo provider is currently unavailable"}` |

---

### POST /switchhomeschedule

Switch the active thermostat schedule for a home. Validates that `schedule_id` is non-empty before any Netatmo API call.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

```json
{
  "home_id": "5a1234567890abcdef012345",
  "schedule_id": "5b9876543210fedcba098765"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `home_id` | string | Yes | Netatmo home ID |
| `schedule_id` | string | Yes | Schedule ID to activate (from `/homesdata` schedules list) |

**TypeScript type:**

```typescript
interface SwitchHomeScheduleRequest {
  home_id: string;
  schedule_id: string;
}
```

**Response JSON:**

```json
{
  "status": "ok",
  "time_exec": 0.067,
  "time_server": 1773330257
}
```

**curl:**

```bash
curl -s -X POST YOUR_BASE_URL/api/v1/netatmo/switchhomeschedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "home_id": "YOUR_HOME_ID",
    "schedule_id": "YOUR_SCHEDULE_ID"
  }'
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 422 | Validation failed (empty schedule_id) | `{"detail": [{"msg": "..."}]}` |
| 503 | Provider not initialized, DOWN, or Netatmo API unreachable | `{"detail": "Netatmo API unavailable: ..."}` |

---

### POST /synchomeschedule

Transparent proxy to sync a home schedule to the Netatmo API. Forwards all body fields to the Netatmo `synchomeschedule` endpoint. The client constructs the schedule payload directly.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

```json
{
  "home_id": "5a1234567890abcdef012345",
  "name": "Giornaliero",
  "timetable": [
    { "m_offset": 0, "zone_id": 0 },
    { "m_offset": 420, "zone_id": 1 }
  ],
  "zones": [
    { "id": 0, "name": "Comfort", "rooms_temp": [{ "room_id": "3456789", "temp": 21.0 }] },
    { "id": 1, "name": "Notte", "rooms_temp": [{ "room_id": "3456789", "temp": 18.0 }] }
  ]
}
```

> `home_id` is required. All other fields are forwarded as-is to the Netatmo API.

**Response JSON:**

```json
{
  "status": "ok",
  "time_exec": 0.089,
  "time_server": 1773330257
}
```

**curl:**

```bash
curl -s -X POST YOUR_BASE_URL/api/v1/netatmo/synchomeschedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "home_id": "YOUR_HOME_ID",
    "name": "Giornaliero",
    "timetable": [],
    "zones": []
  }'
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 422 | `home_id` missing from request body | `{"detail": "home_id is required"}` |
| 503 | Provider not initialized, DOWN, or Netatmo API unreachable | `{"detail": "Netatmo API unavailable: ..."}` |

---

### POST /createnewhomeschedule

Transparent proxy to create a new home schedule via the Netatmo API. Forwards all body fields to the Netatmo `createnewhomeschedule` endpoint.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

```json
{
  "home_id": "5a1234567890abcdef012345",
  "name": "Weekend",
  "timetable": [
    { "m_offset": 0, "zone_id": 0 },
    { "m_offset": 480, "zone_id": 1 }
  ],
  "zones": [
    { "id": 0, "name": "Comfort", "rooms_temp": [{ "room_id": "3456789", "temp": 22.0 }] },
    { "id": 1, "name": "Notte", "rooms_temp": [{ "room_id": "3456789", "temp": 18.0 }] }
  ]
}
```

> `home_id` is required. All other fields are forwarded as-is to the Netatmo API.

**Response JSON:**

```json
{
  "status": "ok",
  "schedule_id": "5c1234567890abcdef098765",
  "time_exec": 0.091,
  "time_server": 1773330257
}
```

**curl:**

```bash
curl -s -X POST YOUR_BASE_URL/api/v1/netatmo/createnewhomeschedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "home_id": "YOUR_HOME_ID",
    "name": "Weekend",
    "timetable": [],
    "zones": []
  }'
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 422 | `home_id` missing from request body | `{"detail": "home_id is required"}` |
| 503 | Provider not initialized, DOWN, or Netatmo API unreachable | `{"detail": "Netatmo API unavailable: ..."}` |

---

### POST /renamehome

Rename a home via the Netatmo API. Both `home_id` and `name` are required.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

```json
{
  "home_id": "5a1234567890abcdef012345",
  "name": "Casa al Mare"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `home_id` | string | Yes | Netatmo home ID |
| `name` | string | Yes | New name for the home |

**Response JSON:**

```json
{
  "status": "ok",
  "time_exec": 0.059,
  "time_server": 1773330257
}
```

**curl:**

```bash
curl -s -X POST YOUR_BASE_URL/api/v1/netatmo/renamehome \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "home_id": "YOUR_HOME_ID",
    "name": "Casa al Mare"
  }'
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 422 | `home_id` or `name` missing from request body | `{"detail": "home_id and name are required"}` |
| 503 | Provider not initialized, DOWN, or Netatmo API unreachable | `{"detail": "Netatmo API unavailable: ..."}` |

---

## Valve Calibration

NRV valve status is served from the background poll cache. Calibration commands are forwarded to the Netatmo Energy API and return HTTP 202 because physical motor movement takes 30–120 seconds.

### GET /valves

Return all NRV valve modules with calibration state, battery level, reachability, and RF strength. Served from the background poll cache — no live Netatmo API call is made per request. Status fields (`battery_level`, `rf_strength`, `reachable`, `calibrating`) are `null` when the first homestatus poll has not yet completed.

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "valves": [
    {
      "module_id": "09:00:00:aa:bb:cc",
      "module_name": "Valvola Soggiorno",
      "room_id": "3456789",
      "room_name": "Soggiorno",
      "battery_level": "high",
      "rf_strength": 67,
      "reachable": true,
      "calibrating": false
    }
  ],
  "data_freshness": "LIVE"
}
```

**TypeScript type:**

```typescript
interface ValveStatus {
  module_id: string;
  module_name: string | null;
  room_id: string | null;
  room_name: string | null;
  battery_level: string | null;
  rf_strength: number | null;
  reachable: boolean | null;
  calibrating: boolean | null;
}

interface ValveStatusResponse {
  valves: ValveStatus[];
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/valves \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 503 | Provider not initialized, DOWN, or topology not yet loaded | `{"detail": "Topology not yet available — waiting for first poll"}` |

---

### POST /valves/calibrate

Trigger motor calibration on all NRV valves. Sends calibration commands sequentially. Per-valve errors do not abort the batch — the `results` array reports per-valve success or failure.

**Authentication:** Required (JWT Bearer or API Key)

> HTTP 202 Accepted — the calibration command was accepted for processing. Physical motor movement takes 30–120 seconds. Poll `GET /netatmo/homestatus` and check the `calibrating` field per module to confirm completion. The `results` array reflects the dispatch outcome, not the final physical calibration result.

**Response JSON (HTTP 202):**

```json
{
  "status": "accepted",
  "results": [
    { "module_id": "09:00:00:aa:bb:cc", "status": "accepted" },
    { "module_id": "09:00:00:dd:ee:ff", "status": "error", "error": "timeout" }
  ],
  "poll_endpoint": "/netatmo/homestatus"
}
```

**TypeScript type:**

```typescript
interface CalibrateBatchResult {
  module_id: string;
  status: "accepted" | "error";
  error?: string;
}

interface CalibrateBatchResponse {
  status: "accepted";
  results: CalibrateBatchResult[];
  poll_endpoint: string;
}
```

**curl:**

```bash
curl -s -X POST YOUR_BASE_URL/api/v1/netatmo/valves/calibrate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 503 | Provider not initialized, DOWN, or topology unavailable | `{"detail": "Topology not yet available — home_id unknown"}` |

---

### POST /valves/{module_id}/calibrate

Trigger motor calibration on a single NRV valve identified by `module_id`. Validates that the module is a known NRV valve before sending the command.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `module_id` | string | NRV module identifier (from `GET /netatmo/valves`) |

> HTTP 202 Accepted — the calibration command was accepted for processing. Physical motor movement takes 30–120 seconds. Poll `GET /netatmo/homestatus` and check the `calibrating` field on this module to confirm completion.

**Response JSON (HTTP 202):**

```json
{
  "status": "accepted",
  "module_id": "09:00:00:aa:bb:cc",
  "poll_endpoint": "/netatmo/homestatus"
}
```

**TypeScript type:**

```typescript
interface CalibrateValveResponse {
  status: "accepted";
  module_id: string;
  poll_endpoint: string;
}
```

**curl:**

```bash
curl -s -X POST YOUR_BASE_URL/api/v1/netatmo/valves/09:00:00:aa:bb:cc/calibrate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 404 | module_id is not a known NRV valve | `{"detail": "Valve '09:00:00:xx:xx:xx' not found"}` |
| 502 | Netatmo API rejected the calibration command | `{"detail": "Netatmo API error: ..."}` |
| 503 | Provider not initialized, DOWN, or topology unavailable | `{"detail": "Netatmo provider is currently unavailable"}` |

---

## Security Camera

Camera status and stream URLs are served from the in-memory homedata cache (refreshed every 5 minutes). Events are served from the local `netatmo_camera_events` SQLite table (7-day retention). VPN stream URLs expire every 3 hours — use `GET /camera/{camera_id}/stream` to get fresh URLs rather than caching them client-side.

### GET /camera/status

Return all camera devices with online status, SD card state, power status, and firmware version. Served from the in-memory homedata cache — no live Netatmo API call is made per request.

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "cameras": [
    {
      "camera_id": "70:ee:50:aa:bb:cc",
      "name": "Ingresso",
      "device_type": "NOC",
      "status": "on",
      "sd_status": "on",
      "alim_status": "on",
      "firmware": "174",
      "is_local": true
    }
  ],
  "data_freshness": "LIVE"
}
```

**TypeScript type:**

```typescript
interface CameraStatus {
  camera_id: string | null;
  name: string | null;
  device_type: string | null;   // e.g. "NOC" (Presence), "NACamera" (Welcome)
  status: string | null;        // "on" | "off"
  sd_status: string | null;     // "on" | "off"
  alim_status: string | null;   // "on" | "off"
  firmware: string | null;
  is_local: boolean | null;
}

interface CameraStatusResponse {
  cameras: CameraStatus[];
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/camera/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 503 | Provider not initialized, DOWN, or homedata not yet cached | `{"detail": "Camera data not yet available — waiting for first poll"}` |

---

### GET /camera/{camera_id}/stream

Return HLS stream URLs for a specific camera. The response always includes VPN stream URLs (accessible from any network). Local stream URLs are included only when the camera reports `is_local: true` and a local URL is available. VPN URLs expire every 3 hours — the background poller refreshes them automatically.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `camera_id` | string | Camera MAC address (from `GET /netatmo/camera/status`) |

**Response JSON:**

```json
{
  "camera_id": "70:ee:50:aa:bb:cc",
  "vpn_streams": {
    "high": "https://v.netatmo.com/restricted/.../.../live/files/high/index.m3u8",
    "medium": "https://v.netatmo.com/restricted/.../.../live/files/medium/index.m3u8",
    "low": "https://v.netatmo.com/restricted/.../.../live/files/low/index.m3u8"
  },
  "is_local": true,
  "local_streams": {
    "high": "http://192.168.178.x/.../live/files/high/index.m3u8",
    "medium": "http://192.168.178.x/.../live/files/medium/index.m3u8",
    "low": "http://192.168.178.x/.../live/files/low/index.m3u8"
  }
}
```

**TypeScript type:**

```typescript
interface StreamUrls {
  high: string;
  medium: string;
  low: string;
}

interface CameraStreamResponse {
  camera_id: string;
  vpn_streams: StreamUrls;
  is_local: boolean;
  local_streams?: StreamUrls;  // only present when is_local=true and local URL available
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/camera/70:ee:50:aa:bb:cc/stream \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 404 | camera_id not found in homedata | `{"detail": "Camera '70:ee:50:aa:bb:cc' not found"}` |
| 503 | Provider not initialized, DOWN, homedata not cached, or VPN URL missing | `{"detail": "Camera VPN URL not available"}` |

---

### GET /camera/{camera_id}/snapshot

Return the current snapshot URL for a camera. Returns a URL string pointing to the live JPEG snapshot — not binary data. To retrieve binary JPEG bytes, use `GET /camera/events/{event_id}/snapshot`.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `camera_id` | string | Camera MAC address (from `GET /netatmo/camera/status`) |

> Returns a URL, not binary data. For binary snapshot retrieval from recorded events, use `GET /netatmo/camera/events/{event_id}/snapshot`.

**Response JSON:**

```json
{
  "camera_id": "70:ee:50:aa:bb:cc",
  "snapshot_url": "https://v.netatmo.com/restricted/.../.../live/snapshot_720.jpg"
}
```

**TypeScript type:**

```typescript
interface CameraSnapshotUrlResponse {
  camera_id: string;
  snapshot_url: string;
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/camera/70:ee:50:aa:bb:cc/snapshot \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 404 | camera_id not found in homedata | `{"detail": "Camera '70:ee:50:aa:bb:cc' not found"}` |
| 503 | Provider not initialized, DOWN, homedata not cached, or VPN URL missing | `{"detail": "Camera VPN URL not available"}` |

---

### POST /camera/{camera_id}/monitoring

Toggle monitoring on or off for a specific camera. Proxies the `setstate` command to the Netatmo API. The `monitoring` field must be exactly `"on"` or `"off"`.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `camera_id` | string | Camera MAC address (from `GET /netatmo/camera/status`) |

**Request Body:**

```json
{ "monitoring": "on" }
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `monitoring` | string | Yes | `"on"` to enable monitoring, `"off"` to disable |

**Response JSON:**

```json
{
  "camera_id": "70:ee:50:aa:bb:cc",
  "monitoring": "on",
  "status": "applied"
}
```

**TypeScript type:**

```typescript
interface SetMonitoringRequest {
  monitoring: "on" | "off";
}

interface SetMonitoringResponse {
  camera_id: string;
  monitoring: "on" | "off";
  status: "applied";
}
```

**curl:**

```bash
curl -s -X POST YOUR_BASE_URL/api/v1/netatmo/camera/70:ee:50:aa:bb:cc/monitoring \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monitoring": "on"}'
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 404 | camera_id not found in homedata | `{"detail": "Camera '70:ee:50:aa:bb:cc' not found"}` |
| 422 | monitoring is not "on" or "off" — Pydantic validation | `{"detail": [{"msg": "..."}]}` |
| 502 | Netatmo API rejected the setstate command | `{"detail": "Netatmo API error: ..."}` |
| 503 | Provider not initialized, DOWN, homedata not cached, or home_id not loaded | `{"detail": "Netatmo provider is currently unavailable"}` |

---

### GET /camera/events

Return a timeline of camera events from the local SQLite database for a configurable time window. Events are inserted by the background poller — no live Netatmo API call is made per request.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `hours` | integer | 24 | Hours of history to return (1–168) |

> Events are retained for 7 days. The maximum queryable window is 168 hours (7 days). The `event_type` union covers known values — Netatmo may send additional types for future camera models.

**Response JSON:**

```json
{
  "events": [
    {
      "event_id": "abc123def456",
      "camera_id": "70:ee:50:aa:bb:cc",
      "event_type": "movement",
      "timestamp": 1773330000,
      "message": "Movement detected",
      "snapshot_url": "https://netatmomedia.com/...jpg",
      "person_id": null
    }
  ],
  "count": 1
}
```

**TypeScript type:**

```typescript
interface CameraEvent {
  event_id: string;
  camera_id: string;
  event_type: "movement" | "person" | "sound";  // other values may appear for future camera types
  timestamp: number;         // Unix timestamp
  message: string | null;
  snapshot_url: string | null;
  person_id: string | null;
}

interface CameraEventsResponse {
  events: CameraEvent[];
  count: number;
}
```

**curl (last 24 hours, default):**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/camera/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**curl (last 72 hours):**

```bash
curl -s "YOUR_BASE_URL/api/v1/netatmo/camera/events?hours=72" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 422 | hours out of range (must be 1–168) | `{"detail": [{"msg": "ensure this value is less than or equal to 168"}]}` |
| 503 | Provider not initialized or DOWN | `{"detail": "Netatmo provider is currently unavailable"}` |

---

### GET /camera/events/{event_id}/snapshot

Return a binary JPEG snapshot for a specific camera event. Serves the JPEG snapshot stored in SQLite BLOB cache at event detection time. This is the only binary endpoint in the platform.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `event_id` | string | Camera event ID (from `GET /netatmo/camera/events`) |

> This is the only binary endpoint in the platform. Returns raw JPEG bytes, not JSON. Content-Type is `image/jpeg`. Use curl's `-o` flag or `response.blob()` in JavaScript to handle the binary response.

**Response:** Binary JPEG (`Content-Type: image/jpeg`)

**TypeScript type:**

```typescript
// Binary endpoint — browser/fetch usage
type SnapshotResponse = Blob;
// Use: const blob = await response.blob();
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/netatmo/camera/events/EVENT_ID/snapshot \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o snapshot.jpg
```

**Error responses:**

| Status | Condition | Example |
|--------|-----------|---------|
| 401 | Missing or invalid authentication | `{"detail": "Not authenticated"}` |
| 404 | event_id not found in DB, or snapshot_blob IS NULL (not cached) | `{"detail": "Event 'abc123' not found"}` |
| 503 | Provider not initialized or DOWN | `{"detail": "Netatmo provider is currently unavailable"}` |

---

## Frontend Component Suggestions

| Endpoint Group | Component | Data Mapping | Usage Hint |
|----------------|-----------|--------------|------------|
| Health and Status | StatusBadge + StatCards | `status` -> badge color; `thermostat_count`, `valve_count`, `camera_status` -> stat cards | Green if all devices reachable, yellow if partial, red if down |
| Read: Thermostat and Rooms | DataCard + Table | Thermostat: `setpoint`, `measured_temp`, `heating_status` -> labeled card. Rooms: `rooms[]` -> table with name, current_temp, setpoint, heating (Badge) | Use temperature-colored values (blue < 18, green 18-22, red > 22) |
| Read: Schedules and Valves | Table + List | Schedules: `schedules[]` -> table with name, active (Badge). Valves: `valves[]` -> table with name, room, open_percent (ProgressBar), battery (ProgressBar) | Highlight active schedule row; show valve open percent as visual bar |
| Read: Camera | Card + List | Camera: snapshot image + status badge. Events: `events[]` -> chronological list with type, timestamp, thumbnail | Show latest snapshot prominently; event list below with type icons |
| Control Endpoints | Form (Toggle, Select, Slider) | Heating mode -> Toggle (on/off). Schedule -> Select (dropdown from schedules list). Setpoint -> Slider (range 5-30 C, step 0.5). Valve calibration -> Button with StatusBadge for calibration state | Slider for temperature setpoint; show current measured temp next to setpoint for context |
| Historical Data | LineChart | `data_points[]` -> time series; x-axis: timestamp, y-axis: temperature/humidity/CO2 | API returns auto-granularity data -- chart must handle variable time intervals. Add metric selector (temperature, humidity, CO2, noise) |

---

## Real-Time (WebSocket)

For real-time push updates without polling, subscribe to the `netatmo` topic on the WebSocket endpoint.

See [WebSocket API - netatmo topic](./websocket.md#netatmo) for the full payload schema, TypeScript interfaces, and subscription example.

**Topic:** `netatmo`
**Snapshot on subscribe:** Yes -- current room measurements
