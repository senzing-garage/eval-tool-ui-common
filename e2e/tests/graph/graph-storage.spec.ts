import { test, expect } from '@playwright/test';

/**
 * Graph storage tests — requires:
 *   1. gRPC server on port 8261 with truthset loaded
 *   2. eval-tool-app-storage running on port 3000
 *   3. Graph example app on port 4300 (`npx ng serve examples/grpc/graph --port 4300`)
 */

let savedGraphName: string;

test.describe.serial('Graph Storage - save/load/delete', () => {
  test('save and bookmarks buttons are visible', async ({ page }) => {
    await page.goto('/1', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);

    await expect(page.locator('button[aria-label="Save graph"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Saved graphs"]')).toBeVisible();
  });

  test('can save a graph', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/1', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);

    savedGraphName = `Test Graph ${Date.now()}`;

    await page.locator('button[aria-label="Save graph"]').click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[placeholder="My graph snapshot"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(savedGraphName);

    await page.locator('button.ok').click();
    await page.waitForTimeout(1000);

    // Verify dialog closed
    await expect(nameInput).not.toBeVisible({ timeout: 5000 });

    // Verify console confirms save
    const saveLog = consoleLogs.find((msg) => msg.includes('Graph saved with id:'));
    expect(saveLog).toBeTruthy();
  });

  test('saved graph appears in bookmarks menu', async ({ page }) => {
    await page.goto('/1', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);

    await page.locator('button[aria-label="Saved graphs"]').click();
    await page.waitForTimeout(500);

    const item = page.locator('.saved-graph-item', { hasText: savedGraphName });
    await expect(item).toBeVisible({ timeout: 5000 });
  });

  test('can load a saved graph', async ({ page }) => {
    await page.goto('/1', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);

    await page.locator('button[aria-label="Saved graphs"]').click();
    await page.waitForTimeout(500);

    await page.locator('.saved-graph-item', { hasText: savedGraphName }).click();
    await page.waitForTimeout(3000);

    // Graph component should still be visible after load
    await expect(page.locator('sz-standalone-graph')).toBeVisible();
  });

  test('can delete a saved graph', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/1', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);

    // Open bookmarks and delete the saved graph
    await page.locator('button[aria-label="Saved graphs"]').click();
    await page.waitForTimeout(500);

    const item = page.locator('.saved-graph-item', { hasText: savedGraphName });
    await expect(item).toBeVisible({ timeout: 5000 });
    await item.locator('.saved-graph-delete').click();
    await page.waitForTimeout(1000);

    // Verify console confirms deletion
    const deleteLog = consoleLogs.find((msg) => msg.includes('Graph deleted:'));
    expect(deleteLog).toBeTruthy();

    // Dismiss the menu overlay before re-opening
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Re-open bookmarks and verify our item is gone
    await page.locator('button[aria-label="Saved graphs"]').click();
    await page.waitForTimeout(500);

    const deletedItem = page.locator('.saved-graph-item', { hasText: savedGraphName });
    await expect(deletedItem).toHaveCount(0);
  });
});
