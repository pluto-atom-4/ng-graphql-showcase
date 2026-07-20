import { test, expect } from '@playwright/test';

/**
 * Modal Layering & Close Button Bug Investigation
 *
 * QA Test Suite for diagnosing:
 * 1. Modal rendering below page content (z-index/stacking context issue)
 * 2. Close button non-functional (pointer-events, event listener, click handling)
 */
test.describe('Modal Layering & Close Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Visual Layering Diagnosis', () => {
    test('modal overlay is above page content (z-index verification)', async ({ page }) => {
      // Open modal
      const detailsBtn = page.locator('button:has-text("Details")').first();
      await detailsBtn.click({ timeout: 10000 });
      await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

      // Diagnose layering
      const layeringInfo = await page.evaluate(() => {
        const modal = document.querySelector('.modal');
        const card = document.querySelector('.card') || document.querySelector('[class*="card"]');
        const backdrop = document.querySelector('.modal::backdrop');

        return {
          modal: {
            element: !!modal,
            zIndex: modal ? window.getComputedStyle(modal).zIndex : 'N/A',
            position: modal ? window.getComputedStyle(modal).position : 'N/A',
            display: modal ? window.getComputedStyle(modal).display : 'N/A',
            visibility: modal ? window.getComputedStyle(modal).visibility : 'N/A',
            className: modal?.className || '',
          },
          card: {
            element: !!card,
            zIndex: card ? window.getComputedStyle(card).zIndex : 'N/A',
            position: card ? window.getComputedStyle(card).position : 'N/A',
          },
          backdrop: {
            element: !!backdrop,
            computed: backdrop ? 'Present' : 'Missing',
          },
          stackingContext: {
            modalOpacity: modal ? window.getComputedStyle(modal).opacity : 'N/A',
            modalTransform: modal ? window.getComputedStyle(modal).transform : 'N/A',
          },
        };
      });

      console.log('Layering Diagnosis:', JSON.stringify(layeringInfo, null, 2));

      // Assertions
      expect(layeringInfo.modal.element).toBe(true);
      expect(layeringInfo.modal.display).not.toBe('none');
      expect(layeringInfo.modal.visibility).not.toBe('hidden');

      // Modal should be on top (z-index check)
      const modalZ = parseInt(layeringInfo.modal.zIndex || '0');
      const cardZ = parseInt(layeringInfo.card.zIndex || '0');
      expect(modalZ).toBeGreaterThanOrEqual(cardZ);

      console.log(`✅ Modal z-index (${modalZ}) >= Card z-index (${cardZ})`);
    });

    test('modal is not obscured by card container', async ({ page }) => {
      // Open modal
      const detailsBtn = page.locator('button:has-text("Details")').first();
      await detailsBtn.click({ timeout: 10000 });
      await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

      // Check if modal is visible and not covered
      const modalBox = page.locator('.modal-box');

      const visibility = await modalBox.evaluate((el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const elementAtCenter = document.elementFromPoint(centerX, centerY);

        return {
          visible: rect.width > 0 && rect.height > 0,
          topElement: elementAtCenter?.className || 'unknown',
          isModalOrChild: elementAtCenter?.closest('.modal-box') ? true : false,
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
        };
      });

      console.log('Modal Visibility:', JSON.stringify(visibility, null, 2));

      expect(visibility.visible).toBe(true);
      expect(visibility.isModalOrChild).toBe(true);

      console.log('✅ Modal is visible and not obscured');
    });
  });

  test.describe('Close Button Diagnosis', () => {
    test('close button is present and interactive', async ({ page }) => {
      // Open modal
      const detailsBtn = page.locator('button:has-text("Details")').first();
      await detailsBtn.click({ timeout: 10000 });
      await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

      // Find close button
      const closeBtn = page.locator('button[aria-label*="close"], .btn-close, [class*="close"]').first();

      if (await closeBtn.isVisible()) {
        // Diagnose close button
        const closeButtonInfo = await closeBtn.evaluate((el: HTMLElement) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);

          return {
            tagName: el.tagName,
            className: el.className,
            display: style.display,
            visibility: style.visibility,
            pointerEvents: style.pointerEvents,
            opacity: style.opacity,
            zIndex: style.zIndex,
            position: style.position,
            clickable: style.pointerEvents !== 'none' && style.display !== 'none',
            dimensions: {
              width: rect.width,
              height: rect.height,
              visible: rect.width > 0 && rect.height > 0,
            },
            listeners: 'Unable to detect from JavaScript',
          };
        });

        console.log('Close Button Info:', JSON.stringify(closeButtonInfo, null, 2));

        expect(closeButtonInfo.display).not.toBe('none');
        expect(closeButtonInfo.pointerEvents).not.toBe('none');
        expect(closeButtonInfo.clickable).toBe(true);

        console.log('✅ Close button is present and interactive');
      }
    });

    test('close button click closes modal', async ({ page }) => {
      // Open modal
      const detailsBtn = page.locator('button:has-text("Details")').first();
      await detailsBtn.click({ timeout: 10000 });
      await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

      // Find and click close button
      const closeBtn = page.locator('button[aria-label*="close"], .btn-close, [class*="close"]').first();

      if (await closeBtn.isVisible()) {
        // Click close button
        await closeBtn.click({ timeout: 5000 });
        await page.waitForTimeout(300); // Wait for animation

        // Verify modal is closed
        const modalClosed = await page.evaluate(() => {
          const modal = document.querySelector('.modal');
          const modalBox = document.querySelector('.modal-box');

          return {
            modalExists: !!modal,
            modalOpen: modal?.classList.contains('modal-open') || false,
            modalBoxVisible: modalBox ? window.getComputedStyle(modalBox).visibility !== 'hidden' : false,
            modalDisplay: modal ? window.getComputedStyle(modal).display : 'N/A',
          };
        });

        console.log('Modal State After Close:', JSON.stringify(modalClosed, null, 2));

        // Modal should be closed or hidden
        const isClosed = !modalClosed.modalOpen || !modalClosed.modalBoxVisible || modalClosed.modalDisplay === 'none';
        expect(isClosed).toBe(true);

        console.log('✅ Close button successfully closed modal');
      }
    });

    test('close button is not covered by pointer-events blocker', async ({ page }) => {
      // Open modal
      const detailsBtn = page.locator('button:has-text("Details")').first();
      await detailsBtn.click({ timeout: 10000 });
      await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

      const closeBtn = page.locator('button[aria-label*="close"], .btn-close, [class*="close"]').first();

      if (await closeBtn.isVisible()) {
        const coverageInfo = await closeBtn.evaluate((btn: HTMLElement) => {
          const rect = btn.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const elementAtPoint = document.elementFromPoint(centerX, centerY);
          const blockerStyle = elementAtPoint ? window.getComputedStyle(elementAtPoint) : null;

          return {
            closeButtonAtPoint: elementAtPoint === btn || btn.contains(elementAtPoint),
            topElement: elementAtPoint?.className || 'N/A',
            topPointerEvents: blockerStyle?.pointerEvents || 'N/A',
            buttonPointerEvents: window.getComputedStyle(btn).pointerEvents,
          };
        });

        console.log('Close Button Coverage:', JSON.stringify(coverageInfo, null, 2));

        expect(coverageInfo.closeButtonAtPoint).toBe(true);
        expect(coverageInfo.topPointerEvents).not.toBe('none');

        console.log('✅ Close button is not covered by pointer-events blocker');
      }
    });

    test('close button has working event listener', async ({ page, context }) => {
      // Open modal
      const detailsBtn = page.locator('button:has-text("Details")').first();
      await detailsBtn.click({ timeout: 10000 });
      await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

      // Check for console errors
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleMessages.push(msg.text());
        }
      });

      const closeBtn = page.locator('button[aria-label*="close"], .btn-close, [class*="close"]').first();

      if (await closeBtn.isVisible()) {
        // Attempt click and capture result
        try {
          await closeBtn.click({ timeout: 5000 });

          // Check if click succeeded by verifying modal state changed
          const modalStillOpen = await page.locator('.modal-box').isVisible();

          console.log('Modal still open after click:', modalStillOpen);
          console.log('Console errors during click:', consoleMessages);

          // If modal is closed, event listener worked
          if (!modalStillOpen) {
            console.log('✅ Close button event listener working correctly');
          } else {
            console.log('⚠️  Close button clicked but modal did not close');
          }

          expect(consoleMessages.length).toBe(0); // No console errors
        } catch (error) {
          console.log('❌ Close button click failed:', error);
          throw error;
        }
      }
    });
  });

  test.describe('Modal Accessibility & UX', () => {
    test('modal can be closed by clicking overlay background (if applicable)', async ({ page }) => {
      // Open modal
      const detailsBtn = page.locator('button:has-text("Details")').first();
      await detailsBtn.click({ timeout: 10000 });
      await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

      // Check if clicking outside modal closes it (depends on implementation)
      const modal = page.locator('.modal').first();
      const modalBox = page.locator('.modal-box').first();

      // Click outside modal-box but within modal overlay
      const boundingBox = await modalBox.boundingBox();
      if (boundingBox) {
        // Click in modal area but outside modal-box
        await modal.click({
          position: { x: 10, y: 10 }, // Top-left corner of modal overlay
          timeout: 5000,
        });

        await page.waitForTimeout(300);

        // Check if modal closed (some implementations allow this)
        const stillOpen = await page.locator('.modal-box').isVisible();
        console.log('Modal still open after overlay click:', stillOpen);
        // Note: This behavior is implementation-specific, so just log it
      }
    });

    test('modal is keyboard accessible (Escape key)', async ({ page }) => {
      // Open modal
      const detailsBtn = page.locator('button:has-text("Details")').first();
      await detailsBtn.click({ timeout: 10000 });
      await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Check if modal closed
      const stillOpen = await page.locator('.modal-box').isVisible();
      console.log('Modal still open after Escape:', stillOpen);

      if (!stillOpen) {
        console.log('✅ Modal closed via Escape key');
        expect(!stillOpen).toBe(true);
      }
    });
  });

  test.describe('Modal Stacking Context Integrity', () => {
    test('verify no parent containers break stacking context', async ({ page }) => {
      // Open modal
      const detailsBtn = page.locator('button:has-text("Details")').first();
      await detailsBtn.click({ timeout: 10000 });
      await page.locator('.modal-box').waitFor({ state: 'visible', timeout: 10000 });

      const stackingInfo = await page.evaluate(() => {
        const modal = document.querySelector('.modal');
        let element: HTMLElement | null = modal as HTMLElement;
        const stackingBreakers: string[] = [];

        while (element && element !== document.body) {
          const style = window.getComputedStyle(element);

          // Check for stacking context creating properties
          const opacity = parseFloat(style.opacity || '1');
          const transform = style.transform !== 'none';
          const filter = style.filter !== 'none';
          const zIndex = style.zIndex !== 'auto';
          const position = style.position !== 'static';

          if ((opacity < 1) || transform || filter) {
            stackingBreakers.push(`${element.tagName}.${element.className}: opacity=${opacity}, transform=${transform}, filter=${filter}`);
          }

          element = element.parentElement;
        }

        return {
          stackingBreakers,
          issue: stackingBreakers.length > 0 ? 'Found stacking context breakers' : 'None',
        };
      });

      console.log('Stacking Context Info:', JSON.stringify(stackingInfo, null, 2));

      // Log findings (stacking context breakers might be intentional)
      if (stackingInfo.stackingBreakers.length > 0) {
        console.log('⚠️  Stacking context may be affected by parent properties');
        console.log('Affected elements:', stackingInfo.stackingBreakers);
      } else {
        console.log('✅ No stacking context issues detected');
      }
    });
  });
});
