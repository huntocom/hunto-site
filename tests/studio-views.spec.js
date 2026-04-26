// @ts-check
const { test, expect } = require('@playwright/test');
const { unlockSite, goToStudio, placeTestImage, countLayersOnSide, countVisibleLayers, clearStudioStorage } = require('./helpers');

/**
 * Studio Views — tests for front/back view switching.
 *
 * The studio uses sSetView('front'|'back') to toggle views.
 * Layers are tagged with data-side="front"|"back" and shown/hidden
 * via display:block/none when switching views.
 * Print area guides (#print-area-front, #print-area-back) also toggle.
 */

test.describe('Studio Views', () => {
  test.beforeEach(async ({ page }) => {
    await unlockSite(page);
    await clearStudioStorage(page);
    await goToStudio(page);
  });

  test('switch to back view — front layers are hidden', async ({ page }) => {
    // Place a layer on the front
    await placeTestImage(page);
    expect(await countLayersOnSide(page, 'front')).toBe(1);
    expect(await countVisibleLayers(page)).toBe(1);

    // Switch to back view via sSetView (same as clicking the Back thumbnail)
    await page.evaluate(() => sSetView('back'));

    // Wait for view switch to complete
    await page.waitForFunction(() => sView === 'back', { timeout: 3_000 });

    // Front layer should be hidden (display:none)
    const frontLayer = page.locator('[data-type="image"][data-side="front"]');
    await expect(frontLayer).toBeHidden();

    // The back thumbnail should have the "on" class
    await expect(page.locator('#sth-b')).toHaveClass(/on/);
    // The front thumbnail should NOT have "on"
    const sthF = page.locator('#sth-f');
    await expect(sthF).not.toHaveClass(/on/);
  });

  test('switch back to front — front layers reappear', async ({ page }) => {
    await placeTestImage(page);

    // Switch to back, then back to front
    await page.evaluate(() => sSetView('back'));
    await page.waitForFunction(() => sView === 'back', { timeout: 3_000 });

    await page.evaluate(() => sSetView('front'));
    await page.waitForFunction(() => sView === 'front', { timeout: 3_000 });

    // Front layer should be visible again
    const frontLayer = page.locator('[data-type="image"][data-side="front"]');
    await expect(frontLayer).toBeVisible();

    expect(await countVisibleLayers(page)).toBe(1);
  });

  test('add layer on back — hidden when switching to front', async ({ page }) => {
    // Switch to back view first
    await page.evaluate(() => sSetView('back'));
    await page.waitForFunction(() => sView === 'back', { timeout: 3_000 });

    // Place a layer on the back
    await placeTestImage(page);
    expect(await countLayersOnSide(page, 'back')).toBe(1);

    // The back layer should be visible while on back view
    const backLayer = page.locator('[data-type="image"][data-side="back"]');
    await expect(backLayer).toBeVisible();

    // Switch to front
    await page.evaluate(() => sSetView('front'));
    await page.waitForFunction(() => sView === 'front', { timeout: 3_000 });

    // Back layer should now be hidden
    await expect(backLayer).toBeHidden();
  });

  test('print guides show/hide correctly per view', async ({ page }) => {
    // On front view, #print-area-front should be visible, #print-area-back hidden
    const printFront = page.locator('#print-area-front');
    const printBack = page.locator('#print-area-back');

    // Front view (default) — front guides visible, back guides hidden
    await expect(printFront).not.toHaveCSS('display', 'none');
    await expect(printBack).toHaveCSS('display', 'none');

    // Switch to back
    await page.evaluate(() => sSetView('back'));
    await page.waitForFunction(() => sView === 'back', { timeout: 3_000 });

    // Back guides visible, front guides hidden
    await expect(printBack).not.toHaveCSS('display', 'none');
    await expect(printFront).toHaveCSS('display', 'none');

    // Switch back to front
    await page.evaluate(() => sSetView('front'));
    await page.waitForFunction(() => sView === 'front', { timeout: 3_000 });

    // Front guides back, back hidden
    await expect(printFront).not.toHaveCSS('display', 'none');
    await expect(printBack).toHaveCSS('display', 'none');
  });
});
