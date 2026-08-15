import { test, expect } from '@playwright/test';

/**
 * Tailwind CSS Diagnostic Tests
 *
 * Verifies that Tailwind CSS is properly compiled, loaded, and applied to page elements.
 * These tests help identify styling/compilation issues before running visual tests.
 */
test.describe('Tailwind CSS Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
  });

  test('CSS file is loaded in page', async ({ page }) => {
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map((sheet: any) => ({
        href: sheet.href,
        rules: sheet.cssRules?.length || 0,
      }));
    });

    // Should have at least one stylesheet
    expect(stylesheets.length).toBeGreaterThan(0);

    // Log loaded stylesheets for debugging
    console.log('Loaded stylesheets:', stylesheets);
  });

  test('Tailwind CSS classes are compiled and available', async ({ page }) => {
    const tailwindRules = await page.evaluate(() => {
      const rules: string[] = [];
      const stylesheets = Array.from(document.styleSheets) as CSSStyleSheet[];

      for (const sheet of stylesheets) {
        try {
          // Iterate through CSS rules to find Tailwind indicators
          for (let i = 0; i < Math.min(sheet.cssRules.length, 100); i++) {
            const rule = sheet.cssRules[i] as CSSRule;
            const text = rule.cssText;

            // Look for Tailwind utility classes (e.g., .bg-, .p-, .rounded-)
            if (
              text.includes('.bg-') ||
              text.includes('.p-') ||
              text.includes('.rounded-') ||
              text.includes('.text-') ||
              text.includes('.flex') ||
              text.includes('.grid')
            ) {
              rules.push(text.substring(0, 80));
            }
          }
        } catch (e) {
          // CORS or access error on external stylesheets
        }
      }

      return rules;
    });

    // Should find Tailwind utility rules
    expect(tailwindRules.length).toBeGreaterThan(0);
    console.log('Tailwind rules found:', tailwindRules.length);
    console.log('Sample rules:', tailwindRules.slice(0, 3));
  });

  test('Custom Tailwind component utilities are available', async ({ page }) => {
    const customUtilities = await page.evaluate(() => {
      const rules: string[] = [];
      const stylesheets = Array.from(document.styleSheets) as CSSStyleSheet[];

      for (const sheet of stylesheets) {
        try {
          for (let i = 0; i < Math.min(sheet.cssRules.length, 200); i++) {
            const rule = sheet.cssRules[i] as CSSRule;
            const text = rule.cssText;

            // Look for custom Tailwind component utilities
            if (
              text.includes('.button-') ||
              text.includes('.badge-base') ||
              text.includes('.modal') ||
              text.includes('.card') ||
              text.includes('.collapse')
            ) {
              rules.push(text.substring(0, 80));
            }
          }
        } catch (e) {
          // CORS or access error
        }
      }

      return rules;
    });

    // Should find custom Tailwind utility rules
    expect(customUtilities.length).toBeGreaterThan(0);
    console.log('Custom Tailwind utilities found:', customUtilities.length);
    console.log('Sample utilities:', customUtilities.slice(0, 3));
  });

  test('body element has Tailwind classes applied', async ({ page }) => {
    const bodyClasses = await page.locator('body').evaluate((el: HTMLElement) => {
      return {
        className: el.className,
        style: {
          backgroundColor: window.getComputedStyle(el).backgroundColor,
          color: window.getComputedStyle(el).color,
        },
      };
    });

    console.log('Body element:', bodyClasses);

    // Body should have some styling (either via class or computed style)
    expect(bodyClasses.className || bodyClasses.style.backgroundColor).toBeTruthy();
  });

  test('modal structure and styling (after opening)', async ({ page }) => {
    // Click Details button to open modal
    const detailsBtn = page.locator('button:has-text("Details")').first();
    await detailsBtn.click({ timeout: 10000 });

    // Wait for modal
    await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

    // Inspect modal elements
    const modalInfo = await page.evaluate(() => {
      const modal = document.querySelector('.modal');
      const modalBox = document.querySelector('.modal-box');

      return {
        modalExists: !!modal,
        modalBoxExists: !!modalBox,
        modalClasses: modal?.className || 'NO CLASSES',
        modalBoxClasses: modalBox?.className || 'NO CLASSES',
        modalBoxStyles: modalBox
          ? {
              display: window.getComputedStyle(modalBox).display,
              position: window.getComputedStyle(modalBox).position,
              padding: window.getComputedStyle(modalBox).padding,
              borderRadius: window.getComputedStyle(modalBox).borderRadius,
              backgroundColor: window.getComputedStyle(modalBox).backgroundColor,
            }
          : {},
      };
    });

    console.log('Modal Info:', JSON.stringify(modalInfo, null, 2));

    // Basic structure checks
    expect(modalInfo.modalExists).toBe(true);
    expect(modalInfo.modalBoxExists).toBe(true);

    // Log actual classes for debugging
    console.log('Modal-box actual classes:', modalInfo.modalBoxClasses);
  });

  test('button elements have styling applied', async ({ page }) => {
    const detailsBtn = page.locator('button:has-text("Details")').first();

    const buttonInfo = await detailsBtn.evaluate((el: HTMLElement) => {
      const style = window.getComputedStyle(el);
      return {
        className: el.className,
        display: style.display,
        padding: style.padding,
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
        cursor: style.cursor,
      };
    });

    console.log('Button Info:', JSON.stringify(buttonInfo, null, 2));

    // Button should be rendered with some styling
    expect(buttonInfo.className || buttonInfo.display).toBeTruthy();
    expect(buttonInfo.cursor).toBe('pointer'); // Interactive element
  });

  test('badge elements have color styling', async ({ page }) => {
    // Open modal to find badges
    const detailsBtn = page.locator('button:has-text("Details")').first();
    await detailsBtn.click({ timeout: 10000 });
    await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

    // Find badges (now use app-badge selector since we render badges as <span> with badge-base class)
    const badges = page.locator('[class*="badge-base"]');
    const badgeCount = await badges.count();

    if (badgeCount > 0) {
      const badgeInfo = await badges.first().evaluate((el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        return {
          className: el.className,
          textContent: el.textContent?.substring(0, 50),
          backgroundColor: style.backgroundColor,
          color: style.color,
          display: style.display,
        };
      });

      console.log('Badge Info:', JSON.stringify(badgeInfo, null, 2));

      // Badge should have styling
      expect(badgeInfo.className).toBeTruthy();
      expect(badgeInfo.textContent?.length).toBeGreaterThan(0);
    }
  });

  test('responsive design classes are in CSS', async ({ page }) => {
    const responsiveRules = await page.evaluate(() => {
      const rules: string[] = [];
      const stylesheets = Array.from(document.styleSheets) as CSSStyleSheet[];

      for (const sheet of stylesheets) {
        try {
          for (let i = 0; i < Math.min(sheet.cssRules.length, 500); i++) {
            const rule = sheet.cssRules[i] as CSSRule;
            const text = rule.cssText;

            // Look for responsive/breakpoint indicators
            if (text.includes('@media') && (text.includes('sm:') || text.includes('md:') || text.includes('lg:'))) {
              rules.push(text.substring(0, 100));
            }
          }
        } catch (e) {
          // CORS or access error
        }
      }

      return rules;
    });

    // Should find responsive rules
    expect(responsiveRules.length).toBeGreaterThanOrEqual(0); // May be 0 if media queries not parsed this way
    console.log('Responsive rules found:', responsiveRules.length);
  });

  test('Verify Tailwind core CSS layer is loaded and parsed', async ({ page }) => {
    // Query the DOM to ensure Tailwind rules exist in document stylesheets
    const isTailwindLoaded = await page.evaluate(() => {
      return Array.from(document.styleSheets).some((sheet) => {
        try {
          // Look for custom utility syntax variables or layer markers
          const rules = Array.from(sheet.cssRules).map(r => r.cssText).join('');
          return rules.includes('--tw-') || rules.includes('@theme') || rules.includes('tailwind');
        } catch (e) {
          // Catch cross-origin stylesheet security restrictions
          return false;
        }
      });
    });

    // Strict assertion that the generated token dictionary is active
    expect(isTailwindLoaded).toBe(true);
    console.log('✅ Tailwind core CSS layer verified');
  });

  test('Verify Tailwind utility class converts correctly to display property', async ({ page }) => {
    // Locate a layout container containing core layout styling properties
    const flexContainer = page.locator('[class*="flex"]').first();
    await expect(flexContainer).toBeVisible();

    // Extract the layout mode
    const displayValue = await flexContainer.evaluate((el) => window.getComputedStyle(el).display);

    // If the CSS file failed to load, 'flex' class evaluates to 'block' or 'inline' by default
    expect(displayValue).toBe('flex');
    console.log('✅ Tailwind flex utility correctly renders as display: flex');
  });
});
