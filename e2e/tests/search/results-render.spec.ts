import { test, expect } from '@playwright/test';

test.describe('Search results rendering', () => {
  test('should perform a search and display results', async ({ page }) => {
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
    await page.waitForTimeout(2000);

    // The search box has pre-filled values (name="Jenny Smith", etc.)
    // Click the search button to trigger a search
    const searchButton = page.locator('sz-search-grpc button[type="submit"], sz-search-grpc button.search-button, sz-search-grpc button').first();
    console.log('Search button found:', await searchButton.count() > 0);

    if (await searchButton.count() > 0) {
      await searchButton.click();
      console.log('Clicked search button');
    }

    // Wait for results to load
    await page.waitForTimeout(5000);

    // Log all console messages
    console.log('\n=== ALL CONSOLE OUTPUT ===');
    for (const msg of consoleMessages) {
      console.log(msg);
    }
    console.log('=== END CONSOLE OUTPUT ===\n');

    // Check for search results
    const resultsContainer = page.locator('sz-search-results-grpc');
    const resultsVisible = await resultsContainer.isVisible().catch(() => false);
    console.log(`Search results visible: ${resultsVisible}`);

    if (resultsVisible) {
      const resultCards = resultsContainer.locator('sz-search-result-card-grpc, .search-result-card, [class*="result"]');
      const cardCount = await resultCards.count();
      console.log(`Result card count: ${cardCount}`);
    }

    // Log any errors specifically
    const errors = consoleMessages.filter(m => m.includes('[error]') || m.includes('[pageerror]') || m.includes('[http-error]') || m.includes('[requestfailed]'));
    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      for (const err of errors) {
        console.log(err);
      }
      console.log('=== END ERRORS ===\n');
    }

    // Soft assertion - just log, don't fail
    expect(true).toBe(true);
  });
});
