# Tuya Provider API

**Base path:** `/api/v1/tuya`

Tuya smart plug API covering plug health, state, energy monitoring, power control, countdown timers, and energy history -- 6 endpoints. Read endpoints serve from local cache populated by 30-second background polling of Antela plugs via LAN TCP (tinytuya). Control endpoints connect directly to the plug.

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/tuya/health` | Per-device connectivity and data freshness |
| `GET` | `/api/v1/tuya/plugs` | List all plugs with state and energy data |
| `GET` | `/api/v1/tuya/plugs/{device_id}` | Single plug state |
| `POST` | `/api/v1/tuya/plugs/{device_id}/state` | Toggle plug on/off |
| `POST` | `/api/v1/tuya/plugs/{device_id}/timer` | Set countdown timer |
| `GET` | `/api/v1/tuya/plugs/{device_id}/history` | Energy history with auto-granularity |

---

## Table of Contents

- [Health](#health)
  - [GET /health](#get-health)
- [Read Endpoints](#read-endpoints)
  - [GET /plugs](#get-plugs)
  - [GET /plugs/{device_id}](#get-plugsdevice_id)
- [Control Endpoints](#control-endpoints)
  - [Re-poll Pattern](#re-poll-pattern)
  - [POST /plugs/{device_id}/state](#post-plugsdevice_idstate)
  - [POST /plugs/{device_id}/timer](#post-plugsdevice_idtimer)
- [History](#history)
  - [Auto-Granularity](#auto-granularity)
  - [GET /plugs/{device_id}/history](#get-plugsdevice_idhistory)
- [TypeScript Interfaces](#typescript-interfaces)
- [Frontend Component Suggestions](#frontend-component-suggestions)
- [Common Patterns](#common-patterns)

---

## Health

### GET /health

Returns per-device connectivity status and data freshness. Never connects to plugs directly -- reads from in-memory cache only.

The top-level `status` is always `"ok"`. Health degradation is expressed per-device via `data_freshness`.

**Authentication:** Not required

**`data_freshness` values:**

| Value | Meaning |
|-------|---------|
| `LIVE` | Last successful poll within 90 seconds (3x the 30s polling interval) |
| `STALE` | Data older than 90 seconds -- available but may not reflect current plug state |
| `UNREACHABLE` | Plug persistently unreachable -- null energy fields, 503 on read endpoints |

**Response (200):**

```json
{
  "status": "ok",
  "devices": [
    {
      "device_id": "bfabcdef1234567890ab",
      "last_polled_at": 1743074190.456,
      "data_freshness": "LIVE"
    },
    {
      "device_id": "bf1234567890abcdefab",
      "last_polled_at": null,
      "data_freshness": "UNREACHABLE"
    }
  ]
}
```

```typescript
// Source: api/providers/tuya/routes.py — health endpoint
interface TuyaHealth {
  status: string;
  devices: TuyaDeviceHealth[];
}

interface TuyaDeviceHealth {
  device_id: string;
  last_polled_at: number | null;  // Unix epoch float, null if never polled
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
}
```

**curl:**

```bash
curl -s http://localhost:8000/api/v1/tuya/health
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| (none) | Health endpoint always returns 200 -- degradation is expressed per-device |

---

## Read Endpoints

All read endpoints serve from the in-memory cache populated by 30-second background polling via tinytuya LAN TCP. `STALE` freshness returns HTTP **200** (not 503) -- consumers degrade gracefully. Only `UNREACHABLE` (3+ consecutive failures) returns 503.

---

### GET /plugs

Returns all configured Tuya smart plugs with current state and energy data.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
[
  {
    "device_id": "bfabcdef1234567890ab",
    "switch_on": true,
    "power_w": 5.2,
    "voltage_v": 230.1,
    "current_ma": 22.0,
    "energy_kwh": 1.234,
    "countdown_s": 0,
    "data_freshness": "LIVE",
    "last_polled_at": 1743074190.456,
    "custom_name": "Living Room Lamp",
    "device_type": "smart_plug"
  },
  {
    "device_id": "bf1234567890abcdefab",
    "switch_on": null,
    "power_w": null,
    "voltage_v": null,
    "current_ma": null,
    "energy_kwh": null,
    "countdown_s": null,
    "data_freshness": "UNREACHABLE",
    "last_polled_at": null,
    "custom_name": "Office Heater",
    "device_type": "smart_plug"
  }
]
```

```typescript
// Source: api/providers/tuya/routes.py — TuyaPlugResponse
interface TuyaPlug {
  device_id: string;
  switch_on: boolean | null;      // null when UNREACHABLE
  power_w: number | null;         // Active power in watts
  voltage_v: number | null;       // Mains voltage in volts
  current_ma: number | null;      // Current draw in milliamps
  energy_kwh: number | null;      // Cumulative energy consumed (kwh)
  countdown_s: number | null;     // Remaining countdown in seconds (0 = no timer)
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
  last_polled_at: number | null;  // Unix epoch float, null if never polled
  custom_name: string | null;     // Custom name from device registry, null if not registered
  device_type: string | null;     // Device type slug from registry, null if not registered
}
```

**curl:**

```bash
curl -s -H "X-API-Key: YOUR_KEY" http://localhost:8000/api/v1/tuya/plugs
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication token |
| `503 Service Unavailable` | Tuya provider not initialized (first boot) |

---

### GET /plugs/{device_id}

Returns the current state of a single Tuya plug by device ID. Returns null energy fields when `UNREACHABLE`.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `device_id` | string | Tuya device ID (e.g. `"bfabcdef1234567890ab"`) |

**Response (200):** Same shape as a single item from `GET /plugs`.

**curl:**

```bash
curl -s -H "X-API-Key: YOUR_KEY" http://localhost:8000/api/v1/tuya/plugs/bfabcdef1234567890ab
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication token |
| `404 Not Found` | `device_id` not found in cache |
| `503 Service Unavailable` | Tuya provider not initialized |

---

## Control Endpoints

### Re-poll Pattern

Control endpoints (state, timer) connect directly to the plug and include a re-poll step after the command is sent. The response includes a `data_confirmed` field:

- `data_confirmed: true` — re-poll succeeded; response reflects the post-command state
- `data_confirmed: false` — re-poll failed; command was still sent but response reflects pre-command state

There is no separate polling step needed when `data_confirmed: true`. If `data_confirmed: false`, wait ~2 seconds and poll `GET /plugs/{device_id}` to read the updated state.

---

### POST /plugs/{device_id}/state

Toggles a plug on or off. Connects directly to the plug via LAN TCP, then re-polls to confirm the state change.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `device_id` | string | Tuya device ID |

**Request body:**

```json
{
  "on": true
}
```

```typescript
// Source: api/providers/tuya/routes.py — TuyaSetStateRequest
interface TuyaSetStateRequest {
  on: boolean;  // true = switch on, false = switch off
}
```

**Response (200):**

```json
{
  "device_id": "bfabcdef1234567890ab",
  "switch_on": true,
  "power_w": 5.2,
  "voltage_v": 230.1,
  "current_ma": 22.0,
  "energy_kwh": 1.234,
  "countdown_s": 0,
  "data_freshness": "LIVE",
  "last_polled_at": 1743074192.789,
  "custom_name": "Living Room Lamp",
  "device_type": "smart_plug",
  "data_confirmed": true
}
```

```typescript
// Source: api/providers/tuya/routes.py — TuyaPlugMutationResponse
interface TuyaPlugMutation extends TuyaPlug {
  data_confirmed: boolean;  // true if re-poll after command succeeded
}
```

**curl:**

```bash
# Turn plug on
curl -s -X POST \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"on": true}' \
  http://localhost:8000/api/v1/tuya/plugs/bfabcdef1234567890ab/state

# Turn plug off
curl -s -X POST \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"on": false}' \
  http://localhost:8000/api/v1/tuya/plugs/bfabcdef1234567890ab/state
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication token |
| `404 Not Found` | `device_id` not found in cache |
| `422 Unprocessable Entity` | Invalid request body (missing `on` field) |
| `503 Service Unavailable` | Plug unreachable or Tuya client not initialized |

---

### POST /plugs/{device_id}/timer

Sets a countdown timer on a plug. When the timer expires the plug turns off automatically (hardware behavior). Set `seconds: 0` to cancel any active timer.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `device_id` | string | Tuya device ID |

**Request body:**

```json
{
  "seconds": 3600
}
```

```typescript
// Source: api/providers/tuya/routes.py — TuyaSetTimerRequest
interface TuyaSetTimerRequest {
  seconds: number;  // 0 cancels timer; max 86400 (24h); validated ge=0, le=86400
}
```

**Response (200):** Same shape as `POST /state` response, with `data_confirmed` field.

```json
{
  "device_id": "bfabcdef1234567890ab",
  "switch_on": true,
  "power_w": 5.2,
  "voltage_v": 230.1,
  "current_ma": 22.0,
  "energy_kwh": 1.234,
  "countdown_s": 3600,
  "data_freshness": "LIVE",
  "last_polled_at": 1743074195.123,
  "custom_name": "Living Room Lamp",
  "device_type": "smart_plug",
  "data_confirmed": true
}
```

**curl:**

```bash
# Set 1-hour timer (3600 seconds)
curl -s -X POST \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"seconds": 3600}' \
  http://localhost:8000/api/v1/tuya/plugs/bfabcdef1234567890ab/timer

# Cancel timer
curl -s -X POST \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"seconds": 0}' \
  http://localhost:8000/api/v1/tuya/plugs/bfabcdef1234567890ab/timer
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication token |
| `404 Not Found` | `device_id` not found in cache |
| `422 Unprocessable Entity` | `seconds` out of range (must be 0–86400) |
| `503 Service Unavailable` | Plug unreachable or Tuya client not initialized |

---

## History

### Auto-Granularity

The history endpoint automatically selects the granularity based on the time window requested. You do not need to specify granularity -- the API picks the right table:

| Time Window | Granularity | Source Table | Raw Fields Available |
|-------------|-------------|--------------|---------------------|
| `<= 24h` | `raw` | `tuya_plug_state` | `switch_on`, `power_w`, `voltage_v`, `current_ma`, `energy_kwh` |
| `<= 7d` | `hourly` | `tuya_plug_state_hourly` | `avg_power_w`, `min_voltage_v`, `max_voltage_v`, `max_current_ma`, `energy_kwh_delta`, `sample_count` |
| `> 7d` | `daily` | `tuya_plug_state_daily` | `avg_power_w`, `min_voltage_v`, `max_voltage_v`, `max_current_ma`, `energy_kwh_delta`, `sample_count` |

**Key points:**
- `raw` rows contain `switch_on`, `power_w`, `voltage_v`, `current_ma`, `energy_kwh`; aggregated fields are `null`
- `hourly`/`daily` rows contain aggregated fields; raw measurement fields are `null`
- `energy_kwh_delta` (hourly/daily) = energy consumed during that period (not cumulative)
- `sample_count` tells you how many raw measurements were aggregated into the row
- The response always includes the resolved `granularity` field so consumers know which data type they received

---

### GET /plugs/{device_id}/history

Returns paginated historical energy data for a single plug. Granularity is auto-selected based on the time window.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `device_id` | string | Tuya device ID |

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `period` | string | `24h` | Preset window: `24h`, `7d`, `30d`, `90d`, `1y` |
| `from` | integer | — | Start epoch (seconds). Overrides `period` when provided |
| `to` | integer | — | End epoch (seconds). Overrides `period` when provided |
| `page` | integer | `1` | Page number (1-based) |
| `page_size` | integer | `100` | Items per page (1–1000) |

`from`/`to` take precedence over `period` when either is provided. If only `from` is set, `to` defaults to now. If only `to` is set, `from` defaults to 0 (epoch start).

**Response (200) — raw granularity (period=24h):**

```json
{
  "device_id": "bfabcdef1234567890ab",
  "granularity": "raw",
  "period": {
    "from": 1742987790,
    "to": 1743074190
  },
  "page": 1,
  "page_size": 100,
  "total": 2880,
  "items": [
    {
      "timestamp": 1742987820,
      "device_id": "bfabcdef1234567890ab",
      "granularity": "raw",
      "switch_on": true,
      "power_w": 5.2,
      "voltage_v": 230.1,
      "current_ma": 22.0,
      "energy_kwh": 1.234,
      "avg_power_w": null,
      "min_voltage_v": null,
      "max_voltage_v": null,
      "max_current_ma": null,
      "energy_kwh_delta": null,
      "sample_count": null
    }
  ]
}
```

**Response (200) — hourly granularity (period=7d):**

```json
{
  "device_id": "bfabcdef1234567890ab",
  "granularity": "hourly",
  "period": {
    "from": 1742468190,
    "to": 1743074190
  },
  "page": 1,
  "page_size": 100,
  "total": 168,
  "items": [
    {
      "timestamp": 1742468400,
      "device_id": "bfabcdef1234567890ab",
      "granularity": "hourly",
      "switch_on": null,
      "power_w": null,
      "voltage_v": null,
      "current_ma": null,
      "energy_kwh": null,
      "avg_power_w": 4.8,
      "min_voltage_v": 228.5,
      "max_voltage_v": 231.2,
      "max_current_ma": 23.1,
      "energy_kwh_delta": 0.0048,
      "sample_count": 120
    }
  ]
}
```

**curl:**

```bash
# Last 24h (raw granularity, default)
curl -s -H "X-API-Key: YOUR_KEY" \
  "http://localhost:8000/api/v1/tuya/plugs/bfabcdef1234567890ab/history"

# Last 7 days (hourly granularity)
curl -s -H "X-API-Key: YOUR_KEY" \
  "http://localhost:8000/api/v1/tuya/plugs/bfabcdef1234567890ab/history?period=7d"

# Last 30 days (daily granularity)
curl -s -H "X-API-Key: YOUR_KEY" \
  "http://localhost:8000/api/v1/tuya/plugs/bfabcdef1234567890ab/history?period=30d"

# Custom range with pagination
curl -s -H "X-API-Key: YOUR_KEY" \
  "http://localhost:8000/api/v1/tuya/plugs/bfabcdef1234567890ab/history?from=1742987790&to=1743074190&page=2&page_size=50"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication token |
| `404 Not Found` | `device_id` not found in cache |
| `422 Unprocessable Entity` | `page` < 1 or `page_size` out of range (1–1000) |

---

## TypeScript Interfaces

All interfaces below match the Pydantic models in `api/providers/tuya/routes.py` field-for-field.

```typescript
// Source: api/providers/tuya/routes.py — health endpoint
interface TuyaHealth {
  status: string;
  devices: TuyaDeviceHealth[];
}

interface TuyaDeviceHealth {
  device_id: string;
  last_polled_at: number | null;  // Unix epoch float
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
}

// Source: TuyaPlugResponse
interface TuyaPlug {
  device_id: string;
  switch_on: boolean | null;
  power_w: number | null;
  voltage_v: number | null;
  current_ma: number | null;
  energy_kwh: number | null;
  countdown_s: number | null;
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
  last_polled_at: number | null;
  custom_name: string | null;   // From device registry (INT-01)
  device_type: string | null;   // From device registry (INT-01)
}

// Source: TuyaPlugMutationResponse (extends TuyaPlugResponse)
interface TuyaPlugMutation extends TuyaPlug {
  data_confirmed: boolean;  // true if re-poll after command succeeded
}

// Source: TuyaSetStateRequest
interface TuyaSetStateRequest {
  on: boolean;
}

// Source: TuyaSetTimerRequest
interface TuyaSetTimerRequest {
  seconds: number;  // 0–86400 (validated by API)
}

// Source: TuyaHistoryItem
interface TuyaHistoryItem {
  timestamp: number;                   // Unix epoch (seconds)
  device_id: string;
  granularity: "raw" | "hourly" | "daily";
  // Raw fields (non-null for granularity="raw", null otherwise)
  switch_on?: boolean | null;
  power_w?: number | null;
  voltage_v?: number | null;
  current_ma?: number | null;
  energy_kwh?: number | null;
  // Aggregated fields (non-null for granularity="hourly"|"daily", null otherwise)
  avg_power_w?: number | null;
  min_voltage_v?: number | null;
  max_voltage_v?: number | null;
  max_current_ma?: number | null;
  energy_kwh_delta?: number | null;    // Energy consumed during this period
  sample_count?: number | null;        // Number of raw rows aggregated
}

// Source: TuyaHistoryResponse
interface TuyaHistoryResponse {
  device_id: string;
  granularity: "raw" | "hourly" | "daily";
  period: { from: number; to: number };  // Resolved epoch range
  page: number;
  page_size: number;
  total: number;
  items: TuyaHistoryItem[];
}
```

---

## Frontend Component Suggestions

### Real-time Power Gauge

Display live power consumption from `GET /plugs/{device_id}`. Update via WebSocket topic `"tuya"` or poll every 5 seconds. Show `power_w`, `voltage_v`, and `current_ma` in a gauge or metric card. Grey out when `data_freshness === "UNREACHABLE"`.

```typescript
// Subscribe to live updates
ws.send(JSON.stringify({ type: "subscribe", topics: ["tuya"] }));

// Handle incoming data
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.topic === "tuya") updatePowerGauge(msg.data);
};
```

### On/Off Toggle with Optimistic UI

Use `POST /plugs/{device_id}/state` with optimistic state update. If `data_confirmed: true`, commit the optimistic state. If `data_confirmed: false`, revert and show a warning, then re-fetch from `GET /plugs/{device_id}` after 2 seconds.

```typescript
async function togglePlug(deviceId: string, on: boolean) {
  // Optimistic update
  setPlugState(deviceId, { switch_on: on });

  const res = await fetch(`/api/v1/tuya/plugs/${deviceId}/state`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ on }),
  });
  const data: TuyaPlugMutation = await res.json();

  if (data.data_confirmed) {
    setPlugState(deviceId, data);
  } else {
    // Revert optimistic update, re-fetch after delay
    setTimeout(() => refetchPlug(deviceId), 2000);
  }
}
```

### Energy Consumption Chart

Use `GET /plugs/{device_id}/history` with a period selector. Auto-granularity means you just change `period` and the chart adapts:

- `24h` → line chart of `power_w` over time (raw, ~2 pts/min)
- `7d` → bar chart of `energy_kwh_delta` per hour (hourly aggregation)
- `30d`/`90d`/`1y` → bar chart of `energy_kwh_delta` per day (daily aggregation)

Handle the `granularity` field in the response to choose the right chart type and field mapping.

### Countdown Timer Display with Cancel Button

Show `countdown_s` from `GET /plugs/{device_id}`. If `countdown_s > 0`, display a countdown and a cancel button. Canceling sends `POST /timer` with `{"seconds": 0}`.

Decrement the displayed countdown client-side every second to avoid polling. Re-fetch the plug state when the countdown reaches 0.

### Device Health Status Indicator

Show a colored badge based on `data_freshness`:

| `data_freshness` | Badge | Color |
|------------------|-------|-------|
| `LIVE` | Live | Green |
| `STALE` | Stale | Yellow |
| `UNREACHABLE` | Offline | Red |

Use `GET /health` for a lightweight poll (no auth required) to check all devices at once on dashboard mount.

### Multi-plug Dashboard Grid

Fetch all plugs via `GET /plugs` and render a grid card per plug. Each card shows:
- `custom_name` (or `device_id` if null)
- On/off toggle (uses `POST /state`)
- Live power gauge (`power_w`, `voltage_v`, `current_ma`)
- `data_freshness` badge
- `energy_kwh` total counter
- Timer button (opens `POST /timer` dialog)

---

## Common Patterns

### Pagination for History

```typescript
async function fetchAllHistory(deviceId: string, period = "30d"): Promise<TuyaHistoryItem[]> {
  const pageSize = 500;
  let page = 1;
  let allItems: TuyaHistoryItem[] = [];

  while (true) {
    const res = await fetch(
      `/api/v1/tuya/plugs/${deviceId}/history?period=${period}&page=${page}&page_size=${pageSize}`,
      { headers: { "X-API-Key": API_KEY } }
    );
    const data: TuyaHistoryResponse = await res.json();
    allItems = allItems.concat(data.items);

    if (allItems.length >= data.total) break;
    page++;
  }

  return allItems;
}
```

### Data Freshness Handling

```typescript
function isDataStale(plug: TuyaPlug): boolean {
  return plug.data_freshness !== "LIVE";
}

function isDeviceUnreachable(plug: TuyaPlug): boolean {
  return plug.data_freshness === "UNREACHABLE";
}

// Safely read energy data (null-safe)
function getPowerW(plug: TuyaPlug): string {
  if (isDeviceUnreachable(plug)) return "Offline";
  if (plug.power_w === null) return "—";
  return `${plug.power_w.toFixed(1)} W`;
}
```

### Mutation Re-poll Pattern (`data_confirmed` Field)

Control endpoints return `data_confirmed: true` when the re-poll after the command succeeded. When `false`, the plug accepted the command but the re-poll failed:

```typescript
async function sendTimerAndConfirm(deviceId: string, seconds: number) {
  const res = await fetch(`/api/v1/tuya/plugs/${deviceId}/timer`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ seconds }),
  });

  const mutation: TuyaPlugMutation = await res.json();

  if (!mutation.data_confirmed) {
    // Command sent but confirmation failed — re-poll after 2s
    await new Promise(r => setTimeout(r, 2000));
    return await fetchPlug(deviceId);
  }

  return mutation;
}
```

### WebSocket Subscription for Live Updates

Subscribe to real-time Tuya events via the WebSocket `/ws/live` endpoint:

```typescript
const ws = new WebSocket("wss://YOUR_HOST/ws/live");

ws.onopen = () => {
  // Authenticate first
  ws.send(JSON.stringify({ type: "auth", token: JWT_TOKEN }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "auth_ok") {
    // Subscribe to Tuya provider updates
    ws.send(JSON.stringify({ type: "subscribe", topics: ["tuya"] }));
  }

  if (msg.topic === "tuya" && msg.type === "snapshot") {
    // Full state on subscribe
    updateAllPlugs(msg.data);
  }

  if (msg.topic === "tuya" && msg.type === "delta") {
    // Only changed plugs
    updateChangedPlugs(msg.data);
  }
};
```

See [WebSocket API](./websocket.md) for full connection lifecycle, authentication, and topic reference.
