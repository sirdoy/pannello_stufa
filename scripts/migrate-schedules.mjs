#!/usr/bin/env node

/**
 * Migration script for schedules v1 → v2
 *
 * Loads environment variables from .env.local and executes the migration.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   node scripts/migrate-schedules.mjs [--dry-run] [--force]
 *
 * Options:
 *   --dry-run   Simulate migration without writing to Firebase
 *   --force     Skip confirmation prompt
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env.local
const envPath = join(projectRoot, '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      process.env[key.trim()] = cleanValue;
    }
  });
  console.log('✅ Environment variables loaded from .env.local');
} catch (error) {
  console.error('❌ Error loading .env.local:', error.message);
  console.error('Make sure .env.local exists in the project root');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

// Import migration function
const { migrateSchedulesToV2 } = await import('../lib/migrateSchedules.js');

// Run migration
console.log('\n🚀 Starting schedules migration (v1 → v2)...\n');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be written to Firebase\n');
}

if (!force && !dryRun) {
  console.log('⚠️  This will migrate your schedule data to the new v2 structure.');
  console.log('   The migration is safe (preserves v1 data) but you should:');
  console.log('   1. Backup your Firebase database first');
  console.log('   2. Test in staging environment if possible\n');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));
}

try {
  const result = await migrateSchedulesToV2({ dryRun });

  console.log('\n📋 Migration Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ Migration completed successfully!');

    if (dryRun) {
      console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
    } else {
      console.log('\n📝 Next steps:');
      console.log('   1. Verify data in Firebase Console: /schedules-v2');
      console.log('   2. Deploy application code (version 1.34.0)');
      console.log('   3. Test scheduler functionality');
      console.log('   4. Monitor cron job execution');
      console.log('\n📚 See docs/multi-schedule-migration.md for rollback procedure');
    }

    process.exit(0);
  } else {
    console.error('\n❌ Migration failed:', result.error);
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Migration error:', error);
  console.error(error.stack);
  process.exit(1);
}
