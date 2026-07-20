import { test } from '@playwright/test';

test('Check if click handler attached to close button', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');

  // Open modal
  const detailsBtn = page.locator('button:has-text("Details")').first();
  await detailsBtn.click({ timeout: 10000 });
  await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);

  // Check if click handler attached
  const handlerCheck = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Close modal"]') as HTMLButtonElement | null;

    if (!btn) {
      return { found: false, message: 'Button not found' };
    }

    // Try to detect Angular event listeners (they're not directly accessible)
    const angularElement = (btn as any).__ngContext__;
    const hasAngularContext = !!angularElement;

    // Try clicking and monitoring what happens
    const beforeModal = document.querySelector('.modal-box');
    const beforeVisible = !!beforeModal;

    console.log('[Test] Before click - modal visible:', beforeVisible);
    btn.click();
    console.log('[Test] Click executed');

    // Small delay to let handlers run
    return new Promise((resolve) => {
      setTimeout(() => {
        const afterModal = document.querySelector('.modal-box');
        const afterVisible = !!afterModal;
        console.log('[Test] After click - modal visible:', afterVisible);

        resolve({
          found: true,
          buttonElement: {
            className: btn.className,
            ariaLabel: btn.getAttribute('aria-label'),
            innerHTML: btn.innerHTML.substring(0, 50),
          },
          hasAngularContext,
          beforeVisible,
          afterVisible,
          closed: beforeVisible && !afterVisible,
          message: 'Button clicked from evaluate context',
        });
      }, 300);
    });
  });

  console.log('Handler Check Result:', JSON.stringify(handlerCheck, null, 2));
});
