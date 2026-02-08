#!/usr/bin/env node
/**
 * Script to fix TypeScript errors in test files by adding proper mock typing
 * Adds ': any' to mocked imports from jest.mock() modules
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Get all test files with errors (excluding ui components)
const filesOutput = execSync(
  `npx tsc --noEmit 2>&1 | grep -E "(__tests__/|app.*\\.test\\.|app.*__tests__)" | grep -v "app/components/ui/__tests__" | grep "error TS" | cut -d '(' -f1 | sort -u`,
  { encoding: 'utf-8' }
);

const files = filesOutput
  .trim()
  .split('\n')
  .filter(f => f && f.endsWith('.ts') || f.endsWith('.tsx'));

console.log(`Found ${files.length} test files with errors`);

files.forEach(file => {
  try {
    let content = readFileSync(file, 'utf-8');
    let modified = false;

    // Pattern 1: Fix imports from mocked modules (add ': any' after import)
    // Match: import { fn1, fn2 } from '@/lib/module';
    // When there's a jest.mock('@/lib/module') before it

    // Find all jest.mock() calls
    const mockPattern = /jest\.mock\(['"]([^'"]+)['"]/g;
    const mockedModules = [];
    let match;
    while ((match = mockPattern.exec(content)) !== null) {
      mockedModules.push(match[1]);
    }

    // For each mocked module, add type annotations to imports
    mockedModules.forEach(modulePath => {
      // Escape special regex characters in module path
      const escapedPath = modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Match import statement for this module
      const importPattern = new RegExp(
        `import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${escapedPath}['"];`,
        'g'
      );

      content = content.replace(importPattern, (fullMatch, imports) => {
        // Check if already typed
        if (imports.includes(': any') || imports.includes('as any')) {
          return fullMatch;
        }

        // Add ': any' to each import
        const typedImports = imports
          .split(',')
          .map(imp => {
            const trimmed = imp.trim();
            if (!trimmed) return '';
            // Handle 'name as alias' syntax
            if (trimmed.includes(' as ')) {
              return trimmed; // Don't modify aliases
            }
            return `${trimmed}: any`;
          })
          .filter(Boolean)
          .join(', ');

        modified = true;
        return `import { ${typedImports} } from '${modulePath}';`;
      });
    });

    // Pattern 2: Fix global.fetch
    if (content.includes('global.fetch = jest.fn()') && !content.includes('global.fetch = jest.fn() as any')) {
      content = content.replace(
        /global\.fetch = jest\.fn\(\)/g,
        'global.fetch = jest.fn() as any'
      );
      modified = true;
    }

    if (modified) {
      writeFileSync(file, content, 'utf-8');
      console.log(`✓ Fixed ${file}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log('Done!');
