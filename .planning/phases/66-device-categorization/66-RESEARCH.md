# Phase 66: Device Categorization - Research

**Researched:** 2026-02-16
**Domain:** MAC vendor lookup, device categorization, Firebase persistence, UI badges
**Confidence:** HIGH

## Summary

Phase 66 implements automatic device categorization using MAC address vendor lookup (via OUI database) with manual override capability. The system will categorize Fritz!Box network devices into 5 categories (IoT, mobile, PC, smart home, unknown) based on manufacturer identification, store category preferences in Firebase RTDB, and display categories with color-coded badges in the device list table.

The implementation follows established v8.0 patterns: server-side API proxy for MAC lookup, Firebase RTDB cache with TTL, existing Badge component for category display, and the DeviceListTable orchestrator pattern. No new dependencies required—all functionality achievable with existing stack (Firebase RTDB, Next.js API routes, Badge UI component).

**Primary recommendation:** Use macvendors.com free tier (1,000 requests/day, 1 req/sec) with server-side caching to minimize lookups. Implement category mapping heuristics based on common manufacturer names (Apple/Samsung→mobile, Raspberry Pi/Espressif→IoT, TP-Link/AVM→smart home). Store manual overrides in Firebase RTDB under `network/deviceCategories/{mac}` to persist user preferences.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js API Routes | 16.1.0 | Server-side MAC lookup proxy | Already used for Fritz!Box, Netatmo, Hue APIs |
| Firebase RTDB (Admin SDK) | 13.6.0 | Category storage + cache | Established v8.0 pattern for network data |
| Badge component | - | Category UI display | Ember Noir design system component |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Timestamp formatting | Cache expiry calculation |
| Zod | 3.24.2 | API response validation | Validate MAC lookup responses |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| macvendors.com | maclookup.app | Higher rate limits (API v2 for free) but less established |
| macvendors.com | macaddress.io | More detailed data but requires API key for meaningful usage |
| Server-side proxy | Client-side lookup | Exposes rate limit quota to users, CORS issues |
| Firebase RTDB | In-memory cache | Loses data on serverless cold start |

**Installation:**
No new packages required. All functionality uses existing dependencies.

## Architecture Patterns

### Recommended Project Structure
```
app/api/
├── network/
│   ├── vendor-lookup/
│   │   └── route.ts          # MAC vendor lookup proxy endpoint
lib/
├── network/
│   ├── deviceCategories.ts    # Category mapping + heuristics
│   └── vendorCache.ts         # Firebase RTDB cache layer
app/network/
├── components/
│   ├── DeviceListTable.tsx    # Add category column
│   └── DeviceCategoryBadge.tsx # Category badge component
types/
└── firebase/
    └── network.ts             # Add DeviceCategory types
```

### Pattern 1: Server-Side MAC Vendor Lookup
**What:** Proxy external MAC lookup API through Next.js API route with Firebase caching
**When to use:** All MAC vendor lookups (auto-categorization)
**Example:**
```typescript
// app/api/network/vendor-lookup/route.ts
export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const { searchParams } = new URL(request.url);
  const mac = searchParams.get('mac');

  if (!mac) {
    throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'MAC address required', HTTP_STATUS.BAD_REQUEST);
  }

  // 1. Check Firebase cache (60-second TTL)
  const cached = await getCachedVendor(mac);
  if (cached) {
    return success({ vendor: cached.vendor, category: cached.category, cached: true });
  }

  // 2. Rate limit check (6-second delay between requests per v8.0 pattern)
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'vendor-lookup');
  if (!rateLimitResult.allowed) {
    throw new ApiError(ERROR_CODES.RATE_LIMITED, `Retry in ${rateLimitResult.nextAllowedIn}s`, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  // 3. Fetch from macvendors.com
  const vendor = await fetchVendorName(mac);

  // 4. Apply category mapping heuristics
  const category = categorizeByVendor(vendor);

  // 5. Cache in Firebase RTDB
  await cacheVendor(mac, { vendor, category, timestamp: Date.now() });

  return success({ vendor, category, cached: false });
}, 'Network/VendorLookup');
```

### Pattern 2: Category Mapping Heuristics
**What:** Map vendor names to device categories using keyword matching
**When to use:** Auto-categorization after MAC lookup
**Example:**
```typescript
// lib/network/deviceCategories.ts
export type DeviceCategory = 'iot' | 'mobile' | 'pc' | 'smart-home' | 'unknown';

const CATEGORY_MAPPINGS: Record<string, DeviceCategory> = {
  // IoT manufacturers
  'Raspberry Pi': 'iot',
  'Espressif': 'iot',
  'Arduino': 'iot',

  // Mobile manufacturers
  'Apple': 'mobile',
  'Samsung': 'mobile',
  'Google': 'mobile',
  'Xiaomi': 'mobile',

  // PC manufacturers
  'Dell': 'pc',
  'HP': 'pc',
  'Lenovo': 'pc',
  'Intel': 'pc',

  // Smart home manufacturers
  'TP-Link': 'smart-home',
  'AVM': 'smart-home',
  'Philips': 'smart-home',
  'Netatmo': 'smart-home',
  'Nest': 'smart-home',
};

export function categorizeByVendor(vendor: string | null): DeviceCategory {
  if (!vendor) return 'unknown';

  // Exact match
  if (CATEGORY_MAPPINGS[vendor]) {
    return CATEGORY_MAPPINGS[vendor];
  }

  // Keyword matching (case-insensitive)
  const lowerVendor = vendor.toLowerCase();
  for (const [key, category] of Object.entries(CATEGORY_MAPPINGS)) {
    if (lowerVendor.includes(key.toLowerCase())) {
      return category;
    }
  }

  return 'unknown';
}
```

### Pattern 3: Firebase Category Override Storage
**What:** Store user manual category overrides in Firebase RTDB
**When to use:** User manually changes device category
**Example:**
```typescript
// lib/network/deviceCategories.ts
export async function saveCategoryOverride(mac: string, category: DeviceCategory): Promise<void> {
  await adminDbUpdate(`network/deviceCategories/${mac.replace(/:/g, '_')}`, {
    category,
    overriddenAt: Date.now(),
    isManualOverride: true,
  });
}

export async function getCategoryOverride(mac: string): Promise<DeviceCategory | null> {
  const data = await adminDbGet(`network/deviceCategories/${mac.replace(/:/g, '_')}`);
  return data?.category || null;
}

export async function getDeviceCategory(mac: string): Promise<DeviceCategory> {
  // 1. Check manual override first
  const override = await getCategoryOverride(mac);
  if (override) return override;

  // 2. Check vendor cache
  const cached = await getCachedVendor(mac);
  if (cached) return cached.category;

  // 3. Default to unknown
  return 'unknown';
}
```

### Pattern 4: Badge Component for Category Display
**What:** Use existing Badge component with category-specific variants
**When to use:** Display category in DeviceListTable
**Example:**
```typescript
// app/network/components/DeviceCategoryBadge.tsx
import { Badge } from '@/app/components/ui';
import type { DeviceCategory } from '@/lib/network/deviceCategories';

const CATEGORY_CONFIG: Record<DeviceCategory, { label: string; variant: ComponentProps<typeof Badge>['variant']; icon: string }> = {
  'iot': { label: 'IoT', variant: 'ocean', icon: '🔌' },
  'mobile': { label: 'Mobile', variant: 'sage', icon: '📱' },
  'pc': { label: 'PC', variant: 'warning', icon: '💻' },
  'smart-home': { label: 'Smart Home', variant: 'ember', icon: '🏠' },
  'unknown': { label: 'Sconosciuto', variant: 'neutral', icon: '❓' },
};

export function DeviceCategoryBadge({ category }: { category: DeviceCategory }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <Badge variant={config.variant} size="sm">
      {config.icon} {config.label}
    </Badge>
  );
}
```

### Pattern 5: DeviceListTable Category Column
**What:** Add category column to existing DataTable with inline edit capability
**When to use:** Display and edit device categories
**Example:**
```typescript
// app/network/components/DeviceListTable.tsx
const columns = useMemo<ColumnDef<DeviceData>[]>(() => [
  // ... existing columns
  {
    accessorKey: 'category',
    header: 'Categoria',
    enableSorting: true,
    enableGlobalFilter: false,
    cell: ({ row }) => {
      const [editing, setEditing] = useState(false);

      if (editing) {
        return (
          <Select
            value={row.original.category}
            onChange={(e) => {
              handleCategoryChange(row.original.mac, e.target.value as DeviceCategory);
              setEditing(false);
            }}
            options={[
              { value: 'iot', label: '🔌 IoT' },
              { value: 'mobile', label: '📱 Mobile' },
              { value: 'pc', label: '💻 PC' },
              { value: 'smart-home', label: '🏠 Smart Home' },
              { value: 'unknown', label: '❓ Sconosciuto' },
            ]}
          />
        );
      }

      return (
        <div onClick={() => setEditing(true)} className="cursor-pointer">
          <DeviceCategoryBadge category={row.original.category} />
        </div>
      );
    },
  },
], []);
```

### Anti-Patterns to Avoid
- **Client-side MAC lookups:** Exposes API rate limits, CORS issues, quota exhaustion
- **No caching:** 1,000 daily requests exhausted quickly with 20+ devices
- **Vendor string exact match only:** Misses variations ("Apple, Inc." vs "Apple Inc")
- **No manual override:** Auto-categorization can't be 100% accurate
- **Category in device name:** Loses information when user renames device

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MAC vendor database | Custom OUI database scraper + storage | macvendors.com API | IEEE publishes 30,000+ OUI assignments, updated weekly. Free tier sufficient for typical home network. |
| Category inference ML | Machine learning model from device behavior | Simple keyword matching + manual override | Home networks too small for ML, heuristics + user override more reliable |
| Device fingerprinting | Active network probing (DHCP, UPnP, etc.) | MAC vendor + manual category | Fritz!Box TR-064 only exposes basic device info, fingerprinting complex and error-prone |
| Rate limiting | Custom token bucket implementation | Existing checkRateLimitFritzBox helper | Already implemented in Phase 61 for Fritz!Box APIs |

**Key insight:** MAC vendor lookup is a solved problem with established free APIs. Focus implementation effort on user experience (category mapping quality, easy manual override) rather than infrastructure (vendor database, rate limiting).

## Common Pitfalls

### Pitfall 1: MAC Address Format Inconsistency
**What goes wrong:** MAC addresses stored in different formats (aa:bb:cc:dd:ee:ff vs AA-BB-CC-DD-EE-FF vs aabbccddeeff) cause cache misses
**Why it happens:** Fritz!Box returns uppercase with colons, some APIs expect lowercase with dashes, Firebase key restrictions forbid colons
**How to avoid:** Normalize MAC addresses to lowercase with colons for display/lookup, replace colons with underscores for Firebase keys
**Warning signs:** Cache hit rate < 90%, duplicate vendor lookups for same device

### Pitfall 2: Rate Limit Quota Exhaustion
**What goes wrong:** 1,000 daily requests consumed within hours, blocking all categorization
**Why it happens:** Initial page load triggers lookup for all 20+ devices, cache misses due to TTL expiry, no exponential backoff
**How to avoid:**
- Batch lookups on initial load (delay 6 seconds between requests)
- Firebase cache TTL = 7 days (not 60 seconds like bandwidth data)
- Manual override prevents repeated lookups for known devices
**Warning signs:** 429 errors in network tab, devices showing "unknown" category after working earlier

### Pitfall 3: Vendor Name Ambiguity
**What goes wrong:** Same manufacturer makes multiple device types (Samsung makes phones, TVs, routers, refrigerators)
**Why it happens:** Category mapping assumes one-to-one vendor-to-category relationship
**How to avoid:**
- Default to most common device type for manufacturer (Samsung→mobile)
- Manual override for edge cases (Samsung Smart TV→smart-home)
- Don't overcomplicate heuristics—user can fix mistakes easily
**Warning signs:** User constantly overriding same manufacturers

### Pitfall 4: Firebase Key Character Restrictions
**What goes wrong:** MAC addresses with colons (aa:bb:cc:dd:ee:ff) rejected as Firebase keys
**Why it happens:** Firebase RTDB keys cannot contain `.`, `$`, `#`, `[`, `]`, `/`, or control characters (colons technically allowed but discouraged)
**How to avoid:** Replace colons with underscores for Firebase keys: `network/deviceCategories/aa_bb_cc_dd_ee_ff`
**Warning signs:** Firebase write errors, missing category data

### Pitfall 5: Stale Category Data After Device Replacement
**What goes wrong:** User replaces router, new device inherits category from old device with same MAC (unlikely but possible)
**Why it happens:** MAC override persists in Firebase forever, no TTL or validation
**How to avoid:**
- Include `lastSeenVendor` in override record
- Display warning if vendor name doesn't match current lookup
- Allow user to "reset to auto" for manual overrides
**Warning signs:** User reports wrong category for newly added device

## Code Examples

Verified patterns from codebase:

### Fritz!Box Cache Pattern (from Phase 61)
```typescript
// lib/fritzbox/cache.ts (EXISTING - reuse for vendor cache)
interface CachedData<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds for bandwidth, use 604_800_000 (7 days) for vendors

export async function getCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL_MS
): Promise<T> {
  const cached = await adminDbGet(`network/cache/${cacheKey}`) as CachedData<T> | null;

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const freshData = await fetchFn();
  await adminDbSet(`network/cache/${cacheKey}`, {
    data: freshData,
    timestamp: Date.now(),
  });

  return freshData;
}
```

### Badge Component (from design system)
```typescript
// app/components/ui/Badge.tsx (EXISTING - use for categories)
<Badge variant="sage" size="sm">
  📱 Mobile
</Badge>

// Available variants: ember, sage, ocean, warning, danger, neutral
// Matches category needs: IoT (ocean), Mobile (sage), PC (warning), Smart Home (ember), Unknown (neutral)
```

### FilterUndefined Helper (from BaseRepository)
```typescript
// lib/repositories/base/BaseRepository.ts (EXISTING - use for category updates)
protected filterUndefined<D>(data: D): D {
  if (data === null || data === undefined) return null as D;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(item => this.filterUndefined(item)) as D;

  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, this.filterUndefined(value)])
  ) as D;
}
```

### DataTable Column Definition (from DeviceListTable)
```typescript
// app/network/components/DeviceListTable.tsx (EXISTING - add category column)
const columns = useMemo<ColumnDef<DeviceData>[]>(() => [
  {
    accessorKey: 'mac',
    header: 'MAC',
    enableSorting: true,
    enableGlobalFilter: true,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-slate-500">{row.original.mac}</span>
    ),
  },
  // ADD category column after MAC
], []);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No categorization | MAC vendor lookup + heuristics | Phase 66 (new) | Automatic device organization |
| Manual device naming | Category badges + filters | Phase 66 (new) | Visual device identification |
| Local storage only | Firebase persistence | v8.0 pattern | Cross-device consistency |
| Client-side lookups | Server-side proxy + cache | v8.0 pattern | Rate limit protection |

**Deprecated/outdated:**
- None (new feature, no legacy code)

## Open Questions

1. **Should categories be filterable in DeviceListTable?**
   - What we know: Status filter tabs already exist (all/online/offline)
   - What's unclear: Whether category filter adds value or clutters UI
   - Recommendation: Implement category column first, add filter if user requests it. DataTable search already filters by all columns including category.

2. **Should vendor name be displayed to user?**
   - What we know: MAC vendor lookup returns manufacturer name (e.g., "Apple, Inc.")
   - What's unclear: Whether vendor name helps user or just adds noise
   - Recommendation: Show vendor name on hover/tooltip for category badge. Helps debug auto-categorization mistakes.

3. **Should manual overrides be synced across users?**
   - What we know: Firebase RTDB supports per-user preferences, but this is network-wide data
   - What's unclear: Whether household members should see same categories or personal preferences
   - Recommendation: Store in shared namespace (not userId-scoped). One household member categorizing "Living Room TV" helps everyone.

4. **What happens when Fritz!Box returns device without MAC address?**
   - What we know: TR-064 API should always include MAC, but edge cases possible
   - What's unclear: Fallback behavior for missing MAC
   - Recommendation: Default to "unknown" category, log warning. Don't crash device list.

## Sources

### Primary (HIGH confidence)
- macvendors.com API documentation - Rate limits (1,000/day, 1 req/sec), response format
- Fritz!Box Phase 61 implementation - Server-side proxy pattern, Firebase cache, rate limiting
- DeviceListTable implementation - DataTable column patterns, Badge usage
- Firebase RTDB documentation - Key restrictions, update patterns
- Badge component source - Available variants, size options

### Secondary (MEDIUM confidence)
- [MAC Address Lookup API Documentation](https://macvendors.com/api) - Free tier specifications
- [MAC Lookup App API v2](https://maclookup.app/api-v2/documentation) - Alternative vendor lookup service
- [Wireshark OUI Lookup](https://www.wireshark.org/tools/oui-lookup.html) - IEEE OUI database reference
- [IoT Manufacturers List](https://www.mokosmart.com/top-iot-manufacturers/) - Common IoT device vendors
- [ESP32 MAC Address Guide](https://randomnerdtutorials.com/get-change-esp32-esp8266-mac-address-arduino/) - Espressif OUI information

### Tertiary (LOW confidence)
- Smart home device categorization articles (general guidance, not specific to implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All required libraries already installed (Firebase RTDB, Next.js, Badge component)
- Architecture: HIGH - Reuses established v8.0 patterns (server proxy, Firebase cache, orchestrator pattern)
- Pitfalls: HIGH - Based on direct codebase analysis (Fritz!Box cache implementation, Firebase key restrictions)
- Category mapping: MEDIUM - Heuristics require testing with real household devices to refine

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - stable domain, infrequent API changes)
