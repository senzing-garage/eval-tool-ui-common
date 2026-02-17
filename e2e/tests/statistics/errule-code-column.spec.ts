import { test, expect } from '@playwright/test';

test.describe('ERRULE_CODE column in cross-source results', () => {
  test('should display ERRULE_CODE values in the ER Code column for Duplicates', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      consoleMessages.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Ensure CUSTOMERS is selected in the first datasource dropdown
    const fromButton = page.locator('sz-cross-source-select button.dsrc-select.from-dsrc').first();
    const fromLabel = fromButton.locator('label');
    const currentSource = await fromLabel.textContent();
    if (currentSource?.trim() !== 'CUSTOMERS') {
      await fromButton.click();
      await page.locator('.data-source-menu button.mat-mdc-menu-item').filter({ hasText: 'CUSTOMERS' }).click();
      await page.waitForTimeout(3000);
    }

    // Click the Duplicates venn diagram button
    const duplicatesButton = page.locator('.data-venn-matches .count-button.left');
    await expect(duplicatesButton).toBeVisible();
    await duplicatesButton.click();

    // Wait for the table to populate
    const resultsTable = page.locator('sz-cross-source-results');
    await expect(resultsTable).toBeVisible();
    await page.waitForTimeout(5000);

    // Verify the table has rows
    const tbodyCount = await resultsTable.locator('tbody').count();
    console.log(`Duplicates tbody count: ${tbodyCount}`);
    expect(tbodyCount).toBeGreaterThan(0);

    // Check that the ER Code header column exists
    const erCodeHeader = resultsTable.locator('th.sz-dt-ERRULE_CODE-column, th.sz-dt-ERRULE-CODE-column, th[data-field-name="ERRULE_CODE"]');
    const headerCount = await erCodeHeader.count();
    console.log(`ER Code header count: ${headerCount}`);

    // Log all header th elements to see what's there
    const allHeaders = resultsTable.locator('thead th');
    const allHeaderCount = await allHeaders.count();
    console.log(`Total header columns: ${allHeaderCount}`);
    for (let i = 0; i < allHeaderCount; i++) {
      const th = allHeaders.nth(i);
      const classes = await th.getAttribute('class');
      const fieldName = await th.getAttribute('data-field-name');
      const text = await th.textContent();
      console.log(`  Header ${i}: text="${text?.trim()}" class="${classes}" data-field-name="${fieldName}"`);
    }

    // Find all ERRULE_CODE cells in record rows
    const erruleCells = resultsTable.locator('td.sz-dt-ERRULE_CODE-cell, td.sz-dt-ERRULE-CODE-cell, td[class*="ERRULE"]');
    const erruleCellCount = await erruleCells.count();
    console.log(`ERRULE_CODE cell count: ${erruleCellCount}`);

    // Log the first few record rows to see what data is in each cell
    const firstTbody = resultsTable.locator('tbody').first();
    const firstRowCells = firstTbody.locator('tr.row-record td');
    const cellCount = await firstRowCells.count();
    console.log(`\nFirst record row cell count: ${cellCount}`);
    for (let i = 0; i < cellCount; i++) {
      const td = firstRowCells.nth(i);
      const classes = await td.getAttribute('class');
      const innerHTML = await td.locator('.cell-content').innerHTML().catch(() => '(no .cell-content)');
      console.log(`  Cell ${i}: class="${classes}" content="${innerHTML}"`);
    }

    // Look for cells with ERRULE-CODE in class name and check if they have content
    const erCells = resultsTable.locator('td[class*="ERRULE"]');
    const erCellCount = await erCells.count();
    console.log(`\nCells with ERRULE in class: ${erCellCount}`);

    let cellsWithData = 0;
    let cellsEmpty = 0;
    for (let i = 0; i < Math.min(erCellCount, 10); i++) {
      const cell = erCells.nth(i);
      const content = await cell.locator('.cell-content').innerHTML().catch(() => '');
      const textContent = await cell.locator('.cell-content').textContent().catch(() => '');
      console.log(`  ERRULE cell ${i}: innerHTML="${content}" text="${textContent?.trim()}"`);
      if (textContent?.trim()) {
        cellsWithData++;
      } else {
        cellsEmpty++;
      }
    }

    console.log(`\nERRULE_CODE cells with data: ${cellsWithData}, empty: ${cellsEmpty}`);

    // The actual assertion: at least some ERRULE_CODE cells should have data
    expect(cellsWithData).toBeGreaterThan(0);

    // Log console output for debugging
    if (consoleMessages.length > 0) {
      console.log('\n=== BROWSER CONSOLE OUTPUT (last 20) ===');
      for (const msg of consoleMessages.slice(-20)) {
        console.log(msg);
      }
      console.log('=== END ===\n');
    }
  });
});
