import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

export async function middleware(req) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session || !session.user) {
    return NextResponse.redirect(new URL('/api/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!api/auth|_next|favicon.ico).*)"],
};
