import { test, expect } from '@playwright/test';

test('Inspect modal DOM structure and close button', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');

  // Open modal
  const detailsBtn = page.locator('button:has-text("Details")').first();
  await detailsBtn.click({ timeout: 10000 });
  await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);

  // Inspect modal structure
  const modalStructure = await page.evaluate(() => {
    const modal = document.querySelector('.modal');
    const modalBox = document.querySelector('.modal-box');
    const closeButtons = document.querySelectorAll('button[aria-label*="close"], button[aria-label*="Close"], .btn-circle');

    return {
      modalExists: !!modal,
      modalClass: modal?.className || '',
      modalBoxExists: !!modalBox,
      modalBoxClass: modalBox?.className || '',
      closeButtonsFound: closeButtons.length,
      closeButtonDetails: Array.from(closeButtons).map((btn: any) => ({
        tagName: btn.tagName,
        className: btn.className,
        textContent: btn.textContent?.trim() || '',
        ariaLabel: btn.getAttribute('aria-label'),
        innerHTML: btn.innerHTML.substring(0, 100),
        isVisible: !!btn.offsetHeight,
        pointerEvents: window.getComputedStyle(btn).pointerEvents,
      })),
      allButtons: document.querySelectorAll('button').length,
      allDivs: document.querySelectorAll('div').length,
    };
  });

  console.log('Modal Structure:', JSON.stringify(modalStructure, null, 2));

  // Test button click via JavaScript
  const clickResult = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="close"], button[aria-label*="Close"]');
    if (btn) {
      (btn as HTMLButtonElement).click();
      return { clicked: true, message: 'Button clicked via JavaScript' };
    }
    return { clicked: false, message: 'Close button not found' };
  });

  console.log('JS Click Result:', clickResult);

  // Check if modal closed
  await page.waitForTimeout(300);
  const stillOpen = await page.locator('.modal-box').isVisible({ timeout: 2000 }).catch(() => false);
  console.log('Modal still open after JS click:', stillOpen);

  expect(modalStructure.closeButtonsFound).toBeGreaterThan(0);
});
