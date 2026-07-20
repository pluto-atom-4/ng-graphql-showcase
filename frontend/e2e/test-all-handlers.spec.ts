import { test } from '@playwright/test';

test('Test if ANY click handlers work in BuildDetailsComponent', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');

  // Open modal
  const detailsBtn = page.locator('button:has-text("Details")').first();
  await detailsBtn.click({ timeout: 10000 });
  await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);

  console.log('\n=== Testing Tab Button Clicks ===');

  // Test tab buttons (should work if OnPush change detection is fine)
  const tabButtons = await page.locator('.tabs .tab').count();
  console.log(`Found ${tabButtons} tab buttons`);

  if (tabButtons > 1) {
    // Get initial active tab
    const initialTab = await page.locator('.tab-active').first().evaluate((el) => el.textContent);
    console.log(`Initial active tab: ${initialTab}`);

    // Click second tab
    const secondTab = page.locator('.tabs .tab').nth(1);
    await secondTab.click({ timeout: 5000 });
    await page.waitForTimeout(300);

    // Check if tab changed
    const newTab = await page.locator('.tab-active').first().evaluate((el) => el.textContent);
    console.log(`After click, active tab: ${newTab}`);

    if (initialTab !== newTab) {
      console.log('✅ Tab click handler WORKS - OnPush change detection is fine');
    } else {
      console.log('❌ Tab click handler DOES NOT work - OnPush issue?');
    }
  }

  console.log('\n=== Testing Close Button ===');

  // Test close button via user interaction
  const closeBtn = page.locator('button[aria-label="Close modal"], button.btn-circle').first();
  const beforeClose = await page.locator('.modal-box').isVisible();

  console.log(`Before close button click: modal visible = ${beforeClose}`);

  await closeBtn.click({ timeout: 5000 });
  await page.waitForTimeout(500);

  const afterClose = await page.locator('.modal-box').isVisible({ timeout: 2000 }).catch(() => false);
  console.log(`After close button click: modal visible = ${afterClose}`);

  if (beforeClose && !afterClose) {
    console.log('✅ Close button click handler WORKS');
  } else {
    console.log('❌ Close button click handler DOES NOT work');
  }

  console.log('\n=== Checking Angular Event Listeners ===');

  const eventStatus = await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close modal"]') as any;
    const tab = document.querySelector('.tab') as any;

    return {
      closeButtonAngularContext: !!closeBtn?.__ngContext__,
      tabButtonAngularContext: !!tab?.__ngContext__,
      closeButtonListeners: closeBtn ? 'n/a' : 'button not found',
      tabButtonListeners: tab ? 'n/a' : 'tab not found',
    };
  });

  console.log('Angular Context Status:', JSON.stringify(eventStatus, null, 2));
});
