/**
 * POST /api/auth/session — email/password login (roadmap Fase 8, replaces Auth0).
 *
 * Forwards the credentials to the backend (/auth/session/login, X-API-Key) and
 * stores the returned token pair in the sealed httpOnly session cookie. The
 * tokens never reach the browser. Public route (see middleware PUBLIC_PATHS).
 *
 * Responses: 200 { user }, 400 invalid body, 401 wrong credentials,
 * 429 locked out (retryAfter seconds), 503 backend unavailable.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { SessionApiError, loginWithPassword } from '@/lib/auth/backendSession';
import { SESSION_COOKIE, sealSession, sessionCookieOptions } from '@/lib/auth/sessionCookie';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(256),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Email e password obbligatorie' }, { status: 400 });
  }

  try {
    const session = await loginWithPassword(
      body.email,
      body.password,
      request.headers.get('user-agent')
    );
    const response = NextResponse.json({
      user: { email: session.user.email, name: session.user.name, role: session.user.role },
    });
    response.cookies.set(SESSION_COOKIE, await sealSession(session), sessionCookieOptions(session));
    return response;
  } catch (error) {
    if (error instanceof SessionApiError) {
      if (error.kind === 'invalid_credentials') {
        return NextResponse.json({ error: 'Email o password non validi' }, { status: 401 });
      }
      if (error.kind === 'locked') {
        return NextResponse.json(
          { error: 'Troppi tentativi, riprova più tardi', retryAfter: error.retryAfter ?? null },
          { status: 429 }
        );
      }
    }
    return NextResponse.json({ error: 'Servizio non raggiungibile, riprova' }, { status: 503 });
  }
}
