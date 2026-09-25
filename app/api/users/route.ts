/**
 * GET  /api/users — list users (admin)
 * POST /api/users — create a user (admin); may return a one-time generated password
 *
 * Proxies backend /auth/users with the caller's access token (roadmap 8.4).
 */
import { withErrorHandler } from '@/lib/core';
import { NextResponse, type NextRequest } from 'next/server';
import { haGet, haPost } from '@/lib/haClient';
import { requireAdminSession } from '@/lib/auth/storedSession';
import type { UserCreateRequest, UserCreateResponse, UserListResponse } from '@/types/users';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { accessToken } = await requireAdminSession(request);
  const data = await haGet<UserListResponse>('/auth/users', { bearer: accessToken });
  return NextResponse.json(data);
}, 'Users/List');

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { accessToken } = await requireAdminSession(request);
  const body = (await request.json()) as UserCreateRequest;
  const data = await haPost<UserCreateResponse>('/auth/users', body, { bearer: accessToken });
  return NextResponse.json(data, { status: 201 });
}, 'Users/Create');
