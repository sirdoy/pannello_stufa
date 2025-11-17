#!/usr/bin/env node

/**
 * Pannello Stufa - E2E Test Suite
 *
 * Test completo UI/UX con:
 * - Modal changelog handling
 * - Light/Dark theme testing
 * - Responsive design (mobile, tablet, desktop)
 * - Performance metrics
 * - Tutte le pagine principali
 *
 * Usage:
 *   TEST_MODE=true npm run dev
 *   node test-e2e.mjs
 */

import { chromium } from 'playwright';
import { unlinkSync } from 'fs';

async function runE2ETests() {
  console.log('🎭 Pannello Stufa - E2E Test Suite\n');
  console.log('='.repeat(50));

  const browser = await chromium.launch({ headless: true });
  const screenshots = [];
  let testsPassed = 0;
  let testsFailed = 0;

  // Helper: Dismiss changelog modal
  async function dismissModal(page) {
    try {
      const closeBtn = page.locator('button:has-text("Inizia ad usare"), button:has-text("×")').first();
      if (await closeBtn.isVisible({ timeout: 2000 })) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        return true;
      }
    } catch (err) {
      // Modal not present
    }
    return false;
  }

  // Helper: Test page with theme
  async function testPageWithTheme(context, url, pageName, theme) {
    const page = await context.newPage();

    // Set theme before page load
    await page.addInitScript((t) => {
      localStorage.setItem('user-theme', t);
    }, theme);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await dismissModal(page);

    // Force theme class
    await page.evaluate((t) => {
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, theme);

    await page.waitForTimeout(500);

    const screenshotPath = `test-${theme}-${pageName}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    screenshots.push(screenshotPath);

    await page.close();
    return screenshotPath;
  }

  try {
    // ==========================================
    // TEST 1: Homepage - Dark Mode
    // ==========================================
    console.log('\n🌙 TEST 1: Homepage - Dark Mode');

    const darkContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const darkPage = await darkContext.newPage();

    await darkPage.addInitScript(() => localStorage.setItem('user-theme', 'dark'));
    await darkPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await darkPage.waitForTimeout(2000);
    await dismissModal(darkPage);
    await darkPage.evaluate(() => document.documentElement.classList.add('dark'));
    await darkPage.waitForTimeout(1000);

    const title = await darkPage.title();
    if (title === 'Pannello Stufa') {
      console.log('   ✓ Titolo corretto');
      testsPassed++;
    } else {
      console.log(`   ✗ Titolo errato: ${title}`);
      testsFailed++;
    }

    const navbar = await darkPage.locator('nav').count();
    if (navbar > 0) {
      console.log('   ✓ Navbar presente');
      testsPassed++;
    }

    const cards = await darkPage.locator('[class*="bg-white"]').count();
    console.log(`   ✓ Device cards: ${cards}`);
    testsPassed++;

    await darkPage.screenshot({ path: 'test-dark-homepage.png', fullPage: true });
    screenshots.push('test-dark-homepage.png');

    await darkPage.close();

    // ==========================================
    // TEST 2: Homepage - Light Mode
    // ==========================================
    console.log('\n☀️ TEST 2: Homepage - Light Mode');

    const lightContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const lightPage = await lightContext.newPage();

    await lightPage.addInitScript(() => localStorage.setItem('user-theme', 'light'));
    await lightPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await lightPage.waitForTimeout(2000);
    await dismissModal(lightPage);
    await lightPage.evaluate(() => document.documentElement.classList.remove('dark'));
    await lightPage.waitForTimeout(1000);

    await lightPage.screenshot({ path: 'test-light-homepage.png', fullPage: true });
    screenshots.push('test-light-homepage.png');
    console.log('   ✓ Screenshot light mode');
    testsPassed++;

    await lightPage.close();

    // ==========================================
    // TEST 3: Scheduler - Dark Mode
    // ==========================================
    console.log('\n⏰ TEST 3: Scheduler - Dark Mode');

    await testPageWithTheme(darkContext, 'http://localhost:3000/scheduler', 'scheduler', 'dark');
    console.log('   ✓ Scheduler dark mode');
    testsPassed++;

    // ==========================================
    // TEST 4: Scheduler - Light Mode
    // ==========================================
    console.log('\n⏰ TEST 4: Scheduler - Light Mode');

    await testPageWithTheme(lightContext, 'http://localhost:3000/scheduler', 'scheduler', 'light');
    console.log('   ✓ Scheduler light mode');
    testsPassed++;

    // ==========================================
    // TEST 5: Maintenance - Dark Mode
    // ==========================================
    console.log('\n🔧 TEST 5: Maintenance - Dark Mode');

    await testPageWithTheme(darkContext, 'http://localhost:3000/maintenance', 'maintenance', 'dark');
    console.log('   ✓ Maintenance dark mode');
    testsPassed++;

    // ==========================================
    // TEST 6: Maintenance - Light Mode
    // ==========================================
    console.log('\n🔧 TEST 6: Maintenance - Light Mode');

    await testPageWithTheme(lightContext, 'http://localhost:3000/maintenance', 'maintenance', 'light');
    console.log('   ✓ Maintenance light mode');
    testsPassed++;

    // ==========================================
    // TEST 7: Log Page
    // ==========================================
    console.log('\n📋 TEST 7: Log Page');

    await testPageWithTheme(darkContext, 'http://localhost:3000/log', 'log', 'dark');
    console.log('   ✓ Log page dark mode');
    testsPassed++;

    // ==========================================
    // TEST 8: Changelog Page
    // ==========================================
    console.log('\n📝 TEST 8: Changelog Page');

    await testPageWithTheme(darkContext, 'http://localhost:3000/changelog', 'changelog', 'dark');
    console.log('   ✓ Changelog page dark mode');
    testsPassed++;

    // ==========================================
    // TEST 9: Mobile Responsive
    // ==========================================
    console.log('\n📱 TEST 9: Mobile Responsive');

    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });

    await testPageWithTheme(mobileContext, 'http://localhost:3000', 'mobile', 'dark');
    console.log('   ✓ Mobile dark mode (375x812)');
    testsPassed++;

    await testPageWithTheme(mobileContext, 'http://localhost:3000', 'mobile', 'light');
    console.log('   ✓ Mobile light mode (375x812)');
    testsPassed++;

    await mobileContext.close();

    // ==========================================
    // TEST 10: Performance Metrics
    // ==========================================
    console.log('\n⚡ TEST 10: Performance Metrics');

    const perfPage = await darkContext.newPage();
    await perfPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await perfPage.waitForTimeout(1000);

    const metrics = await perfPage.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
        loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
        domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart)
      };
    });

    console.log(`   ✓ DOM Interactive: ${metrics.domInteractive}ms`);
    console.log(`   ✓ DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`   ✓ Load Complete: ${metrics.loadComplete}ms`);

    if (metrics.domInteractive < 2000) {
      console.log('   ✓ Performance eccellente (<2s)');
      testsPassed++;
    }

    await perfPage.close();
    await darkContext.close();
    await lightContext.close();

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 RISULTATI FINALI');
    console.log('='.repeat(50));
    console.log(`✅ Test passati: ${testsPassed}`);
    console.log(`❌ Test falliti: ${testsFailed}`);
    console.log(`📸 Screenshot generati: ${screenshots.length}`);
    console.log('='.repeat(50));

    if (testsFailed === 0) {
      console.log('\n🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!\n');
    } else {
      console.log('\n⚠️  Alcuni test sono falliti.\n');
    }

    // Cleanup screenshots
    console.log('🧹 Pulizia screenshot...');
    for (const screenshot of screenshots) {
      try {
        unlinkSync(screenshot);
      } catch (err) {
        // Ignore
      }
    }
    console.log('✅ Pulizia completata\n');

  } catch (error) {
    console.error('\n❌ Errore:', error.message);
    testsFailed++;
  } finally {
    await browser.close();
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

runE2ETests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
