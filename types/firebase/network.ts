export type DeviceCategory = 'iot' | 'mobile' | 'pc' | 'smart-home' | 'unknown';

export interface CategoryOverride {
  category: DeviceCategory;
  overriddenAt: number;
  isManualOverride: boolean;
}

export interface VendorCacheEntry {
  vendor: string;
  category: DeviceCategory;
  timestamp: number;
}
