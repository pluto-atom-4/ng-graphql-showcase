import { test, expect } from '@playwright/test';

/**
 * Tailwind CSS Structural Verification
 *
 * Verifies Tailwind CSS compilation and application by checking:
 * 1. CSS file is loaded and contains rules
 * 2. HTML elements have expected classes
 * 3. CSS rules for those classes exist in stylesheet
 * 4. Framework indicators are unambiguous (classes present, not computed styles)
 */
test.describe('Tailwind CSS Structural Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
  });

  test('CSS stylesheet is loaded and contains rules', async ({ page }) => {
    const cssInfo = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets) as CSSStyleSheet[];

      return {
        totalSheets: stylesheets.length,
        sheets: stylesheets.map((sheet: any, idx) => ({
          index: idx,
          href: sheet.href || 'inline',
          rulesCount: sheet.cssRules?.length || 0,
        })),
      };
    });

    // Should have at least one stylesheet
    expect(cssInfo.totalSheets).toBeGreaterThan(0);

    // At least one sheet should have CSS rules
    const sheetsWithRules = cssInfo.sheets.filter(s => s.rulesCount > 0);
    expect(sheetsWithRules.length).toBeGreaterThan(0);

    console.log('CSS sheets loaded:', cssInfo.sheets);
  });

  test('Tailwind utility classes are defined in CSS', async ({ page }) => {
    const tailwindClasses = await page.evaluate(() => {
      const classNames = new Set<string>();
      const stylesheets = Array.from(document.styleSheets) as CSSStyleSheet[];

      for (const sheet of stylesheets) {
        try {
          for (let i = 0; i < sheet.cssRules.length; i++) {
            const rule = sheet.cssRules[i] as CSSRule;
            const text = rule.cssText;

            // Extract class names from CSS selectors
            const classMatches = text.match(/\.[a-z0-9\-]+/g);
            if (classMatches) {
              classMatches.forEach(match => classNames.add(match));
            }
          }
        } catch (e) {
          // CORS or access error
        }
      }

      return Array.from(classNames);
    });

    // Should have common Tailwind classes
    const expectedClasses = ['.flex', '.grid', '.block', '.inline', '.p-', '.bg-', '.text-'];
    const found = expectedClasses.filter(exp => tailwindClasses.some(c => c.includes(exp.replace(/\.$/, ''))));

    console.log(`Found ${tailwindClasses.length} total classes`);
    console.log(`Tailwind utilities found: ${found.length}/${expectedClasses.length}`);

    expect(found.length).toBeGreaterThan(0);
  });

  test('Body has daisyUI theme classes', async ({ page }) => {
    const bodyClasses = await page.locator('body').evaluate((el: HTMLElement) => {
      return {
        className: el.className,
        hasBaseClass: el.className.includes('bg-base') || el.className.includes('text-base'),
        hasThemeAttribute: el.getAttribute('data-theme') !== null,
      };
    });

    console.log('Body element:', bodyClasses);

    // Should have either daisyUI base classes or theme attribute
    const hasThemeIndicator = bodyClasses.hasBaseClass || bodyClasses.hasThemeAttribute;
    expect(hasThemeIndicator).toBe(true);
  });

  test('Modal elements have daisyUI classes (structural)', async ({ page }) => {
    // Open modal
    const detailsBtn = page.locator('button:has-text("Details")').first();
    await detailsBtn.click({ timeout: 10000 });
    await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

    // Check modal structure (class presence, not computed styles)
    const modalStructure = await page.evaluate(() => {
      const modal = document.querySelector('.modal');
      const modalBox = document.querySelector('.modal-box');

      return {
        modalElement: {
          exists: !!modal,
          classes: modal?.className || '',
          hasModalClass: modal?.classList.contains('modal') || false,
        },
        modalBoxElement: {
          exists: !!modalBox,
          classes: modalBox?.className || '',
          hasModalBoxClass: modalBox?.classList.contains('modal-box') || false,
          hasSizingClasses: (modalBox?.className || '').includes('w-') || (modalBox?.className || '').includes('max-w'),
          hasHeightClass: (modalBox?.className || '').includes('h-') || (modalBox?.className || '').includes('max-h'),
        },
      };
    });

    console.log('Modal structure:', JSON.stringify(modalStructure, null, 2));

    // Verify unambiguous structural indicators (classes present)
    expect(modalStructure.modalElement.exists).toBe(true);
    expect(modalStructure.modalElement.hasModalClass).toBe(true);
    expect(modalStructure.modalBoxElement.exists).toBe(true);
    expect(modalStructure.modalBoxElement.hasModalBoxClass).toBe(true);
  });

  test('Button elements have daisyUI btn classes (structural)', async ({ page }) => {
    const buttonStructure = await page.locator('button').first().evaluate((el: HTMLElement) => {
      return {
        className: el.className,
        hasBtnClass: el.classList.contains('btn'),
        hasVariantClass: /btn-/.test(el.className),
        hasColorClass: /(primary|secondary|accent|ghost|outline)/.test(el.className),
      };
    });

    console.log('Button structure:', buttonStructure);

    // Verify structural indicators
    expect(buttonStructure.hasBtnClass).toBe(true);
    expect(buttonStructure.className.length).toBeGreaterThan(0);
  });

  test('Badge elements have daisyUI badge classes (structural)', async ({ page }) => {
    // Open modal to find badges
    const detailsBtn = page.locator('button:has-text("Details")').first();
    await detailsBtn.click({ timeout: 10000 });
    await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

    const badges = page.locator('.badge');
    const badgeCount = await badges.count();

    expect(badgeCount).toBeGreaterThan(0);

    const badgeStructure = await badges.first().evaluate((el: HTMLElement) => {
      return {
        className: el.className,
        hasBadgeClass: el.classList.contains('badge'),
        hasColorVariant: /badge-/.test(el.className),
        textContent: el.textContent?.trim() || '',
      };
    });

    console.log('Badge structure:', badgeStructure);

    // Verify structural indicators (classes and text content)
    expect(badgeStructure.hasBadgeClass).toBe(true);
    expect(badgeStructure.textContent.length).toBeGreaterThan(0);
  });

  test('Tab elements have daisyUI tab classes (structural)', async ({ page }) => {
    // Open modal
    const detailsBtn = page.locator('button:has-text("Details")').first();
    await detailsBtn.click({ timeout: 10000 });
    await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

    const tabsContainer = page.locator('.tabs');
    const hasTabsContainer = await tabsContainer.isVisible();

    if (hasTabsContainer) {
      const tabStructure = await tabsContainer.evaluate((el: HTMLElement) => {
        return {
          className: el.className,
          hasTabsClass: el.classList.contains('tabs'),
          childTabs: Array.from(el.querySelectorAll('.tab')).map(tab => ({
            className: tab.className,
            hasTabClass: tab.classList.contains('tab'),
            isActive: tab.classList.contains('tab-active'),
          })),
        };
      });

      console.log('Tabs structure:', JSON.stringify(tabStructure, null, 2));

      // Verify structural indicators
      expect(tabStructure.hasTabsClass).toBe(true);
      expect(tabStructure.childTabs.length).toBeGreaterThan(0);
      expect(tabStructure.childTabs.some(t => t.hasTabClass)).toBe(true);
    }
  });

  test('CSS rules exist for Tailwind utility classes', async ({ page }) => {
    const cssRulesForUtilities = await page.evaluate(() => {
      const targetClasses = ['.flex', '.grid', '.block', '.p-4', '.p-6', '.bg-'];
      const foundRules: Record<string, number> = {};

      const stylesheets = Array.from(document.styleSheets) as CSSStyleSheet[];

      for (const targetClass of targetClasses) {
        foundRules[targetClass] = 0;

        for (const sheet of stylesheets) {
          try {
            for (let i = 0; i < sheet.cssRules.length; i++) {
              const rule = sheet.cssRules[i] as CSSRule;
              if (rule.cssText.includes(targetClass)) {
                foundRules[targetClass]++;
              }
            }
          } catch (e) {
            // CORS error
          }
        }
      }

      return foundRules;
    });

    console.log('CSS rules found for utilities:', cssRulesForUtilities);

    // Should find rules for at least some utilities
    const rulesFound = Object.values(cssRulesForUtilities).filter(count => count > 0).length;
    expect(rulesFound).toBeGreaterThan(0);
  });

  test('CSS rules exist for daisyUI component classes', async ({ page }) => {
    const daisyuiRules = await page.evaluate(() => {
      const targetClasses = ['.btn', '.badge', '.modal', '.card', '.tabs', '.tab'];
      const foundRules: Record<string, number> = {};

      const stylesheets = Array.from(document.styleSheets) as CSSStyleSheet[];

      for (const targetClass of targetClasses) {
        foundRules[targetClass] = 0;

        for (const sheet of stylesheets) {
          try {
            for (let i = 0; i < sheet.cssRules.length; i++) {
              const rule = sheet.cssRules[i] as CSSRule;
              if (rule.cssText.includes(targetClass)) {
                foundRules[targetClass]++;
              }
            }
          } catch (e) {
            // CORS error
          }
        }
      }

      return foundRules;
    });

    console.log('daisyUI CSS rules found:', daisyuiRules);

    // Should find at least some daisyUI component rules
    const rulesFound = Object.values(daisyuiRules).filter(count => count > 0).length;
    console.log(`daisyUI rules found for ${rulesFound}/${Object.keys(daisyuiRules).length} components`);

    expect(rulesFound).toBeGreaterThan(0);
  });

  test('Framework compilation status (summary)', async ({ page }) => {
    const compilationStatus = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets) as CSSStyleSheet[];
      const allClasses = new Set<string>();
      let totalRules = 0;

      for (const sheet of stylesheets) {
        try {
          totalRules += sheet.cssRules?.length || 0;
          for (let i = 0; i < (sheet.cssRules?.length || 0); i++) {
            const rule = sheet.cssRules?.[i] as CSSRule;
            const classMatches = rule?.cssText?.match(/\.[a-z0-9\-]+/g);
            if (classMatches) {
              classMatches.forEach(m => allClasses.add(m));
            }
          }
        } catch (e) {
          // CORS error
        }
      }

      // Check HTML for class usage
      const htmlClasses = new Set<string>();
      document.querySelectorAll('[class]').forEach(el => {
        el.className.split(' ').forEach(cls => {
          if (cls.length > 0) {
            htmlClasses.add('.' + cls);
          }
        });
      });

      return {
        cssSheets: stylesheets.length,
        totalCSSRules: totalRules,
        uniqueCSSClasses: allClasses.size,
        usedHTMLClasses: htmlClasses.size,
        classesInHTMLButNotCSS: Array.from(htmlClasses).filter(cls => !allClasses.has(cls)).slice(0, 10),
      };
    });

    console.log('Framework compilation status:', JSON.stringify(compilationStatus, null, 2));

    // Report findings
    console.log(`\n📊 Compilation Summary:\n` +
      `  CSS Sheets: ${compilationStatus.cssSheets}\n` +
      `  CSS Rules: ${compilationStatus.totalCSSRules}\n` +
      `  Unique CSS Classes: ${compilationStatus.uniqueCSSClasses}\n` +
      `  HTML Classes Used: ${compilationStatus.usedHTMLClasses}\n` +
      `  Unmatched HTML Classes: ${compilationStatus.classesInHTMLButNotCSS.length}\n`);

    if (compilationStatus.classesInHTMLButNotCSS.length > 0) {
      console.log(`  ⚠️  Classes in HTML but not in CSS:\n    ${compilationStatus.classesInHTMLButNotCSS.join(', ')}`);
    }

    expect(compilationStatus.totalCSSRules).toBeGreaterThan(0);
  });
});
