# Thermorossi Provider API

**Base path:** `/api/v1/thermorossi`

Thermorossi pellet stove API covering state monitoring, telemetry history, and remote command control — 13 endpoints. Read endpoints serve from local cache populated by 60-second background polling of the WiNet cloud. Control endpoints proxy directly to WiNet.

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/thermorossi/health` | Provider health and cache freshness |
| `GET` | `/api/v1/thermorossi/status` | Combined stove telemetry (all 6 values) |
| `GET` | `/api/v1/thermorossi/power` | Current power level (1–5) |
| `GET` | `/api/v1/thermorossi/fan-level` | Current fan level (1–6) |
| `GET` | `/api/v1/thermorossi/temperature/room` | Room temperature |
| `GET` | `/api/v1/thermorossi/temperature/water/actual` | Actual water temperature |
| `GET` | `/api/v1/thermorossi/temperature/water/set` | Water temperature setpoint |
| `GET` | `/api/v1/thermorossi/history` | Paginated telemetry history with auto-granularity |
| `POST` | `/api/v1/thermorossi/commands/ignit` | Ignite the stove |
| `POST` | `/api/v1/thermorossi/commands/shutdown` | Shut down the stove |
| `POST` | `/api/v1/thermorossi/settings/power` | Set power level (1–5) |
| `POST` | `/api/v1/thermorossi/settings/fan-level` | Set fan level (1–6) |
| `POST` | `/api/v1/thermorossi/settings/temperature/water` | Set water temperature setpoint (40–80°C) |

---

## Table of Contents

- [Health and Status](#health-and-status)
  - [GET /health](#get-health)
- [Read Endpoints](#read-endpoints)
  - [GET /status](#get-status)
  - [GET /power](#get-power)
  - [GET /fan-level](#get-fan-level)
  - [GET /temperature/room](#get-temperatureroom)
  - [GET /temperature/water/actual](#get-temperaturewateractual)
  - [GET /temperature/water/set](#get-temperaturewaterset)
  - [GET /history](#get-history)
- [Control Endpoints](#control-endpoints)
  - [Polling After Commands](#polling-after-commands)
  - [State Gating Table](#state-gating-table)
  - [POST /commands/ignit](#post-commandsignit)
  - [POST /commands/shutdown](#post-commandsshutdown)
  - [POST /settings/power](#post-settingspower)
  - [POST /settings/fan-level](#post-settingsfan-level)
  - [POST /settings/temperature/water](#post-settingstemperaturewater)

---

## Health and Status

### GET /health

Returns Thermorossi provider health status and cache freshness. Never calls WiNet directly — reads from in-memory cache only.

**Authentication:** Required (JWT Bearer or API Key)

**`data_freshness` values:**

| Value | Meaning |
|-------|---------|
| `LIVE` | Last poll was within 180 seconds (3× polling interval) |
| `STALE` | Last poll was more than 180 seconds ago — data is old but available |
| `UNREACHABLE` | Provider is down and has never successfully polled — triggers HTTP 503, never appears in the JSON response body |

**Response (200):**

```json
{
  "status": "ok",
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-15T10:30:00+00:00"
}
```

```typescript
interface ThermorossiHealthResponse {
  status: "ok" | "degraded";
  data_freshness: "LIVE" | "STALE";
  last_poll_at: string | null; // ISO 8601, null on first boot
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/health \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Provider is UNREACHABLE (WiNet not reachable, cache never populated) |

---

## Read Endpoints

All read endpoints serve from the in-memory cache populated by 60-second background polling. `STALE` freshness returns HTTP **200** (not 503) — the dashboard degrades gracefully with a visual indicator rather than failing hard.

---

### GET /status

Returns all 6 stove telemetry values in a single combined response.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "stove_state": "working",
  "power_level": 3,
  "fan_level": 4,
  "room_temperature": 21.5,
  "water_temperature_actual": 68.0,
  "water_temperature_set": 70,
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-15T10:30:00+00:00"
}
```

```typescript
interface ThermorossiStatusResponse {
  stove_state: "off" | "igniting" | "working" | "standby" | "cleaning" | "alarm";
  power_level: number | null;          // 1–5
  fan_level: number | null;            // 1–6
  room_temperature: number | null;     // celsius
  water_temperature_actual: number | null; // celsius
  water_temperature_set: number | null;    // celsius
  data_freshness: "LIVE" | "STALE";
  last_poll_at: string | null;         // ISO 8601
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/status \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Provider is UNREACHABLE, or cache not yet populated (first boot) |

---

### GET /power

Returns the current stove power level.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "power_level": 3,
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-15T10:30:00+00:00"
}
```

```typescript
interface ThermorossiPowerResponse {
  power_level: number | null; // 1–5, null if unavailable
  data_freshness: "LIVE" | "STALE";
  last_poll_at: string | null; // ISO 8601
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/power \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Provider is UNREACHABLE, or cache not yet populated |

---

### GET /fan-level

Returns the current stove fan speed level.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "fan_level": 4,
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-15T10:30:00+00:00"
}
```

```typescript
interface ThermorossiFanResponse {
  fan_level: number | null; // 1–6, null if unavailable
  data_freshness: "LIVE" | "STALE";
  last_poll_at: string | null; // ISO 8601
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/fan-level \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Provider is UNREACHABLE, or cache not yet populated |

---

### GET /temperature/room

Returns the room temperature reading.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "value": 21.5,
  "unit": "celsius",
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-15T10:30:00+00:00"
}
```

```typescript
interface ThermorossiTemperatureResponse {
  value: number | null;  // celsius, null if unavailable
  unit: "celsius";       // always "celsius"
  data_freshness: "LIVE" | "STALE";
  last_poll_at: string | null; // ISO 8601
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/temperature/room \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Provider is UNREACHABLE, or cache not yet populated |

---

### GET /temperature/water/actual

Returns the actual hydronic water temperature.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "value": 68.0,
  "unit": "celsius",
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-15T10:30:00+00:00"
}
```

```typescript
interface ThermorossiTemperatureResponse {
  value: number | null;  // celsius, null if unavailable
  unit: "celsius";       // always "celsius"
  data_freshness: "LIVE" | "STALE";
  last_poll_at: string | null; // ISO 8601
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/temperature/water/actual \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Provider is UNREACHABLE, or cache not yet populated |

---

### GET /temperature/water/set

Returns the hydronic water temperature setpoint.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "value": 70,
  "unit": "celsius",
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-15T10:30:00+00:00"
}
```

```typescript
interface ThermorossiTemperatureResponse {
  value: number | null;  // celsius, null if unavailable
  unit: "celsius";       // always "celsius"
  data_freshness: "LIVE" | "STALE";
  last_poll_at: string | null; // ISO 8601
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/temperature/water/set \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Provider is UNREACHABLE, or cache not yet populated |

---

### GET /history

Returns paginated stove telemetry history with automatic granularity selection based on the requested time window.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `start` | integer | none | Unix epoch start timestamp (inclusive) |
| `end` | integer | none | Unix epoch end timestamp (exclusive) |
| `scale` | string | auto | Override granularity: `raw`, `hourly`, `daily` |
| `limit` | integer | 100 | Max records per page |
| `offset` | integer | 0 | Records to skip |

#### Auto-Granularity

When `scale` is not provided, the tier is selected automatically from the requested time window:

| Time Window | Granularity | Data Source |
|-------------|-------------|-------------|
| ≤ 48 hours | `raw` | Per-minute readings (~60s polling interval) |
| ≤ 30 days | `hourly` | Hourly aggregations (avg/min/max per hour) |
| > 30 days | `daily` | Daily aggregations (avg/min/max per day) |

When neither `start` nor `end` is provided (unbounded window), `daily` is returned.

**Response (200 — raw tier example):**

```json
{
  "items": [
    {
      "timestamp": 1773571200,
      "stove_state": "working",
      "power_level": 3,
      "fan_level": 4,
      "room_temp": 21.5,
      "water_temp_actual": 68.0,
      "water_temp_set": 70,
      "avg_room_temp": null,
      "min_room_temp": null,
      "max_room_temp": null,
      "avg_water_temp_actual": null,
      "min_water_temp_actual": null,
      "max_water_temp_actual": null,
      "avg_water_temp_set": null,
      "min_water_temp_set": null,
      "max_water_temp_set": null,
      "avg_power_level": null,
      "min_power_level": null,
      "max_power_level": null,
      "avg_fan_level": null,
      "min_fan_level": null,
      "max_fan_level": null,
      "working_minutes": null,
      "sample_count": null
    }
  ],
  "total_count": 2880,
  "limit": 100,
  "offset": 0,
  "granularity": "raw"
}
```

> **Note:** For `hourly` and `daily` tiers, the raw snapshot fields (`stove_state`, `power_level`, `fan_level`, `room_temp`, `water_temp_actual`, `water_temp_set`) are `null`, while the aggregation fields (`avg_*`, `min_*`, `max_*`, `working_minutes`, `sample_count`) are populated instead.

**Field availability by granularity tier:**

| Field | raw | hourly | daily |
|-------|-----|--------|-------|
| `timestamp` | epoch int | epoch int (hour start) | epoch int (day start) |
| `stove_state` | populated | null | null |
| `power_level` | populated | null | null |
| `fan_level` | populated | null | null |
| `room_temp` | populated | null | null |
| `water_temp_actual` | populated | null | null |
| `water_temp_set` | populated | null | null |
| `avg_room_temp` | null | populated | populated |
| `min_room_temp` | null | populated | populated |
| `max_room_temp` | null | populated | populated |
| `avg_water_temp_actual` | null | populated | populated |
| `min_water_temp_actual` | null | populated | populated |
| `max_water_temp_actual` | null | populated | populated |
| `avg_water_temp_set` | null | populated | populated |
| `min_water_temp_set` | null | populated | populated |
| `max_water_temp_set` | null | populated | populated |
| `avg_power_level` | null | populated | populated |
| `min_power_level` | null | populated | populated |
| `max_power_level` | null | populated | populated |
| `avg_fan_level` | null | populated | populated |
| `min_fan_level` | null | populated | populated |
| `max_fan_level` | null | populated | populated |
| `working_minutes` | null | populated | populated |
| `sample_count` | null | populated | populated |

```typescript
interface ThermorossiHistoryItem {
  timestamp: number;               // Unix epoch int

  // Raw tier only
  stove_state: string | null;      // "off" | "igniting" | "working" | "standby" | "cleaning" | "alarm"
  power_level: number | null;
  fan_level: number | null;
  room_temp: number | null;
  water_temp_actual: number | null;
  water_temp_set: number | null;

  // Hourly/daily tiers only
  avg_room_temp: number | null;
  min_room_temp: number | null;
  max_room_temp: number | null;
  avg_water_temp_actual: number | null;
  min_water_temp_actual: number | null;
  max_water_temp_actual: number | null;
  avg_water_temp_set: number | null;
  min_water_temp_set: number | null;
  max_water_temp_set: number | null;
  avg_power_level: number | null;
  min_power_level: number | null;
  max_power_level: number | null;
  avg_fan_level: number | null;
  min_fan_level: number | null;
  max_fan_level: number | null;
  working_minutes: number | null;  // minutes stove was in "working" state
  sample_count: number | null;     // number of raw records aggregated
}

interface ThermorossiHistoryResponse {
  items: ThermorossiHistoryItem[];
  total_count: number;
  limit: number;
  offset: number;
  granularity: "raw" | "hourly" | "daily";
}
```

**curl:**

```bash
# Last 24 hours (auto-selects raw tier)
curl "YOUR_BASE_URL/api/v1/thermorossi/history?start=1773484800&end=1773571200" \
  -H "X-API-Key: YOUR_API_KEY"

# Last 7 days (auto-selects hourly tier)
curl "YOUR_BASE_URL/api/v1/thermorossi/history?start=1772966400" \
  -H "X-API-Key: YOUR_API_KEY"

# Force daily scale
curl "YOUR_BASE_URL/api/v1/thermorossi/history?scale=daily&limit=30" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Provider is UNREACHABLE |

---

## Control Endpoints

### Polling After Commands

Stove state transitions are slow — ignition takes 5–15 minutes, shutdown takes several minutes. All control endpoints return **202 Accepted** immediately and include a `suggested_poll_delay_s` hint.

**202 Accepted response shape (all control endpoints):**

```json
{
  "command": "ignite",
  "status": "accepted",
  "previous_state": "off",
  "suggested_poll_delay_s": 15,
  "poll_endpoint": "/api/v1/thermorossi/status",
  "requested_value": null
}
```

After waiting `suggested_poll_delay_s` seconds, poll `GET /api/v1/thermorossi/status` to check the new `stove_state`.

**Next.js fetch — 202 → poll pattern:**

```typescript
// Send command
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/thermorossi/commands/ignit`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.API_KEY!,
  },
});

if (res.status !== 202) {
  const err = await res.json();
  throw new Error(`Command failed: ${err.detail}`);
}

const { suggested_poll_delay_s } = await res.json();

// Wait for stove to begin transitioning
await new Promise((resolve) => setTimeout(resolve, suggested_poll_delay_s * 1000));

// Poll for new state
const status = await fetch(`${process.env.API_BASE_URL}/api/v1/thermorossi/status`, {
  headers: { "X-API-Key": process.env.API_KEY! },
});
const { stove_state } = await status.json();
console.log("Stove state:", stove_state); // e.g. "igniting"
```

---

### State Gating Table

Commands are blocked unless the stove is in an allowed state. The server returns **409 Conflict** if the current state is not allowed.

| Command | Allowed States | Notes |
|---------|---------------|-------|
| `ignite` | `off`, `standby` | Cannot re-ignite a running stove |
| `shutdown` | `working`, `alarm` | Emergency remote shutdown allowed in alarm state |
| `set_power` | `working`, `igniting`, `cleaning` | Settings adjustable while active |
| `set_fan` | `working`, `igniting`, `cleaning` | Settings adjustable while active |
| `set_water_temp` | `working`, `igniting`, `cleaning` | Settings adjustable while active |

> **Note:** `STALE` data freshness does **not** block commands — the state gate uses the last known state regardless of data age.

**409 Conflict error shape:**

```json
{
  "detail": {
    "error": "state_conflict",
    "command": "ignite",
    "current_state": "working",
    "allowed_states": ["off", "standby"],
    "message": "Command 'ignite' not allowed in state 'working'. Allowed states: ['off', 'standby']"
  }
}
```

```typescript
interface ThermorossiStateConflict {
  error: "state_conflict";
  command: string;
  current_state: string;
  allowed_states: string[];
  message: string;
}
```

---

### POST /commands/ignit

Ignites the stove. Note: the URL path is `/commands/ignit` (no trailing `e`); the response body uses `"command": "ignite"`.

**Authentication:** Required (JWT Bearer or API Key)

**Request body:** None

**Allowed states:** `off`, `standby`

**`suggested_poll_delay_s`:** 15 (stove ignition takes several minutes)

**Response (202):**

```json
{
  "command": "ignite",
  "status": "accepted",
  "previous_state": "standby",
  "suggested_poll_delay_s": 15,
  "poll_endpoint": "/api/v1/thermorossi/status",
  "requested_value": null
}
```

```typescript
interface ThermorossiCommandResponse {
  command: string;
  status: "accepted";
  previous_state: string;
  suggested_poll_delay_s: number;
  poll_endpoint: string;
  requested_value: number | null;
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/commands/ignit \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/thermorossi/commands/ignit`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.API_KEY!,
  },
});
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `409 Conflict` | Stove is not in `off` or `standby` state |
| `503 Service Unavailable` | Provider UNREACHABLE or cache not yet populated |
| `502 Bad Gateway` | WiNet API returned an error |
| `504 Gateway Timeout` | WiNet API timed out |

---

### POST /commands/shutdown

Shuts down the stove. Also allowed from `alarm` state for emergency remote shutdown.

**Authentication:** Required (JWT Bearer or API Key)

**Request body:** None

**Allowed states:** `working`, `alarm`

**`suggested_poll_delay_s`:** 15 (stove shutdown takes several minutes)

**Response (202):**

```json
{
  "command": "shutdown",
  "status": "accepted",
  "previous_state": "working",
  "suggested_poll_delay_s": 15,
  "poll_endpoint": "/api/v1/thermorossi/status",
  "requested_value": null
}
```

```typescript
interface ThermorossiCommandResponse {
  command: string;
  status: "accepted";
  previous_state: string;
  suggested_poll_delay_s: number;
  poll_endpoint: string;
  requested_value: number | null;
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/commands/shutdown \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/thermorossi/commands/shutdown`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.API_KEY!,
  },
});
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `409 Conflict` | Stove is not in `working` or `alarm` state |
| `503 Service Unavailable` | Provider UNREACHABLE or cache not yet populated |
| `502 Bad Gateway` | WiNet API returned an error |
| `504 Gateway Timeout` | WiNet API timed out |

---

### POST /settings/power

Sets the stove power level. Valid range: 1–5. Out-of-range values are rejected with 422 before the state check.

**Authentication:** Required (JWT Bearer or API Key)

**Allowed states:** `working`, `igniting`, `cleaning`

**`suggested_poll_delay_s`:** 5

**Request body:**

```json
{
  "value": 3
}
```

```typescript
interface SetPowerRequest {
  value: number; // integer, 1–5
}
```

**Response (202):**

```json
{
  "command": "set_power",
  "status": "accepted",
  "previous_state": "working",
  "suggested_poll_delay_s": 5,
  "poll_endpoint": "/api/v1/thermorossi/status",
  "requested_value": 3
}
```

```typescript
interface ThermorossiCommandResponse {
  command: string;
  status: "accepted";
  previous_state: string;
  suggested_poll_delay_s: number;
  poll_endpoint: string;
  requested_value: number | null;
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/settings/power \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": 3}'
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/thermorossi/settings/power`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.API_KEY!,
  },
  body: JSON.stringify({ value: 3 }),
});
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `value` is outside 1–5 range |
| `409 Conflict` | Stove is not in `working`, `igniting`, or `cleaning` state |
| `503 Service Unavailable` | Provider UNREACHABLE or cache not yet populated |
| `502 Bad Gateway` | WiNet API returned an error |
| `504 Gateway Timeout` | WiNet API timed out |

---

### POST /settings/fan-level

Sets the stove fan speed level. Valid range: 1–6. Out-of-range values are rejected with 422 before the state check.

**Authentication:** Required (JWT Bearer or API Key)

**Allowed states:** `working`, `igniting`, `cleaning`

**`suggested_poll_delay_s`:** 5

**Request body:**

```json
{
  "value": 4
}
```

```typescript
interface SetFanLevelRequest {
  value: number; // integer, 1–6
}
```

**Response (202):**

```json
{
  "command": "set_fan",
  "status": "accepted",
  "previous_state": "working",
  "suggested_poll_delay_s": 5,
  "poll_endpoint": "/api/v1/thermorossi/status",
  "requested_value": 4
}
```

```typescript
interface ThermorossiCommandResponse {
  command: string;
  status: "accepted";
  previous_state: string;
  suggested_poll_delay_s: number;
  poll_endpoint: string;
  requested_value: number | null;
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/settings/fan-level \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": 4}'
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/thermorossi/settings/fan-level`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.API_KEY!,
  },
  body: JSON.stringify({ value: 4 }),
});
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `value` is outside 1–6 range |
| `409 Conflict` | Stove is not in `working`, `igniting`, or `cleaning` state |
| `503 Service Unavailable` | Provider UNREACHABLE or cache not yet populated |
| `502 Bad Gateway` | WiNet API returned an error |
| `504 Gateway Timeout` | WiNet API timed out |

---

### POST /settings/temperature/water

Sets the hydronic water temperature setpoint. Valid range: 40–80°C. Out-of-range values are rejected with 422 before the state check.

**Authentication:** Required (JWT Bearer or API Key)

**Allowed states:** `working`, `igniting`, `cleaning`

**`suggested_poll_delay_s`:** 5

**Request body:**

```json
{
  "value": 70
}
```

```typescript
interface SetWaterTempRequest {
  value: number; // integer, 40–80 (celsius)
}
```

**Response (202):**

```json
{
  "command": "set_water_temp",
  "status": "accepted",
  "previous_state": "working",
  "suggested_poll_delay_s": 5,
  "poll_endpoint": "/api/v1/thermorossi/status",
  "requested_value": 70
}
```

```typescript
interface ThermorossiCommandResponse {
  command: string;
  status: "accepted";
  previous_state: string;
  suggested_poll_delay_s: number;
  poll_endpoint: string;
  requested_value: number | null;
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/settings/temperature/water \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": 70}'
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/thermorossi/settings/temperature/water`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.API_KEY!,
  },
  body: JSON.stringify({ value: 70 }),
});
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `value` is outside 40–80 range |
| `409 Conflict` | Stove is not in `working`, `igniting`, or `cleaning` state |
| `503 Service Unavailable` | Provider UNREACHABLE or cache not yet populated |
| `502 Bad Gateway` | WiNet API returned an error |
| `504 Gateway Timeout` | WiNet API timed out |

---

## Field Verification Status

> Last checked: 2026-03-16

WiNet is a Thermorossi-proprietary cloud protocol. Field names and command names below are sourced from WiNet community documentation and code inspection. Live verification requires the stove to be on and `WINET_API_KEY` + `WINET_BASE_URL` to be configured.

| Field / Command | Confidence | Source | Notes |
|-----------------|------------|--------|-------|
| `GetStatus` response fields (`stove_state`, `power_level`, `fan_level`, `room_temperature`, `water_temperature_actual`, `water_temperature_set`) | MEDIUM | WiNet community docs, code inspection | Not live-verified — stove was off/unreachable at time of check |
| `Ignit` (POST /commands/ignit) | MEDIUM | WiNet community docs | Not live-verified; note: no trailing `e` in URL or action name |
| `Shutdown` (POST /commands/shutdown) | MEDIUM | WiNet community docs | Not live-verified |
| `SetPower` (POST /settings/power) | MEDIUM | WiNet community docs | URL format: `{base_url}/{api_key}/SetPower;{level}` |
| `SetFanLevel` (POST /settings/fan-level) | MEDIUM | WiNet community docs | URL format: `{base_url}/{api_key}/SetFanLevel;{level}` |
| `SetWaterTemperature` (POST /settings/temperature/water) | MEDIUM | WiNet community docs | URL format: `{base_url}/{api_key}/SetWaterTemperature;{temp}` |
| `GET /telemetry`, `/history`, `/daily` aggregation fields | HIGH | Code + DB schema verified | Aggregation pipeline tested in Phase 61; schema matches DB columns |

**To upgrade to HIGH confidence:** Power on the stove, set `WINET_BASE_URL` and `WINET_API_KEY` in `.secrets.toml`, then run:

```bash
ssh pi@100.90.218.27 "cd /home/pi/HomeAssistant && .venv/bin/python -c \"
from config import settings
from api.providers.thermorossi.client import WiNetClient
c = WiNetClient(settings.WINET_API_KEY, settings.WINET_BASE_URL)
import json; print(json.dumps(c.get_status(), indent=2))
\""
```

Compare the response keys against the field names documented in `GET /status` above. If they match, update Confidence to HIGH and Notes to `Live-verified YYYY-MM-DD`.
