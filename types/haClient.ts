/**
 * Shared HomeAssistant Proxy Client Types
 *
 * Types used by the shared haClient module and all provider clients
 * that build on it (Fritz!Box, Netatmo, Raspberry Pi).
 *
 * @see lib/haClient.ts
 */

/**
 * RFC 9457 "Problem Details for HTTP APIs" error format.
 * The HA proxy returns this shape on 4xx/5xx responses.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
export interface RFC9457ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  /** Only on 422 request validation errors: one entry per invalid field. */
  errors?: ProblemValidationError[];
  /** Machine-readable reason extension (e.g. "maintenance_required", "state_conflict"). */
  error?: string;
  /** Other extension members (e.g. "command", "current_state"). */
  [extension: string]: unknown;
}

/** Pydantic validation error entry in a 422 Problem Details `errors[]`. */
export interface ProblemValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

/**
 * Options accepted by haGet and haPost.
 */
export interface HaRequestOptions {
  /** Request timeout in milliseconds. Defaults to 8000 for GET, 15000 otherwise. */
  timeout?: number;
  /** User access token, sent as `Authorization: Bearer` next to X-API-Key (user-scoped /auth routes). */
  bearer?: string;
}
