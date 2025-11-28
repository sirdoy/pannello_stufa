#!/usr/bin/env node

/**
 * Test Script per Firebase Security Rules
 *
 * Testa vari scenari di accesso per verificare che le rules siano configurate correttamente.
 *
 * Usage:
 *   node scripts/test-firebase-rules.js
 *
 * IMPORTANTE: Questo script testa dal client-side (NON Admin SDK)
 * per verificare che le protezioni siano effettive.
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, push } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRead(path, shouldSucceed) {
  try {
    const snapshot = await get(ref(db, path));
    if (shouldSucceed) {
      log(`✅ READ ${path}: SUCCESS (expected)`, 'green');
      return true;
    } else {
      log(`❌ READ ${path}: SUCCESS (should have been denied!)`, 'red');
      return false;
    }
  } catch (error) {
    if (!shouldSucceed && error.code === 'PERMISSION_DENIED') {
      log(`✅ READ ${path}: DENIED (expected)`, 'green');
      return true;
    } else if (shouldSucceed) {
      log(`❌ READ ${path}: DENIED (should have succeeded!)`, 'red');
      log(`   Error: ${error.message}`, 'yellow');
      return false;
    } else {
      log(`❌ READ ${path}: Unexpected error`, 'red');
      log(`   Error: ${error.message}`, 'yellow');
      return false;
    }
  }
}

async function testWrite(path, data, shouldSucceed) {
  try {
    await set(ref(db, path), data);
    if (shouldSucceed) {
      log(`✅ WRITE ${path}: SUCCESS (expected)`, 'green');
      // Cleanup
      await set(ref(db, path), null);
      return true;
    } else {
      log(`❌ WRITE ${path}: SUCCESS (should have been denied!)`, 'red');
      // Cleanup malicious write
      await set(ref(db, path), null);
      return false;
    }
  } catch (error) {
    if (!shouldSucceed && error.code === 'PERMISSION_DENIED') {
      log(`✅ WRITE ${path}: DENIED (expected)`, 'green');
      return true;
    } else if (shouldSucceed) {
      log(`❌ WRITE ${path}: DENIED (should have succeeded!)`, 'red');
      log(`   Error: ${error.message}`, 'yellow');
      return false;
    } else {
      log(`❌ WRITE ${path}: Unexpected error`, 'red');
      log(`   Error: ${error.message}`, 'yellow');
      return false;
    }
  }
}

async function runTests() {
  log('\n🧪 Testing Firebase Security Rules\n', 'cyan');

  const results = [];

  // ============================================
  // PUBLIC READ TESTS (should succeed)
  // ============================================
  log('📖 Testing PUBLIC READ access...', 'blue');

  results.push(await testRead('cronHealth/lastCall', true));
  results.push(await testRead('stoveScheduler/mode', true));
  results.push(await testRead('stoveScheduler/monday', true));
  results.push(await testRead('maintenance', true));
  results.push(await testRead('log', true));
  results.push(await testRead('errors', true));
  results.push(await testRead('changelog', true));
  results.push(await testRead('netatmo/currentStatus', true));
  results.push(await testRead('netatmo/topology', true));
  results.push(await testRead('hue/lights', true));

  // ============================================
  // PRIVATE READ TESTS (should fail)
  // ============================================
  log('\n🔒 Testing PRIVATE READ access (should be denied)...', 'blue');

  results.push(await testRead('users/auth0|test/fcmTokens', false));
  results.push(await testRead('users/auth0|test/notificationPreferences', false));
  results.push(await testRead('devicePreferences/auth0|test', false));
  results.push(await testRead('netatmo/refresh_token', false));
  results.push(await testRead('netatmo/home_id', false));
  results.push(await testRead('hue/refresh_token', false));
  results.push(await testRead('hue/username', false));
  results.push(await testRead('dev/netatmo/refresh_token', false));

  // ============================================
  // WRITE TESTS (all should fail)
  // ============================================
  log('\n✏️ Testing WRITE access (all should be denied)...', 'blue');

  results.push(await testWrite('cronHealth/lastCall', new Date().toISOString(), false));
  results.push(await testWrite('stoveScheduler/mode/enabled', true, false));
  results.push(await testWrite('maintenance/currentHours', 999, false));
  results.push(await testWrite('users/auth0|test/fcmTokens/test', { token: 'malicious' }, false));
  results.push(await testWrite('netatmo/refresh_token', 'malicious-token', false));
  results.push(await testWrite('test/malicious', 'data', false));

  // ============================================
  // SUMMARY
  // ============================================
  log('\n📊 Test Summary\n', 'cyan');

  const passed = results.filter(r => r).length;
  const total = results.length;
  const failed = total - passed;

  if (failed === 0) {
    log(`✅ All tests passed! (${passed}/${total})`, 'green');
    log('\n🎉 Firebase Security Rules are correctly configured!\n', 'green');
    process.exit(0);
  } else {
    log(`❌ Some tests failed: ${passed}/${total} passed, ${failed} failed`, 'red');
    log('\n⚠️ Please review Firebase Security Rules configuration.\n', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log('\n💥 Fatal error during tests:', 'red');
  console.error(error);
  process.exit(1);
});
