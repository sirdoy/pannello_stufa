# Thermorossi Provider API

**Base path:** `/api/v1/thermorossi`

Thermorossi pellet stove API covering state monitoring, telemetry history, and remote command control -- 10 endpoints. Read endpoints serve from local cache populated by 60-second background polling of the WiNet cloud. Control endpoints proxy directly to WiNet.

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/thermorossi/health` | Provider health and cache freshness |
| `GET` | `/api/v1/thermorossi/status` | Combined stove telemetry |
| `GET` | `/api/v1/thermorossi/power` | Current power level (1--5) |
| `GET` | `/api/v1/thermorossi/fan-level` | Current fan level (1--6) |
| `GET` | `/api/v1/thermorossi/history` | Paginated telemetry history with auto-granularity |
| `POST` | `/api/v1/thermorossi/commands/ignit` | Ignite the stove |
| `POST` | `/api/v1/thermorossi/commands/shutdown` | Shut down the stove |
| `POST` | `/api/v1/thermorossi/settings/power` | Set power level (1--5) |
| `POST` | `/api/v1/thermorossi/settings/fan-level` | Set fan level (1--6) |
| `POST` | `/api/v1/thermorossi/settings/temperature/water` | Set water temperature setpoint (40--80C) |

---

## Table of Contents

- [Health and Status](#health-and-status)
  - [GET /health](#get-health)
- [Read Endpoints](#read-endpoints)
  - [GET /status](#get-status)
  - [GET /power](#get-power)
  - [GET /fan-level](#get-fan-level)
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

Returns Thermorossi provider health status and cache freshness. Never calls WiNet directly -- reads from in-memory cache only.

**Authentication:** Required (JWT Bearer or API Key)

**`data_freshness` values:**

| Value | Meaning |
|-------|---------|
| `LIVE` | Last poll was within 180 seconds (3x polling interval) |
| `STALE` | Last poll was more than 180 seconds ago -- data is old but available |
| `UNREACHABLE` | Provider is down and has never successfully polled -- triggers HTTP 503, never appears in the JSON response body |

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

All read endpoints serve from the in-memory cache populated by 60-second background polling. `STALE` freshness returns HTTP **200** (not 503) -- the dashboard degrades gracefully with a visual indicator rather than failing hard.

---

### GET /status

Returns stove telemetry values in a single combined response.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "stove_state": "working",
  "power_level": 3,
  "fan_level": 4,
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-15T10:30:00+00:00",
  "error_code": null,
  "error_description": null
}
```

**Response when `stove_state` is `"alarm"`:**

```json
{
  "stove_state": "alarm",
  "power_level": null,
  "fan_level": null,
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-19T10:30:00+00:00",
  "error_code": 14,
  "error_description": "Mancata accensione"
}
```

```typescript
interface ThermorossiStatusResponse {
  stove_state: "off" | "igniting" | "working" | "standby" | "cleaning" | "alarm" | "modulating";
  power_level: number | null;          // 1-5
  fan_level: number | null;            // 1-6
  data_freshness: "LIVE" | "STALE";
  last_poll_at: string | null;         // ISO 8601
  error_code: number | null;           // WiNet Error field, populated only when stove_state is "alarm"
  error_description: string | null;    // WiNet ErrorDescription, populated only when stove_state is "alarm"
  custom_name: string | null;          // Custom name from device registry, or null if not registered
  device_type: string | null;          // Device type slug from registry, or null if not registered
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
  power_level: number | null; // 1-5, null if unavailable
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
  fan_level: number | null; // 1-6, null if unavailable
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
| <= 48 hours | `raw` | Per-minute readings (~60s polling interval) |
| <= 30 days | `hourly` | Hourly aggregations (avg/min/max per hour) |
| > 30 days | `daily` | Daily aggregations (avg/min/max per day) |

When neither `start` nor `end` is provided (unbounded window), `daily` is returned.

**Response (200 -- raw tier example):**

```json
{
  "items": [
    {
      "timestamp": 1773571200,
      "stove_state": "working",
      "power_level": 3,
      "fan_level": 4,
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

> **Note:** For `hourly` and `daily` tiers, the raw snapshot fields (`stove_state`, `power_level`, `fan_level`) are `null`, while the aggregation fields (`avg_*`, `min_*`, `max_*`, `working_minutes`, `sample_count`) are populated instead.

**Field availability by granularity tier:**

| Field | raw | hourly | daily |
|-------|-----|--------|-------|
| `timestamp` | epoch int | epoch int (hour start) | epoch int (day start) |
| `stove_state` | populated | null | null |
| `power_level` | populated | null | null |
| `fan_level` | populated | null | null |
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
  stove_state: string | null;      // "off" | "igniting" | "working" | "standby" | "cleaning" | "alarm" | "modulating"
  power_level: number | null;
  fan_level: number | null;

  // Hourly/daily tiers only
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

Stove state transitions are slow -- ignition takes 5-15 minutes, shutdown takes several minutes. All control endpoints return **202 Accepted** immediately and include a `suggested_poll_delay_s` hint.

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

---

### State Gating Table

Commands are blocked unless the stove is in an allowed state. The server returns **409 Conflict** if the current state is not allowed.

| Command | Allowed States | Notes |
|---------|---------------|-------|
| `ignite` | `off`, `standby` | Cannot re-ignite a running stove |
| `shutdown` | `working`, `alarm`, `igniting`, `modulating` | Emergency remote shutdown allowed in alarm state |
| `set_power` | `working`, `igniting`, `cleaning`, `modulating` | Settings adjustable while active |
| `set_fan` | `working`, `igniting`, `cleaning`, `modulating` | Settings adjustable while active |
| `set_water_temp` | `working`, `igniting`, `cleaning`, `modulating` | Settings adjustable while active |

> **Note:** `STALE` data freshness does **not** block commands -- the state gate uses the last known state regardless of data age.

---

### POST /commands/ignit

Ignites the stove. Note: the URL path is `/commands/ignit` (no trailing `e`); the response body uses `"command": "ignite"`.

**Authentication:** Required (JWT Bearer or API Key)

**Request body:** None

**Allowed states:** `off`, `standby`

**`suggested_poll_delay_s`:** 15 (stove ignition takes several minutes)

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/commands/ignit \
  -H "X-API-Key: YOUR_API_KEY"
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

**Allowed states:** `working`, `alarm`, `igniting`, `modulating`

**`suggested_poll_delay_s`:** 15

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/commands/shutdown \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `409 Conflict` | Stove is not in `working`, `alarm`, `igniting`, or `modulating` state |
| `503 Service Unavailable` | Provider UNREACHABLE or cache not yet populated |
| `502 Bad Gateway` | WiNet API returned an error |
| `504 Gateway Timeout` | WiNet API timed out |

---

### POST /settings/power

Sets the stove power level. Valid range: 1-5.

**Authentication:** Required (JWT Bearer or API Key)

**Allowed states:** `working`, `igniting`, `cleaning`, `modulating`

**`suggested_poll_delay_s`:** 5

**Request body:**

```json
{
  "value": 3
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/settings/power \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": 3}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `value` is outside 1-5 range |
| `409 Conflict` | Stove is not in `working`, `igniting`, `cleaning`, or `modulating` state |
| `503 Service Unavailable` | Provider UNREACHABLE or cache not yet populated |
| `502 Bad Gateway` | WiNet API returned an error |
| `504 Gateway Timeout` | WiNet API timed out |

---

### POST /settings/fan-level

Sets the stove fan speed level. Valid range: 1-6.

**Authentication:** Required (JWT Bearer or API Key)

**Allowed states:** `working`, `igniting`, `cleaning`, `modulating`

**`suggested_poll_delay_s`:** 5

**Request body:**

```json
{
  "value": 4
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/settings/fan-level \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": 4}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `value` is outside 1-6 range |
| `409 Conflict` | Stove is not in `working`, `igniting`, `cleaning`, or `modulating` state |
| `503 Service Unavailable` | Provider UNREACHABLE or cache not yet populated |
| `502 Bad Gateway` | WiNet API returned an error |
| `504 Gateway Timeout` | WiNet API timed out |

---

### POST /settings/temperature/water

Sets the hydronic water temperature setpoint. Valid range: 40-80C.

**Authentication:** Required (JWT Bearer or API Key)

**Allowed states:** `working`, `igniting`, `cleaning`, `modulating`

**`suggested_poll_delay_s`:** 5

**Request body:**

```json
{
  "value": 70
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/settings/temperature/water \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": 70}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `422 Unprocessable Entity` | `value` is outside 40-80 range |
| `409 Conflict` | Stove is not in `working`, `igniting`, `cleaning`, or `modulating` state |
| `503 Service Unavailable` | Provider UNREACHABLE or cache not yet populated |
| `502 Bad Gateway` | WiNet API returned an error |
| `504 Gateway Timeout` | WiNet API timed out |

---

## State Mapping Reference

The proxy maps WiNet's integer `Status` field to semantic string values. The PWA should use exact equality checks (`===`) on `stove_state`, not substring matching.

| WiNet `Status` (int) | WiNet `StatusDescription` | Proxy `stove_state` | Confidence |
|---|---|---|---|
| 0 | `START` | `"igniting"` | Community docs |
| 1 | `OFF` | `"off"` | HIGH (live-verified 2026-03-18) |
| 2 | `WAIT` / `STANDBY` | `"standby"` | Community docs |
| 3 | `WORK` | `"working"` | HIGH (live-verified 2026-03-18) |
| 4 | `CLEAN` / `CLEANING` | `"cleaning"` | Community docs |
| 5 | `ERROR` / `ALARM` | `"alarm"` | Community docs |
| 6 | `MODULATION` | `"modulating"` | Community docs (not yet live-verified) |
| Other | Unknown | `"off"` (fallback, logged as warning) | N/A |

**Notes:**
- The proxy maps by **integer**, not by string — `StatusDescription` is informational only.
- Unknown `Status` values fall back to `"off"` and emit a structured log warning (`thermorossi.unknown_state`).
- When `stove_state` is `"alarm"`, the response includes `error_code` (int) and `error_description` (string) from WiNet's `Error` and `ErrorDescription` fields.

---

## Frontend Component Suggestions

**Health and Status**
- **StatusBadge** -- map `status` to color (healthy -> green, degraded -> yellow, unreachable -> red). Per D-12.
- **StatCards** -- display `pellet_level`, `exhaust_temp`, `room_temp`, `flame_power` as metric cards with threshold coloring. Per D-12.

**Read: Current State**
- **DataCard** -- display all stove parameters as labeled fields: power_state (Badge), fan_speed, target_temp, mode, pellet_level, flame_power. Per D-11.
- **StatCards** -- temperature readings (room_temp, exhaust_temp, water_temp) as individual cards. Per D-12.

**Control Endpoints** (power, fan, temperature, mode)
- **Toggle** -- power on/off. IMPORTANT: show ConfirmDialog before toggling power state -- display current state and require explicit confirmation (safety gate for pellet stove control). Per D-14.
- **Slider** -- target temperature (range and step from API constraints). Show current measured temperature next to slider for context. Per D-14.
- **Select** -- operating mode dropdown (from available modes list). Per D-14.
- **Slider** -- fan speed (range from API constraints). Per D-14.

---

## Field Verification Status

> Last checked: 2026-03-18

WiNet is a Thermorossi-proprietary cloud protocol. Field names and command names below are sourced from live verification on 2026-03-18 against a powered-on stove via `scripts/verify_thermorossi.py`.

| Field / Command | Confidence | Source | Notes |
|-----------------|------------|--------|-------|
| `GetStatus` response fields (`Status` integer, `StatusDescription` string) | HIGH | Live-verified 2026-03-18 | WiNet returns only `Status` (int) and `StatusDescription` (str) |
| Room temperature, water temp actual, water temp setpoint READ sensors | N/A | Removed | Always returned useless values (-18, 60, 0). Removed in v14 migration. SET command for water temp still works. |
| `Ignit` (POST /commands/ignit) | HIGH | Live-verified 2026-03-18 | WiNet accepted command |
| `Shutdown` (POST /commands/shutdown) | HIGH | Live-verified 2026-03-18 | WiNet returned `{"Success": true}` |
| `SetPower` (POST /settings/power) | HIGH | Live-verified 2026-03-18 | WiNet returned `{"Success": true}` |
| `SetFanLevel` (POST /settings/fan-level) | HIGH | Live-verified 2026-03-18 | WiNet returned `{"Success": true}` |
| `SetWaterTemperature` (POST /settings/temperature/water) | HIGH | Live-verified 2026-03-18 | WiNet returned `{"Success": false, "Error": 501}` (stove was OFF, valid range: 5-80) |

---

## Real-Time (WebSocket)

For real-time push updates without polling, subscribe to the `thermorossi` topic on the WebSocket endpoint.

See [WebSocket API - thermorossi topic](./websocket.md#thermorossi) for the full payload schema, TypeScript interfaces, and subscription example.

**Topic:** `thermorossi`
**Snapshot on subscribe:** Yes -- current stove state
