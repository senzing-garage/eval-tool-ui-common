import { test, expect } from '@playwright/test';

test.describe('Entity detail debug', () => {
  test('should load entity detail and capture console output', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      consoleMessages.push(`[pageerror] ${err.message}`);
    });
    page.on('requestfailed', (request) => {
      consoleMessages.push(`[requestfailed] ${request.url()} ${request.failure()?.errorText}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        consoleMessages.push(`[http-error] ${response.status()} ${response.url()}`);
      }
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Log all console messages
    console.log('\n=== ALL CONSOLE OUTPUT ===');
    for (const msg of consoleMessages) {
      console.log(msg);
    }
    console.log('=== END CONSOLE OUTPUT ===\n');

    // Check if entity detail component is visible
    const entityDetail = page.locator('sz-entity-detail-grpc');
    const visible = await entityDetail.isVisible().catch(() => false);
    console.log(`Entity detail visible: ${visible}`);

    // Log any errors
    const errors = consoleMessages.filter(m =>
      m.includes('[error]') || m.includes('[pageerror]') || m.includes('[http-error]') || m.includes('[requestfailed]')
    );
    if (errors.length > 0) {
      console.log(`\n=== ERRORS (${errors.length}) ===`);
      for (const err of errors) {
        console.log(err);
      }
      console.log('=== END ERRORS ===\n');
    } else {
      console.log('\nNo errors detected.');
    }

    expect(true).toBe(true);
  });
});
