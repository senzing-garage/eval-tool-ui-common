import { test, expect } from '@playwright/test';

test.describe('Statistics Venn Diagram Switching', () => {
  test('should switch between disclosed relations and duplicates', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[error] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Ensure CUSTOMERS is selected in the first (from) datasource dropdown
    const fromButton = page.locator('sz-cross-source-select button.dsrc-select.from-dsrc').first();
    const fromLabel = fromButton.locator('label');
    const currentSource = await fromLabel.textContent();
    if (currentSource?.trim() !== 'CUSTOMERS') {
      // Open the dropdown menu and select CUSTOMERS
      await fromButton.click();
      await page.locator('.data-source-menu button.mat-mdc-menu-item').filter({ hasText: 'CUSTOMERS' }).click();
      await page.waitForTimeout(3000);
    }

    // Clear errors before interactions
    consoleErrors.length = 0;

    // --- Click the Disclosed Relationships venn diagram button (last venn) ---
    const disclosedButton = page.locator('.data-venn-disclosed .count-button.left');
    await expect(disclosedButton).toBeVisible();
    await disclosedButton.click();

    // Wait for the table to populate
    const resultsTable = page.locator('sz-cross-source-results');
    await expect(resultsTable).toBeVisible();
    await page.waitForTimeout(5000);

    // Verify 12 tbody tags in the results table
    const disclosedTbodyCount = await resultsTable.locator('tbody').count();
    console.log(`Disclosed Relations tbody count: ${disclosedTbodyCount}`);
    expect(disclosedTbodyCount).toBe(12);

    // Log any errors from disclosed click
    if (consoleErrors.length > 0) {
      console.log('\n=== ERRORS AFTER DISCLOSED CLICK ===');
      for (const err of consoleErrors) { console.log(err); }
      console.log('=== END ===\n');
    }
    expect(consoleErrors).toHaveLength(0);

    // Clear errors before next interaction
    consoleErrors.length = 0;

    // --- Click the Duplicates venn diagram button (first venn) ---
    const duplicatesButton = page.locator('.data-venn-matches .count-button.left');
    await expect(duplicatesButton).toBeVisible();
    await duplicatesButton.click();

    // Wait for the table to repopulate
    await page.waitForTimeout(5000);

    // Verify 36 tbody tags in the results table
    const matchesTbodyCount = await resultsTable.locator('tbody').count();
    console.log(`Duplicates tbody count: ${matchesTbodyCount}`);
    expect(matchesTbodyCount).toBe(36);

    // Log any errors from duplicates click
    if (consoleErrors.length > 0) {
      console.log('\n=== ERRORS AFTER DUPLICATES CLICK ===');
      for (const err of consoleErrors) { console.log(err); }
      console.log('=== END ===\n');
    }
    expect(consoleErrors).toHaveLength(0);
  });
});
