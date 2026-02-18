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

    // Inject script to inspect entity data via the component
    const entityData = await page.evaluate(() => {
      const comp = document.querySelector('sz-entity-detail-grpc') as any;
      if (!comp) return { error: 'component not found' };

      // Try to access the Angular component instance
      const ngComp = (window as any).ng?.getComponent(comp);
      if (!ngComp) return { error: 'ng component not found' };

      const result: any = {};
      // Check for entity/resume data
      if (ngComp.entity) {
        result.entity = {
          ENTITY_ID: ngComp.entity.ENTITY_ID,
          ENTITY_NAME: ngComp.entity.ENTITY_NAME,
          FEATURES_keys: ngComp.entity.FEATURES ? Object.keys(ngComp.entity.FEATURES) : 'no FEATURES',
          FEATURES_sample: ngComp.entity.FEATURES ? JSON.stringify(ngComp.entity.FEATURES).substring(0, 2000) : 'none',
          RECORDS_count: ngComp.entity.RECORDS ? ngComp.entity.RECORDS.length : 0,
        };
        if (ngComp.entity.RECORDS && ngComp.entity.RECORDS.length > 0) {
          result.records = ngComp.entity.RECORDS.map((rec: any) => ({
            RECORD_ID: rec.RECORD_ID,
            DATA_SOURCE: rec.DATA_SOURCE,
            FEATURES_keys: rec.FEATURES ? Object.keys(rec.FEATURES) : 'no FEATURES',
            FEATURES: rec.FEATURES ? JSON.stringify(rec.FEATURES).substring(0, 1000) : 'none',
            JSON_DATA: rec.JSON_DATA ? JSON.stringify(rec.JSON_DATA).substring(0, 500) : 'no JSON_DATA',
            ORIGINAL_SOURCE_DATA: rec.ORIGINAL_SOURCE_DATA ? JSON.stringify(rec.ORIGINAL_SOURCE_DATA).substring(0, 500) : 'no ORIGINAL_SOURCE_DATA',
            all_keys: Object.keys(rec),
          }));
        }
      }
      if (ngComp.resumeData) {
        result.resumeData = {
          ENTITY_ID: ngComp.resumeData.ENTITY_ID,
          ENTITY_NAME: ngComp.resumeData.ENTITY_NAME,
          FEATURES_keys: ngComp.resumeData.FEATURES ? Object.keys(ngComp.resumeData.FEATURES) : 'no FEATURES',
          RECORDS_count: ngComp.resumeData.RECORDS ? ngComp.resumeData.RECORDS.length : 0,
        };
        if (ngComp.resumeData.RECORDS && ngComp.resumeData.RECORDS.length > 0) {
          result.resumeRecords = ngComp.resumeData.RECORDS.map((rec: any) => ({
            RECORD_ID: rec.RECORD_ID,
            DATA_SOURCE: rec.DATA_SOURCE,
            FEATURES_keys: rec.FEATURES ? Object.keys(rec.FEATURES) : 'no FEATURES',
            FEATURES: rec.FEATURES ? JSON.stringify(rec.FEATURES).substring(0, 1000) : 'none',
            all_keys: Object.keys(rec),
          }));
        }
      }
      result.componentKeys = Object.keys(ngComp).filter(k => !k.startsWith('_'));

      // Inspect the header content component's otherData getter
      const headerContent = document.querySelector('sz-entity-detail-header-content-grpc') as any;
      if (headerContent) {
        const ngHeader = (window as any).ng?.getComponent(headerContent);
        if (ngHeader) {
          result.headerOtherData = ngHeader.otherData;
          result.headerShowColumnOne = ngHeader.showColumnOne;
          result.headerColumnOneTotal = ngHeader.columnOneTotal;
        }
      }
      return result;
    });

    console.log('\n=== ENTITY DATA INSPECTION ===');
    console.log(JSON.stringify(entityData, null, 2));
    console.log('=== END ENTITY DATA ===\n');

    // Log all console messages
    console.log('\n=== ALL CONSOLE OUTPUT ===');
    for (const msg of consoleMessages) {
      console.log(msg);
    }
    console.log('=== END CONSOLE OUTPUT ===\n');

    // Log errors
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
