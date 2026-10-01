/**
 * POST /api/v1/thermorossi/commands/ignit — deprecated alias of /commands/ignite (ROADMAP T6),
 * kept for clients still running an older bundle. Remove together with the backend alias.
 */
export const dynamic = 'force-dynamic';

export { POST } from '../ignite/route';
