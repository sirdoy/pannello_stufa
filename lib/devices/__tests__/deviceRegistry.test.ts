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

  it('Registro has sub-items for types and devices', () => {
    const nav = getNavigationStructureWithPreferences({});
    const registro = nav.global.find(g => g.label === 'Registro');
    expect(registro?.items).toEqual([
      { label: 'Tipi dispositivo', route: '/registry/types' },
      { label: 'Dispositivi', route: '/registry/devices' },
    ]);
  });

  it('Stanze has sub-items for management and status', () => {
    const nav = getNavigationStructureWithPreferences({});
    const stanze = nav.global.find(g => g.label === 'Stanze');
    expect(stanze?.items).toEqual([
      { label: 'Gestione stanze', route: '/rooms' },
      { label: 'Stato stanze', route: '/rooms/status' },
    ]);
  });
});
