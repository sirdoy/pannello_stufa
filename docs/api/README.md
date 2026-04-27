# HomeAssistant Network API Documentation

**Base URL:** `https://pdupun8zpr7exw43.myfritz.net`

This API exposes real-time and historical data from your home network via a modular REST interface. Each data provider (Fritz!Box, DIRIGERA, Netatmo, Thermorossi, Hue, Sonos, Raspberry Pi) is mounted under its own path prefix, along with platform modules for rooms, device registry, automations, and authentication. All endpoints require authentication.

---

## Provider Index

| Provider | Prefix | Description |
|----------|--------|-------------|
| [FritzBox](./fritzbox.md) | `/api/v1/fritzbox` | Devices, bandwidth, WAN, WiFi, telephony, network services, history — 22 endpoints |
| [Netatmo](./netatmo.md) | `/api/v1/netatmo` | Energy (thermostat control, room temperatures, schedules), valve calibration (NRV status and calibration), and security camera (status, streams, snapshots, monitoring, events) — 21 endpoints |
| [DIRIGERA](./dirigera.md) | `/api/v1/dirigera` | IKEA smart home — contact and motion sensors, telemetry, history — 8 endpoints |
| [Thermorossi](./thermorossi.md) | `/api/v1/thermorossi` | Pellet stove — state monitoring, history, and remote controls — 10 endpoints |
| [Thermorossi Scheduler](./scheduler.md) | `/api/v1/thermorossi` | Weekly heating scheduler — schedule CRUD, mode control, override, next-action, execution log — 13 endpoints |
| [Hue](./hue.md) | `/api/v1/hue` | Philips Hue — lights, groups, scenes, light control, and history — 10 endpoints |
| [Sonos](./sonos.md) | `/api/v1/sonos` | Sonos speakers — discovery, playback, volume, EQ, home theater, grouping, queue, history — 28 endpoints |
| [Raspberry Pi](./raspberry-pi.md) | `/api/v1/raspi` | System stats — CPU, RAM, disk, temperature, uptime, network — 5 endpoints |

See also: [Netatmo Setup Guide](../NETATMO_SETUP.md)

---

## Platform Modules

| Module | Prefix | Description |
|--------|--------|-------------|
| [Rooms](./rooms.md) | `/api/v1/rooms` | Room management — CRUD, device association, room/house status, health — 11 endpoints |
| [Device Registry](./registry.md) | `/api/v1/registry` | Device types and device CRUD, health — 9 endpoints |
| [Automations](./automations.md) | `/api/v1/automations` | Automation rules CRUD and execution history — 6 endpoints |
| [Auth](./auth.md) | `/auth` | JWT login and API key management — 4 endpoints |
| [Common](./common.md) | N/A | Global health check and aggregated device list — 2 endpoints |

---

## Real-Time

| Protocol | Path | Description |
|----------|------|-------------|
| [WebSocket](./websocket.md) | `/ws/live` | Real-time push — provider data via topic subscription, delta detection, reconnection — 12 topics |

> **New to WebSocket?** See the [WebSocket Real-Time API](./websocket.md) guide for endpoint details, TypeScript interfaces, and a ready-to-use `useProviderData` React hook.

---

## Guides

| Guide | Description |
|-------|-------------|
| [Frontend Integration Guide](./frontend-integration.md) | Step-by-step tutorial for building a dynamic, capability-driven automation editor in a new Next.js 14+ (App Router) project — covers auth, capabilities fetching, condition builder, action configurator, rule submission, WebSocket live feedback, and testing. |

---

## Authentication

All protected endpoints accept either a **JWT Bearer token** or an **API Key**. Both methods grant full access; use API keys for server-to-server integrations and JWT for interactive clients.

### JWT Login

**POST /auth/login**

Authenticates with username and password using OAuth2 password flow. Returns a short-lived JWT token.

**Request** (form-encoded, not JSON):

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Admin username |
| `password` | string | Admin password |

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

```typescript
interface Token {
  access_token: string;
  token_type: string; // always "bearer"
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/auth/login \
  --data-urlencode "username=admin" \
  --data-urlencode "password=YOUR_PASSWORD"
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ username: "admin", password: process.env.API_PASSWORD! }),
});
const { access_token } = await res.json() as Token;

// Use the token in subsequent requests
const data = await fetch(`${process.env.API_BASE_URL}/api/v1/fritzbox/bandwidth`, {
  headers: { Authorization: `Bearer ${access_token}` },
});
```

---

### API Key

API keys are long-lived credentials intended for automated clients. Pass the key in the `X-API-Key` header on every request.

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/bandwidth \
  -H "X-API-Key: YOUR_API_KEY"
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/fritzbox/bandwidth`, {
  headers: { "X-API-Key": process.env.API_KEY! },
});
```

> **Note:** API keys are created and managed via the `/auth/api-keys` endpoints, which require a valid JWT token.

---

### API Key Management

#### POST /auth/api-keys

Create a new API key. Requires JWT Bearer token. The plaintext key is returned **once** at creation time — store it immediately.

**Request body:**

```json
{
  "name": "Next.js production app"
}
```

```typescript
interface APIKeyCreate {
  name: string; // 1-100 chars, describes the key's purpose
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "Next.js production app",
  "api_key": "ha_live_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
  "created_at": "2026-02-13T14:00:00Z"
}
```

```typescript
interface APIKeyResponse {
  id: number;
  name: string;
  api_key: string; // plaintext key — shown ONCE, store immediately
  created_at: string; // ISO 8601
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/auth/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Next.js production app"}'
```

---

#### GET /auth/api-keys

List all active API keys. Requires JWT Bearer token. Does not return plaintext key values.

**Response:**

```json
{
  "keys": [
    {
      "id": 1,
      "name": "Next.js production app",
      "created_at": "2026-02-13T14:00:00Z",
      "last_used_at": "2026-02-13T15:30:00Z",
      "is_active": true
    },
    {
      "id": 2,
      "name": "Mobile app v2",
      "created_at": "2026-02-12T10:00:00Z",
      "last_used_at": null,
      "is_active": true
    }
  ],
  "count": 2
}
```

```typescript
interface APIKeyInfo {
  id: number;
  name: string;
  created_at: string;        // ISO 8601
  last_used_at: string | null;
  is_active: boolean;
}

interface APIKeyListResponse {
  keys: APIKeyInfo[];
  count: number;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/auth/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### DELETE /auth/api-keys/{key_id}

Revoke an API key by ID. Requires JWT Bearer token. Returns 204 No Content on success.

**curl:**

```bash
curl -X DELETE YOUR_BASE_URL/auth/api-keys/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Endpoints

### GET /health

Service health check. Returns overall status, cache age, per-provider health, and observability statistics. No authentication required.

**Response:**

```json
{
  "status": "ok",
  "cache_age_seconds": 25,
  "providers": {
    "fritzbox": "ok"
  },
  "flush": {
    "total_flushes": 42,
    "total_bandwidth_records": 420,
    "total_device_records": 840,
    "last_flush_timestamp": 1770989851,
    "last_flush_duration_ms": 45.3,
    "last_db_size_bytes": 1048576
  },
  "aggregation": {
    "hourly_bandwidth_last_run": 1771179600,
    "hourly_bandwidth_last_count": 12,
    "daily_bandwidth_last_run": 1771113600,
    "daily_bandwidth_last_count": 24,
    "daily_devices_last_run": 1771113600,
    "daily_devices_last_count": 24,
    "total_hourly_runs": 48,
    "total_daily_bandwidth_runs": 2,
    "total_daily_device_runs": 2
  },
  "retention": {
    "last_run": 1771113600,
    "last_raw_bw_deleted": 8640,
    "last_raw_dev_deleted": 17280,
    "last_hourly_bw_deleted": 0,
    "total_runs": 1
  }
}
```

```typescript
interface FlushStats {
  total_flushes: number;
  total_bandwidth_records: number;
  total_device_records: number;
  last_flush_timestamp: number | null;
  last_flush_duration_ms: number | null;
  last_db_size_bytes: number | null;
}

interface AggregationStats {
  hourly_bandwidth_last_run: number | null;
  hourly_bandwidth_last_count: number | null;
  daily_bandwidth_last_run: number | null;
  daily_bandwidth_last_count: number | null;
  daily_devices_last_run: number | null;
  daily_devices_last_count: number | null;
  total_hourly_runs: number;
  total_daily_bandwidth_runs: number;
  total_daily_device_runs: number;
}

interface RetentionStats {
  last_run: number | null;
  last_raw_bw_deleted: number | null;
  last_raw_dev_deleted: number | null;
  last_hourly_bw_deleted: number | null;
  total_runs: number;
}

interface HealthResponse {
  status: "ok" | "degraded";
  cache_age_seconds: number | null;
  providers: Record<string, "ok" | "degraded" | "down"> | null;
  flush: FlushStats | null;
  aggregation: AggregationStats | null;
  retention: RetentionStats | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/health
```

---

### GET /api/v1/devices

Aggregated device list across all 8 registered providers (Fritz!Box, Hue, Sonos, Netatmo, DIRIGERA, Tuya, Raspberry Pi, Thermorossi). The route fans out to every provider in parallel via `Promise.allSettled`, normalizes each provider's items into a unified shape, and returns a sorted paginated list. Each item carries a `provider_type` discriminator identifying its source.

**Authentication:** Required (JWT Bearer or API Key)

**Partial-failure behavior:** Provider listing failures do NOT fail the whole response. When all providers succeed, the response carries `errors: []`. Multi-item providers (Fritz!Box, Hue, Sonos, Netatmo, DIRIGERA, Tuya) that reject contribute zero items and are listed in `errors[]`. Single-item providers (Raspberry Pi, Thermorossi) that reject still emit a single item with `status: 0` and are NOT listed in `errors[]`. HTTP status remains **200** even when `errors[]` is non-empty.

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `provider_type` | string | — | Restrict response to a single provider (e.g. `?provider_type=hue`). One of: `fritzbox`, `hue`, `sonos`, `netatmo`, `dirigera`, `tuya`, `raspi`, `thermorossi`. Invalid values return an empty list with no errors. When set, only the requested provider is contacted (skips fan-out to others). |
| `limit` | integer | 100 | Items per page. Clamped silently to the range 1–1000. |
| `offset` | integer | 0 | Items to skip. Negative values clamp to 0. Offset beyond `total_count` returns an empty `items` array with `total_count` still reflecting the merged total. |

**Sort order:** Items are sorted by `provider_type` ASC (alphabetical), then by `name` ASC using Italian locale (`localeCompare(b, 'it')`). Sort is deterministic across requests so pagination is stable.

**Response:**

```json
{
  "items": [
    {
      "id": "dirigera:sens-1",
      "name": "Porta Ingresso",
      "provider_type": "dirigera",
      "type": "contact_sensor",
      "room": "Ingresso",
      "status": 1
    },
    {
      "id": "fritzbox:AA:BB:CC:DD:EE:FF",
      "name": "iPhone-Federico",
      "provider_type": "fritzbox",
      "type": "network_device",
      "ip": "192.168.178.25",
      "mac": "AA:BB:CC:DD:EE:FF",
      "status": 1
    },
    {
      "id": "hue:1",
      "name": "Lampada Sala",
      "provider_type": "hue",
      "type": "light",
      "room": "Sala",
      "status": 1
    },
    {
      "id": "raspi:host",
      "name": "Raspberry Pi",
      "provider_type": "raspi",
      "type": "host",
      "status": 1
    },
    {
      "id": "thermorossi:stove",
      "name": "Stufa",
      "provider_type": "thermorossi",
      "type": "stove",
      "status": 1
    }
  ],
  "total_count": 14,
  "limit": 100,
  "offset": 0,
  "errors": []
}
```

**Response with a partial provider failure** (Fritz!Box rejected, others succeeded):

```json
{
  "items": [
    { "id": "hue:1", "name": "Lampada Sala", "provider_type": "hue", "type": "light", "room": "Sala", "status": 1 },
    { "id": "raspi:host", "name": "Raspberry Pi", "provider_type": "raspi", "type": "host", "status": 1 }
  ],
  "total_count": 2,
  "limit": 100,
  "offset": 0,
  "errors": [
    { "provider_type": "fritzbox", "message": "Fritz!Box unreachable" }
  ]
}
```

**TypeScript:**

```typescript
type ProviderType =
  | 'fritzbox'
  | 'hue'
  | 'sonos'
  | 'netatmo'
  | 'dirigera'
  | 'tuya'
  | 'raspi'
  | 'thermorossi';

/**
 * Aggregated cross-provider device representation.
 * Required: id, name, provider_type. Optional fields are OMITTED (not null) when absent.
 */
interface Device {
  /** Composite id: `{provider_type}:{native_id}` (globally unique). */
  id: string;
  name: string;
  provider_type: ProviderType;
  /** e.g. 'light', 'speaker', 'thermostat', 'plug', 'network_device', 'host', 'stove'. */
  type?: string;
  ip?: string;
  mac?: string;
  /** 1 = online, 0 = offline. */
  status?: 0 | 1;
  room?: string;
}

interface DeviceAggregatorError {
  provider_type: ProviderType;
  message: string;
}

interface DeviceAggregatorResponse {
  items: Device[];
  total_count: number;
  limit: number;
  offset: number;
  /** Empty when all providers succeeded. Multi-item providers that rejected listed here. */
  errors: DeviceAggregatorError[];
}
```

**curl:**

```bash
# All providers
curl "YOUR_BASE_URL/api/v1/devices?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter to a single provider (skips fan-out to the others)
curl "YOUR_BASE_URL/api/v1/devices?provider_type=hue" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Handling

All errors follow RFC 9457 Problem Details format.

**401 Unauthorized:**

```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Not authenticated"
}
```

**404 Not Found:**

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "API key 99 not found"
}
```

**503 Service Unavailable:**

```json
{
  "type": "about:blank",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "Device data not available - router may be unreachable"
}
```

---

## Pagination

All list endpoints use limit/offset pagination. The response always includes `total_count` so clients can compute total pages.

```typescript
// Fetch page 2 with 20 items per page
const page = 2;
const limit = 20;
const offset = (page - 1) * limit;

const res = await fetch(
  `${BASE_URL}/api/v1/fritzbox/devices?limit=${limit}&offset=${offset}`,
  { headers: { "X-API-Key": API_KEY } }
);
const { items, total_count } = await res.json() as PaginatedResponse<Device>;
const totalPages = Math.ceil(total_count / limit);
```
