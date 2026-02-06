---
phase: 38
plan: 05
subsystem: external-api-clients
tags: [typescript, netatmo, stove, openmeteo, api-client]
requires: [38-03]
provides: [typed-api-clients, netatmo-types, stove-types]
affects: [api-routes, components]
tech-stack:
  added: []
  patterns: [api-response-types, discriminated-unions, generic-cache]
key-files:
  created: []
  modified:
    - lib/stoveApi.ts
    - lib/openMeteo.ts
    - lib/netatmoCredentials.ts
    - lib/netatmoRateLimiter.ts
    - lib/netatmoTokenHelper.ts
    - lib/netatmoApi.ts
    - lib/netatmoCacheService.ts
    - lib/netatmoCalibrationService.ts
    - lib/netatmoCameraApi.ts
decisions: []
metrics:
  duration: 8.2 minutes
  completed: 2026-02-06
---

# Phase 38 Plan 05: External API Clients TypeScript Migration

**One-liner:** Type-safe external API clients for Thermorossi stove, Netatmo thermostat/camera, and OpenMeteo weather

## Summary

Migrated 9 external API client files from JavaScript to TypeScript, adding comprehensive type definitions for API responses while maintaining 100% runtime behavior compatibility.

## Scope

**Migrated Files (9 total):**

### Task 1: Stove, Weather, and Netatmo Support (5 files)
1. `lib/stoveApi.ts` (368 lines) - Thermorossi WiNetStove Cloud API
2. `lib/openMeteo.ts` (189 lines) - OpenMeteo weather/air quality API
3. `lib/netatmoCredentials.ts` (160 lines) - OAuth credential management
4. `lib/netatmoRateLimiter.ts` (232 lines) - Per-user rate limiting (400 calls/hour)
5. `lib/netatmoTokenHelper.ts` (258 lines) - Token refresh with caching

### Task 2: Netatmo Energy and Security APIs (4 files)
6. `lib/netatmoApi.ts` (777 lines) - Netatmo Energy API (thermostats, valves, schedules)
7. `lib/netatmoCacheService.ts` (144 lines) - Generic Firebase cache with TTL
8. `lib/netatmoCalibrationService.ts` (184 lines) - Valve calibration service
9. `lib/netatmoCameraApi.ts` (636 lines) - Netatmo Security API (cameras, events, persons)

**Total Lines Migrated:** 2,748 lines

## Technical Details

### Type Patterns Implemented

**1. API Response Types (Pragmatic Approach)**
- Only typed consumed fields, not complete API schemas
- Example: `NetatmoHome`, `NetatmoRoom`, `NetatmoModule`
- Avoided over-typing rarely-used fields

**2. Discriminated Unions**
```typescript
// Rate limit check result
type RateLimitCheckResult = RateLimitAllowed | RateLimitBlocked;

// Token result
type TokenResult = TokenSuccess | TokenError;

// Calibration result
type CalibrationResult = CalibrationSuccess | CalibrationFailure;
```

**3. Generic Cache Service**
```typescript
function getCached<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<CacheResult<T>>
```

**4. Interface Segregation**
- Raw API types: `NetatmoCamera`, `NetatmoEvent`
- Parsed types (Firebase-safe): `ParsedCamera`, `ParsedEvent`
- Removes undefined values for Firebase compatibility

**5. Assertion-Based Validation**
```typescript
function validateCredentials(credentials: CredentialsRaw):
  asserts credentials is NetatmoCredentials
```

### Key Type Definitions

**Stove API:**
- `StoveStatusResponse`, `StoveNumericResponse`, `StoveApiResponse`
- Imported `StovePowerLevel` from `@/types/firebase`

**OpenMeteo:**
- `WeatherForecast`, `AirQualityData`, `WeatherCondition`
- `WMO_CODES` typed as `Record<number, WeatherCondition>`

**Netatmo Credentials:**
- `NetatmoCredentials`, `NetatmoCredentialsClient`
- Separate interfaces for server/client contexts

**Rate Limiter:**
- `RateLimitState`, `RateLimitCheckResult` (discriminated union)
- `RateLimitTrackResult`, `RateLimitStatusResult`

**Token Helper:**
- `TokenData`, `CachedTokenData`, `TokenResult` (discriminated union)
- `TokenErrorType`, `TokenErrorHandling`

**Netatmo Energy API:**
- `NetatmoHome`, `NetatmoRoom`, `NetatmoModule`, `NetatmoSchedule`
- `ParsedRoom`, `ParsedModule`, `ParsedSchedule` (Firebase-safe)
- `SetRoomThermpointParams`, `SetThermModeParams`, `GetRoomMeasureParams`

**Netatmo Security API:**
- `NetatmoCamera`, `NetatmoPerson`, `NetatmoEvent`
- `ParsedCamera`, `ParsedPerson`, `ParsedEvent`
- `NetatmoCameraHome`

**Cache Service:**
- Generic `CacheEntry<T>`, `CacheResult<T>` (union: `CacheHit<T> | CacheMiss<T>`)

**Calibration Service:**
- Discriminated union: `CalibrationSuccess | CalibrationFailure`
- `CalibrationEntry` for logging

## Migration Strategy

1. **Git mv for history preservation** - All files renamed with `git mv`
2. **Interface-first** - Defined interfaces before typing functions
3. **Explicit return types** - All exported functions have return types
4. **Unknown over any** - Used `unknown` for flexible JSON structures
5. **Gradual strictness** - Complex nested objects use `unknown[]` or `Record<string, unknown>`

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 05a17b0 | feat(38-05): migrate stove API, OpenMeteo, and Netatmo support files | 5 |
| dd9551a | feat(38-05): migrate Netatmo API, cache, and calibration services | 3 |
| c3e57e5 | feat(38-05): migrate Netatmo Camera API | 1 |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Ready for:** Phase 38 continues with remaining library files

## Notes

- All API clients maintain exact runtime behavior
- Type safety added without changing any logic
- Interfaces document API surface clearly
- Generic cache pattern reusable across services
- Discriminated unions enable exhaustive type checking
