import { test } from '@playwright/test';

test('Close modal by pressing ESC key', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');

  // Open modal
  console.log('Opening modal...');
  const detailsBtn = page.locator('button:has-text("Details")').first();
  await detailsBtn.click({ timeout: 10000 });
  await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);

  const beforeEsc = await page.locator('.modal-box').isVisible();
  console.log(`Before ESC: modal visible = ${beforeEsc}`);

  // Press ESC key
  console.log('Pressing ESC key...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const afterEsc = await page.locator('.modal-box').isVisible({ timeout: 2000 }).catch(() => false);
  console.log(`After ESC: modal visible = ${afterEsc}`);

  if (beforeEsc && !afterEsc) {
    console.log('✅ ESC key closes modal - @HostListener works');
  } else {
    console.log('❌ ESC key does not close modal');
  }
});
