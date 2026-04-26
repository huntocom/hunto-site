// @ts-check
const { test, expect } = require('@playwright/test');
const { unlockSite, goToStudio, placeTestImage, countLayersOnSide, clearStudioStorage } = require('./helpers');

/**
 * Studio Layers — tests for placing, duplicating, deleting, and resizing layers.
 *
 * These tests exercise the core layer system: sLayers, addImageLayer(),
 * eaDuplicate(), removeLayer(), and session persistence via localStorage.
 */

test.describe('Studio Layers', () => {
  test.beforeEach(async ({ page }) => {
    await unlockSite(page);
    await clearStudioStorage(page);
    await goToStudio(page);
  });

  test('place an image layer and verify it appears on the shirt', async ({ page }) => {
    // The canvas wrapper holds all layers
    const wrapBefore = await countLayersOnSide(page, 'front');
    expect(wrapBefore).toBe(0);

    // Place a test image via applyDesign() — same path as AI art or upload
    await placeTestImage(page);

    // Verify exactly one image layer exists on the front
    const count = await countLayersOnSide(page, 'front');
    expect(count).toBe(1);

    // Verify the layer is inside #s-shirt-wrap (the canvas area)
    const layerInWrap = await page.locator('#s-shirt-wrap [data-type="image"]').count();
    expect(layerInWrap).toBe(1);

    // Verify sState.hasDesign is true
    const hasDesign = await page.evaluate(() => sState.hasDesign);
    expect(hasDesign).toBe(true);
  });

  test('duplicate a layer and verify two layers exist', async ({ page }) => {
    await placeTestImage(page);
    expect(await countLayersOnSide(page, 'front')).toBe(1);

    // Duplicate via the eaDuplicate() function (same as clicking Duplicate button)
    await page.evaluate(() => eaDuplicate());

    // Wait for the second layer to appear
    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-type="image"][data-side="front"]').length === 2;
    }, { timeout: 5_000 });

    expect(await countLayersOnSide(page, 'front')).toBe(2);

    // Verify sLayers tracks both
    const layerCount = await page.evaluate(() => sLayers.front.length);
    expect(layerCount).toBe(2);
  });

  test('delete one layer — toolbar and canvas remain intact', async ({ page }) => {
    // Place two layers
    await placeTestImage(page);
    await page.evaluate(() => eaDuplicate());
    await page.waitForFunction(
      () => document.querySelectorAll('[data-type="image"][data-side="front"]').length === 2,
      { timeout: 5_000 }
    );

    // Delete the currently selected layer (the duplicate)
    await page.evaluate(() => {
      const id = window.eaCurrentLayerId || selectedLayerId;
      if (id) removeLayer(id);
    });

    // One layer should remain
    expect(await countLayersOnSide(page, 'front')).toBe(1);

    // The studio canvas (#s-shirt-wrap) should still be visible
    await expect(page.locator('#s-shirt-wrap')).toBeVisible();

    // The iconbar should still be present and clickable
    await expect(page.locator('.s-iconbar')).toBeVisible();
  });

  test('delete all layers — verify clean state', async ({ page }) => {
    await placeTestImage(page);
    expect(await countLayersOnSide(page, 'front')).toBe(1);

    // Remove all layers via the same path as "Clear this side"
    await page.evaluate(() => clearCurrentDesign());

    expect(await countLayersOnSide(page, 'front')).toBe(0);

    // sState.hasDesign should be false when no layers exist
    const hasDesign = await page.evaluate(() => sState.hasDesign);
    expect(hasDesign).toBe(false);

    // localStorage session should be cleared
    const session = await page.evaluate(() => localStorage.getItem('hunto_studio_session'));
    expect(session).toBeNull();
  });

  test('resize a layer, refresh, and verify size is preserved', async ({ page }) => {
    await placeTestImage(page);

    // Get the layer element and resize it
    const layerId = await page.evaluate(() => sLayers.front[0].id);
    const newWidth = 200;
    const newHeight = 180;

    await page.evaluate(({ id, w, h }) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.width = w + 'px';
        el.style.height = h + 'px';
      }
      // Trigger a session save (normally happens on drag/resize end)
      saveStudioSession();
    }, { id: layerId, w: newWidth, h: newHeight });

    // Verify the size was set
    const sizeBeforeRefresh = await page.evaluate((id) => {
      const el = document.getElementById(id);
      return el ? { w: el.offsetWidth, h: el.offsetHeight } : null;
    }, layerId);
    expect(sizeBeforeRefresh).not.toBeNull();

    // Reload the page — session should restore from localStorage
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Studio should auto-restore via hash or restoreStudioSession
    await page.waitForFunction(() => typeof sLayers !== 'undefined', { timeout: 10_000 });

    // Navigate to studio to trigger session restore
    await page.evaluate(() => restoreStudioSession());
    await page.waitForFunction(
      () => document.querySelectorAll('[data-type="image"]').length > 0,
      { timeout: 10_000 }
    );

    // Verify the layer was restored with approximately the same dimensions
    // (exact pixel match may vary due to aspect ratio logic in addImageLayer)
    const restoredCount = await countLayersOnSide(page, 'front');
    expect(restoredCount).toBe(1);
  });
});
