# Phase 157: Auth Module - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 157-auth-module
**Mode:** --auto (all decisions auto-selected with recommended defaults)
**Areas discussed:** Proxy client structure, JWT token handling, Route prefix, Auth relationship

---

## Proxy Client Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single authProxy.ts | All 4 endpoints in one function module, matching thermorossiProxy pattern | ✓ |
| Split login/api-keys | Separate modules for login (form-encoded) vs API keys (JSON) | |

**User's choice:** [auto] Single authProxy.ts (recommended default)
**Notes:** Only 4 endpoints — splitting would over-fragment. Form-encoded login is a minor difference handled internally.

---

## JWT Token Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side only | JWT obtained and used within API routes, never exposed to client | ✓ |
| Client-side storage | JWT stored in browser (cookie/localStorage) for direct HA proxy calls | |
| Hybrid | Server caches JWT, client gets proxy token | |

**User's choice:** [auto] Server-side only (recommended default)
**Notes:** Matches existing server-side proxy architecture. Client never talks to HA proxy directly.

---

## Route Prefix

| Option | Description | Selected |
|--------|-------------|----------|
| app/api/auth/* | Mirror HA proxy /auth prefix under Next.js /api/auth/ convention | ✓ |
| app/api/v1/auth/* | Match other v1 provider routes for consistency | |

**User's choice:** [auto] app/api/auth/* (recommended default)
**Notes:** HA proxy spec uses /auth (not /api/v1/auth). Mirroring the actual prefix avoids confusion. Does not conflict with existing app/auth/ (Auth0 callback routes).

---

## Auth Relationship

| Option | Description | Selected |
|--------|-------------|----------|
| Independent (Auth0 + HA JWT) | Auth0 guards Next.js access; HA JWT authenticates to HA proxy backend | ✓ |
| Replace Auth0 with HA JWT | Use HA proxy JWT as sole auth mechanism | |
| HA JWT wraps Auth0 | Exchange Auth0 token for HA JWT transparently | |

**User's choice:** [auto] Independent (recommended default)
**Notes:** Separation of concerns — Auth0 is for user identity, HA JWT is for server-to-server proxy auth. Both layers remain active.

---

## Claude's Discretion

- Type file location and naming
- Error mapping specifics (follow RFC 9457)
- haPostForm() helper vs inline form-encoding
- Test file organization

## Deferred Ideas

None
