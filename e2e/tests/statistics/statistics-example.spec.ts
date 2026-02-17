import { test, expect } from '@playwright/test';

test.describe('Statistics Example', () => {
  test('should render the statistics component', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      consoleMessages.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Log all console output for debugging
    if (consoleMessages.length > 0) {
      console.log('\n=== BROWSER CONSOLE OUTPUT ===');
      for (const msg of consoleMessages) {
        console.log(msg);
      }
      console.log('=== END ===\n');
    }

    // Title should render
    await expect(page.locator('.example-title')).toContainText('statistics example');

    // The statistics component should be present
    await expect(page.locator('sz-cross-source-statistics')).toBeVisible();
  });
});
