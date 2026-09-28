/**
 * Deployed-version detection (M17).
 *
 * The frontend build commit is inlined at build time (NEXT_PUBLIC_BUILD_ID from
 * VERCEL_GIT_COMMIT_SHA). GET /api/version runs on the *latest* deployment, so a
 * page loaded from an older build sees a different frontend id; the backend id
 * (`version` from the Pi's /health) changes on every Pi deploy.
 */

export const FRONTEND_BUILD_ID: string = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';

export interface DeployedVersion {
  /** Commit of the frontend deployment that answered /api/version */
  frontend: string;
  /** Commit of the running backend, null when unknown or unreachable */
  backend: string | null;
}

/**
 * True when the deployed code differs from what this page runs.
 *
 * @param deployed - Answer of GET /api/version
 * @param backendBaseline - First backend version seen by this page load (null if none yet)
 */
export function isNewVersionAvailable(
  deployed: DeployedVersion,
  backendBaseline: string | null
): boolean {
  const frontendChanged =
    FRONTEND_BUILD_ID !== 'dev' && deployed.frontend !== 'dev' && deployed.frontend !== FRONTEND_BUILD_ID;
  const backendChanged =
    backendBaseline !== null && deployed.backend !== null && deployed.backend !== backendBaseline;
  return frontendChanged || backendChanged;
}
