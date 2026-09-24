import { NextResponse } from 'next/server';

/** Stream qualities exposed by the backend HLS proxy. */
export const CAMERA_STREAM_QUALITIES = ['high', 'medium', 'low'] as const;
export type CameraStreamQuality = (typeof CAMERA_STREAM_QUALITIES)[number];

export function isCameraStreamQuality(value: string): value is CameraStreamQuality {
  return (CAMERA_STREAM_QUALITIES as readonly string[]).includes(value);
}

/**
 * Relay a backend binary/stream Response to the browser.
 * Errors (404/422/502/503 problem+json) keep their status and are never cached;
 * success bodies are streamed with the upstream content type.
 */
export function passthroughResponse(
  upstream: Response,
  options: { fallbackContentType: string; cacheControl?: string },
): NextResponse {
  if (!upstream.ok) {
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/problem+json',
        'Cache-Control': 'no-store',
      },
    });
  }
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? options.fallbackContentType,
      'Cache-Control': options.cacheControl ?? 'no-store',
    },
  });
}
