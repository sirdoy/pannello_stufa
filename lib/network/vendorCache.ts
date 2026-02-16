import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { normalizeMacForFirebase } from './deviceCategories';
import type { VendorCacheEntry } from '@/types/firebase/network';

/** Vendor cache TTL: 7 days in milliseconds */
export const VENDOR_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get cached vendor information for a MAC address.
 * Returns null if cache doesn't exist or has expired (>7 days old).
 */
export async function getCachedVendor(mac: string): Promise<VendorCacheEntry | null> {
  const normalizedMac = normalizeMacForFirebase(mac);
  const path = getEnvironmentPath(`network/vendorCache/${normalizedMac}`);
  const cached = (await adminDbGet(path)) as VendorCacheEntry | null;

  if (cached && cached.timestamp && Date.now() - cached.timestamp < VENDOR_CACHE_TTL_MS) {
    return cached;
  }
  return null;
}

/**
 * Cache vendor information for a MAC address.
 * Stores in Firebase RTDB at network/vendorCache/{normalizedMac}
 */
export async function cacheVendor(mac: string, entry: VendorCacheEntry): Promise<void> {
  const normalizedMac = normalizeMacForFirebase(mac);
  const path = getEnvironmentPath(`network/vendorCache/${normalizedMac}`);
  await adminDbSet(path, entry);
}

/**
 * Fetch vendor name from macvendors.com API.
 * Returns vendor string on success, null on any error.
 * Never throws - handles all errors gracefully.
 */
export async function fetchVendorName(mac: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.macvendors.com/${encodeURIComponent(mac)}`);
    if (response.ok) {
      return await response.text();
    }
    return null;
  } catch {
    return null;
  }
}
