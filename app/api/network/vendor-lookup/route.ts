import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { getCachedVendor, cacheVendor, fetchVendorName } from '@/lib/network/vendorCache';
import { categorizeByVendor } from '@/lib/network/deviceCategories';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const mac = searchParams.get('mac');

  if (!mac) {
    throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Indirizzo MAC richiesto', HTTP_STATUS.BAD_REQUEST);
  }

  // 1. Check vendor cache (7-day TTL)
  const cached = await getCachedVendor(mac);
  if (cached) {
    return success({ vendor: cached.vendor, category: cached.category, cached: true });
  }

  // 2. Fetch from macvendors.com (returns null on error/not-found)
  const vendor = await fetchVendorName(mac);

  // 3. Categorize
  const category = categorizeByVendor(vendor);

  // 4. Cache result (even 'unknown' to avoid repeated lookups)
  await cacheVendor(mac, { vendor: vendor ?? '', category, timestamp: Date.now() });

  return success({ vendor: vendor ?? '', category, cached: false });
}, 'Network/VendorLookup');
