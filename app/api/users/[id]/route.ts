/**
 * PATCH /api/users/[id] — partial user update (admin): name, role, active,
 * password reset, legacy_sub. Proxies backend PATCH /auth/users/{id} (roadmap 8.4).
 */
import { withErrorHandler } from '@/lib/core';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import { NextResponse, type NextRequest } from 'next/server';
import { haPatch } from '@/lib/haClient';
import { requireAdminSession } from '@/lib/auth/storedSession';
import type { UserAdmin, UserUpdateRequest } from '@/types/users';

export const dynamic = 'force-dynamic';

export const PATCH = withErrorHandler(
  async (request: NextRequest, context) => {
    const { accessToken } = await requireAdminSession(request);
    const id = (await context.params).id ?? '';
    if (!/^\d+$/.test(id)) {
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Invalid user id', HTTP_STATUS.BAD_REQUEST);
    }
    const body = (await request.json()) as UserUpdateRequest;
    const data = await haPatch<UserAdmin>(`/auth/users/${id}`, body, { bearer: accessToken });
    return NextResponse.json(data);
  },
  'Users/Update'
);
