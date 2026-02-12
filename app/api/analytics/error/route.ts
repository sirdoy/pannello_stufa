/**
 * Analytics Error Logging API
 *
 * POST /api/analytics/error
 *
 * Purpose: Client-side error logging endpoint for error boundaries.
 * Logs component errors to Firebase RTDB for monitoring and debugging.
 *
 * IMPORTANT:
 * - Fire-and-forget: errors logged but API always returns 200
 * - Does NOT check analytics consent (error logging is operational, not tracking)
 * - Used by app/error.tsx and feature-level error boundaries
 *
 * Request body:
 * {
 *   device?: string;
 *   component: string;       // Required
 *   message: string;         // Required
 *   stack?: string;
 *   digest?: string;         // Next.js error digest
 * }
 *
 * Response: { success: true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { logComponentError } from '@/lib/analyticsEventLogger';

export const dynamic = 'force-dynamic';

interface ErrorLogRequest {
  device?: string;
  component: string;
  message: string;
  stack?: string;
  digest?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as ErrorLogRequest;

    // Validate required fields
    if (!body.component || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: component, message' },
        { status: 400 }
      );
    }

    // Log error (fire-and-forget, never throws)
    await logComponentError({
      device: body.device,
      component: body.component,
      message: body.message,
      stack: body.stack,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    // Even on parsing errors, return success (fire-and-forget pattern)
    console.error('❌ Error logging API failed (non-blocking):', error);
    return NextResponse.json({ success: true });
  }
}
