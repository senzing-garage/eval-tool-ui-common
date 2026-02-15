import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Graph Export/Import Position Validation', () => {
  test('should restore node positions after import', async ({ page }) => {
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
    // wait for graph to render
    await page.waitForTimeout(8000);

    // --- Step 1: Read initial D3 node positions ---
    const initialPositions = await page.evaluate(() => {
      const nodes = document.querySelectorAll('sz-relationship-network svg g.sz-graph-node');
      const positions: { entityId: string, x: number, y: number }[] = [];
      nodes.forEach((node: any) => {
        const d = (node as any).__data__;
        if (d) {
          positions.push({ entityId: String(d.entityId), x: d.x ?? 0, y: d.y ?? 0 });
        }
      });
      return positions;
    });

    console.log('\n=== INITIAL POSITIONS ===');
    for (const pos of initialPositions) {
      console.log(`  Entity ${pos.entityId}: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`);
    }
    expect(initialPositions.length).toBeGreaterThan(0);

    // --- Step 2: Click export button and capture download ---
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('sz-entity-detail-graph-filter button').filter({ hasText: 'Export' }).click()
    ]);

    const downloadPath = path.join(__dirname, '..', 'tmp', download.suggestedFilename());
    await download.saveAs(downloadPath);
    const exportJson = JSON.parse(fs.readFileSync(downloadPath, 'utf-8'));

    console.log('\n=== EXPORTED FILE NODE POSITIONS ===');
    for (const node of exportJson.nodes) {
      console.log(`  Entity ${node.entityId} (${node.name}): x=${node.position.x.toFixed(2)}, y=${node.position.y.toFixed(2)}`);
    }

    // Verify exported positions are non-trivial (not all zero)
    const nonZeroPositions = exportJson.nodes.filter(
      (n: any) => Math.abs(n.position.x) > 0.01 || Math.abs(n.position.y) > 0.01
    );
    expect(nonZeroPositions.length).toBeGreaterThan(0);

    // --- Step 3: Scramble positions in the export data to simulate user movement ---
    const scrambledExport = JSON.parse(JSON.stringify(exportJson));
    const offset = 200;
    for (const node of scrambledExport.nodes) {
      node.position.x += offset;
      node.position.y += offset;
    }
    const scrambledPath = path.join(__dirname, '..', 'tmp', 'scrambled-import.json');
    fs.mkdirSync(path.dirname(scrambledPath), { recursive: true });
    fs.writeFileSync(scrambledPath, JSON.stringify(scrambledExport, null, 2));

    console.log('\n=== SCRAMBLED POSITIONS (offset +200) ===');
    for (const node of scrambledExport.nodes) {
      console.log(`  Entity ${node.entityId} (${node.name}): x=${node.position.x.toFixed(2)}, y=${node.position.y.toFixed(2)}`);
    }

    // --- Step 4: Import the scrambled file ---
    const fileInput = page.locator('sz-entity-detail-graph-filter input[type="file"]');
    await fileInput.setInputFiles(scrambledPath);

    // Wait for import to apply
    await page.waitForTimeout(5000);

    // --- Step 5: Read D3 node positions after import ---
    const postImportPositions = await page.evaluate(() => {
      const nodes = document.querySelectorAll('sz-relationship-network svg g.sz-graph-node');
      const positions: { entityId: string, x: number, y: number }[] = [];
      nodes.forEach((node: any) => {
        const d = (node as any).__data__;
        if (d) {
          positions.push({ entityId: String(d.entityId), x: d.x ?? 0, y: d.y ?? 0 });
        }
      });
      return positions;
    });

    console.log('\n=== POST-IMPORT POSITIONS ===');
    for (const pos of postImportPositions) {
      console.log(`  Entity ${pos.entityId}: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`);
    }

    // --- Step 6: Compare positions ---
    const scrambledMap = new Map(
      scrambledExport.nodes.map((n: any) => [String(n.entityId), n.position])
    );

    let matchCount = 0;
    let mismatchCount = 0;
    const tolerance = 1.0; // allow 1px tolerance for floating point

    console.log('\n=== POSITION COMPARISON ===');
    for (const actual of postImportPositions) {
      const expected = scrambledMap.get(actual.entityId) as any;
      if (!expected) {
        console.log(`  Entity ${actual.entityId}: NOT in import data`);
        continue;
      }
      const dx = Math.abs(actual.x - expected.x);
      const dy = Math.abs(actual.y - expected.y);
      const match = dx <= tolerance && dy <= tolerance;
      if (match) {
        matchCount++;
        console.log(`  Entity ${actual.entityId}: MATCH (dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)})`);
      } else {
        mismatchCount++;
        console.log(`  Entity ${actual.entityId}: MISMATCH expected=(${expected.x.toFixed(2)}, ${expected.y.toFixed(2)}) actual=(${actual.x.toFixed(2)}, ${actual.y.toFixed(2)}) delta=(${dx.toFixed(2)}, ${dy.toFixed(2)})`);
      }
    }

    console.log(`\n=== RESULT: ${matchCount} matched, ${mismatchCount} mismatched out of ${postImportPositions.length} nodes ===\n`);

    // Log console errors
    if (consoleErrors.length > 0) {
      console.log('\n=== BROWSER CONSOLE ERRORS ===');
      for (const err of consoleErrors) { console.log(err); }
      console.log('=== END ===\n');
    }

    // The test passes if positions match; this tells us if import is working
    expect(mismatchCount).toBe(0);
  });
});
