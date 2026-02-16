import { test, expect } from '@playwright/test';

/**
 * Graph storage offline tests — requires:
 *   1. gRPC server on port 8261 with truthset loaded
 *   2. eval-tool-app-storage **stopped** (NOT running)
 *   3. Graph example app on port 4300 (`npx ng serve examples/grpc/graph --port 4300`)
 */

test.describe('Graph Storage - offline', () => {
  test('save and bookmarks buttons are hidden when storage server is unreachable', async ({ page }) => {
    await page.goto('/1', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);

    await expect(page.locator('button[aria-label="Save graph"]')).toHaveCount(0);
    await expect(page.locator('button[aria-label="Saved graphs"]')).toHaveCount(0);
  });
});
