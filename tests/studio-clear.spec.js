// @ts-check
const { test, expect } = require('@playwright/test');
const { unlockSite, goToStudio, placeTestImage, countLayersOnSide, clearStudioStorage } = require('./helpers');

/**
 * Studio Clear — tests for "Clear this side" and "Start Over" functionality.
 *
 * "Clear this side" calls clearCurrentDesign() — removes all layers on the
 * current view side and clears localStorage if no designs remain.
 *
 * "Start Over" calls historyStartOver() — removes ALL layers on both sides,
 * resets sLayers, clears localStorage, and resets layer counters.
 */

test.describe('Studio Clear', () => {
  test.beforeEach(async ({ page }) => {
    await unlockSite(page);
    await clearStudioStorage(page);
    await goToStudio(page);
  });

  test('"Clear this side" removes the design on the current view', async ({ page }) => {
    // Place a design on front
    await placeTestImage(page);
    expect(await countLayersOnSide(page, 'front')).toBe(1);

    // Click "Clear this side" button (it calls clearCurrentDesign())
    // We use evaluate since the button is positioned absolutely and may be tricky to click
    await page.evaluate(() => clearCurrentDesign());

    // Verify design is removed
    expect(await countLayersOnSide(page, 'front')).toBe(0);

    // Verify hasDesign is false
    const hasDesign = await page.evaluate(() => sState.hasDesign);
    expect(hasDesign).toBe(false);
  });

  test('"Clear this side" — design does NOT come back after refresh', async ({ page }) => {
    // Place a design, then clear it
    await placeTestImage(page);
    await page.evaluate(() => clearCurrentDesign());

    // Verify localStorage is cleared
    const sessionBefore = await page.evaluate(() => localStorage.getItem('hunto_studio_session'));
    expect(sessionBefore).toBeNull();

    // Reload
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Wait for JS to initialize
    await page.waitForFunction(() => typeof sLayers !== 'undefined', { timeout: 10_000 });

    // Try restoring — should find nothing
    await page.evaluate(() => {
      if (typeof restoreStudioSession === 'function') restoreStudioSession();
    });

    // Small wait for any async restore
    await page.waitForTimeout(1_000);

    // No layers should exist
    const layerCount = await page.locator('[data-type="image"]').count();
    expect(layerCount).toBe(0);
  });

  test('"Start Over" clears all designs on both sides', async ({ page }) => {
    // Place design on front
    await placeTestImage(page);
    expect(await countLayersOnSide(page, 'front')).toBe(1);

    // Switch to back and place a design there too
    await page.evaluate(() => sSetView('back'));
    await page.waitForFunction(() => sView === 'back', { timeout: 3_000 });
    await placeTestImage(page);
    expect(await countLayersOnSide(page, 'back')).toBe(1);

    // "Start Over" calls historyStartOver() which shows a confirm() dialog.
    // We handle the dialog by accepting it.
    page.on('dialog', (dialog) => dialog.accept());

    await page.evaluate(() => historyStartOver());

    // All layers on both sides should be gone
    expect(await countLayersOnSide(page, 'front')).toBe(0);
    expect(await countLayersOnSide(page, 'back')).toBe(0);

    // sLayers should be empty
    const layers = await page.evaluate(() => ({
      front: sLayers.front.length,
      back: sLayers.back.length,
    }));
    expect(layers.front).toBe(0);
    expect(layers.back).toBe(0);

    // hasDesign should be false
    const hasDesign = await page.evaluate(() => sState.hasDesign);
    expect(hasDesign).toBe(false);

    // localStorage should be cleared
    const session = await page.evaluate(() => localStorage.getItem('hunto_studio_session'));
    expect(session).toBeNull();
    const draft = await page.evaluate(() => localStorage.getItem('hunto_draft'));
    expect(draft).toBeNull();
  });

  test('"Start Over" — nothing restores after refresh', async ({ page }) => {
    // Place designs on both sides
    await placeTestImage(page);
    await page.evaluate(() => sSetView('back'));
    await page.waitForFunction(() => sView === 'back', { timeout: 3_000 });
    await placeTestImage(page);

    // Start Over (handle the confirm dialog)
    page.on('dialog', (dialog) => dialog.accept());
    await page.evaluate(() => historyStartOver());

    // Reload
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof sLayers !== 'undefined', { timeout: 10_000 });

    // Try restoring
    await page.evaluate(() => {
      if (typeof restoreStudioSession === 'function') restoreStudioSession();
    });

    await page.waitForTimeout(1_000);

    // Nothing should have been restored
    const totalLayers = await page.locator('[data-type="image"]').count();
    expect(totalLayers).toBe(0);
  });
});
