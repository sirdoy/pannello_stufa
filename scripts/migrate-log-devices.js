#!/usr/bin/env node

/**
 * Migrate Log Devices
 *
 * Script per aggiornare i log esistenti in Firebase aggiungendo
 * il campo `device` corretto basandosi sull'azione registrata.
 *
 * Usage:
 *   node scripts/migrate-log-devices.js --dry-run  # Preview changes
 *   node scripts/migrate-log-devices.js            # Apply changes
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local manually
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    console.error(`Environment file not found: ${filePath}`);
    return;
  }
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=');
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(__dirname, '..', '.env.local'));

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Device types
const DEVICE_TYPES = {
  STOVE: 'stove',
  THERMOSTAT: 'thermostat',
  LIGHTS: 'lights',
  SONOS: 'sonos',
};

/**
 * Determine the correct device based on action text
 */
function determineDevice(action, existingDevice) {
  // If device is already set correctly, skip
  if (existingDevice && ['stove', 'thermostat', 'lights', 'sonos'].includes(existingDevice)) {
    return null; // No change needed
  }

  const actionLower = (action || '').toLowerCase();

  // Netatmo/Thermostat patterns
  if (
    actionLower.includes('netatmo') ||
    actionLower.includes('termostato') ||
    actionLower.includes('temperatura stanza') ||
    actionLower.includes('calibra') ||
    actionLower.includes('sincronizzazione stufa') ||
    actionLower.includes('stove_sync') ||
    actionLower.includes('therm') ||
    actionLower.includes('room_temp') ||
    actionLower.includes('set_mode') && actionLower.includes('netatmo')
  ) {
    return DEVICE_TYPES.THERMOSTAT;
  }

  // Hue/Lights patterns
  if (
    actionLower.includes('hue') ||
    actionLower.includes('luce') ||
    actionLower.includes('luci') ||
    actionLower.includes('scena') ||
    actionLower.includes('luminosità') ||
    actionLower.includes('stanza accesa') ||
    actionLower.includes('stanza spenta')
  ) {
    return DEVICE_TYPES.LIGHTS;
  }

  // Sonos patterns
  if (
    actionLower.includes('sonos') ||
    actionLower.includes('spotify') ||
    actionLower.includes('musica') ||
    actionLower.includes('play') ||
    actionLower.includes('pause')
  ) {
    return DEVICE_TYPES.SONOS;
  }

  // Stove patterns (default for most legacy logs)
  if (
    actionLower.includes('stufa') ||
    actionLower.includes('accensione') ||
    actionLower.includes('spegnimento') ||
    actionLower.includes('ventola') ||
    actionLower.includes('ventilazione') ||
    actionLower.includes('potenza') ||
    actionLower.includes('pulizia') ||
    actionLower.includes('scheduler') ||
    actionLower.includes('intervallo') ||
    actionLower.includes('modalità automatica') ||
    actionLower.includes('modalità manuale') ||
    actionLower.includes('semi-manuale') ||
    actionLower.includes('duplicato giorno')
  ) {
    return DEVICE_TYPES.STOVE;
  }

  // If no match and no device, default to null (will show as "Sistema")
  return null;
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  // Try to load from environment variables
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error(
      'Missing Firebase Admin credentials. Please set:\n' +
      '- FIREBASE_ADMIN_PROJECT_ID\n' +
      '- FIREBASE_ADMIN_CLIENT_EMAIL\n' +
      '- FIREBASE_ADMIN_PRIVATE_KEY\n' +
      '- NEXT_PUBLIC_FIREBASE_DATABASE_URL'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL,
  });
}

/**
 * Main migration function
 */
async function migrateLogDevices(dryRun = false) {
  log('\n========================================', 'cyan');
  log('   Log Device Migration Script', 'cyan');
  log('========================================\n', 'cyan');

  if (dryRun) {
    log('🔍 DRY RUN MODE - No changes will be made\n', 'yellow');
  } else {
    log('⚠️  LIVE MODE - Changes will be applied to Firebase\n', 'red');
  }

  try {
    // Initialize Firebase
    initializeFirebase();
    const db = admin.database();

    // Read all logs
    log('📖 Reading logs from Firebase...', 'blue');
    const logsSnapshot = await db.ref('log').once('value');
    const logsData = logsSnapshot.val();

    if (!logsData) {
      log('❌ No logs found in Firebase', 'red');
      return;
    }

    const logEntries = Object.entries(logsData);
    log(`📊 Found ${logEntries.length} total logs\n`, 'blue');

    // Analyze and prepare updates
    const updates = {};
    const stats = {
      total: logEntries.length,
      alreadyCorrect: 0,
      toUpdate: 0,
      byDevice: {
        stove: 0,
        thermostat: 0,
        lights: 0,
        sonos: 0,
        unknown: 0,
      },
    };

    for (const [logId, logEntry] of logEntries) {
      const newDevice = determineDevice(logEntry.action, logEntry.device);

      if (newDevice === null) {
        // Already has correct device or couldn't determine
        if (logEntry.device) {
          stats.alreadyCorrect++;
          stats.byDevice[logEntry.device] = (stats.byDevice[logEntry.device] || 0) + 1;
        } else {
          stats.byDevice.unknown++;
        }
      } else {
        // Needs update
        stats.toUpdate++;
        stats.byDevice[newDevice]++;
        updates[`log/${logId}/device`] = newDevice;

        if (dryRun) {
          log(`  📝 ${logId}: "${logEntry.action}" → ${newDevice}`, 'yellow');
        }
      }
    }

    // Print stats
    log('\n📊 Migration Statistics:', 'cyan');
    log(`   Total logs: ${stats.total}`, 'reset');
    log(`   Already correct: ${stats.alreadyCorrect}`, 'green');
    log(`   To update: ${stats.toUpdate}`, 'yellow');
    log('\n   By device:', 'cyan');
    log(`   🔥 Stove: ${stats.byDevice.stove}`, 'reset');
    log(`   🌡️  Thermostat: ${stats.byDevice.thermostat}`, 'reset');
    log(`   💡 Lights: ${stats.byDevice.lights}`, 'reset');
    log(`   🎵 Sonos: ${stats.byDevice.sonos}`, 'reset');
    log(`   ❓ Unknown/Sistema: ${stats.byDevice.unknown}`, 'reset');

    // Apply updates
    if (!dryRun && stats.toUpdate > 0) {
      log(`\n🚀 Applying ${stats.toUpdate} updates to Firebase...`, 'blue');
      await db.ref().update(updates);
      log('✅ Migration completed successfully!', 'green');
    } else if (dryRun && stats.toUpdate > 0) {
      log(`\n💡 Run without --dry-run to apply ${stats.toUpdate} updates`, 'yellow');
    } else {
      log('\n✅ No updates needed - all logs already have correct devices', 'green');
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

// Run migration
migrateLogDevices(dryRun).then(() => {
  process.exit(0);
});
