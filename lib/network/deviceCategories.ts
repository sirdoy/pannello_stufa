import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import type { DeviceCategory, CategoryOverride } from '@/types/firebase/network';

/**
 * Vendor keyword to category mappings.
 * Uses case-insensitive partial matching.
 */
const CATEGORY_MAPPINGS: Record<string, DeviceCategory> = {
  // Mobile devices
  apple: 'mobile',
  samsung: 'mobile',
  xiaomi: 'mobile',
  huawei: 'mobile',
  oppo: 'mobile',
  vivo: 'mobile',
  oneplus: 'mobile',
  motorola: 'mobile',
  google: 'mobile',
  sony: 'mobile',
  nokia: 'mobile',
  lg: 'mobile',

  // IoT devices
  'raspberry pi': 'iot',
  espressif: 'iot',
  arduino: 'iot',
  particle: 'iot',
  nordic: 'iot',
  texas: 'iot',
  microchip: 'iot',

  // Smart home devices
  avm: 'smart-home',
  'tp-link': 'smart-home',
  'philips lighting': 'smart-home',
  philips: 'smart-home',
  signify: 'smart-home',
  netgear: 'smart-home',
  linksys: 'smart-home',
  belkin: 'smart-home',
  nest: 'smart-home',
  ring: 'smart-home',
  sonos: 'smart-home',
  amazon: 'smart-home',

  // PC/Laptops
  dell: 'pc',
  intel: 'pc',
  hp: 'pc',
  lenovo: 'pc',
  asus: 'pc',
  acer: 'pc',
  msi: 'pc',
  gigabyte: 'pc',
  asrock: 'pc',
  microsoft: 'pc',
};

/**
 * Categorize a device by its vendor name using keyword matching.
 * Returns 'unknown' if vendor is null, empty, or not recognized.
 */
export function categorizeByVendor(vendor: string | null): DeviceCategory {
  if (!vendor || vendor.trim() === '') {
    return 'unknown';
  }

  const normalizedVendor = vendor.toLowerCase();

  // Try to find a matching keyword
  for (const [keyword, category] of Object.entries(CATEGORY_MAPPINGS)) {
    if (normalizedVendor.includes(keyword)) {
      return category;
    }
  }

  return 'unknown';
}

/**
 * Normalize MAC address for Firebase key usage.
 * Converts to lowercase and replaces colons/dashes with underscores.
 * Example: 'AA:BB:CC:DD:EE:FF' -> 'aa_bb_cc_dd_ee_ff'
 */
export function normalizeMacForFirebase(mac: string): string {
  return mac.toLowerCase().replace(/[:-]/g, '_');
}

/**
 * Save a manual category override for a device.
 * Stores in Firebase RTDB at network/deviceCategories/{normalizedMac}
 */
export async function saveCategoryOverride(
  mac: string,
  category: DeviceCategory
): Promise<void> {
  const normalizedMac = normalizeMacForFirebase(mac);
  const path = getEnvironmentPath(`network/deviceCategories/${normalizedMac}`);

  const override: CategoryOverride = {
    category,
    overriddenAt: Date.now(),
    isManualOverride: true,
  };

  await adminDbSet(path, override);
}

/**
 * Get a manual category override for a device.
 * Returns the category if an override exists, null otherwise.
 */
export async function getCategoryOverride(mac: string): Promise<DeviceCategory | null> {
  const normalizedMac = normalizeMacForFirebase(mac);
  const path = getEnvironmentPath(`network/deviceCategories/${normalizedMac}`);

  const override = (await adminDbGet(path)) as CategoryOverride | null;

  return override?.category ?? null;
}

/**
 * Get the category for a device, respecting priority chain:
 * 1. Manual override (highest priority)
 * 2. Cached category from vendor lookup
 * 3. 'unknown' (fallback)
 */
export async function getDeviceCategory(
  mac: string,
  cachedCategory?: DeviceCategory | null
): Promise<DeviceCategory> {
  // Priority 1: Check for manual override
  const override = await getCategoryOverride(mac);
  if (override) {
    return override;
  }

  // Priority 2: Use cached category if available
  if (cachedCategory) {
    return cachedCategory;
  }

  // Priority 3: Fallback to unknown
  return 'unknown';
}
