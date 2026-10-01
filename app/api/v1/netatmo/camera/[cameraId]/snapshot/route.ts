/**
 * GET /api/v1/netatmo/camera/[cameraId]/snapshot — deprecated alias of
 * /camera/[cameraId]/live/snapshot.jpg (ROADMAP T6), kept for clients still running an
 * older bundle. Remove in T6 R.
 */
export const dynamic = 'force-dynamic';

export { GET } from '../live/snapshot.jpg/route';
