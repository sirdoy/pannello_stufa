/**
 * Grid Props Validation - CameraDashboard
 *
 * This test validates that CameraDashboard uses correct Grid component props:
 * - gap should be "lg" (not "large")
 * - cols should be a number like 2 (not an object like { mobile: 1, desktop: 2 })
 *
 * Regression test for: camera-page-mobile-spacing debug issue
 */

import fs from 'fs';
import path from 'path';

describe('CameraDashboard Grid Props', () => {
  const componentPath = path.join(
    process.cwd(),
    'app/(pages)/camera/CameraDashboard.js'
  );

  let componentSource;

  beforeAll(() => {
    componentSource = fs.readFileSync(componentPath, 'utf8');
  });

  it('should use valid Grid gap prop (lg, not large)', () => {
    // Should NOT contain invalid gap="large"
    expect(componentSource).not.toMatch(/gap=["']large["']/);

    // Should contain valid gap="lg"
    expect(componentSource).toMatch(/gap=["']lg["']/);
  });

  it('should use valid Grid cols prop (number, not object)', () => {
    // Should NOT contain invalid object syntax like cols={{ mobile: 1, desktop: 2 }}
    expect(componentSource).not.toMatch(/cols=\{\{\s*mobile:\s*\d+,\s*desktop:\s*\d+\s*\}\}/);

    // Should contain valid number syntax like cols={2}
    expect(componentSource).toMatch(/cols=\{2\}/);
  });

  it('should follow Grid component API from design system', () => {
    // Grid component accepts: gap = "none" | "sm" | "md" | "lg"
    // Grid component accepts: cols = 1 | 2 | 3 | 4 | 5 | 6
    const validGapPattern = /gap=["'](none|sm|md|lg)["']/g;
    const validColsPattern = /cols=\{[1-6]\}/g;

    const gapMatches = componentSource.match(validGapPattern);
    const colsMatches = componentSource.match(validColsPattern);

    // Should have at least 2 Grid components with valid props
    expect(gapMatches).not.toBeNull();
    expect(gapMatches.length).toBeGreaterThanOrEqual(2);

    expect(colsMatches).not.toBeNull();
    expect(colsMatches.length).toBeGreaterThanOrEqual(2);
  });
});
