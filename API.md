# HomeAssistant Network API v1.1

**Base URL:** `https://pdupun8zpr7exw43.myfritz.net`

**Version:** 1.1.0

**Description:** Real-time Fritz!Box network monitoring REST API with comprehensive device discovery, bandwidth tracking, and historical data queries.

---

## Table of Contents

- [Authentication](#authentication)
- [Error Responses](#error-responses)
- [Pagination](#pagination)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Devices](#devices)
  - [Bandwidth](#bandwidth-deprecated)
  - [WAN](#wan-deprecated)
  - [History](#history)
  - [Fritz!Box Provider](#fritzbox-provider)
  - [Auth](#auth)
- [Next.js Integration Guide](#nextjs-integration-guide)
- [TypeScript Client Generation](#typescript-client-generation)

---

## Authentication

The API supports **dual authentication** for different use cases:

### JWT (JSON Web Token)
- **Use case:** User sessions, browser-based authentication
- **Token type:** Bearer token
- **Expiration:** Configurable (default: 30 minutes)

### API Key
- **Use case:** Server-to-server communication, Next.js backend integration
- **Header:** `X-API-Key`
- **Format:** `ha_` prefix + 32-character random string
- **Lifetime:** No expiration (until revoked)

---

### JWT Authentication Flow

#### 1. Login to get JWT token

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=YOUR_PASSWORD"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### 2. Use JWT token in subsequent requests

```bash
curl -X GET https://pdupun8zpr7exw43.myfritz.net/api/v1/devices \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### API Key Authentication Flow

#### 1. Create API key (requires JWT)

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "nextjs-backend"}'
```

**Response (key shown ONCE):**
```json
{
  "id": 1,
  "name": "nextjs-backend",
  "api_key": "ha_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "created_at": "2026-02-13T14:00:00Z"
}
```

**IMPORTANT:** Save the `api_key` value immediately. It will never be shown again.

#### 2. Use API key in requests

```bash
curl -X GET https://pdupun8zpr7exw43.myfritz.net/api/v1/devices \
  -H "X-API-Key: ha_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

---

### Rate Limiting

- **Limit:** 10 requests per minute per authentication identity
- **Scope:** Per API key prefix (8 chars) or JWT token prefix (8 chars) or IP address
- **Response when exceeded:** `429 Too Many Requests`

---

## Error Responses

All error responses follow **RFC 9457 Problem Details** format.

### Format

```json
{
  "type": "about:blank",
  "title": "Error title",
  "status": 400,
  "detail": "Detailed error message",
  "instance": "/api/v1/endpoint"
}
```

### Fields

- **type** (string): URI reference identifying the problem type (usually `about:blank`)
- **title** (string): Short, human-readable summary of the problem
- **status** (integer): HTTP status code
- **detail** (string): Human-readable explanation specific to this occurrence
- **instance** (string): URI reference identifying the specific occurrence (request path)

### Example Error Responses

#### 401 Unauthorized

```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Missing or invalid authentication (API Key or Bearer token required)"
}
```

#### 404 Not Found

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "API key 123 not found"
}
```

#### 422 Validation Error

```json
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Invalid input: limit must be between 1 and 1000"
}
```

#### 503 Service Unavailable

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

All list endpoints support **limit/offset pagination** with total count.

### Query Parameters

- **limit** (integer, 1-1000): Maximum items per page (default: 100)
- **offset** (integer, ≥0): Number of items to skip (default: 0)

### Response Format

```json
{
  "items": [...],
  "total_count": 150,
  "limit": 50,
  "offset": 100
}
```

### Fields

- **items** (array): Items in the current page
- **total_count** (integer): Total items matching the query (across all pages)
- **limit** (integer): Maximum items per page (echoed from request)
- **offset** (integer): Items skipped (echoed from request)

### Pagination Calculation

```javascript
// Total pages
const totalPages = Math.ceil(total_count / limit);

// Current page (1-indexed)
const currentPage = Math.floor(offset / limit) + 1;

// Has next page
const hasNext = offset + limit < total_count;

// Next page offset
const nextOffset = offset + limit;

// Previous page offset
const prevOffset = Math.max(0, offset - limit);
```

### Example Request

```bash
curl -X GET "https://pdupun8zpr7exw43.myfritz.net/api/v1/devices?limit=20&offset=40" \
  -H "X-API-Key: ha_..."
```

**Response:**
```json
{
  "items": [
    {
      "ip": "192.168.178.25",
      "name": "iPhone-12",
      "mac": "AA:BB:CC:DD:EE:FF",
      "status": 1,
      "provider_type": "fritzbox"
    }
  ],
  "total_count": 42,
  "limit": 20,
  "offset": 40
}
```

This is page 3 of 3 (items 41-42 of 42 total).

---

## Endpoints

### Health

#### GET /health

Health check endpoint. **No authentication required.**

```bash
curl -X GET https://pdupun8zpr7exw43.myfritz.net/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "cache_age_seconds": 25,
  "providers": {
    "fritzbox": "ok"
  }
}
```

**Fields:**
- `status`: "ok" or "degraded"
- `cache_age_seconds`: Age of cached data in seconds (null if no data)
- `providers`: Per-provider health status

---

### Devices

#### GET /api/v1/devices

Get devices from all registered providers (aggregated) with pagination.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET "https://pdupun8zpr7exw43.myfritz.net/api/v1/devices?limit=20&offset=0" \
  -H "X-API-Key: ha_..."
```

**Query Parameters:**
- `limit` (integer, 1-1000, default 100): Items per page
- `offset` (integer, ≥0, default 0): Items to skip

**Response (200 OK):**
```json
{
  "items": [
    {
      "ip": "192.168.178.25",
      "name": "iPhone-12",
      "mac": "AA:BB:CC:DD:EE:FF",
      "status": 1,
      "provider_type": "fritzbox"
    },
    {
      "ip": "192.168.178.30",
      "name": "MacBook-Pro",
      "mac": "11:22:33:44:55:66",
      "status": 1,
      "provider_type": "fritzbox"
    }
  ],
  "total_count": 12,
  "limit": 20,
  "offset": 0
}
```

**Status Codes:**
- `200`: Success
- `401`: Missing or invalid authentication
- `503`: Device data not available (router unreachable)

---

### Bandwidth (DEPRECATED)

**Note:** This endpoint is deprecated. Use `/api/v1/fritzbox/bandwidth` instead.

#### GET /api/v1/bandwidth

Get current bandwidth data.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET https://pdupun8zpr7exw43.myfritz.net/api/v1/bandwidth \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "upstream_bps": 125000000,
  "downstream_bps": 250000000,
  "bytes_sent": 45678901234,
  "bytes_received": 123456789012,
  "is_stale": false,
  "fetched_at": "2026-02-13T14:00:00Z"
}
```

---

### WAN (DEPRECATED)

**Note:** This endpoint is deprecated. Use `/api/v1/fritzbox/wan` instead.

#### GET /api/v1/wan

Get WAN connection status.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET https://pdupun8zpr7exw43.myfritz.net/api/v1/wan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "external_ip": "93.219.123.45",
  "is_connected": true,
  "is_linked": true,
  "uptime": 345678,
  "max_upstream_bps": 50000000,
  "max_downstream_bps": 250000000,
  "is_stale": false,
  "fetched_at": "2026-02-13T14:00:00Z"
}
```

---

### History

#### GET /api/v1/history/bandwidth

Get bandwidth history for specified time range with pagination.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET "https://pdupun8zpr7exw43.myfritz.net/api/v1/history/bandwidth?hours=24&limit=50&offset=0" \
  -H "X-API-Key: ha_..."
```

**Query Parameters:**
- `hours` (integer, 1-168, default 24): Hours of history (max 7 days)
- `limit` (integer, 1-1000, default 100): Items per page
- `offset` (integer, ≥0, default 0): Items to skip

**Response (200 OK):**
```json
{
  "items": [
    {
      "timestamp": 1770990000,
      "bytes_sent": 12345678,
      "bytes_received": 87654321,
      "upstream_rate": 50000000,
      "downstream_rate": 100000000
    }
  ],
  "total_count": 1440,
  "limit": 50,
  "offset": 0
}
```

**Status Codes:**
- `200`: Success
- `401`: Missing or invalid authentication
- `422`: Invalid query parameters
- `500`: Database query failed

---

#### GET /api/v1/history/devices

Get device history for specified time range with pagination.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET "https://pdupun8zpr7exw43.myfritz.net/api/v1/history/devices?hours=12&limit=100&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `hours` (integer, 1-168, default 24): Hours of history (max 7 days)
- `limit` (integer, 1-1000, default 100): Items per page
- `offset` (integer, ≥0, default 0): Items to skip

**Response (200 OK):**
```json
{
  "items": [
    {
      "timestamp": 1770990000,
      "ip": "192.168.178.25",
      "name": "iPhone-12",
      "mac": "AA:BB:CC:DD:EE:FF",
      "is_online": 1
    }
  ],
  "total_count": 720,
  "limit": 100,
  "offset": 0
}
```

---

### Fritz!Box Provider

All Fritz!Box-specific endpoints under the `/api/v1/fritzbox/` namespace.

#### GET /api/v1/fritzbox/devices

Get list of connected devices from Fritz!Box with pagination.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET "https://pdupun8zpr7exw43.myfritz.net/api/v1/fritzbox/devices?limit=50&offset=0" \
  -H "X-API-Key: ha_..."
```

**Query Parameters:**
- `limit` (integer, 1-1000, default 100): Items per page
- `offset` (integer, ≥0, default 0): Items to skip

**Response (200 OK):**
```json
{
  "items": [
    {
      "ip": "192.168.178.25",
      "name": "iPhone-12",
      "mac": "AA:BB:CC:DD:EE:FF",
      "status": 1
    }
  ],
  "total_count": 12,
  "limit": 50,
  "offset": 0
}
```

---

#### GET /api/v1/fritzbox/bandwidth

Get current bandwidth data from Fritz!Box.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET https://pdupun8zpr7exw43.myfritz.net/api/v1/fritzbox/bandwidth \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "upstream_bps": 125000000,
  "downstream_bps": 250000000,
  "bytes_sent": 45678901234,
  "bytes_received": 123456789012,
  "is_stale": false,
  "fetched_at": "2026-02-13T14:00:00Z"
}
```

---

#### GET /api/v1/fritzbox/wan

Get WAN connection status from Fritz!Box.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET https://pdupun8zpr7exw43.myfritz.net/api/v1/fritzbox/wan \
  -H "X-API-Key: ha_..."
```

**Response (200 OK):**
```json
{
  "external_ip": "93.219.123.45",
  "is_connected": true,
  "is_linked": true,
  "uptime": 345678,
  "max_upstream_bps": 50000000,
  "max_downstream_bps": 250000000,
  "is_stale": false,
  "fetched_at": "2026-02-13T14:00:00Z"
}
```

---

#### GET /api/v1/fritzbox/history/bandwidth

Get bandwidth history from Fritz!Box with pagination.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET "https://pdupun8zpr7exw43.myfritz.net/api/v1/fritzbox/history/bandwidth?hours=48&limit=100&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `hours` (integer, 1-168, default 24): Hours of history (max 7 days)
- `limit` (integer, 1-1000, default 100): Items per page
- `offset` (integer, ≥0, default 0): Items to skip

**Response (200 OK):**
```json
{
  "items": [
    {
      "timestamp": 1770990000,
      "bytes_sent": 12345678,
      "bytes_received": 87654321,
      "upstream_rate": 50000000,
      "downstream_rate": 100000000
    }
  ],
  "total_count": 2880,
  "limit": 100,
  "offset": 0
}
```

---

#### GET /api/v1/fritzbox/history/devices

Get device history from Fritz!Box with pagination.

**Authentication:** Required (JWT or API Key)

```bash
curl -X GET "https://pdupun8zpr7exw43.myfritz.net/api/v1/fritzbox/history/devices?hours=24&limit=200&offset=0" \
  -H "X-API-Key: ha_..."
```

**Query Parameters:**
- `hours` (integer, 1-168, default 24): Hours of history (max 7 days)
- `limit` (integer, 1-1000, default 100): Items per page
- `offset` (integer, ≥0, default 0): Items to skip

**Response (200 OK):**
```json
{
  "items": [
    {
      "timestamp": 1770990000,
      "ip": "192.168.178.25",
      "name": "iPhone-12",
      "mac": "AA:BB:CC:DD:EE:FF",
      "is_online": 1
    }
  ],
  "total_count": 1440,
  "limit": 200,
  "offset": 0
}
```

---

### Auth

#### POST /auth/login

Authenticate user and return JWT access token.

**Authentication:** None required

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=YOUR_PASSWORD"
```

**Request Body (form data):**
- `username` (string): User's username
- `password` (string): User's password

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Status Codes:**
- `200`: Success
- `401`: Incorrect username or password
- `429`: Rate limit exceeded

---

#### POST /auth/api-keys

Create new API key. **JWT authentication required.**

**Authentication:** Required (JWT only, not API Key)

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "nextjs-backend"}'
```

**Request Body (JSON):**
```json
{
  "name": "nextjs-backend"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "nextjs-backend",
  "api_key": "ha_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "created_at": "2026-02-13T14:00:00Z"
}
```

**IMPORTANT:** The `api_key` field is shown ONLY at creation time. Save it immediately.

**Status Codes:**
- `201`: API key created successfully
- `401`: Missing or invalid JWT token
- `429`: Rate limit exceeded

---

#### GET /auth/api-keys

List all active API keys. **JWT authentication required.**

**Authentication:** Required (JWT only, not API Key)

```bash
curl -X GET https://pdupun8zpr7exw43.myfritz.net/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "keys": [
    {
      "id": 1,
      "name": "nextjs-backend",
      "created_at": "2026-02-13T14:00:00Z",
      "last_used_at": "2026-02-13T14:05:00Z",
      "is_active": true
    },
    {
      "id": 2,
      "name": "mobile-app",
      "created_at": "2026-02-13T13:00:00Z",
      "last_used_at": null,
      "is_active": true
    }
  ],
  "count": 2
}
```

**Status Codes:**
- `200`: Success
- `401`: Missing or invalid JWT token
- `429`: Rate limit exceeded

---

#### DELETE /auth/api-keys/{key_id}

Revoke API key (soft delete). **JWT authentication required.**

**Authentication:** Required (JWT only, not API Key)

```bash
curl -X DELETE https://pdupun8zpr7exw43.myfritz.net/auth/api-keys/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (204 No Content):**
```
(empty body)
```

**Status Codes:**
- `204`: API key revoked successfully
- `401`: Missing or invalid JWT token
- `404`: API key not found
- `429`: Rate limit exceeded

---

## Next.js Integration Guide

### Environment Variables

Add to `.env.local`:

```bash
HOMEASSISTANT_API_URL=https://pdupun8zpr7exw43.myfritz.net
HOMEASSISTANT_API_KEY=ha_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Server-Side Data Fetching

Use API Key authentication for server-side requests (Next.js backend):

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const res = await fetch(`${process.env.HOMEASSISTANT_API_URL}/api/v1/devices`, {
    headers: {
      'X-API-Key': process.env.HOMEASSISTANT_API_KEY!
    },
    // Optional: disable caching for real-time data
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();

  return (
    <div>
      <h1>Devices ({data.total_count})</h1>
      {data.items.map(device => (
        <div key={device.mac}>{device.name} - {device.ip}</div>
      ))}
    </div>
  );
}
```

### Error Handling

Handle RFC 9457 error format:

```typescript
async function fetchDevices() {
  const res = await fetch(`${process.env.HOMEASSISTANT_API_URL}/api/v1/devices`, {
    headers: { 'X-API-Key': process.env.HOMEASSISTANT_API_KEY! }
  });

  if (!res.ok) {
    const error = await res.json();
    // RFC 9457 format: { type, title, status, detail, instance }
    throw new Error(`${error.title}: ${error.detail} (${error.status})`);
  }

  return res.json();
}
```

### Pagination Helper

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  limit: number;
  offset: number;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextOffset: number;
  prevOffset: number;
}

function getPaginationMeta(response: PaginatedResponse<any>): PaginationMeta {
  const { total_count, limit, offset } = response;

  const totalPages = Math.ceil(total_count / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasNext = offset + limit < total_count;
  const hasPrev = offset > 0;
  const nextOffset = offset + limit;
  const prevOffset = Math.max(0, offset - limit);

  return {
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    nextOffset,
    prevOffset
  };
}

// Usage
const devices = await fetchDevices(limit, offset);
const meta = getPaginationMeta(devices);
console.log(`Page ${meta.currentPage} of ${meta.totalPages}`);
```

### Client-Side Usage (Optional)

For client-side requests, use JWT authentication:

```typescript
// lib/api-client.ts
export async function fetchWithAuth(endpoint: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`${error.title}: ${error.detail}`);
  }

  return res.json();
}
```

---

## TypeScript Client Generation

### Using the Generator Script

The project includes a script to automatically generate a type-safe TypeScript client from the OpenAPI spec.

#### Requirements

- Node.js (for `npx`)
- curl (for fetching OpenAPI spec)

#### Generate Client

```bash
# From local development server
./scripts/generate_client.sh http://localhost:8000 ./generated-client

# From production
./scripts/generate_client.sh https://pdupun8zpr7exw43.myfritz.net ./generated-client
```

#### Script Arguments

1. **API_URL** (optional, default: `http://localhost:8000`): Base URL of the API
2. **OUTPUT_DIR** (optional, default: `./generated-client`): Output directory for generated client

#### What Gets Generated

The script:
1. Fetches `/openapi.json` from the API
2. Runs `@hey-api/openapi-ts` to generate TypeScript client
3. Creates type-safe functions for all endpoints
4. Generates TypeScript interfaces for all request/response models

#### Next.js Integration

1. **Generate the client:**
   ```bash
   ./scripts/generate_client.sh https://pdupun8zpr7exw43.myfritz.net ./lib/api-client
   ```

2. **Configure base URL and auth:**
   ```typescript
   // lib/api-config.ts
   import { OpenAPI } from './api-client';

   OpenAPI.BASE = process.env.HOMEASSISTANT_API_URL!;
   OpenAPI.HEADERS = {
     'X-API-Key': process.env.HOMEASSISTANT_API_KEY!
   };
   ```

3. **Use generated client:**
   ```typescript
   // app/dashboard/page.tsx
   import { getDevices } from '@/lib/api-client';
   import '@/lib/api-config'; // Initialize base URL and auth

   export default async function DashboardPage() {
     const devices = await getDevices({ limit: 50, offset: 0 });

     return (
       <div>
         <h1>Devices ({devices.total_count})</h1>
         {devices.items.map(device => (
           <div key={device.mac}>{device.name}</div>
         ))}
       </div>
     );
   }
   ```

#### Benefits

- Full TypeScript type safety
- Auto-completion in IDE
- Compile-time validation of request parameters
- Consistent error handling
- No manual API URL construction

---

## Additional Resources

- **OpenAPI Spec:** `https://pdupun8zpr7exw43.myfritz.net/openapi.json`
- **Interactive Docs:** `https://pdupun8zpr7exw43.myfritz.net/docs`
- **Fritz!Box TR-064 Documentation:** https://avm.de/service/schnittstellen/

---

**Last Updated:** 2026-02-13 (v1.1.0)
