# DIRIGERA Provider API

**Base path:** `/api/v1/dirigera`

IKEA DIRIGERA hub integration for smart sensors (contact and motion/occupancy) — 8 endpoints. All data is served from an in-memory cache polled from the hub. Sensor events are persisted to SQLite for history queries. Motion sensors use DIRIGERA's `occupancySensor` device type; companion `lightSensor` illuminance data is automatically merged by room.

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/dirigera/health` | Hub connection status and firmware version |
| `GET` | `/api/v1/dirigera/sensors` | All sensors (contact and motion) |
| `GET` | `/api/v1/dirigera/sensors/contact` | Contact (open/close) sensors only |
| `GET` | `/api/v1/dirigera/sensors/motion` | Motion/occupancy sensors only |
| `GET` | `/api/v1/dirigera/sensors/summary` | Fleet-wide sensor summary |
| `GET` | `/api/v1/dirigera/history` | Paginated sensor event history |
| `GET` | `/api/v1/dirigera/stats` | Aggregation and retention statistics |
| `GET` | `/api/v1/dirigera/telemetry` | Paginated sensor telemetry history (battery, light level) |

---

## Table of Contents

- [Health](#health)
- [Sensors](#sensors)
  - [GET /sensors](#get-sensors)
  - [GET /sensors/contact](#get-sensorscontact)
  - [GET /sensors/motion](#get-sensorsmotion)
  - [GET /sensors/summary](#get-sensorssummary)
- [History](#history)
  - [GET /history](#get-history)
- [Statistics](#statistics)
  - [GET /stats](#get-stats)
- [Telemetry](#telemetry)
  - [GET /telemetry](#get-telemetry)

---

## Health

### GET /health

Return DIRIGERA hub connection status including firmware version, connected sensor count, and reachability.

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "firmware_version": "2.465.0",
  "connected_sensors": 6,
  "is_reachable": true
}
```

**TypeScript type:**

```typescript
interface DirigeraHealthResponse {
  firmware_version: string;
  connected_sensors: number;
  is_reachable: boolean;
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/dirigera/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 503 | No hub data available in cache |

---

## Sensors

### GET /sensors

Return the full list of DIRIGERA sensors. Includes all sensor types (contact and motion) with metadata per sensor.

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "sensors": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "openCloseSensor",
      "custom_name": "MYGGBETT Ingresso",
      "room": "Ingresso",
      "firmware_version": "24056010",
      "battery_percentage": 90,
      "is_reachable": true,
      "is_open": false,
      "last_seen": "2026-03-12T15:30:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "type": "occupancySensor",
      "custom_name": "MYGGBETT Soggiorno",
      "room": "Soggiorno",
      "firmware_version": "24056010",
      "battery_percentage": 75,
      "is_reachable": true,
      "is_open": null,
      "last_seen": "2026-03-12T15:28:00.000Z"
    }
  ],
  "count": 2,
  "is_stale": false
}
```

**TypeScript type:**

```typescript
interface DirigeraSensor {
  id: string;
  type: "openCloseSensor" | "occupancySensor" | string;
  custom_name: string;
  room: string | null;
  firmware_version: string | null;
  battery_percentage: number | null;
  is_reachable: boolean;
  is_open: boolean | null;       // null for motion sensors
  last_seen: string | null;      // ISO 8601 timestamp
}

interface DirigeraSensorsResponse {
  sensors: DirigeraSensor[];
  count: number;
  is_stale: boolean;
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/dirigera/sensors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 503 | Sensor data not available in cache |

---

### GET /sensors/contact

Return only contact (open/close) sensors. Filters to `openCloseSensor` type. Each sensor includes a `data_freshness` field computed from `is_reachable` and `last_seen` age.

**Authentication:** Required (JWT Bearer or API Key)

**`data_freshness` values:**

| Value | Condition |
|-------|-----------|
| `LIVE` | Sensor is reachable and last seen within 5 minutes |
| `STALE` | Sensor is reachable but last seen more than 5 minutes ago, or `last_seen` is null |
| `UNREACHABLE` | Sensor is not reachable |

**Response JSON:**

```json
{
  "sensors": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "openCloseSensor",
      "custom_name": "MYGGBETT Ingresso",
      "room": "Ingresso",
      "firmware_version": "24056010",
      "battery_percentage": 90,
      "is_reachable": true,
      "is_open": false,
      "last_seen": "2026-03-12T15:30:00.000Z",
      "data_freshness": "LIVE"
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "type": "openCloseSensor",
      "custom_name": "MYGGBETT Camera",
      "room": "Camera da letto",
      "firmware_version": "24056010",
      "battery_percentage": 83,
      "is_reachable": true,
      "is_open": true,
      "last_seen": "2026-03-12T15:29:45.000Z",
      "data_freshness": "LIVE"
    }
  ],
  "count": 2,
  "is_stale": false
}
```

**TypeScript type:**

```typescript
interface ContactSensor extends DirigeraSensor {
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
  is_open: boolean;
}

interface ContactSensorsResponse {
  sensors: ContactSensor[];
  count: number;
  is_stale: boolean;
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/dirigera/sensors/contact \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 503 | Sensor data not available in cache |

---

### GET /sensors/motion

Return only motion/occupancy sensors. Filters to `occupancySensor` device type. Each sensor includes `data_freshness` and `light_level` fields. Companion `lightSensor` illuminance is automatically merged by room name.

**Authentication:** Required (JWT Bearer or API Key)

**`data_freshness` values:** Same as `/sensors/contact` (LIVE/STALE/UNREACHABLE based on `is_reachable` and `last_seen` age within 5 minutes).

**Response JSON:**

```json
{
  "sensors": [
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "type": "occupancySensor",
      "custom_name": "MYGGBETT Soggiorno",
      "room": "Soggiorno",
      "firmware_version": "24056010",
      "battery_percentage": 75,
      "is_reachable": true,
      "is_open": null,
      "last_seen": "2026-03-12T15:28:00.000Z",
      "light_level": 42,
      "data_freshness": "LIVE"
    }
  ],
  "count": 1,
  "is_stale": false
}
```

**TypeScript type:**

```typescript
interface MotionSensor extends DirigeraSensor {
  light_level: number | null;
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
}

interface MotionSensorsResponse {
  sensors: MotionSensor[];
  count: number;
  is_stale: boolean;
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/dirigera/sensors/motion \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 503 | Sensor data not available in cache |

---

### GET /sensors/summary

Return fleet-wide sensor summary. Aggregates total count, open contacts, offline sensors, and low-battery sensors (threshold: battery <= 20%).

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "total_sensors": 6,
  "open_count": 1,
  "offline_count": 0,
  "low_battery_count": 0,
  "is_stale": false
}
```

**TypeScript type:**

```typescript
interface SensorSummaryResponse {
  total_sensors: number;
  open_count: number;        // Contact sensors currently open
  offline_count: number;     // Sensors where is_reachable is false
  low_battery_count: number; // Sensors with battery_percentage <= 20
  is_stale: boolean;
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/dirigera/sensors/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 503 | Sensor data not available in cache |

---

## History

### GET /history

Return paginated sensor event history. Query events recorded by the change detection poller. Supports filtering by sensor, event type, and time range.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `sensor_id` | string | null | Filter events for a specific sensor ID |
| `event_type` | string | null | Filter by event type: `open`, `close`, `motion_detected`, `motion_cleared` |
| `start` | integer | null | Start of time range (Unix seconds, inclusive) |
| `end` | integer | null | End of time range (Unix seconds, exclusive) |
| `limit` | integer | `100` | Max events per page (1–1000) |
| `offset` | integer | `0` | Number of events to skip |

**Response JSON:**

```json
{
  "events": [
    {
      "id": 1042,
      "sensor_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "sensor_name": "MYGGBETT Ingresso",
      "event_type": "open",
      "recorded_at": 1773330000
    },
    {
      "id": 1041,
      "sensor_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "sensor_name": "MYGGBETT Ingresso",
      "event_type": "close",
      "recorded_at": 1773329700
    },
    {
      "id": 1040,
      "sensor_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "sensor_name": "MYGGBETT Soggiorno",
      "event_type": "motion_detected",
      "recorded_at": 1773329500
    }
  ],
  "total": 1042,
  "limit": 100,
  "offset": 0
}
```

**TypeScript type:**

```typescript
interface SensorEvent {
  id: number;
  sensor_id: string;
  sensor_name: string | null;
  event_type: "open" | "close" | "motion_detected" | "motion_cleared" | string;
  recorded_at: number;   // Unix timestamp
}

interface SensorHistoryResponse {
  events: SensorEvent[];
  total: number;
  limit: number;
  offset: number;
}
```

**curl:**

```bash
# All events (paginated)
curl -s "YOUR_BASE_URL/api/v1/dirigera/history?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by sensor and event type
curl -s "YOUR_BASE_URL/api/v1/dirigera/history?sensor_id=YOUR_SENSOR_ID&event_type=open" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by time range
curl -s "YOUR_BASE_URL/api/v1/dirigera/history?start=1773000000&end=1773330000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |

---

## Statistics

### GET /stats

Return DIRIGERA aggregation and retention statistics. Exposes observability data about background job execution: daily rollup aggregation and event retention cleanup.

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "aggregation": {
    "last_run_at": 1773244800,
    "last_run_status": "ok",
    "rows_aggregated_last_run": 248,
    "total_runs": 7,
    "total_rows_aggregated": 1736
  },
  "retention": {
    "last_run_at": 1773244800,
    "last_run_status": "ok",
    "rows_deleted_last_run": 0,
    "total_runs": 7,
    "total_rows_deleted": 42
  }
}
```

**TypeScript type:**

```typescript
interface AggregationStats {
  last_run_at: number | null;
  last_run_status: string | null;
  rows_aggregated_last_run: number;
  total_runs: number;
  total_rows_aggregated: number;
}

interface RetentionStats {
  last_run_at: number | null;
  last_run_status: string | null;
  rows_deleted_last_run: number;
  total_runs: number;
  total_rows_deleted: number;
}

interface DirigeraStatsResponse {
  aggregation: AggregationStats;
  retention: RetentionStats;
}
```

**curl:**

```bash
curl -s YOUR_BASE_URL/api/v1/dirigera/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |

---

## Telemetry

### GET /telemetry

Return paginated sensor telemetry history. Records battery percentage and light
level sampled every 5 minutes by the poller. Supports filtering by sensor and
time range.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `sensor_id` | string | null | Filter readings for a specific sensor ID |
| `start` | integer | null | Start of time range (Unix seconds, inclusive) |
| `end` | integer | null | End of time range (Unix seconds, exclusive) |
| `limit` | integer | `100` | Max readings per page (1-1000) |
| `offset` | integer | `0` | Number of readings to skip |

**Response (200):**

```json
{
  "telemetry": [
    {
      "id": 1042,
      "sensor_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "battery_percentage": 75,
      "light_level": 42,
      "timestamp": 1773330000
    }
  ],
  "total": 1042,
  "limit": 100,
  "offset": 0
}
```

**TypeScript type:**

```typescript
interface SensorTelemetryReading {
  id: number;
  sensor_id: string;
  battery_percentage: number | null;
  light_level: number | null;
  timestamp: number;   // Unix timestamp (seconds)
}

interface SensorTelemetryResponse {
  telemetry: SensorTelemetryReading[];
  total: number;
  limit: number;
  offset: number;
}
```

**curl:**

```bash
# All telemetry (paginated)
curl -s "YOUR_BASE_URL/api/v1/dirigera/telemetry?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by sensor and time range
curl -s "YOUR_BASE_URL/api/v1/dirigera/telemetry?sensor_id=YOUR_SENSOR_ID&start=1773000000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
