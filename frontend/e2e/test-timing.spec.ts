import { test } from '@playwright/test';

test('Check component initialization timing vs button render', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');

  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('[BuildDetails]') || text.includes('[AppComponent]')) {
      console.log(text);
    }
  });

  // Open modal
  console.log('\n=== Opening modal ===');
  const detailsBtn = page.locator('button:has-text("Details")').first();
  await detailsBtn.click({ timeout: 10000 });

  // Wait for modal to appear
  await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });
  console.log('Modal visible');

  // Check initialization logs
  await page.waitForTimeout(500);
  console.log('\n=== Initialization logs ===');
  consoleLogs
    .filter((log) => log.includes('[BuildDetails]') || log.includes('[AppComponent]'))
    .forEach((log) => console.log(log));

  // Try to click close button and see if handler logs appear
  console.log('\n=== Clicking close button ===');
  const closeBtn = page.locator('button.btn-circle').first();
  await closeBtn.click({ timeout: 5000 });
  await page.waitForTimeout(1000);

  console.log('\n=== All logs after button click ===');
  consoleLogs
    .filter((log) => log.includes('[BuildDetails]') || log.includes('[AppComponent]'))
    .forEach((log) => console.log(log));

  console.log('\n=== Analysis ===');
  const initLogs = consoleLogs.filter((log) => log.includes('Component initialized'));
  const handlerLogs = consoleLogs.filter((log) => log.includes('handleClose'));

  if (initLogs.length > 0 && handlerLogs.length === 0) {
    console.log('❌ Component initialized but handleClose() NEVER called');
  } else if (handlerLogs.length > 0) {
    console.log('✅ handleClose() was called');
  }
});
