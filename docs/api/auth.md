# Auth API

**Base path:** `/auth`

Authentication and API key management — JWT token login and CRUD operations for API keys. The auth module is mounted at `/auth` (not under `/api/v1`). All endpoints are rate-limited at 10 requests/minute per IP or auth credential. 4 endpoints.

> **Note:** The auth prefix is `/auth`, NOT `/api/v1/auth`. All auth endpoint URLs start with `http://localhost:8000/auth/...`

---

## Quick Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Obtain JWT access token | No |
| `POST` | `/auth/api-keys` | Create a new API key | Yes (JWT only) |
| `GET` | `/auth/api-keys` | List all API keys | Yes (JWT only) |
| `DELETE` | `/auth/api-keys/{key_id}` | Revoke an API key | Yes (JWT only) |

---

## Table of Contents

- [Important Notes](#important-notes)
- [POST /auth/login](#post-authlogin)
- [POST /auth/api-keys](#post-authapi-keys)
- [GET /auth/api-keys](#get-authapi-keys)
- [DELETE /auth/api-keys/{key_id}](#delete-authapi-keyskey_id)
- [TypeScript Interfaces](#typescript-interfaces)

---

## Important Notes

### Rate Limiting

All auth endpoints are rate-limited at **10 requests/minute** per IP address (or per API key/JWT token if authenticated). Exceeding the limit returns:

```
HTTP 429 Too Many Requests
{"error": "Rate limit exceeded"}
```

### API Key Management Requires JWT Only

`POST /auth/api-keys`, `GET /auth/api-keys`, and `DELETE /auth/api-keys/{key_id}` require **JWT Bearer authentication only** — API key auth is not accepted for managing API keys. This prevents a compromised key from being used to create additional keys.

---

## POST /auth/login

Authenticate with username and password to receive a JWT access token.

**Authentication:** Not required

> **CRITICAL:** Login uses a **form-encoded body** (OAuth2 `PasswordRequestForm`), NOT JSON.
> Content-Type is `application/x-www-form-urlencoded`. Sending JSON will result in a 422 error.

**Request body (form fields):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Admin username |
| `password` | string | Yes | Admin password |

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Invalid username or password |
| `429` | Rate limit exceeded (10 req/min) |

**curl:**

```bash
curl -X POST http://localhost:8000/auth/login \
  -d "username=admin&password=YOUR_PASSWORD"
```

> The `-d` flag in curl defaults to `application/x-www-form-urlencoded`. Do not add a `Content-Type: application/json` header.

---

## POST /auth/api-keys

Create a new API key. The plaintext key is shown only once in the response — it cannot be retrieved again.

**Authentication:** Required (JWT Bearer only — API key auth is NOT accepted)

**Request body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Description of the API key purpose (1–100 characters) |

**Response (201):**

```json
{
  "id": 1,
  "name": "Next.js production app",
  "api_key": "ha_live_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
  "created_at": "2026-03-22T14:00:00Z"
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Numeric ID of the API key |
| `name` | string | Name/description provided at creation |
| `api_key` | string | Full plaintext API key (format: `ha_live_...`) |
| `created_at` | string | ISO 8601 creation timestamp |

> **Warning:** The `api_key` field contains the full plaintext key and is shown only at creation time. Store it securely — it **cannot be retrieved again** after this response.

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Not authenticated, or using API key auth instead of JWT |
| `429` | Rate limit exceeded (10 req/min) |

**curl:**

```bash
curl -X POST http://localhost:8000/auth/api-keys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Next.js production app"}'
```

---

## GET /auth/api-keys

List all API keys. Plaintext key values are never returned by this endpoint.

**Authentication:** Required (JWT Bearer only)

**Response (200):**

```json
{
  "keys": [
    {
      "id": 1,
      "name": "Next.js production app",
      "created_at": "2026-03-22T14:00:00Z",
      "last_used_at": "2026-03-22T15:30:00Z",
      "is_active": true
    },
    {
      "id": 2,
      "name": "App mobile Federico",
      "created_at": "2026-03-21T10:00:00Z",
      "last_used_at": null,
      "is_active": true
    }
  ],
  "count": 2
}
```

**APIKeyInfo fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Numeric key ID |
| `name` | string | Key name/description |
| `created_at` | string | ISO 8601 creation timestamp |
| `last_used_at` | string \| null | ISO 8601 timestamp of last use, or null if never used |
| `is_active` | boolean | Whether the key is still active (not revoked) |

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Not authenticated or using API key auth instead of JWT |
| `429` | Rate limit exceeded (10 req/min) |

**curl:**

```bash
curl http://localhost:8000/auth/api-keys \
  -H "Authorization: Bearer <token>"
```

---

## DELETE /auth/api-keys/{key_id}

Revoke an API key permanently. The key becomes immediately unusable.

**Authentication:** Required (JWT Bearer only)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key_id` | int | Numeric ID of the key to revoke |

**Response:** `204 No Content` (empty body)

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Not authenticated or using API key auth instead of JWT |
| `404` | API key with given ID not found |
| `429` | Rate limit exceeded (10 req/min) |

**curl:**

```bash
curl -X DELETE http://localhost:8000/auth/api-keys/1 \
  -H "Authorization: Bearer <token>"
```

---

## Frontend Component Suggestions

**Login** (POST /auth/login)
- **Form** -- username (text input) + password (password input) + submit button. On success, store JWT token in memory or httpOnly cookie. Show Toast on error ("Invalid credentials"). Per D-15 (write endpoint).

**API Key CRUD** (GET /auth/api-keys, POST /auth/api-keys, DELETE /auth/api-keys/{id})
- **Table** -- map `api_keys[]` to rows; columns: name, key (masked, show first 8 chars + "..."), created_at, last_used_at. Per D-10 (list endpoint).
- **Button** -- "Create New Key" triggers Modal Form with name field; display full key ONCE after creation with copy-to-clipboard. Per D-15 (write endpoint).
- **ConfirmDialog** -- revoke confirmation showing key name; warn this action is irreversible. Per D-15 (delete endpoint).

---

## TypeScript Interfaces

```typescript
interface Token {
  access_token: string;
  token_type: "bearer";
}

interface APIKeyCreate {
  name: string;  // 1–100 characters
}

interface APIKeyResponse {
  id: number;
  name: string;
  api_key: string;      // Full plaintext — shown only at creation
  created_at: string;   // ISO 8601
}

interface APIKeyInfo {
  id: number;
  name: string;
  created_at: string;         // ISO 8601
  last_used_at: string | null; // ISO 8601, null if never used
  is_active: boolean;
}

interface APIKeyListResponse {
  keys: APIKeyInfo[];
  count: number;
}
```
