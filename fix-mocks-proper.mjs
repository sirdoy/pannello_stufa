#!/usr/bin/env node
/**
 * Script to fix TypeScript errors in test files
 * Adds mock casts after imports from mocked modules
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_command';

const files = [
  '__tests__/lib/netatmoStoveSync.test.ts',
  '__tests__/lib/coordinationOrchestrator.test.ts',
  '__tests__/lib/netatmoApi.test.ts',
  'app/api/netatmo/setthermmode/__tests__/route.test.ts',
  '__tests__/stoveApi.sandbox.test.ts',
  '__tests__/lib/coordinationDebounce.test.ts',
  '__tests__/lib/coordinationUserIntent.test.ts',
  '__tests__/lib/netatmoRateLimiter.test.ts',
  '__tests__/lib/netatmoCredentials.test.ts',
  '__tests__/lib/netatmoCameraApi.test.ts',
  '__tests__/lib/healthNotifications.test.ts',
  '__tests__/lib/envValidator.test.ts',
  '__tests__/lib/coordinationPauseCalculator.test.ts',
  '__tests__/sandboxService.test.ts',
  '__tests__/maintenanceService.concurrency.test.ts',
  '__tests__/utils/scheduleHelpers.test.ts',
  'app/api/hue/discover/__tests__/route.test.ts',
  'app/api/netatmo/setroomthermpoint/__tests__/route.test.ts',
  'app/hooks/__tests__/useHaptic.test.ts',
  '__tests__/components/monitoring/StatusCards.test.tsx',
].map(f => `/Users/federicomanfredi/Sites/localhost/pannello-stufa/${f}`);

console.log(`Processing ${files.length} test files`);

files.forEach(file => {
  try {
    let content = readFileSync(file, 'utf-8');
    let lines = content.split('\n');
    let modified = false;

    // Find all mocked imports and add jest.mocked() wrapper
    // Pattern: import { fn } from '@/lib/module'; where module is mocked
    const mockedModules = new Set();
    lines.forEach(line => {
      const mockMatch = line.match(/jest\.mock\(['"]([^'"]+)['"]/);
      if (mockMatch) {
        mockedModules.add(mockMatch[1]);
      }
    });

    // For each import from a mocked module, wrap with jest.mocked()
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match: import { names } from 'module';
      const importMatch = line.match(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const [, imports, modulePath] = importMatch;

        if (mockedModules.has(modulePath)) {
          // Extract import names
          const importNames = imports
            .split(',')
            .map(n => n.trim().split(' as ')[0].trim())
            .filter(Boolean);

          // Add jest.mocked() casts after the import
          const casts = importNames.map(name => {
            return `const ${name}Mock = jest.mocked(${name});`;
          });

          // Insert casts after import (and any following empty lines)
          let insertPos = i + 1;
          while (insertPos < lines.length && lines[insertPos].trim() === '') {
            insertPos++;
          }

          lines.splice(insertPos, 0, ...casts, '');
          modified = true;
          i = insertPos + casts.length; // Skip inserted lines
        }
      }
    }

    if (modified) {
      content = lines.join('\n');
      writeFileSync(file, content, 'utf-8');
      console.log(`✓ Fixed ${file}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log('Done!');
