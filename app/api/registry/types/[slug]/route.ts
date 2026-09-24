import { withAuthAndErrorHandler, noContent, success, parseJson, badRequest } from '@/lib/core';
import { registryProxy } from '@/lib/registry';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/registry/types/[slug]
 * Updates the label of a device type (slug is immutable). Requires authentication.
 */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const slug = params['slug'] ?? '';
  const body = (await parseJson(request)) as { label?: unknown };
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) return badRequest('label is required');
  const updated = await registryProxy.updateType(slug, label);
  return success(updated as unknown as Record<string, unknown>);
}, 'Registry/Types/Update');

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
