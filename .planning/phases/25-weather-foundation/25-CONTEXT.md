# Phase 25: Weather Foundation - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Infrastructure for weather data and user preferences. API route that returns weather data for coordinates, geolocation utility with iOS fallback, and dashboard preferences service. This phase builds the foundation — UI components and settings pages are separate phases.

**Key architectural decision:** Single shared location for the entire app, stored in Firebase RTDB. All users see weather for the same location.

</domain>

<decisions>
## Implementation Decisions

### Geolocation fallback behavior
- When geolocation fails, show error + link to location settings page
- Error messages are specific to failure reason (permission denied vs timeout vs unavailable)
- If user has saved location, show both options: "Update location" (tries GPS) and "Use saved"
- iOS PWA warning: Claude's discretion on whether to show preemptive note

### Cache and refresh strategy
- Cache TTL: 15 minutes (from requirements)
- Stale data handling: Return stale immediately, refresh in background
- Response includes `cachedAt` timestamp so UI can show data freshness
- Single cache entry for the app (one shared location, not per-user)
- Cache storage: Claude's discretion (in-memory vs Firebase RTDB)

### API error responses
- Error format: Claude's discretion on specific codes vs HTTP status only
- Upstream failure handling: Claude's discretion (return stale vs error)
- Retry hints: Claude's discretion on Retry-After header
- Error logging: Log failures to Firebase for monitoring (existing pattern)

### Location storage and behavior
- Any authenticated user can set the app-wide location
- Location stored at Firebase RTDB `/config/location`
- When no location is set: return error `LOCATION_NOT_SET` (not empty data)
- Location changes trigger real-time sync to all connected clients

### Claude's Discretion
- iOS PWA geolocation warning (show preemptive note or not)
- Cache storage mechanism (in-memory Map vs Firebase RTDB)
- Upstream failure behavior (return stale cache vs error)
- Error code specificity (custom codes vs HTTP status only)
- Retry-After header inclusion
- Coordinate rounding for cache key (given single location, may be moot)

</decisions>

<specifics>
## Specific Ideas

- Single shared location simplifies cache significantly — one entry, not per-user
- Real-time sync means changing location updates weather everywhere immediately
- Firebase RTDB at `/config/location` — follows existing config patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-weather-foundation*
*Context gathered: 2026-02-02*
