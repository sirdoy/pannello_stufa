/**
 * Tests for deployed-version detection (M17)
 */

function load(buildId?: string): typeof import('../buildVersion') {
  const previous = process.env.NEXT_PUBLIC_BUILD_ID;
  if (buildId === undefined) delete process.env.NEXT_PUBLIC_BUILD_ID;
  else process.env.NEXT_PUBLIC_BUILD_ID = buildId;
  let mod!: typeof import('../buildVersion');
  jest.isolateModules(() => {
    mod = jest.requireActual('../buildVersion');
  });
  if (previous === undefined) delete process.env.NEXT_PUBLIC_BUILD_ID;
  else process.env.NEXT_PUBLIC_BUILD_ID = previous;
  return mod;
}

describe('buildVersion', () => {
  it('falls back to dev without a build id', () => {
    expect(load().FRONTEND_BUILD_ID).toBe('dev');
  });

  it('detects a new frontend deployment', () => {
    const { isNewVersionAvailable } = load('aaaaaaaaaaaa');
    expect(isNewVersionAvailable({ frontend: 'bbbbbbbbbbbb', backend: null }, null)).toBe(true);
    expect(isNewVersionAvailable({ frontend: 'aaaaaaaaaaaa', backend: null }, null)).toBe(false);
  });

  it('ignores frontend ids in local dev', () => {
    expect(load().isNewVersionAvailable({ frontend: 'bbbbbbbbbbbb', backend: null }, null)).toBe(false);
    expect(load('aaaaaaaaaaaa').isNewVersionAvailable({ frontend: 'dev', backend: null }, null)).toBe(false);
  });

  it('detects a backend deploy against the baseline', () => {
    const { isNewVersionAvailable } = load('aaaaaaaaaaaa');
    const deployed = { frontend: 'aaaaaaaaaaaa', backend: 'new' };
    expect(isNewVersionAvailable(deployed, 'old')).toBe(true);
    expect(isNewVersionAvailable(deployed, 'new')).toBe(false);
    expect(isNewVersionAvailable(deployed, null)).toBe(false);
    expect(isNewVersionAvailable({ ...deployed, backend: null }, 'old')).toBe(false);
  });
});
