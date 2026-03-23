import { getNavigationStructureWithPreferences } from '../deviceRegistry';

describe('getNavigationStructureWithPreferences - global nav items', () => {
  it('includes Registro entry pointing to /registry/types', () => {
    const nav = getNavigationStructureWithPreferences({});
    expect(nav.global).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Registro', route: '/registry/types' }),
      ])
    );
  });

  it('includes Stanze entry pointing to /rooms', () => {
    const nav = getNavigationStructureWithPreferences({});
    expect(nav.global).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Stanze', route: '/rooms' }),
      ])
    );
  });

  it('has at least 3 global entries', () => {
    const nav = getNavigationStructureWithPreferences({});
    expect(nav.global.length).toBeGreaterThanOrEqual(3);
  });
});
