import { test, expect } from '@playwright/test';

/**
 * MODAL CLOSE DEBUG TEST
 * Captures console logs to trace callback execution chain
 */
test.describe('Modal Close Callback Chain Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
  });

  test('trace close button click callback chain', async ({ page }) => {
    const consoleLogs: Array<{ type: string; message: string }> = [];

    // Capture all console messages
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        message: msg.text(),
      });
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Capture errors
    page.on('pageerror', (err) => {
      consoleLogs.push({
        type: 'error',
        message: err.message,
      });
      console.error('[ERROR]', err.message);
    });

    // Open modal
    console.log('\n=== OPENING MODAL ===');
    const detailsBtn = page.locator('button:has-text("Details")').first();
    await detailsBtn.click({ timeout: 10000 });
    await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

    console.log('Modal opened, waiting for render...');
    await page.waitForTimeout(300);

    // Click close button
    console.log('\n=== CLICKING CLOSE BUTTON ===');
    const closeBtn = page.locator('button[aria-label*="close"], button[aria-label*="Close"], :has-text("✕")').first();
    const isVisible = await closeBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await closeBtn.click({ timeout: 5000 });
      console.log('Close button clicked, waiting for callbacks...');
      await page.waitForTimeout(1000);

      // Check modal state
      console.log('\n=== CHECKING MODAL STATE ===');
      const modalStillOpen = await page.locator('.modal-box').isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`Modal still visible: ${modalStillOpen}`);

      // Extract relevant console logs
      const buildDetailsLogs = consoleLogs.filter((log) => log.message.includes('[BuildDetails]'));
      const appComponentLogs = consoleLogs.filter((log) => log.message.includes('[AppComponent]'));

      console.log('\n=== BUILD DETAILS LOGS ===');
      buildDetailsLogs.forEach((log) => console.log(log.message));

      console.log('\n=== APP COMPONENT LOGS ===');
      appComponentLogs.forEach((log) => console.log(log.message));

      console.log('\n=== CALLBACK CHAIN ANALYSIS ===');
      if (buildDetailsLogs.length > 0 && appComponentLogs.length === 0) {
        console.log('❌ ISSUE FOUND: BuildDetails handler called but AppComponent closeModal NOT invoked');
        console.log('   Likely cause: onClose callback not properly bound or invoked');
      } else if (buildDetailsLogs.length > 0 && appComponentLogs.length > 0) {
        console.log('✅ Callback chain working: Both BuildDetails and AppComponent logs present');
      } else if (buildDetailsLogs.length === 0) {
        console.log('❌ ISSUE: BuildDetails handler not called at all');
      }

      // Assertion
      expect(buildDetailsLogs.length).toBeGreaterThan(0);
    }
  });

  test('trace escape key callback chain', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Open modal
    console.log('\n=== OPENING MODAL FOR ESCAPE TEST ===');
    const detailsBtn = page.locator('button:has-text("Details")').first();
    await detailsBtn.click({ timeout: 10000 });
    await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(300);

    // Press Escape
    console.log('\n=== PRESSING ESCAPE KEY ===');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    console.log('\n=== ESCAPE KEY LOGS ===');
    consoleLogs
      .filter((log) => log.includes('[') && log.includes(']'))
      .forEach((log) => console.log(log));

    // Check if escape key handler fired
    const escapeHandlerCalled = consoleLogs.some((log) => log.includes('Escape key pressed'));
    const closeModalCalled = consoleLogs.some((log) => log.includes('closeModal called'));

    if (!escapeHandlerCalled) {
      console.log('❌ Escape key handler NOT called');
    }
    if (!closeModalCalled) {
      console.log('❌ AppComponent closeModal NOT called after Escape');
    }
  });
});
