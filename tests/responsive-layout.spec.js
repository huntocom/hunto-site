// @ts-check
const { test, expect } = require('@playwright/test');
const { unlockSite } = require('./helpers');

/**
 * Responsive Layout — tests across multiple breakpoints to verify
 * no content is cut off, overlapping, or overflowing.
 *
 * Breakpoints tested:
 *   320px  — iPhone SE
 *   375px  — iPhone 13 mini
 *   414px  — iPhone 13 Pro Max
 *   768px  — iPad portrait
 */

const BREAKPOINTS = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 13 mini', width: 375, height: 812 },
  { name: 'iPhone 13 Pro Max', width: 414, height: 896 },
  { name: 'iPad', width: 768, height: 1024 },
];

for (const bp of BREAKPOINTS) {
  test.describe(`Responsive @ ${bp.width}px (${bp.name})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await unlockSite(page);
    });

    test('home page — no horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(bp.width + 1);
    });

    test('home page — screenshot comparison', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1_000); // Allow animations to settle
      await expect(page).toHaveScreenshot(`home-${bp.width}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('shop page — no horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(() => typeof goShop === 'function', { timeout: 15_000 });
      await page.evaluate(() => goShop(''));
      await page.waitForTimeout(2_000);
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(bp.width + 1);
    });

    test('shop page — screenshot comparison', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(() => typeof goShop === 'function', { timeout: 15_000 });
      await page.evaluate(() => goShop(''));
      await page.waitForTimeout(2_000);
      await expect(page).toHaveScreenshot(`shop-${bp.width}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('studio page — no horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(
        () => typeof PRODUCTS !== 'undefined' && PRODUCTS.length > 0,
        { timeout: 15_000 },
      );
      await page.evaluate(() => openStudio());
      await page.waitForSelector('#page-studio.active, #page-studio[style*="display: block"]', {
        timeout: 10_000,
      });
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(bp.width + 1);
    });

    test('studio page — screenshot comparison', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(
        () => typeof PRODUCTS !== 'undefined' && PRODUCTS.length > 0,
        { timeout: 15_000 },
      );
      await page.evaluate(() => openStudio());
      await page.waitForSelector('#s-shirt', { timeout: 10_000 });
      await page.waitForTimeout(1_000);
      await expect(page).toHaveScreenshot(`studio-${bp.width}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('about page — no horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(() => typeof showAboutPage === 'function', { timeout: 15_000 });
      await page.evaluate(() => showAboutPage());
      await page.waitForTimeout(1_000);
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(bp.width + 1);
    });

    test('about page — screenshot comparison', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(() => typeof showAboutPage === 'function', { timeout: 15_000 });
      await page.evaluate(() => showAboutPage());
      await page.waitForTimeout(1_000);
      await expect(page).toHaveScreenshot(`about-${bp.width}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });

    test('no content cut off — all main sections visible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Check that the hero section content fits
      const heroOverflow = await page.evaluate((vpWidth) => {
        const home = document.getElementById('page-home');
        if (!home) return false;
        return home.scrollWidth > vpWidth + 1;
      }, bp.width);
      expect(heroOverflow).toBe(false);
    });

    test('shop grid adapts columns to viewport', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(() => typeof goShop === 'function', { timeout: 15_000 });
      await page.evaluate(() => goShop(''));
      await page.waitForTimeout(2_000);

      const gridInfo = await page.evaluate(() => {
        const grid = document.getElementById('shop-grid');
        if (!grid) return null;
        const style = getComputedStyle(grid);
        const columns = style.gridTemplateColumns.split(' ').filter(c => c !== '0px').length;
        return { columns, width: grid.offsetWidth };
      });

      expect(gridInfo).not.toBeNull();
      // At 320-414px we expect 1-2 columns; at 768px we expect 2-3 columns
      if (bp.width <= 414) {
        expect(gridInfo.columns).toBeLessThanOrEqual(2);
      } else {
        expect(gridInfo.columns).toBeLessThanOrEqual(3);
      }
    });

    test('trust bar does not overflow on narrow screens', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const trustBar = page.locator('#hp-trust-bar');
      if (await trustBar.isVisible()) {
        const box = await trustBar.boundingBox();
        expect(box).not.toBeNull();
        expect(box.x + box.width).toBeLessThanOrEqual(bp.width + 1);
      }
    });
  });
}
