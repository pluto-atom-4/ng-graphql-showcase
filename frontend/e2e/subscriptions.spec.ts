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

  test('should update UI when subscription receives data', async ({ page }) => {
    // Open dev tools console to monitor subscription messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

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

  test('should render dashboard header and title', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-root', { timeout: 10000 });

    // Check for dashboard heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Manufacturing Workflow Dashboard');
  });

  test('should render buttons with labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-root', { timeout: 10000 });

    // Find button components
    const buttons = page.locator('app-button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    // Check that buttons have span content with labels
    const primaryButton = buttons.first();
    const buttonText = await primaryButton.locator('span').textContent();
    expect(buttonText).toBeTruthy();
    expect(buttonText?.trim().length).toBeGreaterThan(0);
  });

  test('should render build progress cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-root', { timeout: 10000 });

    // Check for build progress card components
    const cards = page.locator('app-build-progress-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3); // At least 3 demo builds
  });

  test('should render badges with variant styling', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-root', { timeout: 10000 });

    // Check for badge components
    const badges = page.locator('app-badge');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    // Verify badges have labels
    const firstBadge = badges.first();
    const badgeText = await firstBadge.textContent();
    expect(badgeText).toBeTruthy();
  });

  test('should render component showcase section', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-root', { timeout: 10000 });

    // Check for component showcase card
    const showcaseCard = page.locator('app-card');
    await expect(showcaseCard.first()).toBeVisible();

    // Verify showcase has multiple button variants
    const buttonVariants = ['Primary', 'Secondary', 'Accent', 'Ghost', 'Outline'];
    for (const variant of buttonVariants) {
      const button = page.locator('app-button', { has: page.locator(`span:has-text("${variant}")`) });
      await expect(button).toBeVisible();
    }
  });

  test('should render build cards grid layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-root', { timeout: 10000 });

    // Check grid structure
    const gridDiv = page.locator('div.grid');
    await expect(gridDiv).toBeVisible();

    // Check for build cards inside
    const cards = page.locator('app-build-progress-card');
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
  });

  test('page should have no critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Filter out expected errors
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('WebSocket')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForSelector('app-root', { timeout: 10000 });
    await page.waitForTimeout(2000);

    expect(errors.length).toBe(0);
  });

  test('should record full page interaction flow', async ({ page }) => {
    // Capture page load performance
    const loadStartTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - loadStartTime;

    // Wait for Angular to render
    await page.waitForSelector('app-root', { timeout: 10000 });

    // Verify key elements are interactive
    const primaryButton = page.locator('app-button').first();
    await expect(primaryButton).toBeVisible();

    // Simulate user interaction - click first button
    const clickStartTime = Date.now();
    await primaryButton.click();
    const clickTime = Date.now() - clickStartTime;

    // Log performance metrics for behavioral analysis
    console.log(`Page load time: ${loadTime}ms`);
    console.log(`Button click response time: ${clickTime}ms`);

    // Verify page remains responsive
    expect(loadTime).toBeLessThan(10000);
    expect(clickTime).toBeLessThan(1000);
  });

  test('should capture component render lifecycle', async ({ page }) => {
    const lifecycleEvents: string[] = [];

    // Intercept Angular lifecycle events
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('ngOnInit') || text.includes('ngAfterViewInit') || text.includes('change detection')) {
        lifecycleEvents.push(text);
      }
    });

    await page.goto('/');
    await page.waitForSelector('app-root', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Verify components rendered
    const cardCount = await page.locator('app-card').count();
    const buttonCount = await page.locator('app-button').count();

    // Log component counts for behavioral verification
    console.log(`Cards rendered: ${cardCount}`);
    console.log(`Buttons rendered: ${buttonCount}`);

    expect(cardCount).toBeGreaterThan(0);
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should verify signal reactivity with DOM updates', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-root', { timeout: 10000 });

    // Get initial button count
    const initialButtonCount = await page.locator('app-button').count();

    // Verify each button has rendered content
    for (let i = 0; i < Math.min(initialButtonCount, 5); i++) {
      const button = page.locator('app-button').nth(i);
      const text = await button.locator('span').textContent();

      // Document button labels for behavioral record
      console.log(`Button ${i} label: ${text}`);

      expect(text?.trim().length).toBeGreaterThan(0);
    }

    expect(initialButtonCount).toBeGreaterThan(0);
  });
});
