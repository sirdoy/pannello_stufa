#!/usr/bin/env node

/**
 * Test Firebase Operations - READ e WRITE
 *
 * Testa:
 * 1. Client SDK READ operations
 * 2. Admin SDK WRITE operations (simulate API routes)
 * 3. maintenanceServiceAdmin functions
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

// Colors for output
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

// Initialize Client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Test results
const results = {
  clientRead: [],
  adminWrite: [],
};

// ============================================
// CLIENT SDK READ TESTS
// ============================================

async function testClientRead(path, description) {
  try {
    log(`\n📖 Testing CLIENT READ: ${description}`, 'cyan');
    log(`   Path: ${path}`, 'blue');

    const snapshot = await get(ref(db, path));

    if (snapshot.exists()) {
      const data = snapshot.val();
      log(`   ✅ SUCCESS - Data found`, 'green');
      log(`   Sample: ${JSON.stringify(data).substring(0, 100)}...`, 'blue');
      results.clientRead.push({ path, success: true, description });
      return true;
    } else {
      log(`   ⚠️  No data at path (this is OK if path is empty)`, 'yellow');
      results.clientRead.push({ path, success: true, description, empty: true });
      return true;
    }
  } catch (error) {
    log(`   ❌ FAILED: ${error.message}`, 'red');
    results.clientRead.push({ path, success: false, description, error: error.message });
    return false;
  }
}

// ============================================
// ADMIN SDK WRITE TESTS (simulate API route)
// ============================================

async function testAdminWrite(operation, description) {
  try {
    log(`\n✏️  Testing ADMIN SDK WRITE: ${description}`, 'cyan');

    // Dynamically import Admin SDK (server-side only)
    const { adminDbGet, adminDbSet, adminDbUpdate, adminDbPush } = await import('../lib/firebaseAdmin.js');

    let result;

    switch (operation.type) {
      case 'get':
        result = await adminDbGet(operation.path);
        log(`   ✅ adminDbGet SUCCESS`, 'green');
        log(`   Data: ${JSON.stringify(result).substring(0, 100)}...`, 'blue');
        break;

      case 'set':
        await adminDbSet(operation.path, operation.data);
        log(`   ✅ adminDbSet SUCCESS`, 'green');
        break;

      case 'update':
        await adminDbUpdate(operation.path, operation.data);
        log(`   ✅ adminDbUpdate SUCCESS`, 'green');
        break;

      case 'push':
        const key = await adminDbPush(operation.path, operation.data);
        log(`   ✅ adminDbPush SUCCESS - Key: ${key}`, 'green');
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    results.adminWrite.push({ operation: operation.type, success: true, description });
    return true;
  } catch (error) {
    log(`   ❌ FAILED: ${error.message}`, 'red');
    log(`   Stack: ${error.stack}`, 'yellow');
    results.adminWrite.push({ operation: operation.type, success: false, description, error: error.message });
    return false;
  }
}

// ============================================
// MAINTENANCE SERVICE ADMIN TESTS
// ============================================

async function testMaintenanceServiceAdmin() {
  try {
    log(`\n🔧 Testing maintenanceServiceAdmin functions`, 'cyan');

    const { canIgnite } = await import('../lib/maintenanceServiceAdmin.js');

    // Test canIgnite
    log(`   Testing canIgnite()...`, 'blue');
    const allowed = await canIgnite();
    log(`   ✅ canIgnite() returned: ${allowed}`, 'green');

    results.adminWrite.push({
      operation: 'maintenanceServiceAdmin',
      success: true,
      description: 'maintenanceServiceAdmin.canIgnite()'
    });

    return true;
  } catch (error) {
    log(`   ❌ FAILED: ${error.message}`, 'red');
    log(`   Stack: ${error.stack}`, 'yellow');
    results.adminWrite.push({
      operation: 'maintenanceServiceAdmin',
      success: false,
      description: 'maintenanceServiceAdmin functions',
      error: error.message
    });
    return false;
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  log('\n🧪 Firebase Operations Test Suite\n', 'cyan');
  log('=' .repeat(60), 'blue');

  // ============================================
  // PART 1: CLIENT SDK READ TESTS
  // ============================================
  log('\n\n📚 PART 1: CLIENT SDK READ OPERATIONS', 'cyan');
  log('=' .repeat(60), 'blue');
  log('Testing if client can READ public data...', 'blue');

  await testClientRead('cronHealth/lastCall', 'Cron health timestamp');
  await testClientRead('stoveScheduler/mode', 'Scheduler mode');
  await testClientRead('maintenance', 'Maintenance data');
  await testClientRead('log', 'User action logs');
  await testClientRead('errors', 'Error logs');
  await testClientRead('changelog', 'Version history');

  // ============================================
  // PART 2: ADMIN SDK WRITE TESTS
  // ============================================
  log('\n\n📚 PART 2: ADMIN SDK WRITE OPERATIONS', 'cyan');
  log('=' .repeat(60), 'blue');
  log('Testing if Admin SDK can WRITE (simulating API routes)...', 'blue');

  // Test GET
  await testAdminWrite(
    { type: 'get', path: 'maintenance' },
    'Admin SDK GET maintenance data'
  );

  // Test UPDATE (safe operation - just updates lastUpdatedAt)
  await testAdminWrite(
    {
      type: 'update',
      path: 'maintenance',
      data: {
        _testTimestamp: new Date().toISOString()
      }
    },
    'Admin SDK UPDATE test field'
  );

  // Test maintenanceServiceAdmin
  await testMaintenanceServiceAdmin();

  // ============================================
  // SUMMARY
  // ============================================
  log('\n\n📊 TEST SUMMARY', 'cyan');
  log('=' .repeat(60), 'blue');

  const clientReadSuccess = results.clientRead.filter(r => r.success).length;
  const clientReadTotal = results.clientRead.length;
  const clientReadFailed = clientReadTotal - clientReadSuccess;

  const adminWriteSuccess = results.adminWrite.filter(r => r.success).length;
  const adminWriteTotal = results.adminWrite.length;
  const adminWriteFailed = adminWriteTotal - adminWriteSuccess;

  log(`\n📖 Client SDK READ Tests:`, 'cyan');
  log(`   ✅ Passed: ${clientReadSuccess}/${clientReadTotal}`, clientReadFailed === 0 ? 'green' : 'yellow');
  if (clientReadFailed > 0) {
    log(`   ❌ Failed: ${clientReadFailed}`, 'red');
  }

  log(`\n✏️  Admin SDK WRITE Tests:`, 'cyan');
  log(`   ✅ Passed: ${adminWriteSuccess}/${adminWriteTotal}`, adminWriteFailed === 0 ? 'green' : 'yellow');
  if (adminWriteFailed > 0) {
    log(`   ❌ Failed: ${adminWriteFailed}`, 'red');
  }

  // Overall result
  const totalTests = clientReadTotal + adminWriteTotal;
  const totalSuccess = clientReadSuccess + adminWriteSuccess;
  const totalFailed = totalTests - totalSuccess;

  log(`\n🎯 OVERALL RESULT:`, 'cyan');
  if (totalFailed === 0) {
    log(`   ✅ ALL TESTS PASSED (${totalSuccess}/${totalTests})`, 'green');
    log(`\n✨ Firebase operations are working correctly!\n`, 'green');
    process.exit(0);
  } else {
    log(`   ❌ SOME TESTS FAILED: ${totalSuccess}/${totalTests} passed, ${totalFailed} failed`, 'red');
    log(`\n⚠️  Please review failed tests above.\n`, 'yellow');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log('\n💥 Fatal error during tests:', 'red');
  console.error(error);
  process.exit(1);
});
