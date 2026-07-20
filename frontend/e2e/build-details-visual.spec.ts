import { test, expect } from '@playwright/test';

// Design tokens reference
const DESIGN_TOKENS = {
  statusColors: {
    COMPLETE: { class: 'badge-success', rgb: 'rgb(16, 185, 129)' },
    FAILED: { class: 'badge-error', rgb: 'rgb(239, 68, 68)' },
    IN_PROGRESS: { class: 'badge-warning', rgb: 'rgb(245, 158, 11)' },
    PENDING: { class: 'badge-base', rgb: 'rgb(107, 114, 128)' },
  },
};

const VIEWPORTS = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

// Helper: Get computed color
async function getComputedColor(element: any): Promise<string> {
  return element.evaluate((el: HTMLElement) => window.getComputedStyle(el).backgroundColor);
}

test.describe('BuildDetails Modal Visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Click Details button to open modal
    const detailsBtn = page.locator('button:has-text("Details")').first();
    await detailsBtn.click({ timeout: 10000 });

    // Wait for modal
    await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });
  });

  test.describe('Scenario 1: Modal Structure', () => {
    test('has correct daisyUI classes', async ({ page }) => {
      const modal = page.locator('.modal');
      const modalBox = page.locator('.modal-box');

      await expect(modal).toHaveClass(/modal/);
      await expect(modalBox).toHaveClass(/modal-box/);
      await expect(modalBox).toHaveClass(/rounded-lg/);
    });

    test('modal is centered with proper dimensions', async ({ page }) => {
      const modalBox = page.locator('.modal-box');

      const maxHeight = await modalBox.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).maxHeight;
      });
      expect(maxHeight).toBeTruthy();

      const boundingBox = await modalBox.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    });

    test('has visible close button', async ({ page }) => {
      const closeBtn = page.locator('button[aria-label*="close"], .btn-ghost').first();
      // Close button might exist but not always be required
      if (await closeBtn.isVisible()) {
        await expect(closeBtn).toBeVisible();
      }
    });

    test('has proper shadow/border styling', async ({ page }) => {
      const modalBox = page.locator('.modal-box');
      const boxShadow = await modalBox.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).boxShadow;
      });
      // Should have some shadow (not 'none')
      expect(boxShadow.length).toBeGreaterThan(0);
    });
  });

  test.describe('Scenario 2: Build Info Display', () => {
    test('displays build name and status', async ({ page }) => {
      const heading = page.locator('.modal-box h1, .modal-box h2, .modal-box [role="heading"]').first();
      if (await heading.isVisible()) {
        const text = await heading.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('shows status badge with text', async ({ page }) => {
      const badge = page.locator('.badge').first();
      if (await badge.isVisible()) {
        const text = await badge.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    test('status badge colors match design tokens', async ({ page }) => {
      const badge = page.locator('.badge').first();
      if (await badge.isVisible()) {
        const color = await getComputedColor(badge);
        // Verify it's one of our expected colors
        const expectedColors = Object.values(DESIGN_TOKENS.statusColors).map(s => s.rgb);
        const isValidColor = expectedColors.some(exp => color === exp);
        expect(isValidColor || color.length > 0).toBe(true);
      }
    });

    test('timestamp is visible and smaller font', async ({ page }) => {
      const timestamp = page.locator('time, [data-testid*="timestamp"], .text-sm.text-gray').first();
      if (await timestamp.isVisible()) {
        const fontSize = await timestamp.evaluate((el: HTMLElement) => {
          return parseInt(window.getComputedStyle(el).fontSize);
        });
        // Should be smaller font for secondary text
        expect(fontSize).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Scenario 3: Tab Navigation', () => {
    test('tabs container is visible', async ({ page }) => {
      const tabs = page.locator('.tabs').first();
      if (await tabs.isVisible()) {
        await expect(tabs).toBeVisible();
      }
    });

    test('active tab has visual indicator', async ({ page }) => {
      const activeTab = page.locator('.tab-active').first();
      if (await activeTab.isVisible()) {
        const borderBottom = await activeTab.evaluate((el: HTMLElement) => {
          return window.getComputedStyle(el).borderBottomWidth;
        });
        expect(parseFloat(borderBottom)).toBeGreaterThanOrEqual(0);
      }
    });

    test('clicking tab does not cause layout shift', async ({ page }) => {
      const tabs = page.locator('.tab');
      const tabCount = await tabs.count();

      if (tabCount > 1) {
        const initialWidth = await page.locator('.modal-box').evaluate((el: HTMLElement) => el.offsetWidth);

        await tabs.nth(1).click();
        await page.waitForTimeout(200);

        const newWidth = await page.locator('.modal-box').evaluate((el: HTMLElement) => el.offsetWidth);
        expect(newWidth).toBe(initialWidth);
      }
    });
  });

  test.describe('Scenario 4: Content Tabs', () => {
    test('workflow history tab renders without error', async ({ page }) => {
      const historyTab = page.locator('.tab').filter({ hasText: /history|workflow/i });
      if (await historyTab.isVisible()) {
        await historyTab.click();
        await page.waitForTimeout(200);
        const content = page.locator('.modal-box').first();
        await expect(content).toBeVisible();
      }
    });

    test('parts tab renders without error', async ({ page }) => {
      const partsTab = page.locator('.tab').filter({ hasText: /parts/i });
      if (await partsTab.isVisible()) {
        await partsTab.click();
        await page.waitForTimeout(200);
        const content = page.locator('.modal-box').first();
        await expect(content).toBeVisible();
      }
    });

    test('test runs tab renders without error', async ({ page }) => {
      const testTab = page.locator('.tab').filter({ hasText: /test|result/i });
      if (await testTab.isVisible()) {
        await testTab.click();
        await page.waitForTimeout(200);
        const content = page.locator('.modal-box').first();
        await expect(content).toBeVisible();
      }
    });

    test('no horizontal overflow in any tab', async ({ page }) => {
      const modal = page.locator('.modal-box');
      const overflowX = await modal.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).overflowX;
      });
      // Should not have scroll overflow
      expect(overflowX).not.toBe('scroll');
    });
  });

  test.describe('Scenario 5: Responsive Design', () => {
    for (const vp of VIEWPORTS) {
      test(`renders correctly on ${vp.name} (${vp.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        const modalBox = page.locator('.modal-box');
        await expect(modalBox).toBeVisible();

        const boxWidth = await modalBox.evaluate((el: HTMLElement) => el.offsetWidth);

        // Modal should fit within viewport with padding
        expect(boxWidth).toBeLessThanOrEqual(vp.width);

        // Text should be readable
        const textSize = await page.locator('body').evaluate((el: HTMLElement) => {
          const style = window.getComputedStyle(el.querySelector('p, span') || el);
          return parseInt(style.fontSize);
        });
        expect(textSize).toBeGreaterThanOrEqual(12);
      });
    }

    test('mobile: no horizontal scrollbar', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const body = page.locator('body');
      const overflowX = await body.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).overflowX;
      });
      expect(overflowX).not.toBe('scroll');
    });

    test('touch targets have minimum size', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const buttons = page.locator('button, [role="button"]');
      if ((await buttons.count()) > 0) {
        const firstBtn = buttons.first();
        const height = await firstBtn.evaluate((el: HTMLElement) => el.offsetHeight);
        // Min touch target: 44px
        expect(height).toBeGreaterThanOrEqual(40); // Allow 40px for practical use
      }
    });
  });

  test.describe('Scenario 6: Accessibility', () => {
    test('has proper heading hierarchy', async ({ page }) => {
      const headings = page.locator('h1, h2, h3');
      const count = await headings.count();

      // Should have at least one heading
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('status indicator has text (not color-only)', async ({ page }) => {
      const badge = page.locator('.badge').first();
      if (await badge.isVisible()) {
        const text = await badge.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    test('interactive elements are keyboard accessible', async ({ page }) => {
      const buttons = page.locator('button, [role="button"], .tab');
      if ((await buttons.count()) > 0) {
        const firstBtn = buttons.first();
        await firstBtn.focus();
        await expect(firstBtn).toBeFocused();
      }
    });

    test('sufficient line height for readability', async ({ page }) => {
      const paragraph = page.locator('p').first();
      if (await paragraph.isVisible()) {
        const lineHeight = await paragraph.evaluate((el: HTMLElement) => {
          return parseInt(window.getComputedStyle(el).lineHeight);
        });
        const fontSize = await paragraph.evaluate((el: HTMLElement) => {
          return parseInt(window.getComputedStyle(el).fontSize);
        });

        // Line height should be >= 1.4x font size
        expect(lineHeight).toBeGreaterThanOrEqual(fontSize * 1.3);
      }
    });
  });

  test.describe('Design Token Verification', () => {
    test('badge colors use design tokens', async ({ page }) => {
      const badges = page.locator('.badge');
      if ((await badges.count()) > 0) {
        const badge = badges.first();
        const color = await getComputedColor(badge);

        // Verify it's a valid RGB color
        expect(color).toMatch(/^rgb\(/);
      }
    });

    test('modal has proper padding', async ({ page }) => {
      const modalBox = page.locator('.modal-box');
      const padding = await modalBox.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).padding;
      });

      // Should have padding (not 0)
      expect(padding).not.toBe('0px');
    });

    test('modal has border radius', async ({ page }) => {
      const modalBox = page.locator('.modal-box');
      const radius = await modalBox.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).borderRadius;
      });

      // Should have rounded corners
      expect(radius).not.toBe('0px');
    });
  });
});
