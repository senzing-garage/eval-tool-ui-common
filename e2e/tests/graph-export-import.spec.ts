import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const FIXTURE_PATH = path.join(__dirname, '..', 'data', 'graph', 'test-import-positions.json');
const TOLERANCE = 1.0; // 1px tolerance for floating point

/** Selector that matches all entity node types (regular, core, queried) */
const NODE_SELECTOR = 'sz-relationship-network svg g.sz-graph-node, sz-relationship-network svg g.sz-graph-core-node, sz-relationship-network svg g.sz-graph-queried-node';

/** Read D3 node positions from the live graph DOM */
function readNodePositions(page: any) {
  return page.evaluate((selector: string) => {
    const nodes = document.querySelectorAll(selector);
    const positions: { entityId: string, x: number, y: number }[] = [];
    const seen = new Set<string>();
    nodes.forEach((node: any) => {
      const d = (node as any).__data__;
      if (d && !seen.has(String(d.entityId))) {
        seen.add(String(d.entityId));
        positions.push({ entityId: String(d.entityId), x: d.x ?? 0, y: d.y ?? 0 });
      }
    });
    return positions;
  }, NODE_SELECTOR);
}

/** Compare actual node positions against expected, log results, return mismatch count */
function comparePositions(
  actual: { entityId: string, x: number, y: number }[],
  expectedMap: Map<string, { x: number, y: number }>,
  label: string
) {
  let matchCount = 0;
  let mismatchCount = 0;
  let notInImport = 0;

  console.log(`\n=== ${label} ===`);
  for (const node of actual) {
    const expected = expectedMap.get(node.entityId);
    if (!expected) {
      console.log(`  Entity ${node.entityId}: NOT in import data`);
      notInImport++;
      continue;
    }
    const dx = Math.abs(node.x - expected.x);
    const dy = Math.abs(node.y - expected.y);
    const match = dx <= TOLERANCE && dy <= TOLERANCE;
    if (match) {
      matchCount++;
      console.log(`  Entity ${node.entityId}: MATCH (dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)})`);
    } else {
      mismatchCount++;
      console.log(`  Entity ${node.entityId}: MISMATCH expected=(${expected.x.toFixed(2)}, ${expected.y.toFixed(2)}) actual=(${node.x.toFixed(2)}, ${node.y.toFixed(2)}) delta=(${dx.toFixed(2)}, ${dy.toFixed(2)})`);
    }
  }
  console.log(`  Result: ${matchCount} matched, ${mismatchCount} mismatched, ${notInImport} not in import data, out of ${actual.length} nodes\n`);
  return mismatchCount;
}

/** Expand a node by calling expandNode() on the network component via Angular debug API */
async function expandNode(page: any, entityId: number) {
  await page.evaluate((id: number) => {
    const el = document.querySelector('sz-relationship-network');
    const comp = (window as any).ng?.getComponent(el);
    if (comp && comp.expandNode) {
      comp.expandNode(id);
    }
  }, entityId);
}

test.describe('Graph Import Position Validation', () => {
  let importData: any;
  let expectedMap: Map<string, { x: number, y: number }>;

  test.beforeAll(() => {
    importData = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));
    expectedMap = new Map(
      importData.nodes.map((n: any) => [String(n.entityId), { x: n.position.x, y: n.position.y }])
    );
  });

  test('should restore node positions from fixture JSON', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[error] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);

    // --- Step 1: Verify graph rendered with initial nodes ---
    const initialPositions = await readNodePositions(page);
    console.log('\n=== INITIAL POSITIONS (before import) ===');
    for (const pos of initialPositions) {
      console.log(`  Entity ${pos.entityId}: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`);
    }
    expect(initialPositions.length).toBeGreaterThan(0);

    // --- Step 2: Import the fixture JSON ---
    console.log('\n--- Importing fixture JSON ---');
    const fileInput = page.locator('sz-entity-detail-graph-filter input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_PATH);
    await page.waitForTimeout(5000);

    // --- Step 3: Verify initial 4 node positions after import ---
    const postImportPositions = await readNodePositions(page);
    console.log('\n=== POST-IMPORT POSITIONS (4 initial nodes) ===');
    for (const pos of postImportPositions) {
      console.log(`  Entity ${pos.entityId}: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`);
    }
    const mismatch1 = comparePositions(postImportPositions, expectedMap, 'INITIAL IMPORT COMPARISON');
    expect(mismatch1).toBe(0);

    // --- Step 4: Expand entity 144 (Patricia Smith) → brings in 29, 30, 31 ---
    console.log('\n--- Expanding entity 144 (Patricia Smith) ---');
    await expandNode(page, 144);
    await page.waitForTimeout(8000);

    const afterExpand1 = await readNodePositions(page);
    console.log('\n=== AFTER EXPANDING ENTITY 144 ===');
    for (const pos of afterExpand1) {
      console.log(`  Entity ${pos.entityId}: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`);
    }
    const mismatch2 = comparePositions(afterExpand1, expectedMap, 'AFTER EXPAND 144 COMPARISON');
    expect(mismatch2).toBe(0);

    // --- Step 5: Expand entity 29 (Patrick Smith) → brings in 27, 28, 154 ---
    console.log('\n--- Expanding entity 29 (Patrick Smith) ---');
    await expandNode(page, 29);
    await page.waitForTimeout(8000);

    const afterExpand2 = await readNodePositions(page);
    console.log('\n=== AFTER EXPANDING ENTITY 29 ===');
    for (const pos of afterExpand2) {
      console.log(`  Entity ${pos.entityId}: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}`);
    }
    const mismatch3 = comparePositions(afterExpand2, expectedMap, 'FINAL COMPARISON (all 10 nodes)');

    // --- Log errors ---
    if (consoleErrors.length > 0) {
      console.log('\n=== BROWSER CONSOLE ERRORS ===');
      for (const err of consoleErrors) console.log(err);
      console.log('=== END ===\n');
    }

    expect(mismatch3).toBe(0);
  });
});
