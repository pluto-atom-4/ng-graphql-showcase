import { test } from '@playwright/test';

test('Test footer Close button (uses onClose() directly)', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');

  // Open modal
  const detailsBtn = page.locator('button:has-text("Details")').first();
  await detailsBtn.click({ timeout: 10000 });
  await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);

  console.log('Modal open');

  // Find FOOTER close button (the one that says "Close", not the X icon)
  const footerCloseBtn = page.locator('button.btn:has-text("Close")').first();
  const isVisible = await footerCloseBtn.isVisible({ timeout: 5000 }).catch(() => false);

  console.log(`Footer Close button found and visible: ${isVisible}`);

  if (isVisible) {
    console.log('Clicking footer Close button...');
    const beforeClick = await page.locator('.modal-box').isVisible();
    console.log(`Before click: modal visible = ${beforeClick}`);

    await footerCloseBtn.click({ timeout: 5000 });
    await page.waitForTimeout(500);

    const afterClick = await page.locator('.modal-box').isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`After click: modal visible = ${afterClick}`);

    if (beforeClick && !afterClick) {
      console.log('✅ Footer Close button (onClose) WORKS');
    } else {
      console.log('❌ Footer Close button (onClose) DOES NOT work');
    }
  }
});
