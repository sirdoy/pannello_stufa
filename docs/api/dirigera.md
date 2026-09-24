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
  firmware_version: string | null;  // null when the last poll failed (hub unreachable)
  connected_sensors: number;        // 0 when the hub is unreachable
  is_reachable: boolean;
}
```

When a poll fails, the cached hub info becomes `{"firmware_version": null, "connected_sensors": 0, "is_reachable": false}` (still HTTP 200).

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
      "relation_id": null,
      "type": "openCloseSensor",
      "custom_name": "MYGGBETT Ingresso",
      "room": "Ingresso",
      "firmware_version": "24056010",
      "battery_percentage": 90,
      "is_reachable": true,
      "last_seen": "2026-03-12T15:30:00.000Z",
      "is_open": false,
      "device_type": "window_sensor"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "relation_id": "c9d8e7f6-0000-1111-2222-333344445555",
      "type": "occupancySensor",
      "custom_name": "MYGGSPRAY Soggiorno",
      "room": "Soggiorno",
      "firmware_version": "24056010",
      "battery_percentage": 75,
      "is_reachable": true,
      "last_seen": "2026-03-12T15:28:00.000Z",
      "is_detected": false,
      "light_level": 42,
      "device_type": null
    }
  ],
  "count": 2,
  "is_stale": false,
  "fetched_at": "2026-03-12T15:30:05.123456Z",
  "data_freshness": "LIVE"
}
```

**TypeScript type:**

```typescript
interface DirigeraSensor {
  id: string;
  relation_id: string | null;    // DIRIGERA relationId (links occupancySensor <-> lightSensor)
  type: "openCloseSensor" | "occupancySensor" | "motionSensor" | string;
  custom_name: string | null;    // registry custom_name if set, else hub customName (may be null)
  room: string | null;
  firmware_version: string | null;
  battery_percentage: number | null;
  is_reachable: boolean;
  last_seen: string | null;      // ISO 8601 timestamp as reported by the hub
  // Type-specific keys (the key is ABSENT on other sensor types, not null):
  is_open?: boolean;             // only on openCloseSensor
  is_detected?: boolean;         // only on occupancySensor / motionSensor
  light_level?: number | null;   // motionSensor always; occupancySensor only when a
                                 // companion lightSensor (same relation_id) exists
  device_type?: string | null;   // registry device type slug — only on GET /sensors
}

interface DirigeraSensorsResponse {
  sensors: DirigeraSensor[];
  count: number;
  is_stale: boolean;
  fetched_at: string | null;     // ISO 8601 UTC ending in "Z" (last successful poll)
  data_freshness: "LIVE" | "STALE";
}
```

Notes:
- `lightSensor` devices are never returned: their illuminance is merged into the companion `occupancySensor` (matched by `relation_id`) as `light_level`.
- `device_type`, `fetched_at` and `data_freshness` (response-level) are only added by `GET /sensors`; the `/sensors/contact` and `/sensors/motion` responses contain only `sensors`, `count`, `is_stale`.

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
      "relation_id": null,
      "type": "openCloseSensor",
      "custom_name": "MYGGBETT Ingresso",
      "room": "Ingresso",
      "firmware_version": "24056010",
      "battery_percentage": 90,
      "is_reachable": true,
      "last_seen": "2026-03-12T15:30:00.000Z",
      "is_open": false,
      "data_freshness": "LIVE"
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "relation_id": null,
      "type": "openCloseSensor",
      "custom_name": "MYGGBETT Camera",
      "room": "Camera da letto",
      "firmware_version": "24056010",
      "battery_percentage": 83,
      "is_reachable": true,
      "last_seen": "2026-03-12T15:29:45.000Z",
      "is_open": true,
      "data_freshness": "LIVE"
    }
  ],
  "count": 2,
  "is_stale": false
}
```

**TypeScript type:**

```typescript
interface ContactSensor extends Omit<DirigeraSensor, "device_type"> {
  type: "openCloseSensor";
  is_open: boolean;              // always present on contact sensors
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
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

Return only motion/occupancy sensors. Filters to `occupancySensor` device type (legacy `motionSensor` devices are not included here, only in `GET /sensors`). Each sensor includes `data_freshness`; `light_level` is present only when a companion `lightSensor` with the same `relation_id` exists (matched by `relation_id`, not by room).

**Authentication:** Required (JWT Bearer or API Key)

**`data_freshness` values:** Same as `/sensors/contact` (LIVE/STALE/UNREACHABLE based on `is_reachable` and `last_seen` age within 5 minutes).

**Response JSON:**

```json
{
  "sensors": [
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "relation_id": "c9d8e7f6-0000-1111-2222-333344445555",
      "type": "occupancySensor",
      "custom_name": "MYGGSPRAY Soggiorno",
      "room": "Soggiorno",
      "firmware_version": "24056010",
      "battery_percentage": 75,
      "is_reachable": true,
      "last_seen": "2026-03-12T15:28:00.000Z",
      "is_detected": false,
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
interface MotionSensor extends Omit<DirigeraSensor, "device_type" | "is_open"> {
  type: "occupancySensor";
  is_detected: boolean;          // always present on motion sensors (no is_open key)
  light_level?: number | null;   // absent when no companion lightSensor exists
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

Return paginated sensor event history. Events are the raw `sensor_events` rows written by the change-detection poller (`SELECT * FROM sensor_events ... ORDER BY timestamp DESC`). Rows are NOT enriched: there is no sensor name — join client-side with `GET /sensors` on `sensor_id`. Supports filtering by sensor, event type, and time range.

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
      "event_type": "open",
      "timestamp": 1773330000
    },
    {
      "id": 1041,
      "sensor_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "event_type": "close",
      "timestamp": 1773329700
    },
    {
      "id": 1040,
      "sensor_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "event_type": "motion_detected",
      "timestamp": 1773329500
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
  event_type: "open" | "close" | "motion_detected" | "motion_cleared" | string;
  timestamp: number;     // Unix timestamp (seconds)
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

Return DIRIGERA aggregation and retention statistics. Exposes observability data about background job execution: daily rollup aggregation (`aggregation.py`) and event/telemetry retention cleanup (`retention.py`). Stats are in-memory and reset on process restart (`last_*` fields are `null` and `total_runs` is `0` until the job runs once).

**Authentication:** Required (JWT Bearer or API Key)

**Response JSON:**

```json
{
  "aggregation": {
    "last_run": 1773244800,
    "last_sensors_processed": 6,
    "total_runs": 7
  },
  "retention": {
    "last_run": 1773244800,
    "last_raw_events_deleted": 12,
    "last_daily_rows_deleted": 0,
    "last_telemetry_deleted": 288,
    "total_runs": 7
  }
}
```

**TypeScript type:**

```typescript
interface AggregationStats {
  last_run: number | null;               // Unix seconds of last successful run
  last_sensors_processed: number | null; // sensors rolled up in the last run
  total_runs: number;
}

interface RetentionStats {
  last_run: number | null;               // Unix seconds of last successful run
  last_raw_events_deleted: number | null;  // sensor_events rows purged
  last_daily_rows_deleted: number | null;  // sensor_daily rows purged
  last_telemetry_deleted: number | null;   // sensor_telemetry rows purged
  total_runs: number;
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

---

## Frontend Component Suggestions

**Health**
- **StatusBadge** -- map `status` to color (healthy -> green, degraded -> yellow, unreachable -> red). Per D-12.
- **StatCards** -- display `device_count`, `last_poll_at`, `firmware_version` as individual metric cards. Per D-12.

**Sensors** (devices list, device detail, events, event detail, recent events)
- **Table** -- map `devices[]` to rows; columns: name, device_type, room, battery_level (ProgressBar), last_seen. Sortable by room and type. Per D-10.
- **DataCard** -- single device detail showing all attributes as labeled fields: temperature, humidity, battery, firmware. Per D-11.
- **List** -- recent events as a chronological feed; each item shows event_type, device_name, timestamp, value. Per D-10.

**History** (temperature/humidity over time)
- **LineChart** -- x-axis: timestamp, y-axis: temperature or humidity value. Use time range selector (24h, 7d, 30d). API returns auto-granularity data -- chart must handle variable time intervals. Per D-13.

**Statistics / Open-Close Counts**
- **AreaChart** -- cumulative open/close count over time. Per D-13.
- **StatCards** -- display total_open, total_close, daily_average as metric cards. Per D-12.

---

## Real-Time (WebSocket)

For real-time push updates without polling, subscribe to the `dirigera` topic on the WebSocket endpoint.

See [WebSocket API - dirigera topic](./websocket.md#dirigera) for the full payload schema, TypeScript interfaces, and subscription example.

**Topic:** `dirigera`
**Snapshot on subscribe:** Yes -- current sensor readings
