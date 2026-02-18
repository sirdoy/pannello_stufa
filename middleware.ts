import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.rewrite(new URL('/not-found', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/debug', '/debug/:path*'],
};
