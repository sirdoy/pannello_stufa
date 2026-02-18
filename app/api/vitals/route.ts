import { NextRequest, NextResponse } from 'next/server';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import type { WebVitalEvent } from '@/types/analytics';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as WebVitalEvent;

    // Basic validation: must have name, value, timestamp
    if (!body.name || typeof body.value !== 'number' || !body.timestamp) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Generate RTDB-compatible key
    const key = `${body.timestamp.replace(/[:.]/g, '-')}_${body.name}_${body.id?.slice(0, 8) ?? 'unknown'}`;
    const path = getEnvironmentPath(`vitalsEvents/${key}`);

    // Fire-and-forget — same pattern as analyticsEventLogger.ts
    void adminDbSet(path, body);

    return NextResponse.json({ success: true });
  } catch {
    // Never fail beacon — always return success to avoid retries
    return NextResponse.json({ success: true });
  }
}
