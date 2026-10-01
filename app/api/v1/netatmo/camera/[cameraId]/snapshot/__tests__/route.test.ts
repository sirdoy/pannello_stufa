/**
 * GET /api/v1/netatmo/camera/[cameraId]/snapshot — deprecated alias (ROADMAP T6).
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET as aliasGET } from '../route';
import { GET } from '../../live/snapshot.jpg/route';

describe('GET /api/v1/netatmo/camera/[cameraId]/snapshot (deprecated alias)', () => {
  it('serves the same handler as /live/snapshot.jpg', () => {
    expect(aliasGET).toBe(GET);
  });
});
