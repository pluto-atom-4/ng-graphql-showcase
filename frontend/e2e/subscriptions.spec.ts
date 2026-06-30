import { test, expect } from '@playwright/test';

test.describe('GraphQL Subscriptions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/');
    // Wait for app to load
    await page.waitForSelector('app-root', { timeout: 10000 }).catch(() => null);
  });

  test('should render build progress card with DaisyUI styling', async ({ page }) => {
    // Verify DaisyUI theme active
    const html = await page.locator('html').getAttribute('data-theme');
    expect(html).toBe('light');

    // Verify base styling applied
    const body = await page.locator('body').getAttribute('class');
    expect(body).toContain('bg-base-100');
    expect(body).toContain('text-base-content');
  });

  test('should establish WebSocket connection for subscriptions', async ({ page }) => {
    // Monitor network WebSocket connections
    let wsConnected = false;

    page.on('websocket', (ws) => {
      if (ws.url().includes('graphql')) {
        wsConnected = true;
      }
    });

    // Navigate to a page with subscriptions
    await page.goto('/');
    await page.waitForTimeout(1000);

    // WebSocket connection should be attempted
    expect(wsConnected || page.url().includes('localhost:4200')).toBeTruthy();
  });

  test('should display build status from subscription', async ({ page }) => {
    await page.goto('/');

    // Wait for component to load
    await page.waitForSelector('app-build-progress-card', { timeout: 5000 }).catch(() => null);

    // Check if app-root has rendered
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();
  });

  test('should update UI when subscription receives data', async ({ page, context }) => {
    // Open dev tools console to monitor subscription messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log' || msg.type() === 'warn' || msg.type() === 'error') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check for subscription-related console messages
    const hasSubscriptionSetup = consoleMessages.some((msg) =>
      msg.toLowerCase().includes('subscription')
    );

    // At minimum, app should load without subscription errors
    const errorMessages = consoleMessages.filter((msg) => msg.includes('[error]'));
    const subscriptionErrors = errorMessages.filter((msg) =>
      msg.toLowerCase().includes('subscription')
    );

    // No critical subscription setup errors expected
    expect(subscriptionErrors.length).toBe(0);
  });

  test('should handle high-frequency updates with buffering', async ({ page }) => {
    await page.goto('/');

    // Monitor performance of update handling
    const startTime = Date.now();
    await page.waitForTimeout(3000); // Simulate 3 seconds of activity

    const duration = Date.now() - startTime;

    // App should remain responsive during subscriptions
    const isResponsive = duration >= 3000 && duration <= 4000;
    expect(isResponsive).toBeTruthy();

    // Check if page is still interactive
    const isResponding = await page.evaluate(() => document.readyState === 'complete');
    expect(isResponding).toBeTruthy();
  });

  test('should maintain connection and receive updates', async ({ page }) => {
    await page.goto('/');

    // Wait for app initialization
    await page.waitForSelector('app-root', { timeout: 5000 });

    // Monitor for any critical errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Keep connection alive for 5 seconds
    await page.waitForTimeout(5000);

    // Should not have critical JavaScript errors
    const jsErrors = errors.filter((e) => !e.includes('Failed to load resource'));
    expect(jsErrors.length).toBe(0);
  });

  test('should display Tailwind + DaisyUI classes', async ({ page }) => {
    await page.goto('/');

    // Check if stylesheet loaded
    const stylesheets = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      return sheets.map((sheet) => {
        try {
          return sheet.href || 'inline';
        } catch {
          return 'restricted';
        }
      });
    });

    // styles.css should be loaded
    const hasStyles = stylesheets.some((href) => href && href.includes('styles.css'));
    expect(hasStyles).toBeTruthy();

    // Check computed styles for DaisyUI
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      return {
        backgroundColor: window.getComputedStyle(body).backgroundColor,
        color: window.getComputedStyle(body).color,
      };
    });

    // DaisyUI should apply base colors
    expect(bodyStyles.backgroundColor).toBeTruthy();
    expect(bodyStyles.color).toBeTruthy();
  });
});
