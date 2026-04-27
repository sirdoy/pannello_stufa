import { render } from '@testing-library/react';
import { FlameViz } from '../FlameViz';

describe('FlameViz (EmberGlass primitive — Phase 176)', () => {
  test('on={true} adds glow box-shadow + flamePulse animation', () => {
    const { container } = render(<FlameViz on />);
    const outer = container.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    expect(outer.style.boxShadow).toContain('color-mix');
    expect(outer.style.animation).toContain('flamePulse');
  });

  test('on={false} removes box-shadow and animation', () => {
    const { container } = render(<FlameViz on={false} />);
    const outer = container.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    expect(outer.style.boxShadow).toBe('none');
    expect(outer.style.animation).toBe('none');
  });

  test('intensity prop scales body height linearly', () => {
    // height = 64 * (0.5 + intensity * 0.5)
    const { container: c1 } = render(<FlameViz on intensity={0.6} />);
    const body1 = c1.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    expect(body1.style.height).toMatch(/51\.2px/); // 64 * 0.8

    const { container: c2 } = render(<FlameViz on intensity={0.95} />);
    const body2 = c2.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    expect(body2.style.height).toMatch(/62\.4px/); // 64 * 0.975
  });

  test('data-flame-viz="true" attribute applied to wrapper', () => {
    const { container } = render(<FlameViz on />);
    expect(container.querySelector('[data-flame-viz="true"]')).not.toBeNull();
  });
});
