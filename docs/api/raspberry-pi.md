# Raspberry Pi Provider API

**Base path:** `/api/v1/raspi`

Raspberry Pi system statistics — CPU, RAM, disk, temperature, uptime, load averages, network I/O, and process count. All data is collected live via `psutil` on each request (no background polling, no database persistence).

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/raspi/health` | Provider health |
| `GET` | `/api/v1/raspi/cpu` | CPU usage percentage |
| `GET` | `/api/v1/raspi/memory` | RAM usage statistics |
| `GET` | `/api/v1/raspi/disk` | Disk usage for root partition |
| `GET` | `/api/v1/raspi/system` | Aggregated system stats (temperature, uptime, load, processes, network) |

---

## Table of Contents

- [Health](#health)
  - [GET /health](#get-health)
- [Read Endpoints](#read-endpoints)
  - [GET /cpu](#get-cpu)
  - [GET /memory](#get-memory)
  - [GET /disk](#get-disk)
  - [GET /system](#get-system)

---

## Health

### GET /health

Returns Raspberry Pi provider health. Always returns `"ok"` — this is a local data source with no external dependencies.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "status": "ok",
  "data_freshness": "LIVE"
}
```

```typescript
interface RaspiHealthResponse {
  status: "ok";
  data_freshness: "LIVE"; // always LIVE — data collected on each request
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/raspi/health \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Read Endpoints

All read endpoints collect data live via `psutil` on each request. `data_freshness` is always `"LIVE"` — there is no polling cache or staleness concept for local system data.

---

### GET /cpu

Returns current CPU usage as a percentage. Uses a 100ms measurement interval for an accurate reading.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "cpu_percent": 23.5,
  "data_freshness": "LIVE"
}
```

```typescript
interface CpuResponse {
  cpu_percent: number;     // 0.0–100.0
  data_freshness: "LIVE";
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/raspi/cpu \
  -H "X-API-Key: YOUR_API_KEY"
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/raspi/cpu`, {
  headers: { "X-API-Key": process.env.API_KEY! },
});
const { cpu_percent } = await res.json() as CpuResponse;
```

---

### GET /memory

Returns RAM usage statistics — bytes used, total bytes, and percentage.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "used_bytes": 1073741824,
  "total_bytes": 8589934592,
  "percent": 12.5,
  "data_freshness": "LIVE"
}
```

```typescript
interface MemoryResponse {
  used_bytes: number;      // bytes currently in use
  total_bytes: number;     // total installed RAM (bytes)
  percent: number;         // 0.0–100.0
  data_freshness: "LIVE";
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/raspi/memory \
  -H "X-API-Key: YOUR_API_KEY"
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/raspi/memory`, {
  headers: { "X-API-Key": process.env.API_KEY! },
});
const { used_bytes, total_bytes, percent } = await res.json() as MemoryResponse;
```

---

### GET /disk

Returns disk usage for the root partition (`/`) — bytes used, total bytes, and percentage.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "used_bytes": 16106127360,
  "total_bytes": 31268536320,
  "percent": 51.5,
  "mount_point": "/",
  "data_freshness": "LIVE"
}
```

```typescript
interface DiskResponse {
  used_bytes: number;      // disk space used (bytes)
  total_bytes: number;     // total disk capacity (bytes)
  percent: number;         // 0.0–100.0
  mount_point: "/";        // always root partition
  data_freshness: "LIVE";
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/raspi/disk \
  -H "X-API-Key: YOUR_API_KEY"
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/raspi/disk`, {
  headers: { "X-API-Key": process.env.API_KEY! },
});
const { used_bytes, total_bytes, percent } = await res.json() as DiskResponse;
```

---

### GET /system

Returns aggregated system statistics in a single response: CPU temperature, uptime, load averages, process count, and network I/O for the most active non-loopback interface.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "cpu_temperature": 52.3,
  "uptime_seconds": 345600,
  "load_avg_1": 0.42,
  "load_avg_5": 0.38,
  "load_avg_15": 0.35,
  "process_count": 142,
  "network": {
    "bytes_sent": 1073741824,
    "bytes_recv": 5368709120,
    "interface": "wlan0"
  },
  "data_freshness": "LIVE"
}
```

```typescript
interface NetworkStats {
  bytes_sent: number;      // total bytes sent since boot
  bytes_recv: number;      // total bytes received since boot
  interface: string;       // active interface name (e.g. "wlan0", "eth0")
}

interface SystemResponse {
  cpu_temperature: number | null; // celsius, null if sensor unavailable
  uptime_seconds: number;         // seconds since boot
  load_avg_1: number;             // 1-minute load average
  load_avg_5: number;             // 5-minute load average
  load_avg_15: number;            // 15-minute load average
  process_count: number;          // running processes
  network: NetworkStats;
  data_freshness: "LIVE";
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/raspi/system \
  -H "X-API-Key: YOUR_API_KEY"
```

**Next.js fetch:**

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/raspi/system`, {
  headers: { "X-API-Key": process.env.API_KEY! },
});
const data = await res.json() as SystemResponse;
console.log(`CPU: ${data.cpu_temperature}°C, Uptime: ${Math.floor(data.uptime_seconds / 3600)}h`);
```

**Notes:**

- `cpu_temperature` reads from `cpu_thermal` or `cpu-thermal` sensor via `psutil.sensors_temperatures()`. Returns `null` on platforms where the sensor is unavailable (e.g. macOS, containers).
- `network` reports the most active non-loopback interface by total `bytes_sent`. On Raspberry Pi this is typically `wlan0` (WiFi) or `eth0` (Ethernet).
- `bytes_sent` and `bytes_recv` are cumulative counters since boot — compute deltas between polls for rate calculation.

---

## Frontend Component Suggestions

**Health**
- **StatusBadge** -- map `status` to color (healthy -> green, degraded -> yellow, unreachable -> red). Per D-12.

**System Metrics** (system info, CPU, memory, storage)
- **StatCards** -- display cpu_percent, memory_percent, cpu_temperature as individual metric cards with threshold coloring (green < 70%, amber 70-90%, red > 90%). Per D-12.
- **ProgressBar** -- storage usage per mount point showing used/total with percentage. Per D-12.
- **DataCard** -- system info (hostname, os_version, uptime formatted as days/hours, python_version) as labeled fields. Per D-11.

---

## Real-Time (WebSocket)

For real-time push updates without polling, subscribe to the `raspi` topic on the WebSocket endpoint.

See [WebSocket API - raspi topic](./websocket.md#raspi) for the full payload schema, TypeScript interfaces, and subscription example.

**Topic:** `raspi`
**Snapshot on subscribe:** Yes -- current system metrics
