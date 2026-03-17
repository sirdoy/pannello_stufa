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
}

/**
 * Options accepted by haGet and haPost.
 */
export interface HaRequestOptions {
  /** Request timeout in milliseconds. Defaults to 15000. */
  timeout?: number;
}
