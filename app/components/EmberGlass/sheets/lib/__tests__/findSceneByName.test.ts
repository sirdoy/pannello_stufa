import { findSceneByName } from '../findSceneByName';
import type { HueScene } from '@/types/hueProxy';

const makeScene = (overrides: Partial<HueScene>): HueScene =>
  ({
    scene_id: 's1',
    name: 'Default',
    group_id: 'g1',
    group_name: null,
    lights: [],
    type: null,
    ...overrides,
  }) as HueScene;

describe('findSceneByName (CONTEXT D-07)', () => {
  it('returns null for an empty catalog', () => {
    expect(findSceneByName([], 'Rilassante')).toBeNull();
  });

  it('returns the matching scene on exact-case hit', () => {
    const catalog = [makeScene({ scene_id: 's1', name: 'Rilassante' })];
    const result = findSceneByName(catalog, 'Rilassante');
    expect(result?.scene_id).toBe('s1');
  });

  it('matches case-insensitively', () => {
    const catalog = [makeScene({ scene_id: 's1', name: 'RILASSANTE' })];
    const result = findSceneByName(catalog, 'rilassante');
    expect(result?.scene_id).toBe('s1');
  });

  it('returns null on miss', () => {
    const catalog = [makeScene({ scene_id: 's1', name: 'Rilassante' })];
    expect(findSceneByName(catalog, 'Concentrato')).toBeNull();
  });

  it('returns the first match when multiple entries collide (case-insensitive)', () => {
    const catalog = [
      makeScene({ scene_id: 'first', name: 'Rilassante' }),
      makeScene({ scene_id: 'second', name: 'rilassante' }),
    ];
    const result = findSceneByName(catalog, 'Rilassante');
    expect(result?.scene_id).toBe('first');
  });

  it('handles mixed-case lookup against differently-cased catalog entries', () => {
    const catalog = [
      makeScene({ scene_id: 'a', name: 'Notte' }),
      makeScene({ scene_id: 'b', name: 'CENA' }),
    ];
    expect(findSceneByName(catalog, 'cena')?.scene_id).toBe('b');
    expect(findSceneByName(catalog, 'NOTTE')?.scene_id).toBe('a');
  });
});
