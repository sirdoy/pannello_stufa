/**
 * Fritz!Box Integration
 *
 * Barrel export for all Fritz!Box lib modules
 * - Client: haGet-based function module (X-API-Key auth via shared HA proxy)
 *
 * No rate limiting or response cache here: the backend (Pi) serves Fritz data from its
 * poller cache with its own TR-064 budget (M58).
 */

export { fritzboxClient } from './fritzboxClient';
