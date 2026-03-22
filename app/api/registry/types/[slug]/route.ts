import { withAuthAndErrorHandler, noContent } from '@/lib/core';
import { registryProxy } from '@/lib/registry';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/registry/types/[slug]
 * Deletes a custom device type. Requires authentication.
 * Built-in types return 400 from the backend.
 */
export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const slug = params['slug'] ?? '';
  await registryProxy.deleteType(slug);
  return noContent();
}, 'Registry/Types/Delete');
