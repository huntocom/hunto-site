/**
 * Shared test helpers for hunto.com Playwright tests.
 *
 * The site has a password gate (password: "Fart") that must be dismissed
 * before any interaction. These helpers handle that and common navigation.
 */

/**
 * Unlock the password gate. Sets sessionStorage so subsequent navigations
 * within the same context don't trigger the gate again.
 */
async function unlockSite(page) {
  // Set sessionStorage before loading so the gate never appears
  await page.addInitScript(() => {
    sessionStorage.setItem('hunto_unlocked', '1');
  });
}

/**
 * Navigate to the studio with a product loaded.
 * Opens the homepage first, then calls openStudio() via JS.
 */
async function goToStudio(page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Wait for the page to be interactive (PRODUCTS array should exist)
  await page.waitForFunction(() => typeof PRODUCTS !== 'undefined' && PRODUCTS.length > 0, {
    timeout: 15_000,
  });

  // Navigate to studio via JS (same as clicking "Start Designing")
  await page.evaluate(() => openStudio());
  await page.waitForSelector('#page-studio.active, #page-studio[style*="display: block"]', {
    timeout: 10_000,
  });

  // Wait for the shirt image to appear
  await page.waitForSelector('#s-shirt', { timeout: 10_000 });
}

/**
 * Place a test image layer on the current view side.
 * Uses a 1x1 red pixel PNG data URL so no network request is needed.
 */
async function placeTestImage(page) {
  const testImageSrc =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  await page.evaluate((src) => applyDesign(src), testImageSrc);
  // Wait for the layer element to appear on the canvas
  await page.waitForSelector('[data-type="image"]', { timeout: 5_000 });
}

/**
 * Get count of image layers on a given side (front/back).
 */
async function countLayersOnSide(page, side) {
  return page.locator(`[data-type="image"][data-side="${side}"]`).count();
}

/**
 * Get count of all visible image layers (display !== none).
 */
async function countVisibleLayers(page) {
  return page.locator('[data-type="image"]:visible').count();
}

/**
 * Clear localStorage studio data to ensure a clean state.
 */
async function clearStudioStorage(page) {
  await page.evaluate(() => {
    localStorage.removeItem('hunto_studio_session');
    localStorage.removeItem('hunto_draft');
  });
}

module.exports = {
  unlockSite,
  goToStudio,
  placeTestImage,
  countLayersOnSide,
  countVisibleLayers,
  clearStudioStorage,
};
