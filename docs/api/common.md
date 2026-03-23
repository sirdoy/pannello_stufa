# Common Endpoints

**Base path:** mixed — `/health` (no prefix) and `/api/v1/devices`

Global platform endpoints shared across all modules — system health check and aggregated device listing. The health endpoint is mounted at the application root (no `/api/v1` prefix) and does not require authentication. The devices endpoint aggregates device data from all registered providers and requires authentication. This file also defines the shared `PaginatedResponse<T>` TypeScript interface referenced by registry.md, automations.md, and this module's devices endpoint. 2 endpoints.

---

## Quick Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Global system health and provider status | No |
| `GET` | `/api/v1/devices` | Aggregated device list across all providers (paginated) | Yes |

---

## Table of Contents

- [Pagination Parameters](#pagination-parameters)
- [GET /health](#get-health)
- [GET /api/v1/devices](#get-apiv1devices)
- [TypeScript Interfaces](#typescript-interfaces)

---

## Pagination Parameters

Both modules that use pagination accept the same query parameters. Documented here once for reference.

| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `limit` | int | 100 | 1–1000 | Items per page |
| `offset` | int | 0 | >= 0 | Items to skip |

---

## GET /health

Returns overall system health, provider connectivity status, and background task statistics. Mounted at the application root — no `/api/v1` prefix.

**Authentication:** Not required

**Response (200):**

```json
{
  "status": "ok",
  "cache_age_seconds": 12,
  "providers": {
    "fritzbox": "ok",
    "dirigera": "ok",
    "netatmo": "ok",
    "hue": "ok",
    "sonos": "ok",
    "raspi": "ok"
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
  },
  "thermorossi_aggregation": null,
  "thermorossi_retention": null
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"ok"` \| `"degraded"` | Overall platform health |
| `cache_age_seconds` | int \| null | Age of Fritz!Box cache data in seconds |
| `providers` | object \| null | Map of provider name to status string (`"ok"`, `"degraded"`, `"down"`) |
| `flush` | FlushStats \| null | Database flush statistics (Fritz!Box provider) |
| `aggregation` | AggregationStats \| null | Data aggregation statistics (Fritz!Box provider) |
| `retention` | RetentionStats \| null | Data retention cleanup statistics (Fritz!Box provider) |
| `thermorossi_aggregation` | ThermorossiAggregationStats \| null | Thermorossi data aggregation statistics |
| `thermorossi_retention` | ThermorossiRetentionStats \| null | Thermorossi data retention cleanup statistics |

`status` is set to `"degraded"` if cache data is older than 600 seconds or if any provider reports non-OK health.

**curl:**

```bash
curl http://localhost:8000/health
```

---

## GET /api/v1/devices

Returns a paginated list of all devices aggregated from all registered providers. Devices include a `provider_type` field identifying their source provider.

**Authentication:** Required (JWT Bearer or API Key)

**Query parameters:** `limit`, `offset` — see [Pagination Parameters](#pagination-parameters). Default `limit` for this endpoint is 100.

**Response (200) — `PaginatedResponse<Device>`:**

```json
{
  "items": [
    {
      "ip": "192.168.178.25",
      "name": "iPhone-Federico",
      "mac": "AA:BB:CC:DD:EE:FF",
      "status": 1,
      "provider_type": "fritzbox",
      "custom_name": "Telefono Federico",
      "device_type": "mobile"
    },
    {
      "ip": "192.168.178.192",
      "name": "DIRIGERA-Hub",
      "mac": "11:22:33:44:55:66",
      "status": 1,
      "provider_type": "dirigera",
      "custom_name": null,
      "device_type": "hub"
    }
  ],
  "total_count": 24,
  "limit": 100,
  "offset": 0
}
```

**Device fields:**

| Field | Type | Description |
|-------|------|-------------|
| `ip` | string | Device IP address |
| `name` | string | Device hostname or name |
| `mac` | string | Device MAC address |
| `status` | number | `1` = online, `0` = offline |
| `provider_type` | string \| null | Source provider (`"fritzbox"`, `"dirigera"`, etc.) |
| `custom_name` | string \| null | Custom name from device registry |
| `device_type` | string \| null | Device type from device registry |

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `503` | Provider data not available (providers not initialized or router unreachable) |

**curl:**

```bash
curl http://localhost:8000/api/v1/devices \
  -H "Authorization: Bearer <token>"
```

With API key:

```bash
curl http://localhost:8000/api/v1/devices \
  -H "X-API-Key: <key>"
```

With pagination:

```bash
curl "http://localhost:8000/api/v1/devices?limit=20&offset=40" \
  -H "Authorization: Bearer <token>"
```

---

## Frontend Component Suggestions

**Global Health** (GET /health)
- **StatusBadge** -- map overall `status` to color (ok -> green, degraded -> yellow, down -> red). Display prominently as system-wide health indicator. Per D-12 (health endpoint).
- **StatCards** -- one card per provider showing provider name, status badge, and last_check timestamp. Arrange in a responsive grid. Per D-12 (health endpoint).

**Aggregated Devices** (GET /api/v1/devices)
- **Table** -- map `devices[]` to paginated rows; columns: name, provider (Badge), device_type, ip_address, status (StatusBadge: online -> green, offline -> red). Use pagination controls for large device lists. Per D-10 (list endpoint).

---

## TypeScript Interfaces

```typescript
// Shared paginated response — referenced by registry.md and automations.md
interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  limit: number;
  offset: number;
}

interface HealthResponse {
  status: "ok" | "degraded";
  cache_age_seconds: number | null;
  providers: Record<string, string> | null;
  flush: FlushStats | null;
  aggregation: AggregationStats | null;
  retention: RetentionStats | null;
  thermorossi_aggregation: ThermorossiAggregationStats | null;
  thermorossi_retention: ThermorossiRetentionStats | null;
}

interface Device {
  ip: string;
  name: string;
  mac: string;
  status: number;       // 1 = online, 0 = offline
  provider_type: string | null;
  custom_name: string | null;
  device_type: string | null;
}

interface FlushStats {
  total_flushes: number;
  total_bandwidth_records: number;
  total_device_records: number;
  last_flush_timestamp: number | null;      // Unix timestamp
  last_flush_duration_ms: number | null;
  last_db_size_bytes: number | null;
}

interface AggregationStats {
  hourly_bandwidth_last_run: number | null;   // Unix timestamp
  hourly_bandwidth_last_count: number | null;
  daily_bandwidth_last_run: number | null;    // Unix timestamp
  daily_bandwidth_last_count: number | null;
  daily_devices_last_run: number | null;      // Unix timestamp
  daily_devices_last_count: number | null;
  total_hourly_runs: number;
  total_daily_bandwidth_runs: number;
  total_daily_device_runs: number;
}

interface RetentionStats {
  last_run: number | null;              // Unix timestamp
  last_raw_bw_deleted: number | null;
  last_raw_dev_deleted: number | null;
  last_hourly_bw_deleted: number | null;
  total_runs: number;
}

interface ThermorossiAggregationStats {
  hourly_last_run: number | null;       // Unix timestamp
  hourly_last_count: number | null;
  daily_last_run: number | null;        // Unix timestamp
  daily_last_count: number | null;
  total_hourly_runs: number;
  total_daily_runs: number;
}

interface ThermorossiRetentionStats {
  last_run: number | null;              // Unix timestamp
  last_raw_deleted: number | null;
  last_hourly_deleted: number | null;
  total_runs: number;
}
```
