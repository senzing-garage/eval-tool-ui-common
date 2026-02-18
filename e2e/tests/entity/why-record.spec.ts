import { test, expect } from '@playwright/test';

test.describe('Why Record', () => {
  test('should open why record dialog when clicking Why button on a record card', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Hover over a record card to reveal the Why button
    const recordCard = page.locator('sz-entity-record-card-content-grpc').first();
    await recordCard.hover();
    await page.waitForTimeout(500);

    // Click the Why button
    const whyButton = page.locator('.select-mode-action-why').first();
    await expect(whyButton).toBeVisible();
    await whyButton.click();
    await page.waitForTimeout(3000);

    // Verify the dialog opened
    const dialog = page.locator('.cdk-overlay-container mat-dialog-container');
    await expect(dialog).toBeVisible();

    // Verify the why record component rendered inside the dialog
    const whyRecordComponent = dialog.locator('sz-why-record-grpc');
    await expect(whyRecordComponent).toBeVisible();

    // Verify no errors occurred
    const injectorErrors = errors.filter(e => e.includes('NullInjectorError'));
    expect(injectorErrors).toHaveLength(0);
    expect(errors.filter(e => e.includes('ERROR'))).toHaveLength(0);
  });
});
