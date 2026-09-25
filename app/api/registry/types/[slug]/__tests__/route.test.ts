/**
 * Tests for PUT /api/registry/types/[slug] → backend PUT /api/v1/registry/types/{slug}
 */

jest.mock('@/lib/registry', () => ({
  registryProxy: { updateType: jest.fn(), deleteType: jest.fn() },
}));
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { PUT } from '../route';
import { registryProxy } from '@/lib/registry';
import { authSession } from '@/lib/auth/session';

const mockGetSession = jest.mocked(authSession.getSession);
const mockUpdateType = jest.mocked(registryProxy.updateType);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

// Minimal request: jsdom's Request does not expose the body to parseJson().
function putRequest(body: unknown) {
  return {
    method: 'PUT',
    url: 'http://localhost:3000/api/registry/types/custom_sensor',
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => JSON.stringify(body),
  };
}

const context = { params: Promise.resolve({ slug: 'custom_sensor' }) };

describe('PUT /api/registry/types/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as never);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null as never);
    const response = await PUT(putRequest({ label: 'X' }) as never, context as never);
    expect(response.status).toBe(401);
  });

  it('forwards the trimmed label to the backend PUT and returns the updated type', async () => {
    mockUpdateType.mockResolvedValue({
      slug: 'custom_sensor',
      label: 'Nuova etichetta',
      is_builtin: 0,
      created_at: 1773000000,
    } as never);

    const response = await PUT(putRequest({ label: '  Nuova etichetta ' }) as never, context as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateType).toHaveBeenCalledWith('custom_sensor', 'Nuova etichetta');
    expect(data.label).toBe('Nuova etichetta');
    expect(data.created_at).toBe(1773000000);
  });

  it('rejects an empty label with 400 without calling the backend', async () => {
    const response = await PUT(putRequest({ label: '   ' }) as never, context as never);
    expect(response.status).toBe(400);
    expect(mockUpdateType).not.toHaveBeenCalled();
  });
});
