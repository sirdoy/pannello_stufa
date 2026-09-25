/**
 * @jest-environment node
 *
 * Guard for jest.unused-components.json: components listed there have their tests
 * skipped. As soon as app code imports one of them, this test fails so the entry
 * gets removed and its tests run again. Debug pages, barrels and tests don't count.
 */
import fs from 'fs';
import path from 'path';

import UNUSED_COMPONENTS from '../jest.unused-components.json';

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['app', 'lib'];
const SKIP_DIRS = new Set(['node_modules', '.next', '__tests__', '__mocks__', 'debug']);

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...sourceFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function isBarrel(file: string): boolean {
  return /^index\.tsx?$/.test(path.basename(file));
}

const IMPORT_RE = /import\s+(?:type\s+)?([\s\S]*?)\s*from\s+['"]([^'"]+)['"]/g;

function resolveSpec(fromFile: string, spec: string): string | null {
  if (spec.startsWith('@/')) return spec.slice(2);
  if (spec.startsWith('.')) {
    return path.relative(ROOT, path.resolve(path.dirname(fromFile), spec)).split(path.sep).join('/');
  }
  return null;
}

/** Files (relative to ROOT) that import `component` directly or by name via an EmberGlass barrel. */
function importersOf(component: (typeof UNUSED_COMPONENTS)[number], files: string[]): string[] {
  const importers: string[] = [];
  for (const file of files) {
    if (isBarrel(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(IMPORT_RE)) {
      const clause = match[1] ?? '';
      const spec = match[2] ?? '';
      const target = resolveSpec(file, spec);
      if (!target) continue;
      const direct = target.replace(/\.(tsx?|jsx?)$/, '') === component.file;
      const viaBarrel =
        target.startsWith('app/components/EmberGlass') &&
        new RegExp(`\\{[^}]*\\b${component.symbol}\\b[^}]*\\}`).test(clause);
      if (direct || viaBarrel) {
        importers.push(path.relative(ROOT, file));
        break;
      }
    }
  }
  return importers;
}

describe('jest.unused-components.json', () => {
  const files = SCAN_DIRS.flatMap((d) => sourceFiles(path.join(ROOT, d)));

  test.each(UNUSED_COMPONENTS.map((c) => [c.symbol, c] as const))(
    '%s is still unused by app code (else remove it from jest.unused-components.json)',
    (_symbol, component) => {
      expect(fs.existsSync(path.join(ROOT, `${component.file}.tsx`))).toBe(true);
      expect(importersOf(component, files)).toEqual([]);
    },
  );

  test('listed test files exist', () => {
    for (const c of UNUSED_COMPONENTS) {
      for (const t of c.tests) expect(fs.existsSync(path.join(ROOT, t))).toBe(true);
    }
  });
});
