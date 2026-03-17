/**
 * Fritz!Box Integration
 *
 * Barrel export for all Fritz!Box lib modules
 * - Client: haGet-based function module (X-API-Key auth via shared HA proxy)
 * - Cache: 60s TTL cache layer with Firebase RTDB (getCachedData)
 * - Rate Limiter: 10 req/min persistent rate limiting (checkRateLimitFritzBox)
 * - Event Logger: Device connection event logging and querying
 */

export { fritzboxClient } from './fritzboxClient';
export { getCachedData } from './fritzboxCache';
export { checkRateLimitFritzBox } from './fritzboxRateLimiter';
export { logDeviceEvent, getDeviceEvents, getDeviceStates, updateDeviceStates } from './deviceEventLogger';
