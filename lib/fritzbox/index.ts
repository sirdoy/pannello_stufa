/**
 * Fritz!Box Integration
 *
 * Barrel export for all Fritz!Box lib modules
 * - Client: API communication with auth, timeout, error handling
 * - Cache: 60s TTL cache layer with Firebase RTDB
 * - Rate Limiter: 10 req/min persistent rate limiting
 * - Errors: Fritz!Box-specific error codes
 */

export { fritzboxClient } from './fritzboxClient';
export { getCachedData, invalidateCache, CACHE_TTL_MS } from './fritzboxCache';
export { checkRateLimitFritzBox, FRITZBOX_RATE_LIMIT } from './fritzboxRateLimiter';
export { FRITZBOX_ERROR_CODES } from './fritzboxErrors';
