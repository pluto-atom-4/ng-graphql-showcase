import { test, expect } from '@playwright/test';

test('Job status badge matches between card and modal', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');

  const jobId = '10000000-0000-0000-0000-000000000001';

  console.log(`\n=== Testing Job Status Consistency ===`);
  console.log(`Job ID: ${jobId}`);

  // Find build card - look for first card with status badge
  const card = page.locator('[class*="card"]').first();
  const detailsBtn = card.locator('button:has-text("Details")');

  // Get card badge status and color - badge is in the card
  const cardBadge = card.locator('.badge').first();

  const cardStatusText = await cardBadge.textContent();
  const cardBadgeClass = await cardBadge.getAttribute('class');

  console.log(`\n--- Card Badge ---`);
  console.log(`Status text: ${cardStatusText}`);
  console.log(`Badge class: ${cardBadgeClass}`);

  // Click to open modal
  console.log(`\nOpening modal...`);
  await detailsBtn.click({ timeout: 10000 });
  await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);

  // Get modal badge status and color
  const modal = page.locator('.modal-box');
  const modalBadge = modal.locator('.badge').first();

  const modalStatusText = await modalBadge.textContent();
  const modalBadgeClass = await modalBadge.getAttribute('class');

  console.log(`\n--- Modal Badge ---`);
  console.log(`Status text: ${modalStatusText}`);
  console.log(`Badge class: ${modalBadgeClass}`);

  // Verify consistency
  console.log(`\n--- Validation ---`);
  if (cardStatusText === modalStatusText) {
    console.log(`✅ Status text matches: "${cardStatusText}"`);
  } else {
    console.log(`❌ Status text mismatch: Card="${cardStatusText}" vs Modal="${modalStatusText}"`);
  }

  if (cardBadgeClass === modalBadgeClass) {
    console.log(`✅ Badge class matches: "${cardBadgeClass}"`);
  } else {
    console.log(`❌ Badge class mismatch: Card="${cardBadgeClass}" vs Modal="${modalBadgeClass}"`);
  }

  // Assertions
  expect(cardStatusText).toBe(modalStatusText);
  expect(cardBadgeClass).toBe(modalBadgeClass);

  console.log(`\n✅ Job status consistency verified`);
});
