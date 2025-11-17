import { chromium } from 'playwright';

async function testApp() {
  console.log('🎭 Avvio test Playwright...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test 1: Navigazione homepage
    console.log('📍 Test 1: Navigazione homepage');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    console.log(`   ✓ Titolo pagina: "${title}"`);

    // Test 2: Screenshot homepage
    console.log('\n📸 Test 2: Screenshot homepage');
    await page.screenshot({ path: 'screenshot-homepage.png', fullPage: true });
    console.log('   ✓ Screenshot salvato: screenshot-homepage.png');

    // Test 3: Verifica presenza elementi UI
    console.log('\n🔍 Test 3: Verifica elementi UI');

    // Verifica navbar
    const navbar = await page.locator('nav').count();
    console.log(`   ${navbar > 0 ? '✓' : '✗'} Navbar presente: ${navbar > 0}`);

    // Verifica cards dispositivi
    const cards = await page.locator('[class*="Card"]').count();
    console.log(`   ✓ Cards trovate: ${cards}`);

    // Test 4: Dimensioni viewport
    console.log('\n📱 Test 4: Test responsive');

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'screenshot-desktop.png', fullPage: true });
    console.log('   ✓ Screenshot desktop: screenshot-desktop.png');

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: 'screenshot-mobile.png', fullPage: true });
    console.log('   ✓ Screenshot mobile: screenshot-mobile.png');

    // Test 5: Pagine secondarie
    console.log('\n📄 Test 5: Navigazione pagine');

    const pages = [
      { url: '/scheduler', name: 'Scheduler' },
      { url: '/maintenance', name: 'Maintenance' },
      { url: '/log', name: 'Log' },
      { url: '/changelog', name: 'Changelog' }
    ];

    for (const testPage of pages) {
      await page.goto(`http://localhost:3000${testPage.url}`);
      await page.waitForLoadState('networkidle');
      const pageTitle = await page.title();
      console.log(`   ✓ ${testPage.name}: "${pageTitle}"`);
    }

    // Test 6: Performance metrics
    console.log('\n⚡ Test 6: Performance metrics');
    await page.goto('http://localhost:3000');
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
        loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
        domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart)
      };
    });
    console.log(`   ✓ DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`   ✓ Load Complete: ${metrics.loadComplete}ms`);
    console.log(`   ✓ DOM Interactive: ${metrics.domInteractive}ms`);

    console.log('\n✅ Tutti i test completati con successo!\n');

  } catch (error) {
    console.error('\n❌ Errore durante i test:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testApp().catch(console.error);
