import { test, expect } from '@playwright/test';

test.describe('How Example', () => {
  test('should render the how component', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Title should render
    await expect(page.locator('.example-title')).toContainText('how example');

    // The how component should be present
    await expect(page.locator('sz-how-entity-grpc')).toBeVisible();

    // Log any console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('\n=== BROWSER CONSOLE ERRORS ===');
      for (const err of consoleErrors) {
        console.log(err);
      }
      console.log('=== END ===\n');
    }
  });
});
