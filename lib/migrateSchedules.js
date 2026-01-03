/**
 * Migration Script: v1 → v2 Schedule Structure
 *
 * Migrates from single schedule at /stoveScheduler to multi-schedule at /schedules-v2
 *
 * SAFETY: This script is idempotent - safe to run multiple times
 * - Checks if v2 already exists (skips if yes)
 * - Never deletes v1 data (read-only)
 * - Verifies data integrity after migration
 */

import { adminDbGet, adminDbSet } from './firebaseAdmin.js';

const DAYS_OF_WEEK = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

/**
 * Main migration function
 * @param {Object} options - Migration options
 * @param {boolean} options.dryRun - If true, simulates migration without writing to Firebase
 * @returns {Promise<Object>} Migration result with status and details
 */
export async function migrateSchedulesToV2({ dryRun = false } = {}) {
  console.log('🔄 Starting migration: /stoveScheduler → /schedules-v2');
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be written to Firebase');
  }

  try {
    // Step 1: Check if v2 already exists
    const v2Exists = await adminDbGet('schedules-v2');
    if (v2Exists) {
      console.log('✅ Migration already completed - /schedules-v2 exists');
      return {
        success: true,
        alreadyMigrated: true,
        message: 'Migration already completed'
      };
    }

    // Step 2: Read all v1 data (read-only, never delete)
    console.log('📖 Reading v1 data from /stoveScheduler...');
    const v1Data = await adminDbGet('stoveScheduler');

    if (!v1Data) {
      console.log('⚠️  No v1 data found - creating fresh v2 structure');
      // Create minimal v2 structure
      await createFreshV2Structure(dryRun);
      return {
        success: true,
        dryRun,
        message: dryRun
          ? 'Would create fresh v2 structure (no v1 data to migrate)'
          : 'Created fresh v2 structure (no v1 data to migrate)'
      };
    }

    // Step 3: Extract slots for "default" schedule
    console.log('📦 Extracting schedule slots...');
    const defaultSlots = {};
    let totalIntervals = 0;

    for (const day of DAYS_OF_WEEK) {
      if (v1Data[day] && Array.isArray(v1Data[day])) {
        defaultSlots[day] = v1Data[day];
        totalIntervals += v1Data[day].length;
      } else {
        defaultSlots[day] = [];
      }
    }

    console.log(`✅ Extracted ${totalIntervals} intervals across ${DAYS_OF_WEEK.length} days`);

    // Step 4: Create default schedule object
    const now = new Date().toISOString();
    const defaultSchedule = {
      name: 'Default',
      enabled: true,
      slots: defaultSlots,
      createdAt: now,
      updatedAt: now
    };

    // Step 5: Create v2 structure
    if (dryRun) {
      console.log('💾 [DRY RUN] Would create /schedules-v2 structure...');
      console.log('  - schedules-v2/schedules/default:', JSON.stringify(defaultSchedule, null, 2));
      console.log('  - schedules-v2/activeScheduleId: "default"');
    } else {
      console.log('💾 Creating /schedules-v2 structure...');
      await adminDbSet('schedules-v2/schedules/default', defaultSchedule);
      await adminDbSet('schedules-v2/activeScheduleId', 'default');
    }

    // Step 6: Migrate mode settings
    if (v1Data.mode) {
      if (dryRun) {
        console.log('⚙️  [DRY RUN] Would migrate mode settings:', v1Data.mode);
      } else {
        console.log('⚙️  Migrating mode settings...');
        await adminDbSet('schedules-v2/mode', v1Data.mode);
      }
    } else {
      // Create default mode
      const defaultMode = {
        enabled: false,
        semiManual: false,
        lastUpdated: now
      };
      if (dryRun) {
        console.log('⚙️  [DRY RUN] Would create default mode:', defaultMode);
      } else {
        await adminDbSet('schedules-v2/mode', defaultMode);
      }
    }

    // Step 7: Verify integrity (skip in dry-run)
    if (!dryRun) {
      console.log('🔍 Verifying migration integrity...');
      const verification = await verifyMigration(defaultSlots, v1Data.mode);

      if (!verification.success) {
        console.error('❌ Migration verification failed:', verification.errors);
        return {
          success: false,
          message: 'Migration verification failed',
          errors: verification.errors
        };
      }
    } else {
      console.log('🔍 [DRY RUN] Skipping verification (no data written)');
    }

    if (dryRun) {
      console.log('✅ Dry run completed successfully!');
      console.log(`📊 Would migrate ${totalIntervals} intervals to /schedules-v2/schedules/default`);
      console.log(`🎯 Would set active schedule: default`);
    } else {
      console.log('✅ Migration completed successfully!');
      console.log(`📊 Migrated ${totalIntervals} intervals to /schedules-v2/schedules/default`);
      console.log(`🎯 Active schedule: default`);
    }

    return {
      success: true,
      dryRun,
      message: dryRun ? 'Dry run completed successfully' : 'Migration completed successfully',
      stats: {
        totalIntervals,
        daysWithIntervals: DAYS_OF_WEEK.filter(day => defaultSlots[day].length > 0).length,
        modeMigrated: !!v1Data.mode
      }
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      message: 'Migration failed',
      error: error.message
    };
  }
}

/**
 * Create fresh v2 structure when no v1 data exists
 * @param {boolean} dryRun - If true, only logs what would be created
 */
async function createFreshV2Structure(dryRun = false) {
  const now = new Date().toISOString();
  const emptySlots = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});

  const defaultSchedule = {
    name: 'Default',
    enabled: true,
    slots: emptySlots,
    createdAt: now,
    updatedAt: now
  };

  const defaultMode = {
    enabled: false,
    semiManual: false,
    lastUpdated: now
  };

  if (dryRun) {
    console.log('[DRY RUN] Would create:');
    console.log('  - schedules-v2/schedules/default:', JSON.stringify(defaultSchedule, null, 2));
    console.log('  - schedules-v2/activeScheduleId: "default"');
    console.log('  - schedules-v2/mode:', JSON.stringify(defaultMode, null, 2));
  } else {
    await adminDbSet('schedules-v2/schedules/default', defaultSchedule);
    await adminDbSet('schedules-v2/activeScheduleId', 'default');
    await adminDbSet('schedules-v2/mode', defaultMode);
  }
}

/**
 * Verify migration data integrity
 * @param {Object} originalSlots - Original slots from v1
 * @param {Object} originalMode - Original mode from v1
 * @returns {Promise<Object>} Verification result
 */
async function verifyMigration(originalSlots, originalMode) {
  const errors = [];

  try {
    // Check default schedule exists
    const defaultSchedule = await adminDbGet('schedules-v2/schedules/default');
    if (!defaultSchedule) {
      errors.push('Default schedule not found in v2');
      return { success: false, errors };
    }

    // Check activeScheduleId
    const activeId = await adminDbGet('schedules-v2/activeScheduleId');
    if (activeId !== 'default') {
      errors.push(`Active schedule ID mismatch: expected 'default', got '${activeId}'`);
    }

    // Verify slots integrity
    for (const day of DAYS_OF_WEEK) {
      const v1Intervals = originalSlots[day] || [];
      const v2Intervals = defaultSchedule.slots[day] || [];

      if (v1Intervals.length !== v2Intervals.length) {
        errors.push(`Day ${day}: interval count mismatch (v1: ${v1Intervals.length}, v2: ${v2Intervals.length})`);
      }
    }

    // Verify mode if it existed
    if (originalMode) {
      const v2Mode = await adminDbGet('schedules-v2/mode');
      if (!v2Mode) {
        errors.push('Mode not migrated to v2');
      } else if (v2Mode.enabled !== originalMode.enabled) {
        errors.push('Mode.enabled mismatch');
      }
    }

    return {
      success: errors.length === 0,
      errors
    };

  } catch (error) {
    errors.push(`Verification exception: ${error.message}`);
    return { success: false, errors };
  }
}

/**
 * CLI execution support
 * Usage: node -e "require('./lib/migrateSchedules').runMigration()"
 */
export async function runMigration() {
  const result = await migrateSchedulesToV2();
  console.log('\n📋 Migration Result:', JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}
