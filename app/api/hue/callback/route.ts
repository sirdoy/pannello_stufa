/**
 * Hue OAuth Callback Alias
 * Redirects to /api/hue/remote/callback
 * This exists because some Hue apps may be configured with /api/hue/callback
 */

export { GET } from '../remote/callback/route';
