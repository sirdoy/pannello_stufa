# Auth API

**Base path:** `/auth`

Authentication and API key management — JWT token login and CRUD operations for API keys. The auth module is mounted at `/auth` (not under `/api/v1`). Admin/API-key endpoints are rate-limited at 10 requests/minute per IP or auth credential. Also hosts the first-party user sessions (email/password on the Pi DB, replacing Auth0). 13 endpoints.

> **Note:** The auth prefix is `/auth`, NOT `/api/v1/auth`. All auth endpoint URLs start with `http://localhost:8000/auth/...`

---

## Quick Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Obtain JWT access token | No |
| `POST` | `/auth/api-keys` | Create a new API key | Yes (JWT only) |
| `GET` | `/auth/api-keys` | List all API keys | Yes (JWT only) |
| `DELETE` | `/auth/api-keys/{key_id}` | Revoke an API key | Yes (JWT only) |
| `POST` | `/auth/session/login` | User login (email/password) → access + refresh token | API key |
| `POST` | `/auth/session/refresh` | Rotate refresh token → new pair | API key |
| `POST` | `/auth/session/logout` | Revoke a refresh token | API key |
| `GET` | `/auth/me` | Current user of a user access token | API key + user Bearer |
| `POST` | `/auth/me/password` | Change own password (rotates sessions) | API key + user Bearer |
| `POST` | `/auth/ws-token` | 60 s token for `/ws/live?token=` | API key + user Bearer |
| `GET` | `/auth/users` | List users | API key + admin Bearer |
| `POST` | `/auth/users` | Create user | API key + admin Bearer |
| `PATCH` | `/auth/users/{user_id}` | Update user (partial) | API key + admin Bearer |

---

## Table of Contents

- [Important Notes](#important-notes)
- [POST /auth/login](#post-authlogin)
- [POST /auth/api-keys](#post-authapi-keys)
- [GET /auth/api-keys](#get-authapi-keys)
- [DELETE /auth/api-keys/{key_id}](#delete-authapi-keyskey_id)
- [User sessions](#user-sessions)
- [User management](#user-management)
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

## User sessions

First-party login for panel users, stored in the Pi SQLite DB (`users`, `user_sessions`, migration v27).
Replaces Auth0 on the frontend. Accounts are created with `scripts/create_user.py` (roles `admin`, `user`, `test`; `--legacy-sub` links an
old Auth0 subject so existing Firebase data stays attached).

**Server-to-server only:** every route requires `X-API-Key`. The browser never calls these directly: the
Next.js server does, and keeps the tokens in an httpOnly cookie. Without a valid key → `401`.

**Tokens:**

- `access_token` — JWT HS256, lifetime `USER_ACCESS_TOKEN_EXPIRE_MINUTES` (default 15 min).
  Claims: `sub` = `"user:<id>"`, `typ` = `"user_access"`, `role`, `email`, `exp`.
  It is **not** an admin token: `/auth/api-keys` and the `/api/v1` dual-auth reject it.
- `refresh_token` — opaque random string, lifetime `USER_REFRESH_TOKEN_EXPIRE_DAYS` (default 30 days).
  Only its SHA-256 is stored. **Rotated on every refresh**: the old token stops working. Reusing a
  rotated token more than 30 s after rotation is treated as theft and revokes all sessions of that user
  (within 30 s it just fails with 401, to tolerate two parallel refreshes — dedupe refreshes client-side).

### POST /auth/session/login

**Headers:** `X-API-Key`. **Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Case-insensitive, surrounding spaces ignored |
| `password` | string | Yes | |
| `user_agent` | string | No | Browser UA, stored on the session for auditing (max 512) |

**Response (200):** `SessionTokens`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "3q2-7wEXAMPLEy1o8m3Xw0vYt9k2dGf3aB6cD9eF1gH",
  "token_type": "bearer",
  "expires_in": 900,
  "refresh_expires_in": 2592000,
  "user": {
    "id": 1,
    "email": "me@example.com",
    "display_name": "Me",
    "role": "admin",
    "last_login_at": "2026-09-24T15:00:00.123456Z",
    "legacy_sub": "google-oauth2|103557629222504914139"
  }
}
```

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing/invalid API key, or wrong email/password/inactive user (same message, no account enumeration) |
| `422` | Body validation error |
| `429` | 5 failed logins for the same email in 15 min → locked until the window passes (`Retry-After` header, seconds). Also slowapi limit 30 req/min |

### POST /auth/session/refresh

**Headers:** `X-API-Key`. **Body:** `{"refresh_token": "..."}`

**Response (200):** new `SessionTokens` (new refresh token — store it, discard the old one).

| Status | Description |
|--------|-------------|
| `401` | Token unknown, revoked, rotated, expired, or user deactivated |
| `429` | 60 req/min |

### POST /auth/session/logout

**Headers:** `X-API-Key`. **Body:** `{"refresh_token": "..."}`

**Response:** `204 No Content`, always (idempotent, also for unknown tokens). The access token stays valid
until it expires (max 15 min): drop it from the cookie.

### GET /auth/me

**Headers:** `X-API-Key` and `Authorization: Bearer <access_token>`.

**Response (200):** `UserPublic` (same shape as `user` above).

| Status | Description |
|--------|-------------|
| `401` | Bearer missing/invalid/expired, not a user access token, or user deactivated |
| `429` | 120 req/min |

---

## User management

Admin-only (role `admin` in the Bearer user access token, plus `X-API-Key`), except the self-service
password change. Non-admin → `403`. Passwords: 10–256 chars.

### POST /auth/ws-token

Any active user (API key + user Bearer). **Response (200):** `{"token": "eyJ...", "expires_in": 60}` — a JWT with
`typ: "ws"` accepted only by `/ws/live?token=` (not by REST routes), checked at connect time. Lets browsers open the
WebSocket without holding an API key.

### POST /auth/me/password

Any active user. **Body:** `{"current_password": "...", "new_password": "..."}`.
**Response (200):** new `SessionTokens` — every existing session of the user is revoked (other devices are
logged out at their next refresh); store the returned pair. `401` wrong current password.

### GET /auth/users

**Response (200):** `{"users": UserAdmin[], "count": number}` ordered by id.

### POST /auth/users

**Body:** `{"email", "password"?, "display_name"?, "role"?: "admin"|"user"|"test" (default "user")}`.
Email is trimmed and lower-cased.
**Response (201):** `{"user": UserAdmin, "generated_password": string | null}` — without `password` a random one
is generated and returned **once**. `409` email already registered, `422` invalid email/short password.

### PATCH /auth/users/{user_id}

Partial update: only the fields present change. **Body (all optional):** `display_name` (null/"" clears),
`role`, `is_active`, `password` (admin reset), `legacy_sub` (null/"" clears).
A password reset or `is_active: false` revokes all sessions of that user.
**Response (200):** `UserAdmin`.

| Status | Description |
|--------|-------------|
| `404` | Unknown user |
| `409` | `legacy_sub` already linked to another user; an admin demoting/deactivating themselves; removing the last active admin |

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

// User sessions
type UserRole = "admin" | "user" | "test";

interface UserPublic {
  id: number;
  email: string;
  display_name: string | null;
  role: UserRole;
  last_login_at: string | null; // ISO 8601 UTC ("Z")
  // Auth0 subject this account inherits (Firebase data key, v29); null for new users.
  // Frontend session `sub` = legacy_sub ?? `user:${id}`.
  legacy_sub: string | null;
}

interface SessionLoginRequest {
  email: string;
  password: string;
  user_agent?: string;
}

interface RefreshRequest {
  refresh_token: string;
}

interface UserAdmin extends UserPublic {
  is_active: boolean;
  created_at: string; // ISO 8601 UTC
  updated_at: string;
}

interface UserListResponse { users: UserAdmin[]; count: number; }

interface UserCreateRequest {
  email: string;
  password?: string;          // 10-256; omit to generate
  display_name?: string | null;
  role?: UserRole;            // default "user"
}

interface UserCreateResponse { user: UserAdmin; generated_password: string | null; }

interface UserUpdateRequest {  // only present fields change
  display_name?: string | null;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
  legacy_sub?: string | null;
}

interface PasswordChangeRequest { current_password: string; new_password: string; }

interface WsTokenResponse { token: string; expires_in: number; }

interface SessionTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;         // seconds
  refresh_expires_in: number; // seconds
  user: UserPublic;
}
```
